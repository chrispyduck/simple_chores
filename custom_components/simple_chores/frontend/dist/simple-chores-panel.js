/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const F = globalThis, G = F.ShadowRoot && (F.ShadyCSS === void 0 || F.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Y = Symbol(), te = /* @__PURE__ */ new WeakMap();
let ue = class {
  constructor(e, s, i) {
    if (this._$cssResult$ = !0, i !== Y) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = s;
  }
  get styleSheet() {
    let e = this.o;
    const s = this.t;
    if (G && e === void 0) {
      const i = s !== void 0 && s.length === 1;
      i && (e = te.get(s)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && te.set(s, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const $e = (t) => new ue(typeof t == "string" ? t : t + "", void 0, Y), xe = (t, ...e) => {
  const s = t.length === 1 ? t[0] : e.reduce((i, o, n) => i + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(o) + t[n + 1], t[0]);
  return new ue(s, t, Y);
}, ke = (t, e) => {
  if (G) t.adoptedStyleSheets = e.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  else for (const s of e) {
    const i = document.createElement("style"), o = F.litNonce;
    o !== void 0 && i.setAttribute("nonce", o), i.textContent = s.cssText, t.appendChild(i);
  }
}, se = G ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let s = "";
  for (const i of e.cssRules) s += i.cssText;
  return $e(s);
})(t) : t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: we, defineProperty: Ae, getOwnPropertyDescriptor: Ce, getOwnPropertyNames: Ee, getOwnPropertySymbols: Se, getPrototypeOf: Pe } = Object, H = globalThis, ie = H.trustedTypes, De = ie ? ie.emptyScript : "", Ue = H.reactiveElementPolyfillSupport, z = (t, e) => t, I = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? De : null;
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
} }, Z = (t, e) => !we(t, e), oe = { attribute: !0, type: String, converter: I, reflect: !1, useDefault: !1, hasChanged: Z };
Symbol.metadata ??= Symbol("metadata"), H.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
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
      o !== void 0 && Ae(this.prototype, e, o);
    }
  }
  static getPropertyDescriptor(e, s, i) {
    const { get: o, set: n } = Ce(this.prototype, e) ?? { get() {
      return this[s];
    }, set(a) {
      this[s] = a;
    } };
    return { get: o, set(a) {
      const d = o?.call(this);
      n?.call(this, a), this.requestUpdate(e, d, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? oe;
  }
  static _$Ei() {
    if (this.hasOwnProperty(z("elementProperties"))) return;
    const e = Pe(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(z("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(z("properties"))) {
      const s = this.properties, i = [...Ee(s), ...Se(s)];
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
    return ke(e, this.constructor.elementStyles), e;
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
      const n = (i.converter?.toAttribute !== void 0 ? i.converter : I).toAttribute(s, i.type);
      this._$Em = e, n == null ? this.removeAttribute(o) : this.setAttribute(o, n), this._$Em = null;
    }
  }
  _$AK(e, s) {
    const i = this.constructor, o = i._$Eh.get(e);
    if (o !== void 0 && this._$Em !== o) {
      const n = i.getPropertyOptions(o), a = typeof n.converter == "function" ? { fromAttribute: n.converter } : n.converter?.fromAttribute !== void 0 ? n.converter : I;
      this._$Em = o;
      const d = a.fromAttribute(s, n.type);
      this[o] = d ?? this._$Ej?.get(o) ?? d, this._$Em = null;
    }
  }
  requestUpdate(e, s, i, o = !1, n) {
    if (e !== void 0) {
      const a = this.constructor;
      if (o === !1 && (n = this[e]), i ??= a.getPropertyOptions(e), !((i.hasChanged ?? Z)(n, s) || i.useDefault && i.reflect && n === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, i)))) return;
      this.C(e, s, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, s, { useDefault: i, reflect: o, wrapped: n }, a) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? s ?? this[e]), n !== !0 || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (s = void 0), this._$AL.set(e, s)), o === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
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
        for (const [o, n] of this._$Ep) this[o] = n;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [o, n] of i) {
        const { wrapped: a } = n, d = this[o];
        a !== !0 || this._$AL.has(o) || d === void 0 || this.C(o, void 0, n, d);
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
A.elementStyles = [], A.shadowRootOptions = { mode: "open" }, A[z("elementProperties")] = /* @__PURE__ */ new Map(), A[z("finalized")] = /* @__PURE__ */ new Map(), Ue?.({ ReactiveElement: A }), (H.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const K = globalThis, ne = (t) => t, M = K.trustedTypes, ae = M ? M.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, he = "$lit$", y = `lit$${Math.random().toFixed(9).slice(2)}$`, ge = "?" + y, ze = `<${ge}>`, w = document, T = () => w.createComment(""), R = (t) => t === null || typeof t != "object" && typeof t != "function", X = Array.isArray, Ne = (t) => X(t) || typeof t?.[Symbol.iterator] == "function", L = `[ 	
\f\r]`, U = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, re = /-->/g, le = />/g, $ = RegExp(`>|${L}(?:([^\\s"'>=/]+)(${L}*=${L}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ce = /'/g, de = /"/g, me = /^(?:script|style|textarea|title)$/i, Te = (t) => (e, ...s) => ({ _$litType$: t, strings: e, values: s }), r = Te(1), P = Symbol.for("lit-noChange"), c = Symbol.for("lit-nothing"), pe = /* @__PURE__ */ new WeakMap(), k = w.createTreeWalker(w, 129);
function be(t, e) {
  if (!X(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ae !== void 0 ? ae.createHTML(e) : e;
}
const Re = (t, e) => {
  const s = t.length - 1, i = [];
  let o, n = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", a = U;
  for (let d = 0; d < s; d++) {
    const l = t[d];
    let h, g, p = -1, f = 0;
    for (; f < l.length && (a.lastIndex = f, g = a.exec(l), g !== null); ) f = a.lastIndex, a === U ? g[1] === "!--" ? a = re : g[1] !== void 0 ? a = le : g[2] !== void 0 ? (me.test(g[2]) && (o = RegExp("</" + g[2], "g")), a = $) : g[3] !== void 0 && (a = $) : a === $ ? g[0] === ">" ? (a = o ?? U, p = -1) : g[1] === void 0 ? p = -2 : (p = a.lastIndex - g[2].length, h = g[1], a = g[3] === void 0 ? $ : g[3] === '"' ? de : ce) : a === de || a === ce ? a = $ : a === re || a === le ? a = U : (a = $, o = void 0);
    const v = a === $ && t[d + 1].startsWith("/>") ? " " : "";
    n += a === U ? l + ze : p >= 0 ? (i.push(h), l.slice(0, p) + he + l.slice(p) + y + v) : l + y + (p === -2 ? d : v);
  }
  return [be(t, n + (t[s] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class O {
  constructor({ strings: e, _$litType$: s }, i) {
    let o;
    this.parts = [];
    let n = 0, a = 0;
    const d = e.length - 1, l = this.parts, [h, g] = Re(e, s);
    if (this.el = O.createElement(h, i), k.currentNode = this.el.content, s === 2 || s === 3) {
      const p = this.el.content.firstChild;
      p.replaceWith(...p.childNodes);
    }
    for (; (o = k.nextNode()) !== null && l.length < d; ) {
      if (o.nodeType === 1) {
        if (o.hasAttributes()) for (const p of o.getAttributeNames()) if (p.endsWith(he)) {
          const f = g[a++], v = o.getAttribute(p).split(y), q = /([.?@])?(.*)/.exec(f);
          l.push({ type: 1, index: n, name: q[2], strings: v, ctor: q[1] === "." ? je : q[1] === "?" ? qe : q[1] === "@" ? Fe : B }), o.removeAttribute(p);
        } else p.startsWith(y) && (l.push({ type: 6, index: n }), o.removeAttribute(p));
        if (me.test(o.tagName)) {
          const p = o.textContent.split(y), f = p.length - 1;
          if (f > 0) {
            o.textContent = M ? M.emptyScript : "";
            for (let v = 0; v < f; v++) o.append(p[v], T()), k.nextNode(), l.push({ type: 2, index: ++n });
            o.append(p[f], T());
          }
        }
      } else if (o.nodeType === 8) if (o.data === ge) l.push({ type: 2, index: n });
      else {
        let p = -1;
        for (; (p = o.data.indexOf(y, p + 1)) !== -1; ) l.push({ type: 7, index: n }), p += y.length - 1;
      }
      n++;
    }
  }
  static createElement(e, s) {
    const i = w.createElement("template");
    return i.innerHTML = e, i;
  }
}
function D(t, e, s = t, i) {
  if (e === P) return e;
  let o = i !== void 0 ? s._$Co?.[i] : s._$Cl;
  const n = R(e) ? void 0 : e._$litDirective$;
  return o?.constructor !== n && (o?._$AO?.(!1), n === void 0 ? o = void 0 : (o = new n(t), o._$AT(t, s, i)), i !== void 0 ? (s._$Co ??= [])[i] = o : s._$Cl = o), o !== void 0 && (e = D(t, o._$AS(t, e.values), o, i)), e;
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
    const { el: { content: s }, parts: i } = this._$AD, o = (e?.creationScope ?? w).importNode(s, !0);
    k.currentNode = o;
    let n = k.nextNode(), a = 0, d = 0, l = i[0];
    for (; l !== void 0; ) {
      if (a === l.index) {
        let h;
        l.type === 2 ? h = new j(n, n.nextSibling, this, e) : l.type === 1 ? h = new l.ctor(n, l.name, l.strings, this, e) : l.type === 6 && (h = new Ie(n, this, e)), this._$AV.push(h), l = i[++d];
      }
      a !== l?.index && (n = k.nextNode(), a++);
    }
    return k.currentNode = w, o;
  }
  p(e) {
    let s = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, s), s += i.strings.length - 2) : i._$AI(e[s])), s++;
  }
}
class j {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, s, i, o) {
    this.type = 2, this._$AH = c, this._$AN = void 0, this._$AA = e, this._$AB = s, this._$AM = i, this.options = o, this._$Cv = o?.isConnected ?? !0;
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
    e = D(this, e, s), R(e) ? e === c || e == null || e === "" ? (this._$AH !== c && this._$AR(), this._$AH = c) : e !== this._$AH && e !== P && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Ne(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== c && R(this._$AH) ? this._$AA.nextSibling.data = e : this.T(w.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: s, _$litType$: i } = e, o = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = O.createElement(be(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === o) this._$AH.p(s);
    else {
      const n = new Oe(o, this), a = n.u(this.options);
      n.p(s), this.T(a), this._$AH = n;
    }
  }
  _$AC(e) {
    let s = pe.get(e.strings);
    return s === void 0 && pe.set(e.strings, s = new O(e)), s;
  }
  k(e) {
    X(this._$AH) || (this._$AH = [], this._$AR());
    const s = this._$AH;
    let i, o = 0;
    for (const n of e) o === s.length ? s.push(i = new j(this.O(T()), this.O(T()), this, this.options)) : i = s[o], i._$AI(n), o++;
    o < s.length && (this._$AR(i && i._$AB.nextSibling, o), s.length = o);
  }
  _$AR(e = this._$AA.nextSibling, s) {
    for (this._$AP?.(!1, !0, s); e !== this._$AB; ) {
      const i = ne(e).nextSibling;
      ne(e).remove(), e = i;
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
  constructor(e, s, i, o, n) {
    this.type = 1, this._$AH = c, this._$AN = void 0, this.element = e, this.name = s, this._$AM = o, this.options = n, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = c;
  }
  _$AI(e, s = this, i, o) {
    const n = this.strings;
    let a = !1;
    if (n === void 0) e = D(this, e, s, 0), a = !R(e) || e !== this._$AH && e !== P, a && (this._$AH = e);
    else {
      const d = e;
      let l, h;
      for (e = n[0], l = 0; l < n.length - 1; l++) h = D(this, d[i + l], s, l), h === P && (h = this._$AH[l]), a ||= !R(h) || h !== this._$AH[l], h === c ? e = c : e !== c && (e += (h ?? "") + n[l + 1]), this._$AH[l] = h;
    }
    a && !o && this.j(e);
  }
  j(e) {
    e === c ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class je extends B {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === c ? void 0 : e;
  }
}
class qe extends B {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== c);
  }
}
class Fe extends B {
  constructor(e, s, i, o, n) {
    super(e, s, i, o, n), this.type = 5;
  }
  _$AI(e, s = this) {
    if ((e = D(this, e, s, 0) ?? c) === P) return;
    const i = this._$AH, o = e === c && i !== c || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, n = e !== c && (i === c || o);
    o && this.element.removeEventListener(this.name, this, i), n && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Ie {
  constructor(e, s, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = s, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    D(this, e);
  }
}
const Me = K.litHtmlPolyfillSupport;
Me?.(O, j), (K.litHtmlVersions ??= []).push("3.3.3");
const He = (t, e, s) => {
  const i = s?.renderBefore ?? e;
  let o = i._$litPart$;
  if (o === void 0) {
    const n = s?.renderBefore ?? null;
    i._$litPart$ = o = new j(e.insertBefore(T(), n), n, void 0, s ?? {});
  }
  return o._$AI(t), o;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const J = globalThis;
class N extends A {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const s = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = He(s, this.renderRoot, this.renderOptions);
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
N._$litElement$ = !0, N.finalized = !0, J.litElementHydrateSupport?.({ LitElement: N });
const Be = J.litElementPolyfillSupport;
Be?.({ LitElement: N });
(J.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Le = (t) => (e, s) => {
  s !== void 0 ? s.addInitializer(() => {
    customElements.define(t, e);
  }) : customElements.define(t, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const We = { attribute: !0, type: String, converter: I, reflect: !1, hasChanged: Z }, Ve = (t = We, e, s) => {
  const { kind: i, metadata: o } = s;
  let n = globalThis.litPropertyMetadata.get(o);
  if (n === void 0 && globalThis.litPropertyMetadata.set(o, n = /* @__PURE__ */ new Map()), i === "setter" && ((t = Object.create(t)).wrapped = !0), n.set(s.name, t), i === "accessor") {
    const { name: a } = s;
    return { set(d) {
      const l = e.get.call(this);
      e.set.call(this, d), this.requestUpdate(a, l, t, !0, d);
    }, init(d) {
      return d !== void 0 && this.C(a, void 0, t, d), d;
    } };
  }
  if (i === "setter") {
    const { name: a } = s;
    return function(d) {
      const l = this[a];
      e.call(this, d), this.requestUpdate(a, l, t, !0, d);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function Q(t) {
  return (e, s) => typeof s == "object" ? Ve(t, e, s) : ((i, o, n) => {
    const a = o.hasOwnProperty(n);
    return o.constructor.createProperty(n, i), a ? Object.getOwnPropertyDescriptor(o, n) : void 0;
  })(t, e, s);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function _(t) {
  return Q({ ...t, state: !0, attribute: !1 });
}
const Ge = "sensor.simple_chore_", _e = "sensor.simple_chore_privilege_", fe = "sensor.simple_chore_meta_", ve = "sensor.simple_chore_category_", ye = "sensor.simple_chore_meta_settings", Ye = ["daily", "manual", "once"], Ze = ["automatic", "manual"], C = "mdi:clipboard-list-outline", E = "mdi:star", S = "mdi:tag-outline", ee = "";
function Ke() {
  return {
    slug: "",
    name: "",
    description: "",
    frequency: "daily",
    icon: C,
    points: 1,
    pointsByAssignee: {},
    category: ee,
    assignees: []
  };
}
function Xe(t) {
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
function st(t) {
  const e = /* @__PURE__ */ new Map();
  for (const [s, i] of Object.entries(t)) {
    if (!s.startsWith(Ge) || s.startsWith(_e) || s.startsWith(fe) || s.startsWith(ve)) continue;
    const o = i.attributes, n = o.chore_slug;
    if (!n) continue;
    let a = e.get(n);
    a || (a = {
      slug: n,
      name: o.chore_name ?? n,
      description: o.description ?? "",
      frequency: o.frequency ?? "daily",
      icon: o.icon ?? C,
      // default_points is the chore's shared value; older/unrefreshed
      // sensors may not have it yet, so fall back to this assignee's
      // resolved points rather than leaving the definition unset.
      points: o.default_points ?? o.points ?? 0,
      category: o.category ?? null,
      assignees: []
    }, e.set(n, a)), a.assignees.push({
      assignee: o.assignee,
      entityId: s,
      state: i.state,
      points: o.points ?? a.points
    });
  }
  for (const s of e.values())
    s.assignees.sort((i, o) => i.assignee.localeCompare(o.assignee));
  return [...e.values()].sort((s, i) => s.name.localeCompare(i.name));
}
function it(t) {
  const e = /* @__PURE__ */ new Map();
  for (const [s, i] of Object.entries(t)) {
    if (!s.startsWith(_e)) continue;
    const o = i.attributes, n = o.privilege_slug;
    if (!n) continue;
    let a = e.get(n);
    a || (a = {
      slug: n,
      name: o.privilege_name ?? n,
      icon: o.icon ?? E,
      behavior: o.behavior ?? "automatic",
      linkedChores: o.linked_chores ?? [],
      assignees: []
    }, e.set(n, a)), a.assignees.push({
      assignee: o.assignee,
      entityId: s,
      state: i.state,
      disableUntil: o.disable_until
    });
  }
  for (const s of e.values())
    s.assignees.sort((i, o) => i.assignee.localeCompare(o.assignee));
  return [...e.values()].sort((s, i) => s.name.localeCompare(i.name));
}
function ot(t) {
  const e = [];
  for (const [s, i] of Object.entries(t)) {
    if (!s.startsWith(ve)) continue;
    const o = i.attributes, n = o.category_slug;
    n && e.push({
      slug: n,
      name: o.category_name ?? n,
      icon: o.icon ?? S,
      entityId: s,
      choreCount: Number(i.state) || 0
    });
  }
  return e.sort((s, i) => s.name.localeCompare(i.name));
}
const W = {
  autoFinalizeEnabled: !0,
  autoFinalizeDelayMinutes: 60
};
function nt(t) {
  const e = t[ye];
  if (!e) return { ...W };
  const s = e.attributes;
  return {
    autoFinalizeEnabled: s.auto_finalize_enabled ?? W.autoFinalizeEnabled,
    autoFinalizeDelayMinutes: s.auto_finalize_delay_minutes ?? W.autoFinalizeDelayMinutes
  };
}
function at(t) {
  const e = [];
  for (const [s, i] of Object.entries(t)) {
    if (!s.startsWith(fe) || s === ye) continue;
    const o = i.attributes, n = o.assignee;
    n && e.push({
      assignee: n,
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
function rt(t, e) {
  const s = /* @__PURE__ */ new Set();
  for (const i of t)
    for (const o of i.assignees) s.add(o.assignee);
  for (const i of e)
    for (const o of i.assignees) s.add(o.assignee);
  return [...s].sort((i, o) => i.localeCompare(o));
}
function lt(t) {
  const e = {};
  for (const s of t)
    s.username && (e[s.username.toLowerCase()] = s.name);
  return e;
}
function ct(t, e) {
  return e[t.toLowerCase()] ?? t;
}
var dt = Object.defineProperty, pt = Object.getOwnPropertyDescriptor, b = (t, e, s, i) => {
  for (var o = i > 1 ? void 0 : i ? pt(e, s) : e, n = t.length - 1, a; n >= 0; n--)
    (a = t[n]) && (o = (i ? a(e, s, o) : a(o)) || o);
  return i && o && dt(e, s, o), o;
};
const u = "simple_chores", V = "__uncategorized__";
let m = class extends N {
  constructor() {
    super(...arguments), this.narrow = !1, this._tab = "chores", this._dialog = null, this._busy = !1, this._error = null, this._bulkUser = "", this._categoryFilter = "", this._choreSort = "name", this._userDisplayNames = {}, this._settingsDraft = null, this._resetPointsDialog = null, this._userAdjustInput = {}, this._loadedUserDisplayNames = !1, this._openResetPointsDialog = (t) => {
      this._error = null, this._resetPointsDialog = {
        user: t.length === 1 ? t[0] : "",
        resetTotal: !1
      };
    }, this._onResetPointsOverlayClick = (t) => {
      t.target === t.currentTarget && (this._resetPointsDialog = null);
    }, this._onOverlayClick = (t) => {
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
      this._userDisplayNames = lt(t);
    } catch (t) {
      console.warn("simple-chores-panel: failed to load user display names", t);
    }
  }
  _displayName(t) {
    return ct(t, this._userDisplayNames);
  }
  render() {
    if (!this.hass) return c;
    const t = st(this.hass.states), e = it(this.hass.states), s = ot(this.hass.states), i = nt(this.hass.states), o = at(this.hass.states), n = rt(t, e);
    return r`
      <div class="toolbar">
        <ha-icon icon="mdi:clipboard-check-outline"></ha-icon>
        <span class="toolbar-title">Chores</span>
        ${this._busy ? r`<ha-icon class="spin" icon="mdi:loading"></ha-icon>` : c}
      </div>

      <div class="content">
        ${this._error ? r`
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
            class="tab ${this._tab === "settings" ? "active" : ""}"
            @click=${() => this._tab = "settings"}
          >
            Settings
          </button>
        </div>

        ${this._tab === "chores" ? this._renderChoresTab(t, s, n) : this._tab === "privileges" ? this._renderPrivilegesTab(e, t, n) : this._tab === "categories" ? this._renderCategoriesTab(s, n) : this._tab === "users" ? this._renderUsersTab(n, o) : this._renderSettingsTab(i, n)}
      </div>

      ${this._dialog ? this._renderDialog(t, s, n) : c}
      ${this._resetPointsDialog ? this._renderResetPointsDialog(n) : c}
    `;
  }
  // --- Chores tab ----------------------------------------------------
  _renderChoresTab(t, e, s) {
    const i = t.filter((a) => {
      if (this._categoryFilter) {
        if (this._categoryFilter === V) {
          if (a.category) return !1;
        } else if (a.category !== this._categoryFilter)
          return !1;
      }
      return !(this._bulkUser && !a.assignees.some((d) => d.assignee === this._bulkUser));
    }), o = this._sortChores(i, e), n = this._categoryFilter && this._categoryFilter !== V;
    return r`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreateChore}>
          <ha-icon icon="mdi:plus"></ha-icon> New chore
        </button>
        ${this._renderCategoryFilterPicker(e)}
        ${this._renderChoreSortPicker()}
        ${n ? r`
              <button
                title="Reset completed manual chores in this category to not requested, and count pending ones as missed"
                @click=${() => this._categoryAction(this._categoryFilter, "finalize_by_category")}
              >
                Finalize by category
              </button>
            ` : c}
        <div class="spacer"></div>
        ${this._renderBulkUserPicker(s)}
        <button @click=${() => this._resetCompleted()}>Reset completed</button>
        <button @click=${() => this._startNewDay()}>Start new day</button>
      </div>

      ${this._renderPointsSummary(i)}

      ${o.length === 0 ? r`<p class="empty">
            ${t.length === 0 ? "No chores yet. Create one to get started." : "No chores match the current filters."}
          </p>` : r`<div class="card-grid">
            ${o.map((a) => this._renderChoreCard(a, e))}
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
    const s = [...t], i = (o) => o ? e.find((n) => n.slug === o)?.name ?? o : "";
    switch (this._choreSort) {
      case "points":
        s.sort((o, n) => n.points - o.points || o.name.localeCompare(n.name));
        break;
      case "frequency":
        s.sort(
          (o, n) => o.frequency.localeCompare(n.frequency) || o.name.localeCompare(n.name)
        );
        break;
      case "category":
        s.sort(
          (o, n) => i(o.category).localeCompare(i(n.category)) || o.name.localeCompare(n.name)
        );
        break;
      case "name":
      default:
        s.sort((o, n) => o.name.localeCompare(n.name));
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
    if (e.size === 0) return c;
    const s = [...e.entries()].sort((i, o) => i[0].localeCompare(o[0]));
    return r`
      <div class="points-summary">
        <ha-icon icon="mdi:star-outline"></ha-icon>
        <span>Points possible:</span>
        ${s.map(
      ([i, o], n) => r`
            ${n > 0 ? r`<span class="points-summary-sep">·</span>` : c}
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
        <option value=${V}>Uncategorized</option>
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
    const s = t.assignees.some((n) => n.points !== t.points), i = `${t.points} point${t.points === 1 ? "" : "s"}${s ? " (default)" : ""}`, o = t.category ? e.find((n) => n.slug === t.category)?.name ?? t.category : null;
    return r`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${t.icon || C}></ha-icon>
          <div class="card-title">
            <div class="name">${t.name}</div>
            <div class="meta">
              ${t.frequency} · ${i}
              ${o ? r` · ${o}` : c}
              ${t.description ? r` · ${t.description}` : c}
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
          ${t.assignees.filter((n) => !this._bulkUser || n.assignee === this._bulkUser).map(
      (n) => r`
                <div class="assignee-row">
                  <span class="assignee-name">${this._displayName(n.assignee)}</span>
                  ${n.points !== t.points ? r`<span class="points-override-badge" title="Point override"
                        >${n.points}pt</span
                      >` : c}
                  <span class="state-chip ${this._choreStateClass(n.state)}"
                    >${n.state}</span
                  >
                  <div class="row-actions">
                    <button
                      class="icon-button"
                      title="Request"
                      ?disabled=${n.state === "Pending"}
                      @click=${() => this._markChore(t.slug, n.assignee, "mark_pending")}
                    >
                      <ha-icon icon="mdi:plus-circle-outline"></ha-icon>
                    </button>
                    <button
                      class="icon-button"
                      title="Complete"
                      ?disabled=${n.state === "Complete"}
                      @click=${() => this._markChore(t.slug, n.assignee, "mark_complete")}
                    >
                      <ha-icon icon="mdi:check-circle-outline"></ha-icon>
                    </button>
                    <button
                      class="icon-button"
                      title="Clear"
                      ?disabled=${n.state === "Not Requested"}
                      @click=${() => this._markChore(
        t.slug,
        n.assignee,
        "mark_not_requested"
      )}
                    >
                      <ha-icon icon="mdi:close-circle-outline"></ha-icon>
                    </button>
                    <button
                      class="icon-button"
                      title="Finalize now (instead of waiting for auto-finalize)"
                      ?disabled=${n.state !== "Complete"}
                      @click=${() => this._finalizeOne(t.slug, n.assignee)}
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
      (o) => e.find((n) => n.slug === o)?.name ?? o
    );
    return r`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${t.icon || E}></ha-icon>
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
      const n = o.state === "Temporarily Disabled";
      return r`
              <div class="assignee-row privilege-row">
                <div class="assignee-main">
                  <span class="assignee-name">${this._displayName(o.assignee)}</span>
                  <span class="state-chip ${this._privilegeStateClass(o.state)}">
                    ${o.state}${n && o.disableUntil ? r` (${this._formatUntil(o.disableUntil)})` : c}
                  </span>
                  ${t.behavior === "manual" ? r`
                        <div class="row-actions">
                          <button
                            class="action-chip"
                            title="Enable"
                            ?disabled=${o.state === "Enabled"}
                            @click=${() => this._call(u, "enable_privilege", {
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
                            @click=${() => this._call(u, "disable_privilege", {
        user: o.assignee,
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
                  ${this._renderBlockStepper(
        "1h",
        n,
        () => this._adjustTemporaryDisable(t.slug, o.assignee, -60),
        () => this._addTemporaryDisable(t.slug, o.assignee, n, 60)
      )}
                  ${this._renderBlockStepper(
        "1d",
        n,
        () => this._adjustTemporaryDisable(t.slug, o.assignee, -1440),
        () => this._addTemporaryDisable(
          t.slug,
          o.assignee,
          n,
          1440
        )
      )}
                  <button
                    class="action-chip"
                    title="Clear the block now"
                    ?disabled=${!n}
                    @click=${() => this._clearTemporaryDisable(t.slug, o.assignee)}
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
      autoFinalizeDelayMinutes: t.autoFinalizeDelayMinutes
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
  _renderUsersTab(t, e) {
    const s = new Map(e.map((i) => [i.assignee, i]));
    return r`
      ${t.length === 0 ? r`<p class="empty">
            No assignees yet. Add one to a chore or privilege to get started.
          </p>` : r`<div class="card-grid">
            ${t.map((i) => this._renderUserCard(i, s.get(i)))}
          </div>`}
    `;
  }
  _renderUserCard(t, e) {
    const s = e?.totalPoints ?? 0, i = e?.pointsEarned ?? 0, o = e?.pointsMissed ?? 0, n = e?.pointsPossible ?? 0;
    return r`
      <div class="card">
        <div class="user-card-header">
          <div class="user-identity">
            <ha-icon icon="mdi:account-outline"></ha-icon>
            <span class="name">${this._displayName(t)}</span>
          </div>
          <div class="user-points-total" title="Lifetime total points">
            <span class="user-points-value">${s}</span>
            <span class="user-points-label">points</span>
          </div>
        </div>
        <div class="points-stats">
          <div class="points-stat">
            <span class="points-stat-value">${i}</span>
            <span class="points-stat-label">earned today</span>
          </div>
          <div class="points-stat">
            <span class="points-stat-value">${o}</span>
            <span class="points-stat-label">missed</span>
          </div>
          <div class="points-stat">
            <span class="points-stat-value">${n}</span>
            <span class="points-stat-label">possible today</span>
          </div>
        </div>
        <div class="user-adjust-row">
          <input
            type="number"
            class="user-adjust-input"
            placeholder="±points"
            .value=${this._userAdjustInput[t] ?? ""}
            @input=${(a) => {
      this._userAdjustInput = {
        ...this._userAdjustInput,
        [t]: a.target.value
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
  async _applyPointsAdjustment(t) {
    const e = this._userAdjustInput[t], s = Number(e);
    if (!e || Number.isNaN(s) || s === 0) {
      this._error = "Enter a non-zero point adjustment first.";
      return;
    }
    await this._call(u, "adjust_points", {
      user: t,
      adjustment: s
    }) && (this._userAdjustInput = { ...this._userAdjustInput, [t]: "" });
  }
  // --- Dialog ------------------------------------------------------------
  _renderDialog(t, e, s) {
    if (!this._dialog) return c;
    const i = this._dialog.kind, o = this._dialog.original ? "Edit" : "New", n = i === "chore" ? "chore" : i === "privilege" ? "privilege" : "category";
    return r`
      <div class="overlay" @click=${this._onOverlayClick}>
        <div class="dialog" role="dialog" aria-modal="true">
          <div class="dialog-header">
            <h2>${o} ${n}</h2>
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
    const s = this._dialog.draft, i = !!this._dialog.original, o = x(s.slug || s.name), n = i && o && o !== this._dialog.original;
    return r`
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
          placeholder=${o || "auto-generated from name"}
          @input=${(a) => {
      s.slug = a.target.value, this.requestUpdate();
    }}
        />
        ${n ? r`<span class="hint">Will be renamed to "${o}"</span>` : i ? c : r`<span class="hint">Will be saved as "${o}"</span>`}
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
            ${Ye.map(
      (a) => r`<option value=${a}>${a}</option>`
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
      (a) => r`<option value=${a.slug}>${a.name}</option>`
    )}
        </select>
      </label>

      ${this._renderIconField(s.icon, C, (a) => {
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
    return t.assignees.length === 0 ? c : r`
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
        const o = Number(i.target.value) || 0, n = { ...t.pointsByAssignee };
        o === t.points ? delete n[e] : n[e] = o, t.pointsByAssignee = n, this.requestUpdate();
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
    const s = this._dialog.draft, i = !!this._dialog.original, o = x(s.slug || s.name), n = i && o && o !== this._dialog.original;
    return r`
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
          placeholder=${o || "auto-generated from name"}
          @input=${(a) => {
      s.slug = a.target.value, this.requestUpdate();
    }}
        />
        ${n ? r`<span class="hint">Will be renamed to "${o}"</span>` : i ? c : r`<span class="hint">Will be saved as "${o}"</span>`}
      </label>

      <label>
        Behavior
        <select
          .value=${s.behavior}
          @change=${(a) => {
      s.behavior = a.target.value, this.requestUpdate();
    }}
        >
          ${Ze.map(
      (a) => r`<option value=${a}>${a}</option>`
    )}
        </select>
        <span class="hint"
          >Automatic privileges turn on when their linked chores are
          complete. Manual ones are only toggled by an admin.</span
        >
      </label>

      ${this._renderIconField(s.icon, E, (a) => {
      s.icon = a, this.requestUpdate();
    })}

      <label>
        Linked chores
        <span class="hint"
          >Leave all unchecked to require every requested chore to be
          complete instead of a specific list.</span
        >
        <div class="checkbox-list">
          ${t.length === 0 ? r`<span class="hint">No chores defined yet.</span>` : t.map(
      (a) => r`
                  <label class="checkbox-item">
                    <input
                      type="checkbox"
                      .checked=${s.linkedChores.includes(a.slug)}
                      @change=${(d) => {
        const l = d.target.checked;
        s.linkedChores = l ? [...s.linkedChores, a.slug] : s.linkedChores.filter((h) => h !== a.slug), this.requestUpdate();
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
        ${i ? r`<span class="hint">Will be renamed to "${s}"</span>` : e ? c : r`<span class="hint">Will be saved as "${s}"</span>`}
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
    return this._call(u, s, { chore_slug: t, user: e });
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
    const s = {
      category_slug: t,
      ...this._bulkUser ? { user: this._bulkUser } : {}
    };
    return this._call(u, e, s);
  }
  async _deleteChore(t) {
    const e = t.assignees.map((s) => this._displayName(s.assignee)).join(", ");
    confirm(
      `Delete "${t.name}"? This removes it for every assignee (${e}).`
    ) && await this._call(u, "delete_chore", { slug: t.slug });
  }
  async _deletePrivilege(t) {
    const e = t.assignees.map((s) => this._displayName(s.assignee)).join(", ");
    confirm(
      `Delete "${t.name}"? This removes it for every assignee (${e}).`
    ) && await this._call(u, "delete_privilege", { slug: t.slug });
  }
  async _deleteCategory(t) {
    confirm(
      `Delete "${t.name}"? Chores must be uncategorized or reassigned first.`
    ) && await this._call(u, "delete_category", { slug: t.slug });
  }
  _addTemporaryDisable(t, e, s, i) {
    return s ? this._call(u, "adjust_temporary_disable", {
      user: e,
      privilege_slug: t,
      adjustment: i
    }) : this._call(u, "temporarily_disable_privilege", {
      user: e,
      privilege_slug: t,
      duration: i
    });
  }
  /**
   * Nudge an in-progress block's end time by `adjustmentMinutes` (negative to
   * shorten it, positive to extend it), via the existing
   * `adjust_temporary_disable` service. Only meaningful while the privilege
   * is already temporarily disabled - callers should disable the triggering
   * button otherwise, since the service just warns and no-ops.
   */
  _adjustTemporaryDisable(t, e, s) {
    return this._call(u, "adjust_temporary_disable", {
      user: e,
      privilege_slug: t,
      adjustment: s
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
    const s = e.assignees.join(","), i = Object.entries(e.pointsByAssignee).filter(([n]) => e.assignees.includes(n)).map(([n, a]) => `${n}:${a}`).join(",");
    (t.original ? await this._call(u, "update_chore", {
      slug: t.original,
      name: e.name,
      description: e.description,
      frequency: e.frequency,
      assignees: s,
      icon: e.icon || C,
      points: e.points,
      points_by_assignee: i,
      category: e.category,
      ...this._renameField(t.original, e.slug || e.name)
    }) : await this._call(u, "create_chore", {
      name: e.name,
      slug: x(e.slug || e.name),
      description: e.description,
      frequency: e.frequency,
      assignees: s,
      icon: e.icon || C,
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
    const s = e.assignees.join(","), i = e.linkedChores.join(",");
    (t.original ? await this._call(u, "update_privilege", {
      slug: t.original,
      name: e.name,
      icon: e.icon || E,
      behavior: e.behavior,
      linked_chores: i,
      assignees: s,
      ...this._renameField(t.original, e.slug || e.name)
    }) : await this._call(u, "create_privilege", {
      name: e.name,
      slug: x(e.slug || e.name),
      icon: e.icon || E,
      behavior: e.behavior,
      linked_chores: i,
      assignees: s
    })) && (this._dialog = null);
  }
};
m.styles = xe`
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
b([
  Q({ attribute: !1 })
], m.prototype, "hass", 2);
b([
  Q({ type: Boolean })
], m.prototype, "narrow", 2);
b([
  _()
], m.prototype, "_tab", 2);
b([
  _()
], m.prototype, "_dialog", 2);
b([
  _()
], m.prototype, "_busy", 2);
b([
  _()
], m.prototype, "_error", 2);
b([
  _()
], m.prototype, "_bulkUser", 2);
b([
  _()
], m.prototype, "_categoryFilter", 2);
b([
  _()
], m.prototype, "_choreSort", 2);
b([
  _()
], m.prototype, "_userDisplayNames", 2);
b([
  _()
], m.prototype, "_settingsDraft", 2);
b([
  _()
], m.prototype, "_resetPointsDialog", 2);
b([
  _()
], m.prototype, "_userAdjustInput", 2);
m = b([
  Le("simple-chores-panel")
], m);
