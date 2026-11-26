/**
 * Like lit's `@customElement`, but a no-op if `tagName` is already defined.
 *
 * Home Assistant can import one of our bundles more than once in the same
 * page - e.g. the panel's module_url carries a `?m=<mtime>` cache-buster, so
 * after the bundle is rebuilt and the panel re-registered, the browser
 * imports it again under a new URL without a page reload. A plain
 * `customElements.define` would then throw "the name ... has already been
 * used with this registry" and break the page; the already-registered
 * element keeps working until the next full reload picks up the new code.
 */
export function customElementOnce(tagName: string) {
  return (cls: CustomElementConstructor): void => {
    if (!customElements.get(tagName)) customElements.define(tagName, cls);
  };
}
