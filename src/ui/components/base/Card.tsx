import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}

export const Card = ({ children, className = "", noPadding = false, style, ...props }: CardProps) => {
    const defaultStyle: React.CSSProperties = {
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        padding: noPadding ? 0 : "var(--space-6)",
        overflow: "hidden",
        ...style,
    };

    return (
        <div style={defaultStyle} className={className} {...props}>
            {children}
        </div>
    );
};
