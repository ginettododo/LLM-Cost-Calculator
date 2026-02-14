/* src/ui/components/base/Toggle.tsx */
import React from "react";

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    className?: string;
}

export const Toggle = ({ checked, onChange, label, className = "" }: ToggleProps) => {
    const toggleWidth = 44;
    const toggleHeight = 24;
    const knobSize = 20;
    const padding = 2;

    const containerStyle: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        cursor: "pointer",
        userSelect: "none",
    };

    const trackStyle: React.CSSProperties = {
        position: "relative",
        width: `${toggleWidth}px`,
        height: `${toggleHeight}px`,
        borderRadius: "999px",
        backgroundColor: checked ? "var(--color-primary-base)" : "var(--color-border-default)",
        transition: "background-color 0.2s ease",
    };

    const knobStyle: React.CSSProperties = {
        position: "absolute",
        top: `${padding}px`,
        left: checked ? `${toggleWidth - knobSize - padding}px` : `${padding}px`,
        width: `${knobSize}px`,
        height: `${knobSize}px`,
        borderRadius: "50%",
        backgroundColor: "white",
        boxShadow: "var(--shadow-sm)",
        transition: "left 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    };

    return (
        <div style={containerStyle} className={className} onClick={() => onChange(!checked)}>
            <div style={trackStyle}>
                <div style={knobStyle} />
            </div>
            {label && <span style={{ fontSize: "14px", color: "var(--color-text-primary)" }}>{label}</span>}
            <input type="checkbox" checked={checked} onChange={() => { }} style={{ display: "none" }} />
        </div>
    );
};
