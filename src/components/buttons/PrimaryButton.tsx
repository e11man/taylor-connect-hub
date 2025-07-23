import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ocean" | "glow" | "wave";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ className, variant = "ocean", size = "md", loading, children, ...props }, ref) => {
    const sizeClasses = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg"
    };

    const variantClasses = {
      ocean: "btn-ocean",
      glow: "btn-ocean animate-glow-pulse",
      wave: "btn-wave"
    };

    return (
      <Button
        ref={ref}
        className={cn(
          "font-semibold rounded-xl transition-spring hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed",
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

PrimaryButton.displayName = "PrimaryButton";

export default PrimaryButton;