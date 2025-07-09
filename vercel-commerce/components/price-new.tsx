import clsx from 'clsx';

const Price = ({
  amount,
  className,
  currencyCode = 'EUR',
  currencyCodeClassName
}: {
  amount: string;
  className?: string;
  currencyCode?: string;
  currencyCodeClassName?: string;
} & React.ComponentProps<'p'>) => {
  // Ensure we have a valid currency code
  const validCurrencyCode = (currencyCode || 'EUR').toUpperCase();
  
  // Use Number to maintain precision better than parseFloat
  const rawAmount = Number(amount);
  // Round to 2 decimal places to avoid floating point issues
  const validAmount = Number.isFinite(rawAmount) ? Number(rawAmount.toFixed(2)) : 0;
  
  console.log("Price debug:", {
    originalAmount: amount,
    rawAmount,
    validAmount,
    currencyCode: validCurrencyCode
  });

  return (
    <p suppressHydrationWarning={true} className={className}>
      {`${new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: validCurrencyCode,
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(validAmount)}`}
      <span className={clsx('ml-1 inline', currencyCodeClassName)}>{validCurrencyCode}</span>
    </p>
  );
};

export default Price;