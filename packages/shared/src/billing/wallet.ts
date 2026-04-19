export enum WalletTransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export interface WalletBalance {
  balanceCents: number;
  currency: string;
}

export interface WalletTopUpOption {
  amountCents: number;
  label: string;
}

export const WALLET_TOPUP_OPTIONS: WalletTopUpOption[] = [
  { amountCents: 500, label: '$5' },
  { amountCents: 1000, label: '$10' },
  { amountCents: 2500, label: '$25' },
  { amountCents: 5000, label: '$50' },
  { amountCents: 10000, label: '$100' },
  { amountCents: 50000, label: '$500' },
];

export const WALLET_MINIMUM_BALANCE_CENTS = 0;
export const WALLET_MAX_BALANCE_CENTS = 100000;

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
