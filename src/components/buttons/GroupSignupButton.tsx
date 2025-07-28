import { Button } from "@/components/ui/button";
import { Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupSignupButtonProps {
  selectedCount: number;
  onSubmit: () => void;
  isLoading: boolean;
  disabled?: boolean;
  className?: string;
}

export const GroupSignupButton = ({ 
  selectedCount, 
  onSubmit, 
  isLoading, 
  disabled,
  className
}: GroupSignupButtonProps) => {
  const isDisabled = disabled || selectedCount === 0 || isLoading;
  
  return (
    <Button
      onClick={onSubmit}
      disabled={isDisabled}
      className={cn(
        // Base styles
        "w-full sm:w-auto min-w-[200px] sm:min-w-[250px]",
        // Theme colors - using accent (orange) for primary actions
        "bg-accent text-accent-foreground font-semibold",
        "hover:bg-accent/90 hover:scale-[1.02]",
        // Transitions and effects
        "transition-all duration-200 ease-in-out",
        "shadow-md hover:shadow-lg",
        // Disabled states
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        // Sizing - responsive padding
        "py-3 px-4 sm:px-6 text-sm sm:text-base",
        "rounded-xl",
        // Flex layout
        "inline-flex items-center justify-center gap-2",
        // Focus states
        "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
        className
      )}
      variant="default"
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="whitespace-nowrap">
            {selectedCount === 0 
              ? "Select People to Sign Up" 
              : `Sign Up ${selectedCount} ${selectedCount === 1 ? 'Person' : 'People'}`
            }
          </span>
        </>
      )}
    </Button>
  );
};