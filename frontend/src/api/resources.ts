// Mirrors backend DTOs (backend/src/{products,customers,deliveries,transactions}/infrastructure/http/dto).

export interface Product {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  stock: number;
  // Ordered gallery — imageUrls[0] is the primary/catalog-card image.
  imageUrls: string[];
  tags: string[];
}

export interface ProductPage {
  items: Product[];
  nextCursor: string | null;
}

export interface StockLevel {
  productId: string;
  stock: number;
}

export const LegalIdType = {
  CC: 'CC',
  CE: 'CE',
  NIT: 'NIT',
  PASSPORT: 'PASSPORT',
} as const;

export type LegalIdType = (typeof LegalIdType)[keyof typeof LegalIdType];

export interface CustomerInput {
  fullName: string;
  email: string;
  phone: string;
  legalId: string;
  legalIdType: LegalIdType;
}

export interface DeliveryInput {
  address: string;
  city: string;
  region: string;
}

export const TransactionStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DECLINED: 'DECLINED',
  VOIDED: 'VOIDED',
  ERROR: 'ERROR',
} as const;
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

export const TransactionSource = {
  BUY_NOW: 'BUY_NOW',
  CART: 'CART',
} as const;
export type TransactionSource = (typeof TransactionSource)[keyof typeof TransactionSource];

export interface TransactionItem {
  id: string;
  productId: string;
  quantity: number;
  unitPriceInCents: number;
  subtotalInCents: number;
}

export interface Transaction {
  id: string;
  reference: string;
  customerId: string;
  deliveryId: string;
  status: TransactionStatus;
  source: TransactionSource;
  items: TransactionItem[];
  subtotalInCents: number;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  totalAmountInCents: number;
  paymentGatewayTransactionId: string | null;
}

export interface CreateTransactionItemInput {
  productId: string;
  quantity: number;
}

export interface CreateTransactionPayload {
  customer: CustomerInput;
  delivery: DeliveryInput;
  items: CreateTransactionItemInput[];
  source: TransactionSource;
  paymentMethod: {
    cardToken: string;
    installments: number;
  };
}
