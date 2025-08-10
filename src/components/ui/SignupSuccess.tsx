import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

interface SignupSuccessProps {
  visible: boolean;
  title?: string;
  description?: string;
  icon?: ReactNode;
}

export function SignupSuccess({ visible, title, description, icon }: SignupSuccessProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 animate-success-pop">
        <div className="flex items-center gap-3">
          <div className="animate-ripple rounded-full">
            {icon ?? <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-[#00AFCE]" />}
          </div>
          <div>
            <h4 className="font-montserrat font-bold text-primary text-lg sm:text-xl">{title ?? 'Signed Up'}</h4>
            <p className="text-muted-foreground text-sm">{description ?? "You're confirmed for this event."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

