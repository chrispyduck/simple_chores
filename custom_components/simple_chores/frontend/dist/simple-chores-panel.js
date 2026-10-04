/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const M = globalThis, G = M.ShadowRoot && (M.ShadyCSS === void 0 || M.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, K = Symbol(), te = /* @__PURE__ */ new WeakMap();
let ge = class {
  constructor(e, s, o) {
    if (this._$cssResult$ = !0, o !== K) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = s;
  }
  get styleSheet() {
    let e = this.o;
    const s = this.t;
    if (G && e === void 0) {
      const o = s !== void 0 && s.length === 1;
      o && (e = te.get(s)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), o && te.set(s, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const we = (t) => new ge(typeof t == "string" ? t : t + "", void 0, K), ke = (t, ...e) => {
  const s = t.length === 1 ? t[0] : e.reduce((o, i, r) => o + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + t[r + 1], t[0]);
  return new ge(s, t, K);
}, Ce = (t, e) => {
  if (G) t.adoptedStyleSheets = e.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  else for (const s of e) {
    const o = document.createElement("style"), i = M.litNonce;
    i !== void 0 && o.setAttribute("nonce", i), o.textContent = s.cssText, t.appendChild(o);
  }
}, se = G ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let s = "";
  for (const o of e.cssRules) s += o.cssText;
  return we(s);
})(t) : t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Ae, defineProperty: Ee, getOwnPropertyDescriptor: Se, getOwnPropertyNames: De, getOwnPropertySymbols: Pe, getPrototypeOf: Te } = Object, W = globalThis, ie = W.trustedTypes, Ue = ie ? ie.emptyScript : "", Ne = W.reactiveElementPolyfillSupport, z = (t, e) => t, H = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? Ue : null;
      break;
    case Object:
    case Array:
      t = t == null ? t : JSON.stringify(t);
  }
  return t;
}, fromAttribute(t, e) {
  let s = t;
  switch (e) {
    case Boolean:
      s = t !== null;
      break;
    case Number:
      s = t === null ? null : Number(t);
      break;
    case Object:
    case Array:
      try {
        s = JSON.parse(t);
      } catch {
        s = null;
      }
  }
  return s;
} }, Y = (t, e) => !Ae(t, e), oe = { attribute: !0, type: String, converter: H, reflect: !1, useDefault: !1, hasChanged: Y };
Symbol.metadata ??= Symbol("metadata"), W.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let A = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, s = oe) {
    if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(e, s), !s.noAccessor) {
      const o = Symbol(), i = this.getPropertyDescriptor(e, o, s);
      i !== void 0 && Ee(this.prototype, e, i);
    }
  }
  static getPropertyDescriptor(e, s, o) {
    const { get: i, set: r } = Se(this.prototype, e) ?? { get() {
      return this[s];
    }, set(a) {
      this[s] = a;
    } };
    return { get: i, set(a) {
      const n = i?.call(this);
      r?.call(this, a), this.requestUpdate(e, n, o);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? oe;
  }
  static _$Ei() {
    if (this.hasOwnProperty(z("elementProperties"))) return;
    const e = Te(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(z("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(z("properties"))) {
      const s = this.properties, o = [...De(s), ...Pe(s)];
      for (const i of o) this.createProperty(i, s[i]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const s = litPropertyMetadata.get(e);
      if (s !== void 0) for (const [o, i] of s) this.elementProperties.set(o, i);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [s, o] of this.elementProperties) {
      const i = this._$Eu(s, o);
      i !== void 0 && this._$Eh.set(i, s);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const s = [];
    if (Array.isArray(e)) {
      const o = new Set(e.flat(1 / 0).reverse());
      for (const i of o) s.unshift(se(i));
    } else e !== void 0 && s.push(se(e));
    return s;
  }
  static _$Eu(e, s) {
    const o = s.attribute;
    return o === !1 ? void 0 : typeof o == "string" ? o : typeof e == "string" ? e.toLowerCase() : void 0;
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
    const e = /* @__PURE__ */ new Map(), s = this.constructor.elementProperties;
    for (const o of s.keys()) this.hasOwnProperty(o) && (e.set(o, this[o]), delete this[o]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Ce(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((e) => e.hostDisconnected?.());
  }
  attributeChangedCallback(e, s, o) {
    this._$AK(e, o);
  }
  _$ET(e, s) {
    const o = this.constructor.elementProperties.get(e), i = this.constructor._$Eu(e, o);
    if (i !== void 0 && o.reflect === !0) {
      const r = (o.converter?.toAttribute !== void 0 ? o.converter : H).toAttribute(s, o.type);
      this._$Em = e, r == null ? this.removeAttribute(i) : this.setAttribute(i, r), this._$Em = null;
    }
  }
  _$AK(e, s) {
    const o = this.constructor, i = o._$Eh.get(e);
    if (i !== void 0 && this._$Em !== i) {
      const r = o.getPropertyOptions(i), a = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : H;
      this._$Em = i;
      const n = a.fromAttribute(s, r.type);
      this[i] = n ?? this._$Ej?.get(i) ?? n, this._$Em = null;
    }
  }
  requestUpdate(e, s, o, i = !1, r) {
    if (e !== void 0) {
      const a = this.constructor;
      if (i === !1 && (r = this[e]), o ??= a.getPropertyOptions(e), !((o.hasChanged ?? Y)(r, s) || o.useDefault && o.reflect && r === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, o)))) return;
      this.C(e, s, o);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, s, { useDefault: o, reflect: i, wrapped: r }, a) {
    o && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? s ?? this[e]), r !== !0 || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || o || (s = void 0), this._$AL.set(e, s)), i === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (s) {
      Promise.reject(s);
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
        for (const [i, r] of this._$Ep) this[i] = r;
        this._$Ep = void 0;
      }
      const o = this.constructor.elementProperties;
      if (o.size > 0) for (const [i, r] of o) {
        const { wrapped: a } = r, n = this[i];
        a !== !0 || this._$AL.has(i) || n === void 0 || this.C(i, void 0, r, n);
      }
    }
    let e = !1;
    const s = this._$AL;
    try {
      e = this.shouldUpdate(s), e ? (this.willUpdate(s), this._$EO?.forEach((o) => o.hostUpdate?.()), this.update(s)) : this._$EM();
    } catch (o) {
      throw e = !1, this._$EM(), o;
    }
    e && this._$AE(s);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    this._$EO?.forEach((s) => s.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
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
    this._$Eq &&= this._$Eq.forEach((s) => this._$ET(s, this[s])), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
A.elementStyles = [], A.shadowRootOptions = { mode: "open" }, A[z("elementProperties")] = /* @__PURE__ */ new Map(), A[z("finalized")] = /* @__PURE__ */ new Map(), Ne?.({ ReactiveElement: A }), (W.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const X = globalThis, re = (t) => t, L = X.trustedTypes, ae = L ? L.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, me = "$lit$", v = `lit$${Math.random().toFixed(9).slice(2)}$`, be = "?" + v, ze = `<${be}>`, k = document, F = () => k.createComment(""), I = (t) => t === null || typeof t != "object" && typeof t != "function", Z = Array.isArray, Re = (t) => Z(t) || typeof t?.[Symbol.iterator] == "function", V = `[ 	
\f\r]`, U = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ne = /-->/g, le = />/g, $ = RegExp(`>|${V}(?:([^\\s"'>=/]+)(${V}*=${V}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ce = /'/g, de = /"/g, _e = /^(?:script|style|textarea|title)$/i, Fe = (t) => (e, ...s) => ({ _$litType$: t, strings: e, values: s }), l = Fe(1), P = Symbol.for("lit-noChange"), d = Symbol.for("lit-nothing"), pe = /* @__PURE__ */ new WeakMap(), w = k.createTreeWalker(k, 129);
function ye(t, e) {
  if (!Z(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ae !== void 0 ? ae.createHTML(e) : e;
}
const Ie = (t, e) => {
  const s = t.length - 1, o = [];
  let i, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", a = U;
  for (let n = 0; n < s; n++) {
    const c = t[n];
    let m, _, h = -1, y = 0;
    for (; y < c.length && (a.lastIndex = y, _ = a.exec(c), _ !== null); ) y = a.lastIndex, a === U ? _[1] === "!--" ? a = ne : _[1] !== void 0 ? a = le : _[2] !== void 0 ? (_e.test(_[2]) && (i = RegExp("</" + _[2], "g")), a = $) : _[3] !== void 0 && (a = $) : a === $ ? _[0] === ">" ? (a = i ?? U, h = -1) : _[1] === void 0 ? h = -2 : (h = a.lastIndex - _[2].length, m = _[1], a = _[3] === void 0 ? $ : _[3] === '"' ? de : ce) : a === de || a === ce ? a = $ : a === ne || a === le ? a = U : (a = $, i = void 0);
    const f = a === $ && t[n + 1].startsWith("/>") ? " " : "";
    r += a === U ? c + ze : h >= 0 ? (o.push(m), c.slice(0, h) + me + c.slice(h) + v + f) : c + v + (h === -2 ? n : f);
  }
  return [ye(t, r + (t[s] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), o];
};
class O {
  constructor({ strings: e, _$litType$: s }, o) {
    let i;
    this.parts = [];
    let r = 0, a = 0;
    const n = e.length - 1, c = this.parts, [m, _] = Ie(e, s);
    if (this.el = O.createElement(m, o), w.currentNode = this.el.content, s === 2 || s === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (i = w.nextNode()) !== null && c.length < n; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const h of i.getAttributeNames()) if (h.endsWith(me)) {
          const y = _[a++], f = i.getAttribute(h).split(v), q = /([.?@])?(.*)/.exec(y);
          c.push({ type: 1, index: r, name: q[2], strings: f, ctor: q[1] === "." ? je : q[1] === "?" ? qe : q[1] === "@" ? Me : B }), i.removeAttribute(h);
        } else h.startsWith(v) && (c.push({ type: 6, index: r }), i.removeAttribute(h));
        if (_e.test(i.tagName)) {
          const h = i.textContent.split(v), y = h.length - 1;
          if (y > 0) {
            i.textContent = L ? L.emptyScript : "";
            for (let f = 0; f < y; f++) i.append(h[f], F()), w.nextNode(), c.push({ type: 2, index: ++r });
            i.append(h[y], F());
          }
        }
      } else if (i.nodeType === 8) if (i.data === be) c.push({ type: 2, index: r });
      else {
        let h = -1;
        for (; (h = i.data.indexOf(v, h + 1)) !== -1; ) c.push({ type: 7, index: r }), h += v.length - 1;
      }
      r++;
    }
  }
  static createElement(e, s) {
    const o = k.createElement("template");
    return o.innerHTML = e, o;
  }
}
function T(t, e, s = t, o) {
  if (e === P) return e;
  let i = o !== void 0 ? s._$Co?.[o] : s._$Cl;
  const r = I(e) ? void 0 : e._$litDirective$;
  return i?.constructor !== r && (i?._$AO?.(!1), r === void 0 ? i = void 0 : (i = new r(t), i._$AT(t, s, o)), o !== void 0 ? (s._$Co ??= [])[o] = i : s._$Cl = i), i !== void 0 && (e = T(t, i._$AS(t, e.values), i, o)), e;
}
class Oe {
  constructor(e, s) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = s;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: s }, parts: o } = this._$AD, i = (e?.creationScope ?? k).importNode(s, !0);
    w.currentNode = i;
    let r = w.nextNode(), a = 0, n = 0, c = o[0];
    for (; c !== void 0; ) {
      if (a === c.index) {
        let m;
        c.type === 2 ? m = new j(r, r.nextSibling, this, e) : c.type === 1 ? m = new c.ctor(r, c.name, c.strings, this, e) : c.type === 6 && (m = new He(r, this, e)), this._$AV.push(m), c = o[++n];
      }
      a !== c?.index && (r = w.nextNode(), a++);
    }
    return w.currentNode = k, i;
  }
  p(e) {
    let s = 0;
    for (const o of this._$AV) o !== void 0 && (o.strings !== void 0 ? (o._$AI(e, o, s), s += o.strings.length - 2) : o._$AI(e[s])), s++;
  }
}
class j {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, s, o, i) {
    this.type = 2, this._$AH = d, this._$AN = void 0, this._$AA = e, this._$AB = s, this._$AM = o, this.options = i, this._$Cv = i?.isConnected ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const s = this._$AM;
    return s !== void 0 && e?.nodeType === 11 && (e = s.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, s = this) {
    e = T(this, e, s), I(e) ? e === d || e == null || e === "" ? (this._$AH !== d && this._$AR(), this._$AH = d) : e !== this._$AH && e !== P && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Re(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== d && I(this._$AH) ? this._$AA.nextSibling.data = e : this.T(k.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: s, _$litType$: o } = e, i = typeof o == "number" ? this._$AC(e) : (o.el === void 0 && (o.el = O.createElement(ye(o.h, o.h[0]), this.options)), o);
    if (this._$AH?._$AD === i) this._$AH.p(s);
    else {
      const r = new Oe(i, this), a = r.u(this.options);
      r.p(s), this.T(a), this._$AH = r;
    }
  }
  _$AC(e) {
    let s = pe.get(e.strings);
    return s === void 0 && pe.set(e.strings, s = new O(e)), s;
  }
  k(e) {
    Z(this._$AH) || (this._$AH = [], this._$AR());
    const s = this._$AH;
    let o, i = 0;
    for (const r of e) i === s.length ? s.push(o = new j(this.O(F()), this.O(F()), this, this.options)) : o = s[i], o._$AI(r), i++;
    i < s.length && (this._$AR(o && o._$AB.nextSibling, i), s.length = i);
  }
  _$AR(e = this._$AA.nextSibling, s) {
    for (this._$AP?.(!1, !0, s); e !== this._$AB; ) {
      const o = re(e).nextSibling;
      re(e).remove(), e = o;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class B {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, s, o, i, r) {
    this.type = 1, this._$AH = d, this._$AN = void 0, this.element = e, this.name = s, this._$AM = i, this.options = r, o.length > 2 || o[0] !== "" || o[1] !== "" ? (this._$AH = Array(o.length - 1).fill(new String()), this.strings = o) : this._$AH = d;
  }
  _$AI(e, s = this, o, i) {
    const r = this.strings;
    let a = !1;
    if (r === void 0) e = T(this, e, s, 0), a = !I(e) || e !== this._$AH && e !== P, a && (this._$AH = e);
    else {
      const n = e;
      let c, m;
      for (e = r[0], c = 0; c < r.length - 1; c++) m = T(this, n[o + c], s, c), m === P && (m = this._$AH[c]), a ||= !I(m) || m !== this._$AH[c], m === d ? e = d : e !== d && (e += (m ?? "") + r[c + 1]), this._$AH[c] = m;
    }
    a && !i && this.j(e);
  }
  j(e) {
    e === d ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class je extends B {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === d ? void 0 : e;
  }
}
class qe extends B {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== d);
  }
}
class Me extends B {
  constructor(e, s, o, i, r) {
    super(e, s, o, i, r), this.type = 5;
  }
  _$AI(e, s = this) {
    if ((e = T(this, e, s, 0) ?? d) === P) return;
    const o = this._$AH, i = e === d && o !== d || e.capture !== o.capture || e.once !== o.once || e.passive !== o.passive, r = e !== d && (o === d || i);
    i && this.element.removeEventListener(this.name, this, o), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class He {
  constructor(e, s, o) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = s, this.options = o;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    T(this, e);
  }
}
const Le = X.litHtmlPolyfillSupport;
Le?.(O, j), (X.litHtmlVersions ??= []).push("3.3.3");
const We = (t, e, s) => {
  const o = s?.renderBefore ?? e;
  let i = o._$litPart$;
  if (i === void 0) {
    const r = s?.renderBefore ?? null;
    o._$litPart$ = i = new j(e.insertBefore(F(), r), r, void 0, s ?? {});
  }
  return i._$AI(t), i;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const J = globalThis;
class R extends A {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const s = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = We(s, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return P;
  }
}
R._$litElement$ = !0, R.finalized = !0, J.litElementHydrateSupport?.({ LitElement: R });
const Be = J.litElementPolyfillSupport;
Be?.({ LitElement: R });
(J.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ve = (t) => (e, s) => {
  s !== void 0 ? s.addInitializer(() => {
    customElements.define(t, e);
  }) : customElements.define(t, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ge = { attribute: !0, type: String, converter: H, reflect: !1, hasChanged: Y }, Ke = (t = Ge, e, s) => {
  const { kind: o, metadata: i } = s;
  let r = globalThis.litPropertyMetadata.get(i);
  if (r === void 0 && globalThis.litPropertyMetadata.set(i, r = /* @__PURE__ */ new Map()), o === "setter" && ((t = Object.create(t)).wrapped = !0), r.set(s.name, t), o === "accessor") {
    const { name: a } = s;
    return { set(n) {
      const c = e.get.call(this);
      e.set.call(this, n), this.requestUpdate(a, c, t, !0, n);
    }, init(n) {
      return n !== void 0 && this.C(a, void 0, t, n), n;
    } };
  }
  if (o === "setter") {
    const { name: a } = s;
    return function(n) {
      const c = this[a];
      e.call(this, n), this.requestUpdate(a, c, t, !0, n);
    };
  }
  throw Error("Unsupported decorator location: " + o);
};
function Q(t) {
  return (e, s) => typeof s == "object" ? Ke(t, e, s) : ((o, i, r) => {
    const a = i.hasOwnProperty(r);
    return i.constructor.createProperty(r, o), a ? Object.getOwnPropertyDescriptor(i, r) : void 0;
  })(t, e, s);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function b(t) {
  return Q({ ...t, state: !0, attribute: !1 });
}
const Ye = "sensor.simple_chore_", fe = "sensor.simple_chore_privilege_", ve = "sensor.simple_chore_meta_", $e = "sensor.simple_chore_category_", Xe = "number.simple_chore_meta_", xe = "sensor.simple_chore_meta_settings", Ze = ["daily", "weekly", "manual", "once"], Je = ["automatic", "manual"], Qe = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
], E = "mdi:clipboard-list-outline", S = "mdi:star", D = "mdi:tag-outline", ee = "";
function et() {
  return {
    slug: "",
    name: "",
    description: "",
    frequency: "daily",
    icon: E,
    points: 1,
    pointsByAssignee: {},
    category: ee,
    assignees: []
  };
}
function tt(t) {
  const e = {};
  for (const s of t.assignees)
    s.points !== t.points && (e[s.assignee] = s.points);
  return {
    slug: t.slug,
    name: t.name,
    description: t.description,
    frequency: t.frequency,
    icon: t.icon,
    points: t.points,
    pointsByAssignee: e,
    category: t.category ?? ee,
    assignees: t.assignees.map((s) => s.assignee)
  };
}
function st() {
  return {
    slug: "",
    name: "",
    icon: D
  };
}
function it(t) {
  return {
    slug: t.slug,
    name: t.name,
    icon: t.icon
  };
}
function ot() {
  return {
    slug: "",
    name: "",
    icon: S,
    behavior: "automatic",
    linkedChores: [],
    assignees: []
  };
}
function rt(t) {
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
function at(t) {
  const e = /* @__PURE__ */ new Map();
  for (const [s, o] of Object.entries(t)) {
    if (!s.startsWith(Ye) || s.startsWith(fe) || s.startsWith(ve) || s.startsWith($e)) continue;
    const i = o.attributes, r = i.chore_slug;
    if (!r) continue;
    let a = e.get(r);
    a || (a = {
      slug: r,
      name: i.chore_name ?? r,
      description: i.description ?? "",
      frequency: i.frequency ?? "daily",
      icon: i.icon ?? E,
      // default_points is the chore's shared value; older/unrefreshed
      // sensors may not have it yet, so fall back to this assignee's
      // resolved points rather than leaving the definition unset.
      points: i.default_points ?? i.points ?? 0,
      category: i.category ?? null,
      assignees: []
    }, e.set(r, a)), a.assignees.push({
      assignee: i.assignee,
      entityId: s,
      state: o.state,
      points: i.points ?? a.points
    });
  }
  for (const s of e.values())
    s.assignees.sort((o, i) => o.assignee.localeCompare(i.assignee));
  return [...e.values()].sort((s, o) => s.name.localeCompare(o.name));
}
function nt(t) {
  const e = /* @__PURE__ */ new Map();
  for (const [s, o] of Object.entries(t)) {
    if (!s.startsWith(fe)) continue;
    const i = o.attributes, r = i.privilege_slug;
    if (!r) continue;
    let a = e.get(r);
    a || (a = {
      slug: r,
      name: i.privilege_name ?? r,
      icon: i.icon ?? S,
      behavior: i.behavior ?? "automatic",
      linkedChores: i.linked_chores ?? [],
      assignees: []
    }, e.set(r, a)), a.assignees.push({
      assignee: i.assignee,
      entityId: s,
      state: o.state,
      disableUntil: i.disable_until,
      disableReason: i.disable_reason
    });
  }
  for (const s of e.values())
    s.assignees.sort((o, i) => o.assignee.localeCompare(i.assignee));
  return [...e.values()].sort((s, o) => s.name.localeCompare(o.name));
}
function lt(t) {
  const e = [];
  for (const [s, o] of Object.entries(t)) {
    if (!s.startsWith($e)) continue;
    const i = o.attributes, r = i.category_slug;
    r && e.push({
      slug: r,
      name: i.category_name ?? r,
      icon: i.icon ?? D,
      entityId: s,
      choreCount: Number(o.state) || 0
    });
  }
  return e.sort((s, o) => s.name.localeCompare(o.name));
}
const C = {
  autoFinalizeEnabled: !0,
  autoFinalizeDelayMinutes: 60,
  newDayTime: "02:00:00",
  newWeekDay: "monday",
  newWeekTime: "02:00:00"
};
function ct(t) {
  const e = t[xe];
  if (!e) return { ...C };
  const s = e.attributes;
  return {
    autoFinalizeEnabled: s.auto_finalize_enabled ?? C.autoFinalizeEnabled,
    autoFinalizeDelayMinutes: s.auto_finalize_delay_minutes ?? C.autoFinalizeDelayMinutes,
    newDayTime: s.new_day_time ?? C.newDayTime,
    newWeekDay: s.new_week_day ?? C.newWeekDay,
    newWeekTime: s.new_week_time ?? C.newWeekTime
  };
}
function dt(t) {
  const e = [];
  for (const [s, o] of Object.entries(t)) {
    if (!s.startsWith(ve) || s === xe) continue;
    const i = o.attributes, r = i.assignee;
    r && e.push({
      assignee: r,
      entityId: s,
      totalPoints: i.total_points ?? 0,
      pointsEarned: i.points_earned ?? 0,
      pointsMissed: i.points_missed ?? 0,
      pointsPossible: i.points_possible ?? 0,
      totalPending: i.total_pending ?? 0,
      totalComplete: i.total_complete ?? 0
    });
  }
  return e.sort((s, o) => s.assignee.localeCompare(o.assignee));
}
function pt(t) {
  const e = [];
  for (const [s, o] of Object.entries(t)) {
    if (!s.startsWith(Xe)) continue;
    const i = o.attributes.assignee;
    i && e.push({
      assignee: i,
      entityId: s,
      value: Number(o.state) || 0
    });
  }
  return e.sort((s, o) => s.assignee.localeCompare(o.assignee));
}
function ht(t, e) {
  const s = /* @__PURE__ */ new Set();
  for (const o of t)
    for (const i of o.assignees) s.add(i.assignee);
  for (const o of e)
    for (const i of o.assignees) s.add(i.assignee);
  return [...s].sort((o, i) => o.localeCompare(i));
}
function ut(t) {
  const e = {};
  for (const s of t)
    s.username && (e[s.username.toLowerCase()] = s.name);
  return e;
}
function gt(t, e) {
  return e[t.toLowerCase()] ?? t;
}
const mt = [
  "completed",
  "uncompleted",
  "reset",
  "missed",
  "adjusted",
  "points_reset"
];
function bt(t) {
  return t ? t.map((e) => ({
    id: e.id,
    timestamp: e.timestamp,
    action: e.action,
    choreSlug: e.chore_slug,
    choreName: e.chore_name ?? e.chore_slug,
    category: e.category ?? null,
    assignee: e.assignee,
    pointsDelta: e.points_delta ?? 0,
    pointsTotal: e.points_total ?? 0,
    pointsMissed: e.points_missed ?? 0,
    missedTotal: e.missed_total ?? null
  })) : [];
}
function he(t) {
  switch (t) {
    case "completed":
      return "Completed";
    case "uncompleted":
      return "Un-completed";
    case "reset":
      return "Reset";
    case "missed":
      return "Missed";
    case "adjusted":
      return "Adjusted";
    case "points_reset":
      return "Points reset";
    default:
      return t;
  }
}
function ue(t) {
  return t === "completed" ? "state-good" : t === "uncompleted" ? "state-bad" : t === "missed" || t === "adjusted" ? "state-warn" : "state-neutral";
}
var _t = Object.defineProperty, yt = Object.getOwnPropertyDescriptor, g = (t, e, s, o) => {
  for (var i = o > 1 ? void 0 : o ? yt(e, s) : e, r = t.length - 1, a; r >= 0; r--)
    (a = t[r]) && (i = (o ? a(e, s, i) : a(i)) || i);
  return o && i && _t(e, s, i), i;
};
const p = "simple_chores", N = "__uncategorized__";
let u = class extends R {
  constructor() {
    super(...arguments), this.narrow = !1, this._tab = "chores", this._dialog = null, this._busy = !1, this._error = null, this._bulkUser = "", this._categoryFilter = "", this._choreSort = "name", this._userDisplayNames = {}, this._settingsDraft = null, this._resetPointsDialog = null, this._userAdjustInput = {}, this._disableReasonInput = {}, this._historyEntries = null, this._historyLoading = !1, this._historyUserFilter = "", this._historyCategoryFilter = "", this._historyChoreFilter = "", this._historyActionFilter = [], this._loadedUserDisplayNames = !1, this._openResetPointsDialog = (t) => {
      this._error = null, this._resetPointsDialog = {
        user: t.length === 1 ? t[0] : "",
        resetTotal: !1
      };
    }, this._onResetPointsOverlayClick = (t) => {
      t.target === t.currentTarget && (this._resetPointsDialog = null);
    }, this._openHistoryTab = () => {
      this._tab = "history", this._historyEntries === null && this._loadHistory();
    }, this._onOverlayClick = (t) => {
      t.target === t.currentTarget && this._closeDialog();
    }, this._dismissError = () => {
      this._error = null;
    }, this._closeDialog = () => {
      this._dialog = null;
    }, this._openCreateChore = () => {
      this._error = null, this._dialog = { kind: "chore", draft: et() };
    }, this._openCreatePrivilege = () => {
      this._error = null, this._dialog = { kind: "privilege", draft: ot() };
    }, this._openCreateCategory = () => {
      this._error = null, this._dialog = { kind: "category", draft: st() };
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
      this._userDisplayNames = ut(t);
    } catch (t) {
      console.warn("simple-chores-panel: failed to load user display names", t);
    }
  }
  _displayName(t) {
    return gt(t, this._userDisplayNames);
  }
  render() {
    if (!this.hass) return d;
    const t = at(this.hass.states), e = nt(this.hass.states), s = lt(this.hass.states), o = ct(this.hass.states), i = dt(this.hass.states), r = pt(this.hass.states), a = ht(t, e);
    return l`
      <div class="toolbar">
        <ha-icon icon="mdi:clipboard-check-outline"></ha-icon>
        <span class="toolbar-title">Chores</span>
        ${this._busy ? l`<ha-icon class="spin" icon="mdi:loading"></ha-icon>` : d}
      </div>

      <div class="content">
        ${this._error ? l`
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
            class="tab ${this._tab === "users" ? "active" : ""}"
            @click=${() => this._tab = "users"}
          >
            Users
          </button>
          <button
            class="tab ${this._tab === "history" ? "active" : ""}"
            @click=${this._openHistoryTab}
          >
            History
          </button>
          <button
            class="tab ${this._tab === "settings" ? "active" : ""}"
            @click=${() => this._tab = "settings"}
          >
            Settings
          </button>
        </div>

        ${this._tab === "chores" ? this._renderChoresTab(t, s, a) : this._tab === "privileges" ? this._renderPrivilegesTab(e, t, a) : this._tab === "categories" ? this._renderCategoriesTab(s, a) : this._tab === "users" ? this._renderUsersTab(a, i, r) : this._tab === "history" ? this._renderHistoryTab(t, s, a) : this._renderSettingsTab(o, a)}
      </div>

      ${this._dialog ? this._renderDialog(t, s, a) : d}
      ${this._resetPointsDialog ? this._renderResetPointsDialog(a) : d}
    `;
  }
  // --- Chores tab ----------------------------------------------------
  _renderChoresTab(t, e, s) {
    const o = t.filter((a) => {
      if (this._categoryFilter) {
        if (this._categoryFilter === N) {
          if (a.category) return !1;
        } else if (a.category !== this._categoryFilter)
          return !1;
      }
      return !(this._bulkUser && !a.assignees.some((n) => n.assignee === this._bulkUser));
    }), i = this._sortChores(o, e), r = this._categoryFilter && this._categoryFilter !== N;
    return l`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreateChore}>
          <ha-icon icon="mdi:plus"></ha-icon> New chore
        </button>
        ${this._renderCategoryFilterPicker(e)}
        ${this._renderChoreSortPicker()}
        ${r ? l`
              <button
                title="Reset completed manual chores in this category to not requested, and count pending ones as missed"
                @click=${() => this._categoryAction(this._categoryFilter, "finalize_by_category")}
              >
                Finalize by category
              </button>
            ` : d}
        <div class="spacer"></div>
        ${this._renderBulkUserPicker(s)}
        <button @click=${() => this._resetCompleted()}>Reset completed</button>
        <button @click=${() => this._startNewDay()}>Start new day</button>
      </div>

      ${this._renderPointsSummary(o)}

      ${i.length === 0 ? l`<p class="empty">
            ${t.length === 0 ? "No chores yet. Create one to get started." : "No chores match the current filters."}
          </p>` : l`<div class="card-grid">
            ${i.map((a) => this._renderChoreCard(a, e))}
          </div>`}
    `;
  }
  _renderChoreSortPicker() {
    const t = [
      { value: "name", label: "Sort: Name" },
      { value: "points", label: "Sort: Points (high to low)" },
      { value: "frequency", label: "Sort: Frequency" },
      { value: "category", label: "Sort: Category" }
    ];
    return l`
      <select
        class="user-picker"
        title="Sort chores"
        .value=${this._choreSort}
        @change=${(e) => this._choreSort = e.target.value}
      >
        ${t.map((e) => l`<option value=${e.value}>${e.label}</option>`)}
      </select>
    `;
  }
  _sortChores(t, e) {
    const s = [...t], o = (i) => i ? e.find((r) => r.slug === i)?.name ?? i : "";
    switch (this._choreSort) {
      case "points":
        s.sort((i, r) => r.points - i.points || i.name.localeCompare(r.name));
        break;
      case "frequency":
        s.sort(
          (i, r) => i.frequency.localeCompare(r.frequency) || i.name.localeCompare(r.name)
        );
        break;
      case "category":
        s.sort(
          (i, r) => o(i.category).localeCompare(o(r.category)) || i.name.localeCompare(r.name)
        );
        break;
      case "name":
      default:
        s.sort((i, r) => i.name.localeCompare(r.name));
    }
    return s;
  }
  /**
   * A "points possible" line summing each displayed assignee's points
   * across the currently-filtered chores - "if you did everything shown
   * here, how many points could you earn". Respects the same per-assignee
   * filter the chore cards themselves apply (see _renderChoreCard).
   */
  _renderPointsSummary(t) {
    const e = /* @__PURE__ */ new Map();
    for (const o of t)
      for (const i of o.assignees)
        this._bulkUser && i.assignee !== this._bulkUser || e.set(i.assignee, (e.get(i.assignee) ?? 0) + i.points);
    if (e.size === 0) return d;
    const s = [...e.entries()].sort((o, i) => o[0].localeCompare(i[0]));
    return l`
      <div class="points-summary">
        <ha-icon icon="mdi:star-outline"></ha-icon>
        <span>Points possible:</span>
        ${s.map(
      ([o, i], r) => l`
            ${r > 0 ? l`<span class="points-summary-sep">·</span>` : d}
            <span
              ><strong>${this._displayName(o)}</strong> ${i}</span
            >
          `
    )}
      </div>
    `;
  }
  _renderCategoryFilterPicker(t) {
    return l`
      <select
        class="user-picker"
        title="Filter chores by category"
        .value=${this._categoryFilter}
        @change=${(e) => this._categoryFilter = e.target.value}
      >
        <option value="">All categories</option>
        <option value=${N}>Uncategorized</option>
        ${t.map(
      (e) => l`<option value=${e.slug}>${e.name}</option>`
    )}
      </select>
    `;
  }
  _renderBulkUserPicker(t) {
    return l`
      <select
        class="user-picker"
        title="Filter the chores shown below, and limit Reset completed / Start new day, to one assignee"
        .value=${this._bulkUser}
        @change=${(e) => this._bulkUser = e.target.value}
      >
        <option value="">All assignees</option>
        ${t.map(
      (e) => l`<option value=${e}>${this._displayName(e)}</option>`
    )}
      </select>
    `;
  }
  _renderChoreCard(t, e) {
    const s = t.assignees.some((r) => r.points !== t.points), o = `${t.points} point${t.points === 1 ? "" : "s"}${s ? " (default)" : ""}`, i = t.category ? e.find((r) => r.slug === t.category)?.name ?? t.category : null;
    return l`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${t.icon || E}></ha-icon>
          <div class="card-title">
            <div class="name">${t.name}</div>
            <div class="meta">
              ${t.frequency} · ${o}
              ${i ? l` · ${i}` : d}
              ${t.description ? l` · ${t.description}` : d}
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
          ${t.assignees.filter((r) => !this._bulkUser || r.assignee === this._bulkUser).map(
      (r) => l`
                <div class="assignee-row">
                  <span class="assignee-name">${this._displayName(r.assignee)}</span>
                  ${r.points !== t.points ? l`<span class="points-override-badge" title="Point override"
                        >${r.points}pt</span
                      >` : d}
                  <span class="state-chip ${this._choreStateClass(r.state)}"
                    >${r.state}</span
                  >
                  <div class="row-actions">
                    <button
                      class="icon-button"
                      title="Request"
                      ?disabled=${r.state === "Pending"}
                      @click=${() => this._markChore(t.slug, r.assignee, "mark_pending")}
                    >
                      <ha-icon icon="mdi:plus-circle-outline"></ha-icon>
                    </button>
                    <button
                      class="icon-button"
                      title="Complete"
                      ?disabled=${r.state === "Complete"}
                      @click=${() => this._markChore(t.slug, r.assignee, "mark_complete")}
                    >
                      <ha-icon icon="mdi:check-circle-outline"></ha-icon>
                    </button>
                    <button
                      class="icon-button"
                      title="Clear"
                      ?disabled=${r.state === "Not Requested"}
                      @click=${() => this._markChore(
        t.slug,
        r.assignee,
        "mark_not_requested"
      )}
                    >
                      <ha-icon icon="mdi:close-circle-outline"></ha-icon>
                    </button>
                    <button
                      class="icon-button"
                      title="Finalize now (instead of waiting for auto-finalize)"
                      ?disabled=${r.state !== "Complete"}
                      @click=${() => this._finalizeOne(t.slug, r.assignee)}
                    >
                      <ha-icon icon="mdi:flag-checkered"></ha-icon>
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
  _renderPrivilegesTab(t, e, s) {
    return l`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreatePrivilege}>
          <ha-icon icon="mdi:plus"></ha-icon> New privilege
        </button>
      </div>

      ${t.length === 0 ? l`<p class="empty">No privileges yet. Create one to get started.</p>` : l`<div class="card-grid">
            ${t.map((o) => this._renderPrivilegeCard(o, e, s))}
          </div>`}
    `;
  }
  _renderPrivilegeCard(t, e, s) {
    const o = t.linkedChores.map(
      (i) => e.find((r) => r.slug === i)?.name ?? i
    );
    return l`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${t.icon || S}></ha-icon>
          <div class="card-title">
            <div class="name">${t.name}</div>
            <div class="meta">
              ${t.behavior}
              ${o.length ? l` · linked: ${o.join(", ")}` : l` · linked: all requested chores`}
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
          ${t.assignees.map((i) => {
      const r = i.state === "Temporarily Disabled", a = this._disableReasonKey(t.slug, i.assignee);
      return l`
              <div class="assignee-row privilege-row">
                <div class="assignee-main">
                  <span class="assignee-name">${this._displayName(i.assignee)}</span>
                  <span class="state-chip ${this._privilegeStateClass(i.state)}">
                    ${i.state}${r && i.disableUntil ? l` (${this._formatUntil(i.disableUntil)})` : d}
                  </span>
                  ${r && i.disableReason ? l`<span class="disable-reason">"${i.disableReason}"</span>` : d}
                  ${t.behavior === "manual" ? l`
                        <div class="row-actions">
                          <button
                            class="action-chip"
                            title="Enable"
                            ?disabled=${i.state === "Enabled"}
                            @click=${() => this._call(p, "enable_privilege", {
        user: i.assignee,
        privilege_slug: t.slug
      })}
                          >
                            <ha-icon icon="mdi:check-circle-outline"></ha-icon>
                            <span>Enable</span>
                          </button>
                          <button
                            class="action-chip"
                            title="Disable"
                            ?disabled=${i.state === "Disabled"}
                            @click=${() => this._call(p, "disable_privilege", {
        user: i.assignee,
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
                  <input
                    type="text"
                    class="disable-reason-input"
                    placeholder="Reason (optional)"
                    .value=${this._disableReasonInput[a] ?? i.disableReason ?? ""}
                    @input=${(n) => {
        this._disableReasonInput = {
          ...this._disableReasonInput,
          [a]: n.target.value
        };
      }}
                    @keydown=${(n) => {
        n.key === "Enter" && n.target.blur();
      }}
                    @blur=${() => {
        r && this._saveDisableReason(
          t.slug,
          i.assignee,
          i.disableReason
        );
      }}
                  />
                  ${this._renderBlockStepper(
        "1h",
        r,
        () => this._adjustTemporaryDisable(t.slug, i.assignee, -60),
        () => this._addTemporaryDisable(
          t.slug,
          i.assignee,
          r,
          60,
          a
        )
      )}
                  ${this._renderBlockStepper(
        "1d",
        r,
        () => this._adjustTemporaryDisable(t.slug, i.assignee, -1440),
        () => this._addTemporaryDisable(
          t.slug,
          i.assignee,
          r,
          1440,
          a
        )
      )}
                  <button
                    class="action-chip"
                    title="Clear the block now"
                    ?disabled=${!r}
                    @click=${() => this._clearTemporaryDisable(t.slug, i.assignee)}
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
  _renderBlockStepper(t, e, s, o) {
    return l`
      <div class="stepper">
        <button
          title="Shorten the block by ${t}"
          ?disabled=${!e}
          @click=${s}
        >
          <ha-icon icon="mdi:minus"></ha-icon>
        </button>
        <span class="stepper-unit">${t}</span>
        <button title="Extend the block by ${t}" @click=${o}>
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
      const e = new Date(t), s = /* @__PURE__ */ new Date(), o = e.toDateString() === s.toDateString(), i = e.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
      return o ? `until ${i}` : `until ${e.toLocaleDateString()} ${i}`;
    } catch {
      return "";
    }
  }
  // --- Categories tab --------------------------------------------------
  _renderCategoriesTab(t, e) {
    return l`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreateCategory}>
          <ha-icon icon="mdi:plus"></ha-icon> New category
        </button>
        <div class="spacer"></div>
        ${this._renderBulkUserPicker(e)}
      </div>

      ${t.length === 0 ? l`<p class="empty">
            No categories yet. Create one, then assign it to chores.
          </p>` : l`<div class="card-grid">
            ${t.map((s) => this._renderCategoryCard(s))}
          </div>`}
    `;
  }
  _renderCategoryCard(t) {
    const e = `${t.choreCount} chore${t.choreCount === 1 ? "" : "s"}`;
    return l`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${t.icon || D}></ha-icon>
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
  _renderSettingsTab(t, e) {
    this._settingsDraft || (this._settingsDraft = {
      autoFinalizeEnabled: t.autoFinalizeEnabled,
      autoFinalizeDelayMinutes: t.autoFinalizeDelayMinutes,
      newDayTime: t.newDayTime,
      newWeekDay: t.newWeekDay,
      newWeekTime: t.newWeekTime
    });
    const s = this._settingsDraft;
    return l`
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
            .checked=${s.autoFinalizeEnabled}
            @change=${(o) => {
      s.autoFinalizeEnabled = o.target.checked, this.requestUpdate();
    }}
          />
          Enable auto-finalize
        </label>

        <label>
          Delay (minutes)
          <input
            type="number"
            min="1"
            ?disabled=${!s.autoFinalizeEnabled}
            .value=${String(s.autoFinalizeDelayMinutes)}
            @input=${(o) => {
      s.autoFinalizeDelayMinutes = Number(o.target.value) || 1, this.requestUpdate();
    }}
          />
        </label>
      </div>

      <div class="settings-section">
        <h3>Chore reset schedule</h3>
        <p class="hint">
          Completed daily chores automatically reset to Pending at the time
          below, starting a new day. Weekly chores work the same way, but
          only reset on the chosen day of the week.
        </p>

        <label>
          New day start time
          <input
            type="time"
            step="1"
            .value=${s.newDayTime}
            @input=${(o) => {
      s.newDayTime = o.target.value, this.requestUpdate();
    }}
          />
        </label>

        <label>
          New week day
          <select
            .value=${s.newWeekDay}
            @change=${(o) => {
      s.newWeekDay = o.target.value, this.requestUpdate();
    }}
          >
            ${Qe.map(
      (o) => l`<option value=${o} ?selected=${o === s.newWeekDay}>
                ${o[0].toUpperCase()}${o.slice(1)}
              </option>`
    )}
          </select>
        </label>

        <label>
          New week start time
          <input
            type="time"
            step="1"
            .value=${s.newWeekTime}
            @input=${(o) => {
      s.newWeekTime = o.target.value, this.requestUpdate();
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

      <div class="danger-zone">
        <h3>Danger zone</h3>
        <div class="danger-zone-row">
          <div class="danger-zone-text">
            <div class="danger-zone-title">Reset points</div>
            <p class="hint">
              Clears daily point stats (earned/missed) for one or every
              assignee. Optionally wipes their lifetime point total too.
              This cannot be undone.
            </p>
          </div>
          <button class="danger" @click=${() => this._openResetPointsDialog(e)}>
            Reset points&hellip;
          </button>
        </div>
        <div class="danger-zone-row">
          <div class="danger-zone-text">
            <div class="danger-zone-title">Clear chore history</div>
            <p class="hint">
              Permanently deletes every entry in the History tab's chore
              audit log. Point totals are not affected. This cannot be
              undone.
            </p>
          </div>
          <button class="danger" @click=${() => this._clearHistory()}>
            Clear history&hellip;
          </button>
        </div>
      </div>
    `;
  }
  async _saveSettings() {
    const t = this._settingsDraft;
    if (!t) return;
    await this._call(p, "update_settings", {
      auto_finalize_enabled: t.autoFinalizeEnabled,
      auto_finalize_delay_minutes: t.autoFinalizeDelayMinutes,
      new_day_time: t.newDayTime,
      new_week_day: t.newWeekDay,
      new_week_time: t.newWeekTime
    }) && (this._settingsDraft = null);
  }
  _renderResetPointsDialog(t) {
    const e = this._resetPointsDialog;
    return e ? l`
      <div class="overlay" @click=${this._onResetPointsOverlayClick}>
        <div class="dialog" role="dialog" aria-modal="true">
          <div class="dialog-header">
            <h2>Reset points</h2>
            <button
              class="icon-button"
              @click=${() => this._resetPointsDialog = null}
            >
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="dialog-body">
            <p class="hint danger-text">
              This clears daily point stats and cannot be undone.
            </p>
            <label>
              Assignee
              <select
                .value=${e.user}
                @change=${(s) => {
      e.user = s.target.value, this.requestUpdate();
    }}
              >
                <option value="">All users</option>
                ${t.map(
      (s) => l`<option value=${s}>${this._displayName(s)}</option>`
    )}
              </select>
            </label>
            <label class="checkbox-item">
              <input
                type="checkbox"
                .checked=${e.resetTotal}
                @change=${(s) => {
      e.resetTotal = s.target.checked, this.requestUpdate();
    }}
              />
              Also reset lifetime total points
            </label>
          </div>
          <div class="dialog-footer">
            <button @click=${() => this._resetPointsDialog = null}>Cancel</button>
            <button
              class="danger"
              ?disabled=${this._busy}
              @click=${() => this._confirmResetPoints()}
            >
              Reset points
            </button>
          </div>
        </div>
      </div>
    ` : d;
  }
  async _confirmResetPoints() {
    const t = this._resetPointsDialog;
    if (!t) return;
    await this._call(p, "reset_points", {
      ...t.user ? { user: t.user } : {},
      reset_total: t.resetTotal
    }) && (this._resetPointsDialog = null);
  }
  // --- Users tab -----------------------------------------------------
  _renderUsersTab(t, e, s) {
    const o = new Map(e.map((r) => [r.assignee, r])), i = new Map(s.map((r) => [r.assignee, r]));
    return l`
      ${t.length === 0 ? l`<p class="empty">
            No assignees yet. Add one to a chore or privilege to get started.
          </p>` : l`<div class="card-grid">
            ${t.map(
      (r) => this._renderUserCard(r, o.get(r), i.get(r))
    )}
          </div>`}
    `;
  }
  _renderUserCard(t, e, s) {
    const o = e?.totalPoints ?? 0, i = e?.pointsEarned ?? 0, r = e?.pointsMissed ?? 0, a = e?.pointsPossible ?? 0;
    return l`
      <div class="card">
        <div class="user-card-header">
          <div class="user-identity">
            <ha-icon icon="mdi:account-outline"></ha-icon>
            <span class="name">${this._displayName(t)}</span>
          </div>
          <div class="user-points-total" title="Lifetime total points">
            <span class="user-points-value">${o}</span>
            <span class="user-points-label">points</span>
          </div>
        </div>
        <div class="points-stats">
          <div class="points-stat">
            <span class="points-stat-value">${i}</span>
            <span class="points-stat-label">earned today</span>
          </div>
          <div class="points-stat">
            <span class="points-stat-value">${r}</span>
            <span class="points-stat-label">missed</span>
          </div>
          <div class="points-stat">
            <span class="points-stat-value">${a}</span>
            <span class="points-stat-label">possible today</span>
          </div>
        </div>
        ${s ? l`
              <div class="user-goal-row">
                <span class="user-goal-label">Point goal</span>
                <input
                  type="number"
                  min="0"
                  class="user-goal-input"
                  .value=${String(s.value)}
                  @change=${(n) => this._setPointGoal(
      s.entityId,
      n.target.value
    )}
                />
              </div>
            ` : d}
        <div class="user-adjust-row">
          <input
            type="number"
            class="user-adjust-input"
            placeholder="±points"
            .value=${this._userAdjustInput[t] ?? ""}
            @input=${(n) => {
      this._userAdjustInput = {
        ...this._userAdjustInput,
        [t]: n.target.value
      };
    }}
          />
          <button @click=${() => this._applyPointsAdjustment(t)}>
            Apply adjustment
          </button>
        </div>
      </div>
    `;
  }
  /** Save an edited point goal via the standard `number.set_value` service. */
  async _setPointGoal(t, e) {
    const s = Math.max(0, Math.round(Number(e) || 0));
    await this._call("number", "set_value", { entity_id: t, value: s });
  }
  async _applyPointsAdjustment(t) {
    const e = this._userAdjustInput[t], s = Number(e);
    if (!e || Number.isNaN(s) || s === 0) {
      this._error = "Enter a non-zero point adjustment first.";
      return;
    }
    await this._call(p, "adjust_points", {
      user: t,
      adjustment: s
    }) && (this._userAdjustInput = { ...this._userAdjustInput, [t]: "" });
  }
  /**
   * Fetch the chore audit log via the get_history service's response data.
   * There's no entity backing this (unlike chores/privileges/categories) -
   * a growing list of history entries doesn't fit in entity attributes - so
   * this calls the service directly over the websocket connection and asks
   * for its response, the same way `_loadUserDisplayNames` uses `callWS`
   * for a websocket command with no `hass.callService` equivalent.
   */
  async _loadHistory() {
    this._historyLoading = !0;
    try {
      const t = await this.hass.callWS({
        type: "call_service",
        domain: p,
        service: "get_history",
        service_data: {},
        return_response: !0
      });
      this._historyEntries = bt(t?.response?.entries);
    } catch (t) {
      this._error = t instanceof Error ? t.message : String(t);
    } finally {
      this._historyLoading = !1;
    }
  }
  async _clearHistory() {
    if (!confirm("Permanently delete every chore history entry? This cannot be undone."))
      return;
    await this._call(p, "reset_history", {}) && (this._historyEntries = []);
  }
  _renderHistoryTab(t, e, s) {
    const o = this._historyEntries ?? [], r = [...o.filter((n) => {
      if (this._historyUserFilter && n.assignee !== this._historyUserFilter)
        return !1;
      if (this._historyCategoryFilter) {
        if (this._historyCategoryFilter === N) {
          if (n.category) return !1;
        } else if (n.category !== this._historyCategoryFilter)
          return !1;
      }
      return !(this._historyChoreFilter && n.choreSlug !== this._historyChoreFilter || this._historyActionFilter.length > 0 && !this._historyActionFilter.includes(n.action));
    })].sort((n, c) => c.timestamp.localeCompare(n.timestamp)), a = [...t].sort((n, c) => n.name.localeCompare(c.name));
    return l`
      <div class="actions-row">
        <select
          class="user-picker"
          title="Filter history by assignee"
          .value=${this._historyUserFilter}
          @change=${(n) => this._historyUserFilter = n.target.value}
        >
          <option value="">All assignees</option>
          ${s.map(
      (n) => l`<option value=${n}>${this._displayName(n)}</option>`
    )}
        </select>
        <select
          class="user-picker"
          title="Filter history by category"
          .value=${this._historyCategoryFilter}
          @change=${(n) => this._historyCategoryFilter = n.target.value}
        >
          <option value="">All categories</option>
          <option value=${N}>Uncategorized</option>
          ${e.map((n) => l`<option value=${n.slug}>${n.name}</option>`)}
        </select>
        <select
          class="user-picker"
          title="Filter history by chore"
          .value=${this._historyChoreFilter}
          @change=${(n) => this._historyChoreFilter = n.target.value}
        >
          <option value="">All chores</option>
          ${a.map((n) => l`<option value=${n.slug}>${n.name}</option>`)}
        </select>
        <div
          class="chip-toggle-group"
          role="group"
          aria-label="Filter history by event type"
        >
          ${mt.map((n) => {
      const c = this._historyActionFilter.includes(n);
      return l`
              <button
                type="button"
                class="chip-toggle ${ue(n)} ${c ? "selected" : ""}"
                aria-pressed=${c}
                @click=${() => this._toggleHistoryActionFilter(n)}
              >
                ${he(n)}
              </button>
            `;
    })}
        </div>
        <div class="spacer"></div>
        <button ?disabled=${this._historyLoading} @click=${() => this._loadHistory()}>
          ${this._historyLoading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      ${this._historyEntries === null ? l`<p class="empty">Loading history&hellip;</p>` : r.length === 0 ? l`<p class="empty">
              ${o.length === 0 ? "No chore history yet. Complete a chore to get started." : "No history entries match the current filters."}
            </p>` : l`
              <div class="history-list">
                <div class="history-row history-header">
                  <div class="history-cell history-time">Time</div>
                  <div class="history-cell history-chore">Chore</div>
                  <div class="history-cell history-assignee">Assignee</div>
                  <div class="history-cell history-action">Action</div>
                  <div class="history-cell history-earned">Earned</div>
                  <div class="history-cell history-missed">Missed</div>
                </div>
                ${r.map((n) => this._renderHistoryRow(n, e))}
              </div>
            `}
    `;
  }
  _renderHistoryRow(t, e) {
    const s = t.category ? e.find((r) => r.slug === t.category)?.name ?? t.category : null, o = t.pointsDelta > 0 ? "points-positive" : t.pointsDelta < 0 ? "points-negative" : "", i = t.pointsDelta > 0 ? `+${t.pointsDelta}` : t.pointsDelta;
    return l`
      <div class="history-row">
        <div class="history-cell history-time">
          ${this._formatHistoryTimestamp(t.timestamp)}
        </div>
        <div class="history-cell history-chore">
          <div class="name">${t.choreName}</div>
          ${s ? l`<div class="meta">${s}</div>` : d}
        </div>
        <div class="history-cell history-assignee">
          ${this._displayName(t.assignee)}
        </div>
        <div class="history-cell history-action">
          <span class="state-chip ${ue(t.action)}">
            ${he(t.action)}
          </span>
        </div>
        <div class="history-cell history-earned" title="Points balance after this entry">
          ${t.pointsTotal}
          ${t.pointsDelta !== 0 ? l`<div class="meta ${o}">${i}</div>` : d}
        </div>
        <div
          class="history-cell history-missed"
          title="Cumulative missed points after this entry"
        >
          ${t.missedTotal ?? "—"}
          ${t.pointsMissed > 0 ? l`<div class="meta points-negative">+${t.pointsMissed}</div>` : d}
        </div>
      </div>
    `;
  }
  _toggleHistoryActionFilter(t) {
    this._historyActionFilter = this._historyActionFilter.includes(t) ? this._historyActionFilter.filter((e) => e !== t) : [...this._historyActionFilter, t];
  }
  _formatHistoryTimestamp(t) {
    const e = new Date(t);
    return Number.isNaN(e.getTime()) ? t : e.toLocaleString();
  }
  // --- Dialog ------------------------------------------------------------
  _renderDialog(t, e, s) {
    if (!this._dialog) return d;
    const o = this._dialog.kind, i = this._dialog.original ? "Edit" : "New", r = o === "chore" ? "chore" : o === "privilege" ? "privilege" : "category";
    return l`
      <div class="overlay" @click=${this._onOverlayClick}>
        <div class="dialog" role="dialog" aria-modal="true">
          <div class="dialog-header">
            <h2>${i} ${r}</h2>
            <button class="icon-button" @click=${this._closeDialog}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="dialog-body">
            ${o === "chore" ? this._renderChoreForm(e, s) : o === "privilege" ? this._renderPrivilegeForm(t, s) : this._renderCategoryForm()}
          </div>
          <div class="dialog-footer">
            <button @click=${this._closeDialog}>Cancel</button>
            <button
              class="primary"
              ?disabled=${this._busy}
              @click=${() => o === "chore" ? this._saveChoreDialog() : o === "privilege" ? this._savePrivilegeDialog() : this._saveCategoryDialog()}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    `;
  }
  _renderChoreForm(t, e) {
    const s = this._dialog.draft, o = !!this._dialog.original, i = x(s.slug || s.name), r = o && i && i !== this._dialog.original;
    return l`
      <label>
        Name
        <input
          type="text"
          .value=${s.name}
          @input=${(a) => {
      s.name = a.target.value, this.requestUpdate();
    }}
        />
      </label>

      <label>
        Slug
        <input
          type="text"
          .value=${s.slug}
          placeholder=${i || "auto-generated from name"}
          @input=${(a) => {
      s.slug = a.target.value, this.requestUpdate();
    }}
        />
        ${r ? l`<span class="hint">Will be renamed to "${i}"</span>` : o ? d : l`<span class="hint">Will be saved as "${i}"</span>`}
      </label>

      <label>
        Description
        <input
          type="text"
          .value=${s.description}
          @input=${(a) => {
      s.description = a.target.value, this.requestUpdate();
    }}
        />
      </label>

      <div class="form-row">
        <label>
          Frequency
          <select
            .value=${s.frequency}
            @change=${(a) => {
      s.frequency = a.target.value, this.requestUpdate();
    }}
          >
            ${Ze.map(
      (a) => l`<option value=${a}>${a}</option>`
    )}
          </select>
        </label>

        <label>
          Points
          <input
            type="number"
            min="0"
            .value=${String(s.points)}
            @input=${(a) => {
      s.points = Number(a.target.value) || 0, this.requestUpdate();
    }}
          />
        </label>
      </div>

      <label>
        Category
        <select
          .value=${s.category}
          @change=${(a) => {
      s.category = a.target.value, this.requestUpdate();
    }}
        >
          <option value=${ee}>Uncategorized</option>
          ${t.map(
      (a) => l`<option value=${a.slug}>${a.name}</option>`
    )}
        </select>
      </label>

      ${this._renderIconField(s.icon, E, (a) => {
      s.icon = a, this.requestUpdate();
    })}

      ${this._renderAssigneeEditor(s, e)}
      ${this._renderPointsByAssigneeEditor(s)}
    `;
  }
  /**
   * Per-assignee point override inputs, one row per currently-listed
   * assignee. An input left matching the shared "Points" field above
   * follows it automatically; typing a different value overrides it just
   * for that assignee (see ChoreDraft.pointsByAssignee).
   */
  _renderPointsByAssigneeEditor(t) {
    return t.assignees.length === 0 ? d : l`
      <label>
        Points per assignee
        <span class="hint"
          >Leave matching the default above to use it; change a value to
          reward that assignee differently for this chore.</span
        >
        <div class="points-override-list">
          ${t.assignees.map((e) => {
      const s = t.pointsByAssignee[e] ?? t.points;
      return l`
              <div class="points-override-row">
                <span class="points-override-name">${this._displayName(e)}</span>
                <input
                  type="number"
                  min="0"
                  class="points-override-input"
                  .value=${String(s)}
                  @input=${(o) => {
        const i = Number(o.target.value) || 0, r = { ...t.pointsByAssignee };
        i === t.points ? delete r[e] : r[e] = i, t.pointsByAssignee = r, this.requestUpdate();
      }}
                />
              </div>
            `;
    })}
        </div>
      </label>
    `;
  }
  _renderPrivilegeForm(t, e) {
    const s = this._dialog.draft, o = !!this._dialog.original, i = x(s.slug || s.name), r = o && i && i !== this._dialog.original;
    return l`
      <label>
        Name
        <input
          type="text"
          .value=${s.name}
          @input=${(a) => {
      s.name = a.target.value, this.requestUpdate();
    }}
        />
      </label>

      <label>
        Slug
        <input
          type="text"
          .value=${s.slug}
          placeholder=${i || "auto-generated from name"}
          @input=${(a) => {
      s.slug = a.target.value, this.requestUpdate();
    }}
        />
        ${r ? l`<span class="hint">Will be renamed to "${i}"</span>` : o ? d : l`<span class="hint">Will be saved as "${i}"</span>`}
      </label>

      <label>
        Behavior
        <select
          .value=${s.behavior}
          @change=${(a) => {
      s.behavior = a.target.value, this.requestUpdate();
    }}
        >
          ${Je.map(
      (a) => l`<option value=${a}>${a}</option>`
    )}
        </select>
        <span class="hint"
          >Automatic privileges turn on when their linked chores are
          complete. Manual ones are only toggled by an admin.</span
        >
      </label>

      ${this._renderIconField(s.icon, S, (a) => {
      s.icon = a, this.requestUpdate();
    })}

      <label>
        Linked chores
        <span class="hint"
          >Leave all unchecked to require every requested chore to be
          complete instead of a specific list.</span
        >
        <div class="checkbox-list">
          ${t.length === 0 ? l`<span class="hint">No chores defined yet.</span>` : t.map(
      (a) => l`
                  <label class="checkbox-item">
                    <input
                      type="checkbox"
                      .checked=${s.linkedChores.includes(a.slug)}
                      @change=${(n) => {
        const c = n.target.checked;
        s.linkedChores = c ? [...s.linkedChores, a.slug] : s.linkedChores.filter((m) => m !== a.slug), this.requestUpdate();
      }}
                    />
                    ${a.name}
                  </label>
                `
    )}
        </div>
      </label>

      ${this._renderAssigneeEditor(s, e)}
    `;
  }
  _renderCategoryForm() {
    const t = this._dialog.draft, e = !!this._dialog.original, s = x(t.slug || t.name), o = e && s && s !== this._dialog.original;
    return l`
      <label>
        Name
        <input
          type="text"
          .value=${t.name}
          @input=${(i) => {
      t.name = i.target.value, this.requestUpdate();
    }}
        />
      </label>

      <label>
        Slug
        <input
          type="text"
          .value=${t.slug}
          placeholder=${s || "auto-generated from name"}
          @input=${(i) => {
      t.slug = i.target.value, this.requestUpdate();
    }}
        />
        ${o ? l`<span class="hint">Will be renamed to "${s}"</span>` : e ? d : l`<span class="hint">Will be saved as "${s}"</span>`}
      </label>

      ${this._renderIconField(t.icon, D, (i) => {
      t.icon = i, this.requestUpdate();
    })}
    `;
  }
  _renderIconField(t, e, s) {
    return l`
      <label>
        Icon
        <div class="icon-field">
          <ha-icon .icon=${t || e}></ha-icon>
          <input
            type="text"
            .value=${t}
            placeholder=${e}
            @input=${(o) => s(o.target.value)}
          />
        </div>
      </label>
    `;
  }
  _renderAssigneeEditor(t, e) {
    return l`
      <label>
        Assignees
        <div class="chip-list">
          ${t.assignees.map(
      (s) => l`
              <span class="chip">
                ${this._displayName(s)}
                <button
                  class="chip-remove"
                  @click=${() => {
        t.assignees = t.assignees.filter((o) => o !== s), this.requestUpdate();
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
            @keydown=${(s) => this._onAssigneeKeydown(s, t)}
            @blur=${(s) => this._commitAssigneeInput(s.target, t)}
          />
        </div>
      </label>
      <datalist id="simple-chores-known-assignees">
        ${e.map(
      (s) => l`<option value=${s} label=${this._displayName(s)}></option>`
    )}
      </datalist>
    `;
  }
  _onAssigneeKeydown(t, e) {
    t.key !== "Enter" && t.key !== "," || (t.preventDefault(), this._commitAssigneeInput(t.target, e));
  }
  _commitAssigneeInput(t, e) {
    const s = t.value.trim().replace(/,$/, "");
    s && !e.assignees.includes(s) && (e.assignees = [...e.assignees, s]), t.value = "", this.requestUpdate();
  }
  _openEditChore(t) {
    this._error = null, this._dialog = {
      kind: "chore",
      original: t.slug,
      draft: tt(t)
    };
  }
  _openEditPrivilege(t) {
    this._error = null, this._dialog = {
      kind: "privilege",
      original: t.slug,
      draft: rt(t)
    };
  }
  _openEditCategory(t) {
    this._error = null, this._dialog = {
      kind: "category",
      original: t.slug,
      draft: it(t)
    };
  }
  /**
   * Build the `new_slug` field for an update_* service call, if the slug
   * field was actually edited to something new - `{}` otherwise, so
   * spreading this into the call data is a no-op when nothing changed.
   */
  _renameField(t, e) {
    const s = x(e);
    return s && s !== t ? { new_slug: s } : {};
  }
  async _call(t, e, s) {
    this._busy = !0;
    try {
      return await this.hass.callService(t, e, s), !0;
    } catch (o) {
      return this._error = o instanceof Error ? o.message : String(o), !1;
    } finally {
      this._busy = !1;
    }
  }
  _markChore(t, e, s) {
    return this._call(p, s, { chore_slug: t, user: e });
  }
  /**
   * Immediately finalize one completed chore for one assignee - the same
   * reset auto-finalize performs after its delay, triggered on demand.
   */
  _finalizeOne(t, e) {
    return this._call(p, "finalize_one", { chore_slug: t, user: e });
  }
  _resetCompleted() {
    const t = this._bulkUser ? { user: this._bulkUser } : {};
    return this._call(p, "reset_completed", t);
  }
  _startNewDay() {
    const t = this._bulkUser ? { user: this._bulkUser } : {};
    return this._call(p, "start_new_day", t);
  }
  _categoryAction(t, e) {
    const s = {
      category_slug: t,
      ...this._bulkUser ? { user: this._bulkUser } : {}
    };
    return this._call(p, e, s);
  }
  async _deleteChore(t) {
    const e = t.assignees.map((s) => this._displayName(s.assignee)).join(", ");
    confirm(
      `Delete "${t.name}"? This removes it for every assignee (${e}).`
    ) && await this._call(p, "delete_chore", { slug: t.slug });
  }
  async _deletePrivilege(t) {
    const e = t.assignees.map((s) => this._displayName(s.assignee)).join(", ");
    confirm(
      `Delete "${t.name}"? This removes it for every assignee (${e}).`
    ) && await this._call(p, "delete_privilege", { slug: t.slug });
  }
  async _deleteCategory(t) {
    confirm(
      `Delete "${t.name}"? Chores must be uncategorized or reassigned first.`
    ) && await this._call(p, "delete_category", { slug: t.slug });
  }
  /** Key into `_disableReasonInput` for a given privilege/assignee row. */
  _disableReasonKey(t, e) {
    return `${t}:${e}`;
  }
  /**
   * The row's edited-but-not-yet-confirmed-saved reason text, or `undefined`
   * if the user hasn't touched the field this render (in which case callers
   * should leave whatever reason is already stored alone).
   */
  _pendingReason(t) {
    if (Object.hasOwn(this._disableReasonInput, t))
      return this._disableReasonInput[t].trim();
  }
  async _addTemporaryDisable(t, e, s, o, i) {
    const r = this._pendingReason(i);
    if (await this._call(
      p,
      s ? "adjust_temporary_disable" : "temporarily_disable_privilege",
      {
        user: e,
        privilege_slug: t,
        ...s ? { adjustment: o } : { duration: o },
        ...r !== void 0 ? { reason: r } : {}
      }
    ) && r !== void 0) {
      const { [i]: n, ...c } = this._disableReasonInput;
      this._disableReasonInput = c;
    }
  }
  /**
   * Nudge an in-progress block's end time by `adjustmentMinutes` (negative to
   * shorten it, positive to extend it), via the existing
   * `adjust_temporary_disable` service. Only meaningful while the privilege
   * is already temporarily disabled - callers should disable the triggering
   * button otherwise, since the service just warns and no-ops. Carries along
   * any edited-but-unsaved reason, same as extending via `_addTemporaryDisable`.
   */
  async _adjustTemporaryDisable(t, e, s) {
    const o = this._disableReasonKey(t, e), i = this._pendingReason(o);
    if (await this._call(p, "adjust_temporary_disable", {
      user: e,
      privilege_slug: t,
      adjustment: s,
      ...i !== void 0 ? { reason: i } : {}
    }) && i !== void 0) {
      const { [o]: a, ...n } = this._disableReasonInput;
      this._disableReasonInput = n;
    }
  }
  /**
   * Save an edited reason on an already-blocked privilege without changing
   * its duration, via a zero-minute `adjust_temporary_disable` adjustment.
   * Fired on blur/Enter so editing the reason text doesn't require also
   * touching a stepper. No-ops if the field wasn't actually changed.
   */
  async _saveDisableReason(t, e, s) {
    const o = this._disableReasonKey(t, e), i = this._pendingReason(o);
    if (i === void 0 || i === (s ?? "")) return;
    if (await this._call(p, "adjust_temporary_disable", {
      user: e,
      privilege_slug: t,
      adjustment: 0,
      reason: i
    })) {
      const { [o]: a, ...n } = this._disableReasonInput;
      this._disableReasonInput = n;
    }
  }
  /**
   * End a temporary block immediately, via `clear_temporary_disable`. The
   * privilege is restored to what it was right before the block (or
   * recomputed from linked chores, for automatic-behavior privileges).
   */
  async _clearTemporaryDisable(t, e) {
    if (await this._call(p, "clear_temporary_disable", {
      user: e,
      privilege_slug: t
    })) {
      const o = this._disableReasonKey(t, e), { [o]: i, ...r } = this._disableReasonInput;
      this._disableReasonInput = r;
    }
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
    const s = e.assignees.join(","), o = Object.entries(e.pointsByAssignee).filter(([r]) => e.assignees.includes(r)).map(([r, a]) => `${r}:${a}`).join(",");
    (t.original ? await this._call(p, "update_chore", {
      slug: t.original,
      name: e.name,
      description: e.description,
      frequency: e.frequency,
      assignees: s,
      icon: e.icon || E,
      points: e.points,
      points_by_assignee: o,
      category: e.category,
      ...this._renameField(t.original, e.slug || e.name)
    }) : await this._call(p, "create_chore", {
      name: e.name,
      slug: x(e.slug || e.name),
      description: e.description,
      frequency: e.frequency,
      assignees: s,
      icon: e.icon || E,
      points: e.points,
      points_by_assignee: o,
      category: e.category
    })) && (this._dialog = null);
  }
  async _saveCategoryDialog() {
    const t = this._dialog, e = t.draft;
    if (!e.name.trim()) {
      this._error = "Name is required.";
      return;
    }
    (t.original ? await this._call(p, "update_category", {
      slug: t.original,
      name: e.name,
      icon: e.icon || D,
      ...this._renameField(t.original, e.slug || e.name)
    }) : await this._call(p, "create_category", {
      name: e.name,
      slug: x(e.slug || e.name),
      icon: e.icon || D
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
    const s = e.assignees.join(","), o = e.linkedChores.join(",");
    (t.original ? await this._call(p, "update_privilege", {
      slug: t.original,
      name: e.name,
      icon: e.icon || S,
      behavior: e.behavior,
      linked_chores: o,
      assignees: s,
      ...this._renameField(t.original, e.slug || e.name)
    }) : await this._call(p, "create_privilege", {
      name: e.name,
      slug: x(e.slug || e.name),
      icon: e.icon || S,
      behavior: e.behavior,
      linked_chores: o,
      assignees: s
    })) && (this._dialog = null);
  }
};
u.styles = ke`
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
    button.danger:not(.icon-button),
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
    /* :not(.icon-button) keeps this out of the circular icon-button.danger
       delete buttons below, which have their own (transparent-background)
       danger styling. */
    button.danger:not(.icon-button),
    .dialog-footer button.danger {
      background: var(--error-color, #db4437);
      border-color: var(--error-color, #db4437);
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
    .disable-reason-input {
      flex: 1;
      min-width: 140px;
      height: 32px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 0 10px;
      font-size: 13px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
    }
    .disable-reason {
      font-size: 12px;
      font-style: italic;
      color: var(--secondary-text-color, #727272);
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

    .chip-toggle-group {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .actions-row button.chip-toggle {
      border: 1px solid transparent;
      cursor: pointer;
      font: inherit;
      font-size: 12px;
      border-radius: 999px;
      padding: 2px 8px;
      opacity: 0.45;
    }
    .actions-row button.chip-toggle.selected {
      border-color: currentColor;
      opacity: 1;
    }
    .actions-row button.chip-toggle.state-good {
      background: rgba(76, 175, 80, 0.15);
      color: #2e7d32;
    }
    .actions-row button.chip-toggle.state-warn {
      background: rgba(255, 152, 0, 0.15);
      color: #ef6c00;
    }
    .actions-row button.chip-toggle.state-bad {
      background: rgba(219, 68, 55, 0.12);
      color: var(--error-color, #db4437);
    }
    .actions-row button.chip-toggle.state-neutral {
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

    .danger-zone {
      max-width: 420px;
      margin-top: 20px;
      border: 1px solid var(--error-color, #db4437);
      border-radius: 12px;
      padding: 16px;
      background: rgba(219, 68, 55, 0.05);
    }
    .danger-zone h3 {
      margin: 0 0 12px;
      font-size: 16px;
      font-weight: 500;
      color: var(--error-color, #db4437);
    }
    .danger-zone-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .danger-zone-text {
      flex: 1;
      min-width: 180px;
    }
    .danger-zone-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
      margin-bottom: 2px;
    }
    .danger-zone .hint {
      margin: 0;
    }
    .danger-text {
      color: var(--error-color, #db4437);
    }

    .points-summary {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 13px;
      color: var(--secondary-text-color, #727272);
      margin-bottom: 12px;
    }
    .points-summary ha-icon {
      --mdc-icon-size: 16px;
      color: var(--primary-color, #03a9f4);
    }
    .points-summary strong {
      color: var(--primary-text-color, #212121);
      font-weight: 500;
    }
    .points-summary-sep {
      opacity: 0.5;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      background: var(--card-background-color, #fff);
      border-radius: 12px;
      box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
      overflow-x: auto;
    }
    .history-row {
      display: grid;
      grid-template-columns: 1.3fr 1.6fr 1fr 1fr 0.9fr 0.8fr;
      gap: 8px;
      align-items: center;
      padding: 10px 14px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      font-size: 13px;
      min-width: 640px;
    }
    .history-row:last-child {
      border-bottom: none;
    }
    .history-header {
      font-size: 12px;
      font-weight: 500;
      color: var(--secondary-text-color, #727272);
      background: rgba(0, 0, 0, 0.03);
    }
    .history-cell.history-chore .name {
      font-weight: 500;
      color: var(--primary-text-color, #212121);
    }
    .history-cell .meta {
      font-size: 11px;
      color: var(--secondary-text-color, #727272);
    }
    .history-earned,
    .history-missed {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    /* .meta prefix matches ".history-cell .meta"'s specificity so these
       actually win (a delta is always rendered as class="meta
       points-positive" or "meta points-negative" - see _renderHistoryRow). */
    .meta.points-positive {
      color: #2e7d32;
    }
    .meta.points-negative {
      color: var(--error-color, #db4437);
    }

    .user-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
    .user-identity {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .user-identity .name {
      font-size: 16px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .user-points-total {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      flex-shrink: 0;
    }
    .user-points-value {
      font-size: 28px;
      font-weight: 600;
      line-height: 1.1;
      color: var(--primary-color, #03a9f4);
    }
    .user-points-label {
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--secondary-text-color, #727272);
    }

    .points-stats {
      display: flex;
      gap: 16px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--divider-color, #e0e0e0);
    }
    .points-stat {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .points-stat-value {
      font-size: 18px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
    }
    .points-stat-label {
      font-size: 11px;
      color: var(--secondary-text-color, #727272);
      text-align: center;
    }

    .user-goal-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--divider-color, #e0e0e0);
    }
    .user-goal-label {
      font-size: 13px;
      color: var(--secondary-text-color, #727272);
    }
    .user-goal-input {
      width: 90px;
      font: inherit;
      font-size: 14px;
      color: var(--primary-text-color, #212121);
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 8px 10px;
    }
    .user-adjust-row {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--divider-color, #e0e0e0);
    }
    .user-adjust-input {
      width: 90px;
      font: inherit;
      font-size: 14px;
      color: var(--primary-text-color, #212121);
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 8px 10px;
    }

    .points-override-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 8px;
      max-height: 160px;
      overflow-y: auto;
    }
    .points-override-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .points-override-name {
      font-size: 14px;
      color: var(--primary-text-color, #212121);
    }
    .points-override-input {
      width: 70px;
      font: inherit;
      font-size: 14px;
      color: var(--primary-text-color, #212121);
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 6px 8px;
    }
    .points-override-badge {
      font-size: 11px;
      font-weight: 500;
      color: var(--primary-color, #03a9f4);
      background: rgba(3, 169, 244, 0.12);
      border-radius: 999px;
      padding: 2px 7px;
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
g([
  Q({ attribute: !1 })
], u.prototype, "hass", 2);
g([
  Q({ type: Boolean })
], u.prototype, "narrow", 2);
g([
  b()
], u.prototype, "_tab", 2);
g([
  b()
], u.prototype, "_dialog", 2);
g([
  b()
], u.prototype, "_busy", 2);
g([
  b()
], u.prototype, "_error", 2);
g([
  b()
], u.prototype, "_bulkUser", 2);
g([
  b()
], u.prototype, "_categoryFilter", 2);
g([
  b()
], u.prototype, "_choreSort", 2);
g([
  b()
], u.prototype, "_userDisplayNames", 2);
g([
  b()
], u.prototype, "_settingsDraft", 2);
g([
  b()
], u.prototype, "_resetPointsDialog", 2);
g([
  b()
], u.prototype, "_userAdjustInput", 2);
g([
  b()
], u.prototype, "_disableReasonInput", 2);
g([
  b()
], u.prototype, "_historyEntries", 2);
g([
  b()
], u.prototype, "_historyLoading", 2);
g([
  b()
], u.prototype, "_historyUserFilter", 2);
g([
  b()
], u.prototype, "_historyCategoryFilter", 2);
g([
  b()
], u.prototype, "_historyChoreFilter", 2);
g([
  b()
], u.prototype, "_historyActionFilter", 2);
u = g([
  Ve("simple-chores-panel")
], u);
