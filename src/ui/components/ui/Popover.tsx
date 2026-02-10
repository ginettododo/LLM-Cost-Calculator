import { useEffect, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import classNames from "./classNames";

type PopoverProps = {
  isOpen: boolean;
  onClose?: () => void;
  trigger: ReactNode;
  children: ReactNode;
  panelLabel: string;
  panelId?: string;
  align?: "start" | "end";
  panelRole?: "dialog" | "menu";
};

const Popover = ({
  isOpen,
  onClose,
  trigger,
  children,
  panelLabel,
  panelId,
  align = "end",
  panelRole = "dialog",
}: PopoverProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleOutsideClick = useCallback(
    (event: MouseEvent) => {
      if (
        isOpen &&
        onClose &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    },
    [isOpen, onClose],
  );

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (isOpen && onClose && event.key === "Escape") {
        onClose();
      }
    },
    [isOpen, onClose],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, handleOutsideClick, handleEscape]);

  return (
    <div className="ui-popover" ref={containerRef}>
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
