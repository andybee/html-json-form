import assert from 'node:assert'
import test from 'node:test'

import parse from '../../src/index.mjs'

test('basic keys', () => {
  const form = {
    name: 'Bender',
    hind: 'Bitable',
    shiny: 'on',
  }
  const obj = {
    name: 'Bender',
    hind: 'Bitable',
    shiny: 'on',
  }

  assert.deepStrictEqual(parse(form), obj)
})

test('multiple values', () => {
  const form = {
    'bottle-on-the-wall': ['1', '2', '3'],
  }
  const obj = { 'bottle-on-the-wall': ['1', '2', '3'] }

  assert.deepStrictEqual(parse(form), obj)
})

test('deeper structure', () => {
  const form = {
    'pet[species]': 'Dahut',
    'pet[name]': 'Hypatia',
    'kids[1]': 'Thelma',
    'kids[0]': 'Ashley',
  }
  const obj = {
    pet: {
      species: 'Dahut',
      name: 'Hypatia',
    },
    kids: ['Ashley', 'Thelma'],
  }

  assert.deepStrictEqual(parse(form), obj)
})

test('sparse arrays', () => {
  const form = {
    'hearbeat[0]': 'thunk',
    'hearbeat[2]': 'thunk',
  }
  const obj = {
    hearbeat: ['thunk', null, 'thunk'],
  }

  assert.deepStrictEqual(parse(form), obj)
})

test('even deeper', () => {
  const form = {
    'pet[0][species]': 'Dahut',
    'pet[0][name]': 'Hypatia',
    'pet[1][species]': 'Felis Stultus',
    'pet[1][name]': 'Billie',
  }
  const obj = {
    pet: [
      { species: 'Dahut', name: 'Hypatia' },
      { species: 'Felis Stultus', name: 'Billie' },
    ],
  }

  assert.deepStrictEqual(parse(form), obj)
})

test('such deep', () => {
  const form = { 'wow[such][deep][3][much][power][!]': 'Amaze' }
  const obj = {
    wow:  {
      such: {
        deep: [
          null,
          null,
          null,
          {
            much: {
              power: {
                '!':  'Amaze',
              },
            },
          },
        ],
      },
    },
  }

  assert.deepStrictEqual(parse(form), obj)
})

test('merge behaviour', () => {
  const form = {
    'mix': 'scalar',
    'mix[0]': 'array 1',
    'mix[2]': 'array 2',
    'mix[key]': 'key key',
    'mix[car]': 'car key',
  }
  const obj = {
    mix: {
      '': 'scalar',
      '0': 'array 1',
      '2': 'array 2',
      'key': 'key key',
      'car': 'car key',
    },
  }

  assert.deepStrictEqual(parse(form), obj)
})

test('append', () => {
  const form = { 'highlander[]': 'one' }
  const obj = { highlander: ['one'] }

  assert.deepStrictEqual(parse(form), obj)
})

test('bad input', () => {
  const form = {
    'error[good]': 'BOOM!',
    'error[bad': 'BOOM BOOM!',
  }
  const obj = {
    error: {
      good: 'BOOM!',
    },
    'error[bad': 'BOOM BOOM!',
  }

  assert.deepStrictEqual(parse(form), obj)
})

test('type casting', () => {
  const form = {
    name: 'Bender',
    hind: 'Bitable',
    shiny: 'on',
    '_type[shiny]': 'boolean',
  }
  const obj = {
    name: 'Bender',
    hind: 'Bitable',
    shiny: true,
  }

  assert.deepStrictEqual(parse(form), obj)
})

test('multiple type casting', () => {
  const form = {
    'bottle-on-the-wall': ['1', '2', '3'],
    '_type[bottle-on-the-wall]': 'number',
  }
  const obj = { 'bottle-on-the-wall': [1, 2, 3] }

  assert.deepStrictEqual(parse(form), obj)
})

test('nested type casting', () => {
  const form = {
    'foo[bar][baz]': '1.3',
    '_type[foo][bar][baz]': 'number',
  }
  const obj = {
    foo: {
      bar: {
        baz: 1.3,
      },
    },
  }

  assert.deepStrictEqual(parse(form), obj)
})

test('invalid value', () => {
  assert.throws(() => parse('foo'))
})
