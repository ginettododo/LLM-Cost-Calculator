import type { ButtonHTMLAttributes } from "react";
import classNames from "./classNames";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "subtle" | "ghost" | "warning";
  size?: "sm" | "md";
  iconOnly?: boolean;
};

const Button = ({
  variant = "subtle",
  size = "md",
  iconOnly = false,
  className,
  type = "button",
  ...props
}: ButtonProps) => {
  return (
    <button
      type={type}
      className={classNames(
        "ui-button",
        `ui-button--${variant}`,
        `ui-button--${size}`,
        iconOnly && "ui-button--icon",
        className,
      )}
      {...props}
    />
  );
};

export default Button;
