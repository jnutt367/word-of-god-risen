/* The tests run under tsx with jsdom installed --no-save (the
 * same arrangement as tonight's first highlighting tests): jsdom
 * ships no TypeScript declarations, and these two lines are all
 * the tests need from it. Test-only — the app never imports this. */
declare module "jsdom" {
  export class JSDOM {
    constructor(html?: string, options?: Record<string, unknown>);
    window: Window & Record<string, unknown> & {
      Range: typeof Range;
      HTMLElement: typeof HTMLElement;
    };
  }
}
