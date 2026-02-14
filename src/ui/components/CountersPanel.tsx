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
    <Card style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <h3
          style={{
            margin: 0,
            fontSize: "14px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--color-text-secondary)",
          }}
        >
          Live Counters
        </h3>
        <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
          Updated with each pause in typing.
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
        <CounterCard label="Characters" value={counters.characters} />
        <CounterCard label="Words" value={counters.words} />
        <CounterCard label="Lines" value={counters.lines} />
        <CounterCard label="Bytes" value={counters.bytes} />
      </div>
    </Card>
  );
};

const CounterCard = ({ label, value }: { label: string; value: number }) => (
  <div
    style={{
      padding: "12px",
      border: "1px solid var(--color-border-subtle)",
      borderRadius: "var(--radius-md)",
      backgroundColor: "var(--color-bg-subtle)",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    }}
  >
    <div
      style={{
        fontSize: "11px",
        color: "var(--color-text-secondary)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        fontWeight: 600,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: "20px",
        fontWeight: 700,
        color: "var(--color-text-primary)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value.toLocaleString()}
    </div>
  </div>
);

export default CountersPanel;
