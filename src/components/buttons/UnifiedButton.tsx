import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UnifiedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  size?: "sm" | "default" | "lg";
  loading?: boolean;
  children: React.ReactNode;
  ariaLabel?: string;
}

const UnifiedButton = forwardRef<HTMLButtonElement, UnifiedButtonProps>(
  ({ 
    className, 
    variant = "primary", 
    size = "default", 
    loading, 
    children, 
    ariaLabel,
    ...props 
  }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          loading && "opacity-75 cursor-not-allowed",
          className
        )}
        disabled={loading || props.disabled}
        aria-label={ariaLabel}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Loading...
          </div>
        ) : (
          children
        )}
      </Button>
    );
  }
);

UnifiedButton.displayName = "UnifiedButton";

export default UnifiedButton;