/**
 * @jest-environment jsdom
 */

import fetch from 'jest-fetch-mock'
import { renderHook } from '@testing-library/react'
import { ApiProvider, useApi } from '../src'

const testPath = '/'

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

})
