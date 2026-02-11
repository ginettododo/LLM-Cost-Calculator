import { getOpenAITokenDetails, countOpenAITokensExact, clearOpenAITokenizerCache } from "./openaiTokenizer";

export type WorkerMessage =
    | { type: "count"; text: string; model: string; id: string }
    | { type: "details"; text: string; model: string; id: string }
    | { type: "clearCache" };

export type WorkerResponse =
    | { type: "countResult"; id: string; count: number; error?: string }
    | { type: "detailsResult"; id: string; details: any; error?: string };

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const msg = e.data;

    try {
        if (msg.type === "count") {
            const count = countOpenAITokensExact(msg.text, msg.model);
            self.postMessage({ type: "countResult", id: msg.id, count });
        } else if (msg.type === "details") {
            const details = getOpenAITokenDetails(msg.text, msg.model);
            self.postMessage({ type: "detailsResult", id: msg.id, details });
        } else if (msg.type === "clearCache") {
            clearOpenAITokenizerCache();
        }
    } catch (err) {
        self.postMessage({
            type: "countResult", // Generic failure response type for simplicity or specific error type
            id: (msg as any).id,
            count: 0,
            error: err instanceof Error ? err.message : String(err)
        });
    }
};
