import Card from "./ui/Card";

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
    <Card className="app__stats-card" variant="inset">
      <div className="app__card-header">
        <h3>Live Counters</h3>
        <span className="app__muted">Updated with each pause in typing.</span>
      </div>
      <div className="app__stats-grid">
        <div className="app__stats-item">
          <div className="app__label">Characters</div>
          <div className="app__value">{counters.characters}</div>
        </div>
        <div className="app__stats-item">
          <div className="app__label">Words</div>
          <div className="app__value">{counters.words}</div>
        </div>
        <div className="app__stats-item">
          <div className="app__label">Lines</div>
          <div className="app__value">{counters.lines}</div>
        </div>
        <div className="app__stats-item">
          <div className="app__label">Bytes</div>
          <div className="app__value">{counters.bytes}</div>
        </div>
      </div>
    </Card>
  );
};

export default CountersPanel;
