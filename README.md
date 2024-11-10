## ezapi

![NPM Version](https://img.shields.io/npm/v/%40nathan-osman%2Fezapi)
![NPM Version](https://img.shields.io/npm/dm/%40nathan-osman%2Fezapi)
![NPM Version](https://img.shields.io/npm/l/%40nathan-osman%2Fezapi)

This package aims to provide an extremely simple way to interact with a JSON API in a React application.

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
import { useApi } from '@nathan-osman/ezapi'

export default function MyComponent() {

  const api = useApi()
  const [data, setData] = useState<any>()

  useEffect(() => {
    api.get('/api/data')
      .then(d => setData(d))
  }, [])

  return (
    <div>
      {
        data !== undefined ?
          <strong>{d.username}</strong> :
          <em>Loading...</em>
      }
    </div>
  )
}
```
