import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// A client-side navigation keeps the previous page's scroll offset. Start new
// pages at the top; Back/forward (POP) is left to each page, which knows how
// to restore its own position once its content has loaded.
export function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType !== "POP") window.scrollTo(0, 0);
  }, [pathname, navigationType]);

  return null;
}
