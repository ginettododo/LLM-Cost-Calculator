type PricingModel = {
  provider: string;
  model: string;
  release_date?: string;
  input_per_mtok: number;
  output_per_mtok?: number;
  currency: "USD";
  source_url: string;
  retrieved_at: string;
};

type PricingTableProps = {
  models: PricingModel[];
};

const PricingTable = ({ models }: PricingTableProps) => {
  return (
    <div className="app__table-wrapper">
      <table className="app__table">
        <thead>
          <tr>
            <th>Provider</th>
            <th>Model</th>
            <th>Release Date</th>
            <th>Input $/1M</th>
            <th>Output $/1M</th>
            <th>Accuracy</th>
            <th>Cost (input)</th>
          </tr>
        </thead>
        <tbody>
          {models.map((model) => (
            <tr key={`${model.provider}-${model.model}`}>
              <td>{model.provider}</td>
              <td>{model.model}</td>
              <td>{model.release_date ?? "—"}</td>
              <td>{model.input_per_mtok.toFixed(2)}</td>
              <td>{model.output_per_mtok ? model.output_per_mtok.toFixed(2) : "—"}</td>
              <td>Estimated</td>
              <td>TBD</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PricingTable;
