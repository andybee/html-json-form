import querystring from 'node:querystring'

import parse from './index.mjs';

/**
 * Parses an HTML form body from an AWS API Gateway Lambda Proxy event and
 * returns it in-place as an object.
 *
 * @param {*} event - AWS API Gateway Lambda Proxy event object
 * @returns {*} modified event object with parsed body
 */
export function parseLambdaEvent(event) {
  const { headers, body: rawBody, isBase64Encoded = false } = event

  // ensure the body is not base64 encoded
  const body = isBase64Encoded
    ? Buffer.from(rawBody, 'base64').toString('utf8')
    : rawBody

  // if this is a JSON payload, parse it
  if (headers?.['content-type']?.startsWith('application/json')) {
    return JSON.parse(body)
  }

  // else, if this isn't an HTML form body, return
  if (headers?.['content-type']?.startsWith('application/x-www-form-urlencoded')) {
    return parse(querystring.parse(body))
  }
}

/**
 * Wraps a handler function so that the event is parsed ready for conversion.
 * @param {Function} next - original handler function to wrap
 * @returns {Function} revised handler function wrapped by middleware
 */
export const middleware = (next) => (event, ...args) => next(
  {
    ...event,
    body: parseLambdaEvent(event),
    isBase64Encoded: false,
  },
  ...args
)
