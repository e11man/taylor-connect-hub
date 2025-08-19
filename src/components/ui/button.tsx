import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 mobile-button-fix mobile-touch-fix",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-foreground md:hover:bg-accent/90 shadow-sm md:hover:shadow-md md:hover:scale-105",
        secondary: "bg-white text-primary border-2 border-primary md:hover:bg-primary/5 shadow-sm md:hover:shadow-md md:hover:scale-105",
        // Keep other variants for backward compatibility but they won't be used in new implementations
        default: "bg-primary text-primary-foreground md:hover:bg-primary/90 shadow-card md:hover:shadow-ocean",
        ocean: "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-card md:hover:shadow-ocean md:hover:scale-105 transition-spring",
        wave: "bg-accent text-accent-foreground shadow-card md:hover:bg-accent/90 md:hover:scale-105 transition-spring",
        destructive: "bg-destructive text-destructive-foreground md:hover:bg-destructive/90",
        outline: "border-2 border-primary text-primary bg-background shadow-sm md:hover:bg-primary md:hover:text-primary-foreground transition-ocean",
        ghost: "md:hover:bg-accent/10 md:hover:text-accent transition-ocean",
        link: "text-primary underline-offset-4 md:hover:underline md:hover:text-accent transition-ocean",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 px-4 py-2 text-sm",
        lg: "h-14 px-8 py-4 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
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
