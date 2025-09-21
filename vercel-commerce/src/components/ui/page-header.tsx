import { cn } from "@/src/lib/utils" // Assuming you have a utility for merging class names, like in shadcn/ui. If not, you can remove this.
import React from "react"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string | null
}

export function PageHeader({
  title,
  description,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      {description && (
        <p className="text-lg text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      )}
    </div>
  )
}
