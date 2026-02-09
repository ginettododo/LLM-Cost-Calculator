import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

const TableShell = ({ children }: { children: ReactNode }) => {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const shell = shellRef.current;
    const scroll = scrollRef.current;
    if (!shell || !scroll) {
      return;
    }

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scroll;
      shell.dataset.scrollLeft = scrollLeft > 0 ? "true" : "false";
      shell.dataset.scrollRight =
        scrollLeft + clientWidth < scrollWidth - 1 ? "true" : "false";
    };

    update();
    scroll.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      scroll.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className="ui-table-shell"
      data-scroll-left="false"
      data-scroll-right="true"
      ref={shellRef}
    >
      <div className="ui-table-shell__scroll" ref={scrollRef}>
        {children}
      </div>
    </div>
  );
};

export default TableShell;
