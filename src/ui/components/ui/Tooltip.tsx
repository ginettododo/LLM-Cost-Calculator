import { useId } from "react";
import type { ReactNode } from "react";
import classNames from "./classNames";

type TooltipProps = {
  content: string;
  children: ReactNode;
  className?: string;
};

const Tooltip = ({ content, children, className }: TooltipProps) => {
  const tooltipId = useId();

  return (
    <span className={classNames("ui-tooltip", className)}>
      <span className="ui-tooltip__trigger" tabIndex={0} aria-describedby={tooltipId}>
        {children}
      </span>
      <span id={tooltipId} role="tooltip" className="ui-tooltip__content">
        {content}
      </span>
    </span>
  );
};

export default Tooltip;
