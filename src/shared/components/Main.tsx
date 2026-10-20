import type { ReactNode } from "react";

export const MAIN_ID = "main-content";

type MainProps = {
  className?: string;
  children: ReactNode;
};

export function Main({ className, children }: MainProps) {
  return (
    <main id={MAIN_ID} tabIndex={-1} className={className}>
      {children}
    </main>
  );
}
