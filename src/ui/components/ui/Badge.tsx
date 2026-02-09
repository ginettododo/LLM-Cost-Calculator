import type { HTMLAttributes } from "react";
import classNames from "./classNames";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning";
};

const Badge = ({ tone = "neutral", className, ...props }: BadgeProps) => {
  return (
    <span
      className={classNames("ui-badge", `ui-badge--${tone}`, className)}
      {...props}
    />
  );
};

export default Badge;
