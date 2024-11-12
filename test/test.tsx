/**
 * @jest-environment jsdom
 */

import React from 'react'
import fetch from 'jest-fetch-mock'
import { renderHook } from '@testing-library/react'
import { z } from 'zod'
import { ApiProvider, useApi } from '../src'
import {
  openMock,
  sendMock,
  setRequestHeaderMock,
  XMLHttpRequestMock,
} from '../__mocks__/xmlHttpRequestMock'

const testBase = "http://example.com"
const testPath = '/'
const testValueGood = { "test": "test" }
const testValueBad1 = { "test": 123 }
const testValueBad2 = { "bad": "test" }
const testKey = "key"
const testVal = "val"
const testHeaders = {
  [testKey]: testVal,
}
const testFormData = new FormData()

testFormData.set(testKey, testVal)

const TestTypeSchema = z.object({
  test: z.string(),
})

const { result } = renderHook(() => useApi(), {
  wrapper: (props) => (
    <ApiProvider
      base={testBase}
      headers={testHeaders}
    >
      {props.children}
    </ApiProvider>
  ),
})

describe('testing ApiProvider (fetch)', () => {

  beforeEach(() => {
    fetch.resetMocks()
  })

  it('throws an error for aborted requests', async () => {
    fetch.mockAbortOnce()
    await expect(result.current.get(TestTypeSchema, testPath)).rejects.toThrow()
  })

  it('throws an error for bad JSON', async () => {
    fetch.mockResponseOnce('')
    await expect(result.current.get(TestTypeSchema, testPath)).rejects.toThrow()
  })

  it('throws an error for HTTP errors', async () => {
    fetch.mockResponseOnce(JSON.stringify(testValueGood), { status: 400 })
    await expect(result.current.get(TestTypeSchema, testPath)).rejects.toThrow()
  })

  it('throws an error for wrong type', async () => {
    fetch.mockResponseOnce(JSON.stringify(testValueBad1))
    await expect(result.current.get(TestTypeSchema, testPath)).rejects.toThrow()
  })

  it('throws an error for missing key', async () => {
    fetch.mockResponseOnce(JSON.stringify(testValueBad2))
    await expect(result.current.get(TestTypeSchema, testPath)).rejects.toThrow()
  })

  it('correctly handles base and headers', async () => {
    fetch.mockResponseOnce(JSON.stringify(testValueGood))
    await expect(result.current.get(TestTypeSchema, testPath)).resolves.toBeDefined()
    expect(fetch.mock.calls.length).toEqual(1)
    expect(fetch.mock.calls[0][0]).toEqual(`${testBase}${testPath}`)
    expect(fetch.mock.calls[0][1]?.headers).toStrictEqual(testHeaders)
  })

  it('correctly parses JSON in a response', async () => {
    fetch.mockResponseOnce(JSON.stringify(testValueGood))
    await expect(result.current.get(TestTypeSchema, testPath)).resolves.toStrictEqual(testValueGood)
  })

  it('correctly sends JSON in request body', async () => {
    fetch.mockResponseOnce(JSON.stringify(testValueGood))
    await expect(result.current.post(TestTypeSchema, testPath, testValueGood)).resolves.toBeDefined()
    expect(fetch.mock.calls.length).toEqual(1)
    expect(JSON.parse(fetch.mock.calls[0][1]?.body as string)).toStrictEqual(testValueGood)
  })

  it('allows empty responses with a 204 status', async () => {
    fetch.mockResponseOnce('', { status: 204 })
    await expect(result.current.post(z.void(), testPath)).resolves.toBeUndefined()
  })
})

describe('testing ApiProvider (XMLHttpRequest)', () => {

  beforeEach(() => {
    XMLHttpRequestMock.resetMocks()
  })

  it('throws an error for HTTP errors', async () => {
    XMLHttpRequestMock.mockData(400, JSON.stringify(testValueGood))
    await expect(result.current.post(TestTypeSchema, testPath, testFormData)).rejects.toThrow()
  })

  it('correctly sends FormData using XmlHttpRequest', async () => {
    XMLHttpRequestMock.mockData(200, JSON.stringify(testValueGood))
    await expect(result.current.post(TestTypeSchema, testPath, testFormData)).resolves.toBeDefined()
    expect(openMock).toHaveBeenCalled()
    expect(openMock.mock.calls[0][0]).toEqual('POST')
    expect(openMock.mock.calls[0][1]).toEqual(`${testBase}${testPath}`)
    expect(sendMock).toHaveBeenCalled()
    expect(sendMock.mock.calls[0][0]).toStrictEqual(testFormData)
    expect(setRequestHeaderMock).toHaveBeenCalled()
    expect(setRequestHeaderMock.mock.calls[0][0]).toStrictEqual(testKey)
    expect(setRequestHeaderMock.mock.calls[0][1]).toStrictEqual(testVal)
  })

  it('reports progress as the request is sent', async () => {
    XMLHttpRequestMock.mockData(200, JSON.stringify(testValueGood))
    const callbackMock = jest.fn()
    await expect(result.current.post(
      TestTypeSchema,
      testPath,
      testFormData,
      callbackMock,
    )).resolves.toBeDefined()
    expect(callbackMock).toHaveBeenCalled()
    expect(callbackMock.mock.calls[0][0]).toEqual(50)
  })
})
