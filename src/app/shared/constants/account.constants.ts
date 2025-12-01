export const ACCOUNT_TYPES = [
  { value: 'Ahorro', label: 'Cuenta de Ahorro' },
  { value: 'Corriente', label: 'Cuenta Corriente' }
] as const;

export const CURRENCIES = [
  { value: 'CRC', label: 'Colones (CRC)' },
  { value: 'USD', label: 'Dólares (USD)' }
] as const;

export type AccountType = typeof ACCOUNT_TYPES[number]['value'];
export type Currency = typeof CURRENCIES[number]['value'];
