/* src/ui/components/base/Table.tsx */
import React from "react";

export const TableShell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    return (
        <div className={`overflow-x-auto ${className}`} style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border-subtle)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "700px" }}>
                {children}
            </table>
        </div>
    );
};

export const TableHeader = ({ children }: { children: React.ReactNode }) => {
    return (
        <thead style={{ backgroundColor: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-default)" }}>
            {children}
        </thead>
    );
};

export const TableRow = ({ children, isZebra }: { children: React.ReactNode; isZebra?: boolean }) => {
    return (
        <tr
            style={{
                borderBottom: "1px solid var(--color-border-subtle)",
                backgroundColor: isZebra ? "var(--color-bg-subtle)" : "transparent",
            }}
        >
            {children}
        </tr>
    );
};

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
    align?: "left" | "right" | "center";
}

export const TableHead = ({ children, className = "", align = "left", style, ...props }: TableHeadProps) => {
    return (
        <th
            className={className}
            style={{
                textAlign: align,
                padding: "12px 16px",
                fontSize: "12px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--color-text-secondary)",
                whiteSpace: "nowrap",
                ...style,
            }}
            {...props}
        >
            {children}
        </th>
    );
};

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
    align?: "left" | "right" | "center";
    mono?: boolean;
}

export const TableCell = ({ children, className = "", align = "left", mono = false, style, ...props }: TableCellProps) => {
    return (
        <td
            className={className}
            style={{
                textAlign: align,
                padding: "12px 16px",
                color: "var(--color-text-primary)",
                fontFamily: mono ? "var(--font-family-mono)" : "inherit",
                ...style,
            }}
            {...props}
        >
            {children}
        </td>
    );
};
