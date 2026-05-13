import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export const Button = ({ children, className = "", ...props }: ButtonProps) => {
  return (
    <button className={`button ${className}`.trim()} {...props}>
      {children}
    </button>
  );
};

