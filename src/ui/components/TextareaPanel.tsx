type TextareaPanelProps = {
  value: string;
  onChange: (value: string) => void;
};

const TextareaPanel = ({ value, onChange }: TextareaPanelProps) => {
  return (
    <div className="app__card">
      <div className="app__card-header">
        <h2>Input Text</h2>
        <button
          type="button"
          className="app__button"
          onClick={() => onChange("")}
          disabled={!value}
        >
          Clear
        </button>
      </div>
      <textarea
        className="app__textarea"
        placeholder="Paste or type text to estimate tokens and cost."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={10}
      />
      <div className="app__hint">Character limit: none (soft hint only).</div>
    </div>
  );
};

export default TextareaPanel;
