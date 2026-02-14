import React from "react";

type BadgeVariant = "default" | "success" | "warning" | "neutral" | "exact" | "estimated";

export const Badge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: BadgeVariant }) => {
    const style: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: "var(--radius-full)",
        fontSize: "12px",
        fontWeight: 500,
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...getBadgeStyles(variant),
    };

    return <span style={style}>{children}</span>;
};

function getBadgeStyles(variant: BadgeVariant): React.CSSProperties {
    switch (variant) {
        case "success":
        case "exact":
            return { backgroundColor: "var(--color-success-bg)", color: "var(--color-success-text)" };
        case "warning":
        case "estimated":
            return { backgroundColor: "var(--color-warning-bg)", color: "var(--color-warning-text)" };
        case "neutral":
            return { backgroundColor: "var(--color-bg-subtle)", color: "var(--color-text-secondary)" };
        default:
            return { backgroundColor: "var(--color-primary-base)", color: "var(--color-primary-fg)" };
    }
}
