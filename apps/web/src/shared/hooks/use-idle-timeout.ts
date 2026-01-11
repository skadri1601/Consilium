"use client";

import { useEffect, useRef, useState } from "react";

interface UseIdleTimeoutOptions {
  timeout: number; // in milliseconds
  onIdle?: () => void;
  onWarning?: () => void;
  warningTime?: number; // time before idle to show warning
  events?: string[]; // events to listen to
}

export function useIdleTimeout({
  timeout,
  onIdle,
  onWarning,
  warningTime = 60000, // 1 minute before idle
  events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"],
}: UseIdleTimeoutOptions) {
  const [isIdle, setIsIdle] = useState(false);
  const [timeUntilIdle, setTimeUntilIdle] = useState(timeout);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    const resetTimer = () => {
      lastActivityRef.current = Date.now();
      setIsIdle(false);
      setTimeUntilIdle(timeout);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }

      // Set warning timeout
      if (onWarning && warningTime < timeout) {
        warningTimeoutRef.current = setTimeout(() => {
          onWarning();
        }, timeout - warningTime);
      }

      // Set idle timeout
      timeoutRef.current = setTimeout(() => {
        setIsIdle(true);
        onIdle?.();
      }, timeout);
    };

    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [timeout, onIdle, onWarning, warningTime, events]);

  return { isIdle, timeUntilIdle };
}

