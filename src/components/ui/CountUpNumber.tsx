import React, { useEffect, useMemo, useRef } from "react";
import { animate, useInView, useMotionValue, useReducedMotion } from "framer-motion";

export type CountUpNumberProps = {
  value: number | string;
  duration?: number;
  decimals?: number;
  startOnView?: boolean;
  className?: string;
  format?: (n: number) => string;
};

const easeOut: number[] = [0.16, 1, 0.3, 1];

function createFormatter(decimals: number): Intl.NumberFormat {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const CountUpNumber: React.FC<CountUpNumberProps> = ({
  value,
  duration = 1.2,
  decimals = 0,
  startOnView = true,
  className,
  format,
}) => {
  const targetNumber = useMemo(() => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }, [value]);

  const prefersReduced = useReducedMotion();
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const hasAnimatedRef = useRef(false);
  const lastTargetRef = useRef<number>(targetNumber);

  const count = useMotionValue(0);

  const numberFormatter = useMemo(() => createFormatter(decimals), [decimals]);
  const formatNumber = useMemo(() => {
    return (n: number) => {
      const clamped = Number.isFinite(n) ? n : 0;
      if (format) return format(clamped);
      return numberFormatter.format(clamped);
    };
  }, [format, numberFormatter]);

  // Update DOM text directly on motion value changes to avoid per-frame React renders
  useEffect(() => {
    const unsubscribe = count.on("change", (latest) => {
      if (!spanRef.current) return;
      spanRef.current.textContent = formatNumber(latest);
    });
    return () => unsubscribe();
  }, [count, formatNumber]);

  // Helper to set the text immediately
  const setImmediate = (n: number) => {
    count.set(n);
    if (spanRef.current) {
      spanRef.current.textContent = formatNumber(n);
    }
  };

  // Kick off the animation when eligible
  const inView = useInView(spanRef, { once: true, amount: 0.25 });

  useEffect(() => {
    // Always show final number immediately for reduced motion
    if (prefersReduced) {
      setImmediate(targetNumber);
      hasAnimatedRef.current = true;
      lastTargetRef.current = targetNumber;
      return;
    }

    // If the target is zero, do not animate; just show 0
    if (targetNumber === 0) {
      setImmediate(0);
      hasAnimatedRef.current = true;
      lastTargetRef.current = 0;
      return;
    }

    const readyToStart = startOnView ? inView : true;
    const targetChanged = lastTargetRef.current !== targetNumber;

    if (!readyToStart) {
      // Ensure we render 0 until visible
      if (!hasAnimatedRef.current && lastTargetRef.current !== 0) {
        setImmediate(0);
      }
      return;
    }

    // Determine the start value: if we have animated before, start from current
    const fromValue = hasAnimatedRef.current ? count.get() : 0;

    // No need to animate if the number hasn't changed and we've already animated
    if (hasAnimatedRef.current && !targetChanged) {
      return;
    }

    // Scale duration slightly based on the magnitude so bigger numbers take a touch longer
    const magnitude = Math.abs(targetNumber);
    const digits = magnitude < 1 ? 1 : Math.floor(Math.log10(magnitude)) + 1;
    const scaleFactor = Math.min(2.0, 1 + (digits - 1) * 0.15); // gentle scaling per extra digit
    const effectiveDuration = duration * scaleFactor;

    const controls = animate(count, targetNumber, {
      duration: effectiveDuration,
      ease: easeOut as any,
    });

    hasAnimatedRef.current = true;
    lastTargetRef.current = targetNumber;

    return () => {
      controls?.stop();
    };
    // We want to respond to visibility, incoming value, and reduced motion
  }, [inView, targetNumber, duration, prefersReduced, startOnView]);

  // Initialize text content on mount (before any animation starts)
  useEffect(() => {
    setImmediate(0);
  }, []);

  return (
    <span ref={spanRef} aria-live="polite" aria-atomic="true" className={className} />
  );
};

export default CountUpNumber;

