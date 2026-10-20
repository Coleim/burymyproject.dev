import { useEffect } from "react";

const SITE_NAME = "burymyproject.dev";
export const DEFAULT_TITLE = `${SITE_NAME} — Bury your dead projects`;

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE;
  }, [title]);
}
