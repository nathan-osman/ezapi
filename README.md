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

### Installation

To use the package in your application, simply run:

    npm i --save @nathan-osman/ezapi

### Usage

Begin by importing `ApiProvider` and wrapping your root element with it:

```javascript
import { ApiProvider } from '@nathan-osman/ezapi'

...

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ApiProvider base="https://example.com">
    <App />
  </ApiProvider>
)
```

Now you can use the API within any component:

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

The component above includes a loading message, error handling, and built-in type checking for the response!
