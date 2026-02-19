import { Card } from "./base";

type Counters = {
  characters: number;
  words: number;
  lines: number;
  bytes: number;
};

type CountersPanelProps = {
  counters: Counters;
};

const CountersPanel = ({ counters }: CountersPanelProps) => {
  return (
    <Card noPadding style={{ overflow: "hidden" }}>
      {/* Panel header */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--color-border-subtle)",
          backgroundColor: "var(--color-bg-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Text Counters
        </span>
        <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
          live
        </span>
      </div>

      {/* Counter grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <CounterCell label="Characters" value={counters.characters} borderRight borderBottom />
        <CounterCell label="Words" value={counters.words} borderBottom />
        <CounterCell label="Lines" value={counters.lines} borderRight />
        <CounterCell label="UTF-8 Bytes" value={counters.bytes} />
      </div>
    </Card>
  );
};

const CounterCell = ({
  label,
  value,
  borderRight,
  borderBottom,
}: {
  label: string;
  value: number;
  borderRight?: boolean;
  borderBottom?: boolean;
}) => (
  <div
    style={{
      padding: "14px 16px",
      borderRight: borderRight ? "1px solid var(--color-border-subtle)" : undefined,
      borderBottom: borderBottom ? "1px solid var(--color-border-subtle)" : undefined,
    }}
  >
    <div
      style={{
        fontSize: "11px",
        color: "var(--color-text-tertiary)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        fontWeight: 600,
        marginBottom: "4px",
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: "22px",
        fontWeight: 700,
        color: "var(--color-text-primary)",
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}
    >
      {value.toLocaleString()}
    </div>
  </div>
);

export default CountersPanel;
