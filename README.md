## ezapi

![NPM Version](https://img.shields.io/npm/v/%40nathan-osman%2Fezapi)
![NPM Version](https://img.shields.io/npm/dm/%40nathan-osman%2Fezapi)
![NPM Version](https://img.shields.io/npm/l/%40nathan-osman%2Fezapi)

This package aims to provide an easy way to interact with a typed JSON API in a React application.

Features include:

- Specify base URI for API once and use relative paths everywhere else
- Specify extra HTTP headers to use for things like authentication
- Support for cross-origin requests with cookies (`credentials: 'include'`)
- Response validation with [Zod](https://zod.dev/) - including full TypeScript support!
- Fallback to `XMLHttpRequest` when sending `FormData` (useful for uploads)
- Ability to monitor upload progress

### Installation

To use the package in your application, simply run:

    npm i --save @nathan-osman/ezapi

### Setup

Begin by importing `ApiProvider` and wrapping your root element with it:

```javascript
import { ApiProvider } from '@nathan-osman/ezapi'

...

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ApiProvider>
    <App />
  </ApiProvider>
)
```

You can also specify a base URI, headers to include in all requests, and enable credentials for cross-origin requests:

```javascript
<ApiProvider
  base="https://example.com"
  headers={{"X-MyHeader": "Value"}}
  includeCredentials={true}
>
```

### Usage

The example below shows how to use the API within a component:

```javascript
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useApi } from '@nathan-osman/ezapi'

const ResponseSchema = z.object({
  username: z.string(),
})

const Response = z.infer<typeof ResponseSchema>

export default function MyComponent() {

  const api = useApi()
  const [data, setData] = useState<Response>()
  const [error, setError] = useState<string?>()

  useEffect(() => {
    api.get(ResponseSchema, '/api/data')
      .then(r => setData(r))
      .catch(e => setError(e.message))
  }, [])

  if (error !== undefined) {
    return <strong>Error: {error}</strong>
  }

  if (data === undefined) {
    return <em>Loading...</em>
  }

  return <div>{data.username}</div>
}
```

The example above includes a loading message, error handling, and built-in type checking for the response!

Likewise, sending data is as simple as:

```javascript
const myData = {
  username: "john",
  password: "mYPaSsWoRd",
}

api.put(ResponseSchema, '/api/data', myData)
api.post(ResponseSchema, '/api/data', myData)
api.patch(ResponseSchema, '/api/data', myData)
```

Delete is not expected to accept or return any data:

```javascript
api.delete('/api/object')
```

### Advanced Usage

#### Setting Headers inside `<ApiProvider>`

Components inside `<ApiProvider>` can set or clear headers with:

```javascript
const api = useApi()
api.setHeader("X-MyHeader", "Value")
api.clearHeader("X-MyHeader")
```

#### Upload Progress

To monitor progress of a `FormData` request (such as a file upload), pass a callback after the third parameter:

```javascript
api.post(
  ResponseSchema,
  '/api/upload',
  formData,
  p => console.log(`Progress: ${p}%`),
)
```

(Note that this is only available when the type of the third parameter is `FormData`. Other requests will use `fetch()` internally and consequently cannot report progress.)
