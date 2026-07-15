import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { useEditorStore } from "./store";
import { applyAppTheme } from "./theme";

applyAppTheme(useEditorStore.getState().theme);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
