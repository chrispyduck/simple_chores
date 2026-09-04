/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const j = globalThis, F = j.ShadowRoot && (j.ShadyCSS === void 0 || j.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, W = Symbol(), Z = /* @__PURE__ */ new WeakMap();
let le = class {
  constructor(e, t, s) {
    if (this._$cssResult$ = !0, s !== W) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (F && e === void 0) {
      const s = t !== void 0 && t.length === 1;
      s && (e = Z.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), s && Z.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const ge = (i) => new le(typeof i == "string" ? i : i + "", void 0, W), fe = (i, ...e) => {
  const t = i.length === 1 ? i[0] : e.reduce((s, r, o) => s + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + i[o + 1], i[0]);
  return new le(t, i, W);
}, be = (i, e) => {
  if (F) i.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const s = document.createElement("style"), r = j.litNonce;
    r !== void 0 && s.setAttribute("nonce", r), s.textContent = t.cssText, i.appendChild(s);
  }
}, J = F ? (i) => i : (i) => i instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const s of e.cssRules) t += s.cssText;
  return ge(t);
})(i) : i;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: me, defineProperty: _e, getOwnPropertyDescriptor: $e, getOwnPropertyNames: ve, getOwnPropertySymbols: ye, getPrototypeOf: xe } = Object, H = globalThis, Q = H.trustedTypes, we = Q ? Q.emptyScript : "", Ae = H.reactiveElementPolyfillSupport, P = (i, e) => i, z = { toAttribute(i, e) {
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
} }, V = (i, e) => !me(i, e), ee = { attribute: !0, type: String, converter: z, reflect: !1, useDefault: !1, hasChanged: V };
Symbol.metadata ??= Symbol("metadata"), H.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let w = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = ee) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const s = Symbol(), r = this.getPropertyDescriptor(e, s, t);
      r !== void 0 && _e(this.prototype, e, r);
    }
  }
  static getPropertyDescriptor(e, t, s) {
    const { get: r, set: o } = $e(this.prototype, e) ?? { get() {
      return this[t];
    }, set(n) {
      this[t] = n;
    } };
    return { get: r, set(n) {
      const c = r?.call(this);
      o?.call(this, n), this.requestUpdate(e, c, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? ee;
  }
  static _$Ei() {
    if (this.hasOwnProperty(P("elementProperties"))) return;
    const e = xe(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(P("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(P("properties"))) {
      const t = this.properties, s = [...ve(t), ...ye(t)];
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
      for (const r of s) t.unshift(J(r));
    } else e !== void 0 && t.push(J(e));
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
    return be(e, this.constructor.elementStyles), e;
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
      const o = (s.converter?.toAttribute !== void 0 ? s.converter : z).toAttribute(t, s.type);
      this._$Em = e, o == null ? this.removeAttribute(r) : this.setAttribute(r, o), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const s = this.constructor, r = s._$Eh.get(e);
    if (r !== void 0 && this._$Em !== r) {
      const o = s.getPropertyOptions(r), n = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : z;
      this._$Em = r;
      const c = n.fromAttribute(t, o.type);
      this[r] = c ?? this._$Ej?.get(r) ?? c, this._$Em = null;
    }
  }
  requestUpdate(e, t, s, r = !1, o) {
    if (e !== void 0) {
      const n = this.constructor;
      if (r === !1 && (o = this[e]), s ??= n.getPropertyOptions(e), !((s.hasChanged ?? V)(o, t) || s.useDefault && s.reflect && o === this._$Ej?.get(e) && !this.hasAttribute(n._$Eu(e, s)))) return;
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
        const { wrapped: n } = o, c = this[r];
        n !== !0 || this._$AL.has(r) || c === void 0 || this.C(r, void 0, o, c);
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
w.elementStyles = [], w.shadowRootOptions = { mode: "open" }, w[P("elementProperties")] = /* @__PURE__ */ new Map(), w[P("finalized")] = /* @__PURE__ */ new Map(), Ae?.({ ReactiveElement: w }), (H.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Y = globalThis, te = (i) => i, I = Y.trustedTypes, ie = I ? I.createPolicy("lit-html", { createHTML: (i) => i }) : void 0, ce = "$lit$", _ = `lit$${Math.random().toFixed(9).slice(2)}$`, de = "?" + _, ke = `<${de}>`, x = document, T = () => x.createComment(""), D = (i) => i === null || typeof i != "object" && typeof i != "function", K = Array.isArray, Ee = (i) => K(i) || typeof i?.[Symbol.iterator] == "function", B = `[ 	
\f\r]`, S = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, se = /-->/g, re = />/g, v = RegExp(`>|${B}(?:([^\\s"'>=/]+)(${B}*=${B}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), oe = /'/g, ne = /"/g, pe = /^(?:script|style|textarea|title)$/i, Ce = (i) => (e, ...t) => ({ _$litType$: i, strings: e, values: t }), l = Ce(1), E = Symbol.for("lit-noChange"), d = Symbol.for("lit-nothing"), ae = /* @__PURE__ */ new WeakMap(), y = x.createTreeWalker(x, 129);
function he(i, e) {
  if (!K(i) || !i.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ie !== void 0 ? ie.createHTML(e) : e;
}
const Se = (i, e) => {
  const t = i.length - 1, s = [];
  let r, o = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", n = S;
  for (let c = 0; c < t; c++) {
    const a = i[c];
    let h, u, p = -1, b = 0;
    for (; b < a.length && (n.lastIndex = b, u = n.exec(a), u !== null); ) b = n.lastIndex, n === S ? u[1] === "!--" ? n = se : u[1] !== void 0 ? n = re : u[2] !== void 0 ? (pe.test(u[2]) && (r = RegExp("</" + u[2], "g")), n = v) : u[3] !== void 0 && (n = v) : n === v ? u[0] === ">" ? (n = r ?? S, p = -1) : u[1] === void 0 ? p = -2 : (p = n.lastIndex - u[2].length, h = u[1], n = u[3] === void 0 ? v : u[3] === '"' ? ne : oe) : n === ne || n === oe ? n = v : n === se || n === re ? n = S : (n = v, r = void 0);
    const m = n === v && i[c + 1].startsWith("/>") ? " " : "";
    o += n === S ? a + ke : p >= 0 ? (s.push(h), a.slice(0, p) + ce + a.slice(p) + _ + m) : a + _ + (p === -2 ? c : m);
  }
  return [he(i, o + (i[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), s];
};
class O {
  constructor({ strings: e, _$litType$: t }, s) {
    let r;
    this.parts = [];
    let o = 0, n = 0;
    const c = e.length - 1, a = this.parts, [h, u] = Se(e, t);
    if (this.el = O.createElement(h, s), y.currentNode = this.el.content, t === 2 || t === 3) {
      const p = this.el.content.firstChild;
      p.replaceWith(...p.childNodes);
    }
    for (; (r = y.nextNode()) !== null && a.length < c; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const p of r.getAttributeNames()) if (p.endsWith(ce)) {
          const b = u[n++], m = r.getAttribute(p).split(_), q = /([.?@])?(.*)/.exec(b);
          a.push({ type: 1, index: o, name: q[2], strings: m, ctor: q[1] === "." ? Ue : q[1] === "?" ? Te : q[1] === "@" ? De : L }), r.removeAttribute(p);
        } else p.startsWith(_) && (a.push({ type: 6, index: o }), r.removeAttribute(p));
        if (pe.test(r.tagName)) {
          const p = r.textContent.split(_), b = p.length - 1;
          if (b > 0) {
            r.textContent = I ? I.emptyScript : "";
            for (let m = 0; m < b; m++) r.append(p[m], T()), y.nextNode(), a.push({ type: 2, index: ++o });
            r.append(p[b], T());
          }
        }
      } else if (r.nodeType === 8) if (r.data === de) a.push({ type: 2, index: o });
      else {
        let p = -1;
        for (; (p = r.data.indexOf(_, p + 1)) !== -1; ) a.push({ type: 7, index: o }), p += _.length - 1;
      }
      o++;
    }
  }
  static createElement(e, t) {
    const s = x.createElement("template");
    return s.innerHTML = e, s;
  }
}
function C(i, e, t = i, s) {
  if (e === E) return e;
  let r = s !== void 0 ? t._$Co?.[s] : t._$Cl;
  const o = D(e) ? void 0 : e._$litDirective$;
  return r?.constructor !== o && (r?._$AO?.(!1), o === void 0 ? r = void 0 : (r = new o(i), r._$AT(i, t, s)), s !== void 0 ? (t._$Co ??= [])[s] = r : t._$Cl = r), r !== void 0 && (e = C(i, r._$AS(i, e.values), r, s)), e;
}
class Pe {
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
    const { el: { content: t }, parts: s } = this._$AD, r = (e?.creationScope ?? x).importNode(t, !0);
    y.currentNode = r;
    let o = y.nextNode(), n = 0, c = 0, a = s[0];
    for (; a !== void 0; ) {
      if (n === a.index) {
        let h;
        a.type === 2 ? h = new N(o, o.nextSibling, this, e) : a.type === 1 ? h = new a.ctor(o, a.name, a.strings, this, e) : a.type === 6 && (h = new Oe(o, this, e)), this._$AV.push(h), a = s[++c];
      }
      n !== a?.index && (o = y.nextNode(), n++);
    }
    return y.currentNode = x, r;
  }
  p(e) {
    let t = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(e, s, t), t += s.strings.length - 2) : s._$AI(e[t])), t++;
  }
}
class N {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, t, s, r) {
    this.type = 2, this._$AH = d, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = s, this.options = r, this._$Cv = r?.isConnected ?? !0;
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
    e = C(this, e, t), D(e) ? e === d || e == null || e === "" ? (this._$AH !== d && this._$AR(), this._$AH = d) : e !== this._$AH && e !== E && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Ee(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== d && D(this._$AH) ? this._$AA.nextSibling.data = e : this.T(x.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: t, _$litType$: s } = e, r = typeof s == "number" ? this._$AC(e) : (s.el === void 0 && (s.el = O.createElement(he(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === r) this._$AH.p(t);
    else {
      const o = new Pe(r, this), n = o.u(this.options);
      o.p(t), this.T(n), this._$AH = o;
    }
  }
  _$AC(e) {
    let t = ae.get(e.strings);
    return t === void 0 && ae.set(e.strings, t = new O(e)), t;
  }
  k(e) {
    K(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let s, r = 0;
    for (const o of e) r === t.length ? t.push(s = new N(this.O(T()), this.O(T()), this, this.options)) : s = t[r], s._$AI(o), r++;
    r < t.length && (this._$AR(s && s._$AB.nextSibling, r), t.length = r);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    for (this._$AP?.(!1, !0, t); e !== this._$AB; ) {
      const s = te(e).nextSibling;
      te(e).remove(), e = s;
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
  constructor(e, t, s, r, o) {
    this.type = 1, this._$AH = d, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = o, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = d;
  }
  _$AI(e, t = this, s, r) {
    const o = this.strings;
    let n = !1;
    if (o === void 0) e = C(this, e, t, 0), n = !D(e) || e !== this._$AH && e !== E, n && (this._$AH = e);
    else {
      const c = e;
      let a, h;
      for (e = o[0], a = 0; a < o.length - 1; a++) h = C(this, c[s + a], t, a), h === E && (h = this._$AH[a]), n ||= !D(h) || h !== this._$AH[a], h === d ? e = d : e !== d && (e += (h ?? "") + o[a + 1]), this._$AH[a] = h;
    }
    n && !r && this.j(e);
  }
  j(e) {
    e === d ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Ue extends L {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === d ? void 0 : e;
  }
}
class Te extends L {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== d);
  }
}
class De extends L {
  constructor(e, t, s, r, o) {
    super(e, t, s, r, o), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = C(this, e, t, 0) ?? d) === E) return;
    const s = this._$AH, r = e === d && s !== d || e.capture !== s.capture || e.once !== s.once || e.passive !== s.passive, o = e !== d && (s === d || r);
    r && this.element.removeEventListener(this.name, this, s), o && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Oe {
  constructor(e, t, s) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    C(this, e);
  }
}
const Ne = Y.litHtmlPolyfillSupport;
Ne?.(O, N), (Y.litHtmlVersions ??= []).push("3.3.3");
const Re = (i, e, t) => {
  const s = t?.renderBefore ?? e;
  let r = s._$litPart$;
  if (r === void 0) {
    const o = t?.renderBefore ?? null;
    s._$litPart$ = r = new N(e.insertBefore(T(), o), o, void 0, t ?? {});
  }
  return r._$AI(i), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const G = globalThis;
class U extends w {
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
    return E;
  }
}
U._$litElement$ = !0, U.finalized = !0, G.litElementHydrateSupport?.({ LitElement: U });
const qe = G.litElementPolyfillSupport;
qe?.({ LitElement: U });
(G.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Me = (i) => (e, t) => {
  t !== void 0 ? t.addInitializer(() => {
    customElements.define(i, e);
  }) : customElements.define(i, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const je = { attribute: !0, type: String, converter: z, reflect: !1, hasChanged: V }, ze = (i = je, e, t) => {
  const { kind: s, metadata: r } = t;
  let o = globalThis.litPropertyMetadata.get(r);
  if (o === void 0 && globalThis.litPropertyMetadata.set(r, o = /* @__PURE__ */ new Map()), s === "setter" && ((i = Object.create(i)).wrapped = !0), o.set(t.name, i), s === "accessor") {
    const { name: n } = t;
    return { set(c) {
      const a = e.get.call(this);
      e.set.call(this, c), this.requestUpdate(n, a, i, !0, c);
    }, init(c) {
      return c !== void 0 && this.C(n, void 0, i, c), c;
    } };
  }
  if (s === "setter") {
    const { name: n } = t;
    return function(c) {
      const a = this[n];
      e.call(this, c), this.requestUpdate(n, a, i, !0, c);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function X(i) {
  return (e, t) => typeof t == "object" ? ze(i, e, t) : ((s, r, o) => {
    const n = r.hasOwnProperty(o);
    return r.constructor.createProperty(o, s), n ? Object.getOwnPropertyDescriptor(r, o) : void 0;
  })(i, e, t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function R(i) {
  return X({ ...i, state: !0, attribute: !1 });
}
const Ie = "sensor.simple_chore_", ue = "sensor.simple_chore_privilege_", He = "sensor.simple_chore_meta_", Le = ["daily", "manual", "once"], Be = ["automatic", "manual"], A = "mdi:clipboard-list-outline", k = "mdi:star";
function Fe() {
  return {
    slug: "",
    name: "",
    description: "",
    frequency: "daily",
    icon: A,
    points: 1,
    assignees: []
  };
}
function We(i) {
  return {
    slug: i.slug,
    name: i.name,
    description: i.description,
    frequency: i.frequency,
    icon: i.icon,
    points: i.points,
    assignees: i.assignees.map((e) => e.assignee)
  };
}
function Ve() {
  return {
    slug: "",
    name: "",
    icon: k,
    behavior: "automatic",
    linkedChores: [],
    assignees: []
  };
}
function Ye(i) {
  return {
    slug: i.slug,
    name: i.name,
    icon: i.icon,
    behavior: i.behavior,
    linkedChores: [...i.linkedChores],
    assignees: i.assignees.map((e) => e.assignee)
  };
}
function M(i) {
  return i.toLowerCase().replace(/\s+/g, "-").replace(/-/g, "_").replace(/[^a-z0-9_]/g, "");
}
function Ke(i) {
  const e = /* @__PURE__ */ new Map();
  for (const [t, s] of Object.entries(i)) {
    if (!t.startsWith(Ie) || t.startsWith(ue) || t.startsWith(He)) continue;
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
      assignees: []
    }, e.set(o, n)), n.assignees.push({
      assignee: r.assignee,
      entityId: t,
      state: s.state
    });
  }
  for (const t of e.values())
    t.assignees.sort((s, r) => s.assignee.localeCompare(r.assignee));
  return [...e.values()].sort((t, s) => t.name.localeCompare(s.name));
}
function Ge(i) {
  const e = /* @__PURE__ */ new Map();
  for (const [t, s] of Object.entries(i)) {
    if (!t.startsWith(ue)) continue;
    const r = s.attributes, o = r.privilege_slug;
    if (!o) continue;
    let n = e.get(o);
    n || (n = {
      slug: o,
      name: r.privilege_name ?? o,
      icon: r.icon ?? k,
      behavior: r.behavior ?? "automatic",
      linkedChores: r.linked_chores ?? [],
      assignees: []
    }, e.set(o, n)), n.assignees.push({
      assignee: r.assignee,
      entityId: t,
      state: s.state,
      disableUntil: r.disable_until
    });
  }
  for (const t of e.values())
    t.assignees.sort((s, r) => s.assignee.localeCompare(r.assignee));
  return [...e.values()].sort((t, s) => t.name.localeCompare(s.name));
}
function Xe(i, e) {
  const t = /* @__PURE__ */ new Set();
  for (const s of i)
    for (const r of s.assignees) t.add(r.assignee);
  for (const s of e)
    for (const r of s.assignees) t.add(r.assignee);
  return [...t].sort((s, r) => s.localeCompare(r));
}
var Ze = Object.defineProperty, Je = Object.getOwnPropertyDescriptor, $ = (i, e, t, s) => {
  for (var r = s > 1 ? void 0 : s ? Je(e, t) : e, o = i.length - 1, n; o >= 0; o--)
    (n = i[o]) && (r = (s ? n(e, t, r) : n(r)) || r);
  return s && r && Ze(e, t, r), r;
};
const g = "simple_chores";
let f = class extends U {
  constructor() {
    super(...arguments), this.narrow = !1, this._tab = "chores", this._dialog = null, this._busy = !1, this._error = null, this._bulkUser = "", this._onOverlayClick = (i) => {
      i.target === i.currentTarget && this._closeDialog();
    }, this._dismissError = () => {
      this._error = null;
    }, this._closeDialog = () => {
      this._dialog = null;
    }, this._openCreateChore = () => {
      this._error = null, this._dialog = { kind: "chore", draft: Fe() };
    }, this._openCreatePrivilege = () => {
      this._error = null, this._dialog = { kind: "privilege", draft: Ve() };
    };
  }
  updated(i) {
    i.has("hass") && !this.hass?.user?.is_admin && (this._error = "You must be an administrator to manage chores and privileges.");
  }
  render() {
    if (!this.hass) return d;
    const i = Ke(this.hass.states), e = Ge(this.hass.states), t = Xe(i, e);
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
        </div>

        ${this._tab === "chores" ? this._renderChoresTab(i, t) : this._renderPrivilegesTab(e, i, t)}
      </div>

      ${this._dialog ? this._renderDialog(i, t) : d}
    `;
  }
  // --- Chores tab ----------------------------------------------------
  _renderChoresTab(i, e) {
    return l`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreateChore}>
          <ha-icon icon="mdi:plus"></ha-icon> New chore
        </button>
        <div class="spacer"></div>
        ${this._renderBulkUserPicker(e)}
        <button @click=${() => this._resetCompleted()}>Reset completed</button>
        <button @click=${() => this._startNewDay()}>Start new day</button>
      </div>

      ${i.length === 0 ? l`<p class="empty">No chores yet. Create one to get started.</p>` : l`<div class="card-grid">
            ${i.map((t) => this._renderChoreCard(t))}
          </div>`}
    `;
  }
  _renderBulkUserPicker(i) {
    return l`
      <select
        class="user-picker"
        title="Limit Reset completed / Start new day to one assignee"
        .value=${this._bulkUser}
        @change=${(e) => this._bulkUser = e.target.value}
      >
        <option value="">All assignees</option>
        ${i.map(
      (e) => l`<option value=${e}>${e}</option>`
    )}
      </select>
    `;
  }
  _renderChoreCard(i) {
    const e = `${i.points} point${i.points === 1 ? "" : "s"}`;
    return l`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${i.icon || A}></ha-icon>
          <div class="card-title">
            <div class="name">${i.name}</div>
            <div class="meta">
              ${i.frequency} · ${e}
              ${i.description ? l` · ${i.description}` : d}
            </div>
          </div>
          <div class="card-actions">
            <button
              class="icon-button"
              title="Edit"
              @click=${() => this._openEditChore(i)}
            >
              <ha-icon icon="mdi:pencil"></ha-icon>
            </button>
            <button
              class="icon-button danger"
              title="Delete"
              @click=${() => this._deleteChore(i)}
            >
              <ha-icon icon="mdi:delete"></ha-icon>
            </button>
          </div>
        </div>
        <div class="assignee-list">
          ${i.assignees.map(
      (t) => l`
              <div class="assignee-row">
                <span class="assignee-name">${t.assignee}</span>
                <span class="state-chip ${this._choreStateClass(t.state)}"
                  >${t.state}</span
                >
                <div class="row-actions">
                  <button
                    class="icon-button"
                    title="Request"
                    ?disabled=${t.state === "Pending"}
                    @click=${() => this._markChore(i.slug, t.assignee, "mark_pending")}
                  >
                    <ha-icon icon="mdi:plus-circle-outline"></ha-icon>
                  </button>
                  <button
                    class="icon-button"
                    title="Complete"
                    ?disabled=${t.state === "Complete"}
                    @click=${() => this._markChore(i.slug, t.assignee, "mark_complete")}
                  >
                    <ha-icon icon="mdi:check-circle-outline"></ha-icon>
                  </button>
                  <button
                    class="icon-button"
                    title="Clear"
                    ?disabled=${t.state === "Not Requested"}
                    @click=${() => this._markChore(
        i.slug,
        t.assignee,
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
  _choreStateClass(i) {
    return i === "Complete" ? "state-good" : i === "Pending" ? "state-warn" : "state-neutral";
  }
  // --- Privileges tab --------------------------------------------------
  _renderPrivilegesTab(i, e, t) {
    return l`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreatePrivilege}>
          <ha-icon icon="mdi:plus"></ha-icon> New privilege
        </button>
      </div>

      ${i.length === 0 ? l`<p class="empty">No privileges yet. Create one to get started.</p>` : l`<div class="card-grid">
            ${i.map((s) => this._renderPrivilegeCard(s, e, t))}
          </div>`}
    `;
  }
  _renderPrivilegeCard(i, e, t) {
    const s = i.linkedChores.map(
      (r) => e.find((o) => o.slug === r)?.name ?? r
    );
    return l`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${i.icon || k}></ha-icon>
          <div class="card-title">
            <div class="name">${i.name}</div>
            <div class="meta">
              ${i.behavior}
              ${s.length ? l` · linked: ${s.join(", ")}` : l` · linked: all requested chores`}
            </div>
          </div>
          <div class="card-actions">
            <button
              class="icon-button"
              title="Edit"
              @click=${() => this._openEditPrivilege(i)}
            >
              <ha-icon icon="mdi:pencil"></ha-icon>
            </button>
            <button
              class="icon-button danger"
              title="Delete"
              @click=${() => this._deletePrivilege(i)}
            >
              <ha-icon icon="mdi:delete"></ha-icon>
            </button>
          </div>
        </div>
        <div class="assignee-list">
          ${i.assignees.map((r) => {
      const o = r.state === "Temporarily Disabled";
      return l`
              <div class="assignee-row privilege-row">
                <div class="assignee-main">
                  <span class="assignee-name">${r.assignee}</span>
                  <span class="state-chip ${this._privilegeStateClass(r.state)}">
                    ${r.state}${o && r.disableUntil ? l` (${this._formatUntil(r.disableUntil)})` : d}
                  </span>
                  ${i.behavior === "manual" ? l`
                        <div class="row-actions">
                          <button
                            class="action-chip"
                            title="Enable"
                            ?disabled=${r.state === "Enabled"}
                            @click=${() => this._call(g, "enable_privilege", {
        user: r.assignee,
        privilege_slug: i.slug
      })}
                          >
                            <ha-icon icon="mdi:check-circle-outline"></ha-icon>
                            <span>Enable</span>
                          </button>
                          <button
                            class="action-chip"
                            title="Disable"
                            ?disabled=${r.state === "Disabled"}
                            @click=${() => this._call(g, "disable_privilege", {
        user: r.assignee,
        privilege_slug: i.slug
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
        () => this._adjustTemporaryDisable(i.slug, r.assignee, -60),
        () => this._addTemporaryDisable(i.slug, r.assignee, o, 60)
      )}
                  ${this._renderBlockStepper(
        "1d",
        o,
        () => this._adjustTemporaryDisable(i.slug, r.assignee, -1440),
        () => this._addTemporaryDisable(
          i.slug,
          r.assignee,
          o,
          1440
        )
      )}
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
  _renderBlockStepper(i, e, t, s) {
    return l`
      <div class="stepper">
        <button
          title="Shorten the block by ${i}"
          ?disabled=${!e}
          @click=${t}
        >
          <ha-icon icon="mdi:minus"></ha-icon>
        </button>
        <span class="stepper-unit">${i}</span>
        <button title="Extend the block by ${i}" @click=${s}>
          <ha-icon icon="mdi:plus"></ha-icon>
        </button>
      </div>
    `;
  }
  _privilegeStateClass(i) {
    return i === "Enabled" ? "state-good" : i === "Temporarily Disabled" ? "state-warn" : "state-bad";
  }
  _formatUntil(i) {
    try {
      const e = new Date(i), t = /* @__PURE__ */ new Date(), s = e.toDateString() === t.toDateString(), r = e.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
      return s ? `until ${r}` : `until ${e.toLocaleDateString()} ${r}`;
    } catch {
      return "";
    }
  }
  // --- Dialog ------------------------------------------------------------
  _renderDialog(i, e) {
    if (!this._dialog) return d;
    const t = this._dialog.kind === "chore", s = this._dialog.original ? "Edit" : "New", r = t ? "chore" : "privilege";
    return l`
      <div class="overlay" @click=${this._onOverlayClick}>
        <div class="dialog" role="dialog" aria-modal="true">
          <div class="dialog-header">
            <h2>${s} ${r}</h2>
            <button class="icon-button" @click=${this._closeDialog}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="dialog-body">
            ${t ? this._renderChoreForm(e) : this._renderPrivilegeForm(i, e)}
          </div>
          <div class="dialog-footer">
            <button @click=${this._closeDialog}>Cancel</button>
            <button
              class="primary"
              ?disabled=${this._busy}
              @click=${() => t ? this._saveChoreDialog() : this._savePrivilegeDialog()}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    `;
  }
  _renderChoreForm(i) {
    const e = this._dialog.draft, t = !!this._dialog.original, s = t ? e.slug : M(e.slug || e.name);
    return l`
      <label>
        Name
        <input
          type="text"
          .value=${e.name}
          @input=${(r) => {
      e.name = r.target.value, this.requestUpdate();
    }}
        />
      </label>

      <label>
        Slug
        <input
          type="text"
          .value=${e.slug}
          placeholder=${s || "auto-generated from name"}
          ?disabled=${t}
          @input=${(r) => {
      e.slug = r.target.value, this.requestUpdate();
    }}
        />
        ${t ? d : l`<span class="hint">Will be saved as "${s}"</span>`}
      </label>

      <label>
        Description
        <input
          type="text"
          .value=${e.description}
          @input=${(r) => {
      e.description = r.target.value, this.requestUpdate();
    }}
        />
      </label>

      <div class="form-row">
        <label>
          Frequency
          <select
            .value=${e.frequency}
            @change=${(r) => {
      e.frequency = r.target.value, this.requestUpdate();
    }}
          >
            ${Le.map(
      (r) => l`<option value=${r}>${r}</option>`
    )}
          </select>
        </label>

        <label>
          Points
          <input
            type="number"
            min="0"
            .value=${String(e.points)}
            @input=${(r) => {
      e.points = Number(r.target.value) || 0, this.requestUpdate();
    }}
          />
        </label>
      </div>

      ${this._renderIconField(e.icon, A, (r) => {
      e.icon = r, this.requestUpdate();
    })}

      ${this._renderAssigneeEditor(e, i)}
    `;
  }
  _renderPrivilegeForm(i, e) {
    const t = this._dialog.draft, s = !!this._dialog.original, r = s ? t.slug : M(t.slug || t.name);
    return l`
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
          placeholder=${r || "auto-generated from name"}
          ?disabled=${s}
          @input=${(o) => {
      t.slug = o.target.value, this.requestUpdate();
    }}
        />
        ${s ? d : l`<span class="hint">Will be saved as "${r}"</span>`}
      </label>

      <label>
        Behavior
        <select
          .value=${t.behavior}
          @change=${(o) => {
      t.behavior = o.target.value, this.requestUpdate();
    }}
        >
          ${Be.map(
      (o) => l`<option value=${o}>${o}</option>`
    )}
        </select>
        <span class="hint"
          >Automatic privileges turn on when their linked chores are
          complete. Manual ones are only toggled by an admin.</span
        >
      </label>

      ${this._renderIconField(t.icon, k, (o) => {
      t.icon = o, this.requestUpdate();
    })}

      <label>
        Linked chores
        <span class="hint"
          >Leave all unchecked to require every requested chore to be
          complete instead of a specific list.</span
        >
        <div class="checkbox-list">
          ${i.length === 0 ? l`<span class="hint">No chores defined yet.</span>` : i.map(
      (o) => l`
                  <label class="checkbox-item">
                    <input
                      type="checkbox"
                      .checked=${t.linkedChores.includes(o.slug)}
                      @change=${(n) => {
        const c = n.target.checked;
        t.linkedChores = c ? [...t.linkedChores, o.slug] : t.linkedChores.filter((a) => a !== o.slug), this.requestUpdate();
      }}
                    />
                    ${o.name}
                  </label>
                `
    )}
        </div>
      </label>

      ${this._renderAssigneeEditor(t, e)}
    `;
  }
  _renderIconField(i, e, t) {
    return l`
      <label>
        Icon
        <div class="icon-field">
          <ha-icon .icon=${i || e}></ha-icon>
          <input
            type="text"
            .value=${i}
            placeholder=${e}
            @input=${(s) => t(s.target.value)}
          />
        </div>
      </label>
    `;
  }
  _renderAssigneeEditor(i, e) {
    return l`
      <label>
        Assignees
        <div class="chip-list">
          ${i.assignees.map(
      (t) => l`
              <span class="chip">
                ${t}
                <button
                  class="chip-remove"
                  @click=${() => {
        i.assignees = i.assignees.filter((s) => s !== t), this.requestUpdate();
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
            @keydown=${(t) => this._onAssigneeKeydown(t, i)}
            @blur=${(t) => this._commitAssigneeInput(t.target, i)}
          />
        </div>
      </label>
      <datalist id="simple-chores-known-assignees">
        ${e.map((t) => l`<option value=${t}></option>`)}
      </datalist>
    `;
  }
  _onAssigneeKeydown(i, e) {
    i.key !== "Enter" && i.key !== "," || (i.preventDefault(), this._commitAssigneeInput(i.target, e));
  }
  _commitAssigneeInput(i, e) {
    const t = i.value.trim().replace(/,$/, "");
    t && !e.assignees.includes(t) && (e.assignees = [...e.assignees, t]), i.value = "", this.requestUpdate();
  }
  _openEditChore(i) {
    this._error = null, this._dialog = {
      kind: "chore",
      original: i.slug,
      draft: We(i)
    };
  }
  _openEditPrivilege(i) {
    this._error = null, this._dialog = {
      kind: "privilege",
      original: i.slug,
      draft: Ye(i)
    };
  }
  async _call(i, e, t) {
    this._busy = !0;
    try {
      return await this.hass.callService(i, e, t), !0;
    } catch (s) {
      return this._error = s instanceof Error ? s.message : String(s), !1;
    } finally {
      this._busy = !1;
    }
  }
  _markChore(i, e, t) {
    return this._call(g, t, { chore_slug: i, user: e });
  }
  _resetCompleted() {
    const i = this._bulkUser ? { user: this._bulkUser } : {};
    return this._call(g, "reset_completed", i);
  }
  _startNewDay() {
    const i = this._bulkUser ? { user: this._bulkUser } : {};
    return this._call(g, "start_new_day", i);
  }
  async _deleteChore(i) {
    const e = i.assignees.map((t) => t.assignee).join(", ");
    confirm(
      `Delete "${i.name}"? This removes it for every assignee (${e}).`
    ) && await this._call(g, "delete_chore", { slug: i.slug });
  }
  async _deletePrivilege(i) {
    const e = i.assignees.map((t) => t.assignee).join(", ");
    confirm(
      `Delete "${i.name}"? This removes it for every assignee (${e}).`
    ) && await this._call(g, "delete_privilege", { slug: i.slug });
  }
  _addTemporaryDisable(i, e, t, s) {
    return t ? this._call(g, "adjust_temporary_disable", {
      user: e,
      privilege_slug: i,
      adjustment: s
    }) : this._call(g, "temporarily_disable_privilege", {
      user: e,
      privilege_slug: i,
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
  _adjustTemporaryDisable(i, e, t) {
    return this._call(g, "adjust_temporary_disable", {
      user: e,
      privilege_slug: i,
      adjustment: t
    });
  }
  async _saveChoreDialog() {
    const i = this._dialog, e = i.draft;
    if (!e.name.trim()) {
      this._error = "Name is required.";
      return;
    }
    if (e.assignees.length === 0) {
      this._error = "At least one assignee is required.";
      return;
    }
    const t = e.assignees.join(",");
    (i.original ? await this._call(g, "update_chore", {
      slug: i.original,
      name: e.name,
      description: e.description,
      frequency: e.frequency,
      assignees: t,
      icon: e.icon || A,
      points: e.points
    }) : await this._call(g, "create_chore", {
      name: e.name,
      slug: M(e.slug || e.name),
      description: e.description,
      frequency: e.frequency,
      assignees: t,
      icon: e.icon || A,
      points: e.points
    })) && (this._dialog = null);
  }
  async _savePrivilegeDialog() {
    const i = this._dialog, e = i.draft;
    if (!e.name.trim()) {
      this._error = "Name is required.";
      return;
    }
    if (e.assignees.length === 0) {
      this._error = "At least one assignee is required.";
      return;
    }
    const t = e.assignees.join(","), s = e.linkedChores.join(",");
    (i.original ? await this._call(g, "update_privilege", {
      slug: i.original,
      name: e.name,
      icon: e.icon || k,
      behavior: e.behavior,
      linked_chores: s,
      assignees: t
    }) : await this._call(g, "create_privilege", {
      name: e.name,
      slug: M(e.slug || e.name),
      icon: e.icon || k,
      behavior: e.behavior,
      linked_chores: s,
      assignees: t
    })) && (this._dialog = null);
  }
};
f.styles = fe`
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
$([
  X({ attribute: !1 })
], f.prototype, "hass", 2);
$([
  X({ type: Boolean })
], f.prototype, "narrow", 2);
$([
  R()
], f.prototype, "_tab", 2);
$([
  R()
], f.prototype, "_dialog", 2);
$([
  R()
], f.prototype, "_busy", 2);
$([
  R()
], f.prototype, "_error", 2);
$([
  R()
], f.prototype, "_bulkUser", 2);
f = $([
  Me("simple-chores-panel")
], f);
