import {
  createContext,
  PropsWithChildren,
  useContext,
} from 'react'
import { ApiError } from '../util/error'

type ApiProviderProps = {
  base?: string
  headers?: HeadersInit
  includeCredentials?: boolean
}

type ApiContextType = {
  get: (url: string) => Promise<any>
  put: (url: string, body: any) => Promise<any>
  post: (url: string, body?: any) => Promise<any>
  patch: (url: string, body: any) => Promise<any>
  delete: (url: string) => Promise<any>
}

const ApiContext = createContext<ApiContextType | null>(null)

export function ApiProvider(props: PropsWithChildren<ApiProviderProps>) {

  const base = props.base ?? ""

  const _fetch = async function (
    method: string,
    url: string,
    body?: any,
  ): Promise<any> {
    let init: RequestInit = {
      method,
      headers: props.headers,
    }
    if (props.includeCredentials) {
      init.credentials = 'include'
    }
    if (body !== undefined) {
      init = {
        ...init,
        headers: {
          ...init.headers,
          'Content-Type': 'application/json'
        },
        body,
      }
    }
    const response = await fetch(`${base}${url}`, init)
    if (!response.ok) {
      let error
      try {
        error = await response.json()
      } catch (e) {
        throw new ApiError(error, response.status)
      }
      throw new ApiError(null, response.status)
    }
    if (response.status !== 204) {
      return await response.json()
    }
  }

  const apiContext = {
    get: (url: string): Promise<any> => _fetch("GET", url),
    put: (url: string, body: any): Promise<any> => _fetch("PUT", url, body),
    post: (url: string, body?: any): Promise<any> => _fetch("POST", url, body),
    patch: (url: string, body: any): Promise<any> => _fetch("PATCH", url, body),
    delete: (url: string): Promise<any> => _fetch("DELETE", url),
  }

  return (
    <ApiContext.Provider value={apiContext}>
      {props.children}
    </ApiContext.Provider>
  )
}

export function useApi(): ApiContextType {
  const apiContext = useContext(ApiContext)
  if (apiContext === null) {
    throw new Error("API context is null; did you forget <ApiProvider>?")
  }
  return apiContext
}
