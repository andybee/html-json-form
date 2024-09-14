## html-json-form
> Server side library for harmonising JSON and HTML form submissions

Parses client-side HTML form submissions, with object structure marked up in
field names, to structured objects on the server to harmonise handling both
HTML forms and JSON on a single endpoint.

Given the following form:

```html
<input type="text" name="a[]" value="foo">
<input type="text" name="a[]" value="bar">
<input type="text" name="b[baz]" value="woo">
```

The resulting object would be:

```js
{
  a: ['foo', 'bar'],
  b: {
    baz: 'woo'
  }
}
```

## Introduction

It can be desirable to have an HTTP endpoint which can handle either both a JSON
payload and an HTML form submission, to allow for a programmatic API and web-
based interactions.

This may typically involve creating logic that handles each separately,
considering HTML forms off a flat key-value approach, versus the potentially
complex structuring JSON can offer.

In 2015 a W3C working group proposed a standard for HTML JSON form submissions,
but sadly this project was abandoned.

https://www.w3.org/TR/html-json-forms/#form-submission

This project adopts the same approach as the proposal, but implemented on the
server-side. Using the same naming convention for HTML form fields, the server
can then interpret and build complex objects from. This simplies the downstream
logic to validate and process the incoming request, as your object can end up in
the same structure as your JSON payload design.

## Installation

`npm install html-json-form`

## Usage

To parse an existing query string:

```js
import parse from 'html-json-form'

const form = 'a[]=foo&a[]=bar&b[baz]=woo'
parse(form) // { a: ['foo', 'bar'], b: { baz: 'woo' } }

const json = '{"a":["foo","bar"],"b":{"bar":"woo"}}'
parse(json) // { a: ['foo', 'bar'], b: { baz: 'woo' } }
```

If you're writing logic for inside an AWS Lambda function with an API Gateway
proxy, there is also a middleware to help simplify your implementation, which
will parse and replace the `body` attribute of the handler's `event` argument
with the resulting object for a submitted form or JSON payload.

```js
import { middleware } from 'html-json-form'

export const handler = middlware(async (event) => {
  console.log(event.body) // { a: ['foo', 'bar'], b: { baz: 'woo' } }
})
```

If you prefer to not use the supplied middleware, you can still utilise the 
internal Lambda handling behaviour as follows:

```js
import { parseLambdaEvent } from 'html-json-form'

export const handler = async (event) => {
  console.log(parseLambdaEvent(event)) // { a: ['foo', 'bar'], b: { baz: 'woo' } }
}
```

For detailed information on the field name structure, check out the original
proposal. This library includes one minor extension to the specification, where
types can be declared via hidden fields.

The original client-side spec can read the type of any field when building the
JSON object, but these are never part of the HTTP request and available server
side. Instead, this library introduces a special property name that can
optionally be included in your form, ideally via hidden inputs so as not to be
surfaced to the user within a form:

```html
<input type="hidden" name="_type[foo]" value="number">
<input type="number" name="foo" value="1">
```

This would produce the output:

```js
{ foo: 1 }
```

If you need to define multiple types, this can be done as follows:

```html
<input type="number" name="foo" value="1">
<input type="hidden" name="_type[foo]" value="number">
<input type="checkbox" name="bar[baz]" checked>
<input type="hidden" name="_type[bar][baz]" value="boolean">
```

And would return the object:

```js
{
  foo: 1, 
  bar: {
    baz: true
  }
}
```
