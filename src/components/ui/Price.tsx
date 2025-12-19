import { useCurrency } from '../../hooks/useCurrency';

interface PriceProps {
  amount: number;
  className?: string;
}

export function Price({ amount, className = '' }: PriceProps) {
  const { formatPrice } = useCurrency();
  return <span className={className}>{formatPrice(amount)}</span>;
}

// Versione inline per uso in stringhe template
export function usePrice() {
  const { formatPrice, getCurrencySymbol } = useCurrency();
  return { formatPrice, getCurrencySymbol };
}
