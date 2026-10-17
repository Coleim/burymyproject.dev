import styles from "./LinkButton.module.css";

type ButtonProps = {
  variant?: "primary" | "secondary" | "accent";
  size?: "sm" | "md" | "lg";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "primary",
  size = "sm",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${styles[`button-${variant}`]} ${styles[`button-${size}`]} ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
