import React, { useState } from 'react';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { TaylorUserSignUp } from '@/components/auth/TaylorUserSignUp';
import { TaylorUserLogin } from '@/components/auth/TaylorUserLogin';
import { Button } from '@/components/ui/button';
import '@/styles/modal.css';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserAuthModal = ({ isOpen, onClose }: UserAuthModalProps) => {
  const [isLoginMode, setIsLoginMode] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogContent className="fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-md max-h-[90vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border-2 border-gray-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
        <div className="pt-4">
          {/* Conditional rendering of forms */}
          {isLoginMode ? <TaylorUserLogin onClose={onClose} /> : <TaylorUserSignUp onClose={onClose} />}
          
          {/* Switch mode text */}
          <div className="text-center mt-6 text-sm text-muted-foreground">
            {isLoginMode ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => setIsLoginMode(false)}
                  className="text-secondary hover:text-secondary/80 font-semibold transition-colors duration-200"
                >
                  Sign up here
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setIsLoginMode(true)}
                  className="text-secondary hover:text-secondary/80 font-semibold transition-colors duration-200"
                >
                  Log in here
                </button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserAuthModal;