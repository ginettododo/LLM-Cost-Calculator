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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
        <CounterCell label="Char" value={counters.characters} borderRight />
        <CounterCell label="Parole" value={counters.words} borderRight />
        <CounterCell label="Righe" value={counters.lines} borderRight />
        <CounterCell label="Byte" value={counters.bytes} />
      </div>
    </Card>
  );
};

const CounterCell = ({
  label,
  value,
  borderRight,
}: {
  label: string;
  value: number;
  borderRight?: boolean;
}) => (
  <div
    style={{
      padding: "8px 10px",
      borderRight: borderRight ? "1px solid var(--color-border-subtle)" : undefined,
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontSize: "10px",
        color: "var(--color-text-tertiary)",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        fontWeight: 600,
        marginBottom: "2px",
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: "15px",
        fontWeight: 700,
        color: "var(--color-text-primary)",
        fontVariantNumeric: "tabular-nums",
        lineHeight: 1,
      }}
    >
      {value.toLocaleString()}
    </div>
  </div>
);

export default CountersPanel;
