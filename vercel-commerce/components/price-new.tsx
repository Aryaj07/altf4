import clsx from 'clsx';

const Price = ({
  amount,
  className,
  currencyCode = 'INR',
  currencyCodeClassName,
  showCurrency = true, // <-- Add this prop
}: {
  amount: string;
  className?: string;
  currencyCode?: string;
  currencyCodeClassName?: string;
  showCurrency?: boolean; // <-- Add this prop type
} & React.ComponentProps<'p'>) => {
  const validCurrencyCode = (currencyCode || 'EUR').toUpperCase();
  const rawAmount = Number(amount);
  const validAmount = Number.isFinite(rawAmount) ? Number(rawAmount.toFixed(2)) : 0;

  return (
    <p suppressHydrationWarning={true} className={className}>
      {`${new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: validCurrencyCode,
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(validAmount)}`}
      {showCurrency && (
        <span className={clsx('ml-1 inline', currencyCodeClassName)}>{validCurrencyCode}</span>
      )}
    </p>
  );
};

export default Price;