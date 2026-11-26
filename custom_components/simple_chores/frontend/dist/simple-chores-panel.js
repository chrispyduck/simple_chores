/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const q = globalThis, V = q.ShadowRoot && (q.ShadyCSS === void 0 || q.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Y = Symbol(), ie = /* @__PURE__ */ new WeakMap();
let be = class {
  constructor(e, i, o) {
    if (this._$cssResult$ = !0, o !== Y) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = i;
  }
  get styleSheet() {
    let e = this.o;
    const i = this.t;
    if (V && e === void 0) {
      const o = i !== void 0 && i.length === 1;
      o && (e = ie.get(i)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), o && ie.set(i, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Ce = (t) => new be(typeof t == "string" ? t : t + "", void 0, Y), De = (t, ...e) => {
  const i = t.length === 1 ? t[0] : e.reduce((o, s, a) => o + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + t[a + 1], t[0]);
  return new be(i, t, Y);
}, Ee = (t, e) => {
  if (V) t.adoptedStyleSheets = e.map((i) => i instanceof CSSStyleSheet ? i : i.styleSheet);
  else for (const i of e) {
    const o = document.createElement("style"), s = q.litNonce;
    s !== void 0 && o.setAttribute("nonce", s), o.textContent = i.cssText, t.appendChild(o);
  }
}, se = V ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let i = "";
  for (const o of e.cssRules) i += o.cssText;
  return Ce(i);
})(t) : t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Se, defineProperty: Ue, getOwnPropertyDescriptor: Pe, getOwnPropertyNames: Ne, getOwnPropertySymbols: Te, getPrototypeOf: Re } = Object, W = globalThis, oe = W.trustedTypes, ze = oe ? oe.emptyScript : "", Fe = W.reactiveElementPolyfillSupport, R = (t, e) => t, H = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? ze : null;
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
} }, X = (t, e) => !Se(t, e), ae = { attribute: !0, type: String, converter: H, reflect: !1, useDefault: !1, hasChanged: X };
Symbol.metadata ??= Symbol("metadata"), W.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let C = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, i = ae) {
    if (i.state && (i.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((i = Object.create(i)).wrapped = !0), this.elementProperties.set(e, i), !i.noAccessor) {
      const o = Symbol(), s = this.getPropertyDescriptor(e, o, i);
      s !== void 0 && Ue(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, i, o) {
    const { get: s, set: a } = Pe(this.prototype, e) ?? { get() {
      return this[i];
    }, set(r) {
      this[i] = r;
    } };
    return { get: s, set(r) {
      const l = s?.call(this);
      a?.call(this, r), this.requestUpdate(e, l, o);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? ae;
  }
  static _$Ei() {
    if (this.hasOwnProperty(R("elementProperties"))) return;
    const e = Re(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(R("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(R("properties"))) {
      const i = this.properties, o = [...Ne(i), ...Te(i)];
      for (const s of o) this.createProperty(s, i[s]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const i = litPropertyMetadata.get(e);
      if (i !== void 0) for (const [o, s] of i) this.elementProperties.set(o, s);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [i, o] of this.elementProperties) {
      const s = this._$Eu(i, o);
      s !== void 0 && this._$Eh.set(s, i);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const i = [];
    if (Array.isArray(e)) {
      const o = new Set(e.flat(1 / 0).reverse());
      for (const s of o) i.unshift(se(s));
    } else e !== void 0 && i.push(se(e));
    return i;
  }
  static _$Eu(e, i) {
    const o = i.attribute;
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
    const e = /* @__PURE__ */ new Map(), i = this.constructor.elementProperties;
    for (const o of i.keys()) this.hasOwnProperty(o) && (e.set(o, this[o]), delete this[o]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Ee(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((e) => e.hostDisconnected?.());
  }
  attributeChangedCallback(e, i, o) {
    this._$AK(e, o);
  }
  _$ET(e, i) {
    const o = this.constructor.elementProperties.get(e), s = this.constructor._$Eu(e, o);
    if (s !== void 0 && o.reflect === !0) {
      const a = (o.converter?.toAttribute !== void 0 ? o.converter : H).toAttribute(i, o.type);
      this._$Em = e, a == null ? this.removeAttribute(s) : this.setAttribute(s, a), this._$Em = null;
    }
  }
  _$AK(e, i) {
    const o = this.constructor, s = o._$Eh.get(e);
    if (s !== void 0 && this._$Em !== s) {
      const a = o.getPropertyOptions(s), r = typeof a.converter == "function" ? { fromAttribute: a.converter } : a.converter?.fromAttribute !== void 0 ? a.converter : H;
      this._$Em = s;
      const l = r.fromAttribute(i, a.type);
      this[s] = l ?? this._$Ej?.get(s) ?? l, this._$Em = null;
    }
  }
  requestUpdate(e, i, o, s = !1, a) {
    if (e !== void 0) {
      const r = this.constructor;
      if (s === !1 && (a = this[e]), o ??= r.getPropertyOptions(e), !((o.hasChanged ?? X)(a, i) || o.useDefault && o.reflect && a === this._$Ej?.get(e) && !this.hasAttribute(r._$Eu(e, o)))) return;
      this.C(e, i, o);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, i, { useDefault: o, reflect: s, wrapped: a }, r) {
    o && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, r ?? i ?? this[e]), a !== !0 || r !== void 0) || (this._$AL.has(e) || (this.hasUpdated || o || (i = void 0), this._$AL.set(e, i)), s === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
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
        for (const [s, a] of this._$Ep) this[s] = a;
        this._$Ep = void 0;
      }
      const o = this.constructor.elementProperties;
      if (o.size > 0) for (const [s, a] of o) {
        const { wrapped: r } = a, l = this[s];
        r !== !0 || this._$AL.has(s) || l === void 0 || this.C(s, void 0, a, l);
      }
    }
    let e = !1;
    const i = this._$AL;
    try {
      e = this.shouldUpdate(i), e ? (this.willUpdate(i), this._$EO?.forEach((o) => o.hostUpdate?.()), this.update(i)) : this._$EM();
    } catch (o) {
      throw e = !1, this._$EM(), o;
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
C.elementStyles = [], C.shadowRootOptions = { mode: "open" }, C[R("elementProperties")] = /* @__PURE__ */ new Map(), C[R("finalized")] = /* @__PURE__ */ new Map(), Fe?.({ ReactiveElement: C }), (W.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Z = globalThis, re = (t) => t, L = Z.trustedTypes, ne = L ? L.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, _e = "$lit$", v = `lit$${Math.random().toFixed(9).slice(2)}$`, ye = "?" + v, Ie = `<${ye}>`, k = document, F = () => k.createComment(""), I = (t) => t === null || typeof t != "object" && typeof t != "function", J = Array.isArray, Me = (t) => J(t) || typeof t?.[Symbol.iterator] == "function", G = `[ 	
\f\r]`, N = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, le = /-->/g, ce = />/g, $ = RegExp(`>|${G}(?:([^\\s"'>=/]+)(${G}*=${G}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), de = /'/g, pe = /"/g, fe = /^(?:script|style|textarea|title)$/i, je = (t) => (e, ...i) => ({ _$litType$: t, strings: e, values: i }), n = je(1), U = Symbol.for("lit-noChange"), c = Symbol.for("lit-nothing"), ue = /* @__PURE__ */ new WeakMap(), w = k.createTreeWalker(k, 129);
function ve(t, e) {
  if (!J(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ne !== void 0 ? ne.createHTML(e) : e;
}
const Oe = (t, e) => {
  const i = t.length - 1, o = [];
  let s, a = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", r = N;
  for (let l = 0; l < i; l++) {
    const d = t[l];
    let b, _, g = -1, y = 0;
    for (; y < d.length && (r.lastIndex = y, _ = r.exec(d), _ !== null); ) y = r.lastIndex, r === N ? _[1] === "!--" ? r = le : _[1] !== void 0 ? r = ce : _[2] !== void 0 ? (fe.test(_[2]) && (s = RegExp("</" + _[2], "g")), r = $) : _[3] !== void 0 && (r = $) : r === $ ? _[0] === ">" ? (r = s ?? N, g = -1) : _[1] === void 0 ? g = -2 : (g = r.lastIndex - _[2].length, b = _[1], r = _[3] === void 0 ? $ : _[3] === '"' ? pe : de) : r === pe || r === de ? r = $ : r === le || r === ce ? r = N : (r = $, s = void 0);
    const f = r === $ && t[l + 1].startsWith("/>") ? " " : "";
    a += r === N ? d + Ie : g >= 0 ? (o.push(b), d.slice(0, g) + _e + d.slice(g) + v + f) : d + v + (g === -2 ? l : f);
  }
  return [ve(t, a + (t[i] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), o];
};
class M {
  constructor({ strings: e, _$litType$: i }, o) {
    let s;
    this.parts = [];
    let a = 0, r = 0;
    const l = e.length - 1, d = this.parts, [b, _] = Oe(e, i);
    if (this.el = M.createElement(b, o), w.currentNode = this.el.content, i === 2 || i === 3) {
      const g = this.el.content.firstChild;
      g.replaceWith(...g.childNodes);
    }
    for (; (s = w.nextNode()) !== null && d.length < l; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const g of s.getAttributeNames()) if (g.endsWith(_e)) {
          const y = _[r++], f = s.getAttribute(g).split(v), O = /([.?@])?(.*)/.exec(y);
          d.push({ type: 1, index: a, name: O[2], strings: f, ctor: O[1] === "." ? He : O[1] === "?" ? Le : O[1] === "@" ? We : B }), s.removeAttribute(g);
        } else g.startsWith(v) && (d.push({ type: 6, index: a }), s.removeAttribute(g));
        if (fe.test(s.tagName)) {
          const g = s.textContent.split(v), y = g.length - 1;
          if (y > 0) {
            s.textContent = L ? L.emptyScript : "";
            for (let f = 0; f < y; f++) s.append(g[f], F()), w.nextNode(), d.push({ type: 2, index: ++a });
            s.append(g[y], F());
          }
        }
      } else if (s.nodeType === 8) if (s.data === ye) d.push({ type: 2, index: a });
      else {
        let g = -1;
        for (; (g = s.data.indexOf(v, g + 1)) !== -1; ) d.push({ type: 7, index: a }), g += v.length - 1;
      }
      a++;
    }
  }
  static createElement(e, i) {
    const o = k.createElement("template");
    return o.innerHTML = e, o;
  }
}
function P(t, e, i = t, o) {
  if (e === U) return e;
  let s = o !== void 0 ? i._$Co?.[o] : i._$Cl;
  const a = I(e) ? void 0 : e._$litDirective$;
  return s?.constructor !== a && (s?._$AO?.(!1), a === void 0 ? s = void 0 : (s = new a(t), s._$AT(t, i, o)), o !== void 0 ? (i._$Co ??= [])[o] = s : i._$Cl = s), s !== void 0 && (e = P(t, s._$AS(t, e.values), s, o)), e;
}
class qe {
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
    const { el: { content: i }, parts: o } = this._$AD, s = (e?.creationScope ?? k).importNode(i, !0);
    w.currentNode = s;
    let a = w.nextNode(), r = 0, l = 0, d = o[0];
    for (; d !== void 0; ) {
      if (r === d.index) {
        let b;
        d.type === 2 ? b = new j(a, a.nextSibling, this, e) : d.type === 1 ? b = new d.ctor(a, d.name, d.strings, this, e) : d.type === 6 && (b = new Be(a, this, e)), this._$AV.push(b), d = o[++l];
      }
      r !== d?.index && (a = w.nextNode(), r++);
    }
    return w.currentNode = k, s;
  }
  p(e) {
    let i = 0;
    for (const o of this._$AV) o !== void 0 && (o.strings !== void 0 ? (o._$AI(e, o, i), i += o.strings.length - 2) : o._$AI(e[i])), i++;
  }
}
class j {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, i, o, s) {
    this.type = 2, this._$AH = c, this._$AN = void 0, this._$AA = e, this._$AB = i, this._$AM = o, this.options = s, this._$Cv = s?.isConnected ?? !0;
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
    e = P(this, e, i), I(e) ? e === c || e == null || e === "" ? (this._$AH !== c && this._$AR(), this._$AH = c) : e !== this._$AH && e !== U && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Me(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== c && I(this._$AH) ? this._$AA.nextSibling.data = e : this.T(k.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: i, _$litType$: o } = e, s = typeof o == "number" ? this._$AC(e) : (o.el === void 0 && (o.el = M.createElement(ve(o.h, o.h[0]), this.options)), o);
    if (this._$AH?._$AD === s) this._$AH.p(i);
    else {
      const a = new qe(s, this), r = a.u(this.options);
      a.p(i), this.T(r), this._$AH = a;
    }
  }
  _$AC(e) {
    let i = ue.get(e.strings);
    return i === void 0 && ue.set(e.strings, i = new M(e)), i;
  }
  k(e) {
    J(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let o, s = 0;
    for (const a of e) s === i.length ? i.push(o = new j(this.O(F()), this.O(F()), this, this.options)) : o = i[s], o._$AI(a), s++;
    s < i.length && (this._$AR(o && o._$AB.nextSibling, s), i.length = s);
  }
  _$AR(e = this._$AA.nextSibling, i) {
    for (this._$AP?.(!1, !0, i); e !== this._$AB; ) {
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
  constructor(e, i, o, s, a) {
    this.type = 1, this._$AH = c, this._$AN = void 0, this.element = e, this.name = i, this._$AM = s, this.options = a, o.length > 2 || o[0] !== "" || o[1] !== "" ? (this._$AH = Array(o.length - 1).fill(new String()), this.strings = o) : this._$AH = c;
  }
  _$AI(e, i = this, o, s) {
    const a = this.strings;
    let r = !1;
    if (a === void 0) e = P(this, e, i, 0), r = !I(e) || e !== this._$AH && e !== U, r && (this._$AH = e);
    else {
      const l = e;
      let d, b;
      for (e = a[0], d = 0; d < a.length - 1; d++) b = P(this, l[o + d], i, d), b === U && (b = this._$AH[d]), r ||= !I(b) || b !== this._$AH[d], b === c ? e = c : e !== c && (e += (b ?? "") + a[d + 1]), this._$AH[d] = b;
    }
    r && !s && this.j(e);
  }
  j(e) {
    e === c ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class He extends B {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === c ? void 0 : e;
  }
}
class Le extends B {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== c);
  }
}
class We extends B {
  constructor(e, i, o, s, a) {
    super(e, i, o, s, a), this.type = 5;
  }
  _$AI(e, i = this) {
    if ((e = P(this, e, i, 0) ?? c) === U) return;
    const o = this._$AH, s = e === c && o !== c || e.capture !== o.capture || e.once !== o.once || e.passive !== o.passive, a = e !== c && (o === c || s);
    s && this.element.removeEventListener(this.name, this, o), a && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Be {
  constructor(e, i, o) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = o;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    P(this, e);
  }
}
const Ge = Z.litHtmlPolyfillSupport;
Ge?.(M, j), (Z.litHtmlVersions ??= []).push("3.3.3");
const Ke = (t, e, i) => {
  const o = i?.renderBefore ?? e;
  let s = o._$litPart$;
  if (s === void 0) {
    const a = i?.renderBefore ?? null;
    o._$litPart$ = s = new j(e.insertBefore(F(), a), a, void 0, i ?? {});
  }
  return s._$AI(t), s;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Q = globalThis;
class z extends C {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const i = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Ke(i, this.renderRoot, this.renderOptions);
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
z._$litElement$ = !0, z.finalized = !0, Q.litElementHydrateSupport?.({ LitElement: z });
const Ve = Q.litElementPolyfillSupport;
Ve?.({ LitElement: z });
(Q.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ye = { attribute: !0, type: String, converter: H, reflect: !1, hasChanged: X }, Xe = (t = Ye, e, i) => {
  const { kind: o, metadata: s } = i;
  let a = globalThis.litPropertyMetadata.get(s);
  if (a === void 0 && globalThis.litPropertyMetadata.set(s, a = /* @__PURE__ */ new Map()), o === "setter" && ((t = Object.create(t)).wrapped = !0), a.set(i.name, t), o === "accessor") {
    const { name: r } = i;
    return { set(l) {
      const d = e.get.call(this);
      e.set.call(this, l), this.requestUpdate(r, d, t, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(r, void 0, t, l), l;
    } };
  }
  if (o === "setter") {
    const { name: r } = i;
    return function(l) {
      const d = this[r];
      e.call(this, l), this.requestUpdate(r, d, t, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + o);
};
function ee(t) {
  return (e, i) => typeof i == "object" ? Xe(t, e, i) : ((o, s, a) => {
    const r = s.hasOwnProperty(a);
    return s.constructor.createProperty(a, o), r ? Object.getOwnPropertyDescriptor(s, a) : void 0;
  })(t, e, i);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function m(t) {
  return ee({ ...t, state: !0, attribute: !1 });
}
function Ze(t) {
  return (e) => {
    customElements.get(t) || customElements.define(t, e);
  };
}
const Je = "sensor.simple_chore_", $e = "sensor.simple_chore_privilege_", xe = "sensor.simple_chore_meta_", we = "sensor.simple_chore_category_", Qe = "number.simple_chore_meta_", ke = "sensor.simple_chore_meta_settings", et = ["daily", "weekly", "manual", "once"], tt = ["automatic", "manual"], it = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
], D = "mdi:clipboard-list-outline", E = "mdi:star", S = "mdi:tag-outline", te = "";
function st() {
  return {
    slug: "",
    name: "",
    description: "",
    frequency: "daily",
    icon: D,
    points: 1,
    pointsByAssignee: {},
    category: te,
    suggestedDuration: "",
    assignees: []
  };
}
const Ae = 1440;
function ot(t) {
  const e = Math.floor(Number(t.trim()));
  return !Number.isFinite(e) || e <= 0 ? 0 : Math.min(e, Ae);
}
function at(t) {
  const e = Math.floor(t / 60), i = t % 60;
  return e === 0 ? `${i} min` : i === 0 ? `${e} hr` : `${e} hr ${i} min`;
}
function rt(t) {
  const e = {};
  for (const i of t.assignees)
    i.points !== t.points && (e[i.assignee] = i.points);
  return {
    slug: t.slug,
    name: t.name,
    description: t.description,
    frequency: t.frequency,
    icon: t.icon,
    points: t.points,
    pointsByAssignee: e,
    category: t.category ?? te,
    suggestedDuration: t.suggestedDuration ? String(t.suggestedDuration) : "",
    assignees: t.assignees.map((i) => i.assignee)
  };
}
function nt() {
  return {
    slug: "",
    name: "",
    icon: S
  };
}
function lt(t) {
  return {
    slug: t.slug,
    name: t.name,
    icon: t.icon
  };
}
function ct() {
  return {
    slug: "",
    name: "",
    icon: E,
    behavior: "automatic",
    linkedChores: [],
    assignees: []
  };
}
function dt(t) {
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
function pt(t) {
  const e = /* @__PURE__ */ new Map();
  for (const [i, o] of Object.entries(t)) {
    if (!i.startsWith(Je) || i.startsWith($e) || i.startsWith(xe) || i.startsWith(we)) continue;
    const s = o.attributes, a = s.chore_slug;
    if (!a) continue;
    let r = e.get(a);
    r || (r = {
      slug: a,
      name: s.chore_name ?? a,
      description: s.description ?? "",
      frequency: s.frequency ?? "daily",
      icon: s.icon ?? D,
      // default_points is the chore's shared value; older/unrefreshed
      // sensors may not have it yet, so fall back to this assignee's
      // resolved points rather than leaving the definition unset.
      points: s.default_points ?? s.points ?? 0,
      category: s.category ?? null,
      suggestedDuration: s.suggested_duration || null,
      assignees: []
    }, e.set(a, r)), r.assignees.push({
      assignee: s.assignee,
      entityId: i,
      state: o.state,
      points: s.points ?? r.points,
      activeSince: s.active_since ?? null,
      timerEndsAt: s.timer_ends_at ?? null
    });
  }
  for (const i of e.values())
    i.assignees.sort((o, s) => o.assignee.localeCompare(s.assignee));
  return [...e.values()].sort((i, o) => i.name.localeCompare(o.name));
}
function he(t) {
  const e = /* @__PURE__ */ new Map();
  for (const [i, o] of Object.entries(t)) {
    if (!i.startsWith($e)) continue;
    const s = o.attributes, a = s.privilege_slug;
    if (!a) continue;
    let r = e.get(a);
    r || (r = {
      slug: a,
      name: s.privilege_name ?? a,
      icon: s.icon ?? E,
      behavior: s.behavior ?? "automatic",
      linkedChores: s.linked_chores ?? [],
      assignees: []
    }, e.set(a, r)), r.assignees.push({
      assignee: s.assignee,
      entityId: i,
      state: o.state,
      disableUntil: s.disable_until,
      disableReason: s.disable_reason
    });
  }
  for (const i of e.values())
    i.assignees.sort((o, s) => o.assignee.localeCompare(s.assignee));
  return [...e.values()].sort((i, o) => i.name.localeCompare(o.name));
}
function ut(t) {
  const e = [];
  for (const [i, o] of Object.entries(t)) {
    if (!i.startsWith(we)) continue;
    const s = o.attributes, a = s.category_slug;
    a && e.push({
      slug: a,
      name: s.category_name ?? a,
      icon: s.icon ?? S,
      entityId: i,
      choreCount: Number(o.state) || 0
    });
  }
  return e.sort((i, o) => i.name.localeCompare(o.name));
}
const A = {
  autoFinalizeEnabled: !0,
  autoFinalizeDelayMinutes: 60,
  newDayTime: "02:00:00",
  newWeekDay: "monday",
  newWeekTime: "02:00:00"
};
function ht(t) {
  const e = t[ke];
  if (!e) return { ...A };
  const i = e.attributes;
  return {
    autoFinalizeEnabled: i.auto_finalize_enabled ?? A.autoFinalizeEnabled,
    autoFinalizeDelayMinutes: i.auto_finalize_delay_minutes ?? A.autoFinalizeDelayMinutes,
    newDayTime: i.new_day_time ?? A.newDayTime,
    newWeekDay: i.new_week_day ?? A.newWeekDay,
    newWeekTime: i.new_week_time ?? A.newWeekTime
  };
}
function gt(t) {
  const e = [];
  for (const [i, o] of Object.entries(t)) {
    if (!i.startsWith(xe) || i === ke) continue;
    const s = o.attributes, a = s.assignee;
    a && e.push({
      assignee: a,
      entityId: i,
      totalPoints: s.total_points ?? 0,
      pointsEarned: s.points_earned ?? 0,
      pointsMissed: s.points_missed ?? 0,
      pointsPossible: s.points_possible ?? 0,
      totalPending: s.total_pending ?? 0,
      totalActive: s.total_active ?? 0,
      totalComplete: s.total_complete ?? 0
    });
  }
  return e.sort((i, o) => i.assignee.localeCompare(o.assignee));
}
function mt(t) {
  const e = [];
  for (const [i, o] of Object.entries(t)) {
    if (!i.startsWith(Qe)) continue;
    const s = o.attributes.assignee;
    s && e.push({
      assignee: s,
      entityId: i,
      value: Number(o.state) || 0
    });
  }
  return e.sort((i, o) => i.assignee.localeCompare(o.assignee));
}
function bt(t, e) {
  const i = /* @__PURE__ */ new Set();
  for (const o of t)
    for (const s of o.assignees) i.add(s.assignee);
  for (const o of e)
    for (const s of o.assignees) i.add(s.assignee);
  return [...i].sort((o, s) => o.localeCompare(s));
}
function _t(t) {
  const e = {};
  for (const i of t)
    i.username && (e[i.username.toLowerCase()] = i.name);
  return e;
}
function yt(t, e) {
  return e[t.toLowerCase()] ?? t;
}
const ft = [
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
function vt(t) {
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
function ge(t) {
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
function me(t) {
  return t === "completed" || t === "privilege_enabled" ? "state-good" : t === "uncompleted" || t === "undone" || t === "privilege_disabled" ? "state-bad" : t === "missed" || t === "adjusted" || t === "privilege_temporarily_disabled" ? "state-warn" : "state-neutral";
}
function K(t) {
  const e = Math.max(0, Math.floor(t)), i = Math.floor(e / 3600), o = Math.floor(e % 3600 / 60), s = e % 60, a = (r) => String(r).padStart(2, "0");
  return i > 0 ? `${i}:${a(o)}:${a(s)}` : `${o}:${a(s)}`;
}
function $t(t, e, i) {
  const o = e ? Date.parse(e) : NaN;
  if (!Number.isNaN(o)) {
    const a = (o - i) / 1e3;
    return a > 0 ? { label: `${K(Math.ceil(a))} left`, overdue: !1 } : { label: `${K(-a)} over`, overdue: !0 };
  }
  const s = t ? Date.parse(t) : NaN;
  return Number.isNaN(s) ? null : { label: `${K((i - s) / 1e3)} elapsed`, overdue: !1 };
}
var xt = Object.defineProperty, wt = Object.getOwnPropertyDescriptor, h = (t, e, i, o) => {
  for (var s = o > 1 ? void 0 : o ? wt(e, i) : e, a = t.length - 1, r; a >= 0; a--)
    (r = t[a]) && (s = (o ? r(e, i, s) : r(s)) || s);
  return o && s && xt(e, i, s), s;
};
const u = "simple_chores", T = "__uncategorized__";
let p = class extends z {
  constructor() {
    super(...arguments), this.narrow = !1, this._tab = "chores", this._dialog = null, this._busy = !1, this._error = null, this._bulkUser = "", this._categoryFilter = "", this._choreSort = "name", this._userDisplayNames = {}, this._settingsDraft = null, this._resetPointsDialog = null, this._undoDialog = null, this._startDialog = null, this._now = Date.now(), this._hasActiveChore = !1, this._userAdjustInput = {}, this._userAdjustReasonInput = {}, this._disableReasonInput = {}, this._untilFlash = {}, this._lastDisableUntil = {}, this._historyEntries = null, this._historyLoading = !1, this._historyUserFilter = "", this._historyCategoryFilter = "", this._historyChoreFilter = "", this._historyActionFilter = [], this._loadedUserDisplayNames = !1, this._openResetPointsDialog = (t) => {
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
      this._error = null, this._dialog = { kind: "chore", draft: st() };
    }, this._openCreatePrivilege = () => {
      this._error = null, this._dialog = { kind: "privilege", draft: ct() };
    }, this._openCreateCategory = () => {
      this._error = null, this._dialog = { kind: "category", draft: nt() };
    };
  }
  updated(t) {
    t.has("hass") && !this.hass?.user?.is_admin && (this._error = "You must be an administrator to manage chores and privileges."), this.hass && !this._loadedUserDisplayNames && (this._loadedUserDisplayNames = !0, this._loadUserDisplayNames());
  }
  willUpdate(t) {
    t.has("hass") && this.hass && (this._detectUntilChanges(), this._hasActiveChore = Object.entries(this.hass.states).some(
      ([e, i]) => e.startsWith("sensor.simple_chore_") && i.state === "Active"
    ));
  }
  connectedCallback() {
    super.connectedCallback(), this._clockInterval = window.setInterval(() => {
      this._hasActiveChore && (this._now = Date.now());
    }, 1e3);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), window.clearInterval(this._clockInterval), this._clockInterval = void 0;
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
    for (const i of t)
      for (const o of i.assignees) {
        const s = this._disableReasonKey(i.slug, o.assignee), a = this._lastDisableUntil[s];
        a !== void 0 && a !== o.disableUntil && (e = e ?? {}, e[s] = !0, this._scheduleUntilFlashClear(s)), this._lastDisableUntil[s] = o.disableUntil;
      }
    e && (this._untilFlash = { ...this._untilFlash, ...e });
  }
  _scheduleUntilFlashClear(t) {
    setTimeout(() => {
      if (!this._untilFlash[t]) return;
      const { [t]: e, ...i } = this._untilFlash;
      this._untilFlash = i;
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
      this._userDisplayNames = _t(t);
    } catch (t) {
      console.warn("simple-chores-panel: failed to load user display names", t);
    }
  }
  _displayName(t) {
    return yt(t, this._userDisplayNames);
  }
  render() {
    if (!this.hass) return c;
    const t = pt(this.hass.states), e = he(this.hass.states), i = ut(this.hass.states), o = ht(this.hass.states), s = gt(this.hass.states), a = mt(this.hass.states), r = bt(t, e);
    return n`
      <div class="toolbar">
        <ha-icon icon="mdi:clipboard-check-outline"></ha-icon>
        <span class="toolbar-title">Chores</span>
        ${this._busy ? n`<ha-icon class="spin" icon="mdi:loading"></ha-icon>` : c}
      </div>

      <div class="content">
        ${this._error ? n`
              <div class="banner error">
                <span>${this._error}</span>
                <button class="icon-button" @click=${this._dismissError}>
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
              </div>
            ` : c}

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

        ${this._tab === "chores" ? this._renderChoresTab(t, i, r) : this._tab === "privileges" ? this._renderPrivilegesTab(e, t, r) : this._tab === "categories" ? this._renderCategoriesTab(i, r) : this._tab === "users" ? this._renderUsersTab(r, s, a) : this._tab === "history" ? this._renderHistoryTab(t, i, r) : this._renderSettingsTab(o, r)}
      </div>

      ${this._dialog ? this._renderDialog(t, i, r) : c}
      ${this._resetPointsDialog ? this._renderResetPointsDialog(r) : c}
      ${this._undoDialog ? this._renderUndoDialog() : c}
      ${this._startDialog ? this._renderStartDialog() : c}
    `;
  }
  // --- Chores tab ----------------------------------------------------
  _renderChoresTab(t, e, i) {
    const o = t.filter((r) => {
      if (this._categoryFilter) {
        if (this._categoryFilter === T) {
          if (r.category) return !1;
        } else if (r.category !== this._categoryFilter)
          return !1;
      }
      return !(this._bulkUser && !r.assignees.some((l) => l.assignee === this._bulkUser));
    }), s = this._sortChores(o, e), a = this._categoryFilter && this._categoryFilter !== T;
    return n`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreateChore}>
          <ha-icon icon="mdi:plus"></ha-icon> New chore
        </button>
        ${this._renderCategoryFilterPicker(e)}
        ${this._renderChoreSortPicker()}
        ${a ? n`
              <button
                title="Reset completed manual chores in this category to not requested, and count pending ones as missed"
                @click=${() => this._categoryAction(this._categoryFilter, "finalize_by_category")}
              >
                Finalize by category
              </button>
            ` : c}
        <div class="spacer"></div>
        ${this._renderBulkUserPicker(i)}
        <button @click=${() => this._resetCompleted()}>Reset completed</button>
        <button @click=${() => this._startNewDay()}>Start new day</button>
      </div>

      ${this._renderPointsSummary(o)}

      ${s.length === 0 ? n`<p class="empty">
            ${t.length === 0 ? "No chores yet. Create one to get started." : "No chores match the current filters."}
          </p>` : n`<div class="card-grid">
            ${s.map((r) => this._renderChoreCard(r, e))}
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
    return n`
      <select
        class="user-picker"
        title="Sort chores"
        .value=${this._choreSort}
        @change=${(e) => this._choreSort = e.target.value}
      >
        ${t.map((e) => n`<option value=${e.value}>${e.label}</option>`)}
      </select>
    `;
  }
  _sortChores(t, e) {
    const i = [...t], o = (s) => s ? e.find((a) => a.slug === s)?.name ?? s : "";
    switch (this._choreSort) {
      case "points":
        i.sort((s, a) => a.points - s.points || s.name.localeCompare(a.name));
        break;
      case "frequency":
        i.sort(
          (s, a) => s.frequency.localeCompare(a.frequency) || s.name.localeCompare(a.name)
        );
        break;
      case "category":
        i.sort(
          (s, a) => o(s.category).localeCompare(o(a.category)) || s.name.localeCompare(a.name)
        );
        break;
      case "name":
      default:
        i.sort((s, a) => s.name.localeCompare(a.name));
    }
    return i;
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
      for (const s of o.assignees)
        this._bulkUser && s.assignee !== this._bulkUser || e.set(s.assignee, (e.get(s.assignee) ?? 0) + s.points);
    if (e.size === 0) return c;
    const i = [...e.entries()].sort((o, s) => o[0].localeCompare(s[0]));
    return n`
      <div class="points-summary">
        <ha-icon icon="mdi:star-outline"></ha-icon>
        <span>Points possible:</span>
        ${i.map(
      ([o, s], a) => n`
            ${a > 0 ? n`<span class="points-summary-sep">·</span>` : c}
            <span
              ><strong>${this._displayName(o)}</strong> ${s}</span
            >
          `
    )}
      </div>
    `;
  }
  _renderCategoryFilterPicker(t) {
    return n`
      <select
        class="user-picker"
        title="Filter chores by category"
        .value=${this._categoryFilter}
        @change=${(e) => this._categoryFilter = e.target.value}
      >
        <option value="">All categories</option>
        <option value=${T}>Uncategorized</option>
        ${t.map(
      (e) => n`<option value=${e.slug}>${e.name}</option>`
    )}
      </select>
    `;
  }
  _renderBulkUserPicker(t) {
    return n`
      <select
        class="user-picker"
        title="Filter the chores shown below, and limit Reset completed / Start new day, to one assignee"
        .value=${this._bulkUser}
        @change=${(e) => this._bulkUser = e.target.value}
      >
        <option value="">All assignees</option>
        ${t.map(
      (e) => n`<option value=${e}>${this._displayName(e)}</option>`
    )}
      </select>
    `;
  }
  _renderChoreCard(t, e) {
    const i = t.assignees.some((a) => a.points !== t.points), o = `${t.points} point${t.points === 1 ? "" : "s"}${i ? " (default)" : ""}`, s = t.category ? e.find((a) => a.slug === t.category)?.name ?? t.category : null;
    return n`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${t.icon || D}></ha-icon>
          <div class="card-title">
            <div class="name">${t.name}</div>
            <div class="meta">
              ${t.frequency} · ${o}
              ${s ? n` · ${s}` : c}
              ${t.suggestedDuration ? n` · ~${at(t.suggestedDuration)}` : c}
              ${t.description ? n` · ${t.description}` : c}
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
      (a) => n`
                <div class="assignee-row ${a.state === "Active" ? "active-row" : ""}">
                  <span class="assignee-name">${this._displayName(a.assignee)}</span>
                  ${a.points !== t.points ? n`<span class="points-override-badge" title="Point override"
                        >${a.points}pt</span
                      >` : c}
                  <span class="state-chip ${this._choreStateClass(a.state)}"
                    >${a.state}</span
                  >
                  ${a.state === "Active" ? this._renderActivityClock(a) : c}
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
                      title=${a.state === "Active" ? "Restart timer" : "Start (mark active)"}
                      @click=${() => this._openStartDialog(t, a.assignee)}
                    >
                      <ha-icon icon="mdi:timer-play-outline"></ha-icon>
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
  _renderActivityClock(t) {
    const e = $t(t.activeSince, t.timerEndsAt, this._now);
    return e ? n`<span
      class="activity-clock ${e.overdue ? "overdue" : ""}"
      title=${t.activeSince ? `Started ${new Date(t.activeSince).toLocaleTimeString()}` : ""}
      ><ha-icon icon=${e.overdue ? "mdi:timer-alert-outline" : "mdi:timer-outline"}></ha-icon
      >${e.label}</span
    >` : c;
  }
  _choreStateClass(t) {
    return t === "Active" ? "state-active" : t === "Complete" ? "state-good" : t === "Pending" ? "state-warn" : "state-neutral";
  }
  // --- Privileges tab --------------------------------------------------
  _renderPrivilegesTab(t, e, i) {
    return n`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreatePrivilege}>
          <ha-icon icon="mdi:plus"></ha-icon> New privilege
        </button>
      </div>

      ${t.length === 0 ? n`<p class="empty">No privileges yet. Create one to get started.</p>` : n`<div class="card-grid">
            ${t.map((o) => this._renderPrivilegeCard(o, e, i))}
          </div>`}
    `;
  }
  _renderPrivilegeCard(t, e, i) {
    const o = t.linkedChores.map(
      (s) => e.find((a) => a.slug === s)?.name ?? s
    );
    return n`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${t.icon || E}></ha-icon>
          <div class="card-title">
            <div class="name">${t.name}</div>
            <div class="meta">
              ${t.behavior}
              ${o.length ? n` · linked: ${o.join(", ")}` : n` · linked: all requested chores`}
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
      const a = s.state === "Temporarily Disabled", r = this._disableReasonKey(t.slug, s.assignee);
      return n`
              <div class="assignee-row privilege-row">
                <div class="assignee-main">
                  <span class="assignee-name">${this._displayName(s.assignee)}</span>
                  <span class="state-chip ${this._privilegeStateClass(s.state)}">
                    ${s.state}${a && s.disableUntil ? n`<span
                          class="until-date ${this._untilFlash[r] ? "until-flash" : ""}"
                        >
                          (${this._formatUntil(s.disableUntil)})</span
                        >` : c}
                  </span>
                  ${t.behavior === "manual" ? n`
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
                      ` : c}
                </div>
                <div class="block-steppers">
                  <span class="block-steppers-label">Temporary block</span>
                  <input
                    type="text"
                    class="disable-reason-input"
                    placeholder="Reason (optional)"
                    .value=${this._disableReasonInput[r] ?? s.disableReason ?? ""}
                    @input=${(l) => {
        this._disableReasonInput = {
          ...this._disableReasonInput,
          [r]: l.target.value
        };
      }}
                    @keydown=${(l) => {
        l.key === "Enter" && l.target.blur();
      }}
                    @blur=${() => {
        a && this._saveDisableReason(
          t.slug,
          s.assignee,
          s.disableReason
        );
      }}
                  />
                  <div class="block-stepper-buttons">
                    ${this._renderBlockStepper(
        "1h",
        a,
        () => this._adjustTemporaryDisable(t.slug, s.assignee, -60),
        () => this._addTemporaryDisable(
          t.slug,
          s.assignee,
          a,
          60,
          r
        )
      )}
                    ${this._renderBlockStepper(
        "1d",
        a,
        () => this._adjustTemporaryDisable(
          t.slug,
          s.assignee,
          -1440
        ),
        () => this._addTemporaryDisable(
          t.slug,
          s.assignee,
          a,
          1440,
          r
        )
      )}
                    <button
                      class="action-chip"
                      title="Clear the block now"
                      ?disabled=${!a}
                      @click=${() => this._clearTemporaryDisable(t.slug, s.assignee)}
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
  _renderBlockStepper(t, e, i, o) {
    return n`
      <div class="stepper">
        <button
          title="Shorten the block by ${t}"
          ?disabled=${!e}
          @click=${i}
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
      const e = new Date(t), i = /* @__PURE__ */ new Date(), o = e.toDateString() === i.toDateString(), s = e.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
      return o ? `until ${s}` : `until ${e.toLocaleDateString()} ${s}`;
    } catch {
      return "";
    }
  }
  // --- Categories tab --------------------------------------------------
  _renderCategoriesTab(t, e) {
    return n`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreateCategory}>
          <ha-icon icon="mdi:plus"></ha-icon> New category
        </button>
        <div class="spacer"></div>
        ${this._renderBulkUserPicker(e)}
      </div>

      ${t.length === 0 ? n`<p class="empty">
            No categories yet. Create one, then assign it to chores.
          </p>` : n`<div class="card-grid">
            ${t.map((i) => this._renderCategoryCard(i))}
          </div>`}
    `;
  }
  _renderCategoryCard(t) {
    const e = `${t.choreCount} chore${t.choreCount === 1 ? "" : "s"}`;
    return n`
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
    const i = this._settingsDraft;
    return n`
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
            .checked=${i.autoFinalizeEnabled}
            @change=${(o) => {
      i.autoFinalizeEnabled = o.target.checked, this.requestUpdate();
    }}
          />
          Enable auto-finalize
        </label>

        <label>
          Delay (minutes)
          <input
            type="number"
            min="1"
            ?disabled=${!i.autoFinalizeEnabled}
            .value=${String(i.autoFinalizeDelayMinutes)}
            @input=${(o) => {
      i.autoFinalizeDelayMinutes = Number(o.target.value) || 1, this.requestUpdate();
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
            .value=${i.newDayTime}
            @input=${(o) => {
      i.newDayTime = o.target.value, this.requestUpdate();
    }}
          />
        </label>

        <label>
          New week day
          <select
            .value=${i.newWeekDay}
            @change=${(o) => {
      i.newWeekDay = o.target.value, this.requestUpdate();
    }}
          >
            ${it.map(
      (o) => n`<option value=${o} ?selected=${o === i.newWeekDay}>
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
            .value=${i.newWeekTime}
            @input=${(o) => {
      i.newWeekTime = o.target.value, this.requestUpdate();
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
    await this._call(u, "update_settings", {
      auto_finalize_enabled: t.autoFinalizeEnabled,
      auto_finalize_delay_minutes: t.autoFinalizeDelayMinutes,
      new_day_time: t.newDayTime,
      new_week_day: t.newWeekDay,
      new_week_time: t.newWeekTime
    }) && (this._settingsDraft = null);
  }
  _renderResetPointsDialog(t) {
    const e = this._resetPointsDialog;
    return e ? n`
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
                @change=${(i) => {
      e.user = i.target.value, this.requestUpdate();
    }}
              >
                <option value="">All users</option>
                ${t.map(
      (i) => n`<option value=${i}>${this._displayName(i)}</option>`
    )}
              </select>
            </label>
            <label class="checkbox-item">
              <input
                type="checkbox"
                .checked=${e.resetTotal}
                @change=${(i) => {
      e.resetTotal = i.target.checked, this.requestUpdate();
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
    ` : c;
  }
  async _confirmResetPoints() {
    const t = this._resetPointsDialog;
    if (!t) return;
    await this._call(u, "reset_points", {
      ...t.user ? { user: t.user } : {},
      reset_total: t.resetTotal
    }) && (this._resetPointsDialog = null);
  }
  // --- Users tab -----------------------------------------------------
  _renderUsersTab(t, e, i) {
    const o = new Map(e.map((a) => [a.assignee, a])), s = new Map(i.map((a) => [a.assignee, a]));
    return n`
      ${t.length === 0 ? n`<p class="empty">
            No assignees yet. Add one to a chore or privilege to get started.
          </p>` : n`<div class="card-grid">
            ${t.map(
      (a) => this._renderUserCard(a, o.get(a), s.get(a))
    )}
          </div>`}
    `;
  }
  _renderUserCard(t, e, i) {
    const o = e?.totalPoints ?? 0, s = e?.pointsEarned ?? 0, a = e?.pointsMissed ?? 0, r = e?.pointsPossible ?? 0;
    return n`
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
            <span class="points-stat-value">${s}</span>
            <span class="points-stat-label">earned today</span>
          </div>
          <div class="points-stat">
            <span class="points-stat-value">${a}</span>
            <span class="points-stat-label">missed</span>
          </div>
          <div class="points-stat">
            <span class="points-stat-value">${r}</span>
            <span class="points-stat-label">possible today</span>
          </div>
        </div>
        ${i ? n`
              <div class="user-goal-row">
                <span class="user-goal-label">Point goal</span>
                <input
                  type="number"
                  min="0"
                  class="user-goal-input"
                  .value=${String(i.value)}
                  @change=${(l) => this._setPointGoal(
      i.entityId,
      l.target.value
    )}
                />
              </div>
            ` : c}
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
    const i = Math.max(0, Math.round(Number(e) || 0));
    await this._call("number", "set_value", { entity_id: t, value: i });
  }
  async _applyPointsAdjustment(t) {
    const e = this._userAdjustInput[t], i = Number(e);
    if (!e || Number.isNaN(i) || i === 0) {
      this._error = "Enter a non-zero point adjustment first.";
      return;
    }
    const o = this._userAdjustReasonInput[t]?.trim();
    await this._call(u, "adjust_points", {
      user: t,
      adjustment: i,
      ...o ? { reason: o } : {}
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
        domain: u,
        service: "get_history",
        service_data: {},
        return_response: !0
      });
      this._historyEntries = vt(t?.response?.entries);
    } catch (t) {
      this._error = t instanceof Error ? t.message : String(t);
    } finally {
      this._historyLoading = !1;
    }
  }
  async _clearHistory() {
    if (!confirm("Permanently delete every chore history entry? This cannot be undone."))
      return;
    await this._call(u, "reset_history", {}) && (this._historyEntries = []);
  }
  _renderHistoryTab(t, e, i) {
    const o = this._historyEntries ?? [], a = [...o.filter((l) => {
      if (this._historyUserFilter && l.assignee !== this._historyUserFilter)
        return !1;
      if (this._historyCategoryFilter) {
        if (this._historyCategoryFilter === T) {
          if (l.category) return !1;
        } else if (l.category !== this._historyCategoryFilter)
          return !1;
      }
      return !(this._historyChoreFilter && l.choreSlug !== this._historyChoreFilter || this._historyActionFilter.length > 0 && !this._historyActionFilter.includes(l.action));
    })].sort((l, d) => d.timestamp.localeCompare(l.timestamp)), r = [...t].sort((l, d) => l.name.localeCompare(d.name));
    return n`
      <div class="actions-row">
        <select
          class="user-picker"
          title="Filter history by assignee"
          .value=${this._historyUserFilter}
          @change=${(l) => this._historyUserFilter = l.target.value}
        >
          <option value="">All assignees</option>
          ${i.map(
      (l) => n`<option value=${l}>${this._displayName(l)}</option>`
    )}
        </select>
        <select
          class="user-picker"
          title="Filter history by category"
          .value=${this._historyCategoryFilter}
          @change=${(l) => this._historyCategoryFilter = l.target.value}
        >
          <option value="">All categories</option>
          <option value=${T}>Uncategorized</option>
          ${e.map((l) => n`<option value=${l.slug}>${l.name}</option>`)}
        </select>
        <select
          class="user-picker"
          title="Filter history by chore"
          .value=${this._historyChoreFilter}
          @change=${(l) => this._historyChoreFilter = l.target.value}
        >
          <option value="">All chores</option>
          ${r.map((l) => n`<option value=${l.slug}>${l.name}</option>`)}
        </select>
        <div
          class="chip-toggle-group"
          role="group"
          aria-label="Filter history by event type"
        >
          ${ft.map((l) => {
      const d = this._historyActionFilter.includes(l);
      return n`
              <button
                type="button"
                class="chip-toggle ${me(l)} ${d ? "selected" : ""}"
                aria-pressed=${d}
                @click=${() => this._toggleHistoryActionFilter(l)}
              >
                ${ge(l)}
              </button>
            `;
    })}
        </div>
        <div class="spacer"></div>
        <button ?disabled=${this._historyLoading} @click=${() => this._loadHistory()}>
          ${this._historyLoading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      ${this._historyEntries === null ? n`<p class="empty">Loading history&hellip;</p>` : a.length === 0 ? n`<p class="empty">
              ${o.length === 0 ? "No chore history yet. Complete a chore to get started." : "No history entries match the current filters."}
            </p>` : n`
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
    const i = t.category ? e.find((r) => r.slug === t.category)?.name ?? t.category : null, o = t.pointsDelta > 0 ? "points-positive" : t.pointsDelta < 0 ? "points-negative" : "", s = t.pointsDelta > 0 ? `+${t.pointsDelta}` : t.pointsDelta, a = t.action === "completed" && !t.undone && !!this.hass.user?.is_admin;
    return n`
      <div class="history-row ${t.undone ? "history-row-undone" : ""}">
        <div class="history-cell history-time">
          ${this._formatHistoryTimestamp(t.timestamp)}
        </div>
        <div class="history-cell history-chore">
          <div class="name">${t.choreName}</div>
          ${i ? n`<div class="meta">${i}</div>` : c}
          ${t.reason ? n`<div class="meta">"${t.reason}"</div>` : c}
          ${t.penalty ? n`<div class="meta points-negative">Penalty: -${t.penalty}</div>` : c}
        </div>
        <div class="history-cell history-assignee">
          ${this._displayName(t.assignee)}
        </div>
        <div class="history-cell history-action">
          <span class="state-chip ${me(t.action)}">
            ${ge(t.action)}
          </span>
        </div>
        <div class="history-cell history-earned" title="Points balance after this entry">
          ${t.pointsTotal}
          ${t.pointsDelta !== 0 ? n`<div class="meta ${o}">${s}</div>` : c}
        </div>
        <div
          class="history-cell history-missed"
          title="Cumulative missed points after this entry"
        >
          ${t.missedTotal ?? "—"}
          ${t.pointsMissed > 0 ? n`<div class="meta points-negative">+${t.pointsMissed}</div>` : c}
        </div>
        <div class="history-cell history-undo">
          ${a ? n`
                <button
                  type="button"
                  class="action-chip history-undo-button"
                  title="Reverse this completion's points"
                  @click=${() => this._openUndoDialog(t)}
                >
                  <ha-icon icon="mdi:undo"></ha-icon>
                  <span>Undo</span>
                </button>
              ` : t.undone ? n`<span class="meta">Undone</span>` : n`<span class="meta">—</span>`}
        </div>
      </div>
    `;
  }
  _openStartDialog(t, e) {
    this._error = null, this._startDialog = {
      slug: t.slug,
      choreName: t.name,
      assignee: e,
      // Pre-fill the timer with the chore's suggested duration, if any.
      timerMinutes: t.suggestedDuration ? String(t.suggestedDuration) : ""
    };
  }
  _renderStartDialog() {
    const t = this._startDialog;
    if (!t) return c;
    const e = () => this._startDialog = null;
    return n`
      <div
        class="overlay"
        @click=${(i) => {
      i.target === i.currentTarget && e();
    }}
      >
        <div class="dialog" role="dialog" aria-modal="true">
          <div class="dialog-header">
            <h2>Start chore</h2>
            <button class="icon-button" @click=${e}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="dialog-body">
            <p class="hint">
              Marks "${t.choreName}" active for ${this._displayName(t.assignee)}.
              It stays outstanding until marked complete.
            </p>
            <label>
              Timer (minutes, optional)
              <input
                type="number"
                min="1"
                max="1440"
                placeholder="No timer"
                .value=${t.timerMinutes}
                @input=${(i) => {
      t.timerMinutes = i.target.value, this.requestUpdate();
    }}
                @keydown=${(i) => {
      i.key === "Enter" && this._confirmStart();
    }}
              />
            </label>
          </div>
          <div class="dialog-footer">
            <button @click=${e}>Cancel</button>
            <button class="primary" ?disabled=${this._busy} @click=${() => this._confirmStart()}>
              Start
            </button>
          </div>
        </div>
      </div>
    `;
  }
  async _confirmStart() {
    const t = this._startDialog;
    if (!t) return;
    const e = Math.floor(Number(t.timerMinutes)), i = {
      chore_slug: t.slug,
      user: t.assignee
    };
    t.timerMinutes.trim() && e > 0 && (i.timer_minutes = Math.min(e, 1440)), await this._call(u, "mark_active", i) && (this._startDialog = null);
  }
  _renderUndoDialog() {
    const t = this._undoDialog;
    if (!t) return c;
    const e = t.awarded + t.penalty;
    return n`
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
              clawing back the ${t.awarded} point(s) it awarded${t.penalty ? n` plus a ${t.penalty}-point penalty (${e} total)` : c}. This cannot be undone.
            </p>
            <label>
              Reason
              <input
                type="text"
                placeholder="Why is this being undone?"
                .value=${t.reason}
                @input=${(i) => {
      t.reason = i.target.value, this.requestUpdate();
    }}
              />
            </label>
            <label>
              Penalty (extra points to withhold)
              <input
                type="number"
                min="0"
                .value=${String(t.penalty)}
                @input=${(i) => {
      t.penalty = Math.max(
        0,
        Number(i.target.value) || 0
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
    await this._call(u, "undo_completion", {
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
  _renderDialog(t, e, i) {
    if (!this._dialog) return c;
    const o = this._dialog.kind, s = this._dialog.original ? "Edit" : "New", a = o === "chore" ? "chore" : o === "privilege" ? "privilege" : "category";
    return n`
      <div class="overlay" @click=${this._onOverlayClick}>
        <div class="dialog" role="dialog" aria-modal="true">
          <div class="dialog-header">
            <h2>${s} ${a}</h2>
            <button class="icon-button" @click=${this._closeDialog}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="dialog-body">
            ${o === "chore" ? this._renderChoreForm(e, i) : o === "privilege" ? this._renderPrivilegeForm(t, i) : this._renderCategoryForm()}
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
    const i = this._dialog.draft, o = !!this._dialog.original, s = x(i.slug || i.name), a = o && s && s !== this._dialog.original;
    return n`
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
        ${a ? n`<span class="hint">Will be renamed to "${s}"</span>` : o ? c : n`<span class="hint">Will be saved as "${s}"</span>`}
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
            ${et.map(
      (r) => n`<option value=${r}>${r}</option>`
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
        Suggested duration (minutes, optional)
        <input
          type="number"
          min="1"
          max=${String(Ae)}
          placeholder="None"
          .value=${i.suggestedDuration}
          @input=${(r) => {
      i.suggestedDuration = r.target.value, this.requestUpdate();
    }}
        />
      </label>

      <label>
        Category
        <select
          .value=${i.category}
          @change=${(r) => {
      i.category = r.target.value, this.requestUpdate();
    }}
        >
          <option value=${te}>Uncategorized</option>
          ${t.map(
      (r) => n`<option value=${r.slug}>${r.name}</option>`
    )}
        </select>
      </label>

      ${this._renderIconField(i.icon, D, (r) => {
      i.icon = r, this.requestUpdate();
    })}

      ${this._renderAssigneeEditor(i, e)}
      ${this._renderPointsByAssigneeEditor(i)}
    `;
  }
  /**
   * Per-assignee point override inputs, one row per currently-listed
   * assignee. An input left matching the shared "Points" field above
   * follows it automatically; typing a different value overrides it just
   * for that assignee (see ChoreDraft.pointsByAssignee).
   */
  _renderPointsByAssigneeEditor(t) {
    return t.assignees.length === 0 ? c : n`
      <label>
        Points per assignee
        <span class="hint"
          >Leave matching the default above to use it; change a value to
          reward that assignee differently for this chore.</span
        >
        <div class="points-override-list">
          ${t.assignees.map((e) => {
      const i = t.pointsByAssignee[e] ?? t.points;
      return n`
              <div class="points-override-row">
                <span class="points-override-name">${this._displayName(e)}</span>
                <input
                  type="number"
                  min="0"
                  class="points-override-input"
                  .value=${String(i)}
                  @input=${(o) => {
        const s = Number(o.target.value) || 0, a = { ...t.pointsByAssignee };
        s === t.points ? delete a[e] : a[e] = s, t.pointsByAssignee = a, this.requestUpdate();
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
    const i = this._dialog.draft, o = !!this._dialog.original, s = x(i.slug || i.name), a = o && s && s !== this._dialog.original;
    return n`
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
        ${a ? n`<span class="hint">Will be renamed to "${s}"</span>` : o ? c : n`<span class="hint">Will be saved as "${s}"</span>`}
      </label>

      <label>
        Behavior
        <select
          .value=${i.behavior}
          @change=${(r) => {
      i.behavior = r.target.value, this.requestUpdate();
    }}
        >
          ${tt.map(
      (r) => n`<option value=${r}>${r}</option>`
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
          ${t.length === 0 ? n`<span class="hint">No chores defined yet.</span>` : t.map(
      (r) => n`
                  <label class="checkbox-item">
                    <input
                      type="checkbox"
                      .checked=${i.linkedChores.includes(r.slug)}
                      @change=${(l) => {
        const d = l.target.checked;
        i.linkedChores = d ? [...i.linkedChores, r.slug] : i.linkedChores.filter((b) => b !== r.slug), this.requestUpdate();
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
    const t = this._dialog.draft, e = !!this._dialog.original, i = x(t.slug || t.name), o = e && i && i !== this._dialog.original;
    return n`
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
        ${o ? n`<span class="hint">Will be renamed to "${i}"</span>` : e ? c : n`<span class="hint">Will be saved as "${i}"</span>`}
      </label>

      ${this._renderIconField(t.icon, S, (s) => {
      t.icon = s, this.requestUpdate();
    })}
    `;
  }
  _renderIconField(t, e, i) {
    return n`
      <label>
        Icon
        <div class="icon-field">
          <ha-icon .icon=${t || e}></ha-icon>
          <input
            type="text"
            .value=${t}
            placeholder=${e}
            @input=${(o) => i(o.target.value)}
          />
        </div>
      </label>
    `;
  }
  _renderAssigneeEditor(t, e) {
    return n`
      <label>
        Assignees
        <div class="chip-list">
          ${t.assignees.map(
      (i) => n`
              <span class="chip">
                ${this._displayName(i)}
                <button
                  class="chip-remove"
                  @click=${() => {
        t.assignees = t.assignees.filter((o) => o !== i), this.requestUpdate();
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
      (i) => n`<option value=${i} label=${this._displayName(i)}></option>`
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
      draft: rt(t)
    };
  }
  _openEditPrivilege(t) {
    this._error = null, this._dialog = {
      kind: "privilege",
      original: t.slug,
      draft: dt(t)
    };
  }
  _openEditCategory(t) {
    this._error = null, this._dialog = {
      kind: "category",
      original: t.slug,
      draft: lt(t)
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
    } catch (o) {
      return this._error = o instanceof Error ? o.message : String(o), !1;
    } finally {
      this._busy = !1;
    }
  }
  _markChore(t, e, i) {
    return this._call(u, i, { chore_slug: t, user: e });
  }
  /**
   * Immediately finalize one completed chore for one assignee - the same
   * reset auto-finalize performs after its delay, triggered on demand.
   */
  _finalizeOne(t, e) {
    return this._call(u, "finalize_one", { chore_slug: t, user: e });
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
  async _addTemporaryDisable(t, e, i, o, s) {
    const a = this._pendingReason(s);
    if (await this._call(
      u,
      i ? "adjust_temporary_disable" : "temporarily_disable_privilege",
      {
        user: e,
        privilege_slug: t,
        ...i ? { adjustment: o } : { duration: o },
        ...a !== void 0 ? { reason: a } : {}
      }
    ) && a !== void 0) {
      const { [s]: l, ...d } = this._disableReasonInput;
      this._disableReasonInput = d;
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
  async _adjustTemporaryDisable(t, e, i) {
    const o = this._disableReasonKey(t, e), s = this._pendingReason(o);
    if (await this._call(u, "adjust_temporary_disable", {
      user: e,
      privilege_slug: t,
      adjustment: i,
      ...s !== void 0 ? { reason: s } : {}
    }) && s !== void 0) {
      const { [o]: r, ...l } = this._disableReasonInput;
      this._disableReasonInput = l;
    }
  }
  /**
   * Save an edited reason on an already-blocked privilege without changing
   * its duration, via a zero-minute `adjust_temporary_disable` adjustment.
   * Fired on blur/Enter so editing the reason text doesn't require also
   * touching a stepper. No-ops if the field wasn't actually changed.
   */
  async _saveDisableReason(t, e, i) {
    const o = this._disableReasonKey(t, e), s = this._pendingReason(o);
    if (s === void 0 || s === (i ?? "")) return;
    if (await this._call(u, "adjust_temporary_disable", {
      user: e,
      privilege_slug: t,
      adjustment: 0,
      reason: s
    })) {
      const { [o]: r, ...l } = this._disableReasonInput;
      this._disableReasonInput = l;
    }
  }
  /**
   * End a temporary block immediately, via `clear_temporary_disable`. The
   * privilege is restored to what it was right before the block (or
   * recomputed from linked chores, for automatic-behavior privileges).
   */
  async _clearTemporaryDisable(t, e) {
    if (await this._call(u, "clear_temporary_disable", {
      user: e,
      privilege_slug: t
    })) {
      const o = this._disableReasonKey(t, e), { [o]: s, ...a } = this._disableReasonInput;
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
    const i = e.assignees.join(","), o = Object.entries(e.pointsByAssignee).filter(([r]) => e.assignees.includes(r)).map(([r, l]) => `${r}:${l}`).join(","), s = ot(e.suggestedDuration);
    (t.original ? await this._call(u, "update_chore", {
      slug: t.original,
      name: e.name,
      description: e.description,
      frequency: e.frequency,
      assignees: i,
      icon: e.icon || D,
      points: e.points,
      points_by_assignee: o,
      category: e.category,
      suggested_duration: s,
      ...this._renameField(t.original, e.slug || e.name)
    }) : await this._call(u, "create_chore", {
      name: e.name,
      slug: x(e.slug || e.name),
      description: e.description,
      frequency: e.frequency,
      assignees: i,
      icon: e.icon || D,
      points: e.points,
      points_by_assignee: o,
      category: e.category,
      suggested_duration: s
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
    const i = e.assignees.join(","), o = e.linkedChores.join(",");
    (t.original ? await this._call(u, "update_privilege", {
      slug: t.original,
      name: e.name,
      icon: e.icon || E,
      behavior: e.behavior,
      linked_chores: o,
      assignees: i,
      ...this._renameField(t.original, e.slug || e.name)
    }) : await this._call(u, "create_privilege", {
      name: e.name,
      slug: x(e.slug || e.name),
      icon: e.icon || E,
      behavior: e.behavior,
      linked_chores: o,
      assignees: i
    })) && (this._dialog = null);
  }
};
p.styles = De`
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
    .assignee-row.active-row {
      margin: 0 -8px;
      padding: 8px;
      border-radius: 8px;
      background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.1);
      box-shadow: inset 3px 0 0 var(--primary-color, #03a9f4);
    }
    .activity-clock {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
      color: var(--primary-color, #03a9f4);
    }
    .activity-clock ha-icon {
      --mdc-icon-size: 16px;
    }
    .activity-clock.overdue {
      color: var(--error-color, #db4437);
      font-weight: 500;
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
    .state-active {
      background: var(--primary-color, #03a9f4);
      color: var(--text-primary-color, #fff);
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
h([
  ee({ attribute: !1 })
], p.prototype, "hass", 2);
h([
  ee({ type: Boolean })
], p.prototype, "narrow", 2);
h([
  m()
], p.prototype, "_tab", 2);
h([
  m()
], p.prototype, "_dialog", 2);
h([
  m()
], p.prototype, "_busy", 2);
h([
  m()
], p.prototype, "_error", 2);
h([
  m()
], p.prototype, "_bulkUser", 2);
h([
  m()
], p.prototype, "_categoryFilter", 2);
h([
  m()
], p.prototype, "_choreSort", 2);
h([
  m()
], p.prototype, "_userDisplayNames", 2);
h([
  m()
], p.prototype, "_settingsDraft", 2);
h([
  m()
], p.prototype, "_resetPointsDialog", 2);
h([
  m()
], p.prototype, "_undoDialog", 2);
h([
  m()
], p.prototype, "_startDialog", 2);
h([
  m()
], p.prototype, "_now", 2);
h([
  m()
], p.prototype, "_userAdjustInput", 2);
h([
  m()
], p.prototype, "_userAdjustReasonInput", 2);
h([
  m()
], p.prototype, "_disableReasonInput", 2);
h([
  m()
], p.prototype, "_untilFlash", 2);
h([
  m()
], p.prototype, "_historyEntries", 2);
h([
  m()
], p.prototype, "_historyLoading", 2);
h([
  m()
], p.prototype, "_historyUserFilter", 2);
h([
  m()
], p.prototype, "_historyCategoryFilter", 2);
h([
  m()
], p.prototype, "_historyChoreFilter", 2);
h([
  m()
], p.prototype, "_historyActionFilter", 2);
p = h([
  Ze("simple-chores-panel")
], p);
