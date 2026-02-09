import { useEffect, useMemo, useRef, useState } from "react";
import { getProviderForModel } from "../../core/tokenizers";
import type { TokenCountResult } from "../../core/tokenizers";

type TokenCountState = {
  status: "idle" | "loading" | "ready" | "error";
  result?: TokenCountResult;
  error?: string;
};

type UseTokenCountsOptions = {
  text: string;
  modelIds: string[];
};

const tokenCountCache = new Map<string, TokenCountResult>();
const tokenCountInFlight = new Map<string, Promise<TokenCountResult>>();

const hashText = (text: string) => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `${(hash >>> 0).toString(16)}-${text.length}`;
};

const makeCacheKey = (textHash: string, modelId: string) =>
  `${textHash}:${modelId}`;

const getTokenCount = async (text: string, modelId: string) => {
  const textHash = hashText(text);
  const cacheKey = makeCacheKey(textHash, modelId);
  const cached = tokenCountCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const existingPromise = tokenCountInFlight.get(cacheKey);
  if (existingPromise) {
    return existingPromise;
  }

  const provider = getProviderForModel(modelId);
  const promise = provider.countTokens(text, modelId).then((result) => {
    tokenCountCache.set(cacheKey, result);
    tokenCountInFlight.delete(cacheKey);
    return result;
  });

  tokenCountInFlight.set(cacheKey, promise);
  return promise;
};

const scheduleIdle = (callback: () => void) => {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: 120 });
    return;
  }
  window.setTimeout(callback, 0);
};

const uniqueModelIds = (modelIds: string[]) =>
  Array.from(new Set(modelIds)).filter((modelId) => modelId.length > 0);

const useTokenCounts = ({ text, modelIds }: UseTokenCountsOptions) => {
  const [counts, setCounts] = useState<Record<string, TokenCountState>>({});
  const queueRef = useRef<string[]>([]);
  const processingRef = useRef(false);
  const activeTextHashRef = useRef<string>("");

  const textHash = useMemo(() => hashText(text), [text]);

  useEffect(() => {
    activeTextHashRef.current = textHash;
  }, [textHash]);

  useEffect(() => {
    const ids = uniqueModelIds(modelIds);
    const nextCounts: Record<string, TokenCountState> = {};
    const pending: string[] = [];

    ids.forEach((modelId) => {
      const cacheKey = makeCacheKey(textHash, modelId);
      const cached = tokenCountCache.get(cacheKey);
      if (cached) {
        nextCounts[modelId] = { status: "ready", result: cached };
      } else {
        nextCounts[modelId] = { status: "loading" };
        pending.push(modelId);
      }
    });

    setCounts(nextCounts);
    queueRef.current = pending;
    processingRef.current = false;

    const processQueue = () => {
      if (processingRef.current) {
        return;
      }
      processingRef.current = true;

      const runNext = () => {
        const modelId = queueRef.current.shift();
        if (!modelId) {
          processingRef.current = false;
          return;
        }

        const currentHash = activeTextHashRef.current;
        scheduleIdle(() => {
          getTokenCount(text, modelId)
            .then((result) => {
              if (activeTextHashRef.current !== currentHash) {
                return;
              }
              setCounts((prev) => ({
                ...prev,
                [modelId]: { status: "ready", result },
              }));
            })
            .catch((error: Error) => {
              if (activeTextHashRef.current !== currentHash) {
                return;
              }
              setCounts((prev) => ({
                ...prev,
                [modelId]: {
                  status: "error",
                  error: error.message,
                },
              }));
            })
            .finally(() => {
              runNext();
            });
        });
      };

      runNext();
    };

    processQueue();
  }, [modelIds, text, textHash]);

  return {
    counts,
  };
};

export type { TokenCountState };
export default useTokenCounts;
