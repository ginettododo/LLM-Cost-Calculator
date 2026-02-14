/* src/ui/components/base/Tooltip.tsx */
import React, { useState } from "react";

export const Tooltip = ({ content, children }: { content: string; children: React.ReactNode }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            style={{ position: "relative", display: "inline-flex" }}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div
                    role="tooltip"
                    style={{
                        position: "absolute",
                        bottom: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        marginBottom: "8px",
                        padding: "6px 10px",
                        backgroundColor: "var(--color-text-inverse)",
                        color: "var(--color-bg-base)",
                        fontSize: "12px",
                        borderRadius: "var(--radius-md)",
                        whiteSpace: "nowrap",
                        boxShadow: "var(--shadow-lg)",
                        zIndex: 50,
                        pointerEvents: "none",
                    }}
                >
                    {content}
                    {/* Arrow */}
                    <div
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: "50%",
                            marginLeft: "-4px",
                            borderWidth: "4px",
                            borderStyle: "solid",
                            borderColor: "var(--color-text-inverse) transparent transparent transparent",
                        }}
                    />
                </div>
            )}
        </div>
    );
};
