import type { ReactNode } from "react";
import classNames from "./classNames";

type PopoverProps = {
  isOpen: boolean;
  trigger: ReactNode;
  children: ReactNode;
  panelLabel: string;
  panelId?: string;
  align?: "start" | "end";
  panelRole?: "dialog" | "menu";
};

const Popover = ({
  isOpen,
  trigger,
  children,
  panelLabel,
  panelId,
  align = "end",
  panelRole = "dialog",
}: PopoverProps) => {
  return (
    <div className="ui-popover">
      {trigger}
      {isOpen ? (
        <div
          className={classNames("ui-popover__panel", `ui-popover__panel--${align}`)}
          role={panelRole}
          aria-label={panelLabel}
          id={panelId}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
};

export default Popover;
