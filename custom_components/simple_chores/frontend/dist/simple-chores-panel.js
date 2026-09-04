/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const z = globalThis, W = z.ShadowRoot && (z.ShadyCSS === void 0 || z.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, V = Symbol(), Q = /* @__PURE__ */ new WeakMap();
let pe = class {
  constructor(e, i, s) {
    if (this._$cssResult$ = !0, s !== V) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = i;
  }
  get styleSheet() {
    let e = this.o;
    const i = this.t;
    if (W && e === void 0) {
      const s = i !== void 0 && i.length === 1;
      s && (e = Q.get(i)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), s && Q.set(i, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const fe = (t) => new pe(typeof t == "string" ? t : t + "", void 0, V), ve = (t, ...e) => {
  const i = t.length === 1 ? t[0] : e.reduce((s, r, o) => s + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + t[o + 1], t[0]);
  return new pe(i, t, V);
}, $e = (t, e) => {
  if (W) t.adoptedStyleSheets = e.map((i) => i instanceof CSSStyleSheet ? i : i.styleSheet);
  else for (const i of e) {
    const s = document.createElement("style"), r = z.litNonce;
    r !== void 0 && s.setAttribute("nonce", r), s.textContent = i.cssText, t.appendChild(s);
  }
}, ee = W ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let i = "";
  for (const s of e.cssRules) i += s.cssText;
  return fe(i);
})(t) : t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: ye, defineProperty: xe, getOwnPropertyDescriptor: ke, getOwnPropertyNames: Ce, getOwnPropertySymbols: Ae, getPrototypeOf: we } = Object, F = globalThis, te = F.trustedTypes, Ee = te ? te.emptyScript : "", Se = F.reactiveElementPolyfillSupport, D = (t, e) => t, j = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? Ee : null;
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
} }, Y = (t, e) => !ye(t, e), ie = { attribute: !0, type: String, converter: j, reflect: !1, useDefault: !1, hasChanged: Y };
Symbol.metadata ??= Symbol("metadata"), F.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let C = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, i = ie) {
    if (i.state && (i.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((i = Object.create(i)).wrapped = !0), this.elementProperties.set(e, i), !i.noAccessor) {
      const s = Symbol(), r = this.getPropertyDescriptor(e, s, i);
      r !== void 0 && xe(this.prototype, e, r);
    }
  }
  static getPropertyDescriptor(e, i, s) {
    const { get: r, set: o } = ke(this.prototype, e) ?? { get() {
      return this[i];
    }, set(n) {
      this[i] = n;
    } };
    return { get: r, set(n) {
      const c = r?.call(this);
      o?.call(this, n), this.requestUpdate(e, c, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? ie;
  }
  static _$Ei() {
    if (this.hasOwnProperty(D("elementProperties"))) return;
    const e = we(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(D("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(D("properties"))) {
      const i = this.properties, s = [...Ce(i), ...Ae(i)];
      for (const r of s) this.createProperty(r, i[r]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const i = litPropertyMetadata.get(e);
      if (i !== void 0) for (const [s, r] of i) this.elementProperties.set(s, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [i, s] of this.elementProperties) {
      const r = this._$Eu(i, s);
      r !== void 0 && this._$Eh.set(r, i);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const i = [];
    if (Array.isArray(e)) {
      const s = new Set(e.flat(1 / 0).reverse());
      for (const r of s) i.unshift(ee(r));
    } else e !== void 0 && i.push(ee(e));
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
  attributeChangedCallback(e, i, s) {
    this._$AK(e, s);
  }
  _$ET(e, i) {
    const s = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, s);
    if (r !== void 0 && s.reflect === !0) {
      const o = (s.converter?.toAttribute !== void 0 ? s.converter : j).toAttribute(i, s.type);
      this._$Em = e, o == null ? this.removeAttribute(r) : this.setAttribute(r, o), this._$Em = null;
    }
  }
  _$AK(e, i) {
    const s = this.constructor, r = s._$Eh.get(e);
    if (r !== void 0 && this._$Em !== r) {
      const o = s.getPropertyOptions(r), n = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : j;
      this._$Em = r;
      const c = n.fromAttribute(i, o.type);
      this[r] = c ?? this._$Ej?.get(r) ?? c, this._$Em = null;
    }
  }
  requestUpdate(e, i, s, r = !1, o) {
    if (e !== void 0) {
      const n = this.constructor;
      if (r === !1 && (o = this[e]), s ??= n.getPropertyOptions(e), !((s.hasChanged ?? Y)(o, i) || s.useDefault && s.reflect && o === this._$Ej?.get(e) && !this.hasAttribute(n._$Eu(e, s)))) return;
      this.C(e, i, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, i, { useDefault: s, reflect: r, wrapped: o }, n) {
    s && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, n ?? i ?? this[e]), o !== !0 || n !== void 0) || (this._$AL.has(e) || (this.hasUpdated || s || (i = void 0), this._$AL.set(e, i)), r === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
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
        for (const [r, o] of this._$Ep) this[r] = o;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [r, o] of s) {
        const { wrapped: n } = o, c = this[r];
        n !== !0 || this._$AL.has(r) || c === void 0 || this.C(r, void 0, o, c);
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
C.elementStyles = [], C.shadowRootOptions = { mode: "open" }, C[D("elementProperties")] = /* @__PURE__ */ new Map(), C[D("finalized")] = /* @__PURE__ */ new Map(), Se?.({ ReactiveElement: C }), (F.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const G = globalThis, se = (t) => t, H = G.trustedTypes, re = H ? H.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, he = "$lit$", v = `lit$${Math.random().toFixed(9).slice(2)}$`, ue = "?" + v, Pe = `<${ue}>`, x = document, O = () => x.createComment(""), R = (t) => t === null || typeof t != "object" && typeof t != "function", Z = Array.isArray, Ue = (t) => Z(t) || typeof t?.[Symbol.iterator] == "function", B = `[ 	
\f\r]`, T = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, oe = /-->/g, ne = />/g, $ = RegExp(`>|${B}(?:([^\\s"'>=/]+)(${B}*=${B}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ae = /'/g, le = /"/g, ge = /^(?:script|style|textarea|title)$/i, Te = (t) => (e, ...i) => ({ _$litType$: t, strings: e, values: i }), a = Te(1), S = Symbol.for("lit-noChange"), d = Symbol.for("lit-nothing"), ce = /* @__PURE__ */ new WeakMap(), y = x.createTreeWalker(x, 129);
function _e(t, e) {
  if (!Z(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return re !== void 0 ? re.createHTML(e) : e;
}
const De = (t, e) => {
  const i = t.length - 1, s = [];
  let r, o = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", n = T;
  for (let c = 0; c < i; c++) {
    const l = t[c];
    let u, g, p = -1, m = 0;
    for (; m < l.length && (n.lastIndex = m, g = n.exec(l), g !== null); ) m = n.lastIndex, n === T ? g[1] === "!--" ? n = oe : g[1] !== void 0 ? n = ne : g[2] !== void 0 ? (ge.test(g[2]) && (r = RegExp("</" + g[2], "g")), n = $) : g[3] !== void 0 && (n = $) : n === $ ? g[0] === ">" ? (n = r ?? T, p = -1) : g[1] === void 0 ? p = -2 : (p = n.lastIndex - g[2].length, u = g[1], n = g[3] === void 0 ? $ : g[3] === '"' ? le : ae) : n === le || n === ae ? n = $ : n === oe || n === ne ? n = T : (n = $, r = void 0);
    const f = n === $ && t[c + 1].startsWith("/>") ? " " : "";
    o += n === T ? l + Pe : p >= 0 ? (s.push(u), l.slice(0, p) + he + l.slice(p) + v + f) : l + v + (p === -2 ? c : f);
  }
  return [_e(t, o + (t[i] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), s];
};
class q {
  constructor({ strings: e, _$litType$: i }, s) {
    let r;
    this.parts = [];
    let o = 0, n = 0;
    const c = e.length - 1, l = this.parts, [u, g] = De(e, i);
    if (this.el = q.createElement(u, s), y.currentNode = this.el.content, i === 2 || i === 3) {
      const p = this.el.content.firstChild;
      p.replaceWith(...p.childNodes);
    }
    for (; (r = y.nextNode()) !== null && l.length < c; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const p of r.getAttributeNames()) if (p.endsWith(he)) {
          const m = g[n++], f = r.getAttribute(p).split(v), M = /([.?@])?(.*)/.exec(m);
          l.push({ type: 1, index: o, name: M[2], strings: f, ctor: M[1] === "." ? Oe : M[1] === "?" ? Re : M[1] === "@" ? qe : L }), r.removeAttribute(p);
        } else p.startsWith(v) && (l.push({ type: 6, index: o }), r.removeAttribute(p));
        if (ge.test(r.tagName)) {
          const p = r.textContent.split(v), m = p.length - 1;
          if (m > 0) {
            r.textContent = H ? H.emptyScript : "";
            for (let f = 0; f < m; f++) r.append(p[f], O()), y.nextNode(), l.push({ type: 2, index: ++o });
            r.append(p[m], O());
          }
        }
      } else if (r.nodeType === 8) if (r.data === ue) l.push({ type: 2, index: o });
      else {
        let p = -1;
        for (; (p = r.data.indexOf(v, p + 1)) !== -1; ) l.push({ type: 7, index: o }), p += v.length - 1;
      }
      o++;
    }
  }
  static createElement(e, i) {
    const s = x.createElement("template");
    return s.innerHTML = e, s;
  }
}
function P(t, e, i = t, s) {
  if (e === S) return e;
  let r = s !== void 0 ? i._$Co?.[s] : i._$Cl;
  const o = R(e) ? void 0 : e._$litDirective$;
  return r?.constructor !== o && (r?._$AO?.(!1), o === void 0 ? r = void 0 : (r = new o(t), r._$AT(t, i, s)), s !== void 0 ? (i._$Co ??= [])[s] = r : i._$Cl = r), r !== void 0 && (e = P(t, r._$AS(t, e.values), r, s)), e;
}
class Ne {
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
    const { el: { content: i }, parts: s } = this._$AD, r = (e?.creationScope ?? x).importNode(i, !0);
    y.currentNode = r;
    let o = y.nextNode(), n = 0, c = 0, l = s[0];
    for (; l !== void 0; ) {
      if (n === l.index) {
        let u;
        l.type === 2 ? u = new I(o, o.nextSibling, this, e) : l.type === 1 ? u = new l.ctor(o, l.name, l.strings, this, e) : l.type === 6 && (u = new Ie(o, this, e)), this._$AV.push(u), l = s[++c];
      }
      n !== l?.index && (o = y.nextNode(), n++);
    }
    return y.currentNode = x, r;
  }
  p(e) {
    let i = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(e, s, i), i += s.strings.length - 2) : s._$AI(e[i])), i++;
  }
}
class I {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, i, s, r) {
    this.type = 2, this._$AH = d, this._$AN = void 0, this._$AA = e, this._$AB = i, this._$AM = s, this.options = r, this._$Cv = r?.isConnected ?? !0;
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
    e = P(this, e, i), R(e) ? e === d || e == null || e === "" ? (this._$AH !== d && this._$AR(), this._$AH = d) : e !== this._$AH && e !== S && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Ue(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== d && R(this._$AH) ? this._$AA.nextSibling.data = e : this.T(x.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: i, _$litType$: s } = e, r = typeof s == "number" ? this._$AC(e) : (s.el === void 0 && (s.el = q.createElement(_e(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === r) this._$AH.p(i);
    else {
      const o = new Ne(r, this), n = o.u(this.options);
      o.p(i), this.T(n), this._$AH = o;
    }
  }
  _$AC(e) {
    let i = ce.get(e.strings);
    return i === void 0 && ce.set(e.strings, i = new q(e)), i;
  }
  k(e) {
    Z(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let s, r = 0;
    for (const o of e) r === i.length ? i.push(s = new I(this.O(O()), this.O(O()), this, this.options)) : s = i[r], s._$AI(o), r++;
    r < i.length && (this._$AR(s && s._$AB.nextSibling, r), i.length = r);
  }
  _$AR(e = this._$AA.nextSibling, i) {
    for (this._$AP?.(!1, !0, i); e !== this._$AB; ) {
      const s = se(e).nextSibling;
      se(e).remove(), e = s;
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
  constructor(e, i, s, r, o) {
    this.type = 1, this._$AH = d, this._$AN = void 0, this.element = e, this.name = i, this._$AM = r, this.options = o, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = d;
  }
  _$AI(e, i = this, s, r) {
    const o = this.strings;
    let n = !1;
    if (o === void 0) e = P(this, e, i, 0), n = !R(e) || e !== this._$AH && e !== S, n && (this._$AH = e);
    else {
      const c = e;
      let l, u;
      for (e = o[0], l = 0; l < o.length - 1; l++) u = P(this, c[s + l], i, l), u === S && (u = this._$AH[l]), n ||= !R(u) || u !== this._$AH[l], u === d ? e = d : e !== d && (e += (u ?? "") + o[l + 1]), this._$AH[l] = u;
    }
    n && !r && this.j(e);
  }
  j(e) {
    e === d ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Oe extends L {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === d ? void 0 : e;
  }
}
class Re extends L {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== d);
  }
}
class qe extends L {
  constructor(e, i, s, r, o) {
    super(e, i, s, r, o), this.type = 5;
  }
  _$AI(e, i = this) {
    if ((e = P(this, e, i, 0) ?? d) === S) return;
    const s = this._$AH, r = e === d && s !== d || e.capture !== s.capture || e.once !== s.once || e.passive !== s.passive, o = e !== d && (s === d || r);
    r && this.element.removeEventListener(this.name, this, s), o && this.element.addEventListener(this.name, this, e), this._$AH = e;
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
    P(this, e);
  }
}
const Me = G.litHtmlPolyfillSupport;
Me?.(q, I), (G.litHtmlVersions ??= []).push("3.3.3");
const ze = (t, e, i) => {
  const s = i?.renderBefore ?? e;
  let r = s._$litPart$;
  if (r === void 0) {
    const o = i?.renderBefore ?? null;
    s._$litPart$ = r = new I(e.insertBefore(O(), o), o, void 0, i ?? {});
  }
  return r._$AI(t), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const K = globalThis;
class N extends C {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const i = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = ze(i, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return S;
  }
}
N._$litElement$ = !0, N.finalized = !0, K.litElementHydrateSupport?.({ LitElement: N });
const je = K.litElementPolyfillSupport;
je?.({ LitElement: N });
(K.litElementVersions ??= []).push("4.2.2");
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
const Fe = { attribute: !0, type: String, converter: j, reflect: !1, hasChanged: Y }, Le = (t = Fe, e, i) => {
  const { kind: s, metadata: r } = i;
  let o = globalThis.litPropertyMetadata.get(r);
  if (o === void 0 && globalThis.litPropertyMetadata.set(r, o = /* @__PURE__ */ new Map()), s === "setter" && ((t = Object.create(t)).wrapped = !0), o.set(i.name, t), s === "accessor") {
    const { name: n } = i;
    return { set(c) {
      const l = e.get.call(this);
      e.set.call(this, c), this.requestUpdate(n, l, t, !0, c);
    }, init(c) {
      return c !== void 0 && this.C(n, void 0, t, c), c;
    } };
  }
  if (s === "setter") {
    const { name: n } = i;
    return function(c) {
      const l = this[n];
      e.call(this, c), this.requestUpdate(n, l, t, !0, c);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function X(t) {
  return (e, i) => typeof i == "object" ? Le(t, e, i) : ((s, r, o) => {
    const n = r.hasOwnProperty(o);
    return r.constructor.createProperty(o, s), n ? Object.getOwnPropertyDescriptor(r, o) : void 0;
  })(t, e, i);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function U(t) {
  return X({ ...t, state: !0, attribute: !1 });
}
const Be = "sensor.simple_chore_", me = "sensor.simple_chore_privilege_", We = "sensor.simple_chore_meta_", be = "sensor.simple_chore_category_", Ve = ["daily", "manual", "once"], Ye = ["automatic", "manual"], A = "mdi:clipboard-list-outline", w = "mdi:star", E = "mdi:tag-outline", J = "";
function Ge() {
  return {
    slug: "",
    name: "",
    description: "",
    frequency: "daily",
    icon: A,
    points: 1,
    category: J,
    assignees: []
  };
}
function Ze(t) {
  return {
    slug: t.slug,
    name: t.name,
    description: t.description,
    frequency: t.frequency,
    icon: t.icon,
    points: t.points,
    category: t.category ?? J,
    assignees: t.assignees.map((e) => e.assignee)
  };
}
function Ke() {
  return {
    slug: "",
    name: "",
    icon: E
  };
}
function Xe(t) {
  return {
    slug: t.slug,
    name: t.name,
    icon: t.icon
  };
}
function Je() {
  return {
    slug: "",
    name: "",
    icon: w,
    behavior: "automatic",
    linkedChores: [],
    assignees: []
  };
}
function Qe(t) {
  return {
    slug: t.slug,
    name: t.name,
    icon: t.icon,
    behavior: t.behavior,
    linkedChores: [...t.linkedChores],
    assignees: t.assignees.map((e) => e.assignee)
  };
}
function k(t) {
  return t.toLowerCase().replace(/\s+/g, "-").replace(/-/g, "_").replace(/[^a-z0-9_]/g, "");
}
function et(t) {
  const e = /* @__PURE__ */ new Map();
  for (const [i, s] of Object.entries(t)) {
    if (!i.startsWith(Be) || i.startsWith(me) || i.startsWith(We) || i.startsWith(be)) continue;
    const r = s.attributes, o = r.chore_slug;
    if (!o) continue;
    let n = e.get(o);
    n || (n = {
      slug: o,
      name: r.chore_name ?? o,
      description: r.description ?? "",
      frequency: r.frequency ?? "daily",
      icon: r.icon ?? A,
      points: r.points ?? 0,
      category: r.category ?? null,
      assignees: []
    }, e.set(o, n)), n.assignees.push({
      assignee: r.assignee,
      entityId: i,
      state: s.state
    });
  }
  for (const i of e.values())
    i.assignees.sort((s, r) => s.assignee.localeCompare(r.assignee));
  return [...e.values()].sort((i, s) => i.name.localeCompare(s.name));
}
function tt(t) {
  const e = /* @__PURE__ */ new Map();
  for (const [i, s] of Object.entries(t)) {
    if (!i.startsWith(me)) continue;
    const r = s.attributes, o = r.privilege_slug;
    if (!o) continue;
    let n = e.get(o);
    n || (n = {
      slug: o,
      name: r.privilege_name ?? o,
      icon: r.icon ?? w,
      behavior: r.behavior ?? "automatic",
      linkedChores: r.linked_chores ?? [],
      assignees: []
    }, e.set(o, n)), n.assignees.push({
      assignee: r.assignee,
      entityId: i,
      state: s.state,
      disableUntil: r.disable_until
    });
  }
  for (const i of e.values())
    i.assignees.sort((s, r) => s.assignee.localeCompare(r.assignee));
  return [...e.values()].sort((i, s) => i.name.localeCompare(s.name));
}
function it(t) {
  const e = [];
  for (const [i, s] of Object.entries(t)) {
    if (!i.startsWith(be)) continue;
    const r = s.attributes, o = r.category_slug;
    o && e.push({
      slug: o,
      name: r.category_name ?? o,
      icon: r.icon ?? E,
      entityId: i,
      choreCount: Number(s.state) || 0
    });
  }
  return e.sort((i, s) => i.name.localeCompare(s.name));
}
function st(t, e) {
  const i = /* @__PURE__ */ new Set();
  for (const s of t)
    for (const r of s.assignees) i.add(r.assignee);
  for (const s of e)
    for (const r of s.assignees) i.add(r.assignee);
  return [...i].sort((s, r) => s.localeCompare(r));
}
var rt = Object.defineProperty, ot = Object.getOwnPropertyDescriptor, b = (t, e, i, s) => {
  for (var r = s > 1 ? void 0 : s ? ot(e, i) : e, o = t.length - 1, n; o >= 0; o--)
    (n = t[o]) && (r = (s ? n(e, i, r) : n(r)) || r);
  return s && r && rt(e, i, r), r;
};
const h = "simple_chores", de = "__uncategorized__";
let _ = class extends N {
  constructor() {
    super(...arguments), this.narrow = !1, this._tab = "chores", this._dialog = null, this._busy = !1, this._error = null, this._bulkUser = "", this._categoryFilter = "", this._onOverlayClick = (t) => {
      t.target === t.currentTarget && this._closeDialog();
    }, this._dismissError = () => {
      this._error = null;
    }, this._closeDialog = () => {
      this._dialog = null;
    }, this._openCreateChore = () => {
      this._error = null, this._dialog = { kind: "chore", draft: Ge() };
    }, this._openCreatePrivilege = () => {
      this._error = null, this._dialog = { kind: "privilege", draft: Je() };
    }, this._openCreateCategory = () => {
      this._error = null, this._dialog = { kind: "category", draft: Ke() };
    };
  }
  updated(t) {
    t.has("hass") && !this.hass?.user?.is_admin && (this._error = "You must be an administrator to manage chores and privileges.");
  }
  render() {
    if (!this.hass) return d;
    const t = et(this.hass.states), e = tt(this.hass.states), i = it(this.hass.states), s = st(t, e);
    return a`
      <div class="toolbar">
        <ha-icon icon="mdi:clipboard-check-outline"></ha-icon>
        <span class="toolbar-title">Chores</span>
        ${this._busy ? a`<ha-icon class="spin" icon="mdi:loading"></ha-icon>` : d}
      </div>

      <div class="content">
        ${this._error ? a`
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
        </div>

        ${this._tab === "chores" ? this._renderChoresTab(t, i, s) : this._tab === "privileges" ? this._renderPrivilegesTab(e, t, s) : this._renderCategoriesTab(i, s)}
      </div>

      ${this._dialog ? this._renderDialog(t, i, s) : d}
    `;
  }
  // --- Chores tab ----------------------------------------------------
  _renderChoresTab(t, e, i) {
    const s = t.filter((r) => this._categoryFilter ? this._categoryFilter === de ? !r.category : r.category === this._categoryFilter : !0);
    return a`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreateChore}>
          <ha-icon icon="mdi:plus"></ha-icon> New chore
        </button>
        ${this._renderCategoryFilterPicker(e)}
        <div class="spacer"></div>
        ${this._renderBulkUserPicker(i)}
        <button @click=${() => this._resetCompleted()}>Reset completed</button>
        <button @click=${() => this._startNewDay()}>Start new day</button>
      </div>

      ${s.length === 0 ? a`<p class="empty">
            ${t.length === 0 ? "No chores yet. Create one to get started." : "No chores in this category."}
          </p>` : a`<div class="card-grid">
            ${s.map((r) => this._renderChoreCard(r, e))}
          </div>`}
    `;
  }
  _renderCategoryFilterPicker(t) {
    return a`
      <select
        class="user-picker"
        title="Filter chores by category"
        .value=${this._categoryFilter}
        @change=${(e) => this._categoryFilter = e.target.value}
      >
        <option value="">All categories</option>
        <option value=${de}>Uncategorized</option>
        ${t.map(
      (e) => a`<option value=${e.slug}>${e.name}</option>`
    )}
      </select>
    `;
  }
  _renderBulkUserPicker(t) {
    return a`
      <select
        class="user-picker"
        title="Limit Reset completed / Start new day to one assignee"
        .value=${this._bulkUser}
        @change=${(e) => this._bulkUser = e.target.value}
      >
        <option value="">All assignees</option>
        ${t.map(
      (e) => a`<option value=${e}>${e}</option>`
    )}
      </select>
    `;
  }
  _renderChoreCard(t, e) {
    const i = `${t.points} point${t.points === 1 ? "" : "s"}`, s = t.category ? e.find((r) => r.slug === t.category)?.name ?? t.category : null;
    return a`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${t.icon || A}></ha-icon>
          <div class="card-title">
            <div class="name">${t.name}</div>
            <div class="meta">
              ${t.frequency} · ${i}
              ${s ? a` · ${s}` : d}
              ${t.description ? a` · ${t.description}` : d}
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
          ${t.assignees.map(
      (r) => a`
              <div class="assignee-row">
                <span class="assignee-name">${r.assignee}</span>
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
    return a`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreatePrivilege}>
          <ha-icon icon="mdi:plus"></ha-icon> New privilege
        </button>
      </div>

      ${t.length === 0 ? a`<p class="empty">No privileges yet. Create one to get started.</p>` : a`<div class="card-grid">
            ${t.map((s) => this._renderPrivilegeCard(s, e, i))}
          </div>`}
    `;
  }
  _renderPrivilegeCard(t, e, i) {
    const s = t.linkedChores.map(
      (r) => e.find((o) => o.slug === r)?.name ?? r
    );
    return a`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${t.icon || w}></ha-icon>
          <div class="card-title">
            <div class="name">${t.name}</div>
            <div class="meta">
              ${t.behavior}
              ${s.length ? a` · linked: ${s.join(", ")}` : a` · linked: all requested chores`}
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
          ${t.assignees.map((r) => {
      const o = r.state === "Temporarily Disabled";
      return a`
              <div class="assignee-row privilege-row">
                <div class="assignee-main">
                  <span class="assignee-name">${r.assignee}</span>
                  <span class="state-chip ${this._privilegeStateClass(r.state)}">
                    ${r.state}${o && r.disableUntil ? a` (${this._formatUntil(r.disableUntil)})` : d}
                  </span>
                  ${t.behavior === "manual" ? a`
                        <div class="row-actions">
                          <button
                            class="action-chip"
                            title="Enable"
                            ?disabled=${r.state === "Enabled"}
                            @click=${() => this._call(h, "enable_privilege", {
        user: r.assignee,
        privilege_slug: t.slug
      })}
                          >
                            <ha-icon icon="mdi:check-circle-outline"></ha-icon>
                            <span>Enable</span>
                          </button>
                          <button
                            class="action-chip"
                            title="Disable"
                            ?disabled=${r.state === "Disabled"}
                            @click=${() => this._call(h, "disable_privilege", {
        user: r.assignee,
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
        o,
        () => this._adjustTemporaryDisable(t.slug, r.assignee, -60),
        () => this._addTemporaryDisable(t.slug, r.assignee, o, 60)
      )}
                  ${this._renderBlockStepper(
        "1d",
        o,
        () => this._adjustTemporaryDisable(t.slug, r.assignee, -1440),
        () => this._addTemporaryDisable(
          t.slug,
          r.assignee,
          o,
          1440
        )
      )}
                  <button
                    class="action-chip"
                    title="Clear the block now"
                    ?disabled=${!o}
                    @click=${() => this._clearTemporaryDisable(t.slug, r.assignee)}
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
    return a`
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
    return t === "Enabled" ? "state-good" : t === "Temporarily Disabled" ? "state-warn" : "state-bad";
  }
  _formatUntil(t) {
    try {
      const e = new Date(t), i = /* @__PURE__ */ new Date(), s = e.toDateString() === i.toDateString(), r = e.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
      return s ? `until ${r}` : `until ${e.toLocaleDateString()} ${r}`;
    } catch {
      return "";
    }
  }
  // --- Categories tab --------------------------------------------------
  _renderCategoriesTab(t, e) {
    return a`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreateCategory}>
          <ha-icon icon="mdi:plus"></ha-icon> New category
        </button>
        <div class="spacer"></div>
        ${this._renderBulkUserPicker(e)}
      </div>

      ${t.length === 0 ? a`<p class="empty">
            No categories yet. Create one, then assign it to chores.
          </p>` : a`<div class="card-grid">
            ${t.map((i) => this._renderCategoryCard(i))}
          </div>`}
    `;
  }
  _renderCategoryCard(t) {
    const e = `${t.choreCount} chore${t.choreCount === 1 ? "" : "s"}`;
    return a`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${t.icon || E}></ha-icon>
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
        </div>
      </div>
    `;
  }
  // --- Dialog ------------------------------------------------------------
  _renderDialog(t, e, i) {
    if (!this._dialog) return d;
    const s = this._dialog.kind, r = this._dialog.original ? "Edit" : "New", o = s === "chore" ? "chore" : s === "privilege" ? "privilege" : "category";
    return a`
      <div class="overlay" @click=${this._onOverlayClick}>
        <div class="dialog" role="dialog" aria-modal="true">
          <div class="dialog-header">
            <h2>${r} ${o}</h2>
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
    const i = this._dialog.draft, s = !!this._dialog.original, r = s ? i.slug : k(i.slug || i.name);
    return a`
      <label>
        Name
        <input
          type="text"
          .value=${i.name}
          @input=${(o) => {
      i.name = o.target.value, this.requestUpdate();
    }}
        />
      </label>

      <label>
        Slug
        <input
          type="text"
          .value=${i.slug}
          placeholder=${r || "auto-generated from name"}
          ?disabled=${s}
          @input=${(o) => {
      i.slug = o.target.value, this.requestUpdate();
    }}
        />
        ${s ? d : a`<span class="hint">Will be saved as "${r}"</span>`}
      </label>

      <label>
        Description
        <input
          type="text"
          .value=${i.description}
          @input=${(o) => {
      i.description = o.target.value, this.requestUpdate();
    }}
        />
      </label>

      <div class="form-row">
        <label>
          Frequency
          <select
            .value=${i.frequency}
            @change=${(o) => {
      i.frequency = o.target.value, this.requestUpdate();
    }}
          >
            ${Ve.map(
      (o) => a`<option value=${o}>${o}</option>`
    )}
          </select>
        </label>

        <label>
          Points
          <input
            type="number"
            min="0"
            .value=${String(i.points)}
            @input=${(o) => {
      i.points = Number(o.target.value) || 0, this.requestUpdate();
    }}
          />
        </label>
      </div>

      <label>
        Category
        <select
          .value=${i.category}
          @change=${(o) => {
      i.category = o.target.value, this.requestUpdate();
    }}
        >
          <option value=${J}>Uncategorized</option>
          ${t.map(
      (o) => a`<option value=${o.slug}>${o.name}</option>`
    )}
        </select>
      </label>

      ${this._renderIconField(i.icon, A, (o) => {
      i.icon = o, this.requestUpdate();
    })}

      ${this._renderAssigneeEditor(i, e)}
    `;
  }
  _renderPrivilegeForm(t, e) {
    const i = this._dialog.draft, s = !!this._dialog.original, r = s ? i.slug : k(i.slug || i.name);
    return a`
      <label>
        Name
        <input
          type="text"
          .value=${i.name}
          @input=${(o) => {
      i.name = o.target.value, this.requestUpdate();
    }}
        />
      </label>

      <label>
        Slug
        <input
          type="text"
          .value=${i.slug}
          placeholder=${r || "auto-generated from name"}
          ?disabled=${s}
          @input=${(o) => {
      i.slug = o.target.value, this.requestUpdate();
    }}
        />
        ${s ? d : a`<span class="hint">Will be saved as "${r}"</span>`}
      </label>

      <label>
        Behavior
        <select
          .value=${i.behavior}
          @change=${(o) => {
      i.behavior = o.target.value, this.requestUpdate();
    }}
        >
          ${Ye.map(
      (o) => a`<option value=${o}>${o}</option>`
    )}
        </select>
        <span class="hint"
          >Automatic privileges turn on when their linked chores are
          complete. Manual ones are only toggled by an admin.</span
        >
      </label>

      ${this._renderIconField(i.icon, w, (o) => {
      i.icon = o, this.requestUpdate();
    })}

      <label>
        Linked chores
        <span class="hint"
          >Leave all unchecked to require every requested chore to be
          complete instead of a specific list.</span
        >
        <div class="checkbox-list">
          ${t.length === 0 ? a`<span class="hint">No chores defined yet.</span>` : t.map(
      (o) => a`
                  <label class="checkbox-item">
                    <input
                      type="checkbox"
                      .checked=${i.linkedChores.includes(o.slug)}
                      @change=${(n) => {
        const c = n.target.checked;
        i.linkedChores = c ? [...i.linkedChores, o.slug] : i.linkedChores.filter((l) => l !== o.slug), this.requestUpdate();
      }}
                    />
                    ${o.name}
                  </label>
                `
    )}
        </div>
      </label>

      ${this._renderAssigneeEditor(i, e)}
    `;
  }
  _renderCategoryForm() {
    const t = this._dialog.draft, e = !!this._dialog.original, i = e ? t.slug : k(t.slug || t.name);
    return a`
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
          ?disabled=${e}
          @input=${(s) => {
      t.slug = s.target.value, this.requestUpdate();
    }}
        />
        ${e ? d : a`<span class="hint">Will be saved as "${i}"</span>`}
      </label>

      ${this._renderIconField(t.icon, E, (s) => {
      t.icon = s, this.requestUpdate();
    })}
    `;
  }
  _renderIconField(t, e, i) {
    return a`
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
    return a`
      <label>
        Assignees
        <div class="chip-list">
          ${t.assignees.map(
      (i) => a`
              <span class="chip">
                ${i}
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
        ${e.map((i) => a`<option value=${i}></option>`)}
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
      draft: Ze(t)
    };
  }
  _openEditPrivilege(t) {
    this._error = null, this._dialog = {
      kind: "privilege",
      original: t.slug,
      draft: Qe(t)
    };
  }
  _openEditCategory(t) {
    this._error = null, this._dialog = {
      kind: "category",
      original: t.slug,
      draft: Xe(t)
    };
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
    return this._call(h, i, { chore_slug: t, user: e });
  }
  _resetCompleted() {
    const t = this._bulkUser ? { user: this._bulkUser } : {};
    return this._call(h, "reset_completed", t);
  }
  _startNewDay() {
    const t = this._bulkUser ? { user: this._bulkUser } : {};
    return this._call(h, "start_new_day", t);
  }
  _categoryAction(t, e) {
    const i = {
      category_slug: t,
      ...this._bulkUser ? { user: this._bulkUser } : {}
    };
    return this._call(h, e, i);
  }
  async _deleteChore(t) {
    const e = t.assignees.map((i) => i.assignee).join(", ");
    confirm(
      `Delete "${t.name}"? This removes it for every assignee (${e}).`
    ) && await this._call(h, "delete_chore", { slug: t.slug });
  }
  async _deletePrivilege(t) {
    const e = t.assignees.map((i) => i.assignee).join(", ");
    confirm(
      `Delete "${t.name}"? This removes it for every assignee (${e}).`
    ) && await this._call(h, "delete_privilege", { slug: t.slug });
  }
  async _deleteCategory(t) {
    confirm(
      `Delete "${t.name}"? Chores must be uncategorized or reassigned first.`
    ) && await this._call(h, "delete_category", { slug: t.slug });
  }
  _addTemporaryDisable(t, e, i, s) {
    return i ? this._call(h, "adjust_temporary_disable", {
      user: e,
      privilege_slug: t,
      adjustment: s
    }) : this._call(h, "temporarily_disable_privilege", {
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
    return this._call(h, "adjust_temporary_disable", {
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
    return this._call(h, "clear_temporary_disable", {
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
    (t.original ? await this._call(h, "update_chore", {
      slug: t.original,
      name: e.name,
      description: e.description,
      frequency: e.frequency,
      assignees: i,
      icon: e.icon || A,
      points: e.points,
      category: e.category
    }) : await this._call(h, "create_chore", {
      name: e.name,
      slug: k(e.slug || e.name),
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
    (t.original ? await this._call(h, "update_category", {
      slug: t.original,
      name: e.name,
      icon: e.icon || E
    }) : await this._call(h, "create_category", {
      name: e.name,
      slug: k(e.slug || e.name),
      icon: e.icon || E
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
    (t.original ? await this._call(h, "update_privilege", {
      slug: t.original,
      name: e.name,
      icon: e.icon || w,
      behavior: e.behavior,
      linked_chores: s,
      assignees: i
    }) : await this._call(h, "create_privilege", {
      name: e.name,
      slug: k(e.slug || e.name),
      icon: e.icon || w,
      behavior: e.behavior,
      linked_chores: s,
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
  X({ attribute: !1 })
], _.prototype, "hass", 2);
b([
  X({ type: Boolean })
], _.prototype, "narrow", 2);
b([
  U()
], _.prototype, "_tab", 2);
b([
  U()
], _.prototype, "_dialog", 2);
b([
  U()
], _.prototype, "_busy", 2);
b([
  U()
], _.prototype, "_error", 2);
b([
  U()
], _.prototype, "_bulkUser", 2);
b([
  U()
], _.prototype, "_categoryFilter", 2);
_ = b([
  He("simple-chores-panel")
], _);
