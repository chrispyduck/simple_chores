/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const R = globalThis, L = R.ShadowRoot && (R.ShadyCSS === void 0 || R.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, B = Symbol(), X = /* @__PURE__ */ new WeakMap();
let le = class {
  constructor(e, t, s) {
    if (this._$cssResult$ = !0, s !== B) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (L && e === void 0) {
      const s = t !== void 0 && t.length === 1;
      s && (e = X.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), s && X.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const _e = (i) => new le(typeof i == "string" ? i : i + "", void 0, B), ce = (i, ...e) => {
  const t = i.length === 1 ? i[0] : e.reduce((s, r, o) => s + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + i[o + 1], i[0]);
  return new le(t, i, B);
}, me = (i, e) => {
  if (L) i.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const s = document.createElement("style"), r = R.litNonce;
    r !== void 0 && s.setAttribute("nonce", r), s.textContent = t.cssText, i.appendChild(s);
  }
}, Z = L ? (i) => i : (i) => i instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const s of e.cssRules) t += s.cssText;
  return _e(t);
})(i) : i;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: ge, defineProperty: $e, getOwnPropertyDescriptor: ve, getOwnPropertyNames: ye, getOwnPropertySymbols: be, getPrototypeOf: Ae } = Object, I = globalThis, G = I.trustedTypes, we = G ? G.emptyScript : "", Ee = I.reactiveElementPolyfillSupport, C = (i, e) => i, H = { toAttribute(i, e) {
  switch (e) {
    case Boolean:
      i = i ? we : null;
      break;
    case Object:
    case Array:
      i = i == null ? i : JSON.stringify(i);
  }
  return i;
}, fromAttribute(i, e) {
  let t = i;
  switch (e) {
    case Boolean:
      t = i !== null;
      break;
    case Number:
      t = i === null ? null : Number(i);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(i);
      } catch {
        t = null;
      }
  }
  return t;
} }, W = (i, e) => !ge(i, e), J = { attribute: !0, type: String, converter: H, reflect: !1, useDefault: !1, hasChanged: W };
Symbol.metadata ??= Symbol("metadata"), I.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let b = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = J) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const s = Symbol(), r = this.getPropertyDescriptor(e, s, t);
      r !== void 0 && $e(this.prototype, e, r);
    }
  }
  static getPropertyDescriptor(e, t, s) {
    const { get: r, set: o } = ve(this.prototype, e) ?? { get() {
      return this[t];
    }, set(n) {
      this[t] = n;
    } };
    return { get: r, set(n) {
      const l = r?.call(this);
      o?.call(this, n), this.requestUpdate(e, l, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? J;
  }
  static _$Ei() {
    if (this.hasOwnProperty(C("elementProperties"))) return;
    const e = Ae(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(C("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(C("properties"))) {
      const t = this.properties, s = [...ye(t), ...be(t)];
      for (const r of s) this.createProperty(r, t[r]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [s, r] of t) this.elementProperties.set(s, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, s] of this.elementProperties) {
      const r = this._$Eu(t, s);
      r !== void 0 && this._$Eh.set(r, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const s = new Set(e.flat(1 / 0).reverse());
      for (const r of s) t.unshift(Z(r));
    } else e !== void 0 && t.push(Z(e));
    return t;
  }
  static _$Eu(e, t) {
    const s = t.attribute;
    return s === !1 ? void 0 : typeof s == "string" ? s : typeof e == "string" ? e.toLowerCase() : void 0;
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
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const s of t.keys()) this.hasOwnProperty(s) && (e.set(s, this[s]), delete this[s]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return me(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((e) => e.hostDisconnected?.());
  }
  attributeChangedCallback(e, t, s) {
    this._$AK(e, s);
  }
  _$ET(e, t) {
    const s = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, s);
    if (r !== void 0 && s.reflect === !0) {
      const o = (s.converter?.toAttribute !== void 0 ? s.converter : H).toAttribute(t, s.type);
      this._$Em = e, o == null ? this.removeAttribute(r) : this.setAttribute(r, o), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const s = this.constructor, r = s._$Eh.get(e);
    if (r !== void 0 && this._$Em !== r) {
      const o = s.getPropertyOptions(r), n = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : H;
      this._$Em = r;
      const l = n.fromAttribute(t, o.type);
      this[r] = l ?? this._$Ej?.get(r) ?? l, this._$Em = null;
    }
  }
  requestUpdate(e, t, s, r = !1, o) {
    if (e !== void 0) {
      const n = this.constructor;
      if (r === !1 && (o = this[e]), s ??= n.getPropertyOptions(e), !((s.hasChanged ?? W)(o, t) || s.useDefault && s.reflect && o === this._$Ej?.get(e) && !this.hasAttribute(n._$Eu(e, s)))) return;
      this.C(e, t, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: s, reflect: r, wrapped: o }, n) {
    s && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, n ?? t ?? this[e]), o !== !0 || n !== void 0) || (this._$AL.has(e) || (this.hasUpdated || s || (t = void 0), this._$AL.set(e, t)), r === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
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
        for (const [r, o] of this._$Ep) this[r] = o;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [r, o] of s) {
        const { wrapped: n } = o, l = this[r];
        n !== !0 || this._$AL.has(r) || l === void 0 || this.C(r, void 0, o, l);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((s) => s.hostUpdate?.()), this.update(t)) : this._$EM();
    } catch (s) {
      throw e = !1, this._$EM(), s;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    this._$EO?.forEach((t) => t.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
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
    this._$Eq &&= this._$Eq.forEach((t) => this._$ET(t, this[t])), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
b.elementStyles = [], b.shadowRootOptions = { mode: "open" }, b[C("elementProperties")] = /* @__PURE__ */ new Map(), b[C("finalized")] = /* @__PURE__ */ new Map(), Ee?.({ ReactiveElement: b }), (I.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const q = globalThis, Q = (i) => i, k = q.trustedTypes, ee = k ? k.createPolicy("lit-html", { createHTML: (i) => i }) : void 0, he = "$lit$", m = `lit$${Math.random().toFixed(9).slice(2)}$`, de = "?" + m, xe = `<${de}>`, y = document, P = () => y.createComment(""), T = (i) => i === null || typeof i != "object" && typeof i != "function", F = Array.isArray, Se = (i) => F(i) || typeof i?.[Symbol.iterator] == "function", j = `[ 	
\f\r]`, S = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, te = /-->/g, se = />/g, $ = RegExp(`>|${j}(?:([^\\s"'>=/]+)(${j}*=${j}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ie = /'/g, re = /"/g, pe = /^(?:script|style|textarea|title)$/i, Ce = (i) => (e, ...t) => ({ _$litType$: i, strings: e, values: t }), f = Ce(1), w = Symbol.for("lit-noChange"), h = Symbol.for("lit-nothing"), oe = /* @__PURE__ */ new WeakMap(), v = y.createTreeWalker(y, 129);
function ue(i, e) {
  if (!F(i) || !i.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ee !== void 0 ? ee.createHTML(e) : e;
}
const Pe = (i, e) => {
  const t = i.length - 1, s = [];
  let r, o = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", n = S;
  for (let l = 0; l < t; l++) {
    const a = i[l];
    let d, p, c = -1, u = 0;
    for (; u < a.length && (n.lastIndex = u, p = n.exec(a), p !== null); ) u = n.lastIndex, n === S ? p[1] === "!--" ? n = te : p[1] !== void 0 ? n = se : p[2] !== void 0 ? (pe.test(p[2]) && (r = RegExp("</" + p[2], "g")), n = $) : p[3] !== void 0 && (n = $) : n === $ ? p[0] === ">" ? (n = r ?? S, c = -1) : p[1] === void 0 ? c = -2 : (c = n.lastIndex - p[2].length, d = p[1], n = p[3] === void 0 ? $ : p[3] === '"' ? re : ie) : n === re || n === ie ? n = $ : n === te || n === se ? n = S : (n = $, r = void 0);
    const _ = n === $ && i[l + 1].startsWith("/>") ? " " : "";
    o += n === S ? a + xe : c >= 0 ? (s.push(d), a.slice(0, c) + he + a.slice(c) + m + _) : a + m + (c === -2 ? l : _);
  }
  return [ue(i, o + (i[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), s];
};
class O {
  constructor({ strings: e, _$litType$: t }, s) {
    let r;
    this.parts = [];
    let o = 0, n = 0;
    const l = e.length - 1, a = this.parts, [d, p] = Pe(e, t);
    if (this.el = O.createElement(d, s), v.currentNode = this.el.content, t === 2 || t === 3) {
      const c = this.el.content.firstChild;
      c.replaceWith(...c.childNodes);
    }
    for (; (r = v.nextNode()) !== null && a.length < l; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const c of r.getAttributeNames()) if (c.endsWith(he)) {
          const u = p[n++], _ = r.getAttribute(c).split(m), M = /([.?@])?(.*)/.exec(u);
          a.push({ type: 1, index: o, name: M[2], strings: _, ctor: M[1] === "." ? Oe : M[1] === "?" ? Ne : M[1] === "@" ? Ue : z }), r.removeAttribute(c);
        } else c.startsWith(m) && (a.push({ type: 6, index: o }), r.removeAttribute(c));
        if (pe.test(r.tagName)) {
          const c = r.textContent.split(m), u = c.length - 1;
          if (u > 0) {
            r.textContent = k ? k.emptyScript : "";
            for (let _ = 0; _ < u; _++) r.append(c[_], P()), v.nextNode(), a.push({ type: 2, index: ++o });
            r.append(c[u], P());
          }
        }
      } else if (r.nodeType === 8) if (r.data === de) a.push({ type: 2, index: o });
      else {
        let c = -1;
        for (; (c = r.data.indexOf(m, c + 1)) !== -1; ) a.push({ type: 7, index: o }), c += m.length - 1;
      }
      o++;
    }
  }
  static createElement(e, t) {
    const s = y.createElement("template");
    return s.innerHTML = e, s;
  }
}
function E(i, e, t = i, s) {
  if (e === w) return e;
  let r = s !== void 0 ? t._$Co?.[s] : t._$Cl;
  const o = T(e) ? void 0 : e._$litDirective$;
  return r?.constructor !== o && (r?._$AO?.(!1), o === void 0 ? r = void 0 : (r = new o(i), r._$AT(i, t, s)), s !== void 0 ? (t._$Co ??= [])[s] = r : t._$Cl = r), r !== void 0 && (e = E(i, r._$AS(i, e.values), r, s)), e;
}
class Te {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: s } = this._$AD, r = (e?.creationScope ?? y).importNode(t, !0);
    v.currentNode = r;
    let o = v.nextNode(), n = 0, l = 0, a = s[0];
    for (; a !== void 0; ) {
      if (n === a.index) {
        let d;
        a.type === 2 ? d = new U(o, o.nextSibling, this, e) : a.type === 1 ? d = new a.ctor(o, a.name, a.strings, this, e) : a.type === 6 && (d = new De(o, this, e)), this._$AV.push(d), a = s[++l];
      }
      n !== a?.index && (o = v.nextNode(), n++);
    }
    return v.currentNode = y, r;
  }
  p(e) {
    let t = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(e, s, t), t += s.strings.length - 2) : s._$AI(e[t])), t++;
  }
}
class U {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, t, s, r) {
    this.type = 2, this._$AH = h, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = s, this.options = r, this._$Cv = r?.isConnected ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const t = this._$AM;
    return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, t = this) {
    e = E(this, e, t), T(e) ? e === h || e == null || e === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : e !== this._$AH && e !== w && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Se(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== h && T(this._$AH) ? this._$AA.nextSibling.data = e : this.T(y.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: t, _$litType$: s } = e, r = typeof s == "number" ? this._$AC(e) : (s.el === void 0 && (s.el = O.createElement(ue(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === r) this._$AH.p(t);
    else {
      const o = new Te(r, this), n = o.u(this.options);
      o.p(t), this.T(n), this._$AH = o;
    }
  }
  _$AC(e) {
    let t = oe.get(e.strings);
    return t === void 0 && oe.set(e.strings, t = new O(e)), t;
  }
  k(e) {
    F(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let s, r = 0;
    for (const o of e) r === t.length ? t.push(s = new U(this.O(P()), this.O(P()), this, this.options)) : s = t[r], s._$AI(o), r++;
    r < t.length && (this._$AR(s && s._$AB.nextSibling, r), t.length = r);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    for (this._$AP?.(!1, !0, t); e !== this._$AB; ) {
      const s = Q(e).nextSibling;
      Q(e).remove(), e = s;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class z {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, s, r, o) {
    this.type = 1, this._$AH = h, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = o, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = h;
  }
  _$AI(e, t = this, s, r) {
    const o = this.strings;
    let n = !1;
    if (o === void 0) e = E(this, e, t, 0), n = !T(e) || e !== this._$AH && e !== w, n && (this._$AH = e);
    else {
      const l = e;
      let a, d;
      for (e = o[0], a = 0; a < o.length - 1; a++) d = E(this, l[s + a], t, a), d === w && (d = this._$AH[a]), n ||= !T(d) || d !== this._$AH[a], d === h ? e = h : e !== h && (e += (d ?? "") + o[a + 1]), this._$AH[a] = d;
    }
    n && !r && this.j(e);
  }
  j(e) {
    e === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Oe extends z {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === h ? void 0 : e;
  }
}
class Ne extends z {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== h);
  }
}
class Ue extends z {
  constructor(e, t, s, r, o) {
    super(e, t, s, r, o), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = E(this, e, t, 0) ?? h) === w) return;
    const s = this._$AH, r = e === h && s !== h || e.capture !== s.capture || e.once !== s.once || e.passive !== s.passive, o = e !== h && (s === h || r);
    r && this.element.removeEventListener(this.name, this, s), o && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class De {
  constructor(e, t, s) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    E(this, e);
  }
}
const Me = q.litHtmlPolyfillSupport;
Me?.(O, U), (q.litHtmlVersions ??= []).push("3.3.3");
const Re = (i, e, t) => {
  const s = t?.renderBefore ?? e;
  let r = s._$litPart$;
  if (r === void 0) {
    const o = t?.renderBefore ?? null;
    s._$litPart$ = r = new U(e.insertBefore(P(), o), o, void 0, t ?? {});
  }
  return r._$AI(i), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const V = globalThis;
class A extends b {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Re(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return w;
  }
}
A._$litElement$ = !0, A.finalized = !0, V.litElementHydrateSupport?.({ LitElement: A });
const He = V.litElementPolyfillSupport;
He?.({ LitElement: A });
(V.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const fe = (i) => (e, t) => {
  t !== void 0 ? t.addInitializer(() => {
    customElements.define(i, e);
  }) : customElements.define(i, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ke = { attribute: !0, type: String, converter: H, reflect: !1, hasChanged: W }, Ie = (i = ke, e, t) => {
  const { kind: s, metadata: r } = t;
  let o = globalThis.litPropertyMetadata.get(r);
  if (o === void 0 && globalThis.litPropertyMetadata.set(r, o = /* @__PURE__ */ new Map()), s === "setter" && ((i = Object.create(i)).wrapped = !0), o.set(t.name, i), s === "accessor") {
    const { name: n } = t;
    return { set(l) {
      const a = e.get.call(this);
      e.set.call(this, l), this.requestUpdate(n, a, i, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(n, void 0, i, l), l;
    } };
  }
  if (s === "setter") {
    const { name: n } = t;
    return function(l) {
      const a = this[n];
      e.call(this, l), this.requestUpdate(n, a, i, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function Y(i) {
  return (e, t) => typeof t == "object" ? Ie(i, e, t) : ((s, r, o) => {
    const n = r.hasOwnProperty(o);
    return r.constructor.createProperty(o, s), n ? Object.getOwnPropertyDescriptor(r, o) : void 0;
  })(i, e, t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function D(i) {
  return Y({ ...i, state: !0, attribute: !1 });
}
const ze = "simple_chores", je = "sensor.simple_chore_", Le = "sensor.simple_chore_privilege_", Be = "sensor.simple_chore_meta_", We = "sensor.simple_chore_category_", qe = "mdi:clipboard-list-outline";
function Fe(i) {
  const e = /* @__PURE__ */ new Map();
  for (const [t, s] of Object.entries(i)) {
    if (!t.startsWith(je) || t.startsWith(Le) || t.startsWith(Be) || t.startsWith(We)) continue;
    const r = s.attributes, o = r.chore_slug;
    if (!o) continue;
    let n = e.get(o);
    n || (n = {
      slug: o,
      name: r.chore_name ?? o,
      description: r.description ?? "",
      frequency: r.frequency ?? "daily",
      icon: r.icon ?? qe,
      // default_points is the chore's shared value; older/unrefreshed
      // sensors may not have it yet, so fall back to this assignee's
      // resolved points rather than leaving the definition unset.
      points: r.default_points ?? r.points ?? 0,
      category: r.category ?? null,
      assignees: []
    }, e.set(o, n)), n.assignees.push({
      assignee: r.assignee,
      entityId: t,
      state: s.state,
      points: r.points ?? n.points
    });
  }
  for (const t of e.values())
    t.assignees.sort((s, r) => s.assignee.localeCompare(r.assignee));
  return [...e.values()].sort((t, s) => t.name.localeCompare(s.name));
}
function Ve(i, e) {
  const t = /* @__PURE__ */ new Set();
  for (const s of i)
    for (const r of s.assignees) t.add(r.assignee);
  for (const s of e)
    for (const r of s.assignees) t.add(r.assignee);
  return [...t].sort((s, r) => s.localeCompare(r));
}
function Ye(i) {
  return i ? i.map((e) => ({
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
function Ke(i) {
  switch (i) {
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
      return i;
  }
}
function Xe(i) {
  return i === "completed" ? "state-good" : i === "uncompleted" ? "state-bad" : i === "missed" || i === "adjusted" ? "state-warn" : "state-neutral";
}
var Ze = Object.defineProperty, Ge = Object.getOwnPropertyDescriptor, K = (i, e, t, s) => {
  for (var r = s > 1 ? void 0 : s ? Ge(e, t) : e, o = i.length - 1, n; o >= 0; o--)
    (n = i[o]) && (r = (s ? n(e, t, r) : n(r)) || r);
  return s && r && Ze(e, t, r), r;
};
const Je = 7, ne = "simple-chores-history-card-editor-assignees";
let N = class extends A {
  constructor() {
    super(...arguments), this._config = {
      type: "custom:simple-chores-history-card",
      assignee: ""
    };
  }
  setConfig(i) {
    this._config = i;
  }
  render() {
    if (!this.hass) return h;
    const i = this._config, e = Ve(Fe(this.hass.states), []);
    return f`
      <div class="form">
        <label>
          Assignee
          <input
            type="text"
            list=${ne}
            placeholder="e.g. alice"
            .value=${i.assignee ?? ""}
            @input=${(t) => this._update({ assignee: t.target.value })}
          />
        </label>
        <datalist id=${ne}>
          ${e.map((t) => f`<option value=${t}></option>`)}
        </datalist>

        <label>
          Title (optional)
          <input
            type="text"
            placeholder="No header"
            .value=${i.title ?? ""}
            @input=${(t) => this._update({ title: t.target.value })}
          />
        </label>

        <label>
          Days to show
          <input
            type="number"
            min="1"
            .value=${String(i.days ?? Je)}
            @input=${(t) => {
      const s = Number(t.target.value);
      Number.isFinite(s) && s > 0 && this._update({ days: s });
    }}
          />
        </label>

        <div class="hint">Event types to show</div>
        <div class="checkboxes">
          <label class="checkbox-item">
            <input
              type="checkbox"
              .checked=${i.show_completed ?? !0}
              @change=${(t) => this._update({
      show_completed: t.target.checked
    })}
            />
            Completed
          </label>
          <label class="checkbox-item">
            <input
              type="checkbox"
              .checked=${i.show_uncompleted ?? !0}
              @change=${(t) => this._update({
      show_uncompleted: t.target.checked
    })}
            />
            Uncompleted
          </label>
          <label class="checkbox-item">
            <input
              type="checkbox"
              .checked=${i.show_missed ?? !0}
              @change=${(t) => this._update({ show_missed: t.target.checked })}
            />
            Missed
          </label>
          <label class="checkbox-item">
            <input
              type="checkbox"
              .checked=${i.show_reset ?? !1}
              @change=${(t) => this._update({ show_reset: t.target.checked })}
            />
            Reset
          </label>
        </div>
      </div>
    `;
  }
  /** Merge `changes` into the config, drop an empty title, then notify Lovelace. */
  _update(i) {
    const e = { ...this._config, ...i };
    e.title || delete e.title, this._config = e, this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: e },
        bubbles: !0,
        composed: !0
      })
    );
  }
};
N.styles = ce`
    .form {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 8px 0;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 13px;
      color: var(--secondary-text-color, #727272);
    }
    input[type="text"],
    input[type="number"] {
      font: inherit;
      font-size: 14px;
      color: var(--primary-text-color, #212121);
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 8px 10px;
    }
    .hint {
      font-size: 12px;
      color: var(--secondary-text-color, #727272);
    }
    .checkboxes {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 20px;
    }
    .checkbox-item {
      flex-direction: row;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--primary-text-color, #212121);
    }
  `;
K([
  Y({ attribute: !1 })
], N.prototype, "hass", 2);
K([
  D()
], N.prototype, "_config", 2);
N = K([
  fe("simple-chores-history-card-editor")
], N);
var Qe = Object.defineProperty, et = Object.getOwnPropertyDescriptor, x = (i, e, t, s) => {
  for (var r = s > 1 ? void 0 : s ? et(e, t) : e, o = i.length - 1, n; o >= 0; o--)
    (n = i[o]) && (r = (s ? n(e, t, r) : n(r)) || r);
  return s && r && Qe(e, t, r), r;
};
const ae = 7, tt = 1440 * 60 * 1e3;
let g = class extends A {
  constructor() {
    super(...arguments), this._entries = null, this._error = null, this._loading = !1;
  }
  setConfig(i) {
    if (!i.assignee)
      throw new Error("simple-chores-history-card: 'assignee' is required");
    this._config = i;
  }
  updated(i) {
    this.hass && this._config && this._entries === null && !this._loading && this._loadHistory();
  }
  getCardSize() {
    return 1 + Math.min(this._config?.days ?? ae, 10);
  }
  static getStubConfig() {
    return { assignee: "" };
  }
  static async getConfigElement() {
    return document.createElement("simple-chores-history-card-editor");
  }
  async _loadHistory() {
    this._loading = !0;
    try {
      const i = await this.hass.callWS({
        type: "call_service",
        domain: ze,
        service: "get_history",
        service_data: {},
        return_response: !0
      });
      this._entries = Ye(i?.response?.entries);
    } catch (i) {
      this._error = i instanceof Error ? i.message : String(i);
    } finally {
      this._loading = !1;
    }
  }
  _actionEnabled(i) {
    switch (i) {
      case "completed":
        return this._config.show_completed ?? !0;
      case "uncompleted":
        return this._config.show_uncompleted ?? !0;
      case "missed":
        return this._config.show_missed ?? !0;
      case "reset":
        return this._config.show_reset ?? !1;
      default:
        return !0;
    }
  }
  render() {
    if (!this._config) return h;
    const i = this._config.days ?? ae, e = Date.now() - i * tt, t = (this._entries ?? []).filter(
      (s) => s.assignee === this._config.assignee && this._actionEnabled(s.action) && new Date(s.timestamp).getTime() >= e
    ).sort((s, r) => r.timestamp.localeCompare(s.timestamp));
    return f`
      <ha-card header=${this._config.title ?? h}>
        <div class="card-content">
          ${this._error ? f`<p class="error">${this._error}</p>` : this._entries === null ? f`<p class="empty">Loading&hellip;</p>` : t.length === 0 ? f`<p class="empty">Nothing to show yet.</p>` : this._renderTable(t)}
        </div>
      </ha-card>
    `;
  }
  _renderTable(i) {
    const e = [];
    let t = null;
    for (const s of i) {
      const r = this._dateKey(s.timestamp);
      r !== t && (e.push(
        f`<div class="date-header">${this._formatDate(s.timestamp)}</div>`
      ), t = r), e.push(this._renderRow(s));
    }
    return f`
      <div class="table">
        <div class="row col-header">
          <div class="cell time">Time</div>
          <div class="cell event">Event</div>
          <div class="cell chore">Chore</div>
          <div class="cell col-span-header">Earned</div>
          <div class="cell col-span-header">Missed</div>
        </div>
        ${e}
      </div>
    `;
  }
  _renderRow(i) {
    const e = i.pointsDelta > 0 ? "points-positive" : i.pointsDelta < 0 ? "points-negative" : "", t = i.pointsDelta > 0 ? `+${i.pointsDelta}` : i.pointsDelta;
    return f`
      <div class="row">
        <div class="cell time">${this._formatTime(i.timestamp)}</div>
        <div class="cell event">
          <span class="state-chip ${Xe(i.action)}">
            ${Ke(i.action)}
          </span>
        </div>
        <div class="cell chore">${i.choreName}</div>
        <div class="cell delta ${e}">
          ${i.pointsDelta !== 0 ? t : h}
        </div>
        <div class="cell earned">${i.pointsTotal}</div>
        <div class="cell delta points-negative">
          ${i.pointsMissed > 0 ? `+${i.pointsMissed}` : h}
        </div>
        <div class="cell missed">${i.missedTotal ?? "—"}</div>
      </div>
    `;
  }
  /** Grouping key only - not for display, so locale/format changes can't split a day. */
  _dateKey(i) {
    const e = new Date(i);
    return Number.isNaN(e.getTime()) ? i : e.toDateString();
  }
  _formatDate(i) {
    const e = new Date(i);
    return Number.isNaN(e.getTime()) ? i : e.toLocaleDateString(void 0, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }
  _formatTime(i) {
    const e = new Date(i);
    return Number.isNaN(e.getTime()) ? i : e.toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit" });
  }
};
g.styles = ce`
    .card-content {
      padding: 4px 16px 16px;
    }
    .empty,
    .error {
      padding: 8px 0;
      color: var(--secondary-text-color, #727272);
    }
    .error {
      color: var(--error-color, #db4437);
    }
    .table {
      overflow-x: auto;
    }
    .date-header {
      padding: 12px 0 4px;
      font-size: 12px;
      font-weight: 500;
      color: var(--secondary-text-color, #727272);
    }
    .date-header:first-of-type {
      padding-top: 0;
    }
    .row {
      display: grid;
      grid-template-columns: 0.6fr 0.9fr 1.6fr 0.35fr 0.25fr 0.35fr 0.25fr;
      gap: 6px;
      align-items: center;
      padding: 4px 0;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      font-size: 13px;
      min-width: 460px;
    }
    /* Each .row is its own grid, so fr-tracks only line up across rows if
       no cell's content can force its track wider than its fr share - the
       default min-width:auto on grid items sizes to content otherwise
       (most visibly .chore, where a long name ignores its white-space:
       nowrap + ellipsis and just widens the track instead of truncating). */
    .cell {
      min-width: 0;
    }
    .row:last-child {
      border-bottom: none;
    }
    .col-header {
      font-size: 12px;
      font-weight: 500;
      color: var(--secondary-text-color, #727272);
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
    }
    /* Covers its delta+total column pair, so those two can be narrower
       individually while the label still reads clearly across both. */
    .col-span-header {
      grid-column: span 2;
      text-align: center;
    }
    .cell.chore {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--primary-text-color, #212121);
    }
    .cell.earned,
    .cell.missed,
    .cell.delta {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .cell.delta {
      font-size: 11px;
    }
    .points-positive {
      color: #2e7d32;
    }
    .points-negative {
      color: var(--error-color, #db4437);
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
  `;
x([
  Y({ attribute: !1 })
], g.prototype, "hass", 2);
x([
  D()
], g.prototype, "_config", 2);
x([
  D()
], g.prototype, "_entries", 2);
x([
  D()
], g.prototype, "_error", 2);
x([
  D()
], g.prototype, "_loading", 2);
g = x([
  fe("simple-chores-history-card")
], g);
window.customCards = window.customCards ?? [];
window.customCards.push({
  type: "simple-chores-history-card",
  name: "Chore History",
  description: "Shows one assignee's recent Simple Chores activity.",
  preview: !1
});
