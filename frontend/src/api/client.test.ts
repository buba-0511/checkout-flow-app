import type { AxiosResponse } from 'axios'
import { onFulfilled, onRejected } from './client'

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
