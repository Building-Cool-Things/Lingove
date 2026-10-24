import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-[15px] font-bold whitespace-nowrap transition-[transform,background-color,box-shadow,color] duration-100 cursor-pointer outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:not-aria-[haspopup]:scale-[.96] disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Lingov main button: amber pill with a chunky inset edge (bottom + right)
        default: "bg-primary text-primary-foreground shadow-[inset_-4px_-5px_0_#2F9674] hover:bg-[#6BD3AB] active:shadow-[inset_-2px_-3px_0_#2F9674]",
        outline:
          "border-[1.5px] border-border bg-card text-foreground shadow-[inset_-4px_-5px_0_#080A09] hover:bg-muted active:shadow-[inset_-2px_-3px_0_#080A09] aria-expanded:bg-muted",
        secondary:
          "border-[1.5px] border-border bg-card text-foreground shadow-[inset_-4px_-5px_0_#080A09] hover:bg-muted active:shadow-[inset_-2px_-3px_0_#080A09] aria-expanded:bg-muted",
        ghost:
          "text-muted-foreground hover:text-foreground aria-expanded:text-foreground",
        destructive:
          "bg-destructive text-[#2A0A0A] shadow-[inset_-4px_-5px_0_#B94A4A] hover:brightness-105 active:shadow-[inset_-2px_-3px_0_#B94A4A]",
        link: "text-primary font-medium hover:text-[#6BD3AB]",
        // Lingov: quiet filled button (cancel, secondary actions)
        soft: "bg-muted text-foreground hover:bg-border",
        // Lingov: amber soft chip (tips, highlights)
        warm: "bg-accent/15 text-accent hover:bg-accent/25",
      },
      size: {
        default:
          "h-[46px] gap-1.5 px-[22px] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-8 gap-1 px-3 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1 px-4 text-[13px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-[46px] gap-1.5 px-[22px] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        // Lingov sizes: xl = main action, chip = small pill, icon-round = round icon button
        xl: "h-[46px] gap-2 px-[22px]",
        "2xl": "h-12 gap-2 px-[22px]",
        chip: "h-[30px] gap-1.5 px-[11px] text-[12.5px] font-medium",
        "icon-round": "size-11 rounded-full",
        "icon-md": "size-10",
        icon: "size-8",
        "icon-xs":
          "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
