import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-montserrat",
  {
    variants: {
      variant: {
        // Primary button - solid red background for main CTAs
        primary: "bg-[#F25C4D] text-white hover:bg-[#E14F3D] focus-visible:ring-[#F25C4D] shadow-sm hover:shadow-md active:scale-95",
        // Secondary button - white background with dark blue border/text
        secondary: "bg-white border-2 border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white focus-visible:ring-[#1E3A8A] shadow-sm hover:shadow-md active:scale-95",
        // Legacy variants for backward compatibility
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-card hover:shadow-ocean",
        ocean: "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-card hover:shadow-ocean hover:scale-105 transition-spring",
        wave: "bg-accent text-accent-foreground shadow-card hover:bg-accent/90 hover:scale-105 transition-spring",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-2 border-primary text-primary bg-background shadow-sm hover:bg-primary hover:text-primary-foreground transition-ocean",
        ghost: "hover:bg-accent/10 hover:text-accent transition-ocean",
        link: "text-primary underline-offset-4 hover:underline hover:text-accent transition-ocean",
      },
      size: {
        // Unified size system - all buttons use consistent dimensions
        default: "h-12 px-6 py-3 text-base",
        sm: "h-10 px-4 py-2 text-sm",
        lg: "h-14 px-8 py-4 text-lg",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
