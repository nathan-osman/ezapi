/**
 * @jest-environment jsdom
 */

import fetch from 'jest-fetch-mock'
import { renderHook } from '@testing-library/react'
import { z } from 'zod'
import { ApiProvider, useApi } from '../src'

const testPath = '/'
const testValueGood = { "test": "test" }
const testValueBad1 = { "test": 123 }
const testValueBad2 = { "bad": "test" }

const TestTypeSchema = z.object({
  test: z.string(),
})

describe('testing ApiProvider', () => {

  beforeEach(() => {
    fetch.resetMocks()
  })

  const { result } = renderHook(() => useApi(), {
    wrapper: ApiProvider,
  })

  it('throws an error for aborted requests', async () => {
    fetch.mockAbortOnce()
    await expect(result.current.get(TestTypeSchema, testPath)).rejects.toThrow()
  })

  it('throws an error for bad JSON', async () => {
    fetch.mockOnce('')
    await expect(result.current.get(TestTypeSchema, testPath)).rejects.toThrow()
  })

  it('throws an error for HTTP errors', async () => {
    fetch.mockOnce('', { status: 400 })
    await expect(result.current.get(TestTypeSchema, testPath)).rejects.toThrow()
  })

  it('correctly parses JSON in a response', async () => {
    fetch.mockOnce(JSON.stringify(testValueGood))
    await expect(result.current.get(TestTypeSchema, testPath)).resolves.toStrictEqual(testValueGood)
  })

  it('throws an error for wrong type', async () => {
    fetch.mockOnce(JSON.stringify(testValueBad1))
    await expect(result.current.get(TestTypeSchema, testPath)).rejects.toThrow()
  })

  it('throws an error for missing key', async () => {
    fetch.mockOnce(JSON.stringify(testValueBad2))
    await expect(result.current.get(TestTypeSchema, testPath)).rejects.toThrow()
  })

  it('correctly sends JSON in request body', async () => {
    fetch.mockOnce(JSON.stringify(testValueGood))
    await expect(result.current.post(TestTypeSchema, testPath, testValueGood)).resolves.toBeDefined()
    expect(fetch.mock.calls.length).toEqual(1)
    expect(JSON.parse(fetch.mock.calls[0][1]?.body as string)).toStrictEqual(testValueGood)
  })

})
