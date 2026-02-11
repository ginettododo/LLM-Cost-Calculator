import { describe, it, expect } from "vitest";
import { getOpenAITokenDetails, countOpenAITokensExact } from "../src/core/tokenization/openaiTokenizer";

describe("OpenAI Tokenizer", () => {
    it("counts tokens correctly for simple text", () => {
        const text = "Hello world";
        const count = countOpenAITokensExact(text, "gpt-4o");
        expect(count).toBeGreaterThan(0);
    });

    it("handles empty string", () => {
        const count = countOpenAITokensExact("", "gpt-4o");
        expect(count).toBe(0);
    });

    it("maps byte offsets correctly for multi-byte characters (Emoji)", () => {
        const text = "Hello 🌍";
        const details = getOpenAITokenDetails(text, "gpt-4o");

        // "Hello " is likely one token or two. "🌍" is usually bytes.
        // Let's check the last token which should contain the emoji or part of it.
        // The emoji 🌍 is 4 bytes in UTF-8: F0 9F 8C 8D

        // We expect the details to contain accurate charStart/charEnd
        const lastToken = details[details.length - 1];
        expect(lastToken.text).toBeDefined();

        // Check if char indices are valid
        expect(lastToken.charStart).toBeLessThan(text.length);
        expect(lastToken.charEnd).toBeLessThanOrEqual(text.length);
    });

    it("maps byte offsets correctly for CJK characters", () => {
        const text = "こんにちは"; // 5 chars, 15 bytes
        const details = getOpenAITokenDetails(text, "gpt-4o");

        const lastToken = details[details.length - 1];
        expect(lastToken.charEnd).toBe(5);
    });

    it("handles large text (100k chars) without crashing", () => {
        const text = "a".repeat(100000);
        const start = performance.now();
        const count = countOpenAITokensExact(text, "gpt-4o");
        const end = performance.now();
        expect(count).toBeGreaterThan(0);
        console.log(`100k chars took ${end - start}ms`);
        expect(end - start).toBeLessThan(1000);
    });
});
