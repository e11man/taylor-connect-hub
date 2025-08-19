import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm hover:shadow-md hover:scale-105",
        secondary: "bg-white text-primary border-2 border-primary hover:bg-primary/5 shadow-sm hover:shadow-md hover:scale-105",
        // Keep other variants for backward compatibility but they won't be used in new implementations
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-card hover:shadow-ocean",
        ocean: "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-card hover:shadow-ocean hover:scale-105 transition-spring",
        wave: "bg-accent text-accent-foreground shadow-card hover:bg-accent/90 hover:scale-105 transition-spring",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-2 border-primary text-primary bg-background shadow-sm hover:bg-primary hover:text-primary-foreground transition-ocean",
        ghost: "hover:bg-accent/10 hover:text-accent transition-ocean",
        link: "text-primary underline-offset-4 hover:underline hover:text-accent transition-ocean",
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
    const [isClicking, setIsClicking] = React.useState(false)
    
    // Prevent double-tap issues on mobile
    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (isClicking) {
        e.preventDefault()
        return
      }
      
      setIsClicking(true)
      setTimeout(() => setIsClicking(false), 300)
      
      if (props.onClick) {
        props.onClick(e)
      }
    }, [isClicking, props.onClick])
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), "touch-manipulation")}
        ref={ref}
        {...props}
        onClick={asChild ? props.onClick : handleClick}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
