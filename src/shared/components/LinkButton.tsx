import { Link } from "react-router-dom";
import styles from "./LinkButton.module.css";

type LinkButtonProps = {
  to: string;
  variant?: "primary" | "secondary" | "accent";
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  size?: "sm" | "md" | "lg";
} & Omit<React.ComponentProps<typeof Link>, "to" | "className">;

export function LinkButton({
  to,
  variant = "primary",
  children,
  className,
  ariaLabel,
  size = "sm",
  ...props
}: LinkButtonProps) {
  return (
    <Link
      to={to}
      className={`${styles[`button-${variant}`]} ${styles[`button-${size}`]} ${className ?? ""}`}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </Link>
  );
}
