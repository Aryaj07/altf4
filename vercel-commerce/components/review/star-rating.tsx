/* eslint-disable no-unused-vars */
"use client"

type StarRatingProps = {
  value: number // 0-5
  size?: number
  className?: string
  onChange?: (v: number) => void // if provided, becomes interactive
  "aria-label"?: string
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={filled ? "text-yellow-500" : "text-neutral-300"}
      width="20"
      height="20"
      focusable="false"
    >
      {/* ... */}
      <path
        fill="currentColor"
        d="M10 15.27l-5.18 3.04 1.64-5.64L1 7.64l5.9-.5L10 2l3.1 5.14 5.9.5-5.46 4.03 1.64 5.64L10 15.27z"
      />
    </svg>
  )
}

export function StarRating({ value, size = 20, className, onChange, ...props }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5]
  const isInteractive = typeof onChange === "function"

  return (
    <div className={["flex items-center gap-1", className].filter(Boolean).join(" ")} {...props}>
      {stars.map((i) => (
        <button
          key={i}
          type="button"
          onClick={isInteractive ? () => onChange?.(i) : undefined}
          className={isInteractive ? "cursor-pointer" : "cursor-default"}
          aria-label={isInteractive ? `Set rating to ${i}` : undefined}
          title={isInteractive ? `Rate ${i} star${i > 1 ? "s" : ""}` : undefined}
          style={{ lineHeight: 0 }}
        >
          <svg
            viewBox="0 0 20 20"
            width={size}
            height={size}
            aria-hidden="true"
            className={value >= i ? "text-yellow-500" : "text-neutral-300"}
          >
            <path
              fill="currentColor"
              d="M10 15.27l-5.18 3.04 1.64-5.64L1 7.64l5.9-.5L10 2l3.1 5.14 5.9.5-5.46 4.03 1.64 5.64L10 15.27z"
            />
          </svg>
        </button>
      ))}
    </div>
  )
}
