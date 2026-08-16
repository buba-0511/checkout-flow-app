import * as apiModule from '../api'
import { createTransaction, getTransaction } from './transactions'
import {
  LegalIdType,
  TransactionSource,
  TransactionStatus,
  type CreateTransactionPayload,
  type Transaction,
} from '../resources'

jest.mock('../api')

const mockGet = apiModule.api.get as jest.Mock
const mockPost = apiModule.api.post as jest.Mock

const transaction: Transaction = {
  id: 't1',
  reference: 'ref-1',
  customerId: 'c1',
  deliveryId: 'd1',
  status: TransactionStatus.PENDING,
  source: TransactionSource.BUY_NOW,
  items: [],
  subtotalInCents: 1000,
  baseFeeInCents: 500,
  deliveryFeeInCents: 1000,
  totalAmountInCents: 2500,
  paymentGatewayTransactionId: null,
}

const payload: CreateTransactionPayload = {
  customer: {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+573001234567',
    legalId: '1234567890',
    legalIdType: LegalIdType.CC,
  },
  delivery: { address: 'Calle 123', city: 'Bogotá', region: 'Cundinamarca' },
  items: [{ productId: 'p1', quantity: 1 }],
  source: TransactionSource.BUY_NOW,
  paymentMethod: { cardToken: 'tok_1', installments: 1 },
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('createTransaction', () => {
  it('calls POST /transactions with the payload', async () => {
    mockPost.mockResolvedValue(transaction)

    const result = await createTransaction(payload)

    expect(mockPost).toHaveBeenCalledWith('/transactions', payload)
    expect(result).toBe(transaction)
  })
})

describe('getTransaction', () => {
  it('calls GET /transactions/:id', async () => {
    mockGet.mockResolvedValue(transaction)

    const result = await getTransaction('t1')

    expect(mockGet).toHaveBeenCalledWith('/transactions/t1')
    expect(result).toBe(transaction)
  })
})
