import {
  createContext,
  PropsWithChildren,
  useContext,
  useState,
} from 'react'
import { z } from 'zod'
import { ApiError } from '../util/error'

type ApiHeaders = Record<string, string>
type ProgressCallback = (value: number) => void

type ApiProviderProps = {
  base?: string
  headers?: ApiHeaders
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
    callback?: ProgressCallback,
  ) => Promise<z.TypeOf<T>>
  post: <T extends z.ZodTypeAny>(
    schema: T,
    url: string,
    body?: any,
    callback?: ProgressCallback,
  ) => Promise<z.TypeOf<T>>
  patch: <T extends z.ZodTypeAny>(
    schema: T,
    url: string,
    body: any,
    callback?: ProgressCallback,
  ) => Promise<z.TypeOf<T>>
  delete: (url: string) => Promise<any>
  setHeader: (name: string, value: string) => void
  clearHeader: (name: string) => void
}

const ApiContext = createContext<ApiContextType | null>(null)

export function ApiProvider(props: PropsWithChildren<ApiProviderProps>) {

  const base = props.base ?? ""

  const [headers, setHeaders] = useState<ApiHeaders>(props.headers ?? {})

  const _xmlHttp = async function (
    method: string,
    url: string,
    formData: FormData,
    callback?: ProgressCallback,
  ): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open(method, `${base}${url}`, true)
      xhr.withCredentials = true
      new Headers(headers).forEach((v, k) => xhr.setRequestHeader(k, v))
      xhr.upload.onprogress = function (e: ProgressEvent) {
        if (e.lengthComputable && callback) {
          callback(e.loaded / e.total * 100)
        }
      }
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
      headers: headers,
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
    if (response.status === 204) {
      return null
    }
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
    callback?: ProgressCallback,
  ): Promise<z.TypeOf<T>> {
    let json
    if (body instanceof FormData) {
      json = await _xmlHttp(method, url, body, callback)
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
      callback?: ProgressCallback,
    ): Promise<z.TypeOf<T>> => _doReq(schema, "PUT", url, body, callback),
    post: <T extends z.ZodTypeAny>(
      schema: T,
      url: string,
      body?: any,
      callback?: ProgressCallback,
    ): Promise<z.TypeOf<T>> => _doReq(schema, "POST", url, body, callback),
    patch: <T extends z.ZodTypeAny>(
      schema: T,
      url: string,
      body: any,
      callback?: ProgressCallback,
    ): Promise<z.TypeOf<T>> => _doReq(schema, "PATCH", url, body, callback),
    delete: (url: string): Promise<any> => _doReq(null, "DELETE", url),
    setHeader: (name: string, value: string) => {
      setHeaders(h => ({
        ...h,
        [name]: value,
      }))
    },
    clearHeader: (name: string) => {
      setHeaders(({ [name]: _, ...h }) => h)
    },
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
