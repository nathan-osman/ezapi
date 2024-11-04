/**
 * @jest-environment jsdom
 */

import fetch from 'jest-fetch-mock'
import { renderHook } from '@testing-library/react'
import { ApiProvider, useApi } from '../src'

const testPath = '/'
const testValue = { "test": 123 }

describe('testing ApiProvider', () => {

  beforeEach(() => {
    fetch.resetMocks()
  })

  const { result } = renderHook(() => useApi(), {
    wrapper: ApiProvider,
  })

  it('throws an error for aborted requests', async () => {
    fetch.mockAbortOnce()
    await expect(result.current.get(testPath)).rejects.toThrow()
  })

  it('throws an error for bad JSON', async () => {
    fetch.mockOnce('')
    await expect(result.current.get(testPath)).rejects.toThrow()
  })

  it('throws an error for HTTP errors', async () => {
    fetch.mockOnce('', { status: 400 })
    await expect(result.current.get(testPath)).rejects.toThrow()
  })

  it('correctly parses JSON in a response', async () => {
    fetch.mockOnce(JSON.stringify(testValue))
    await expect(result.current.get(testPath)).resolves.toStrictEqual(testValue)
  })

  it('correctly sends JSON in request body', async () => {
    fetch.mockOnce('{}')
    await expect(result.current.post(testPath, testValue)).resolves.toBeDefined()
    expect(fetch.mock.calls.length).toEqual(1)
    expect(fetch.mock.calls[0][1]?.body).toStrictEqual(testValue)
  })

})
