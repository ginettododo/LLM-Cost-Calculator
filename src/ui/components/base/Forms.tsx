/* src/ui/components/base/Forms.tsx */
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, style, ...props }, ref) => {
        const containerStyle: React.CSSProperties = {
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            width: "100%",
        };

        const inputStyle: React.CSSProperties = {
            backgroundColor: "var(--color-bg-surface)",
            border: `1px solid ${error ? "var(--color-danger-text)" : "var(--color-border-default)"}`,
            borderRadius: "var(--radius-md)",
            padding: "8px 12px",
            color: "var(--color-text-primary)",
            fontSize: "14px",
            width: "100%",
            transition: "border-color 0.15s ease",
            ...style,
        };

        return (
            <div style={containerStyle}>
                {label && (
                    <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)" }}>
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    style={inputStyle}
                    {...props}
                />
                {error && (
                    <span style={{ fontSize: "12px", color: "var(--color-danger-text)" }}>{error}</span>
                )}
            </div>
        );
    }
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, style, children, ...props }, ref) => {
        const containerStyle: React.CSSProperties = {
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            width: "100%",
        };

        const selectStyle: React.CSSProperties = {
            backgroundColor: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-default)",
            borderRadius: "var(--radius-md)",
            padding: "8px 12px",
            color: "var(--color-text-primary)",
            fontSize: "14px",
            width: "100%",
            appearance: "none", // standard for custom arrows
            backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px top 50%",
            backgroundSize: "10px auto",
            paddingRight: "32px",
            ...style,
        };

        return (
            <div style={containerStyle}>
                {label && (
                    <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)" }}>
                        {label}
                    </label>
                )}
                <select ref={ref} style={selectStyle} {...props}>
                    {children}
                </select>
            </div>
        );
    }
);
