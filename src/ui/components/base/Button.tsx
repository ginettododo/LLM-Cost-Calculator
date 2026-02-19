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
    ({ className = "", variant = "secondary", size = "md", isLoading, leftIcon, children, style, ...props }, ref) => {

        const style_: React.CSSProperties = {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 500,
            cursor: props.disabled || isLoading ? "not-allowed" : "pointer",
            border: "1px solid transparent",
            transition: "background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease",
            opacity: props.disabled ? 0.5 : 1,
            flexShrink: 0,
            ...getVariantStyles(variant),
            ...getSizeStyles(size),
            ...style,
        };

        const variantClass = `btn-${variant}`;

        return (
            <button
                ref={ref}
                style={style_}
                className={`${variantClass} ${className}`}
                disabled={props.disabled || isLoading}
                {...props}
            >
                {isLoading && (
                    <span style={{ marginRight: 8, display: "inline-block", width: 14, height: 14 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" style={{ animation: "spin 0.8s linear infinite", width: "100%", height: "100%" }}>
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                    </span>
                )}
                {!isLoading && leftIcon && <span style={{ marginRight: 6, display: "flex", alignItems: "center" }}>{leftIcon}</span>}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";

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
            return { fontSize: "12px", padding: "4px 10px", height: "28px", gap: "4px" };
        case "md":
            return { fontSize: "14px", padding: "6px 14px", height: "34px", gap: "6px" };
        case "lg":
            return { fontSize: "15px", padding: "10px 22px", height: "42px", gap: "8px" };
        default:
            return {};
    }
}
