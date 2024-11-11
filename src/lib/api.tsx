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

  const _xmlHttp = async function (
    method: string,
    url: string,
    formData: FormData,
  ): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open(method, `${base}${url}`, true)
      xhr.withCredentials = true
      new Headers(props.headers).forEach((v, k) => xhr.setRequestHeader(k, v))
      xhr.onreadystatechange = () => {
        if (xhr.readyState !== XMLHttpRequest.DONE) {
          return
        }
        let data
        try {
          data = JSON.parse(xhr.responseText)
        } catch {
          reject(new ApiError(null, xhr.status))
          return
        }
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new ApiError(data, xhr.status))
          return
        }
        resolve(data)
      }
      xhr.send(formData)
    })
  }

  const _fetch = async function (
    method: string,
    url: string,
    body: any,
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
        body: JSON.stringify(body),
      }
    }
    const response = await fetch(`${base}${url}`, init)
    let data
    try {
      data = await response.json()
    } catch {
      throw new ApiError(null, response.status)
    }
    if (!response.ok) {
      throw new ApiError(data, response.status)
    }
    return data
  }

  const _doReq = async function <T extends z.ZodTypeAny>(
    schema: T | null,
    method: string,
    url: string,
    body?: any,
  ): Promise<z.TypeOf<T>> {
    let json
    if (body instanceof FormData) {
      json = await _xmlHttp(method, url, body)
    } else {
      json = await _fetch(method, url, body)
    }
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
    ): Promise<z.TypeOf<T>> => _doReq(schema, "GET", url),
    put: <T extends z.ZodTypeAny>(
      schema: T,
      url: string,
      body: any,
    ): Promise<z.TypeOf<T>> => _doReq(schema, "PUT", url, body),
    post: <T extends z.ZodTypeAny>(
      schema: T,
      url: string,
      body?: any,
    ): Promise<z.TypeOf<T>> => _doReq(schema, "POST", url, body),
    patch: <T extends z.ZodTypeAny>(
      schema: T,
      url: string,
      body: any,
    ): Promise<z.TypeOf<T>> => _doReq(schema, "PATCH", url, body),
    delete: (url: string): Promise<any> => _doReq(null, "DELETE", url),
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
