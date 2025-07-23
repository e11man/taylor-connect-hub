import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline" | "ghost" | "minimal";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

const SecondaryButton = forwardRef<HTMLButtonElement, SecondaryButtonProps>(
  ({ className, variant = "outline", size = "md", loading, children, ...props }, ref) => {
    const sizeClasses = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg"
    };

    const variantClasses = {
      outline: "btn-outline-ocean",
      ghost: "text-primary hover:bg-secondary/50 hover:text-primary",
      minimal: "text-primary hover:text-accent underline-offset-4 hover:underline"
    };

    return (
      <Button
        ref={ref}
        variant="ghost"
        className={cn(
          "font-semibold rounded-xl transition-ocean disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          loading && "opacity-75 cursor-not-allowed",
          className
        )}
        disabled={loading || props.disabled}
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

SecondaryButton.displayName = "SecondaryButton";

export default SecondaryButton;