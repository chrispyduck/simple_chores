/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const M = globalThis, G = M.ShadowRoot && (M.ShadyCSS === void 0 || M.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Y = Symbol(), te = /* @__PURE__ */ new WeakMap();
let pe = class {
  constructor(e, i, a) {
    if (this._$cssResult$ = !0, a !== Y) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = i;
  }
  get styleSheet() {
    let e = this.o;
    const i = this.t;
    if (G && e === void 0) {
      const a = i !== void 0 && i.length === 1;
      a && (e = te.get(i)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), a && te.set(i, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const ye = (t) => new pe(typeof t == "string" ? t : t + "", void 0, Y), ve = (t, ...e) => {
  const i = t.length === 1 ? t[0] : e.reduce((a, s, n) => a + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + t[n + 1], t[0]);
  return new pe(i, t, Y);
}, $e = (t, e) => {
  if (G) t.adoptedStyleSheets = e.map((i) => i instanceof CSSStyleSheet ? i : i.styleSheet);
  else for (const i of e) {
    const a = document.createElement("style"), s = M.litNonce;
    s !== void 0 && a.setAttribute("nonce", s), a.textContent = i.cssText, t.appendChild(a);
  }
}, ie = G ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let i = "";
  for (const a of e.cssRules) i += a.cssText;
  return ye(i);
})(t) : t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: xe, defineProperty: ke, getOwnPropertyDescriptor: we, getOwnPropertyNames: Ce, getOwnPropertySymbols: Ae, getPrototypeOf: Ee } = Object, H = globalThis, se = H.trustedTypes, Se = se ? se.emptyScript : "", De = H.reactiveElementPolyfillSupport, N = (t, e) => t, I = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? Se : null;
      break;
    case Object:
    case Array:
      t = t == null ? t : JSON.stringify(t);
  }
  return t;
}, fromAttribute(t, e) {
  let i = t;
  switch (e) {
    case Boolean:
      i = t !== null;
      break;
    case Number:
      i = t === null ? null : Number(t);
      break;
    case Object:
    case Array:
      try {
        i = JSON.parse(t);
      } catch {
        i = null;
      }
  }
  return i;
} }, Z = (t, e) => !xe(t, e), ae = { attribute: !0, type: String, converter: I, reflect: !1, useDefault: !1, hasChanged: Z };
Symbol.metadata ??= Symbol("metadata"), H.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let C = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, i = ae) {
    if (i.state && (i.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((i = Object.create(i)).wrapped = !0), this.elementProperties.set(e, i), !i.noAccessor) {
      const a = Symbol(), s = this.getPropertyDescriptor(e, a, i);
      s !== void 0 && ke(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, i, a) {
    const { get: s, set: n } = we(this.prototype, e) ?? { get() {
      return this[i];
    }, set(r) {
      this[i] = r;
    } };
    return { get: s, set(r) {
      const c = s?.call(this);
      n?.call(this, r), this.requestUpdate(e, c, a);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? ae;
  }
  static _$Ei() {
    if (this.hasOwnProperty(N("elementProperties"))) return;
    const e = Ee(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(N("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(N("properties"))) {
      const i = this.properties, a = [...Ce(i), ...Ae(i)];
      for (const s of a) this.createProperty(s, i[s]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const i = litPropertyMetadata.get(e);
      if (i !== void 0) for (const [a, s] of i) this.elementProperties.set(a, s);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [i, a] of this.elementProperties) {
      const s = this._$Eu(i, a);
      s !== void 0 && this._$Eh.set(s, i);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const i = [];
    if (Array.isArray(e)) {
      const a = new Set(e.flat(1 / 0).reverse());
      for (const s of a) i.unshift(ie(s));
    } else e !== void 0 && i.push(ie(e));
    return i;
  }
  static _$Eu(e, i) {
    const a = i.attribute;
    return a === !1 ? void 0 : typeof a == "string" ? a : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
  }
  addController(e) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
  }
  removeController(e) {
    this._$EO?.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), i = this.constructor.elementProperties;
    for (const a of i.keys()) this.hasOwnProperty(a) && (e.set(a, this[a]), delete this[a]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return $e(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((e) => e.hostDisconnected?.());
  }
  attributeChangedCallback(e, i, a) {
    this._$AK(e, a);
  }
  _$ET(e, i) {
    const a = this.constructor.elementProperties.get(e), s = this.constructor._$Eu(e, a);
    if (s !== void 0 && a.reflect === !0) {
      const n = (a.converter?.toAttribute !== void 0 ? a.converter : I).toAttribute(i, a.type);
      this._$Em = e, n == null ? this.removeAttribute(s) : this.setAttribute(s, n), this._$Em = null;
    }
  }
  _$AK(e, i) {
    const a = this.constructor, s = a._$Eh.get(e);
    if (s !== void 0 && this._$Em !== s) {
      const n = a.getPropertyOptions(s), r = typeof n.converter == "function" ? { fromAttribute: n.converter } : n.converter?.fromAttribute !== void 0 ? n.converter : I;
      this._$Em = s;
      const c = r.fromAttribute(i, n.type);
      this[s] = c ?? this._$Ej?.get(s) ?? c, this._$Em = null;
    }
  }
  requestUpdate(e, i, a, s = !1, n) {
    if (e !== void 0) {
      const r = this.constructor;
      if (s === !1 && (n = this[e]), a ??= r.getPropertyOptions(e), !((a.hasChanged ?? Z)(n, i) || a.useDefault && a.reflect && n === this._$Ej?.get(e) && !this.hasAttribute(r._$Eu(e, a)))) return;
      this.C(e, i, a);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, i, { useDefault: a, reflect: s, wrapped: n }, r) {
    a && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, r ?? i ?? this[e]), n !== !0 || r !== void 0) || (this._$AL.has(e) || (this.hasUpdated || a || (i = void 0), this._$AL.set(e, i)), s === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (i) {
      Promise.reject(i);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [s, n] of this._$Ep) this[s] = n;
        this._$Ep = void 0;
      }
      const a = this.constructor.elementProperties;
      if (a.size > 0) for (const [s, n] of a) {
        const { wrapped: r } = n, c = this[s];
        r !== !0 || this._$AL.has(s) || c === void 0 || this.C(s, void 0, n, c);
      }
    }
    let e = !1;
    const i = this._$AL;
    try {
      e = this.shouldUpdate(i), e ? (this.willUpdate(i), this._$EO?.forEach((a) => a.hostUpdate?.()), this.update(i)) : this._$EM();
    } catch (a) {
      throw e = !1, this._$EM(), a;
    }
    e && this._$AE(i);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    this._$EO?.forEach((i) => i.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq &&= this._$Eq.forEach((i) => this._$ET(i, this[i])), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
C.elementStyles = [], C.shadowRootOptions = { mode: "open" }, C[N("elementProperties")] = /* @__PURE__ */ new Map(), C[N("finalized")] = /* @__PURE__ */ new Map(), De?.({ ReactiveElement: C }), (H.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const K = globalThis, re = (t) => t, j = K.trustedTypes, ne = j ? j.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, ue = "$lit$", y = `lit$${Math.random().toFixed(9).slice(2)}$`, ge = "?" + y, Ue = `<${ge}>`, w = document, z = () => w.createComment(""), R = (t) => t === null || typeof t != "object" && typeof t != "function", X = Array.isArray, Pe = (t) => X(t) || typeof t?.[Symbol.iterator] == "function", B = `[ 	
\f\r]`, P = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, oe = /-->/g, le = />/g, $ = RegExp(`>|${B}(?:([^\\s"'>=/]+)(${B}*=${B}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ce = /'/g, de = /"/g, _e = /^(?:script|style|textarea|title)$/i, Ne = (t) => (e, ...i) => ({ _$litType$: t, strings: e, values: i }), o = Ne(1), D = Symbol.for("lit-noChange"), d = Symbol.for("lit-nothing"), he = /* @__PURE__ */ new WeakMap(), k = w.createTreeWalker(w, 129);
function me(t, e) {
  if (!X(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ne !== void 0 ? ne.createHTML(e) : e;
}
const Te = (t, e) => {
  const i = t.length - 1, a = [];
  let s, n = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", r = P;
  for (let c = 0; c < i; c++) {
    const l = t[c];
    let p, g, h = -1, b = 0;
    for (; b < l.length && (r.lastIndex = b, g = r.exec(l), g !== null); ) b = r.lastIndex, r === P ? g[1] === "!--" ? r = oe : g[1] !== void 0 ? r = le : g[2] !== void 0 ? (_e.test(g[2]) && (s = RegExp("</" + g[2], "g")), r = $) : g[3] !== void 0 && (r = $) : r === $ ? g[0] === ">" ? (r = s ?? P, h = -1) : g[1] === void 0 ? h = -2 : (h = r.lastIndex - g[2].length, p = g[1], r = g[3] === void 0 ? $ : g[3] === '"' ? de : ce) : r === de || r === ce ? r = $ : r === oe || r === le ? r = P : (r = $, s = void 0);
    const f = r === $ && t[c + 1].startsWith("/>") ? " " : "";
    n += r === P ? l + Ue : h >= 0 ? (a.push(p), l.slice(0, h) + ue + l.slice(h) + y + f) : l + y + (h === -2 ? c : f);
  }
  return [me(t, n + (t[i] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), a];
};
class O {
  constructor({ strings: e, _$litType$: i }, a) {
    let s;
    this.parts = [];
    let n = 0, r = 0;
    const c = e.length - 1, l = this.parts, [p, g] = Te(e, i);
    if (this.el = O.createElement(p, a), k.currentNode = this.el.content, i === 2 || i === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (s = k.nextNode()) !== null && l.length < c; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const h of s.getAttributeNames()) if (h.endsWith(ue)) {
          const b = g[r++], f = s.getAttribute(h).split(y), q = /([.?@])?(.*)/.exec(b);
          l.push({ type: 1, index: n, name: q[2], strings: f, ctor: q[1] === "." ? Re : q[1] === "?" ? Oe : q[1] === "@" ? Fe : L }), s.removeAttribute(h);
        } else h.startsWith(y) && (l.push({ type: 6, index: n }), s.removeAttribute(h));
        if (_e.test(s.tagName)) {
          const h = s.textContent.split(y), b = h.length - 1;
          if (b > 0) {
            s.textContent = j ? j.emptyScript : "";
            for (let f = 0; f < b; f++) s.append(h[f], z()), k.nextNode(), l.push({ type: 2, index: ++n });
            s.append(h[b], z());
          }
        }
      } else if (s.nodeType === 8) if (s.data === ge) l.push({ type: 2, index: n });
      else {
        let h = -1;
        for (; (h = s.data.indexOf(y, h + 1)) !== -1; ) l.push({ type: 7, index: n }), h += y.length - 1;
      }
      n++;
    }
  }
  static createElement(e, i) {
    const a = w.createElement("template");
    return a.innerHTML = e, a;
  }
}
function U(t, e, i = t, a) {
  if (e === D) return e;
  let s = a !== void 0 ? i._$Co?.[a] : i._$Cl;
  const n = R(e) ? void 0 : e._$litDirective$;
  return s?.constructor !== n && (s?._$AO?.(!1), n === void 0 ? s = void 0 : (s = new n(t), s._$AT(t, i, a)), a !== void 0 ? (i._$Co ??= [])[a] = s : i._$Cl = s), s !== void 0 && (e = U(t, s._$AS(t, e.values), s, a)), e;
}
class ze {
  constructor(e, i) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = i;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: i }, parts: a } = this._$AD, s = (e?.creationScope ?? w).importNode(i, !0);
    k.currentNode = s;
    let n = k.nextNode(), r = 0, c = 0, l = a[0];
    for (; l !== void 0; ) {
      if (r === l.index) {
        let p;
        l.type === 2 ? p = new F(n, n.nextSibling, this, e) : l.type === 1 ? p = new l.ctor(n, l.name, l.strings, this, e) : l.type === 6 && (p = new qe(n, this, e)), this._$AV.push(p), l = a[++c];
      }
      r !== l?.index && (n = k.nextNode(), r++);
    }
    return k.currentNode = w, s;
  }
  p(e) {
    let i = 0;
    for (const a of this._$AV) a !== void 0 && (a.strings !== void 0 ? (a._$AI(e, a, i), i += a.strings.length - 2) : a._$AI(e[i])), i++;
  }
}
class F {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, i, a, s) {
    this.type = 2, this._$AH = d, this._$AN = void 0, this._$AA = e, this._$AB = i, this._$AM = a, this.options = s, this._$Cv = s?.isConnected ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const i = this._$AM;
    return i !== void 0 && e?.nodeType === 11 && (e = i.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, i = this) {
    e = U(this, e, i), R(e) ? e === d || e == null || e === "" ? (this._$AH !== d && this._$AR(), this._$AH = d) : e !== this._$AH && e !== D && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Pe(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== d && R(this._$AH) ? this._$AA.nextSibling.data = e : this.T(w.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: i, _$litType$: a } = e, s = typeof a == "number" ? this._$AC(e) : (a.el === void 0 && (a.el = O.createElement(me(a.h, a.h[0]), this.options)), a);
    if (this._$AH?._$AD === s) this._$AH.p(i);
    else {
      const n = new ze(s, this), r = n.u(this.options);
      n.p(i), this.T(r), this._$AH = n;
    }
  }
  _$AC(e) {
    let i = he.get(e.strings);
    return i === void 0 && he.set(e.strings, i = new O(e)), i;
  }
  k(e) {
    X(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let a, s = 0;
    for (const n of e) s === i.length ? i.push(a = new F(this.O(z()), this.O(z()), this, this.options)) : a = i[s], a._$AI(n), s++;
    s < i.length && (this._$AR(a && a._$AB.nextSibling, s), i.length = s);
  }
  _$AR(e = this._$AA.nextSibling, i) {
    for (this._$AP?.(!1, !0, i); e !== this._$AB; ) {
      const a = re(e).nextSibling;
      re(e).remove(), e = a;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class L {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, i, a, s, n) {
    this.type = 1, this._$AH = d, this._$AN = void 0, this.element = e, this.name = i, this._$AM = s, this.options = n, a.length > 2 || a[0] !== "" || a[1] !== "" ? (this._$AH = Array(a.length - 1).fill(new String()), this.strings = a) : this._$AH = d;
  }
  _$AI(e, i = this, a, s) {
    const n = this.strings;
    let r = !1;
    if (n === void 0) e = U(this, e, i, 0), r = !R(e) || e !== this._$AH && e !== D, r && (this._$AH = e);
    else {
      const c = e;
      let l, p;
      for (e = n[0], l = 0; l < n.length - 1; l++) p = U(this, c[a + l], i, l), p === D && (p = this._$AH[l]), r ||= !R(p) || p !== this._$AH[l], p === d ? e = d : e !== d && (e += (p ?? "") + n[l + 1]), this._$AH[l] = p;
    }
    r && !s && this.j(e);
  }
  j(e) {
    e === d ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Re extends L {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === d ? void 0 : e;
  }
}
class Oe extends L {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== d);
  }
}
class Fe extends L {
  constructor(e, i, a, s, n) {
    super(e, i, a, s, n), this.type = 5;
  }
  _$AI(e, i = this) {
    if ((e = U(this, e, i, 0) ?? d) === D) return;
    const a = this._$AH, s = e === d && a !== d || e.capture !== a.capture || e.once !== a.once || e.passive !== a.passive, n = e !== d && (a === d || s);
    s && this.element.removeEventListener(this.name, this, a), n && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class qe {
  constructor(e, i, a) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = a;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    U(this, e);
  }
}
const Me = K.litHtmlPolyfillSupport;
Me?.(O, F), (K.litHtmlVersions ??= []).push("3.3.3");
const Ie = (t, e, i) => {
  const a = i?.renderBefore ?? e;
  let s = a._$litPart$;
  if (s === void 0) {
    const n = i?.renderBefore ?? null;
    a._$litPart$ = s = new F(e.insertBefore(z(), n), n, void 0, i ?? {});
  }
  return s._$AI(t), s;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const J = globalThis;
class T extends C {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const i = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Ie(i, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return D;
  }
}
T._$litElement$ = !0, T.finalized = !0, J.litElementHydrateSupport?.({ LitElement: T });
const je = J.litElementPolyfillSupport;
je?.({ LitElement: T });
(J.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const He = (t) => (e, i) => {
  i !== void 0 ? i.addInitializer(() => {
    customElements.define(t, e);
  }) : customElements.define(t, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Le = { attribute: !0, type: String, converter: I, reflect: !1, hasChanged: Z }, Be = (t = Le, e, i) => {
  const { kind: a, metadata: s } = i;
  let n = globalThis.litPropertyMetadata.get(s);
  if (n === void 0 && globalThis.litPropertyMetadata.set(s, n = /* @__PURE__ */ new Map()), a === "setter" && ((t = Object.create(t)).wrapped = !0), n.set(i.name, t), a === "accessor") {
    const { name: r } = i;
    return { set(c) {
      const l = e.get.call(this);
      e.set.call(this, c), this.requestUpdate(r, l, t, !0, c);
    }, init(c) {
      return c !== void 0 && this.C(r, void 0, t, c), c;
    } };
  }
  if (a === "setter") {
    const { name: r } = i;
    return function(c) {
      const l = this[r];
      e.call(this, c), this.requestUpdate(r, l, t, !0, c);
    };
  }
  throw Error("Unsupported decorator location: " + a);
};
function Q(t) {
  return (e, i) => typeof i == "object" ? Be(t, e, i) : ((a, s, n) => {
    const r = s.hasOwnProperty(n);
    return s.constructor.createProperty(n, a), r ? Object.getOwnPropertyDescriptor(s, n) : void 0;
  })(t, e, i);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function v(t) {
  return Q({ ...t, state: !0, attribute: !1 });
}
const We = "sensor.simple_chore_", be = "sensor.simple_chore_privilege_", Ve = "sensor.simple_chore_meta_", fe = "sensor.simple_chore_category_", Ge = "sensor.simple_chore_meta_settings", Ye = ["daily", "manual", "once"], Ze = ["automatic", "manual"], A = "mdi:clipboard-list-outline", E = "mdi:star", S = "mdi:tag-outline", ee = "";
function Ke() {
  return {
    slug: "",
    name: "",
    description: "",
    frequency: "daily",
    icon: A,
    points: 1,
    category: ee,
    assignees: []
  };
}
function Xe(t) {
  return {
    slug: t.slug,
    name: t.name,
    description: t.description,
    frequency: t.frequency,
    icon: t.icon,
    points: t.points,
    category: t.category ?? ee,
    assignees: t.assignees.map((e) => e.assignee)
  };
}
function Je() {
  return {
    slug: "",
    name: "",
    icon: S
  };
}
function Qe(t) {
  return {
    slug: t.slug,
    name: t.name,
    icon: t.icon
  };
}
function et() {
  return {
    slug: "",
    name: "",
    icon: E,
    behavior: "automatic",
    linkedChores: [],
    assignees: []
  };
}
function tt(t) {
  return {
    slug: t.slug,
    name: t.name,
    icon: t.icon,
    behavior: t.behavior,
    linkedChores: [...t.linkedChores],
    assignees: t.assignees.map((e) => e.assignee)
  };
}
function x(t) {
  return t.toLowerCase().replace(/\s+/g, "-").replace(/-/g, "_").replace(/[^a-z0-9_]/g, "").replace(/_+/g, "_");
}
function it(t) {
  const e = /* @__PURE__ */ new Map();
  for (const [i, a] of Object.entries(t)) {
    if (!i.startsWith(We) || i.startsWith(be) || i.startsWith(Ve) || i.startsWith(fe)) continue;
    const s = a.attributes, n = s.chore_slug;
    if (!n) continue;
    let r = e.get(n);
    r || (r = {
      slug: n,
      name: s.chore_name ?? n,
      description: s.description ?? "",
      frequency: s.frequency ?? "daily",
      icon: s.icon ?? A,
      points: s.points ?? 0,
      category: s.category ?? null,
      assignees: []
    }, e.set(n, r)), r.assignees.push({
      assignee: s.assignee,
      entityId: i,
      state: a.state
    });
  }
  for (const i of e.values())
    i.assignees.sort((a, s) => a.assignee.localeCompare(s.assignee));
  return [...e.values()].sort((i, a) => i.name.localeCompare(a.name));
}
function st(t) {
  const e = /* @__PURE__ */ new Map();
  for (const [i, a] of Object.entries(t)) {
    if (!i.startsWith(be)) continue;
    const s = a.attributes, n = s.privilege_slug;
    if (!n) continue;
    let r = e.get(n);
    r || (r = {
      slug: n,
      name: s.privilege_name ?? n,
      icon: s.icon ?? E,
      behavior: s.behavior ?? "automatic",
      linkedChores: s.linked_chores ?? [],
      assignees: []
    }, e.set(n, r)), r.assignees.push({
      assignee: s.assignee,
      entityId: i,
      state: a.state,
      disableUntil: s.disable_until
    });
  }
  for (const i of e.values())
    i.assignees.sort((a, s) => a.assignee.localeCompare(s.assignee));
  return [...e.values()].sort((i, a) => i.name.localeCompare(a.name));
}
function at(t) {
  const e = [];
  for (const [i, a] of Object.entries(t)) {
    if (!i.startsWith(fe)) continue;
    const s = a.attributes, n = s.category_slug;
    n && e.push({
      slug: n,
      name: s.category_name ?? n,
      icon: s.icon ?? S,
      entityId: i,
      choreCount: Number(a.state) || 0
    });
  }
  return e.sort((i, a) => i.name.localeCompare(a.name));
}
const W = {
  autoFinalizeEnabled: !0,
  autoFinalizeDelayMinutes: 60
};
function rt(t) {
  const e = t[Ge];
  if (!e) return { ...W };
  const i = e.attributes;
  return {
    autoFinalizeEnabled: i.auto_finalize_enabled ?? W.autoFinalizeEnabled,
    autoFinalizeDelayMinutes: i.auto_finalize_delay_minutes ?? W.autoFinalizeDelayMinutes
  };
}
function nt(t, e) {
  const i = /* @__PURE__ */ new Set();
  for (const a of t)
    for (const s of a.assignees) i.add(s.assignee);
  for (const a of e)
    for (const s of a.assignees) i.add(s.assignee);
  return [...i].sort((a, s) => a.localeCompare(s));
}
function ot(t) {
  const e = {};
  for (const i of t)
    i.username && (e[i.username.toLowerCase()] = i.name);
  return e;
}
function lt(t, e) {
  return e[t.toLowerCase()] ?? t;
}
var ct = Object.defineProperty, dt = Object.getOwnPropertyDescriptor, m = (t, e, i, a) => {
  for (var s = a > 1 ? void 0 : a ? dt(e, i) : e, n = t.length - 1, r; n >= 0; n--)
    (r = t[n]) && (s = (a ? r(e, i, s) : r(s)) || s);
  return a && s && ct(e, i, s), s;
};
const u = "simple_chores", V = "__uncategorized__";
let _ = class extends T {
  constructor() {
    super(...arguments), this.narrow = !1, this._tab = "chores", this._dialog = null, this._busy = !1, this._error = null, this._bulkUser = "", this._categoryFilter = "", this._userDisplayNames = {}, this._settingsDraft = null, this._loadedUserDisplayNames = !1, this._onOverlayClick = (t) => {
      t.target === t.currentTarget && this._closeDialog();
    }, this._dismissError = () => {
      this._error = null;
    }, this._closeDialog = () => {
      this._dialog = null;
    }, this._openCreateChore = () => {
      this._error = null, this._dialog = { kind: "chore", draft: Ke() };
    }, this._openCreatePrivilege = () => {
      this._error = null, this._dialog = { kind: "privilege", draft: et() };
    }, this._openCreateCategory = () => {
      this._error = null, this._dialog = { kind: "category", draft: Je() };
    };
  }
  updated(t) {
    t.has("hass") && !this.hass?.user?.is_admin && (this._error = "You must be an administrator to manage chores and privileges."), this.hass && !this._loadedUserDisplayNames && (this._loadedUserDisplayNames = !0, this._loadUserDisplayNames());
  }
  /**
   * Fetch every HA user's display name, keyed by their lowercased login
   * username, so assignees (stored as usernames - see README) can be shown
   * as people's actual names. Best-effort: falls back to raw usernames
   * everywhere if this fails, rather than blocking the panel on it.
   */
  async _loadUserDisplayNames() {
    try {
      const t = await this.hass.callWS({
        type: "config/auth/list"
      });
      this._userDisplayNames = ot(t);
    } catch (t) {
      console.warn("simple-chores-panel: failed to load user display names", t);
    }
  }
  _displayName(t) {
    return lt(t, this._userDisplayNames);
  }
  render() {
    if (!this.hass) return d;
    const t = it(this.hass.states), e = st(this.hass.states), i = at(this.hass.states), a = rt(this.hass.states), s = nt(t, e);
    return o`
      <div class="toolbar">
        <ha-icon icon="mdi:clipboard-check-outline"></ha-icon>
        <span class="toolbar-title">Chores</span>
        ${this._busy ? o`<ha-icon class="spin" icon="mdi:loading"></ha-icon>` : d}
      </div>

      <div class="content">
        ${this._error ? o`
              <div class="banner error">
                <span>${this._error}</span>
                <button class="icon-button" @click=${this._dismissError}>
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
              </div>
            ` : d}

        <div class="tabs">
          <button
            class="tab ${this._tab === "chores" ? "active" : ""}"
            @click=${() => this._tab = "chores"}
          >
            Chores
          </button>
          <button
            class="tab ${this._tab === "privileges" ? "active" : ""}"
            @click=${() => this._tab = "privileges"}
          >
            Privileges
          </button>
          <button
            class="tab ${this._tab === "categories" ? "active" : ""}"
            @click=${() => this._tab = "categories"}
          >
            Categories
          </button>
          <button
            class="tab ${this._tab === "settings" ? "active" : ""}"
            @click=${() => this._tab = "settings"}
          >
            Settings
          </button>
        </div>

        ${this._tab === "chores" ? this._renderChoresTab(t, i, s) : this._tab === "privileges" ? this._renderPrivilegesTab(e, t, s) : this._tab === "categories" ? this._renderCategoriesTab(i, s) : this._renderSettingsTab(a)}
      </div>

      ${this._dialog ? this._renderDialog(t, i, s) : d}
    `;
  }
  // --- Chores tab ----------------------------------------------------
  _renderChoresTab(t, e, i) {
    const a = t.filter((n) => {
      if (this._categoryFilter) {
        if (this._categoryFilter === V) {
          if (n.category) return !1;
        } else if (n.category !== this._categoryFilter)
          return !1;
      }
      return !(this._bulkUser && !n.assignees.some((r) => r.assignee === this._bulkUser));
    }), s = this._categoryFilter && this._categoryFilter !== V;
    return o`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreateChore}>
          <ha-icon icon="mdi:plus"></ha-icon> New chore
        </button>
        ${this._renderCategoryFilterPicker(e)}
        ${s ? o`
              <button
                title="Reset completed manual chores in this category to not requested, and count pending ones as missed"
                @click=${() => this._categoryAction(this._categoryFilter, "finalize_by_category")}
              >
                Finalize by category
              </button>
            ` : d}
        <div class="spacer"></div>
        ${this._renderBulkUserPicker(i)}
        <button @click=${() => this._resetCompleted()}>Reset completed</button>
        <button @click=${() => this._startNewDay()}>Start new day</button>
      </div>

      ${a.length === 0 ? o`<p class="empty">
            ${t.length === 0 ? "No chores yet. Create one to get started." : "No chores match the current filters."}
          </p>` : o`<div class="card-grid">
            ${a.map((n) => this._renderChoreCard(n, e))}
          </div>`}
    `;
  }
  _renderCategoryFilterPicker(t) {
    return o`
      <select
        class="user-picker"
        title="Filter chores by category"
        .value=${this._categoryFilter}
        @change=${(e) => this._categoryFilter = e.target.value}
      >
        <option value="">All categories</option>
        <option value=${V}>Uncategorized</option>
        ${t.map(
      (e) => o`<option value=${e.slug}>${e.name}</option>`
    )}
      </select>
    `;
  }
  _renderBulkUserPicker(t) {
    return o`
      <select
        class="user-picker"
        title="Filter the chores shown below, and limit Reset completed / Start new day, to one assignee"
        .value=${this._bulkUser}
        @change=${(e) => this._bulkUser = e.target.value}
      >
        <option value="">All assignees</option>
        ${t.map(
      (e) => o`<option value=${e}>${this._displayName(e)}</option>`
    )}
      </select>
    `;
  }
  _renderChoreCard(t, e) {
    const i = `${t.points} point${t.points === 1 ? "" : "s"}`, a = t.category ? e.find((s) => s.slug === t.category)?.name ?? t.category : null;
    return o`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${t.icon || A}></ha-icon>
          <div class="card-title">
            <div class="name">${t.name}</div>
            <div class="meta">
              ${t.frequency} · ${i}
              ${a ? o` · ${a}` : d}
              ${t.description ? o` · ${t.description}` : d}
            </div>
          </div>
          <div class="card-actions">
            <button
              class="icon-button"
              title="Edit"
              @click=${() => this._openEditChore(t)}
            >
              <ha-icon icon="mdi:pencil"></ha-icon>
            </button>
            <button
              class="icon-button danger"
              title="Delete"
              @click=${() => this._deleteChore(t)}
            >
              <ha-icon icon="mdi:delete"></ha-icon>
            </button>
          </div>
        </div>
        <div class="assignee-list">
          ${t.assignees.filter((s) => !this._bulkUser || s.assignee === this._bulkUser).map(
      (s) => o`
                <div class="assignee-row">
                  <span class="assignee-name">${this._displayName(s.assignee)}</span>
                  <span class="state-chip ${this._choreStateClass(s.state)}"
                    >${s.state}</span
                  >
                  <div class="row-actions">
                    <button
                      class="icon-button"
                      title="Request"
                      ?disabled=${s.state === "Pending"}
                      @click=${() => this._markChore(t.slug, s.assignee, "mark_pending")}
                    >
                      <ha-icon icon="mdi:plus-circle-outline"></ha-icon>
                    </button>
                    <button
                      class="icon-button"
                      title="Complete"
                      ?disabled=${s.state === "Complete"}
                      @click=${() => this._markChore(t.slug, s.assignee, "mark_complete")}
                    >
                      <ha-icon icon="mdi:check-circle-outline"></ha-icon>
                    </button>
                    <button
                      class="icon-button"
                      title="Clear"
                      ?disabled=${s.state === "Not Requested"}
                      @click=${() => this._markChore(
        t.slug,
        s.assignee,
        "mark_not_requested"
      )}
                    >
                      <ha-icon icon="mdi:close-circle-outline"></ha-icon>
                    </button>
                  </div>
                </div>
              `
    )}
        </div>
      </div>
    `;
  }
  _choreStateClass(t) {
    return t === "Complete" ? "state-good" : t === "Pending" ? "state-warn" : "state-neutral";
  }
  // --- Privileges tab --------------------------------------------------
  _renderPrivilegesTab(t, e, i) {
    return o`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreatePrivilege}>
          <ha-icon icon="mdi:plus"></ha-icon> New privilege
        </button>
      </div>

      ${t.length === 0 ? o`<p class="empty">No privileges yet. Create one to get started.</p>` : o`<div class="card-grid">
            ${t.map((a) => this._renderPrivilegeCard(a, e, i))}
          </div>`}
    `;
  }
  _renderPrivilegeCard(t, e, i) {
    const a = t.linkedChores.map(
      (s) => e.find((n) => n.slug === s)?.name ?? s
    );
    return o`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${t.icon || E}></ha-icon>
          <div class="card-title">
            <div class="name">${t.name}</div>
            <div class="meta">
              ${t.behavior}
              ${a.length ? o` · linked: ${a.join(", ")}` : o` · linked: all requested chores`}
            </div>
          </div>
          <div class="card-actions">
            <button
              class="icon-button"
              title="Edit"
              @click=${() => this._openEditPrivilege(t)}
            >
              <ha-icon icon="mdi:pencil"></ha-icon>
            </button>
            <button
              class="icon-button danger"
              title="Delete"
              @click=${() => this._deletePrivilege(t)}
            >
              <ha-icon icon="mdi:delete"></ha-icon>
            </button>
          </div>
        </div>
        <div class="assignee-list">
          ${t.assignees.map((s) => {
      const n = s.state === "Temporarily Disabled";
      return o`
              <div class="assignee-row privilege-row">
                <div class="assignee-main">
                  <span class="assignee-name">${this._displayName(s.assignee)}</span>
                  <span class="state-chip ${this._privilegeStateClass(s.state)}">
                    ${s.state}${n && s.disableUntil ? o` (${this._formatUntil(s.disableUntil)})` : d}
                  </span>
                  ${t.behavior === "manual" ? o`
                        <div class="row-actions">
                          <button
                            class="action-chip"
                            title="Enable"
                            ?disabled=${s.state === "Enabled"}
                            @click=${() => this._call(u, "enable_privilege", {
        user: s.assignee,
        privilege_slug: t.slug
      })}
                          >
                            <ha-icon icon="mdi:check-circle-outline"></ha-icon>
                            <span>Enable</span>
                          </button>
                          <button
                            class="action-chip"
                            title="Disable"
                            ?disabled=${s.state === "Disabled"}
                            @click=${() => this._call(u, "disable_privilege", {
        user: s.assignee,
        privilege_slug: t.slug
      })}
                          >
                            <ha-icon icon="mdi:close-circle-outline"></ha-icon>
                            <span>Disable</span>
                          </button>
                        </div>
                      ` : d}
                </div>
                <div class="block-steppers">
                  <span class="block-steppers-label">Temporary block</span>
                  ${this._renderBlockStepper(
        "1h",
        n,
        () => this._adjustTemporaryDisable(t.slug, s.assignee, -60),
        () => this._addTemporaryDisable(t.slug, s.assignee, n, 60)
      )}
                  ${this._renderBlockStepper(
        "1d",
        n,
        () => this._adjustTemporaryDisable(t.slug, s.assignee, -1440),
        () => this._addTemporaryDisable(
          t.slug,
          s.assignee,
          n,
          1440
        )
      )}
                  <button
                    class="action-chip"
                    title="Clear the block now"
                    ?disabled=${!n}
                    @click=${() => this._clearTemporaryDisable(t.slug, s.assignee)}
                  >
                    <ha-icon icon="mdi:backspace-outline"></ha-icon>
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            `;
    })}
        </div>
      </div>
    `;
  }
  /**
   * A single stepper for adjusting a privilege's temporary block by a fixed
   * unit (e.g. "1h" or "1d") - a minus button, the unit, and a plus button
   * inside one bordered pill, matching how Home Assistant renders its own
   * number/counter steppers.
   */
  _renderBlockStepper(t, e, i, a) {
    return o`
      <div class="stepper">
        <button
          title="Shorten the block by ${t}"
          ?disabled=${!e}
          @click=${i}
        >
          <ha-icon icon="mdi:minus"></ha-icon>
        </button>
        <span class="stepper-unit">${t}</span>
        <button title="Extend the block by ${t}" @click=${a}>
          <ha-icon icon="mdi:plus"></ha-icon>
        </button>
      </div>
    `;
  }
  _privilegeStateClass(t) {
    return t === "Enabled" ? "state-good" : t === "Temporarily Disabled" ? "state-bad" : "state-warn";
  }
  _formatUntil(t) {
    try {
      const e = new Date(t), i = /* @__PURE__ */ new Date(), a = e.toDateString() === i.toDateString(), s = e.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
      return a ? `until ${s}` : `until ${e.toLocaleDateString()} ${s}`;
    } catch {
      return "";
    }
  }
  // --- Categories tab --------------------------------------------------
  _renderCategoriesTab(t, e) {
    return o`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreateCategory}>
          <ha-icon icon="mdi:plus"></ha-icon> New category
        </button>
        <div class="spacer"></div>
        ${this._renderBulkUserPicker(e)}
      </div>

      ${t.length === 0 ? o`<p class="empty">
            No categories yet. Create one, then assign it to chores.
          </p>` : o`<div class="card-grid">
            ${t.map((i) => this._renderCategoryCard(i))}
          </div>`}
    `;
  }
  _renderCategoryCard(t) {
    const e = `${t.choreCount} chore${t.choreCount === 1 ? "" : "s"}`;
    return o`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${t.icon || S}></ha-icon>
          <div class="card-title">
            <div class="name">${t.name}</div>
            <div class="meta">${e}</div>
          </div>
          <div class="card-actions">
            <button
              class="icon-button"
              title="Edit"
              @click=${() => this._openEditCategory(t)}
            >
              <ha-icon icon="mdi:pencil"></ha-icon>
            </button>
            <button
              class="icon-button danger"
              title="Delete"
              @click=${() => this._deleteCategory(t)}
            >
              <ha-icon icon="mdi:delete"></ha-icon>
            </button>
          </div>
        </div>
        <div class="row-actions category-actions">
          <button
            class="action-chip"
            title="Mark every chore in this category pending"
            @click=${() => this._categoryAction(t.slug, "mark_pending_by_category")}
          >
            <ha-icon icon="mdi:plus-circle-outline"></ha-icon>
            <span>Request</span>
          </button>
          <button
            class="action-chip"
            title="Mark every chore in this category complete"
            @click=${() => this._categoryAction(t.slug, "mark_complete_by_category")}
          >
            <ha-icon icon="mdi:check-circle-outline"></ha-icon>
            <span>Complete</span>
          </button>
          <button
            class="action-chip"
            title="Mark every chore in this category not requested"
            @click=${() => this._categoryAction(t.slug, "mark_not_requested_by_category")}
          >
            <ha-icon icon="mdi:close-circle-outline"></ha-icon>
            <span>Clear</span>
          </button>
          <button
            class="action-chip"
            title="Reset completed manual chores in this category to not requested, and count pending ones as missed"
            @click=${() => this._categoryAction(t.slug, "finalize_by_category")}
          >
            <ha-icon icon="mdi:flag-checkered"></ha-icon>
            <span>Finalize</span>
          </button>
        </div>
      </div>
    `;
  }
  // --- Settings tab ------------------------------------------------------
  _renderSettingsTab(t) {
    this._settingsDraft || (this._settingsDraft = {
      autoFinalizeEnabled: t.autoFinalizeEnabled,
      autoFinalizeDelayMinutes: t.autoFinalizeDelayMinutes
    });
    const e = this._settingsDraft;
    return o`
      <div class="settings-section">
        <h3>Auto-finalize</h3>
        <p class="hint">
          A chore left Complete is automatically reset to Not Requested after
          the delay below, so completed chores don't keep piling up on the
          Chores tab and dashboards throughout the day. Points were already
          awarded when the chore was completed, so this never changes them.
        </p>

        <label class="checkbox-item settings-toggle">
          <input
            type="checkbox"
            .checked=${e.autoFinalizeEnabled}
            @change=${(i) => {
      e.autoFinalizeEnabled = i.target.checked, this.requestUpdate();
    }}
          />
          Enable auto-finalize
        </label>

        <label>
          Delay (minutes)
          <input
            type="number"
            min="1"
            ?disabled=${!e.autoFinalizeEnabled}
            .value=${String(e.autoFinalizeDelayMinutes)}
            @input=${(i) => {
      e.autoFinalizeDelayMinutes = Number(i.target.value) || 1, this.requestUpdate();
    }}
          />
        </label>

        <div class="actions-row">
          <button
            class="primary"
            ?disabled=${this._busy}
            @click=${() => this._saveSettings()}
          >
            Save
          </button>
          <button @click=${() => this._settingsDraft = null}>Reset</button>
        </div>
      </div>
    `;
  }
  async _saveSettings() {
    const t = this._settingsDraft;
    if (!t) return;
    await this._call(u, "update_settings", {
      auto_finalize_enabled: t.autoFinalizeEnabled,
      auto_finalize_delay_minutes: t.autoFinalizeDelayMinutes
    }) && (this._settingsDraft = null);
  }
  // --- Dialog ------------------------------------------------------------
  _renderDialog(t, e, i) {
    if (!this._dialog) return d;
    const a = this._dialog.kind, s = this._dialog.original ? "Edit" : "New", n = a === "chore" ? "chore" : a === "privilege" ? "privilege" : "category";
    return o`
      <div class="overlay" @click=${this._onOverlayClick}>
        <div class="dialog" role="dialog" aria-modal="true">
          <div class="dialog-header">
            <h2>${s} ${n}</h2>
            <button class="icon-button" @click=${this._closeDialog}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="dialog-body">
            ${a === "chore" ? this._renderChoreForm(e, i) : a === "privilege" ? this._renderPrivilegeForm(t, i) : this._renderCategoryForm()}
          </div>
          <div class="dialog-footer">
            <button @click=${this._closeDialog}>Cancel</button>
            <button
              class="primary"
              ?disabled=${this._busy}
              @click=${() => a === "chore" ? this._saveChoreDialog() : a === "privilege" ? this._savePrivilegeDialog() : this._saveCategoryDialog()}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    `;
  }
  _renderChoreForm(t, e) {
    const i = this._dialog.draft, a = !!this._dialog.original, s = x(i.slug || i.name), n = a && s && s !== this._dialog.original;
    return o`
      <label>
        Name
        <input
          type="text"
          .value=${i.name}
          @input=${(r) => {
      i.name = r.target.value, this.requestUpdate();
    }}
        />
      </label>

      <label>
        Slug
        <input
          type="text"
          .value=${i.slug}
          placeholder=${s || "auto-generated from name"}
          @input=${(r) => {
      i.slug = r.target.value, this.requestUpdate();
    }}
        />
        ${n ? o`<span class="hint">Will be renamed to "${s}"</span>` : a ? d : o`<span class="hint">Will be saved as "${s}"</span>`}
      </label>

      <label>
        Description
        <input
          type="text"
          .value=${i.description}
          @input=${(r) => {
      i.description = r.target.value, this.requestUpdate();
    }}
        />
      </label>

      <div class="form-row">
        <label>
          Frequency
          <select
            .value=${i.frequency}
            @change=${(r) => {
      i.frequency = r.target.value, this.requestUpdate();
    }}
          >
            ${Ye.map(
      (r) => o`<option value=${r}>${r}</option>`
    )}
          </select>
        </label>

        <label>
          Points
          <input
            type="number"
            min="0"
            .value=${String(i.points)}
            @input=${(r) => {
      i.points = Number(r.target.value) || 0, this.requestUpdate();
    }}
          />
        </label>
      </div>

      <label>
        Category
        <select
          .value=${i.category}
          @change=${(r) => {
      i.category = r.target.value, this.requestUpdate();
    }}
        >
          <option value=${ee}>Uncategorized</option>
          ${t.map(
      (r) => o`<option value=${r.slug}>${r.name}</option>`
    )}
        </select>
      </label>

      ${this._renderIconField(i.icon, A, (r) => {
      i.icon = r, this.requestUpdate();
    })}

      ${this._renderAssigneeEditor(i, e)}
    `;
  }
  _renderPrivilegeForm(t, e) {
    const i = this._dialog.draft, a = !!this._dialog.original, s = x(i.slug || i.name), n = a && s && s !== this._dialog.original;
    return o`
      <label>
        Name
        <input
          type="text"
          .value=${i.name}
          @input=${(r) => {
      i.name = r.target.value, this.requestUpdate();
    }}
        />
      </label>

      <label>
        Slug
        <input
          type="text"
          .value=${i.slug}
          placeholder=${s || "auto-generated from name"}
          @input=${(r) => {
      i.slug = r.target.value, this.requestUpdate();
    }}
        />
        ${n ? o`<span class="hint">Will be renamed to "${s}"</span>` : a ? d : o`<span class="hint">Will be saved as "${s}"</span>`}
      </label>

      <label>
        Behavior
        <select
          .value=${i.behavior}
          @change=${(r) => {
      i.behavior = r.target.value, this.requestUpdate();
    }}
        >
          ${Ze.map(
      (r) => o`<option value=${r}>${r}</option>`
    )}
        </select>
        <span class="hint"
          >Automatic privileges turn on when their linked chores are
          complete. Manual ones are only toggled by an admin.</span
        >
      </label>

      ${this._renderIconField(i.icon, E, (r) => {
      i.icon = r, this.requestUpdate();
    })}

      <label>
        Linked chores
        <span class="hint"
          >Leave all unchecked to require every requested chore to be
          complete instead of a specific list.</span
        >
        <div class="checkbox-list">
          ${t.length === 0 ? o`<span class="hint">No chores defined yet.</span>` : t.map(
      (r) => o`
                  <label class="checkbox-item">
                    <input
                      type="checkbox"
                      .checked=${i.linkedChores.includes(r.slug)}
                      @change=${(c) => {
        const l = c.target.checked;
        i.linkedChores = l ? [...i.linkedChores, r.slug] : i.linkedChores.filter((p) => p !== r.slug), this.requestUpdate();
      }}
                    />
                    ${r.name}
                  </label>
                `
    )}
        </div>
      </label>

      ${this._renderAssigneeEditor(i, e)}
    `;
  }
  _renderCategoryForm() {
    const t = this._dialog.draft, e = !!this._dialog.original, i = x(t.slug || t.name), a = e && i && i !== this._dialog.original;
    return o`
      <label>
        Name
        <input
          type="text"
          .value=${t.name}
          @input=${(s) => {
      t.name = s.target.value, this.requestUpdate();
    }}
        />
      </label>

      <label>
        Slug
        <input
          type="text"
          .value=${t.slug}
          placeholder=${i || "auto-generated from name"}
          @input=${(s) => {
      t.slug = s.target.value, this.requestUpdate();
    }}
        />
        ${a ? o`<span class="hint">Will be renamed to "${i}"</span>` : e ? d : o`<span class="hint">Will be saved as "${i}"</span>`}
      </label>

      ${this._renderIconField(t.icon, S, (s) => {
      t.icon = s, this.requestUpdate();
    })}
    `;
  }
  _renderIconField(t, e, i) {
    return o`
      <label>
        Icon
        <div class="icon-field">
          <ha-icon .icon=${t || e}></ha-icon>
          <input
            type="text"
            .value=${t}
            placeholder=${e}
            @input=${(a) => i(a.target.value)}
          />
        </div>
      </label>
    `;
  }
  _renderAssigneeEditor(t, e) {
    return o`
      <label>
        Assignees
        <div class="chip-list">
          ${t.assignees.map(
      (i) => o`
              <span class="chip">
                ${this._displayName(i)}
                <button
                  class="chip-remove"
                  @click=${() => {
        t.assignees = t.assignees.filter((a) => a !== i), this.requestUpdate();
      }}
                >
                  ✕
                </button>
              </span>
            `
    )}
          <input
            type="text"
            list="simple-chores-known-assignees"
            placeholder="Add assignee, press Enter"
            @keydown=${(i) => this._onAssigneeKeydown(i, t)}
            @blur=${(i) => this._commitAssigneeInput(i.target, t)}
          />
        </div>
      </label>
      <datalist id="simple-chores-known-assignees">
        ${e.map(
      (i) => o`<option value=${i} label=${this._displayName(i)}></option>`
    )}
      </datalist>
    `;
  }
  _onAssigneeKeydown(t, e) {
    t.key !== "Enter" && t.key !== "," || (t.preventDefault(), this._commitAssigneeInput(t.target, e));
  }
  _commitAssigneeInput(t, e) {
    const i = t.value.trim().replace(/,$/, "");
    i && !e.assignees.includes(i) && (e.assignees = [...e.assignees, i]), t.value = "", this.requestUpdate();
  }
  _openEditChore(t) {
    this._error = null, this._dialog = {
      kind: "chore",
      original: t.slug,
      draft: Xe(t)
    };
  }
  _openEditPrivilege(t) {
    this._error = null, this._dialog = {
      kind: "privilege",
      original: t.slug,
      draft: tt(t)
    };
  }
  _openEditCategory(t) {
    this._error = null, this._dialog = {
      kind: "category",
      original: t.slug,
      draft: Qe(t)
    };
  }
  /**
   * Build the `new_slug` field for an update_* service call, if the slug
   * field was actually edited to something new - `{}` otherwise, so
   * spreading this into the call data is a no-op when nothing changed.
   */
  _renameField(t, e) {
    const i = x(e);
    return i && i !== t ? { new_slug: i } : {};
  }
  async _call(t, e, i) {
    this._busy = !0;
    try {
      return await this.hass.callService(t, e, i), !0;
    } catch (a) {
      return this._error = a instanceof Error ? a.message : String(a), !1;
    } finally {
      this._busy = !1;
    }
  }
  _markChore(t, e, i) {
    return this._call(u, i, { chore_slug: t, user: e });
  }
  _resetCompleted() {
    const t = this._bulkUser ? { user: this._bulkUser } : {};
    return this._call(u, "reset_completed", t);
  }
  _startNewDay() {
    const t = this._bulkUser ? { user: this._bulkUser } : {};
    return this._call(u, "start_new_day", t);
  }
  _categoryAction(t, e) {
    const i = {
      category_slug: t,
      ...this._bulkUser ? { user: this._bulkUser } : {}
    };
    return this._call(u, e, i);
  }
  async _deleteChore(t) {
    const e = t.assignees.map((i) => this._displayName(i.assignee)).join(", ");
    confirm(
      `Delete "${t.name}"? This removes it for every assignee (${e}).`
    ) && await this._call(u, "delete_chore", { slug: t.slug });
  }
  async _deletePrivilege(t) {
    const e = t.assignees.map((i) => this._displayName(i.assignee)).join(", ");
    confirm(
      `Delete "${t.name}"? This removes it for every assignee (${e}).`
    ) && await this._call(u, "delete_privilege", { slug: t.slug });
  }
  async _deleteCategory(t) {
    confirm(
      `Delete "${t.name}"? Chores must be uncategorized or reassigned first.`
    ) && await this._call(u, "delete_category", { slug: t.slug });
  }
  _addTemporaryDisable(t, e, i, a) {
    return i ? this._call(u, "adjust_temporary_disable", {
      user: e,
      privilege_slug: t,
      adjustment: a
    }) : this._call(u, "temporarily_disable_privilege", {
      user: e,
      privilege_slug: t,
      duration: a
    });
  }
  /**
   * Nudge an in-progress block's end time by `adjustmentMinutes` (negative to
   * shorten it, positive to extend it), via the existing
   * `adjust_temporary_disable` service. Only meaningful while the privilege
   * is already temporarily disabled - callers should disable the triggering
   * button otherwise, since the service just warns and no-ops.
   */
  _adjustTemporaryDisable(t, e, i) {
    return this._call(u, "adjust_temporary_disable", {
      user: e,
      privilege_slug: t,
      adjustment: i
    });
  }
  /**
   * End a temporary block immediately, via `clear_temporary_disable`. The
   * privilege is restored to what it was right before the block (or
   * recomputed from linked chores, for automatic-behavior privileges).
   */
  _clearTemporaryDisable(t, e) {
    return this._call(u, "clear_temporary_disable", {
      user: e,
      privilege_slug: t
    });
  }
  async _saveChoreDialog() {
    const t = this._dialog, e = t.draft;
    if (!e.name.trim()) {
      this._error = "Name is required.";
      return;
    }
    if (e.assignees.length === 0) {
      this._error = "At least one assignee is required.";
      return;
    }
    const i = e.assignees.join(",");
    (t.original ? await this._call(u, "update_chore", {
      slug: t.original,
      name: e.name,
      description: e.description,
      frequency: e.frequency,
      assignees: i,
      icon: e.icon || A,
      points: e.points,
      category: e.category,
      ...this._renameField(t.original, e.slug || e.name)
    }) : await this._call(u, "create_chore", {
      name: e.name,
      slug: x(e.slug || e.name),
      description: e.description,
      frequency: e.frequency,
      assignees: i,
      icon: e.icon || A,
      points: e.points,
      category: e.category
    })) && (this._dialog = null);
  }
  async _saveCategoryDialog() {
    const t = this._dialog, e = t.draft;
    if (!e.name.trim()) {
      this._error = "Name is required.";
      return;
    }
    (t.original ? await this._call(u, "update_category", {
      slug: t.original,
      name: e.name,
      icon: e.icon || S,
      ...this._renameField(t.original, e.slug || e.name)
    }) : await this._call(u, "create_category", {
      name: e.name,
      slug: x(e.slug || e.name),
      icon: e.icon || S
    })) && (this._dialog = null);
  }
  async _savePrivilegeDialog() {
    const t = this._dialog, e = t.draft;
    if (!e.name.trim()) {
      this._error = "Name is required.";
      return;
    }
    if (e.assignees.length === 0) {
      this._error = "At least one assignee is required.";
      return;
    }
    const i = e.assignees.join(","), a = e.linkedChores.join(",");
    (t.original ? await this._call(u, "update_privilege", {
      slug: t.original,
      name: e.name,
      icon: e.icon || E,
      behavior: e.behavior,
      linked_chores: a,
      assignees: i,
      ...this._renameField(t.original, e.slug || e.name)
    }) : await this._call(u, "create_privilege", {
      name: e.name,
      slug: x(e.slug || e.name),
      icon: e.icon || E,
      behavior: e.behavior,
      linked_chores: a,
      assignees: i
    })) && (this._dialog = null);
  }
};
_.styles = ve`
    :host {
      display: block;
      height: 100vh;
      overflow-y: auto;
      background: var(--primary-background-color, #fafafa);
      color: var(--primary-text-color, #212121);
      padding-bottom: env(safe-area-inset-bottom);
      box-sizing: border-box;
      font-family: var(
        --paper-font-body1_-_font-family,
        Roboto,
        system-ui,
        sans-serif
      );
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      height: 64px;
      padding: 0 16px;
      background: var(--app-header-background-color, var(--primary-color, #03a9f4));
      color: var(--app-header-text-color, #fff);
      box-sizing: border-box;
    }

    .toolbar-title {
      font-size: 20px;
      font-weight: 400;
      flex: 1;
    }

    .spin {
      animation: spin 1.2s linear infinite;
    }
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .content {
      max-width: 960px;
      margin: 0 auto;
      padding: 16px;
      box-sizing: border-box;
    }

    .banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .banner.error {
      background: var(--error-color, #db4437);
      color: #fff;
    }
    .banner button {
      color: inherit;
    }

    .tabs {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      margin-bottom: 16px;
    }
    .tab {
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 500;
      color: var(--secondary-text-color, #727272);
      cursor: pointer;
    }
    .tab.active {
      color: var(--primary-color, #03a9f4);
      border-bottom-color: var(--primary-color, #03a9f4);
    }

    .actions-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .spacer {
      flex: 1;
    }

    button {
      font: inherit;
      cursor: pointer;
    }

    button.primary,
    .actions-row button,
    .dialog-footer button {
      border: 1px solid var(--divider-color, #e0e0e0);
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      border-radius: 8px;
      padding: 8px 14px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    button.primary,
    .dialog-footer button.primary {
      background: var(--primary-color, #03a9f4);
      border-color: var(--primary-color, #03a9f4);
      color: #fff;
    }
    button:disabled {
      opacity: 0.5;
      cursor: default;
    }

    select.user-picker {
      border-radius: 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
      padding: 8px 10px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
    }

    .icon-button {
      border: none;
      background: none;
      padding: 6px;
      border-radius: 50%;
      display: inline-flex;
      color: var(--secondary-text-color, #727272);
    }
    .icon-button:hover {
      background: rgba(0, 0, 0, 0.06);
    }
    .icon-button.danger {
      color: var(--error-color, #db4437);
    }

    .action-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border: 1px solid var(--divider-color, #e0e0e0);
      background: var(--card-background-color, #fff);
      color: var(--secondary-text-color, #727272);
      border-radius: 999px;
      padding: 4px 10px 4px 8px;
      font: inherit;
      font-size: 12px;
      white-space: nowrap;
    }
    .action-chip ha-icon {
      --mdc-icon-size: 16px;
    }
    .action-chip:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.06);
    }
    .action-chip:disabled {
      opacity: 0.5;
      cursor: default;
    }

    .empty {
      color: var(--secondary-text-color, #727272);
      text-align: center;
      padding: 32px 0;
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .card {
      background: var(--card-background-color, #fff);
      border-radius: 12px;
      box-shadow: var(
        --ha-card-box-shadow,
        0 2px 4px rgba(0, 0, 0, 0.1)
      );
      padding: 16px;
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .card-title {
      flex: 1;
      min-width: 0;
    }
    .card-title .name {
      font-size: 16px;
      font-weight: 500;
    }
    .card-title .meta {
      font-size: 13px;
      color: var(--secondary-text-color, #727272);
      text-transform: capitalize;
    }
    .card-actions {
      display: flex;
      gap: 2px;
    }

    .assignee-list {
      margin-top: 12px;
      border-top: 1px solid var(--divider-color, #e0e0e0);
    }
    .assignee-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
    }
    .assignee-row:last-child {
      border-bottom: none;
    }
    .assignee-row.privilege-row {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }
    .assignee-name {
      flex: 1;
      font-size: 14px;
    }
    .row-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 6px;
      margin-left: auto;
    }
    .category-actions {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--divider-color, #e0e0e0);
    }
    .assignee-main {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .block-steppers {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .block-steppers-label {
      font-size: 12px;
      color: var(--secondary-text-color, #727272);
      margin-right: 2px;
    }
    .stepper {
      display: inline-flex;
      align-items: stretch;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      overflow: hidden;
      height: 32px;
    }
    .stepper button {
      border: none;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      width: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .stepper button ha-icon {
      --mdc-icon-size: 16px;
    }
    .stepper button:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.06);
    }
    .stepper button:disabled {
      color: var(--disabled-text-color, #bdbdbd);
      cursor: default;
    }
    .stepper button:disabled:hover {
      background: none;
    }
    .stepper-unit {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 26px;
      padding: 0 6px;
      font-size: 12px;
      font-weight: 500;
      color: var(--secondary-text-color, #727272);
      border-left: 1px solid var(--divider-color, #e0e0e0);
      border-right: 1px solid var(--divider-color, #e0e0e0);
    }

    .state-chip {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 999px;
      white-space: nowrap;
    }
    .state-good {
      background: rgba(76, 175, 80, 0.15);
      color: #2e7d32;
    }
    .state-warn {
      background: rgba(255, 152, 0, 0.15);
      color: #ef6c00;
    }
    .state-bad {
      background: rgba(219, 68, 55, 0.12);
      color: var(--error-color, #db4437);
    }
    .state-neutral {
      background: rgba(0, 0, 0, 0.06);
      color: var(--secondary-text-color, #727272);
    }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 5vh 16px;
      z-index: 10;
      overflow-y: auto;
    }
    .dialog {
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      border-radius: 12px;
      width: 100%;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 16px 0 20px;
    }
    .dialog-header h2 {
      font-size: 18px;
      font-weight: 500;
      margin: 0;
    }
    .dialog-body {
      padding: 8px 20px 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 20px 20px;
    }

    label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 13px;
      color: var(--secondary-text-color, #727272);
    }
    input[type="text"],
    input[type="number"],
    select {
      font: inherit;
      font-size: 14px;
      color: var(--primary-text-color, #212121);
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 8px 10px;
    }
    .form-row {
      display: flex;
      gap: 12px;
    }
    .form-row label {
      flex: 1;
    }
    .hint {
      font-size: 12px;
      color: var(--secondary-text-color, #727272);
    }

    .icon-field {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .icon-field input {
      flex: 1;
    }

    .checkbox-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 160px;
      overflow-y: auto;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 8px;
    }
    .checkbox-item {
      flex-direction: row;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--primary-text-color, #212121);
    }

    .settings-section {
      background: var(--card-background-color, #fff);
      border-radius: 12px;
      box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
      padding: 16px;
      max-width: 420px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .settings-section h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
    }
    .settings-toggle {
      font-size: 14px;
    }

    .chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 6px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(3, 169, 244, 0.12);
      color: var(--primary-color, #03a9f4);
      border-radius: 999px;
      padding: 4px 6px 4px 10px;
      font-size: 13px;
    }
    .chip-remove {
      border: none;
      background: none;
      color: inherit;
      cursor: pointer;
      padding: 0 2px;
      font-size: 12px;
    }
    .chip-list input {
      border: none;
      flex: 1;
      min-width: 120px;
      padding: 4px;
    }
    .chip-list input:focus {
      outline: none;
    }
  `;
m([
  Q({ attribute: !1 })
], _.prototype, "hass", 2);
m([
  Q({ type: Boolean })
], _.prototype, "narrow", 2);
m([
  v()
], _.prototype, "_tab", 2);
m([
  v()
], _.prototype, "_dialog", 2);
m([
  v()
], _.prototype, "_busy", 2);
m([
  v()
], _.prototype, "_error", 2);
m([
  v()
], _.prototype, "_bulkUser", 2);
m([
  v()
], _.prototype, "_categoryFilter", 2);
m([
  v()
], _.prototype, "_userDisplayNames", 2);
m([
  v()
], _.prototype, "_settingsDraft", 2);
_ = m([
  He("simple-chores-panel")
], _);
