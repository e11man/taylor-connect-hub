import { useEffect } from 'react';

/**
 * Hook to fix mobile input issues including:
 * - Double-tap requirements
 * - Text not appearing when typing
 * - Input focus zoom on iOS
 * - Touch event delays
 */
export const useMobileInputFix = () => {
  useEffect(() => {
    // Check if we're on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (!isMobile) return;

    // Add viewport meta tag to prevent zoom on input focus
    let viewport = document.querySelector('meta[name="viewport"]');
    const originalContent = viewport?.getAttribute('content') || '';
    
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
    } else {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0';
      document.head.appendChild(viewport);
    }

    // Add CSS fixes
    const style = document.createElement('style');
    style.innerHTML = `
      /* Mobile input fixes */
      input, textarea, select, button {
        -webkit-appearance: none !important;
        -webkit-tap-highlight-color: transparent !important;
        touch-action: manipulation !important;
      }
      
      input[type="text"],
      input[type="email"],
      input[type="password"],
      input[type="tel"],
      input[type="number"],
      textarea {
        font-size: 16px !important;
        -webkit-user-select: text !important;
        user-select: text !important;
      }
      
      /* Fix for input lag */
      input {
        -webkit-transform: translate3d(0, 0, 0);
        transform: translate3d(0, 0, 0);
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
      }
      
      /* Prevent double-tap delay */
      button, [role="button"] {
        touch-action: manipulation !important;
        -webkit-touch-callout: none !important;
      }
    `;
    document.head.appendChild(style);

    // Fix for iOS input issues
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      }, { passive: true });
      
      input.addEventListener('focus', (e) => {
        // Force iOS to properly focus the input
        setTimeout(() => {
          (e.target as HTMLInputElement).style.fontSize = '16px';
        }, 0);
      });
    });

    // Cleanup function
    return () => {
      if (viewport && originalContent) {
        viewport.setAttribute('content', originalContent);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);
};