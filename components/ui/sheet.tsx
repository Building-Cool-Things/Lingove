"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"

// A panel that slides up from the bottom (tip details, scenario details). Built on base-ui's Dialog,
// so focus, Escape and outside-click closing come for free.
function Sheet(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetContent({ className, children, ...props }: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        data-slot="sheet-overlay"
        className="fixed inset-0 z-50 bg-[rgba(4,7,14,.6)] transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0"
      />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92%] w-full max-w-120 flex-col gap-4 overflow-y-auto rounded-t-[28px] border border-border bg-card px-5 pt-2.5 pb-7 text-card-foreground shadow-[0_-24px_48px_-12px_rgba(0,0,0,.6)] outline-none transition-transform duration-200 data-ending-style:translate-y-full data-starting-style:translate-y-full",
          className
        )}
        {...props}
      >
        <span className="h-1 w-10 flex-none self-center rounded-full bg-input" />
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return <DialogPrimitive.Title data-slot="sheet-title" className={cn("text-lg font-semibold", className)} {...props} />
}

function SheetDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return <DialogPrimitive.Description data-slot="sheet-description" className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export { Sheet, SheetContent, SheetTitle, SheetDescription }
