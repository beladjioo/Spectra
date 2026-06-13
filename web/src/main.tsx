import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { I18nProvider } from "./lib/i18n";
import "./index.css";

// Cloudflare Web Analytics — cookieless, no PII. Loads only when a token is
// configured at build time (VITE_CF_BEACON); otherwise the cleanest path is to
// enable Web Analytics for the openhertz.org zone in the dashboard, which
// injects the beacon at the edge with zero code. See README.
const beacon = import.meta.env.VITE_CF_BEACON;
if (beacon) {
  const s = document.createElement("script");
  s.defer = true;
  s.src = "https://static.cloudflareinsights.com/beacon.min.js";
  s.setAttribute("data-cf-beacon", JSON.stringify({ token: beacon }));
  document.head.appendChild(s);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>,
);
