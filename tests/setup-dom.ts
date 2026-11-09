/* Test bootstrap: a jsdom window standing in for the browser.
 * Runs before the test module (tsx --import ordering). jsdom has
 * no layout, so the two geometry calls the highlight components
 * make are stubbed to fixed, sane values — the tests here assert
 * state and paint, never pixels. */
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});

const w = dom.window as unknown as Record<string, unknown>;
const g = globalThis as unknown as Record<string, unknown>;

for (const key of [
  "document",
  "localStorage",
  "HTMLElement",
  "HTMLSpanElement",
  "Node",
  "Text",
  "Range",
  "Event",
  "MouseEvent",
  "KeyboardEvent",
  "CustomEvent",
  "DOMException",
  "getComputedStyle",
  "requestAnimationFrame",
  "cancelAnimationFrame",
]) {
  if (w[key] !== undefined) {
    try {
      g[key] = w[key];
    } catch {
      Object.defineProperty(g, key, { value: w[key], configurable: true });
    }
  }
}
try {
  Object.defineProperty(g, "navigator", {
    value: dom.window.navigator,
    configurable: true,
  });
} catch {
  /* a getter-only navigator on globalThis is already jsdom-free
   * Node's own — the components only read userAgent-free APIs */
}
g.window = dom.window;
g.document = dom.window.document;
g.IS_REACT_ACT_ENVIRONMENT = true;

// Geometry stubs (jsdom has no layout engine).
const rect = {
  left: 40,
  top: 200,
  right: 140,
  bottom: 224,
  width: 100,
  height: 24,
  x: 40,
  y: 200,
  toJSON: () => ({}),
};
dom.window.Range.prototype.getBoundingClientRect =
  function getBoundingClientRect() {
    return rect as DOMRect;
  };
dom.window.HTMLElement.prototype.getBoundingClientRect =
  function getBoundingClientRect() {
    return rect as DOMRect;
  };
dom.window.HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
dom.window.matchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});
Object.defineProperty(dom.window.document.documentElement, "clientWidth", {
  value: 390,
  configurable: true,
});
Object.defineProperty(dom.window.document.documentElement, "clientHeight", {
  value: 844,
  configurable: true,
});
