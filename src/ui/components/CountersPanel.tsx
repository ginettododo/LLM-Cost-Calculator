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
    <div className="app__card">
      <h2>Live Counters</h2>
      <div className="app__grid">
        <div>
          <div className="app__label">Characters</div>
          <div className="app__value">{counters.characters}</div>
        </div>
        <div>
          <div className="app__label">Words</div>
          <div className="app__value">{counters.words}</div>
        </div>
        <div>
          <div className="app__label">Lines</div>
          <div className="app__value">{counters.lines}</div>
        </div>
        <div>
          <div className="app__label">Bytes</div>
          <div className="app__value">{counters.bytes}</div>
        </div>
      </div>
    </div>
  );
};

export default CountersPanel;
