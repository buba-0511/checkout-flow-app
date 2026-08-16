import type { AxiosResponse } from 'axios'
import { api, apiClient, onFulfilled, onRejected } from './api'

describe('onFulfilled', () => {
  it('unwraps the success envelope to return the payload directly', () => {
    const response = {
      data: { success: true, data: { id: 'p1' } },
    } as unknown as AxiosResponse
    expect(onFulfilled(response)).toEqual({ id: 'p1' })
  })
})

describe('onRejected', () => {
  it('normalizes a well-formed error envelope from the backend', async () => {
    await expect(
      onRejected({
        response: {
          status: 409,
          data: {
            success: false,
            error: { code: 'STOCK_INSUFFICIENT', message: 'Not enough stock' },
          },
        },
      }),
    ).rejects.toEqual({
      code: 'STOCK_INSUFFICIENT',
      message: 'Not enough stock',
      status: 409,
    })
  })

  it('falls back to UNEXPECTED_RESPONSE when the server responds without a proper envelope', async () => {
    await expect(
      onRejected({ response: { status: 500, data: undefined } }),
    ).rejects.toEqual({
      code: 'UNEXPECTED_RESPONSE',
      message: 'The server returned an unexpected response. Please try again.',
      status: 500,
    })
  })

  it('falls back to NETWORK_ERROR when there is no response at all', async () => {
    await expect(onRejected({ response: undefined })).rejects.toEqual({
      code: 'NETWORK_ERROR',
      message: 'Could not reach the server. Check your connection and try again.',
      status: undefined,
    })
  })
})

describe('api', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('get delegates to apiClient.get', async () => {
    const spy = jest.spyOn(apiClient, 'get').mockResolvedValue({ id: 'p1' })

    const result = await api.get('/products/p1', { params: { limit: 1 } })

    expect(spy).toHaveBeenCalledWith('/products/p1', { params: { limit: 1 } })
    expect(result).toEqual({ id: 'p1' })
  })

  it('post delegates to apiClient.post', async () => {
    const spy = jest.spyOn(apiClient, 'post').mockResolvedValue({ id: 't1' })

    const result = await api.post('/transactions', { source: 'CART' })

    expect(spy).toHaveBeenCalledWith('/transactions', { source: 'CART' }, undefined)
    expect(result).toEqual({ id: 't1' })
  })

  it('put delegates to apiClient.put', async () => {
    const spy = jest.spyOn(apiClient, 'put').mockResolvedValue({ id: 'c1' })

    const result = await api.put('/customers/c1', { fullName: 'Jane' })

    expect(spy).toHaveBeenCalledWith('/customers/c1', { fullName: 'Jane' }, undefined)
    expect(result).toEqual({ id: 'c1' })
  })

  it('patch delegates to apiClient.patch', async () => {
    const spy = jest.spyOn(apiClient, 'patch').mockResolvedValue({ id: 'c1' })

    const result = await api.patch('/customers/c1', { phone: '+573000000000' })

    expect(spy).toHaveBeenCalledWith('/customers/c1', { phone: '+573000000000' }, undefined)
    expect(result).toEqual({ id: 'c1' })
  })

  it('delete delegates to apiClient.delete', async () => {
    const spy = jest.spyOn(apiClient, 'delete').mockResolvedValue({ success: true })

    const result = await api.delete('/customers/c1')

    expect(spy).toHaveBeenCalledWith('/customers/c1', undefined)
    expect(result).toEqual({ success: true })
  })
})
