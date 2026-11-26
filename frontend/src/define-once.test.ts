import { describe, expect, it } from "vitest";

import { customElementOnce } from "./define-once";

describe("customElementOnce", () => {
  it("defines the element the first time", () => {
    class A extends HTMLElement {}
    customElementOnce("define-once-test-a")(A);
    expect(customElements.get("define-once-test-a")).toBe(A);
  });

  it("ignores a second definition instead of throwing", () => {
    class First extends HTMLElement {}
    class Second extends HTMLElement {}
    customElementOnce("define-once-test-b")(First);
    expect(() => customElementOnce("define-once-test-b")(Second)).not.toThrow();
    expect(customElements.get("define-once-test-b")).toBe(First);
  });
});
