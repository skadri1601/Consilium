"use client";

import { useState, useCallback, useRef } from "react";

interface StreamingOptions {
  url: string;
  onMessage?: (data: string) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export function useStreaming() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [data, setData] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    async ({ url, onMessage, onError, onComplete }: StreamingOptions) => {
      setIsStreaming(true);
      setData("");

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(url, {
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No reader available");
        }

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            onComplete?.();
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          setData((prev) => prev + chunk);
          onMessage?.(chunk);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          onError?.(error as Error);
        }
      } finally {
        setIsStreaming(false);
      }
    },
    []
  );

  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    isStreaming,
    data,
    startStream,
    stopStream,
  };
}
