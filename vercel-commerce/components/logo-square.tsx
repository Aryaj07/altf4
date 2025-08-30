import clsx from 'clsx';
import LogoIcon from './icons/logo';

export default function LogoSquare({ size }: { size?: 'sm' | undefined }) {
  // The component now returns the LogoIcon directly, without the outer div.
  return (
    <LogoIcon
      className={clsx({
        // I've increased the default size from 24px to 32px
        'h-[45px] w-[50px]': !size,
        // I've increased the small size from 14px to 22px
        'h-[35px] w-[40px]': size === 'sm'
      })}
    />
  );
}