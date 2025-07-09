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
  const validAmount = parseFloat(amount) || 0;

  return (
    <p suppressHydrationWarning={true} className={className}>
      {`${new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: validCurrencyCode,
        currencyDisplay: 'narrowSymbol'
      }).format(validAmount)}`}
      <span className={clsx('ml-1 inline', currencyCodeClassName)}>{validCurrencyCode}</span>
    </p>
  );
};

export default Price;

