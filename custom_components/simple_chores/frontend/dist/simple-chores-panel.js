/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const I = globalThis, G = I.ShadowRoot && (I.ShadyCSS === void 0 || I.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Y = Symbol(), te = /* @__PURE__ */ new WeakMap();
let he = class {
  constructor(e, i, s) {
    if (this._$cssResult$ = !0, s !== Y) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = i;
  }
  get styleSheet() {
    let e = this.o;
    const i = this.t;
    if (G && e === void 0) {
      const s = i !== void 0 && i.length === 1;
      s && (e = te.get(i)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), s && te.set(i, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const $e = (t) => new he(typeof t == "string" ? t : t + "", void 0, Y), xe = (t, ...e) => {
  const i = t.length === 1 ? t[0] : e.reduce((s, o, r) => s + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(o) + t[r + 1], t[0]);
  return new he(i, t, Y);
}, ke = (t, e) => {
  if (G) t.adoptedStyleSheets = e.map((i) => i instanceof CSSStyleSheet ? i : i.styleSheet);
  else for (const i of e) {
    const s = document.createElement("style"), o = I.litNonce;
    o !== void 0 && s.setAttribute("nonce", o), s.textContent = i.cssText, t.appendChild(s);
  }
}, ie = G ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let i = "";
  for (const s of e.cssRules) i += s.cssText;
  return $e(i);
})(t) : t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: we, defineProperty: Ce, getOwnPropertyDescriptor: Ae, getOwnPropertyNames: Ee, getOwnPropertySymbols: Se, getPrototypeOf: Pe } = Object, L = globalThis, se = L.trustedTypes, De = se ? se.emptyScript : "", Ue = L.reactiveElementPolyfillSupport, N = (t, e) => t, M = { toAttribute(t, e) {
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
} }, Z = (t, e) => !we(t, e), oe = { attribute: !0, type: String, converter: M, reflect: !1, useDefault: !1, hasChanged: Z };
Symbol.metadata ??= Symbol("metadata"), L.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let C = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, i = oe) {
    if (i.state && (i.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((i = Object.create(i)).wrapped = !0), this.elementProperties.set(e, i), !i.noAccessor) {
      const s = Symbol(), o = this.getPropertyDescriptor(e, s, i);
      o !== void 0 && Ce(this.prototype, e, o);
    }
  }
  static getPropertyDescriptor(e, i, s) {
    const { get: o, set: r } = Ae(this.prototype, e) ?? { get() {
      return this[i];
    }, set(a) {
      this[i] = a;
    } };
    return { get: o, set(a) {
      const l = o?.call(this);
      r?.call(this, a), this.requestUpdate(e, l, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? oe;
  }
  static _$Ei() {
    if (this.hasOwnProperty(N("elementProperties"))) return;
    const e = Pe(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(N("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(N("properties"))) {
      const i = this.properties, s = [...Ee(i), ...Se(i)];
      for (const o of s) this.createProperty(o, i[o]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const i = litPropertyMetadata.get(e);
      if (i !== void 0) for (const [s, o] of i) this.elementProperties.set(s, o);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [i, s] of this.elementProperties) {
      const o = this._$Eu(i, s);
      o !== void 0 && this._$Eh.set(o, i);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const i = [];
    if (Array.isArray(e)) {
      const s = new Set(e.flat(1 / 0).reverse());
      for (const o of s) i.unshift(ie(o));
    } else e !== void 0 && i.push(ie(e));
    return i;
  }
  static _$Eu(e, i) {
    const s = i.attribute;
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
    const e = /* @__PURE__ */ new Map(), i = this.constructor.elementProperties;
    for (const s of i.keys()) this.hasOwnProperty(s) && (e.set(s, this[s]), delete this[s]);
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
  attributeChangedCallback(e, i, s) {
    this._$AK(e, s);
  }
  _$ET(e, i) {
    const s = this.constructor.elementProperties.get(e), o = this.constructor._$Eu(e, s);
    if (o !== void 0 && s.reflect === !0) {
      const r = (s.converter?.toAttribute !== void 0 ? s.converter : M).toAttribute(i, s.type);
      this._$Em = e, r == null ? this.removeAttribute(o) : this.setAttribute(o, r), this._$Em = null;
    }
  }
  _$AK(e, i) {
    const s = this.constructor, o = s._$Eh.get(e);
    if (o !== void 0 && this._$Em !== o) {
      const r = s.getPropertyOptions(o), a = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : M;
      this._$Em = o;
      const l = a.fromAttribute(i, r.type);
      this[o] = l ?? this._$Ej?.get(o) ?? l, this._$Em = null;
    }
  }
  requestUpdate(e, i, s, o = !1, r) {
    if (e !== void 0) {
      const a = this.constructor;
      if (o === !1 && (r = this[e]), s ??= a.getPropertyOptions(e), !((s.hasChanged ?? Z)(r, i) || s.useDefault && s.reflect && r === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, s)))) return;
      this.C(e, i, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, i, { useDefault: s, reflect: o, wrapped: r }, a) {
    s && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? i ?? this[e]), r !== !0 || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || s || (i = void 0), this._$AL.set(e, i)), o === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
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
        for (const [o, r] of this._$Ep) this[o] = r;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [o, r] of s) {
        const { wrapped: a } = r, l = this[o];
        a !== !0 || this._$AL.has(o) || l === void 0 || this.C(o, void 0, r, l);
      }
    }
    let e = !1;
    const i = this._$AL;
    try {
      e = this.shouldUpdate(i), e ? (this.willUpdate(i), this._$EO?.forEach((s) => s.hostUpdate?.()), this.update(i)) : this._$EM();
    } catch (s) {
      throw e = !1, this._$EM(), s;
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
C.elementStyles = [], C.shadowRootOptions = { mode: "open" }, C[N("elementProperties")] = /* @__PURE__ */ new Map(), C[N("finalized")] = /* @__PURE__ */ new Map(), Ue?.({ ReactiveElement: C }), (L.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const K = globalThis, re = (t) => t, H = K.trustedTypes, ae = H ? H.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, ue = "$lit$", v = `lit$${Math.random().toFixed(9).slice(2)}$`, ge = "?" + v, ze = `<${ge}>`, w = document, F = () => w.createComment(""), R = (t) => t === null || typeof t != "object" && typeof t != "function", X = Array.isArray, Ne = (t) => X(t) || typeof t?.[Symbol.iterator] == "function", W = `[ 	
\f\r]`, U = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ne = /-->/g, le = />/g, $ = RegExp(`>|${W}(?:([^\\s"'>=/]+)(${W}*=${W}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ce = /'/g, de = /"/g, me = /^(?:script|style|textarea|title)$/i, Te = (t) => (e, ...i) => ({ _$litType$: t, strings: e, values: i }), n = Te(1), P = Symbol.for("lit-noChange"), d = Symbol.for("lit-nothing"), pe = /* @__PURE__ */ new WeakMap(), k = w.createTreeWalker(w, 129);
function _e(t, e) {
  if (!X(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ae !== void 0 ? ae.createHTML(e) : e;
}
const Fe = (t, e) => {
  const i = t.length - 1, s = [];
  let o, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", a = U;
  for (let l = 0; l < i; l++) {
    const c = t[l];
    let g, _, h = -1, f = 0;
    for (; f < c.length && (a.lastIndex = f, _ = a.exec(c), _ !== null); ) f = a.lastIndex, a === U ? _[1] === "!--" ? a = ne : _[1] !== void 0 ? a = le : _[2] !== void 0 ? (me.test(_[2]) && (o = RegExp("</" + _[2], "g")), a = $) : _[3] !== void 0 && (a = $) : a === $ ? _[0] === ">" ? (a = o ?? U, h = -1) : _[1] === void 0 ? h = -2 : (h = a.lastIndex - _[2].length, g = _[1], a = _[3] === void 0 ? $ : _[3] === '"' ? de : ce) : a === de || a === ce ? a = $ : a === ne || a === le ? a = U : (a = $, o = void 0);
    const y = a === $ && t[l + 1].startsWith("/>") ? " " : "";
    r += a === U ? c + ze : h >= 0 ? (s.push(g), c.slice(0, h) + ue + c.slice(h) + v + y) : c + v + (h === -2 ? l : y);
  }
  return [_e(t, r + (t[i] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), s];
};
class O {
  constructor({ strings: e, _$litType$: i }, s) {
    let o;
    this.parts = [];
    let r = 0, a = 0;
    const l = e.length - 1, c = this.parts, [g, _] = Fe(e, i);
    if (this.el = O.createElement(g, s), k.currentNode = this.el.content, i === 2 || i === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (o = k.nextNode()) !== null && c.length < l; ) {
      if (o.nodeType === 1) {
        if (o.hasAttributes()) for (const h of o.getAttributeNames()) if (h.endsWith(ue)) {
          const f = _[a++], y = o.getAttribute(h).split(v), q = /([.?@])?(.*)/.exec(f);
          c.push({ type: 1, index: r, name: q[2], strings: y, ctor: q[1] === "." ? Oe : q[1] === "?" ? je : q[1] === "@" ? qe : B }), o.removeAttribute(h);
        } else h.startsWith(v) && (c.push({ type: 6, index: r }), o.removeAttribute(h));
        if (me.test(o.tagName)) {
          const h = o.textContent.split(v), f = h.length - 1;
          if (f > 0) {
            o.textContent = H ? H.emptyScript : "";
            for (let y = 0; y < f; y++) o.append(h[y], F()), k.nextNode(), c.push({ type: 2, index: ++r });
            o.append(h[f], F());
          }
        }
      } else if (o.nodeType === 8) if (o.data === ge) c.push({ type: 2, index: r });
      else {
        let h = -1;
        for (; (h = o.data.indexOf(v, h + 1)) !== -1; ) c.push({ type: 7, index: r }), h += v.length - 1;
      }
      r++;
    }
  }
  static createElement(e, i) {
    const s = w.createElement("template");
    return s.innerHTML = e, s;
  }
}
function D(t, e, i = t, s) {
  if (e === P) return e;
  let o = s !== void 0 ? i._$Co?.[s] : i._$Cl;
  const r = R(e) ? void 0 : e._$litDirective$;
  return o?.constructor !== r && (o?._$AO?.(!1), r === void 0 ? o = void 0 : (o = new r(t), o._$AT(t, i, s)), s !== void 0 ? (i._$Co ??= [])[s] = o : i._$Cl = o), o !== void 0 && (e = D(t, o._$AS(t, e.values), o, s)), e;
}
class Re {
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
    const { el: { content: i }, parts: s } = this._$AD, o = (e?.creationScope ?? w).importNode(i, !0);
    k.currentNode = o;
    let r = k.nextNode(), a = 0, l = 0, c = s[0];
    for (; c !== void 0; ) {
      if (a === c.index) {
        let g;
        c.type === 2 ? g = new j(r, r.nextSibling, this, e) : c.type === 1 ? g = new c.ctor(r, c.name, c.strings, this, e) : c.type === 6 && (g = new Ie(r, this, e)), this._$AV.push(g), c = s[++l];
      }
      a !== c?.index && (r = k.nextNode(), a++);
    }
    return k.currentNode = w, o;
  }
  p(e) {
    let i = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(e, s, i), i += s.strings.length - 2) : s._$AI(e[i])), i++;
  }
}
class j {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, i, s, o) {
    this.type = 2, this._$AH = d, this._$AN = void 0, this._$AA = e, this._$AB = i, this._$AM = s, this.options = o, this._$Cv = o?.isConnected ?? !0;
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
    e = D(this, e, i), R(e) ? e === d || e == null || e === "" ? (this._$AH !== d && this._$AR(), this._$AH = d) : e !== this._$AH && e !== P && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Ne(e) ? this.k(e) : this._(e);
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
    const { values: i, _$litType$: s } = e, o = typeof s == "number" ? this._$AC(e) : (s.el === void 0 && (s.el = O.createElement(_e(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === o) this._$AH.p(i);
    else {
      const r = new Re(o, this), a = r.u(this.options);
      r.p(i), this.T(a), this._$AH = r;
    }
  }
  _$AC(e) {
    let i = pe.get(e.strings);
    return i === void 0 && pe.set(e.strings, i = new O(e)), i;
  }
  k(e) {
    X(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let s, o = 0;
    for (const r of e) o === i.length ? i.push(s = new j(this.O(F()), this.O(F()), this, this.options)) : s = i[o], s._$AI(r), o++;
    o < i.length && (this._$AR(s && s._$AB.nextSibling, o), i.length = o);
  }
  _$AR(e = this._$AA.nextSibling, i) {
    for (this._$AP?.(!1, !0, i); e !== this._$AB; ) {
      const s = re(e).nextSibling;
      re(e).remove(), e = s;
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
  constructor(e, i, s, o, r) {
    this.type = 1, this._$AH = d, this._$AN = void 0, this.element = e, this.name = i, this._$AM = o, this.options = r, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = d;
  }
  _$AI(e, i = this, s, o) {
    const r = this.strings;
    let a = !1;
    if (r === void 0) e = D(this, e, i, 0), a = !R(e) || e !== this._$AH && e !== P, a && (this._$AH = e);
    else {
      const l = e;
      let c, g;
      for (e = r[0], c = 0; c < r.length - 1; c++) g = D(this, l[s + c], i, c), g === P && (g = this._$AH[c]), a ||= !R(g) || g !== this._$AH[c], g === d ? e = d : e !== d && (e += (g ?? "") + r[c + 1]), this._$AH[c] = g;
    }
    a && !o && this.j(e);
  }
  j(e) {
    e === d ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Oe extends B {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === d ? void 0 : e;
  }
}
class je extends B {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== d);
  }
}
class qe extends B {
  constructor(e, i, s, o, r) {
    super(e, i, s, o, r), this.type = 5;
  }
  _$AI(e, i = this) {
    if ((e = D(this, e, i, 0) ?? d) === P) return;
    const s = this._$AH, o = e === d && s !== d || e.capture !== s.capture || e.once !== s.once || e.passive !== s.passive, r = e !== d && (s === d || o);
    o && this.element.removeEventListener(this.name, this, s), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Ie {
  constructor(e, i, s) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = s;
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
const He = (t, e, i) => {
  const s = i?.renderBefore ?? e;
  let o = s._$litPart$;
  if (o === void 0) {
    const r = i?.renderBefore ?? null;
    s._$litPart$ = o = new j(e.insertBefore(F(), r), r, void 0, i ?? {});
  }
  return o._$AI(t), o;
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = He(i, this.renderRoot, this.renderOptions);
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
T._$litElement$ = !0, T.finalized = !0, J.litElementHydrateSupport?.({ LitElement: T });
const Le = J.litElementPolyfillSupport;
Le?.({ LitElement: T });
(J.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Be = (t) => (e, i) => {
  i !== void 0 ? i.addInitializer(() => {
    customElements.define(t, e);
  }) : customElements.define(t, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const We = { attribute: !0, type: String, converter: M, reflect: !1, hasChanged: Z }, Ve = (t = We, e, i) => {
  const { kind: s, metadata: o } = i;
  let r = globalThis.litPropertyMetadata.get(o);
  if (r === void 0 && globalThis.litPropertyMetadata.set(o, r = /* @__PURE__ */ new Map()), s === "setter" && ((t = Object.create(t)).wrapped = !0), r.set(i.name, t), s === "accessor") {
    const { name: a } = i;
    return { set(l) {
      const c = e.get.call(this);
      e.set.call(this, l), this.requestUpdate(a, c, t, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(a, void 0, t, l), l;
    } };
  }
  if (s === "setter") {
    const { name: a } = i;
    return function(l) {
      const c = this[a];
      e.call(this, l), this.requestUpdate(a, c, t, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function Q(t) {
  return (e, i) => typeof i == "object" ? Ve(t, e, i) : ((s, o, r) => {
    const a = o.hasOwnProperty(r);
    return o.constructor.createProperty(r, s), a ? Object.getOwnPropertyDescriptor(o, r) : void 0;
  })(t, e, i);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function b(t) {
  return Q({ ...t, state: !0, attribute: !1 });
}
const Ge = "sensor.simple_chore_", be = "sensor.simple_chore_privilege_", fe = "sensor.simple_chore_meta_", ye = "sensor.simple_chore_category_", ve = "sensor.simple_chore_meta_settings", Ye = ["daily", "manual", "once"], Ze = ["automatic", "manual"], A = "mdi:clipboard-list-outline", E = "mdi:star", S = "mdi:tag-outline", ee = "";
function Ke() {
  return {
    slug: "",
    name: "",
    description: "",
    frequency: "daily",
    icon: A,
    points: 1,
    pointsByAssignee: {},
    category: ee,
    assignees: []
  };
}
function Xe(t) {
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
    category: t.category ?? ee,
    assignees: t.assignees.map((i) => i.assignee)
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
  for (const [i, s] of Object.entries(t)) {
    if (!i.startsWith(Ge) || i.startsWith(be) || i.startsWith(fe) || i.startsWith(ye)) continue;
    const o = s.attributes, r = o.chore_slug;
    if (!r) continue;
    let a = e.get(r);
    a || (a = {
      slug: r,
      name: o.chore_name ?? r,
      description: o.description ?? "",
      frequency: o.frequency ?? "daily",
      icon: o.icon ?? A,
      // default_points is the chore's shared value; older/unrefreshed
      // sensors may not have it yet, so fall back to this assignee's
      // resolved points rather than leaving the definition unset.
      points: o.default_points ?? o.points ?? 0,
      category: o.category ?? null,
      assignees: []
    }, e.set(r, a)), a.assignees.push({
      assignee: o.assignee,
      entityId: i,
      state: s.state,
      points: o.points ?? a.points
    });
  }
  for (const i of e.values())
    i.assignees.sort((s, o) => s.assignee.localeCompare(o.assignee));
  return [...e.values()].sort((i, s) => i.name.localeCompare(s.name));
}
function st(t) {
  const e = /* @__PURE__ */ new Map();
  for (const [i, s] of Object.entries(t)) {
    if (!i.startsWith(be)) continue;
    const o = s.attributes, r = o.privilege_slug;
    if (!r) continue;
    let a = e.get(r);
    a || (a = {
      slug: r,
      name: o.privilege_name ?? r,
      icon: o.icon ?? E,
      behavior: o.behavior ?? "automatic",
      linkedChores: o.linked_chores ?? [],
      assignees: []
    }, e.set(r, a)), a.assignees.push({
      assignee: o.assignee,
      entityId: i,
      state: s.state,
      disableUntil: o.disable_until
    });
  }
  for (const i of e.values())
    i.assignees.sort((s, o) => s.assignee.localeCompare(o.assignee));
  return [...e.values()].sort((i, s) => i.name.localeCompare(s.name));
}
function ot(t) {
  const e = [];
  for (const [i, s] of Object.entries(t)) {
    if (!i.startsWith(ye)) continue;
    const o = s.attributes, r = o.category_slug;
    r && e.push({
      slug: r,
      name: o.category_name ?? r,
      icon: o.icon ?? S,
      entityId: i,
      choreCount: Number(s.state) || 0
    });
  }
  return e.sort((i, s) => i.name.localeCompare(s.name));
}
const V = {
  autoFinalizeEnabled: !0,
  autoFinalizeDelayMinutes: 60
};
function rt(t) {
  const e = t[ve];
  if (!e) return { ...V };
  const i = e.attributes;
  return {
    autoFinalizeEnabled: i.auto_finalize_enabled ?? V.autoFinalizeEnabled,
    autoFinalizeDelayMinutes: i.auto_finalize_delay_minutes ?? V.autoFinalizeDelayMinutes
  };
}
function at(t) {
  const e = [];
  for (const [i, s] of Object.entries(t)) {
    if (!i.startsWith(fe) || i === ve) continue;
    const o = s.attributes, r = o.assignee;
    r && e.push({
      assignee: r,
      entityId: i,
      totalPoints: o.total_points ?? 0,
      pointsEarned: o.points_earned ?? 0,
      pointsMissed: o.points_missed ?? 0,
      pointsPossible: o.points_possible ?? 0,
      totalPending: o.total_pending ?? 0,
      totalComplete: o.total_complete ?? 0
    });
  }
  return e.sort((i, s) => i.assignee.localeCompare(s.assignee));
}
function nt(t, e) {
  const i = /* @__PURE__ */ new Set();
  for (const s of t)
    for (const o of s.assignees) i.add(o.assignee);
  for (const s of e)
    for (const o of s.assignees) i.add(o.assignee);
  return [...i].sort((s, o) => s.localeCompare(o));
}
function lt(t) {
  const e = {};
  for (const i of t)
    i.username && (e[i.username.toLowerCase()] = i.name);
  return e;
}
function ct(t, e) {
  return e[t.toLowerCase()] ?? t;
}
function dt(t) {
  return t ? t.map((e) => ({
    id: e.id,
    timestamp: e.timestamp,
    action: e.action,
    choreSlug: e.chore_slug,
    choreName: e.chore_name ?? e.chore_slug,
    category: e.category ?? null,
    assignee: e.assignee,
    pointsDelta: e.points_delta ?? 0,
    pointsTotal: e.points_total ?? 0
  })) : [];
}
function pt(t) {
  switch (t) {
    case "completed":
      return "Completed";
    case "uncompleted":
      return "Un-completed";
    case "reset":
      return "Reset";
    default:
      return t;
  }
}
var ht = Object.defineProperty, ut = Object.getOwnPropertyDescriptor, m = (t, e, i, s) => {
  for (var o = s > 1 ? void 0 : s ? ut(e, i) : e, r = t.length - 1, a; r >= 0; r--)
    (a = t[r]) && (o = (s ? a(e, i, o) : a(o)) || o);
  return s && o && ht(e, i, o), o;
};
const p = "simple_chores", z = "__uncategorized__";
let u = class extends T {
  constructor() {
    super(...arguments), this.narrow = !1, this._tab = "chores", this._dialog = null, this._busy = !1, this._error = null, this._bulkUser = "", this._categoryFilter = "", this._choreSort = "name", this._userDisplayNames = {}, this._settingsDraft = null, this._resetPointsDialog = null, this._userAdjustInput = {}, this._historyEntries = null, this._historyLoading = !1, this._historyUserFilter = "", this._historyCategoryFilter = "", this._historyChoreFilter = "", this._loadedUserDisplayNames = !1, this._openResetPointsDialog = (t) => {
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
    if (!this.hass) return d;
    const t = it(this.hass.states), e = st(this.hass.states), i = ot(this.hass.states), s = rt(this.hass.states), o = at(this.hass.states), r = nt(t, e);
    return n`
      <div class="toolbar">
        <ha-icon icon="mdi:clipboard-check-outline"></ha-icon>
        <span class="toolbar-title">Chores</span>
        ${this._busy ? n`<ha-icon class="spin" icon="mdi:loading"></ha-icon>` : d}
      </div>

      <div class="content">
        ${this._error ? n`
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

        ${this._tab === "chores" ? this._renderChoresTab(t, i, r) : this._tab === "privileges" ? this._renderPrivilegesTab(e, t, r) : this._tab === "categories" ? this._renderCategoriesTab(i, r) : this._tab === "users" ? this._renderUsersTab(r, o) : this._tab === "history" ? this._renderHistoryTab(t, i, r) : this._renderSettingsTab(s, r)}
      </div>

      ${this._dialog ? this._renderDialog(t, i, r) : d}
      ${this._resetPointsDialog ? this._renderResetPointsDialog(r) : d}
    `;
  }
  // --- Chores tab ----------------------------------------------------
  _renderChoresTab(t, e, i) {
    const s = t.filter((a) => {
      if (this._categoryFilter) {
        if (this._categoryFilter === z) {
          if (a.category) return !1;
        } else if (a.category !== this._categoryFilter)
          return !1;
      }
      return !(this._bulkUser && !a.assignees.some((l) => l.assignee === this._bulkUser));
    }), o = this._sortChores(s, e), r = this._categoryFilter && this._categoryFilter !== z;
    return n`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreateChore}>
          <ha-icon icon="mdi:plus"></ha-icon> New chore
        </button>
        ${this._renderCategoryFilterPicker(e)}
        ${this._renderChoreSortPicker()}
        ${r ? n`
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

      ${this._renderPointsSummary(s)}

      ${o.length === 0 ? n`<p class="empty">
            ${t.length === 0 ? "No chores yet. Create one to get started." : "No chores match the current filters."}
          </p>` : n`<div class="card-grid">
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
    const i = [...t], s = (o) => o ? e.find((r) => r.slug === o)?.name ?? o : "";
    switch (this._choreSort) {
      case "points":
        i.sort((o, r) => r.points - o.points || o.name.localeCompare(r.name));
        break;
      case "frequency":
        i.sort(
          (o, r) => o.frequency.localeCompare(r.frequency) || o.name.localeCompare(r.name)
        );
        break;
      case "category":
        i.sort(
          (o, r) => s(o.category).localeCompare(s(r.category)) || o.name.localeCompare(r.name)
        );
        break;
      case "name":
      default:
        i.sort((o, r) => o.name.localeCompare(r.name));
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
    for (const s of t)
      for (const o of s.assignees)
        this._bulkUser && o.assignee !== this._bulkUser || e.set(o.assignee, (e.get(o.assignee) ?? 0) + o.points);
    if (e.size === 0) return d;
    const i = [...e.entries()].sort((s, o) => s[0].localeCompare(o[0]));
    return n`
      <div class="points-summary">
        <ha-icon icon="mdi:star-outline"></ha-icon>
        <span>Points possible:</span>
        ${i.map(
      ([s, o], r) => n`
            ${r > 0 ? n`<span class="points-summary-sep">·</span>` : d}
            <span
              ><strong>${this._displayName(s)}</strong> ${o}</span
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
        <option value=${z}>Uncategorized</option>
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
    const i = t.assignees.some((r) => r.points !== t.points), s = `${t.points} point${t.points === 1 ? "" : "s"}${i ? " (default)" : ""}`, o = t.category ? e.find((r) => r.slug === t.category)?.name ?? t.category : null;
    return n`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${t.icon || A}></ha-icon>
          <div class="card-title">
            <div class="name">${t.name}</div>
            <div class="meta">
              ${t.frequency} · ${s}
              ${o ? n` · ${o}` : d}
              ${t.description ? n` · ${t.description}` : d}
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
      (r) => n`
                <div class="assignee-row">
                  <span class="assignee-name">${this._displayName(r.assignee)}</span>
                  ${r.points !== t.points ? n`<span class="points-override-badge" title="Point override"
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
  _renderPrivilegesTab(t, e, i) {
    return n`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreatePrivilege}>
          <ha-icon icon="mdi:plus"></ha-icon> New privilege
        </button>
      </div>

      ${t.length === 0 ? n`<p class="empty">No privileges yet. Create one to get started.</p>` : n`<div class="card-grid">
            ${t.map((s) => this._renderPrivilegeCard(s, e, i))}
          </div>`}
    `;
  }
  _renderPrivilegeCard(t, e, i) {
    const s = t.linkedChores.map(
      (o) => e.find((r) => r.slug === o)?.name ?? o
    );
    return n`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${t.icon || E}></ha-icon>
          <div class="card-title">
            <div class="name">${t.name}</div>
            <div class="meta">
              ${t.behavior}
              ${s.length ? n` · linked: ${s.join(", ")}` : n` · linked: all requested chores`}
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
      const r = o.state === "Temporarily Disabled";
      return n`
              <div class="assignee-row privilege-row">
                <div class="assignee-main">
                  <span class="assignee-name">${this._displayName(o.assignee)}</span>
                  <span class="state-chip ${this._privilegeStateClass(o.state)}">
                    ${o.state}${r && o.disableUntil ? n` (${this._formatUntil(o.disableUntil)})` : d}
                  </span>
                  ${t.behavior === "manual" ? n`
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
                  ${this._renderBlockStepper(
        "1h",
        r,
        () => this._adjustTemporaryDisable(t.slug, o.assignee, -60),
        () => this._addTemporaryDisable(t.slug, o.assignee, r, 60)
      )}
                  ${this._renderBlockStepper(
        "1d",
        r,
        () => this._adjustTemporaryDisable(t.slug, o.assignee, -1440),
        () => this._addTemporaryDisable(
          t.slug,
          o.assignee,
          r,
          1440
        )
      )}
                  <button
                    class="action-chip"
                    title="Clear the block now"
                    ?disabled=${!r}
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
  _renderBlockStepper(t, e, i, s) {
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
        <button title="Extend the block by ${t}" @click=${s}>
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
      const e = new Date(t), i = /* @__PURE__ */ new Date(), s = e.toDateString() === i.toDateString(), o = e.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
      return s ? `until ${o}` : `until ${e.toLocaleDateString()} ${o}`;
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
      autoFinalizeDelayMinutes: t.autoFinalizeDelayMinutes
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
            @change=${(s) => {
      i.autoFinalizeEnabled = s.target.checked, this.requestUpdate();
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
            @input=${(s) => {
      i.autoFinalizeDelayMinutes = Number(s.target.value) || 1, this.requestUpdate();
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
      auto_finalize_delay_minutes: t.autoFinalizeDelayMinutes
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
  _renderUsersTab(t, e) {
    const i = new Map(e.map((s) => [s.assignee, s]));
    return n`
      ${t.length === 0 ? n`<p class="empty">
            No assignees yet. Add one to a chore or privilege to get started.
          </p>` : n`<div class="card-grid">
            ${t.map((s) => this._renderUserCard(s, i.get(s)))}
          </div>`}
    `;
  }
  _renderUserCard(t, e) {
    const i = e?.totalPoints ?? 0, s = e?.pointsEarned ?? 0, o = e?.pointsMissed ?? 0, r = e?.pointsPossible ?? 0;
    return n`
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
            <span class="points-stat-value">${s}</span>
            <span class="points-stat-label">earned today</span>
          </div>
          <div class="points-stat">
            <span class="points-stat-value">${o}</span>
            <span class="points-stat-label">missed</span>
          </div>
          <div class="points-stat">
            <span class="points-stat-value">${r}</span>
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
    const e = this._userAdjustInput[t], i = Number(e);
    if (!e || Number.isNaN(i) || i === 0) {
      this._error = "Enter a non-zero point adjustment first.";
      return;
    }
    await this._call(p, "adjust_points", {
      user: t,
      adjustment: i
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
      this._historyEntries = dt(t?.response?.entries);
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
  _renderHistoryTab(t, e, i) {
    const s = this._historyEntries ?? [], r = [...s.filter((l) => {
      if (this._historyUserFilter && l.assignee !== this._historyUserFilter)
        return !1;
      if (this._historyCategoryFilter) {
        if (this._historyCategoryFilter === z) {
          if (l.category) return !1;
        } else if (l.category !== this._historyCategoryFilter)
          return !1;
      }
      return !(this._historyChoreFilter && l.choreSlug !== this._historyChoreFilter);
    })].sort((l, c) => c.timestamp.localeCompare(l.timestamp)), a = [...t].sort((l, c) => l.name.localeCompare(c.name));
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
          <option value=${z}>Uncategorized</option>
          ${e.map((l) => n`<option value=${l.slug}>${l.name}</option>`)}
        </select>
        <select
          class="user-picker"
          title="Filter history by chore"
          .value=${this._historyChoreFilter}
          @change=${(l) => this._historyChoreFilter = l.target.value}
        >
          <option value="">All chores</option>
          ${a.map((l) => n`<option value=${l.slug}>${l.name}</option>`)}
        </select>
        <div class="spacer"></div>
        <button ?disabled=${this._historyLoading} @click=${() => this._loadHistory()}>
          ${this._historyLoading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      ${this._historyEntries === null ? n`<p class="empty">Loading history&hellip;</p>` : r.length === 0 ? n`<p class="empty">
              ${s.length === 0 ? "No chore history yet. Complete a chore to get started." : "No history entries match the current filters."}
            </p>` : n`
              <div class="history-list">
                <div class="history-row history-header">
                  <div class="history-cell history-time">Time</div>
                  <div class="history-cell history-chore">Chore</div>
                  <div class="history-cell history-assignee">Assignee</div>
                  <div class="history-cell history-action">Action</div>
                  <div class="history-cell history-points">Points</div>
                  <div class="history-cell history-balance">Balance</div>
                </div>
                ${r.map((l) => this._renderHistoryRow(l, e))}
              </div>
            `}
    `;
  }
  _renderHistoryRow(t, e) {
    const i = t.category ? e.find((r) => r.slug === t.category)?.name ?? t.category : null, s = t.pointsDelta > 0 ? "points-positive" : t.pointsDelta < 0 ? "points-negative" : "", o = t.pointsDelta > 0 ? `+${t.pointsDelta}` : t.pointsDelta;
    return n`
      <div class="history-row">
        <div class="history-cell history-time">
          ${this._formatHistoryTimestamp(t.timestamp)}
        </div>
        <div class="history-cell history-chore">
          <div class="name">${t.choreName}</div>
          ${i ? n`<div class="meta">${i}</div>` : d}
        </div>
        <div class="history-cell history-assignee">
          ${this._displayName(t.assignee)}
        </div>
        <div class="history-cell history-action">
          <span class="state-chip ${this._historyActionClass(t.action)}">
            ${pt(t.action)}
          </span>
        </div>
        <div class="history-cell history-points ${s}">
          ${t.pointsDelta === 0 ? "—" : o}
        </div>
        <div class="history-cell history-balance" title="Points balance after this entry">
          ${t.pointsTotal}
        </div>
      </div>
    `;
  }
  _historyActionClass(t) {
    return t === "completed" ? "state-good" : t === "uncompleted" ? "state-bad" : "state-neutral";
  }
  _formatHistoryTimestamp(t) {
    const e = new Date(t);
    return Number.isNaN(e.getTime()) ? t : e.toLocaleString();
  }
  // --- Dialog ------------------------------------------------------------
  _renderDialog(t, e, i) {
    if (!this._dialog) return d;
    const s = this._dialog.kind, o = this._dialog.original ? "Edit" : "New", r = s === "chore" ? "chore" : s === "privilege" ? "privilege" : "category";
    return n`
      <div class="overlay" @click=${this._onOverlayClick}>
        <div class="dialog" role="dialog" aria-modal="true">
          <div class="dialog-header">
            <h2>${o} ${r}</h2>
            <button class="icon-button" @click=${this._closeDialog}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="dialog-body">
            ${s === "chore" ? this._renderChoreForm(e, i) : s === "privilege" ? this._renderPrivilegeForm(t, i) : this._renderCategoryForm()}
          </div>
          <div class="dialog-footer">
            <button @click=${this._closeDialog}>Cancel</button>
            <button
              class="primary"
              ?disabled=${this._busy}
              @click=${() => s === "chore" ? this._saveChoreDialog() : s === "privilege" ? this._savePrivilegeDialog() : this._saveCategoryDialog()}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    `;
  }
  _renderChoreForm(t, e) {
    const i = this._dialog.draft, s = !!this._dialog.original, o = x(i.slug || i.name), r = s && o && o !== this._dialog.original;
    return n`
      <label>
        Name
        <input
          type="text"
          .value=${i.name}
          @input=${(a) => {
      i.name = a.target.value, this.requestUpdate();
    }}
        />
      </label>

      <label>
        Slug
        <input
          type="text"
          .value=${i.slug}
          placeholder=${o || "auto-generated from name"}
          @input=${(a) => {
      i.slug = a.target.value, this.requestUpdate();
    }}
        />
        ${r ? n`<span class="hint">Will be renamed to "${o}"</span>` : s ? d : n`<span class="hint">Will be saved as "${o}"</span>`}
      </label>

      <label>
        Description
        <input
          type="text"
          .value=${i.description}
          @input=${(a) => {
      i.description = a.target.value, this.requestUpdate();
    }}
        />
      </label>

      <div class="form-row">
        <label>
          Frequency
          <select
            .value=${i.frequency}
            @change=${(a) => {
      i.frequency = a.target.value, this.requestUpdate();
    }}
          >
            ${Ye.map(
      (a) => n`<option value=${a}>${a}</option>`
    )}
          </select>
        </label>

        <label>
          Points
          <input
            type="number"
            min="0"
            .value=${String(i.points)}
            @input=${(a) => {
      i.points = Number(a.target.value) || 0, this.requestUpdate();
    }}
          />
        </label>
      </div>

      <label>
        Category
        <select
          .value=${i.category}
          @change=${(a) => {
      i.category = a.target.value, this.requestUpdate();
    }}
        >
          <option value=${ee}>Uncategorized</option>
          ${t.map(
      (a) => n`<option value=${a.slug}>${a.name}</option>`
    )}
        </select>
      </label>

      ${this._renderIconField(i.icon, A, (a) => {
      i.icon = a, this.requestUpdate();
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
    return t.assignees.length === 0 ? d : n`
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
                  @input=${(s) => {
        const o = Number(s.target.value) || 0, r = { ...t.pointsByAssignee };
        o === t.points ? delete r[e] : r[e] = o, t.pointsByAssignee = r, this.requestUpdate();
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
    const i = this._dialog.draft, s = !!this._dialog.original, o = x(i.slug || i.name), r = s && o && o !== this._dialog.original;
    return n`
      <label>
        Name
        <input
          type="text"
          .value=${i.name}
          @input=${(a) => {
      i.name = a.target.value, this.requestUpdate();
    }}
        />
      </label>

      <label>
        Slug
        <input
          type="text"
          .value=${i.slug}
          placeholder=${o || "auto-generated from name"}
          @input=${(a) => {
      i.slug = a.target.value, this.requestUpdate();
    }}
        />
        ${r ? n`<span class="hint">Will be renamed to "${o}"</span>` : s ? d : n`<span class="hint">Will be saved as "${o}"</span>`}
      </label>

      <label>
        Behavior
        <select
          .value=${i.behavior}
          @change=${(a) => {
      i.behavior = a.target.value, this.requestUpdate();
    }}
        >
          ${Ze.map(
      (a) => n`<option value=${a}>${a}</option>`
    )}
        </select>
        <span class="hint"
          >Automatic privileges turn on when their linked chores are
          complete. Manual ones are only toggled by an admin.</span
        >
      </label>

      ${this._renderIconField(i.icon, E, (a) => {
      i.icon = a, this.requestUpdate();
    })}

      <label>
        Linked chores
        <span class="hint"
          >Leave all unchecked to require every requested chore to be
          complete instead of a specific list.</span
        >
        <div class="checkbox-list">
          ${t.length === 0 ? n`<span class="hint">No chores defined yet.</span>` : t.map(
      (a) => n`
                  <label class="checkbox-item">
                    <input
                      type="checkbox"
                      .checked=${i.linkedChores.includes(a.slug)}
                      @change=${(l) => {
        const c = l.target.checked;
        i.linkedChores = c ? [...i.linkedChores, a.slug] : i.linkedChores.filter((g) => g !== a.slug), this.requestUpdate();
      }}
                    />
                    ${a.name}
                  </label>
                `
    )}
        </div>
      </label>

      ${this._renderAssigneeEditor(i, e)}
    `;
  }
  _renderCategoryForm() {
    const t = this._dialog.draft, e = !!this._dialog.original, i = x(t.slug || t.name), s = e && i && i !== this._dialog.original;
    return n`
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
          placeholder=${i || "auto-generated from name"}
          @input=${(o) => {
      t.slug = o.target.value, this.requestUpdate();
    }}
        />
        ${s ? n`<span class="hint">Will be renamed to "${i}"</span>` : e ? d : n`<span class="hint">Will be saved as "${i}"</span>`}
      </label>

      ${this._renderIconField(t.icon, S, (o) => {
      t.icon = o, this.requestUpdate();
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
            @input=${(s) => i(s.target.value)}
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
        t.assignees = t.assignees.filter((s) => s !== i), this.requestUpdate();
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
    } catch (s) {
      return this._error = s instanceof Error ? s.message : String(s), !1;
    } finally {
      this._busy = !1;
    }
  }
  _markChore(t, e, i) {
    return this._call(p, i, { chore_slug: t, user: e });
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
    const i = {
      category_slug: t,
      ...this._bulkUser ? { user: this._bulkUser } : {}
    };
    return this._call(p, e, i);
  }
  async _deleteChore(t) {
    const e = t.assignees.map((i) => this._displayName(i.assignee)).join(", ");
    confirm(
      `Delete "${t.name}"? This removes it for every assignee (${e}).`
    ) && await this._call(p, "delete_chore", { slug: t.slug });
  }
  async _deletePrivilege(t) {
    const e = t.assignees.map((i) => this._displayName(i.assignee)).join(", ");
    confirm(
      `Delete "${t.name}"? This removes it for every assignee (${e}).`
    ) && await this._call(p, "delete_privilege", { slug: t.slug });
  }
  async _deleteCategory(t) {
    confirm(
      `Delete "${t.name}"? Chores must be uncategorized or reassigned first.`
    ) && await this._call(p, "delete_category", { slug: t.slug });
  }
  _addTemporaryDisable(t, e, i, s) {
    return i ? this._call(p, "adjust_temporary_disable", {
      user: e,
      privilege_slug: t,
      adjustment: s
    }) : this._call(p, "temporarily_disable_privilege", {
      user: e,
      privilege_slug: t,
      duration: s
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
    return this._call(p, "adjust_temporary_disable", {
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
    return this._call(p, "clear_temporary_disable", {
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
    const i = e.assignees.join(","), s = Object.entries(e.pointsByAssignee).filter(([r]) => e.assignees.includes(r)).map(([r, a]) => `${r}:${a}`).join(",");
    (t.original ? await this._call(p, "update_chore", {
      slug: t.original,
      name: e.name,
      description: e.description,
      frequency: e.frequency,
      assignees: i,
      icon: e.icon || A,
      points: e.points,
      points_by_assignee: s,
      category: e.category,
      ...this._renameField(t.original, e.slug || e.name)
    }) : await this._call(p, "create_chore", {
      name: e.name,
      slug: x(e.slug || e.name),
      description: e.description,
      frequency: e.frequency,
      assignees: i,
      icon: e.icon || A,
      points: e.points,
      points_by_assignee: s,
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
    const i = e.assignees.join(","), s = e.linkedChores.join(",");
    (t.original ? await this._call(p, "update_privilege", {
      slug: t.original,
      name: e.name,
      icon: e.icon || E,
      behavior: e.behavior,
      linked_chores: s,
      assignees: i,
      ...this._renameField(t.original, e.slug || e.name)
    }) : await this._call(p, "create_privilege", {
      name: e.name,
      slug: x(e.slug || e.name),
      icon: e.icon || E,
      behavior: e.behavior,
      linked_chores: s,
      assignees: i
    })) && (this._dialog = null);
  }
};
u.styles = xe`
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
      grid-template-columns: 1.3fr 1.6fr 1fr 1fr 0.7fr 0.8fr;
      gap: 8px;
      align-items: center;
      padding: 10px 14px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      font-size: 13px;
      min-width: 560px;
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
    .history-cell.history-chore .meta {
      font-size: 11px;
      color: var(--secondary-text-color, #727272);
    }
    .history-points,
    .history-balance {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .points-positive {
      color: #2e7d32;
    }
    .points-negative {
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
m([
  Q({ attribute: !1 })
], u.prototype, "hass", 2);
m([
  Q({ type: Boolean })
], u.prototype, "narrow", 2);
m([
  b()
], u.prototype, "_tab", 2);
m([
  b()
], u.prototype, "_dialog", 2);
m([
  b()
], u.prototype, "_busy", 2);
m([
  b()
], u.prototype, "_error", 2);
m([
  b()
], u.prototype, "_bulkUser", 2);
m([
  b()
], u.prototype, "_categoryFilter", 2);
m([
  b()
], u.prototype, "_choreSort", 2);
m([
  b()
], u.prototype, "_userDisplayNames", 2);
m([
  b()
], u.prototype, "_settingsDraft", 2);
m([
  b()
], u.prototype, "_resetPointsDialog", 2);
m([
  b()
], u.prototype, "_userAdjustInput", 2);
m([
  b()
], u.prototype, "_historyEntries", 2);
m([
  b()
], u.prototype, "_historyLoading", 2);
m([
  b()
], u.prototype, "_historyUserFilter", 2);
m([
  b()
], u.prototype, "_historyCategoryFilter", 2);
m([
  b()
], u.prototype, "_historyChoreFilter", 2);
u = m([
  Be("simple-chores-panel")
], u);
