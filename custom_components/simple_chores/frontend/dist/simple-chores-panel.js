/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const M = globalThis, V = M.ShadowRoot && (M.ShadyCSS === void 0 || M.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, G = Symbol(), te = /* @__PURE__ */ new WeakMap();
let me = class {
  constructor(e, s, i) {
    if (this._$cssResult$ = !0, i !== G) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = s;
  }
  get styleSheet() {
    let e = this.o;
    const s = this.t;
    if (V && e === void 0) {
      const i = s !== void 0 && s.length === 1;
      i && (e = te.get(s)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && te.set(s, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const ke = (t) => new me(typeof t == "string" ? t : t + "", void 0, G), Ce = (t, ...e) => {
  const s = t.length === 1 ? t[0] : e.reduce((i, o, a) => i + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(o) + t[a + 1], t[0]);
  return new me(s, t, G);
}, Ae = (t, e) => {
  if (V) t.adoptedStyleSheets = e.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  else for (const s of e) {
    const i = document.createElement("style"), o = M.litNonce;
    o !== void 0 && i.setAttribute("nonce", o), i.textContent = s.cssText, t.appendChild(i);
  }
}, se = V ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let s = "";
  for (const i of e.cssRules) s += i.cssText;
  return ke(s);
})(t) : t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Ee, defineProperty: De, getOwnPropertyDescriptor: Se, getOwnPropertyNames: Ue, getOwnPropertySymbols: Pe, getPrototypeOf: Te } = Object, W = globalThis, ie = W.trustedTypes, Re = ie ? ie.emptyScript : "", Ne = W.reactiveElementPolyfillSupport, N = (t, e) => t, H = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? Re : null;
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
} }, Y = (t, e) => !Ee(t, e), oe = { attribute: !0, type: String, converter: H, reflect: !1, useDefault: !1, hasChanged: Y };
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
      const i = Symbol(), o = this.getPropertyDescriptor(e, i, s);
      o !== void 0 && De(this.prototype, e, o);
    }
  }
  static getPropertyDescriptor(e, s, i) {
    const { get: o, set: a } = Se(this.prototype, e) ?? { get() {
      return this[s];
    }, set(n) {
      this[s] = n;
    } };
    return { get: o, set(n) {
      const l = o?.call(this);
      a?.call(this, n), this.requestUpdate(e, l, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? oe;
  }
  static _$Ei() {
    if (this.hasOwnProperty(N("elementProperties"))) return;
    const e = Te(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(N("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(N("properties"))) {
      const s = this.properties, i = [...Ue(s), ...Pe(s)];
      for (const o of i) this.createProperty(o, s[o]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const s = litPropertyMetadata.get(e);
      if (s !== void 0) for (const [i, o] of s) this.elementProperties.set(i, o);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [s, i] of this.elementProperties) {
      const o = this._$Eu(s, i);
      o !== void 0 && this._$Eh.set(o, s);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const s = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const o of i) s.unshift(se(o));
    } else e !== void 0 && s.push(se(e));
    return s;
  }
  static _$Eu(e, s) {
    const i = s.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof e == "string" ? e.toLowerCase() : void 0;
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
    for (const i of s.keys()) this.hasOwnProperty(i) && (e.set(i, this[i]), delete this[i]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Ae(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((e) => e.hostDisconnected?.());
  }
  attributeChangedCallback(e, s, i) {
    this._$AK(e, i);
  }
  _$ET(e, s) {
    const i = this.constructor.elementProperties.get(e), o = this.constructor._$Eu(e, i);
    if (o !== void 0 && i.reflect === !0) {
      const a = (i.converter?.toAttribute !== void 0 ? i.converter : H).toAttribute(s, i.type);
      this._$Em = e, a == null ? this.removeAttribute(o) : this.setAttribute(o, a), this._$Em = null;
    }
  }
  _$AK(e, s) {
    const i = this.constructor, o = i._$Eh.get(e);
    if (o !== void 0 && this._$Em !== o) {
      const a = i.getPropertyOptions(o), n = typeof a.converter == "function" ? { fromAttribute: a.converter } : a.converter?.fromAttribute !== void 0 ? a.converter : H;
      this._$Em = o;
      const l = n.fromAttribute(s, a.type);
      this[o] = l ?? this._$Ej?.get(o) ?? l, this._$Em = null;
    }
  }
  requestUpdate(e, s, i, o = !1, a) {
    if (e !== void 0) {
      const n = this.constructor;
      if (o === !1 && (a = this[e]), i ??= n.getPropertyOptions(e), !((i.hasChanged ?? Y)(a, s) || i.useDefault && i.reflect && a === this._$Ej?.get(e) && !this.hasAttribute(n._$Eu(e, i)))) return;
      this.C(e, s, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, s, { useDefault: i, reflect: o, wrapped: a }, n) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, n ?? s ?? this[e]), a !== !0 || n !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (s = void 0), this._$AL.set(e, s)), o === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
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
        for (const [o, a] of this._$Ep) this[o] = a;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [o, a] of i) {
        const { wrapped: n } = a, l = this[o];
        n !== !0 || this._$AL.has(o) || l === void 0 || this.C(o, void 0, a, l);
      }
    }
    let e = !1;
    const s = this._$AL;
    try {
      e = this.shouldUpdate(s), e ? (this.willUpdate(s), this._$EO?.forEach((i) => i.hostUpdate?.()), this.update(s)) : this._$EM();
    } catch (i) {
      throw e = !1, this._$EM(), i;
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
A.elementStyles = [], A.shadowRootOptions = { mode: "open" }, A[N("elementProperties")] = /* @__PURE__ */ new Map(), A[N("finalized")] = /* @__PURE__ */ new Map(), Ne?.({ ReactiveElement: A }), (W.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const X = globalThis, ae = (t) => t, L = X.trustedTypes, ne = L ? L.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, be = "$lit$", v = `lit$${Math.random().toFixed(9).slice(2)}$`, _e = "?" + v, ze = `<${_e}>`, k = document, F = () => k.createComment(""), I = (t) => t === null || typeof t != "object" && typeof t != "function", Z = Array.isArray, Fe = (t) => Z(t) || typeof t?.[Symbol.iterator] == "function", K = `[ 	
\f\r]`, T = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, re = /-->/g, le = />/g, $ = RegExp(`>|${K}(?:([^\\s"'>=/]+)(${K}*=${K}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ce = /'/g, de = /"/g, ye = /^(?:script|style|textarea|title)$/i, Ie = (t) => (e, ...s) => ({ _$litType$: t, strings: e, values: s }), r = Ie(1), U = Symbol.for("lit-noChange"), d = Symbol.for("lit-nothing"), pe = /* @__PURE__ */ new WeakMap(), w = k.createTreeWalker(k, 129);
function fe(t, e) {
  if (!Z(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ne !== void 0 ? ne.createHTML(e) : e;
}
const je = (t, e) => {
  const s = t.length - 1, i = [];
  let o, a = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", n = T;
  for (let l = 0; l < s; l++) {
    const c = t[l];
    let b, _, u = -1, y = 0;
    for (; y < c.length && (n.lastIndex = y, _ = n.exec(c), _ !== null); ) y = n.lastIndex, n === T ? _[1] === "!--" ? n = re : _[1] !== void 0 ? n = le : _[2] !== void 0 ? (ye.test(_[2]) && (o = RegExp("</" + _[2], "g")), n = $) : _[3] !== void 0 && (n = $) : n === $ ? _[0] === ">" ? (n = o ?? T, u = -1) : _[1] === void 0 ? u = -2 : (u = n.lastIndex - _[2].length, b = _[1], n = _[3] === void 0 ? $ : _[3] === '"' ? de : ce) : n === de || n === ce ? n = $ : n === re || n === le ? n = T : (n = $, o = void 0);
    const f = n === $ && t[l + 1].startsWith("/>") ? " " : "";
    a += n === T ? c + ze : u >= 0 ? (i.push(b), c.slice(0, u) + be + c.slice(u) + v + f) : c + v + (u === -2 ? l : f);
  }
  return [fe(t, a + (t[s] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class j {
  constructor({ strings: e, _$litType$: s }, i) {
    let o;
    this.parts = [];
    let a = 0, n = 0;
    const l = e.length - 1, c = this.parts, [b, _] = je(e, s);
    if (this.el = j.createElement(b, i), w.currentNode = this.el.content, s === 2 || s === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (o = w.nextNode()) !== null && c.length < l; ) {
      if (o.nodeType === 1) {
        if (o.hasAttributes()) for (const u of o.getAttributeNames()) if (u.endsWith(be)) {
          const y = _[n++], f = o.getAttribute(u).split(v), q = /([.?@])?(.*)/.exec(y);
          c.push({ type: 1, index: a, name: q[2], strings: f, ctor: q[1] === "." ? qe : q[1] === "?" ? Me : q[1] === "@" ? He : B }), o.removeAttribute(u);
        } else u.startsWith(v) && (c.push({ type: 6, index: a }), o.removeAttribute(u));
        if (ye.test(o.tagName)) {
          const u = o.textContent.split(v), y = u.length - 1;
          if (y > 0) {
            o.textContent = L ? L.emptyScript : "";
            for (let f = 0; f < y; f++) o.append(u[f], F()), w.nextNode(), c.push({ type: 2, index: ++a });
            o.append(u[y], F());
          }
        }
      } else if (o.nodeType === 8) if (o.data === _e) c.push({ type: 2, index: a });
      else {
        let u = -1;
        for (; (u = o.data.indexOf(v, u + 1)) !== -1; ) c.push({ type: 7, index: a }), u += v.length - 1;
      }
      a++;
    }
  }
  static createElement(e, s) {
    const i = k.createElement("template");
    return i.innerHTML = e, i;
  }
}
function P(t, e, s = t, i) {
  if (e === U) return e;
  let o = i !== void 0 ? s._$Co?.[i] : s._$Cl;
  const a = I(e) ? void 0 : e._$litDirective$;
  return o?.constructor !== a && (o?._$AO?.(!1), a === void 0 ? o = void 0 : (o = new a(t), o._$AT(t, s, i)), i !== void 0 ? (s._$Co ??= [])[i] = o : s._$Cl = o), o !== void 0 && (e = P(t, o._$AS(t, e.values), o, i)), e;
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
    const { el: { content: s }, parts: i } = this._$AD, o = (e?.creationScope ?? k).importNode(s, !0);
    w.currentNode = o;
    let a = w.nextNode(), n = 0, l = 0, c = i[0];
    for (; c !== void 0; ) {
      if (n === c.index) {
        let b;
        c.type === 2 ? b = new O(a, a.nextSibling, this, e) : c.type === 1 ? b = new c.ctor(a, c.name, c.strings, this, e) : c.type === 6 && (b = new Le(a, this, e)), this._$AV.push(b), c = i[++l];
      }
      n !== c?.index && (a = w.nextNode(), n++);
    }
    return w.currentNode = k, o;
  }
  p(e) {
    let s = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, s), s += i.strings.length - 2) : i._$AI(e[s])), s++;
  }
}
class O {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, s, i, o) {
    this.type = 2, this._$AH = d, this._$AN = void 0, this._$AA = e, this._$AB = s, this._$AM = i, this.options = o, this._$Cv = o?.isConnected ?? !0;
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
    e = P(this, e, s), I(e) ? e === d || e == null || e === "" ? (this._$AH !== d && this._$AR(), this._$AH = d) : e !== this._$AH && e !== U && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Fe(e) ? this.k(e) : this._(e);
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
    const { values: s, _$litType$: i } = e, o = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = j.createElement(fe(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === o) this._$AH.p(s);
    else {
      const a = new Oe(o, this), n = a.u(this.options);
      a.p(s), this.T(n), this._$AH = a;
    }
  }
  _$AC(e) {
    let s = pe.get(e.strings);
    return s === void 0 && pe.set(e.strings, s = new j(e)), s;
  }
  k(e) {
    Z(this._$AH) || (this._$AH = [], this._$AR());
    const s = this._$AH;
    let i, o = 0;
    for (const a of e) o === s.length ? s.push(i = new O(this.O(F()), this.O(F()), this, this.options)) : i = s[o], i._$AI(a), o++;
    o < s.length && (this._$AR(i && i._$AB.nextSibling, o), s.length = o);
  }
  _$AR(e = this._$AA.nextSibling, s) {
    for (this._$AP?.(!1, !0, s); e !== this._$AB; ) {
      const i = ae(e).nextSibling;
      ae(e).remove(), e = i;
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
  constructor(e, s, i, o, a) {
    this.type = 1, this._$AH = d, this._$AN = void 0, this.element = e, this.name = s, this._$AM = o, this.options = a, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = d;
  }
  _$AI(e, s = this, i, o) {
    const a = this.strings;
    let n = !1;
    if (a === void 0) e = P(this, e, s, 0), n = !I(e) || e !== this._$AH && e !== U, n && (this._$AH = e);
    else {
      const l = e;
      let c, b;
      for (e = a[0], c = 0; c < a.length - 1; c++) b = P(this, l[i + c], s, c), b === U && (b = this._$AH[c]), n ||= !I(b) || b !== this._$AH[c], b === d ? e = d : e !== d && (e += (b ?? "") + a[c + 1]), this._$AH[c] = b;
    }
    n && !o && this.j(e);
  }
  j(e) {
    e === d ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class qe extends B {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === d ? void 0 : e;
  }
}
class Me extends B {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== d);
  }
}
class He extends B {
  constructor(e, s, i, o, a) {
    super(e, s, i, o, a), this.type = 5;
  }
  _$AI(e, s = this) {
    if ((e = P(this, e, s, 0) ?? d) === U) return;
    const i = this._$AH, o = e === d && i !== d || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, a = e !== d && (i === d || o);
    o && this.element.removeEventListener(this.name, this, i), a && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Le {
  constructor(e, s, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = s, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    P(this, e);
  }
}
const We = X.litHtmlPolyfillSupport;
We?.(j, O), (X.litHtmlVersions ??= []).push("3.3.3");
const Be = (t, e, s) => {
  const i = s?.renderBefore ?? e;
  let o = i._$litPart$;
  if (o === void 0) {
    const a = s?.renderBefore ?? null;
    i._$litPart$ = o = new O(e.insertBefore(F(), a), a, void 0, s ?? {});
  }
  return o._$AI(t), o;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const J = globalThis;
class z extends A {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const s = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Be(s, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return U;
  }
}
z._$litElement$ = !0, z.finalized = !0, J.litElementHydrateSupport?.({ LitElement: z });
const Ke = J.litElementPolyfillSupport;
Ke?.({ LitElement: z });
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
const Ge = { attribute: !0, type: String, converter: H, reflect: !1, hasChanged: Y }, Ye = (t = Ge, e, s) => {
  const { kind: i, metadata: o } = s;
  let a = globalThis.litPropertyMetadata.get(o);
  if (a === void 0 && globalThis.litPropertyMetadata.set(o, a = /* @__PURE__ */ new Map()), i === "setter" && ((t = Object.create(t)).wrapped = !0), a.set(s.name, t), i === "accessor") {
    const { name: n } = s;
    return { set(l) {
      const c = e.get.call(this);
      e.set.call(this, l), this.requestUpdate(n, c, t, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(n, void 0, t, l), l;
    } };
  }
  if (i === "setter") {
    const { name: n } = s;
    return function(l) {
      const c = this[n];
      e.call(this, l), this.requestUpdate(n, c, t, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function Q(t) {
  return (e, s) => typeof s == "object" ? Ye(t, e, s) : ((i, o, a) => {
    const n = o.hasOwnProperty(a);
    return o.constructor.createProperty(a, i), n ? Object.getOwnPropertyDescriptor(o, a) : void 0;
  })(t, e, s);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function m(t) {
  return Q({ ...t, state: !0, attribute: !1 });
}
const Xe = "sensor.simple_chore_", ve = "sensor.simple_chore_privilege_", $e = "sensor.simple_chore_meta_", xe = "sensor.simple_chore_category_", Ze = "number.simple_chore_meta_", we = "sensor.simple_chore_meta_settings", Je = ["daily", "weekly", "manual", "once"], Qe = ["automatic", "manual"], et = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
], E = "mdi:clipboard-list-outline", D = "mdi:star", S = "mdi:tag-outline", ee = "";
function tt() {
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
function st(t) {
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
function it() {
  return {
    slug: "",
    name: "",
    icon: S
  };
}
function ot(t) {
  return {
    slug: t.slug,
    name: t.name,
    icon: t.icon
  };
}
function at() {
  return {
    slug: "",
    name: "",
    icon: D,
    behavior: "automatic",
    linkedChores: [],
    assignees: []
  };
}
function nt(t) {
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
function rt(t) {
  const e = /* @__PURE__ */ new Map();
  for (const [s, i] of Object.entries(t)) {
    if (!s.startsWith(Xe) || s.startsWith(ve) || s.startsWith($e) || s.startsWith(xe)) continue;
    const o = i.attributes, a = o.chore_slug;
    if (!a) continue;
    let n = e.get(a);
    n || (n = {
      slug: a,
      name: o.chore_name ?? a,
      description: o.description ?? "",
      frequency: o.frequency ?? "daily",
      icon: o.icon ?? E,
      // default_points is the chore's shared value; older/unrefreshed
      // sensors may not have it yet, so fall back to this assignee's
      // resolved points rather than leaving the definition unset.
      points: o.default_points ?? o.points ?? 0,
      category: o.category ?? null,
      assignees: []
    }, e.set(a, n)), n.assignees.push({
      assignee: o.assignee,
      entityId: s,
      state: i.state,
      points: o.points ?? n.points
    });
  }
  for (const s of e.values())
    s.assignees.sort((i, o) => i.assignee.localeCompare(o.assignee));
  return [...e.values()].sort((s, i) => s.name.localeCompare(i.name));
}
function he(t) {
  const e = /* @__PURE__ */ new Map();
  for (const [s, i] of Object.entries(t)) {
    if (!s.startsWith(ve)) continue;
    const o = i.attributes, a = o.privilege_slug;
    if (!a) continue;
    let n = e.get(a);
    n || (n = {
      slug: a,
      name: o.privilege_name ?? a,
      icon: o.icon ?? D,
      behavior: o.behavior ?? "automatic",
      linkedChores: o.linked_chores ?? [],
      assignees: []
    }, e.set(a, n)), n.assignees.push({
      assignee: o.assignee,
      entityId: s,
      state: i.state,
      disableUntil: o.disable_until,
      disableReason: o.disable_reason
    });
  }
  for (const s of e.values())
    s.assignees.sort((i, o) => i.assignee.localeCompare(o.assignee));
  return [...e.values()].sort((s, i) => s.name.localeCompare(i.name));
}
function lt(t) {
  const e = [];
  for (const [s, i] of Object.entries(t)) {
    if (!s.startsWith(xe)) continue;
    const o = i.attributes, a = o.category_slug;
    a && e.push({
      slug: a,
      name: o.category_name ?? a,
      icon: o.icon ?? S,
      entityId: s,
      choreCount: Number(i.state) || 0
    });
  }
  return e.sort((s, i) => s.name.localeCompare(i.name));
}
const C = {
  autoFinalizeEnabled: !0,
  autoFinalizeDelayMinutes: 60,
  newDayTime: "02:00:00",
  newWeekDay: "monday",
  newWeekTime: "02:00:00"
};
function ct(t) {
  const e = t[we];
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
  for (const [s, i] of Object.entries(t)) {
    if (!s.startsWith($e) || s === we) continue;
    const o = i.attributes, a = o.assignee;
    a && e.push({
      assignee: a,
      entityId: s,
      totalPoints: o.total_points ?? 0,
      pointsEarned: o.points_earned ?? 0,
      pointsMissed: o.points_missed ?? 0,
      pointsPossible: o.points_possible ?? 0,
      totalPending: o.total_pending ?? 0,
      totalComplete: o.total_complete ?? 0
    });
  }
  return e.sort((s, i) => s.assignee.localeCompare(i.assignee));
}
function pt(t) {
  const e = [];
  for (const [s, i] of Object.entries(t)) {
    if (!s.startsWith(Ze)) continue;
    const o = i.attributes.assignee;
    o && e.push({
      assignee: o,
      entityId: s,
      value: Number(i.state) || 0
    });
  }
  return e.sort((s, i) => s.assignee.localeCompare(i.assignee));
}
function ht(t, e) {
  const s = /* @__PURE__ */ new Set();
  for (const i of t)
    for (const o of i.assignees) s.add(o.assignee);
  for (const i of e)
    for (const o of i.assignees) s.add(o.assignee);
  return [...s].sort((i, o) => i.localeCompare(o));
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
  "points_reset",
  "undone",
  "privilege_enabled",
  "privilege_disabled",
  "privilege_temporarily_disabled"
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
    missedTotal: e.missed_total ?? null,
    reason: e.reason ?? null,
    durationMinutes: e.duration_minutes ?? null,
    penalty: e.penalty ?? null,
    undone: e.undone ?? !1
  })) : [];
}
function ue(t) {
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
    case "undone":
      return "Undone";
    case "privilege_enabled":
      return "Privilege enabled";
    case "privilege_disabled":
      return "Privilege disabled";
    case "privilege_temporarily_disabled":
      return "Temporarily disabled";
    default:
      return t;
  }
}
function ge(t) {
  return t === "completed" || t === "privilege_enabled" ? "state-good" : t === "uncompleted" || t === "undone" || t === "privilege_disabled" ? "state-bad" : t === "missed" || t === "adjusted" || t === "privilege_temporarily_disabled" ? "state-warn" : "state-neutral";
}
var _t = Object.defineProperty, yt = Object.getOwnPropertyDescriptor, g = (t, e, s, i) => {
  for (var o = i > 1 ? void 0 : i ? yt(e, s) : e, a = t.length - 1, n; a >= 0; a--)
    (n = t[a]) && (o = (i ? n(e, s, o) : n(o)) || o);
  return i && o && _t(e, s, o), o;
};
const p = "simple_chores", R = "__uncategorized__";
let h = class extends z {
  constructor() {
    super(...arguments), this.narrow = !1, this._tab = "chores", this._dialog = null, this._busy = !1, this._error = null, this._bulkUser = "", this._categoryFilter = "", this._choreSort = "name", this._userDisplayNames = {}, this._settingsDraft = null, this._resetPointsDialog = null, this._undoDialog = null, this._userAdjustInput = {}, this._userAdjustReasonInput = {}, this._disableReasonInput = {}, this._untilFlash = {}, this._lastDisableUntil = {}, this._historyEntries = null, this._historyLoading = !1, this._historyUserFilter = "", this._historyCategoryFilter = "", this._historyChoreFilter = "", this._historyActionFilter = [], this._loadedUserDisplayNames = !1, this._openResetPointsDialog = (t) => {
      this._error = null, this._resetPointsDialog = {
        user: t.length === 1 ? t[0] : "",
        resetTotal: !1
      };
    }, this._onResetPointsOverlayClick = (t) => {
      t.target === t.currentTarget && (this._resetPointsDialog = null);
    }, this._openHistoryTab = () => {
      this._tab = "history", this._historyEntries === null && this._loadHistory();
    }, this._openUndoDialog = (t) => {
      this._error = null, this._undoDialog = {
        entryId: t.id,
        choreName: t.choreName,
        assignee: t.assignee,
        awarded: t.pointsDelta,
        reason: "",
        penalty: 0
      };
    }, this._onUndoOverlayClick = (t) => {
      t.target === t.currentTarget && (this._undoDialog = null);
    }, this._onOverlayClick = (t) => {
      t.target === t.currentTarget && this._closeDialog();
    }, this._dismissError = () => {
      this._error = null;
    }, this._closeDialog = () => {
      this._dialog = null;
    }, this._openCreateChore = () => {
      this._error = null, this._dialog = { kind: "chore", draft: tt() };
    }, this._openCreatePrivilege = () => {
      this._error = null, this._dialog = { kind: "privilege", draft: at() };
    }, this._openCreateCategory = () => {
      this._error = null, this._dialog = { kind: "category", draft: it() };
    };
  }
  updated(t) {
    t.has("hass") && !this.hass?.user?.is_admin && (this._error = "You must be an administrator to manage chores and privileges."), this.hass && !this._loadedUserDisplayNames && (this._loadedUserDisplayNames = !0, this._loadUserDisplayNames());
  }
  willUpdate(t) {
    t.has("hass") && this.hass && this._detectUntilChanges();
  }
  /**
   * Compare each privilege assignee's `disableUntil` against what we last
   * saw, so a server-side change (extending/shortening a block, or a fresh
   * block appearing) can flash the "until" date instead of silently
   * updating - easy to miss otherwise since it's just text in a chip.
   */
  _detectUntilChanges() {
    const t = he(this.hass.states);
    let e = null;
    for (const s of t)
      for (const i of s.assignees) {
        const o = this._disableReasonKey(s.slug, i.assignee), a = this._lastDisableUntil[o];
        a !== void 0 && a !== i.disableUntil && (e = e ?? {}, e[o] = !0, this._scheduleUntilFlashClear(o)), this._lastDisableUntil[o] = i.disableUntil;
      }
    e && (this._untilFlash = { ...this._untilFlash, ...e });
  }
  _scheduleUntilFlashClear(t) {
    setTimeout(() => {
      if (!this._untilFlash[t]) return;
      const { [t]: e, ...s } = this._untilFlash;
      this._untilFlash = s;
    }, 900);
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
    const t = rt(this.hass.states), e = he(this.hass.states), s = lt(this.hass.states), i = ct(this.hass.states), o = dt(this.hass.states), a = pt(this.hass.states), n = ht(t, e);
    return r`
      <div class="toolbar">
        <ha-icon icon="mdi:clipboard-check-outline"></ha-icon>
        <span class="toolbar-title">Chores</span>
        ${this._busy ? r`<ha-icon class="spin" icon="mdi:loading"></ha-icon>` : d}
      </div>

      <div class="content">
        ${this._error ? r`
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

        ${this._tab === "chores" ? this._renderChoresTab(t, s, n) : this._tab === "privileges" ? this._renderPrivilegesTab(e, t, n) : this._tab === "categories" ? this._renderCategoriesTab(s, n) : this._tab === "users" ? this._renderUsersTab(n, o, a) : this._tab === "history" ? this._renderHistoryTab(t, s, n) : this._renderSettingsTab(i, n)}
      </div>

      ${this._dialog ? this._renderDialog(t, s, n) : d}
      ${this._resetPointsDialog ? this._renderResetPointsDialog(n) : d}
      ${this._undoDialog ? this._renderUndoDialog() : d}
    `;
  }
  // --- Chores tab ----------------------------------------------------
  _renderChoresTab(t, e, s) {
    const i = t.filter((n) => {
      if (this._categoryFilter) {
        if (this._categoryFilter === R) {
          if (n.category) return !1;
        } else if (n.category !== this._categoryFilter)
          return !1;
      }
      return !(this._bulkUser && !n.assignees.some((l) => l.assignee === this._bulkUser));
    }), o = this._sortChores(i, e), a = this._categoryFilter && this._categoryFilter !== R;
    return r`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreateChore}>
          <ha-icon icon="mdi:plus"></ha-icon> New chore
        </button>
        ${this._renderCategoryFilterPicker(e)}
        ${this._renderChoreSortPicker()}
        ${a ? r`
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

      ${this._renderPointsSummary(i)}

      ${o.length === 0 ? r`<p class="empty">
            ${t.length === 0 ? "No chores yet. Create one to get started." : "No chores match the current filters."}
          </p>` : r`<div class="card-grid">
            ${o.map((n) => this._renderChoreCard(n, e))}
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
    return r`
      <select
        class="user-picker"
        title="Sort chores"
        .value=${this._choreSort}
        @change=${(e) => this._choreSort = e.target.value}
      >
        ${t.map((e) => r`<option value=${e.value}>${e.label}</option>`)}
      </select>
    `;
  }
  _sortChores(t, e) {
    const s = [...t], i = (o) => o ? e.find((a) => a.slug === o)?.name ?? o : "";
    switch (this._choreSort) {
      case "points":
        s.sort((o, a) => a.points - o.points || o.name.localeCompare(a.name));
        break;
      case "frequency":
        s.sort(
          (o, a) => o.frequency.localeCompare(a.frequency) || o.name.localeCompare(a.name)
        );
        break;
      case "category":
        s.sort(
          (o, a) => i(o.category).localeCompare(i(a.category)) || o.name.localeCompare(a.name)
        );
        break;
      case "name":
      default:
        s.sort((o, a) => o.name.localeCompare(a.name));
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
    for (const i of t)
      for (const o of i.assignees)
        this._bulkUser && o.assignee !== this._bulkUser || e.set(o.assignee, (e.get(o.assignee) ?? 0) + o.points);
    if (e.size === 0) return d;
    const s = [...e.entries()].sort((i, o) => i[0].localeCompare(o[0]));
    return r`
      <div class="points-summary">
        <ha-icon icon="mdi:star-outline"></ha-icon>
        <span>Points possible:</span>
        ${s.map(
      ([i, o], a) => r`
            ${a > 0 ? r`<span class="points-summary-sep">·</span>` : d}
            <span
              ><strong>${this._displayName(i)}</strong> ${o}</span
            >
          `
    )}
      </div>
    `;
  }
  _renderCategoryFilterPicker(t) {
    return r`
      <select
        class="user-picker"
        title="Filter chores by category"
        .value=${this._categoryFilter}
        @change=${(e) => this._categoryFilter = e.target.value}
      >
        <option value="">All categories</option>
        <option value=${R}>Uncategorized</option>
        ${t.map(
      (e) => r`<option value=${e.slug}>${e.name}</option>`
    )}
      </select>
    `;
  }
  _renderBulkUserPicker(t) {
    return r`
      <select
        class="user-picker"
        title="Filter the chores shown below, and limit Reset completed / Start new day, to one assignee"
        .value=${this._bulkUser}
        @change=${(e) => this._bulkUser = e.target.value}
      >
        <option value="">All assignees</option>
        ${t.map(
      (e) => r`<option value=${e}>${this._displayName(e)}</option>`
    )}
      </select>
    `;
  }
  _renderChoreCard(t, e) {
    const s = t.assignees.some((a) => a.points !== t.points), i = `${t.points} point${t.points === 1 ? "" : "s"}${s ? " (default)" : ""}`, o = t.category ? e.find((a) => a.slug === t.category)?.name ?? t.category : null;
    return r`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${t.icon || E}></ha-icon>
          <div class="card-title">
            <div class="name">${t.name}</div>
            <div class="meta">
              ${t.frequency} · ${i}
              ${o ? r` · ${o}` : d}
              ${t.description ? r` · ${t.description}` : d}
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
          ${t.assignees.filter((a) => !this._bulkUser || a.assignee === this._bulkUser).map(
      (a) => r`
                <div class="assignee-row">
                  <span class="assignee-name">${this._displayName(a.assignee)}</span>
                  ${a.points !== t.points ? r`<span class="points-override-badge" title="Point override"
                        >${a.points}pt</span
                      >` : d}
                  <span class="state-chip ${this._choreStateClass(a.state)}"
                    >${a.state}</span
                  >
                  <div class="row-actions">
                    <button
                      class="icon-button"
                      title="Request"
                      ?disabled=${a.state === "Pending"}
                      @click=${() => this._markChore(t.slug, a.assignee, "mark_pending")}
                    >
                      <ha-icon icon="mdi:plus-circle-outline"></ha-icon>
                    </button>
                    <button
                      class="icon-button"
                      title="Complete"
                      ?disabled=${a.state === "Complete"}
                      @click=${() => this._markChore(t.slug, a.assignee, "mark_complete")}
                    >
                      <ha-icon icon="mdi:check-circle-outline"></ha-icon>
                    </button>
                    <button
                      class="icon-button"
                      title="Clear"
                      ?disabled=${a.state === "Not Requested"}
                      @click=${() => this._markChore(
        t.slug,
        a.assignee,
        "mark_not_requested"
      )}
                    >
                      <ha-icon icon="mdi:close-circle-outline"></ha-icon>
                    </button>
                    <button
                      class="icon-button"
                      title="Finalize now (instead of waiting for auto-finalize)"
                      ?disabled=${a.state !== "Complete"}
                      @click=${() => this._finalizeOne(t.slug, a.assignee)}
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
    return r`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreatePrivilege}>
          <ha-icon icon="mdi:plus"></ha-icon> New privilege
        </button>
      </div>

      ${t.length === 0 ? r`<p class="empty">No privileges yet. Create one to get started.</p>` : r`<div class="card-grid">
            ${t.map((i) => this._renderPrivilegeCard(i, e, s))}
          </div>`}
    `;
  }
  _renderPrivilegeCard(t, e, s) {
    const i = t.linkedChores.map(
      (o) => e.find((a) => a.slug === o)?.name ?? o
    );
    return r`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${t.icon || D}></ha-icon>
          <div class="card-title">
            <div class="name">${t.name}</div>
            <div class="meta">
              ${t.behavior}
              ${i.length ? r` · linked: ${i.join(", ")}` : r` · linked: all requested chores`}
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
          ${t.assignees.map((o) => {
      const a = o.state === "Temporarily Disabled", n = this._disableReasonKey(t.slug, o.assignee);
      return r`
              <div class="assignee-row privilege-row">
                <div class="assignee-main">
                  <span class="assignee-name">${this._displayName(o.assignee)}</span>
                  <span class="state-chip ${this._privilegeStateClass(o.state)}">
                    ${o.state}${a && o.disableUntil ? r`<span
                          class="until-date ${this._untilFlash[n] ? "until-flash" : ""}"
                        >
                          (${this._formatUntil(o.disableUntil)})</span
                        >` : d}
                  </span>
                  ${t.behavior === "manual" ? r`
                        <div class="row-actions">
                          <button
                            class="action-chip"
                            title="Enable"
                            ?disabled=${o.state === "Enabled"}
                            @click=${() => this._call(p, "enable_privilege", {
        user: o.assignee,
        privilege_slug: t.slug
      })}
                          >
                            <ha-icon icon="mdi:check-circle-outline"></ha-icon>
                            <span>Enable</span>
                          </button>
                          <button
                            class="action-chip"
                            title="Disable"
                            ?disabled=${o.state === "Disabled"}
                            @click=${() => this._call(p, "disable_privilege", {
        user: o.assignee,
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
                    .value=${this._disableReasonInput[n] ?? o.disableReason ?? ""}
                    @input=${(l) => {
        this._disableReasonInput = {
          ...this._disableReasonInput,
          [n]: l.target.value
        };
      }}
                    @keydown=${(l) => {
        l.key === "Enter" && l.target.blur();
      }}
                    @blur=${() => {
        a && this._saveDisableReason(
          t.slug,
          o.assignee,
          o.disableReason
        );
      }}
                  />
                  <div class="block-stepper-buttons">
                    ${this._renderBlockStepper(
        "1h",
        a,
        () => this._adjustTemporaryDisable(t.slug, o.assignee, -60),
        () => this._addTemporaryDisable(
          t.slug,
          o.assignee,
          a,
          60,
          n
        )
      )}
                    ${this._renderBlockStepper(
        "1d",
        a,
        () => this._adjustTemporaryDisable(
          t.slug,
          o.assignee,
          -1440
        ),
        () => this._addTemporaryDisable(
          t.slug,
          o.assignee,
          a,
          1440,
          n
        )
      )}
                    <button
                      class="action-chip"
                      title="Clear the block now"
                      ?disabled=${!a}
                      @click=${() => this._clearTemporaryDisable(t.slug, o.assignee)}
                    >
                      <ha-icon icon="mdi:backspace-outline"></ha-icon>
                      <span>Clear</span>
                    </button>
                  </div>
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
  _renderBlockStepper(t, e, s, i) {
    return r`
      <div class="stepper">
        <button
          title="Shorten the block by ${t}"
          ?disabled=${!e}
          @click=${s}
        >
          <ha-icon icon="mdi:minus"></ha-icon>
        </button>
        <span class="stepper-unit">${t}</span>
        <button title="Extend the block by ${t}" @click=${i}>
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
      const e = new Date(t), s = /* @__PURE__ */ new Date(), i = e.toDateString() === s.toDateString(), o = e.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
      return i ? `until ${o}` : `until ${e.toLocaleDateString()} ${o}`;
    } catch {
      return "";
    }
  }
  // --- Categories tab --------------------------------------------------
  _renderCategoriesTab(t, e) {
    return r`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreateCategory}>
          <ha-icon icon="mdi:plus"></ha-icon> New category
        </button>
        <div class="spacer"></div>
        ${this._renderBulkUserPicker(e)}
      </div>

      ${t.length === 0 ? r`<p class="empty">
            No categories yet. Create one, then assign it to chores.
          </p>` : r`<div class="card-grid">
            ${t.map((s) => this._renderCategoryCard(s))}
          </div>`}
    `;
  }
  _renderCategoryCard(t) {
    const e = `${t.choreCount} chore${t.choreCount === 1 ? "" : "s"}`;
    return r`
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
  _renderSettingsTab(t, e) {
    this._settingsDraft || (this._settingsDraft = {
      autoFinalizeEnabled: t.autoFinalizeEnabled,
      autoFinalizeDelayMinutes: t.autoFinalizeDelayMinutes,
      newDayTime: t.newDayTime,
      newWeekDay: t.newWeekDay,
      newWeekTime: t.newWeekTime
    });
    const s = this._settingsDraft;
    return r`
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
            @change=${(i) => {
      s.autoFinalizeEnabled = i.target.checked, this.requestUpdate();
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
            @input=${(i) => {
      s.autoFinalizeDelayMinutes = Number(i.target.value) || 1, this.requestUpdate();
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
            @input=${(i) => {
      s.newDayTime = i.target.value, this.requestUpdate();
    }}
          />
        </label>

        <label>
          New week day
          <select
            .value=${s.newWeekDay}
            @change=${(i) => {
      s.newWeekDay = i.target.value, this.requestUpdate();
    }}
          >
            ${et.map(
      (i) => r`<option value=${i} ?selected=${i === s.newWeekDay}>
                ${i[0].toUpperCase()}${i.slice(1)}
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
            @input=${(i) => {
      s.newWeekTime = i.target.value, this.requestUpdate();
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
    return e ? r`
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
      (s) => r`<option value=${s}>${this._displayName(s)}</option>`
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
    const i = new Map(e.map((a) => [a.assignee, a])), o = new Map(s.map((a) => [a.assignee, a]));
    return r`
      ${t.length === 0 ? r`<p class="empty">
            No assignees yet. Add one to a chore or privilege to get started.
          </p>` : r`<div class="card-grid">
            ${t.map(
      (a) => this._renderUserCard(a, i.get(a), o.get(a))
    )}
          </div>`}
    `;
  }
  _renderUserCard(t, e, s) {
    const i = e?.totalPoints ?? 0, o = e?.pointsEarned ?? 0, a = e?.pointsMissed ?? 0, n = e?.pointsPossible ?? 0;
    return r`
      <div class="card">
        <div class="user-card-header">
          <div class="user-identity">
            <ha-icon icon="mdi:account-outline"></ha-icon>
            <span class="name">${this._displayName(t)}</span>
          </div>
          <div class="user-points-total" title="Lifetime total points">
            <span class="user-points-value">${i}</span>
            <span class="user-points-label">points</span>
          </div>
        </div>
        <div class="points-stats">
          <div class="points-stat">
            <span class="points-stat-value">${o}</span>
            <span class="points-stat-label">earned today</span>
          </div>
          <div class="points-stat">
            <span class="points-stat-value">${a}</span>
            <span class="points-stat-label">missed</span>
          </div>
          <div class="points-stat">
            <span class="points-stat-value">${n}</span>
            <span class="points-stat-label">possible today</span>
          </div>
        </div>
        ${s ? r`
              <div class="user-goal-row">
                <span class="user-goal-label">Point goal</span>
                <input
                  type="number"
                  min="0"
                  class="user-goal-input"
                  .value=${String(s.value)}
                  @change=${(l) => this._setPointGoal(
      s.entityId,
      l.target.value
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
            @input=${(l) => {
      this._userAdjustInput = {
        ...this._userAdjustInput,
        [t]: l.target.value
      };
    }}
          />
          <input
            type="text"
            class="user-adjust-reason-input"
            placeholder="Reason (optional)"
            .value=${this._userAdjustReasonInput[t] ?? ""}
            @input=${(l) => {
      this._userAdjustReasonInput = {
        ...this._userAdjustReasonInput,
        [t]: l.target.value
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
    const i = this._userAdjustReasonInput[t]?.trim();
    await this._call(p, "adjust_points", {
      user: t,
      adjustment: s,
      ...i ? { reason: i } : {}
    }) && (this._userAdjustInput = { ...this._userAdjustInput, [t]: "" }, this._userAdjustReasonInput = { ...this._userAdjustReasonInput, [t]: "" });
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
    const i = this._historyEntries ?? [], a = [...i.filter((l) => {
      if (this._historyUserFilter && l.assignee !== this._historyUserFilter)
        return !1;
      if (this._historyCategoryFilter) {
        if (this._historyCategoryFilter === R) {
          if (l.category) return !1;
        } else if (l.category !== this._historyCategoryFilter)
          return !1;
      }
      return !(this._historyChoreFilter && l.choreSlug !== this._historyChoreFilter || this._historyActionFilter.length > 0 && !this._historyActionFilter.includes(l.action));
    })].sort((l, c) => c.timestamp.localeCompare(l.timestamp)), n = [...t].sort((l, c) => l.name.localeCompare(c.name));
    return r`
      <div class="actions-row">
        <select
          class="user-picker"
          title="Filter history by assignee"
          .value=${this._historyUserFilter}
          @change=${(l) => this._historyUserFilter = l.target.value}
        >
          <option value="">All assignees</option>
          ${s.map(
      (l) => r`<option value=${l}>${this._displayName(l)}</option>`
    )}
        </select>
        <select
          class="user-picker"
          title="Filter history by category"
          .value=${this._historyCategoryFilter}
          @change=${(l) => this._historyCategoryFilter = l.target.value}
        >
          <option value="">All categories</option>
          <option value=${R}>Uncategorized</option>
          ${e.map((l) => r`<option value=${l.slug}>${l.name}</option>`)}
        </select>
        <select
          class="user-picker"
          title="Filter history by chore"
          .value=${this._historyChoreFilter}
          @change=${(l) => this._historyChoreFilter = l.target.value}
        >
          <option value="">All chores</option>
          ${n.map((l) => r`<option value=${l.slug}>${l.name}</option>`)}
        </select>
        <div
          class="chip-toggle-group"
          role="group"
          aria-label="Filter history by event type"
        >
          ${mt.map((l) => {
      const c = this._historyActionFilter.includes(l);
      return r`
              <button
                type="button"
                class="chip-toggle ${ge(l)} ${c ? "selected" : ""}"
                aria-pressed=${c}
                @click=${() => this._toggleHistoryActionFilter(l)}
              >
                ${ue(l)}
              </button>
            `;
    })}
        </div>
        <div class="spacer"></div>
        <button ?disabled=${this._historyLoading} @click=${() => this._loadHistory()}>
          ${this._historyLoading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      ${this._historyEntries === null ? r`<p class="empty">Loading history&hellip;</p>` : a.length === 0 ? r`<p class="empty">
              ${i.length === 0 ? "No chore history yet. Complete a chore to get started." : "No history entries match the current filters."}
            </p>` : r`
              <div class="history-list">
                <div class="history-row history-header">
                  <div class="history-cell history-time">Time</div>
                  <div class="history-cell history-chore">Chore</div>
                  <div class="history-cell history-assignee">Assignee</div>
                  <div class="history-cell history-action">Action</div>
                  <div class="history-cell history-earned">Earned</div>
                  <div class="history-cell history-missed">Missed</div>
                  <div class="history-cell history-undo">Undo</div>
                </div>
                ${a.map((l) => this._renderHistoryRow(l, e))}
              </div>
            `}
    `;
  }
  _renderHistoryRow(t, e) {
    const s = t.category ? e.find((n) => n.slug === t.category)?.name ?? t.category : null, i = t.pointsDelta > 0 ? "points-positive" : t.pointsDelta < 0 ? "points-negative" : "", o = t.pointsDelta > 0 ? `+${t.pointsDelta}` : t.pointsDelta, a = t.action === "completed" && !t.undone && !!this.hass.user?.is_admin;
    return r`
      <div class="history-row ${t.undone ? "history-row-undone" : ""}">
        <div class="history-cell history-time">
          ${this._formatHistoryTimestamp(t.timestamp)}
        </div>
        <div class="history-cell history-chore">
          <div class="name">${t.choreName}</div>
          ${s ? r`<div class="meta">${s}</div>` : d}
          ${t.reason ? r`<div class="meta">"${t.reason}"</div>` : d}
          ${t.penalty ? r`<div class="meta points-negative">Penalty: -${t.penalty}</div>` : d}
        </div>
        <div class="history-cell history-assignee">
          ${this._displayName(t.assignee)}
        </div>
        <div class="history-cell history-action">
          <span class="state-chip ${ge(t.action)}">
            ${ue(t.action)}
          </span>
        </div>
        <div class="history-cell history-earned" title="Points balance after this entry">
          ${t.pointsTotal}
          ${t.pointsDelta !== 0 ? r`<div class="meta ${i}">${o}</div>` : d}
        </div>
        <div
          class="history-cell history-missed"
          title="Cumulative missed points after this entry"
        >
          ${t.missedTotal ?? "—"}
          ${t.pointsMissed > 0 ? r`<div class="meta points-negative">+${t.pointsMissed}</div>` : d}
        </div>
        <div class="history-cell history-undo">
          ${a ? r`
                <button
                  type="button"
                  class="action-chip history-undo-button"
                  title="Reverse this completion's points"
                  @click=${() => this._openUndoDialog(t)}
                >
                  <ha-icon icon="mdi:undo"></ha-icon>
                  <span>Undo</span>
                </button>
              ` : t.undone ? r`<span class="meta">Undone</span>` : r`<span class="meta">—</span>`}
        </div>
      </div>
    `;
  }
  _renderUndoDialog() {
    const t = this._undoDialog;
    if (!t) return d;
    const e = t.awarded + t.penalty;
    return r`
      <div class="overlay" @click=${this._onUndoOverlayClick}>
        <div class="dialog" role="dialog" aria-modal="true">
          <div class="dialog-header">
            <h2>Undo completion</h2>
            <button class="icon-button" @click=${() => this._undoDialog = null}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="dialog-body">
            <p class="hint danger-text">
              Reverses "${t.choreName}" for ${this._displayName(t.assignee)},
              clawing back the ${t.awarded} point(s) it awarded${t.penalty ? r` plus a ${t.penalty}-point penalty (${e} total)` : d}. This cannot be undone.
            </p>
            <label>
              Reason
              <input
                type="text"
                placeholder="Why is this being undone?"
                .value=${t.reason}
                @input=${(s) => {
      t.reason = s.target.value, this.requestUpdate();
    }}
              />
            </label>
            <label>
              Penalty (extra points to withhold)
              <input
                type="number"
                min="0"
                .value=${String(t.penalty)}
                @input=${(s) => {
      t.penalty = Math.max(
        0,
        Number(s.target.value) || 0
      ), this.requestUpdate();
    }}
              />
            </label>
          </div>
          <div class="dialog-footer">
            <button @click=${() => this._undoDialog = null}>Cancel</button>
            <button class="danger" ?disabled=${this._busy} @click=${() => this._confirmUndo()}>
              Undo completion
            </button>
          </div>
        </div>
      </div>
    `;
  }
  async _confirmUndo() {
    const t = this._undoDialog;
    if (!t) return;
    await this._call(p, "undo_completion", {
      entry_id: t.entryId,
      penalty: t.penalty,
      ...t.reason.trim() ? { reason: t.reason.trim() } : {}
    }) && (this._undoDialog = null, await this._loadHistory());
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
    const i = this._dialog.kind, o = this._dialog.original ? "Edit" : "New", a = i === "chore" ? "chore" : i === "privilege" ? "privilege" : "category";
    return r`
      <div class="overlay" @click=${this._onOverlayClick}>
        <div class="dialog" role="dialog" aria-modal="true">
          <div class="dialog-header">
            <h2>${o} ${a}</h2>
            <button class="icon-button" @click=${this._closeDialog}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="dialog-body">
            ${i === "chore" ? this._renderChoreForm(e, s) : i === "privilege" ? this._renderPrivilegeForm(t, s) : this._renderCategoryForm()}
          </div>
          <div class="dialog-footer">
            <button @click=${this._closeDialog}>Cancel</button>
            <button
              class="primary"
              ?disabled=${this._busy}
              @click=${() => i === "chore" ? this._saveChoreDialog() : i === "privilege" ? this._savePrivilegeDialog() : this._saveCategoryDialog()}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    `;
  }
  _renderChoreForm(t, e) {
    const s = this._dialog.draft, i = !!this._dialog.original, o = x(s.slug || s.name), a = i && o && o !== this._dialog.original;
    return r`
      <label>
        Name
        <input
          type="text"
          .value=${s.name}
          @input=${(n) => {
      s.name = n.target.value, this.requestUpdate();
    }}
        />
      </label>

      <label>
        Slug
        <input
          type="text"
          .value=${s.slug}
          placeholder=${o || "auto-generated from name"}
          @input=${(n) => {
      s.slug = n.target.value, this.requestUpdate();
    }}
        />
        ${a ? r`<span class="hint">Will be renamed to "${o}"</span>` : i ? d : r`<span class="hint">Will be saved as "${o}"</span>`}
      </label>

      <label>
        Description
        <input
          type="text"
          .value=${s.description}
          @input=${(n) => {
      s.description = n.target.value, this.requestUpdate();
    }}
        />
      </label>

      <div class="form-row">
        <label>
          Frequency
          <select
            .value=${s.frequency}
            @change=${(n) => {
      s.frequency = n.target.value, this.requestUpdate();
    }}
          >
            ${Je.map(
      (n) => r`<option value=${n}>${n}</option>`
    )}
          </select>
        </label>

        <label>
          Points
          <input
            type="number"
            min="0"
            .value=${String(s.points)}
            @input=${(n) => {
      s.points = Number(n.target.value) || 0, this.requestUpdate();
    }}
          />
        </label>
      </div>

      <label>
        Category
        <select
          .value=${s.category}
          @change=${(n) => {
      s.category = n.target.value, this.requestUpdate();
    }}
        >
          <option value=${ee}>Uncategorized</option>
          ${t.map(
      (n) => r`<option value=${n.slug}>${n.name}</option>`
    )}
        </select>
      </label>

      ${this._renderIconField(s.icon, E, (n) => {
      s.icon = n, this.requestUpdate();
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
    return t.assignees.length === 0 ? d : r`
      <label>
        Points per assignee
        <span class="hint"
          >Leave matching the default above to use it; change a value to
          reward that assignee differently for this chore.</span
        >
        <div class="points-override-list">
          ${t.assignees.map((e) => {
      const s = t.pointsByAssignee[e] ?? t.points;
      return r`
              <div class="points-override-row">
                <span class="points-override-name">${this._displayName(e)}</span>
                <input
                  type="number"
                  min="0"
                  class="points-override-input"
                  .value=${String(s)}
                  @input=${(i) => {
        const o = Number(i.target.value) || 0, a = { ...t.pointsByAssignee };
        o === t.points ? delete a[e] : a[e] = o, t.pointsByAssignee = a, this.requestUpdate();
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
    const s = this._dialog.draft, i = !!this._dialog.original, o = x(s.slug || s.name), a = i && o && o !== this._dialog.original;
    return r`
      <label>
        Name
        <input
          type="text"
          .value=${s.name}
          @input=${(n) => {
      s.name = n.target.value, this.requestUpdate();
    }}
        />
      </label>

      <label>
        Slug
        <input
          type="text"
          .value=${s.slug}
          placeholder=${o || "auto-generated from name"}
          @input=${(n) => {
      s.slug = n.target.value, this.requestUpdate();
    }}
        />
        ${a ? r`<span class="hint">Will be renamed to "${o}"</span>` : i ? d : r`<span class="hint">Will be saved as "${o}"</span>`}
      </label>

      <label>
        Behavior
        <select
          .value=${s.behavior}
          @change=${(n) => {
      s.behavior = n.target.value, this.requestUpdate();
    }}
        >
          ${Qe.map(
      (n) => r`<option value=${n}>${n}</option>`
    )}
        </select>
        <span class="hint"
          >Automatic privileges turn on when their linked chores are
          complete. Manual ones are only toggled by an admin.</span
        >
      </label>

      ${this._renderIconField(s.icon, D, (n) => {
      s.icon = n, this.requestUpdate();
    })}

      <label>
        Linked chores
        <span class="hint"
          >Leave all unchecked to require every requested chore to be
          complete instead of a specific list.</span
        >
        <div class="checkbox-list">
          ${t.length === 0 ? r`<span class="hint">No chores defined yet.</span>` : t.map(
      (n) => r`
                  <label class="checkbox-item">
                    <input
                      type="checkbox"
                      .checked=${s.linkedChores.includes(n.slug)}
                      @change=${(l) => {
        const c = l.target.checked;
        s.linkedChores = c ? [...s.linkedChores, n.slug] : s.linkedChores.filter((b) => b !== n.slug), this.requestUpdate();
      }}
                    />
                    ${n.name}
                  </label>
                `
    )}
        </div>
      </label>

      ${this._renderAssigneeEditor(s, e)}
    `;
  }
  _renderCategoryForm() {
    const t = this._dialog.draft, e = !!this._dialog.original, s = x(t.slug || t.name), i = e && s && s !== this._dialog.original;
    return r`
      <label>
        Name
        <input
          type="text"
          .value=${t.name}
          @input=${(o) => {
      t.name = o.target.value, this.requestUpdate();
    }}
        />
      </label>

      <label>
        Slug
        <input
          type="text"
          .value=${t.slug}
          placeholder=${s || "auto-generated from name"}
          @input=${(o) => {
      t.slug = o.target.value, this.requestUpdate();
    }}
        />
        ${i ? r`<span class="hint">Will be renamed to "${s}"</span>` : e ? d : r`<span class="hint">Will be saved as "${s}"</span>`}
      </label>

      ${this._renderIconField(t.icon, S, (o) => {
      t.icon = o, this.requestUpdate();
    })}
    `;
  }
  _renderIconField(t, e, s) {
    return r`
      <label>
        Icon
        <div class="icon-field">
          <ha-icon .icon=${t || e}></ha-icon>
          <input
            type="text"
            .value=${t}
            placeholder=${e}
            @input=${(i) => s(i.target.value)}
          />
        </div>
      </label>
    `;
  }
  _renderAssigneeEditor(t, e) {
    return r`
      <label>
        Assignees
        <div class="chip-list">
          ${t.assignees.map(
      (s) => r`
              <span class="chip">
                ${this._displayName(s)}
                <button
                  class="chip-remove"
                  @click=${() => {
        t.assignees = t.assignees.filter((i) => i !== s), this.requestUpdate();
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
      (s) => r`<option value=${s} label=${this._displayName(s)}></option>`
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
      draft: st(t)
    };
  }
  _openEditPrivilege(t) {
    this._error = null, this._dialog = {
      kind: "privilege",
      original: t.slug,
      draft: nt(t)
    };
  }
  _openEditCategory(t) {
    this._error = null, this._dialog = {
      kind: "category",
      original: t.slug,
      draft: ot(t)
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
    } catch (i) {
      return this._error = i instanceof Error ? i.message : String(i), !1;
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
  async _addTemporaryDisable(t, e, s, i, o) {
    const a = this._pendingReason(o);
    if (await this._call(
      p,
      s ? "adjust_temporary_disable" : "temporarily_disable_privilege",
      {
        user: e,
        privilege_slug: t,
        ...s ? { adjustment: i } : { duration: i },
        ...a !== void 0 ? { reason: a } : {}
      }
    ) && a !== void 0) {
      const { [o]: l, ...c } = this._disableReasonInput;
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
    const i = this._disableReasonKey(t, e), o = this._pendingReason(i);
    if (await this._call(p, "adjust_temporary_disable", {
      user: e,
      privilege_slug: t,
      adjustment: s,
      ...o !== void 0 ? { reason: o } : {}
    }) && o !== void 0) {
      const { [i]: n, ...l } = this._disableReasonInput;
      this._disableReasonInput = l;
    }
  }
  /**
   * Save an edited reason on an already-blocked privilege without changing
   * its duration, via a zero-minute `adjust_temporary_disable` adjustment.
   * Fired on blur/Enter so editing the reason text doesn't require also
   * touching a stepper. No-ops if the field wasn't actually changed.
   */
  async _saveDisableReason(t, e, s) {
    const i = this._disableReasonKey(t, e), o = this._pendingReason(i);
    if (o === void 0 || o === (s ?? "")) return;
    if (await this._call(p, "adjust_temporary_disable", {
      user: e,
      privilege_slug: t,
      adjustment: 0,
      reason: o
    })) {
      const { [i]: n, ...l } = this._disableReasonInput;
      this._disableReasonInput = l;
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
      const i = this._disableReasonKey(t, e), { [i]: o, ...a } = this._disableReasonInput;
      this._disableReasonInput = a;
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
    const s = e.assignees.join(","), i = Object.entries(e.pointsByAssignee).filter(([a]) => e.assignees.includes(a)).map(([a, n]) => `${a}:${n}`).join(",");
    (t.original ? await this._call(p, "update_chore", {
      slug: t.original,
      name: e.name,
      description: e.description,
      frequency: e.frequency,
      assignees: s,
      icon: e.icon || E,
      points: e.points,
      points_by_assignee: i,
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
      points_by_assignee: i,
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
      icon: e.icon || S,
      ...this._renameField(t.original, e.slug || e.name)
    }) : await this._call(p, "create_category", {
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
    const s = e.assignees.join(","), i = e.linkedChores.join(",");
    (t.original ? await this._call(p, "update_privilege", {
      slug: t.original,
      name: e.name,
      icon: e.icon || D,
      behavior: e.behavior,
      linked_chores: i,
      assignees: s,
      ...this._renameField(t.original, e.slug || e.name)
    }) : await this._call(p, "create_privilege", {
      name: e.name,
      slug: x(e.slug || e.name),
      icon: e.icon || D,
      behavior: e.behavior,
      linked_chores: i,
      assignees: s
    })) && (this._dialog = null);
  }
};
h.styles = Ce`
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
      transition: transform 0.12s ease, background 0.12s ease;
    }
    .icon-button:hover {
      background: rgba(0, 0, 0, 0.06);
    }
    .icon-button:active {
      transform: scale(0.88);
      background: rgba(0, 0, 0, 0.12);
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
      transition: transform 0.12s ease, background 0.12s ease;
    }
    .action-chip ha-icon {
      --mdc-icon-size: 16px;
    }
    .action-chip:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.06);
    }
    .action-chip:active:not(:disabled) {
      transform: scale(0.94);
      background: rgba(0, 0, 0, 0.12);
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
      gap: 10px;
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
      gap: 8px 10px;
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.03));
      border-radius: 8px;
      padding: 8px 10px;
    }
    .block-steppers-label {
      font-size: 12px;
      color: var(--secondary-text-color, #727272);
      white-space: nowrap;
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
    /*
     * Steppers + clear button stay together as one unit when wrapping,
     * instead of each one wrapping independently and scattering across
     * two ragged lines.
     */
    .block-stepper-buttons {
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      gap: 6px;
      flex-shrink: 0;
      margin-left: auto;
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
      transition: transform 0.1s ease, background 0.12s ease;
    }
    .stepper button ha-icon {
      --mdc-icon-size: 16px;
    }
    .stepper button:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.06);
    }
    .stepper button:active:not(:disabled) {
      transform: scale(0.85);
      background: rgba(0, 0, 0, 0.12);
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
    .until-date {
      display: inline-block;
    }
    .until-flash {
      animation: until-pulse 0.9s ease;
    }
    @keyframes until-pulse {
      0% {
        transform: scale(1);
      }
      25% {
        transform: scale(1.18);
        color: var(--primary-color, #03a9f4);
      }
      100% {
        transform: scale(1);
      }
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
      grid-template-columns: 1.2fr 1.5fr 0.9fr 0.8fr 0.8fr 0.7fr 0.9fr;
      gap: 8px;
      align-items: center;
      padding: 10px 14px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      font-size: 13px;
      min-width: 760px;
    }
    .history-row:last-child {
      border-bottom: none;
    }
    /* A reversed completion stays in the log (it's an audit trail) but
       reads as struck-through, matching the done-and-undone state. */
    .history-row-undone {
      opacity: 0.7;
    }
    .history-row-undone .history-cell.history-chore .name,
    .history-row-undone .history-action .state-chip {
      text-decoration: line-through;
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
    .history-cell.history-undo {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      text-align: right;
    }
    .history-undo-button {
      font-size: 11px;
      padding: 2px 8px 2px 6px;
      white-space: nowrap;
    }
    .history-undo-button ha-icon {
      --mdc-icon-size: 14px;
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
    .user-adjust-reason-input {
      flex: 1;
      min-width: 0;
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
], h.prototype, "hass", 2);
g([
  Q({ type: Boolean })
], h.prototype, "narrow", 2);
g([
  m()
], h.prototype, "_tab", 2);
g([
  m()
], h.prototype, "_dialog", 2);
g([
  m()
], h.prototype, "_busy", 2);
g([
  m()
], h.prototype, "_error", 2);
g([
  m()
], h.prototype, "_bulkUser", 2);
g([
  m()
], h.prototype, "_categoryFilter", 2);
g([
  m()
], h.prototype, "_choreSort", 2);
g([
  m()
], h.prototype, "_userDisplayNames", 2);
g([
  m()
], h.prototype, "_settingsDraft", 2);
g([
  m()
], h.prototype, "_resetPointsDialog", 2);
g([
  m()
], h.prototype, "_undoDialog", 2);
g([
  m()
], h.prototype, "_userAdjustInput", 2);
g([
  m()
], h.prototype, "_userAdjustReasonInput", 2);
g([
  m()
], h.prototype, "_disableReasonInput", 2);
g([
  m()
], h.prototype, "_untilFlash", 2);
g([
  m()
], h.prototype, "_historyEntries", 2);
g([
  m()
], h.prototype, "_historyLoading", 2);
g([
  m()
], h.prototype, "_historyUserFilter", 2);
g([
  m()
], h.prototype, "_historyCategoryFilter", 2);
g([
  m()
], h.prototype, "_historyChoreFilter", 2);
g([
  m()
], h.prototype, "_historyActionFilter", 2);
h = g([
  Ve("simple-chores-panel")
], h);
