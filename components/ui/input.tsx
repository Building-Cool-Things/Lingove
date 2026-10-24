import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Lingov look: dark filled field. "pill" is the chat / search field, "default" is a form field.
const inputVariants = cva(
  "w-full min-w-0 border-[1.5px] border-input bg-card px-3.5 text-[15px] text-foreground transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-primary disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:animate-[lgshake_.3s]",
  {
    variants: {
      size: {
        default: "h-[46px] rounded-2xl",
        pill: "h-[46px] rounded-full px-4",
        sm: "h-10 rounded-full px-4 text-sm",
      },
    },
    defaultVariants: { size: "default" },
  }
)

function Input({ className, type, size, ...props }: Omit<React.ComponentProps<"input">, "size"> & VariantProps<typeof inputVariants>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        inputVariants({ size }),
        className
      )}
      {...props}
    />
  )
}

export { Input }
