import { io } from 'socket.io-client'
import { createTransactionSocket } from './socket'

jest.mock('socket.io-client')

describe('createTransactionSocket', () => {
  it('connects to the API base URL without auto-connecting', () => {
    createTransactionSocket()

    expect(io).toHaveBeenCalledWith(import.meta.env.VITE_API_BASE_URL, { autoConnect: false })
  })
})
