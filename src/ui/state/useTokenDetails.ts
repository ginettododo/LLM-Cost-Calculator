import { useState, useEffect, useRef } from "react";
import { getOpenAITokenDetailsAsync } from "../../core/tokenization/openaiTokenizer";
import type { OpenAITokenDetail } from "../../core/tokenization/openaiTokenizer";
import type { PricingRow } from "../../core";

export const useTokenDetails = (
    text: string,
    model: PricingRow | undefined,
    isEnabled: boolean
): OpenAITokenDetail[] => {
    const [details, setDetails] = useState<OpenAITokenDetail[]>([]);

    const latestTextRef = useRef(text);
    const latestModelRef = useRef(model);
    const latestEnabledRef = useRef(isEnabled);

    useEffect(() => {
        latestTextRef.current = text;
        latestModelRef.current = model;
        latestEnabledRef.current = isEnabled;
    }, [text, model, isEnabled]);

    useEffect(() => {
        if (!isEnabled || !model) {
            setDetails([]);
            return;
        }

        if (model.provider.toLowerCase() !== "openai") {
            setDetails([]);
            return;
        }

        let isMounted = true;
        const controller = new AbortController();

        const timer = setTimeout(async () => {
            try {
                const currentText = latestTextRef.current;
                const currentModel = latestModelRef.current;

                if (!currentText || !currentModel) {
                    if (isMounted) setDetails([]);
                    return;
                }

                // If text is very short (< 1000 chars), we could potentially do it sync to avoid flash,
                // but keeping it async ensures consistent non-blocking behavior.
                const tokenDetails = await getOpenAITokenDetailsAsync(
                    currentText,
                    currentModel.model_id ?? currentModel.model
                );

                if (!isMounted) return;

                if (currentText !== latestTextRef.current) return;

                setDetails(tokenDetails);
            } catch (err) {
                console.error("Failed to get token details", err);
                if (isMounted) setDetails([]);
            }
        }, 150);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            controller.abort();
        };
    }, [text, model, isEnabled]);

    return details;
};
