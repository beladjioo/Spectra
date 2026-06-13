// Tiny History-API router. Every view has a stable, shareable URL:
//   /            journey        /console   free-tuning console
//   /mission/:id mission        /map       coverage map
//   /library/:slug note         /exam      exam prep
// The locale travels as ?lang=fr|en so a shared link opens in the sharer's
// language. Paths are also pre-rendered at build time for crawlers, so keep
// pathFor() in sync with tools/prerender.mjs.

import { useEffect, useState } from "react";

export type Route =
  | { view: "home" }
  | { view: "console" }
  | { view: "map" }
  | { view: "exam" }
  | { view: "library"; slug: string }
  | { view: "mission"; id: string };

export function parse(pathname: string): Route {
  const seg = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  // a leading /en or /fr is a locale prefix (prerendered SEO entry points);
  // strip it — the locale itself is resolved by i18n
  if (seg[0] === "en" || seg[0] === "fr") seg.shift();
  switch (seg[0]) {
    case undefined:
      return { view: "home" };
    case "console":
      return { view: "console" };
    case "map":
      return { view: "map" };
    case "exam":
      return { view: "exam" };
    case "library":
      return seg[1] ? { view: "library", slug: decodeURIComponent(seg[1]) } : { view: "library", slug: "" };
    case "mission":
      return seg[1] ? { view: "mission", id: decodeURIComponent(seg[1]) } : { view: "home" };
    default:
      return { view: "home" };
  }
}

export function pathFor(r: Route): string {
  switch (r.view) {
    case "home":
      return "/";
    case "console":
    case "map":
    case "exam":
      return `/${r.view}`;
    case "library":
      return r.slug ? `/library/${encodeURIComponent(r.slug)}` : "/library";
    case "mission":
      return `/mission/${encodeURIComponent(r.id)}`;
  }
}

/** Current ?lang=… (and only it) is carried along on every navigation. */
function search(): string {
  const lang = new URLSearchParams(window.location.search).get("lang");
  return lang ? `?lang=${lang}` : "";
}

const NAV_EVENT = "ohz-nav";

export function navigate(to: Route, opts: { replace?: boolean } = {}) {
  const url = pathFor(to) + search();
  if (opts.replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
  window.dispatchEvent(new Event(NAV_EVENT));
}

/** Reflect (or set) the locale in the URL without touching history length. */
export function setUrlLang(lang: string) {
  const u = new URL(window.location.href);
  u.searchParams.set("lang", lang);
  window.history.replaceState(null, "", u.pathname + u.search);
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(window.location.pathname));
  useEffect(() => {
    const sync = () => setRoute(parse(window.location.pathname));
    window.addEventListener("popstate", sync);
    window.addEventListener(NAV_EVENT, sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener(NAV_EVENT, sync);
    };
  }, []);
  return route;
}
