/**
 * Tests if a value is a JavaScript primitive (string, number, boolean)
 *
 * @param {*} value
 * @returns {boolean}
 */
const isPrimitive = (value) => typeof value !== 'object';

/**
 * Tests if a value is an Object literal.
 *
 * @param {*} value 
 * @returns {boolean}
 */
const isObject = (value) => Object.prototype.toString.call(value) === '[object Object]';

// pattern for parsing encoded keys
const pattern = /\[(.*?)]/g;

/**
 * Given an array, the function is called with each value in the array. If a
 * non-array is supplied, the function is called once with that value. This
 * helps simplify code which expects either a value or an array of values and
 * needs to manipulate the values in some way irrespective.
 *
 * @param {*} value
 * @param {Function} fn - function to be called per value
 * @returns {*|*[]}
 */
const handleArray = (value, fn) => Array.isArray(value)
  ? value.map(fn)
  : fn(value);

/**
 * Takes a types object and a target object. For each property in the types
 * object, the value defines a type that the value of the same property name in
 * the target object should be cast to.
 * 
 * For each additional layer inside the object, this function internally
 * iterates.
 *
 * @param {*} types - defines which properties to cast to what type
 * @param {*} obj - the object to be manipulated
 */
function convertDefinedTypes(types, obj) {
  Object.entries(types).forEach(([key, value]) => {
    if (typeof value === 'object') {
      convertDefinedTypes(value, obj[key]);
      return;
    }
    switch (value) {
      case 'boolean':
        obj[key] = handleArray(obj[key], (v) => v !== undefined && v !== null);
        break;
      case 'number':
        obj[key] = handleArray(obj[key], (v) => Number.parseInt(v, 10) == v
          ? Number.parseInt(v, 10)
          : Number.parseFloat(v));
        break;
      default:
        throw TypeError(`unrecognised type "${value}" for key "${key}"`);
    }
  });
}

/**
 * Iterates the root level of a supplied object, converting array-like objects
 * to proper arrays and filling gaps with null. Internally this function is
 * called iteratively for each depth level.
 *
 * @param {*} obj - initial object state from the transform logic
 * @returns {*} final object state
 */
function refine(obj) {
  // objects with only properties of numeric type should be arrays
  const isArray = Object.keys(obj).every((key) => Number.parseInt(key, 10) == key);
  // handle any required type casting
  if (obj._type !== undefined) {
    convertDefinedTypes(obj._type, obj);
    delete obj._type;
  }
  // iterate the object and make necessary changes based on first pass state
  const state = Object.entries(obj).reduce(
    (accumulator, [key, value]) => {
      // iterate the next level deep if value is not a primitive
      if (isArray) {
        accumulator[Number.parseInt(key, 10)] = !isPrimitive(value) ? refine(value) : value;
      } else {
        accumulator[key] = !isPrimitive(value) ? refine(value) : value;
      }
      return accumulator;
    },
    isArray ? [] : {},
  );
  // backfill empty values in arrays with null
  if (isArray) {
    [...Array(state.length).keys()].forEach((key) => state[key] = (state[key] === undefined ? null : state[key]));
  }
  // return final state
  return state;
};

/**
 * Transforms a standard web form to an object using the field names to
 * influence the object's structure.
 *
 * @param {*} body - AWS API Gateway payload format body containing a form
 * @returns {*} resultant object literal in the defined format
 **/
export default function parse(params) {
  // ensure params is an object suitable for parsing
  if (!isObject(params)) {
    throw new TypeError(`invalid payload`)
  }
  // perform a rough parse before passing the value for refinement
  return refine(Object.entries(params).reduce((obj, [path, value]) => {
    // if the path contains no nested params, set and return
    if (path.match(pattern) === null) {
      obj[path] = value;
      return obj;
    }
  
    // find the top level property name
    const [property] = path.split('[', 1);
  
    // if this level does not currently exist, create it
    if (obj[property] === undefined) {
      obj[property] = {};
    }
  
    // iterate all nesting path component
    let match;
    let previous = obj;
    let previousIndex = property;
    while (match = pattern.exec(path)) {
      let current = previous[previousIndex];
  
      let [, index] = match;
  
      // empty index means append, so give it a faux index
      if (index === '') {
        index = Object.keys(current).length;
      }
  
      // if we are trying to write to an existing primitive, we need to convert it to an object
      if (isPrimitive(current)) {
        previous[previousIndex] = { '': current };
        current = previous[previousIndex];
      }
  
      // work out if we are at the end of this path and add the value, else a placeholder object
      const isLast = match.index + match[0].length === match.input.length;
      if (Array.isArray(value) && isLast) {
        previous[previousIndex] = value.reduce((accumulator, v) => ({ ...accumulator, [Object.keys(accumulator).length]: v }), current);
      } else if (current[index] === undefined) {
        current[index] = !isLast ? {} : value;
      }
  
      // update references for next step
      previous = current;
      previousIndex = index;
    }
  
    return obj;
  }, {}))
}

export { parseLambdaEvent, middleware } from './lambda.mjs';
