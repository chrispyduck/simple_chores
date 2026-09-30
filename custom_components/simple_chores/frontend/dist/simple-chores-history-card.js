/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const M = globalThis, j = M.ShadowRoot && (M.ShadyCSS === void 0 || M.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, I = Symbol(), K = /* @__PURE__ */ new WeakMap();
let rt = class {
  constructor(t, e, s) {
    if (this._$cssResult$ = !0, s !== I) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (j && t === void 0) {
      const s = e !== void 0 && e.length === 1;
      s && (t = K.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), s && K.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const ct = (i) => new rt(typeof i == "string" ? i : i + "", void 0, I), dt = (i, ...t) => {
  const e = i.length === 1 ? i[0] : t.reduce((s, r, o) => s + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + i[o + 1], i[0]);
  return new rt(e, i, I);
}, pt = (i, t) => {
  if (j) i.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const s = document.createElement("style"), r = M.litNonce;
    r !== void 0 && s.setAttribute("nonce", r), s.textContent = e.cssText, i.appendChild(s);
  }
}, Z = j ? (i) => i : (i) => i instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const s of t.cssRules) e += s.cssText;
  return ct(e);
})(i) : i;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: ut, defineProperty: ft, getOwnPropertyDescriptor: $t, getOwnPropertyNames: _t, getOwnPropertySymbols: mt, getPrototypeOf: gt } = Object, R = globalThis, F = R.trustedTypes, vt = F ? F.emptyScript : "", yt = R.reactiveElementPolyfillSupport, C = (i, t) => i, D = { toAttribute(i, t) {
  switch (t) {
    case Boolean:
      i = i ? vt : null;
      break;
    case Object:
    case Array:
      i = i == null ? i : JSON.stringify(i);
  }
  return i;
}, fromAttribute(i, t) {
  let e = i;
  switch (t) {
    case Boolean:
      e = i !== null;
      break;
    case Number:
      e = i === null ? null : Number(i);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(i);
      } catch {
        e = null;
      }
  }
  return e;
} }, B = (i, t) => !ut(i, t), J = { attribute: !0, type: String, converter: D, reflect: !1, useDefault: !1, hasChanged: B };
Symbol.metadata ??= Symbol("metadata"), R.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let A = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = J) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const s = Symbol(), r = this.getPropertyDescriptor(t, s, e);
      r !== void 0 && ft(this.prototype, t, r);
    }
  }
  static getPropertyDescriptor(t, e, s) {
    const { get: r, set: o } = $t(this.prototype, t) ?? { get() {
      return this[e];
    }, set(n) {
      this[e] = n;
    } };
    return { get: r, set(n) {
      const l = r?.call(this);
      o?.call(this, n), this.requestUpdate(t, l, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? J;
  }
  static _$Ei() {
    if (this.hasOwnProperty(C("elementProperties"))) return;
    const t = gt(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(C("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(C("properties"))) {
      const e = this.properties, s = [..._t(e), ...mt(e)];
      for (const r of s) this.createProperty(r, e[r]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [s, r] of e) this.elementProperties.set(s, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, s] of this.elementProperties) {
      const r = this._$Eu(e, s);
      r !== void 0 && this._$Eh.set(r, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const s = new Set(t.flat(1 / 0).reverse());
      for (const r of s) e.unshift(Z(r));
    } else t !== void 0 && e.push(Z(t));
    return e;
  }
  static _$Eu(t, e) {
    const s = e.attribute;
    return s === !1 ? void 0 : typeof s == "string" ? s : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
  }
  addController(t) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t), this.renderRoot !== void 0 && this.isConnected && t.hostConnected?.();
  }
  removeController(t) {
    this._$EO?.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const s of e.keys()) this.hasOwnProperty(s) && (t.set(s, this[s]), delete this[s]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return pt(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t) => t.hostDisconnected?.());
  }
  attributeChangedCallback(t, e, s) {
    this._$AK(t, s);
  }
  _$ET(t, e) {
    const s = this.constructor.elementProperties.get(t), r = this.constructor._$Eu(t, s);
    if (r !== void 0 && s.reflect === !0) {
      const o = (s.converter?.toAttribute !== void 0 ? s.converter : D).toAttribute(e, s.type);
      this._$Em = t, o == null ? this.removeAttribute(r) : this.setAttribute(r, o), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const s = this.constructor, r = s._$Eh.get(t);
    if (r !== void 0 && this._$Em !== r) {
      const o = s.getPropertyOptions(r), n = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : D;
      this._$Em = r;
      const l = n.fromAttribute(e, o.type);
      this[r] = l ?? this._$Ej?.get(r) ?? l, this._$Em = null;
    }
  }
  requestUpdate(t, e, s, r = !1, o) {
    if (t !== void 0) {
      const n = this.constructor;
      if (r === !1 && (o = this[t]), s ??= n.getPropertyOptions(t), !((s.hasChanged ?? B)(o, e) || s.useDefault && s.reflect && o === this._$Ej?.get(t) && !this.hasAttribute(n._$Eu(t, s)))) return;
      this.C(t, e, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: s, reflect: r, wrapped: o }, n) {
    s && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, n ?? e ?? this[t]), o !== !0 || n !== void 0) || (this._$AL.has(t) || (this.hasUpdated || s || (e = void 0), this._$AL.set(t, e)), r === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
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
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), this._$EO?.forEach((s) => s.hostUpdate?.()), this.update(e)) : this._$EM();
    } catch (s) {
      throw t = !1, this._$EM(), s;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
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
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
A.elementStyles = [], A.shadowRootOptions = { mode: "open" }, A[C("elementProperties")] = /* @__PURE__ */ new Map(), A[C("finalized")] = /* @__PURE__ */ new Map(), yt?.({ ReactiveElement: A }), (R.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const q = globalThis, Y = (i) => i, H = q.trustedTypes, G = H ? H.createPolicy("lit-html", { createHTML: (i) => i }) : void 0, ot = "$lit$", $ = `lit$${Math.random().toFixed(9).slice(2)}$`, nt = "?" + $, At = `<${nt}>`, y = document, P = () => y.createComment(""), T = (i) => i === null || typeof i != "object" && typeof i != "function", W = Array.isArray, wt = (i) => W(i) || typeof i?.[Symbol.iterator] == "function", L = `[ 	
\f\r]`, S = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Q = /-->/g, X = />/g, m = RegExp(`>|${L}(?:([^\\s"'>=/]+)(${L}*=${L}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), tt = /'/g, et = /"/g, at = /^(?:script|style|textarea|title)$/i, bt = (i) => (t, ...e) => ({ _$litType$: i, strings: t, values: e }), g = bt(1), w = Symbol.for("lit-noChange"), c = Symbol.for("lit-nothing"), st = /* @__PURE__ */ new WeakMap(), v = y.createTreeWalker(y, 129);
function lt(i, t) {
  if (!W(i) || !i.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return G !== void 0 ? G.createHTML(t) : t;
}
const Et = (i, t) => {
  const e = i.length - 1, s = [];
  let r, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", n = S;
  for (let l = 0; l < e; l++) {
    const a = i[l];
    let d, p, h = -1, u = 0;
    for (; u < a.length && (n.lastIndex = u, p = n.exec(a), p !== null); ) u = n.lastIndex, n === S ? p[1] === "!--" ? n = Q : p[1] !== void 0 ? n = X : p[2] !== void 0 ? (at.test(p[2]) && (r = RegExp("</" + p[2], "g")), n = m) : p[3] !== void 0 && (n = m) : n === m ? p[0] === ">" ? (n = r ?? S, h = -1) : p[1] === void 0 ? h = -2 : (h = n.lastIndex - p[2].length, d = p[1], n = p[3] === void 0 ? m : p[3] === '"' ? et : tt) : n === et || n === tt ? n = m : n === Q || n === X ? n = S : (n = m, r = void 0);
    const f = n === m && i[l + 1].startsWith("/>") ? " " : "";
    o += n === S ? a + At : h >= 0 ? (s.push(d), a.slice(0, h) + ot + a.slice(h) + $ + f) : a + $ + (h === -2 ? l : f);
  }
  return [lt(i, o + (i[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), s];
};
class U {
  constructor({ strings: t, _$litType$: e }, s) {
    let r;
    this.parts = [];
    let o = 0, n = 0;
    const l = t.length - 1, a = this.parts, [d, p] = Et(t, e);
    if (this.el = U.createElement(d, s), v.currentNode = this.el.content, e === 2 || e === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (r = v.nextNode()) !== null && a.length < l; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const h of r.getAttributeNames()) if (h.endsWith(ot)) {
          const u = p[n++], f = r.getAttribute(h).split($), O = /([.?@])?(.*)/.exec(u);
          a.push({ type: 1, index: o, name: O[2], strings: f, ctor: O[1] === "." ? Ct : O[1] === "?" ? xt : O[1] === "@" ? Pt : k }), r.removeAttribute(h);
        } else h.startsWith($) && (a.push({ type: 6, index: o }), r.removeAttribute(h));
        if (at.test(r.tagName)) {
          const h = r.textContent.split($), u = h.length - 1;
          if (u > 0) {
            r.textContent = H ? H.emptyScript : "";
            for (let f = 0; f < u; f++) r.append(h[f], P()), v.nextNode(), a.push({ type: 2, index: ++o });
            r.append(h[u], P());
          }
        }
      } else if (r.nodeType === 8) if (r.data === nt) a.push({ type: 2, index: o });
      else {
        let h = -1;
        for (; (h = r.data.indexOf($, h + 1)) !== -1; ) a.push({ type: 7, index: o }), h += $.length - 1;
      }
      o++;
    }
  }
  static createElement(t, e) {
    const s = y.createElement("template");
    return s.innerHTML = t, s;
  }
}
function b(i, t, e = i, s) {
  if (t === w) return t;
  let r = s !== void 0 ? e._$Co?.[s] : e._$Cl;
  const o = T(t) ? void 0 : t._$litDirective$;
  return r?.constructor !== o && (r?._$AO?.(!1), o === void 0 ? r = void 0 : (r = new o(i), r._$AT(i, e, s)), s !== void 0 ? (e._$Co ??= [])[s] = r : e._$Cl = r), r !== void 0 && (t = b(i, r._$AS(i, t.values), r, s)), t;
}
class St {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: s } = this._$AD, r = (t?.creationScope ?? y).importNode(e, !0);
    v.currentNode = r;
    let o = v.nextNode(), n = 0, l = 0, a = s[0];
    for (; a !== void 0; ) {
      if (n === a.index) {
        let d;
        a.type === 2 ? d = new N(o, o.nextSibling, this, t) : a.type === 1 ? d = new a.ctor(o, a.name, a.strings, this, t) : a.type === 6 && (d = new Tt(o, this, t)), this._$AV.push(d), a = s[++l];
      }
      n !== a?.index && (o = v.nextNode(), n++);
    }
    return v.currentNode = y, r;
  }
  p(t) {
    let e = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(t, s, e), e += s.strings.length - 2) : s._$AI(t[e])), e++;
  }
}
class N {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, e, s, r) {
    this.type = 2, this._$AH = c, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = s, this.options = r, this._$Cv = r?.isConnected ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && t?.nodeType === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = b(this, t, e), T(t) ? t === c || t == null || t === "" ? (this._$AH !== c && this._$AR(), this._$AH = c) : t !== this._$AH && t !== w && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : wt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== c && T(this._$AH) ? this._$AA.nextSibling.data = t : this.T(y.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: s } = t, r = typeof s == "number" ? this._$AC(t) : (s.el === void 0 && (s.el = U.createElement(lt(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === r) this._$AH.p(e);
    else {
      const o = new St(r, this), n = o.u(this.options);
      o.p(e), this.T(n), this._$AH = o;
    }
  }
  _$AC(t) {
    let e = st.get(t.strings);
    return e === void 0 && st.set(t.strings, e = new U(t)), e;
  }
  k(t) {
    W(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let s, r = 0;
    for (const o of t) r === e.length ? e.push(s = new N(this.O(P()), this.O(P()), this, this.options)) : s = e[r], s._$AI(o), r++;
    r < e.length && (this._$AR(s && s._$AB.nextSibling, r), e.length = r);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    for (this._$AP?.(!1, !0, e); t !== this._$AB; ) {
      const s = Y(t).nextSibling;
      Y(t).remove(), t = s;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class k {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, s, r, o) {
    this.type = 1, this._$AH = c, this._$AN = void 0, this.element = t, this.name = e, this._$AM = r, this.options = o, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = c;
  }
  _$AI(t, e = this, s, r) {
    const o = this.strings;
    let n = !1;
    if (o === void 0) t = b(this, t, e, 0), n = !T(t) || t !== this._$AH && t !== w, n && (this._$AH = t);
    else {
      const l = t;
      let a, d;
      for (t = o[0], a = 0; a < o.length - 1; a++) d = b(this, l[s + a], e, a), d === w && (d = this._$AH[a]), n ||= !T(d) || d !== this._$AH[a], d === c ? t = c : t !== c && (t += (d ?? "") + o[a + 1]), this._$AH[a] = d;
    }
    n && !r && this.j(t);
  }
  j(t) {
    t === c ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Ct extends k {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === c ? void 0 : t;
  }
}
class xt extends k {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== c);
  }
}
class Pt extends k {
  constructor(t, e, s, r, o) {
    super(t, e, s, r, o), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = b(this, t, e, 0) ?? c) === w) return;
    const s = this._$AH, r = t === c && s !== c || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, o = t !== c && (s === c || r);
    r && this.element.removeEventListener(this.name, this, s), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Tt {
  constructor(t, e, s) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    b(this, t);
  }
}
const Ut = q.litHtmlPolyfillSupport;
Ut?.(U, N), (q.litHtmlVersions ??= []).push("3.3.3");
const Nt = (i, t, e) => {
  const s = e?.renderBefore ?? t;
  let r = s._$litPart$;
  if (r === void 0) {
    const o = e?.renderBefore ?? null;
    s._$litPart$ = r = new N(t.insertBefore(P(), o), o, void 0, e ?? {});
  }
  return r._$AI(i), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const V = globalThis;
class x extends A {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Nt(e, this.renderRoot, this.renderOptions);
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
x._$litElement$ = !0, x.finalized = !0, V.litElementHydrateSupport?.({ LitElement: x });
const Ot = V.litElementPolyfillSupport;
Ot?.({ LitElement: x });
(V.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Mt = (i) => (t, e) => {
  e !== void 0 ? e.addInitializer(() => {
    customElements.define(i, t);
  }) : customElements.define(i, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Dt = { attribute: !0, type: String, converter: D, reflect: !1, hasChanged: B }, Ht = (i = Dt, t, e) => {
  const { kind: s, metadata: r } = e;
  let o = globalThis.litPropertyMetadata.get(r);
  if (o === void 0 && globalThis.litPropertyMetadata.set(r, o = /* @__PURE__ */ new Map()), s === "setter" && ((i = Object.create(i)).wrapped = !0), o.set(e.name, i), s === "accessor") {
    const { name: n } = e;
    return { set(l) {
      const a = t.get.call(this);
      t.set.call(this, l), this.requestUpdate(n, a, i, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(n, void 0, i, l), l;
    } };
  }
  if (s === "setter") {
    const { name: n } = e;
    return function(l) {
      const a = this[n];
      t.call(this, l), this.requestUpdate(n, a, i, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function ht(i) {
  return (t, e) => typeof e == "object" ? Ht(i, t, e) : ((s, r, o) => {
    const n = r.hasOwnProperty(o);
    return r.constructor.createProperty(o, s), n ? Object.getOwnPropertyDescriptor(r, o) : void 0;
  })(i, t, e);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function z(i) {
  return ht({ ...i, state: !0, attribute: !1 });
}
const Rt = "simple_chores";
function kt(i) {
  return i ? i.map((t) => ({
    id: t.id,
    timestamp: t.timestamp,
    action: t.action,
    choreSlug: t.chore_slug,
    choreName: t.chore_name ?? t.chore_slug,
    category: t.category ?? null,
    assignee: t.assignee,
    pointsDelta: t.points_delta ?? 0,
    pointsTotal: t.points_total ?? 0,
    pointsMissed: t.points_missed ?? 0,
    missedTotal: t.missed_total ?? null
  })) : [];
}
function zt(i) {
  switch (i) {
    case "completed":
      return "Completed";
    case "uncompleted":
      return "Un-completed";
    case "reset":
      return "Reset";
    case "missed":
      return "Missed";
    default:
      return i;
  }
}
function Lt(i) {
  return i === "completed" ? "state-good" : i === "uncompleted" ? "state-bad" : i === "missed" ? "state-warn" : "state-neutral";
}
var jt = Object.defineProperty, It = Object.getOwnPropertyDescriptor, E = (i, t, e, s) => {
  for (var r = s > 1 ? void 0 : s ? It(t, e) : t, o = i.length - 1, n; o >= 0; o--)
    (n = i[o]) && (r = (s ? n(t, e, r) : n(r)) || r);
  return s && r && jt(t, e, r), r;
};
const it = 7, Bt = 1440 * 60 * 1e3;
let _ = class extends x {
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
    return 1 + Math.min(this._config?.days ?? it, 10);
  }
  static getStubConfig() {
    return { assignee: "" };
  }
  async _loadHistory() {
    this._loading = !0;
    try {
      const i = await this.hass.callWS({
        type: "call_service",
        domain: Rt,
        service: "get_history",
        service_data: {},
        return_response: !0
      });
      this._entries = kt(i?.response?.entries);
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
    if (!this._config) return c;
    const i = this._config.days ?? it, t = Date.now() - i * Bt, e = (this._entries ?? []).filter(
      (s) => s.assignee === this._config.assignee && this._actionEnabled(s.action) && new Date(s.timestamp).getTime() >= t
    ).sort((s, r) => r.timestamp.localeCompare(s.timestamp));
    return g`
      <ha-card header=${this._config.title ?? c}>
        <div class="card-content">
          ${this._error ? g`<p class="error">${this._error}</p>` : this._entries === null ? g`<p class="empty">Loading&hellip;</p>` : e.length === 0 ? g`<p class="empty">Nothing to show yet.</p>` : this._renderTable(e)}
        </div>
      </ha-card>
    `;
  }
  _renderTable(i) {
    const t = [];
    let e = null;
    for (const s of i) {
      const r = this._dateKey(s.timestamp);
      r !== e && (t.push(
        g`<div class="date-header">${this._formatDate(s.timestamp)}</div>`
      ), e = r), t.push(this._renderRow(s));
    }
    return g`
      <div class="table">
        <div class="row col-header">
          <div class="cell time">Time</div>
          <div class="cell event">Event</div>
          <div class="cell chore">Chore</div>
          <div class="cell col-span-header">Earned</div>
          <div class="cell col-span-header">Missed</div>
        </div>
        ${t}
      </div>
    `;
  }
  _renderRow(i) {
    const t = i.pointsDelta > 0 ? "points-positive" : i.pointsDelta < 0 ? "points-negative" : "", e = i.pointsDelta > 0 ? `+${i.pointsDelta}` : i.pointsDelta;
    return g`
      <div class="row">
        <div class="cell time">${this._formatTime(i.timestamp)}</div>
        <div class="cell event">
          <span class="state-chip ${Lt(i.action)}">
            ${zt(i.action)}
          </span>
        </div>
        <div class="cell chore">${i.choreName}</div>
        <div class="cell delta ${t}">
          ${i.pointsDelta !== 0 ? e : c}
        </div>
        <div class="cell earned">${i.pointsTotal}</div>
        <div class="cell delta points-negative">
          ${i.pointsMissed > 0 ? `+${i.pointsMissed}` : c}
        </div>
        <div class="cell missed">${i.missedTotal ?? "—"}</div>
      </div>
    `;
  }
  /** Grouping key only - not for display, so locale/format changes can't split a day. */
  _dateKey(i) {
    const t = new Date(i);
    return Number.isNaN(t.getTime()) ? i : t.toDateString();
  }
  _formatDate(i) {
    const t = new Date(i);
    return Number.isNaN(t.getTime()) ? i : t.toLocaleDateString(void 0, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }
  _formatTime(i) {
    const t = new Date(i);
    return Number.isNaN(t.getTime()) ? i : t.toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit" });
  }
};
_.styles = dt`
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
E([
  ht({ attribute: !1 })
], _.prototype, "hass", 2);
E([
  z()
], _.prototype, "_config", 2);
E([
  z()
], _.prototype, "_entries", 2);
E([
  z()
], _.prototype, "_error", 2);
E([
  z()
], _.prototype, "_loading", 2);
_ = E([
  Mt("simple-chores-history-card")
], _);
window.customCards = window.customCards ?? [];
window.customCards.push({
  type: "simple-chores-history-card",
  name: "Chore History",
  description: "Shows one assignee's recent Simple Chores activity.",
  preview: !1
});
