import assert from 'node:assert'
import test from 'node:test'

import { middleware, parseLambdaEvent } from '../../src/lambda.mjs'

const expected = { a: ['1', '2'], b: { foo: 'bar' } }

test('parseLambdaEvent', async (t) => {
  await t.test('form payload', async (t) => {
    const event = {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: 'a[]=1&a[]=2&b[foo]=bar',
    }

    await t.test('unencoded', () => {
      assert.deepEqual(parseLambdaEvent(event), expected)
    })

    await t.test('base64', () => {
      const base64Event = {
        ...event,
        body: Buffer.from(event.body).toString('base64'),
        isBase64Encoded: true,
      }
  
      assert.deepEqual(parseLambdaEvent(base64Event), expected)
    })
  })

  await t.test('json payload', async (t) => {
    const event = {
      headers: {
        'content-type': 'application/json',
      },
      body: '{"a":["1", "2"],"b":{"foo":"bar"}}',
    }

    await t.test('unencoded', () => {
      assert.deepEqual(parseLambdaEvent(event), expected)
    })

    await t.test('base64', () => {
      const base64Event = {
        ...event,
        body: Buffer.from(event.body).toString('base64'),
        isBase64Encoded: true,
      }
  
      assert.deepEqual(parseLambdaEvent(base64Event), expected)
    })
  })
})

test('middleware', async (t) => {
  const handler = middleware(async (event) => event.body)

  await t.test('form', async () => {
    const event = {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: 'a[]=1&a[]=2&b[foo]=bar',
    }

    assert.deepEqual(await handler(event), expected)
  })

  await t.test('json', async () => {
    const event = {
      headers: {
        'content-type': 'application/json',
      },
      body: '{"a":["1","2"],"b":{"foo":"bar"}}',
    }

    assert.deepEqual(await handler(event), expected)
  })
})
