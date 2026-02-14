import React from "react";
import "../../styles/tokens.css";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "icon";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = "", variant = "secondary", size = "md", isLoading, leftIcon, children, ...props }, ref) => {

        // Inline styles for lack of Tailwind
        const style: React.CSSProperties = {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 500,
            cursor: props.disabled || isLoading ? "not-allowed" : "pointer",
            border: "1px solid transparent",
            transition: "all 0.15s ease",
            opacity: props.disabled ? 0.6 : 1,
            ...getVariantStyles(variant),
            ...getSizeStyles(size),
        };

        return (
            <button ref={ref} style={style} className={className} disabled={props.disabled || isLoading} {...props}>
                {isLoading && <span style={{ marginRight: 8 }}>...</span>}
                {!isLoading && leftIcon && <span style={{ marginRight: 6, display: "flex" }}>{leftIcon}</span>}
                {children}
            </button>
        );
    }
);

function getVariantStyles(variant: ButtonVariant): React.CSSProperties {
    switch (variant) {
        case "primary":
            return {
                backgroundColor: "var(--color-primary-base)",
                color: "var(--color-primary-fg)",
                borderColor: "transparent",
                borderRadius: "var(--radius-md)",
            };
        case "secondary":
            return {
                backgroundColor: "var(--color-bg-surface)",
                color: "var(--color-text-primary)",
                borderColor: "var(--color-border-default)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-sm)",
            };
        case "ghost":
            return {
                backgroundColor: "transparent",
                color: "var(--color-text-secondary)",
                borderColor: "transparent",
                borderRadius: "var(--radius-md)",
            };
        case "danger":
            return {
                backgroundColor: "var(--color-danger-bg)",
                color: "var(--color-danger-text)",
                borderColor: "var(--color-danger-bg)",
                borderRadius: "var(--radius-md)",
            };
        case "icon":
            return {
                backgroundColor: "transparent",
                color: "var(--color-text-secondary)",
                borderColor: "transparent",
                padding: "var(--space-2)",
                borderRadius: "var(--radius-md)",
            }
        default:
            return {};
    }
}

function getSizeStyles(size: ButtonSize): React.CSSProperties {
    switch (size) {
        case "sm":
            return { fontSize: "12px", padding: "4px 10px", height: "28px" };
        case "md":
            return { fontSize: "14px", padding: "8px 16px", height: "36px" };
        case "lg":
            return { fontSize: "16px", padding: "12px 24px", height: "44px" };
        default:
            return {};
    }
}
