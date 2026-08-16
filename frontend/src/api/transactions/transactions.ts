import { api } from '../api';
import type { CreateTransactionPayload, Transaction } from '../resources';

export function createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
  return api.post<Transaction>('/transactions', payload);
}

export function getTransaction(id: string): Promise<Transaction> {
  return api.get<Transaction>(`/transactions/${id}`);
}
