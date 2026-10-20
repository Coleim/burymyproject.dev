import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// The reset must come first: its `font: inherit` on html/body would otherwise
// wipe the font family set in index.css and everything fell back to Times.
import "./reset.css";
import "./index.css";
import { AppRouter } from "./routes/index.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
);
