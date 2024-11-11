import {
  createContext,
  PropsWithChildren,
  useContext,
} from 'react'
import { z } from 'zod'
import { ApiError } from '../util/error'

type ApiProviderProps = {
  base?: string
  headers?: HeadersInit
  includeCredentials?: boolean
}

type ApiContextType = {
  get: <T extends z.ZodTypeAny>(
    schema: T,
    url: string,
  ) => Promise<z.TypeOf<T>>
  put: <T extends z.ZodTypeAny>(
    schema: T,
    url: string,
    body: any,
  ) => Promise<z.TypeOf<T>>
  post: <T extends z.ZodTypeAny>(
    schema: T,
    url: string,
    body?: any,
  ) => Promise<z.TypeOf<T>>
  patch: <T extends z.ZodTypeAny>(
    schema: T,
    url: string,
    body: any,
  ) => Promise<z.TypeOf<T>>
  delete: (url: string) => Promise<any>
}

const ApiContext = createContext<ApiContextType | null>(null)

export function ApiProvider(props: PropsWithChildren<ApiProviderProps>) {

  const base = props.base ?? ""

  const _fetch = async function <T extends z.ZodTypeAny>(
    schema: T | null,
    method: string,
    url: string,
    body?: any,
  ): Promise<z.TypeOf<T>> {
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
        body: JSON.stringify(body),
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
    const json = await response.json()
    if (schema === null) {
      return json
    }
    const result = schema.safeParse(json)
    if (!result.success) {
      throw new Error("validation error")
    }
    return result.data
  }

  const apiContext = {
    get: <T extends z.ZodTypeAny>(
      schema: T,
      url: string,
    ): Promise<z.TypeOf<T>> => _fetch(schema, "GET", url),
    put: <T extends z.ZodTypeAny>(
      schema: T,
      url: string,
      body: any,
    ): Promise<z.TypeOf<T>> => _fetch(schema, "PUT", url, body),
    post: <T extends z.ZodTypeAny>(
      schema: T,
      url: string,
      body?: any,
    ): Promise<z.TypeOf<T>> => _fetch(schema, "POST", url, body),
    patch: <T extends z.ZodTypeAny>(
      schema: T,
      url: string,
      body: any,
    ): Promise<z.TypeOf<T>> => _fetch(schema, "PATCH", url, body),
    delete: (url: string): Promise<any> => _fetch(null, "DELETE", url),
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
