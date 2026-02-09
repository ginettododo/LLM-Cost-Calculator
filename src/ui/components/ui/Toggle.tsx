import type { InputHTMLAttributes } from "react";
import classNames from "./classNames";

type ToggleProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  description?: string;
};

const Toggle = ({ label, description, className, id, ...props }: ToggleProps) => {
  return (
    <label className={classNames("ui-toggle", className)} htmlFor={id}>
      <input id={id} type="checkbox" className="ui-toggle__input" {...props} />
      <span className="ui-toggle__control" aria-hidden="true" />
      <span className="ui-toggle__text">
        <span>{label}</span>
        {description ? (
          <span className="ui-toggle__description">{description}</span>
        ) : null}
      </span>
    </label>
  );
};

export default Toggle;
