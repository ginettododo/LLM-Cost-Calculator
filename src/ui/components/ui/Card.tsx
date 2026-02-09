import type { HTMLAttributes } from "react";
import classNames from "./classNames";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "subtle" | "inset";
};

const Card = ({ variant = "default", className, ...props }: CardProps) => {
  return (
    <div
      className={classNames("ui-card", `ui-card--${variant}`, className)}
      {...props}
    />
  );
};

export default Card;
