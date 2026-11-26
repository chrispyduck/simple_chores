/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const G = globalThis, he = G.ShadowRoot && (G.ShadyCSS === void 0 || G.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, de = Symbol(), Ce = /* @__PURE__ */ new WeakMap();
let Fe = class {
  constructor(e, s, i) {
    if (this._$cssResult$ = !0, i !== de) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = s;
  }
  get styleSheet() {
    let e = this.o;
    const s = this.t;
    if (he && e === void 0) {
      const i = s !== void 0 && s.length === 1;
      i && (e = Ce.get(s)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && Ce.set(s, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const tt = (t) => new Fe(typeof t == "string" ? t : t + "", void 0, de), Y = (t, ...e) => {
  const s = t.length === 1 ? t[0] : e.reduce((i, o, r) => i + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(o) + t[r + 1], t[0]);
  return new Fe(s, t, de);
}, st = (t, e) => {
  if (he) t.adoptedStyleSheets = e.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  else for (const s of e) {
    const i = document.createElement("style"), o = G.litNonce;
    o !== void 0 && i.setAttribute("nonce", o), i.textContent = s.cssText, t.appendChild(i);
  }
}, Se = he ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let s = "";
  for (const i of e.cssRules) s += i.cssText;
  return tt(s);
})(t) : t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: it, defineProperty: ot, getOwnPropertyDescriptor: rt, getOwnPropertyNames: nt, getOwnPropertySymbols: at, getPrototypeOf: ct } = Object, Q = globalThis, Ae = Q.trustedTypes, lt = Ae ? Ae.emptyScript : "", ht = Q.reactiveElementPolyfillSupport, j = (t, e) => t, Z = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? lt : null;
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
} }, pe = (t, e) => !it(t, e), Ee = { attribute: !0, type: String, converter: Z, reflect: !1, useDefault: !1, hasChanged: pe };
Symbol.metadata ??= Symbol("metadata"), Q.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let k = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, s = Ee) {
    if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(e, s), !s.noAccessor) {
      const i = Symbol(), o = this.getPropertyDescriptor(e, i, s);
      o !== void 0 && ot(this.prototype, e, o);
    }
  }
  static getPropertyDescriptor(e, s, i) {
    const { get: o, set: r } = rt(this.prototype, e) ?? { get() {
      return this[s];
    }, set(n) {
      this[s] = n;
    } };
    return { get: o, set(n) {
      const c = o?.call(this);
      r?.call(this, n), this.requestUpdate(e, c, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? Ee;
  }
  static _$Ei() {
    if (this.hasOwnProperty(j("elementProperties"))) return;
    const e = ct(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(j("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(j("properties"))) {
      const s = this.properties, i = [...nt(s), ...at(s)];
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
      for (const o of i) s.unshift(Se(o));
    } else e !== void 0 && s.push(Se(e));
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
    return st(e, this.constructor.elementStyles), e;
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
      const r = (i.converter?.toAttribute !== void 0 ? i.converter : Z).toAttribute(s, i.type);
      this._$Em = e, r == null ? this.removeAttribute(o) : this.setAttribute(o, r), this._$Em = null;
    }
  }
  _$AK(e, s) {
    const i = this.constructor, o = i._$Eh.get(e);
    if (o !== void 0 && this._$Em !== o) {
      const r = i.getPropertyOptions(o), n = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : Z;
      this._$Em = o;
      const c = n.fromAttribute(s, r.type);
      this[o] = c ?? this._$Ej?.get(o) ?? c, this._$Em = null;
    }
  }
  requestUpdate(e, s, i, o = !1, r) {
    if (e !== void 0) {
      const n = this.constructor;
      if (o === !1 && (r = this[e]), i ??= n.getPropertyOptions(e), !((i.hasChanged ?? pe)(r, s) || i.useDefault && i.reflect && r === this._$Ej?.get(e) && !this.hasAttribute(n._$Eu(e, i)))) return;
      this.C(e, s, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, s, { useDefault: i, reflect: o, wrapped: r }, n) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, n ?? s ?? this[e]), r !== !0 || n !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (s = void 0), this._$AL.set(e, s)), o === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
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
        for (const [o, r] of this._$Ep) this[o] = r;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [o, r] of i) {
        const { wrapped: n } = r, c = this[o];
        n !== !0 || this._$AL.has(o) || c === void 0 || this.C(o, void 0, r, c);
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
k.elementStyles = [], k.shadowRootOptions = { mode: "open" }, k[j("elementProperties")] = /* @__PURE__ */ new Map(), k[j("finalized")] = /* @__PURE__ */ new Map(), ht?.({ ReactiveElement: k }), (Q.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ue = globalThis, ke = (t) => t, J = ue.trustedTypes, Te = J ? J.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, qe = "$lit$", y = `lit$${Math.random().toFixed(9).slice(2)}$`, Be = "?" + y, dt = `<${Be}>`, A = document, F = () => A.createComment(""), q = (t) => t === null || typeof t != "object" && typeof t != "function", _e = Array.isArray, pt = (t) => _e(t) || typeof t?.[Symbol.iterator] == "function", ie = `[ 	
\f\r]`, U = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Oe = /-->/g, Pe = />/g, C = RegExp(`>|${ie}(?:([^\\s"'>=/]+)(${ie}*=${ie}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Ne = /'/g, Me = /"/g, We = /^(?:script|style|textarea|title)$/i, ut = (t) => (e, ...s) => ({ _$litType$: t, strings: e, values: s }), l = ut(1), P = Symbol.for("lit-noChange"), h = Symbol.for("lit-nothing"), De = /* @__PURE__ */ new WeakMap(), S = A.createTreeWalker(A, 129);
function Ye(t, e) {
  if (!_e(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Te !== void 0 ? Te.createHTML(e) : e;
}
const _t = (t, e) => {
  const s = t.length - 1, i = [];
  let o, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", n = U;
  for (let c = 0; c < s; c++) {
    const a = t[c];
    let p, u, d = -1, f = 0;
    for (; f < a.length && (n.lastIndex = f, u = n.exec(a), u !== null); ) f = n.lastIndex, n === U ? u[1] === "!--" ? n = Oe : u[1] !== void 0 ? n = Pe : u[2] !== void 0 ? (We.test(u[2]) && (o = RegExp("</" + u[2], "g")), n = C) : u[3] !== void 0 && (n = C) : n === C ? u[0] === ">" ? (n = o ?? U, d = -1) : u[1] === void 0 ? d = -2 : (d = n.lastIndex - u[2].length, p = u[1], n = u[3] === void 0 ? C : u[3] === '"' ? Me : Ne) : n === Me || n === Ne ? n = C : n === Oe || n === Pe ? n = U : (n = C, o = void 0);
    const m = n === C && t[c + 1].startsWith("/>") ? " " : "";
    r += n === U ? a + dt : d >= 0 ? (i.push(p), a.slice(0, d) + qe + a.slice(d) + y + m) : a + y + (d === -2 ? c : m);
  }
  return [Ye(t, r + (t[s] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class B {
  constructor({ strings: e, _$litType$: s }, i) {
    let o;
    this.parts = [];
    let r = 0, n = 0;
    const c = e.length - 1, a = this.parts, [p, u] = _t(e, s);
    if (this.el = B.createElement(p, i), S.currentNode = this.el.content, s === 2 || s === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (o = S.nextNode()) !== null && a.length < c; ) {
      if (o.nodeType === 1) {
        if (o.hasAttributes()) for (const d of o.getAttributeNames()) if (d.endsWith(qe)) {
          const f = u[n++], m = o.getAttribute(d).split(y), b = /([.?@])?(.*)/.exec(f);
          a.push({ type: 1, index: r, name: b[2], strings: m, ctor: b[1] === "." ? ft : b[1] === "?" ? gt : b[1] === "@" ? vt : ee }), o.removeAttribute(d);
        } else d.startsWith(y) && (a.push({ type: 6, index: r }), o.removeAttribute(d));
        if (We.test(o.tagName)) {
          const d = o.textContent.split(y), f = d.length - 1;
          if (f > 0) {
            o.textContent = J ? J.emptyScript : "";
            for (let m = 0; m < f; m++) o.append(d[m], F()), S.nextNode(), a.push({ type: 2, index: ++r });
            o.append(d[f], F());
          }
        }
      } else if (o.nodeType === 8) if (o.data === Be) a.push({ type: 2, index: r });
      else {
        let d = -1;
        for (; (d = o.data.indexOf(y, d + 1)) !== -1; ) a.push({ type: 7, index: r }), d += y.length - 1;
      }
      r++;
    }
  }
  static createElement(e, s) {
    const i = A.createElement("template");
    return i.innerHTML = e, i;
  }
}
function N(t, e, s = t, i) {
  if (e === P) return e;
  let o = i !== void 0 ? s._$Co?.[i] : s._$Cl;
  const r = q(e) ? void 0 : e._$litDirective$;
  return o?.constructor !== r && (o?._$AO?.(!1), r === void 0 ? o = void 0 : (o = new r(t), o._$AT(t, s, i)), i !== void 0 ? (s._$Co ??= [])[i] = o : s._$Cl = o), o !== void 0 && (e = N(t, o._$AS(t, e.values), o, i)), e;
}
class mt {
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
    const { el: { content: s }, parts: i } = this._$AD, o = (e?.creationScope ?? A).importNode(s, !0);
    S.currentNode = o;
    let r = S.nextNode(), n = 0, c = 0, a = i[0];
    for (; a !== void 0; ) {
      if (n === a.index) {
        let p;
        a.type === 2 ? p = new K(r, r.nextSibling, this, e) : a.type === 1 ? p = new a.ctor(r, a.name, a.strings, this, e) : a.type === 6 && (p = new bt(r, this, e)), this._$AV.push(p), a = i[++c];
      }
      n !== a?.index && (r = S.nextNode(), n++);
    }
    return S.currentNode = A, o;
  }
  p(e) {
    let s = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, s), s += i.strings.length - 2) : i._$AI(e[s])), s++;
  }
}
class K {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, s, i, o) {
    this.type = 2, this._$AH = h, this._$AN = void 0, this._$AA = e, this._$AB = s, this._$AM = i, this.options = o, this._$Cv = o?.isConnected ?? !0;
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
    e = N(this, e, s), q(e) ? e === h || e == null || e === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : e !== this._$AH && e !== P && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : pt(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== h && q(this._$AH) ? this._$AA.nextSibling.data = e : this.T(A.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: s, _$litType$: i } = e, o = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = B.createElement(Ye(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === o) this._$AH.p(s);
    else {
      const r = new mt(o, this), n = r.u(this.options);
      r.p(s), this.T(n), this._$AH = r;
    }
  }
  _$AC(e) {
    let s = De.get(e.strings);
    return s === void 0 && De.set(e.strings, s = new B(e)), s;
  }
  k(e) {
    _e(this._$AH) || (this._$AH = [], this._$AR());
    const s = this._$AH;
    let i, o = 0;
    for (const r of e) o === s.length ? s.push(i = new K(this.O(F()), this.O(F()), this, this.options)) : i = s[o], i._$AI(r), o++;
    o < s.length && (this._$AR(i && i._$AB.nextSibling, o), s.length = o);
  }
  _$AR(e = this._$AA.nextSibling, s) {
    for (this._$AP?.(!1, !0, s); e !== this._$AB; ) {
      const i = ke(e).nextSibling;
      ke(e).remove(), e = i;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class ee {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, s, i, o, r) {
    this.type = 1, this._$AH = h, this._$AN = void 0, this.element = e, this.name = s, this._$AM = o, this.options = r, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = h;
  }
  _$AI(e, s = this, i, o) {
    const r = this.strings;
    let n = !1;
    if (r === void 0) e = N(this, e, s, 0), n = !q(e) || e !== this._$AH && e !== P, n && (this._$AH = e);
    else {
      const c = e;
      let a, p;
      for (e = r[0], a = 0; a < r.length - 1; a++) p = N(this, c[i + a], s, a), p === P && (p = this._$AH[a]), n ||= !q(p) || p !== this._$AH[a], p === h ? e = h : e !== h && (e += (p ?? "") + r[a + 1]), this._$AH[a] = p;
    }
    n && !o && this.j(e);
  }
  j(e) {
    e === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class ft extends ee {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === h ? void 0 : e;
  }
}
class gt extends ee {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== h);
  }
}
class vt extends ee {
  constructor(e, s, i, o, r) {
    super(e, s, i, o, r), this.type = 5;
  }
  _$AI(e, s = this) {
    if ((e = N(this, e, s, 0) ?? h) === P) return;
    const i = this._$AH, o = e === h && i !== h || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, r = e !== h && (i === h || o);
    o && this.element.removeEventListener(this.name, this, i), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class bt {
  constructor(e, s, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = s, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    N(this, e);
  }
}
const yt = ue.litHtmlPolyfillSupport;
yt?.(B, K), (ue.litHtmlVersions ??= []).push("3.3.3");
const $t = (t, e, s) => {
  const i = s?.renderBefore ?? e;
  let o = i._$litPart$;
  if (o === void 0) {
    const r = s?.renderBefore ?? null;
    i._$litPart$ = o = new K(e.insertBefore(F(), r), r, void 0, s ?? {});
  }
  return o._$AI(t), o;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const me = globalThis;
class v extends k {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const s = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = $t(s, this.renderRoot, this.renderOptions);
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
v._$litElement$ = !0, v.finalized = !0, me.litElementHydrateSupport?.({ LitElement: v });
const wt = me.litElementPolyfillSupport;
wt?.({ LitElement: v });
(me.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const xt = { attribute: !0, type: String, converter: Z, reflect: !1, hasChanged: pe }, Ct = (t = xt, e, s) => {
  const { kind: i, metadata: o } = s;
  let r = globalThis.litPropertyMetadata.get(o);
  if (r === void 0 && globalThis.litPropertyMetadata.set(o, r = /* @__PURE__ */ new Map()), i === "setter" && ((t = Object.create(t)).wrapped = !0), r.set(s.name, t), i === "accessor") {
    const { name: n } = s;
    return { set(c) {
      const a = e.get.call(this);
      e.set.call(this, c), this.requestUpdate(n, a, t, !0, c);
    }, init(c) {
      return c !== void 0 && this.C(n, void 0, t, c), c;
    } };
  }
  if (i === "setter") {
    const { name: n } = s;
    return function(c) {
      const a = this[n];
      e.call(this, c), this.requestUpdate(n, a, t, !0, c);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function M(t) {
  return (e, s) => typeof s == "object" ? Ct(t, e, s) : ((i, o, r) => {
    const n = o.hasOwnProperty(r);
    return o.constructor.createProperty(r, i), n ? Object.getOwnPropertyDescriptor(o, r) : void 0;
  })(t, e, s);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function _(t) {
  return M({ ...t, state: !0, attribute: !1 });
}
function D(t) {
  return (e) => {
    customElements.get(t) || customElements.define(t, e);
  };
}
const z = "simple_chores", Ke = "sensor.simple_chore_", Ve = "sensor.simple_chore_privilege_", Xe = "sensor.simple_chore_meta_", Ge = "sensor.simple_chore_category_", Ze = "mdi:clipboard-list-outline";
function St(t) {
  const e = Math.floor(t / 60), s = t % 60;
  return e === 0 ? `${s} min` : s === 0 ? `${e} hr` : `${e} hr ${s} min`;
}
function fe(t) {
  const e = /* @__PURE__ */ new Map();
  for (const [s, i] of Object.entries(t)) {
    if (!s.startsWith(Ke) || s.startsWith(Ve) || s.startsWith(Xe) || s.startsWith(Ge)) continue;
    const o = i.attributes, r = o.chore_slug;
    if (!r) continue;
    let n = e.get(r);
    n || (n = {
      slug: r,
      name: o.chore_name ?? r,
      description: o.description ?? "",
      frequency: o.frequency ?? "daily",
      icon: o.icon ?? Ze,
      // default_points is the chore's shared value; older/unrefreshed
      // sensors may not have it yet, so fall back to this assignee's
      // resolved points rather than leaving the definition unset.
      points: o.default_points ?? o.points ?? 0,
      category: o.category ?? null,
      suggestedDuration: o.suggested_duration || null,
      assignees: []
    }, e.set(r, n)), n.assignees.push({
      assignee: o.assignee,
      entityId: s,
      state: i.state,
      points: o.points ?? n.points,
      activeSince: o.active_since ?? null,
      timerEndsAt: o.timer_ends_at ?? null
    });
  }
  for (const s of e.values())
    s.assignees.sort((i, o) => i.assignee.localeCompare(o.assignee));
  return [...e.values()].sort((s, i) => s.name.localeCompare(i.name));
}
function ge(t, e) {
  const s = /* @__PURE__ */ new Set();
  for (const i of t)
    for (const o of i.assignees) s.add(o.assignee);
  for (const i of e)
    for (const o of i.assignees) s.add(o.assignee);
  return [...s].sort((i, o) => i.localeCompare(o));
}
function At(t) {
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
function Et(t) {
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
function kt(t) {
  return t === "completed" || t === "privilege_enabled" ? "state-good" : t === "uncompleted" || t === "undone" || t === "privilege_disabled" ? "state-bad" : t === "missed" || t === "adjusted" || t === "privilege_temporarily_disabled" ? "state-warn" : "state-neutral";
}
var Tt = Object.defineProperty, Ot = Object.getOwnPropertyDescriptor, ve = (t, e, s, i) => {
  for (var o = i > 1 ? void 0 : i ? Ot(e, s) : e, r = t.length - 1, n; r >= 0; r--)
    (n = t[r]) && (o = (i ? n(e, s, o) : n(o)) || o);
  return i && o && Tt(e, s, o), o;
};
const Pt = 7, He = "simple-chores-history-card-editor-assignees";
let W = class extends v {
  constructor() {
    super(...arguments), this._config = {
      type: "custom:simple-chores-history-card",
      assignee: ""
    };
  }
  setConfig(t) {
    this._config = t;
  }
  render() {
    if (!this.hass) return h;
    const t = this._config, e = ge(fe(this.hass.states), []);
    return l`
      <div class="form">
        <label>
          Assignee
          <input
            type="text"
            list=${He}
            placeholder="e.g. alice"
            .value=${t.assignee ?? ""}
            @input=${(s) => this._update({ assignee: s.target.value })}
          />
        </label>
        <datalist id=${He}>
          ${e.map((s) => l`<option value=${s}></option>`)}
        </datalist>

        <label>
          Title (optional)
          <input
            type="text"
            placeholder="No header"
            .value=${t.title ?? ""}
            @input=${(s) => this._update({ title: s.target.value })}
          />
        </label>

        <label>
          Days to show
          <input
            type="number"
            min="1"
            .value=${String(t.days ?? Pt)}
            @input=${(s) => {
      const i = Number(s.target.value);
      Number.isFinite(i) && i > 0 && this._update({ days: i });
    }}
          />
        </label>

        <div class="hint">Event types to show</div>
        <div class="checkboxes">
          <label class="checkbox-item">
            <input
              type="checkbox"
              .checked=${t.show_completed ?? !0}
              @change=${(s) => this._update({
      show_completed: s.target.checked
    })}
            />
            Completed
          </label>
          <label class="checkbox-item">
            <input
              type="checkbox"
              .checked=${t.show_uncompleted ?? !0}
              @change=${(s) => this._update({
      show_uncompleted: s.target.checked
    })}
            />
            Uncompleted
          </label>
          <label class="checkbox-item">
            <input
              type="checkbox"
              .checked=${t.show_missed ?? !0}
              @change=${(s) => this._update({ show_missed: s.target.checked })}
            />
            Missed
          </label>
          <label class="checkbox-item">
            <input
              type="checkbox"
              .checked=${t.show_reset ?? !1}
              @change=${(s) => this._update({ show_reset: s.target.checked })}
            />
            Reset
          </label>
        </div>
      </div>
    `;
  }
  /** Merge `changes` into the config, drop an empty title, then notify Lovelace. */
  _update(t) {
    const e = { ...this._config, ...t };
    e.title || delete e.title, this._config = e, this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: e },
        bubbles: !0,
        composed: !0
      })
    );
  }
};
W.styles = Y`
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
ve([
  M({ attribute: !1 })
], W.prototype, "hass", 2);
ve([
  _()
], W.prototype, "_config", 2);
W = ve([
  D("simple-chores-history-card-editor")
], W);
var Nt = Object.defineProperty, Mt = Object.getOwnPropertyDescriptor, H = (t, e, s, i) => {
  for (var o = i > 1 ? void 0 : i ? Mt(e, s) : e, r = t.length - 1, n; r >= 0; r--)
    (n = t[r]) && (o = (i ? n(e, s, o) : n(o)) || o);
  return i && o && Nt(e, s, o), o;
};
const Ie = 7, Dt = 1440 * 60 * 1e3;
let $ = class extends v {
  constructor() {
    super(...arguments), this._entries = null, this._error = null, this._loading = !1;
  }
  setConfig(t) {
    if (!t.assignee)
      throw new Error("simple-chores-history-card: 'assignee' is required");
    this._config = t;
  }
  updated(t) {
    this.hass && this._config && this._entries === null && !this._loading && this._loadHistory();
  }
  getCardSize() {
    return 1 + Math.min(this._config?.days ?? Ie, 10);
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
      const t = await this.hass.callWS({
        type: "call_service",
        domain: z,
        service: "get_history",
        service_data: {},
        return_response: !0
      });
      this._entries = At(t?.response?.entries);
    } catch (t) {
      this._error = t instanceof Error ? t.message : String(t);
    } finally {
      this._loading = !1;
    }
  }
  _actionEnabled(t) {
    switch (t) {
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
    const t = this._config.days ?? Ie, e = Date.now() - t * Dt, s = (this._entries ?? []).filter(
      (i) => i.assignee === this._config.assignee && this._actionEnabled(i.action) && new Date(i.timestamp).getTime() >= e
    ).sort((i, o) => o.timestamp.localeCompare(i.timestamp));
    return l`
      <ha-card header=${this._config.title ?? h}>
        <div class="card-content">
          ${this._error ? l`<p class="error">${this._error}</p>` : this._entries === null ? l`<p class="empty">Loading&hellip;</p>` : s.length === 0 ? l`<p class="empty">Nothing to show yet.</p>` : this._renderTable(s)}
        </div>
      </ha-card>
    `;
  }
  _renderTable(t) {
    const e = [];
    let s = null;
    for (const i of t) {
      const o = this._dateKey(i.timestamp);
      o !== s && (e.push(
        l`<div class="date-header">${this._formatDate(i.timestamp)}</div>`
      ), s = o), e.push(this._renderRow(i));
    }
    return l`
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
  _renderRow(t) {
    const e = t.pointsDelta > 0 ? "points-positive" : t.pointsDelta < 0 ? "points-negative" : "", s = t.pointsDelta > 0 ? `+${t.pointsDelta}` : t.pointsDelta;
    return l`
      <div class="row ${t.undone ? "row-undone" : ""}">
        <div class="cell time">${this._formatTime(t.timestamp)}</div>
        <div class="cell event">
          <span class="state-chip ${kt(t.action)}">
            ${Et(t.action)}
          </span>
        </div>
        <div class="cell chore">${t.choreName}</div>
        <div class="cell delta ${e}">
          ${t.pointsDelta !== 0 ? s : h}
        </div>
        <div class="cell earned">${t.pointsTotal}</div>
        <div class="cell delta points-negative">
          ${t.pointsMissed > 0 ? `+${t.pointsMissed}` : h}
        </div>
        <div class="cell missed">${t.missedTotal ?? "—"}</div>
      </div>
    `;
  }
  /** Grouping key only - not for display, so locale/format changes can't split a day. */
  _dateKey(t) {
    const e = new Date(t);
    return Number.isNaN(e.getTime()) ? t : e.toDateString();
  }
  _formatDate(t) {
    const e = new Date(t);
    return Number.isNaN(e.getTime()) ? t : e.toLocaleDateString(void 0, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }
  _formatTime(t) {
    const e = new Date(t);
    return Number.isNaN(e.getTime()) ? t : e.toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit" });
  }
};
$.styles = Y`
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
    .row-undone {
      opacity: 0.7;
    }
    .row-undone .cell.chore,
    .row-undone .state-chip {
      text-decoration: line-through;
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
H([
  M({ attribute: !1 })
], $.prototype, "hass", 2);
H([
  _()
], $.prototype, "_config", 2);
H([
  _()
], $.prototype, "_entries", 2);
H([
  _()
], $.prototype, "_error", 2);
H([
  _()
], $.prototype, "_loading", 2);
$ = H([
  D("simple-chores-history-card")
], $);
window.customCards = window.customCards ?? [];
window.customCards.push({
  type: "simple-chores-history-card",
  name: "Chore History",
  description: "Shows one assignee's recent Simple Chores activity.",
  preview: !1
});
const ae = 5, be = [43, 123, 185], ye = [219, 68, 55];
function T(t, e) {
  if (Array.isArray(t) && t.length === 3 && t.every((s) => Number.isFinite(s)))
    return t.map((s) => Math.min(255, Math.max(0, Math.round(s))));
  if (typeof t == "string") {
    let s = t.trim().replace(/^#/, "");
    if (/^[0-9a-f]{3}$/i.test(s) && (s = [...s].map((i) => i + i).join("")), /^[0-9a-f]{6}$/i.test(s))
      return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
  }
  return e;
}
function Ht(t, e, s, i) {
  const o = e > 0 ? Math.min(1, Math.max(0, t / e)) : 1;
  return s.map((r, n) => Math.round(r + (i[n] - r) * o));
}
const $e = "chore-menu", Je = [
  { id: $e, label: "Show chore options" },
  {
    id: "complete-chore",
    label: "Complete chore",
    operation: (t) => t === "Complete" ? null : "complete"
  },
  {
    id: "start-chore",
    label: "Start chore (mark in progress)",
    // Starting a finished chore would silently take its points back -
    // that's what "Mark incomplete" is for.
    operation: (t) => t === "Complete" || t === "Active" ? null : "start"
  },
  {
    id: "start-or-complete-chore",
    label: "Start chore, then complete it",
    operation: (t) => t === "Complete" ? null : t === "Active" ? "complete" : "start"
  },
  {
    id: "reopen-chore",
    label: "Mark incomplete",
    operation: (t) => t === "Complete" ? "incomplete" : t === "Active" ? "stop" : null
  }
], we = {
  tap: $e,
  hold: "reopen-chore",
  double_tap: "none"
};
function Qe(t) {
  return Je.find((e) => e.id === t);
}
function It(t) {
  const e = Number(t.attributes.suggested_duration);
  if (!(e > 0)) return;
  const s = Math.floor(e / 60), i = Math.round(e % 60);
  return `${String(s).padStart(2, "0")}:${String(i).padStart(2, "0")}:00`;
}
const g = {
  complete: { id: "complete", icon: "mdi:check", label: "Complete" },
  incomplete: { id: "incomplete", icon: "mdi:checkbox-blank-outline", label: "Mark incomplete" },
  start: { id: "start", icon: "mdi:play", label: "Start" },
  pause: { id: "pause", icon: "mdi:pause", label: "Pause" },
  resume: { id: "resume", icon: "mdi:play", label: "Resume" },
  stop: { id: "stop", icon: "mdi:stop", label: "Stop" }
};
function Rt(t, e) {
  const s = t.state;
  if (s === "Not Requested") return [];
  if (s === "Complete") return [g.incomplete];
  if (!e) return [g.complete];
  if (s !== "Active") return [g.complete, g.start];
  const i = e.state === "active" ? g.pause : e.state === "paused" ? g.resume : g.start;
  return [g.complete, i, g.stop];
}
function Re(t) {
  if (typeof t != "string") return NaN;
  const e = t.split(":").map(Number);
  return e.length !== 3 || e.some((s) => Number.isNaN(s)) ? NaN : e[0] * 3600 + e[1] * 60 + e[2];
}
function Ut(t, e, s, i = Date.now()) {
  if (t.state !== "Active") return null;
  if (s) {
    if (e?.state === "paused") {
      const n = Re(e.attributes.remaining);
      return Number.isNaN(n) ? null : { remaining: n, paused: !0 };
    }
    if (e?.state === "active") {
      const n = Date.parse(e.attributes.finishes_at ?? "");
      if (!Number.isNaN(n)) return { remaining: Math.round((n - i) / 1e3), paused: !1 };
      const c = Re(e.attributes.remaining);
      return Number.isNaN(c) ? null : { remaining: c, paused: !1 };
    }
    return null;
  }
  const o = t.attributes.timer_paused_remaining;
  if (typeof o == "number") return { remaining: o, paused: !0 };
  const r = Date.parse(t.attributes.timer_ends_at ?? "");
  return Number.isNaN(r) ? null : { remaining: Math.round((r - i) / 1e3), paused: !1 };
}
function Lt(t) {
  const e = Math.max(0, Math.round(t)), s = Math.floor(e / 3600), i = Math.floor(e % 3600 / 60), o = String(e % 60).padStart(2, "0");
  return s > 0 ? `${s}:${String(i).padStart(2, "0")}:${o}` : `${i}:${o}`;
}
var zt = Object.defineProperty, jt = Object.getOwnPropertyDescriptor, te = (t, e, s, i) => {
  for (var o = i > 1 ? void 0 : i ? jt(e, s) : e, r = t.length - 1, n; r >= 0; r--)
    (n = t[r]) && (o = (i ? n(e, s, o) : n(o)) || o);
  return i && o && zt(e, s, o), o;
};
const V = "simple-chores-chore-card-editor-entities", oe = {
  entity: "Chore",
  show_description: "Show description",
  show_points: "Show points",
  show_duration: "Show suggested duration",
  color_by_points: "Color points badge by value",
  high_points: "High value threshold (points)",
  low_points_color: "Low value color",
  high_points_color: "High value color",
  interactions: "Interactions",
  tap_behavior: "Tap behavior",
  hold_behavior: "Hold behavior",
  double_tap_behavior: "Double tap behavior",
  tap_action: "Tap action",
  hold_action: "Hold action",
  double_tap_action: "Double tap action",
  timer_entity: "Timer"
}, L = ["tap", "hold", "double_tap"], O = "other", Ue = [
  ...Je.map((t) => ({ value: t.id, label: t.label })),
  { value: "none", label: "Do nothing" },
  { value: O, label: "Other Home Assistant action…" }
], Ft = ["more-info", "toggle", "navigate", "url", "perform-action", "assist"];
function X(t, e) {
  const s = e?.action ?? we[t];
  return s === "none" || Qe(s) ? s : O;
}
const qt = {
  timer_entity: "A timer helper to run while a chore is in progress, for its suggested duration. Without one, the options panel has no start/pause/stop.",
  color_by_points: "Blends from the low color at 0 points to the high color at the threshold and above."
}, Le = ["low_points_color", "high_points_color"], re = {
  low_points_color: be,
  high_points_color: ye
};
function Bt(t) {
  return "#" + t.map((e) => e.toString(16).padStart(2, "0")).join("");
}
function Wt(t, e) {
  return t.every((s, i) => s === e[i]);
}
const Yt = { show_description: !0, show_points: !0 };
async function Kt() {
  if (customElements.get("ha-form")) return !0;
  try {
    await (await window.loadCardHelpers?.())?.createCardElement({ type: "entities", entities: [] })?.constructor?.getConfigElement?.();
  } catch {
  }
  return !!customElements.get("ha-form");
}
let E = class extends v {
  constructor() {
    super(...arguments), this._config = {
      type: "custom:simple-chores-chore-card",
      entity: ""
    }, this._haForm = null;
  }
  setConfig(t) {
    this._config = t;
  }
  // --- Hooks for subclasses (see simple-chores-chore-list-card-editor) ----
  /** The ha-form field(s) choosing what the card shows. */
  _targetSchema() {
    return [
      {
        name: "entity",
        required: !0,
        selector: { entity: { include_entities: this._choreEntityIds() } }
      }
    ];
  }
  /** Plain-input fallback for _targetSchema(). */
  _renderFallbackTarget() {
    const t = this._choreEntityIds().map((e) => {
      const s = this.hass.states[e].attributes;
      return { id: e, label: `${s.chore_name ?? e} (${s.assignee ?? "?"})` };
    });
    return l`
      <label>
        Chore entity
        <input
          type="text"
          list=${V}
          placeholder="sensor.simple_chore_..."
          .value=${this._config.entity ?? ""}
          @input=${(e) => this._update({ entity: e.target.value })}
        />
      </label>
      <datalist id=${V}>
        ${t.map((e) => l`<option value=${e.id}>${e.label}</option>`)}
      </datalist>
    `;
  }
  /** Extra boolean options (default false) shown after the show_* toggles. */
  _extraToggles() {
    return [];
  }
  /** Extra ha-form fields, shown after the points-color fields. */
  _extraSchema() {
    return [];
  }
  /** Plain-input fallback for _extraSchema(). */
  _renderFallbackExtras() {
    return h;
  }
  /** Defaults for _extraSchema() fields, so the form shows what the card uses. */
  _extraDefaults() {
    return {};
  }
  /** Helper text under a field, if any. */
  _helper(t) {
    return qt[t];
  }
  _label(t) {
    return oe[t] ?? t;
  }
  _choreEntityIds() {
    return Object.entries(this.hass.states).filter(([t, e]) => xe(t, e)).map(([t]) => t).sort();
  }
  connectedCallback() {
    super.connectedCallback(), this._haForm === null && Kt().then((t) => this._haForm = t);
  }
  render() {
    return !this.hass || this._haForm === null ? h : this._haForm ? this._renderHaForm() : this._renderFallback();
  }
  /** Config with defaults filled in, so the form shows what the card uses. */
  _formData() {
    const t = this._config;
    return {
      ...Yt,
      ...this._extraDefaults(),
      ...t,
      high_points: t.high_points ?? ae,
      low_points_color: T(t.low_points_color, be),
      high_points_color: T(t.high_points_color, ye),
      ...Object.fromEntries(
        L.map((e) => [`${e}_behavior`, X(e, t[`${e}_action`])])
      )
    };
  }
  _renderHaForm() {
    const t = this._config.color_by_points ? [
      {
        name: "high_points",
        selector: { number: { min: 1, step: 1, mode: "box" } }
      },
      {
        type: "grid",
        name: "",
        schema: [
          { name: "low_points_color", selector: { color_rgb: {} } },
          { name: "high_points_color", selector: { color_rgb: {} } }
        ]
      }
    ] : [], e = [
      ...this._targetSchema(),
      {
        type: "grid",
        name: "",
        schema: [
          { name: "show_description", selector: { boolean: {} } },
          { name: "show_points", selector: { boolean: {} } },
          { name: "show_duration", selector: { boolean: {} } },
          ...this._extraToggles().map((s) => ({ name: s, selector: { boolean: {} } }))
        ]
      },
      { name: "color_by_points", selector: { boolean: {} } },
      ...t,
      ...this._extraSchema(),
      {
        type: "expandable",
        name: "interactions",
        flatten: !0,
        icon: "mdi:gesture-tap",
        schema: L.flatMap((s) => [
          {
            name: `${s}_behavior`,
            selector: { select: { mode: "dropdown", options: Ue } }
          },
          ...X(s, this._config[`${s}_action`]) === O ? [{ name: `${s}_action`, selector: { ui_action: { actions: Ft } } }] : []
        ]).concat([{ name: "timer_entity", selector: { entity: { domain: "timer" } } }])
      }
    ];
    return l`
      <ha-form
        .hass=${this.hass}
        .data=${this._formData()}
        .schema=${e}
        .computeLabel=${(s) => this._label(s.name)}
        .computeHelper=${(s) => this._helper(s.name)}
        @value-changed=${(s) => this._update(s.detail.value)}
      ></ha-form>
    `;
  }
  _renderFallback() {
    const t = this._config;
    return l`
      <div class="form">
        ${this._renderFallbackTarget()}

        <label class="checkbox-item">
          <input
            type="checkbox"
            .checked=${t.show_description ?? !0}
            @change=${(e) => this._update({ show_description: e.target.checked })}
          />
          Show description
        </label>
        <label class="checkbox-item">
          <input
            type="checkbox"
            .checked=${t.show_points ?? !0}
            @change=${(e) => this._update({ show_points: e.target.checked })}
          />
          Show points
        </label>
        <label class="checkbox-item">
          <input
            type="checkbox"
            .checked=${t.show_duration ?? !1}
            @change=${(e) => this._update({ show_duration: e.target.checked })}
          />
          Show suggested duration
        </label>
        ${this._extraToggles().map(
      (e) => l`
            <label class="checkbox-item">
              <input
                type="checkbox"
                .checked=${!!t[e]}
                @change=${(s) => this._update({ [e]: s.target.checked })}
              />
              ${this._label(e)}
            </label>
          `
    )}
        <label class="checkbox-item">
          <input
            type="checkbox"
            .checked=${t.color_by_points ?? !1}
            @change=${(e) => this._update({ color_by_points: e.target.checked })}
          />
          Color points badge by value
        </label>
        ${t.color_by_points ? this._renderFallbackColorFields() : h}
        ${this._renderFallbackExtras()}
        ${L.map((e) => {
      const s = X(e, t[`${e}_action`]);
      return l`
            <label>
              ${oe[`${e}_behavior`]}
              <select
                class="behavior"
                @change=${(i) => this._update({
        [`${e}_behavior`]: i.target.value
      })}
              >
                ${Ue.map(
        (i) => l`<option value=${i.value} ?selected=${i.value === s}>
                      ${i.label}
                    </option>`
      )}
              </select>
              ${s === O ? l`<span class="hint">Edit this action in YAML.</span>` : h}
            </label>
          `;
    })}
        <label>
          Timer helper
          <input
            type="text"
            class="timer-entity"
            list="${V}-timers"
            placeholder="timer.chores"
            .value=${t.timer_entity ?? ""}
            @input=${(e) => this._update({ timer_entity: e.target.value.trim() })}
          />
        </label>
        <datalist id="${V}-timers">
          ${Object.keys(this.hass.states).filter((e) => e.startsWith("timer.")).sort().map((e) => l`<option value=${e}></option>`)}
        </datalist>
      </div>
    `;
  }
  _renderFallbackColorFields() {
    const t = this._formData();
    return l`
      <label>
        High value threshold (points)
        <input
          type="number"
          min="1"
          .value=${String(t.high_points)}
          @input=${(e) => {
      const s = Number(e.target.value);
      Number.isFinite(s) && s > 0 && this._update({ high_points: s });
    }}
        />
      </label>
      <div class="colors">
        ${Le.map(
      (e) => l`
            <label class="color-item">
              <input
                type="color"
                .value=${Bt(t[e])}
                @input=${(s) => this._update({
        [e]: T(
          s.target.value,
          re[e]
        )
      })}
              />
              ${oe[e]}
            </label>
          `
    )}
      </div>
    `;
  }
  /**
   * Merge `changes` into the config, drop values equal to their defaults
   * (show_description/show_points true, show_duration and color_by_points false, default threshold/colors, unset
   * actions) so the YAML stays minimal, then notify Lovelace. The color
   * settings are kept while color_by_points is off, so toggling it back on
   * restores them.
   */
  _update(t) {
    const e = { ...this._config, ...t };
    for (const s of L) {
      const i = `${s}_behavior`, o = `${s}_action`, r = e[i];
      delete e[i], r !== void 0 && (r !== O ? e[o] = { action: r } : X(s, e[o]) !== O && (e[o] = { action: "more-info" }));
    }
    for (const s of this._extraToggles())
      e[s] || delete e[s];
    for (const [s, i] of Object.entries(this._extraDefaults()))
      (e[s] === void 0 || e[s] === i) && delete e[s];
    e.show_description !== !1 && delete e.show_description, e.show_points !== !1 && delete e.show_points, e.show_duration || delete e.show_duration, e.timer_entity || delete e.timer_entity, e.color_by_points || delete e.color_by_points, (e.high_points === void 0 || e.high_points === ae) && delete e.high_points;
    for (const s of Le) {
      const i = e[s];
      (i === void 0 || Wt(T(i, re[s]), re[s])) && delete e[s];
    }
    for (const s of L) {
      const i = `${s}_action`, o = e[i], r = o?.action === we[s] && Object.keys(o).length === 1;
      (!o || r) && delete e[i];
    }
    this._config = e, this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: e },
        bubbles: !0,
        composed: !0
      })
    );
  }
};
E.styles = Y`
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
    .hint {
      font-size: 12px;
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
    .colors {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 20px;
    }
    .color-item {
      flex-direction: row;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--primary-text-color, #212121);
    }
    .checkbox-item {
      flex-direction: row;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--primary-text-color, #212121);
    }
  `;
te([
  M({ attribute: !1 })
], E.prototype, "hass", 2);
te([
  _()
], E.prototype, "_config", 2);
te([
  _()
], E.prototype, "_haForm", 2);
E = te([
  D("simple-chores-chore-card-editor")
], E);
var Vt = Object.defineProperty, Xt = Object.getOwnPropertyDescriptor, I = (t, e, s, i) => {
  for (var o = i > 1 ? void 0 : i ? Xt(e, s) : e, r = t.length - 1, n; r >= 0; r--)
    (n = t[r]) && (o = (i ? n(e, s, o) : n(o)) || o);
  return i && o && Vt(e, s, o), o;
};
const Gt = 500, Zt = 250, Jt = 10;
function xe(t, e) {
  return t.startsWith(Ke) && !t.startsWith(Ve) && !t.startsWith(Xe) && !t.startsWith(Ge) && (e === void 0 || !!e.attributes?.chore_slug);
}
let w = class extends v {
  constructor() {
    super(...arguments), this._pressConsumed = !1, this._pressStart = null, this._activating = !1, this._menuOpen = !1, this._clockTick = 0, this._keyboardPress = !1;
  }
  setConfig(t) {
    if (!t.entity)
      throw new Error("simple-chores-chore-card: 'entity' is required");
    t.entity !== this._config?.entity && (this._lastState = void 0), this._config = t;
  }
  getCardSize() {
    return 2;
  }
  static getStubConfig(t) {
    return { entity: Object.entries(t?.states ?? {}).find(
      ([s, i]) => xe(s, i)
    )?.[0] ?? "" };
  }
  static async getConfigElement() {
    return document.createElement("simple-chores-chore-card-editor");
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._clearTimers(), this._stopClock(), this._menuOpen = !1;
  }
  connectedCallback() {
    super.connectedCallback(), this.hasUpdated && this._syncClock();
  }
  shouldUpdate(t) {
    if (t.has("_config") || !this._config || t.has("_menuOpen") || t.has("_clockTick") || t.has("_activating"))
      return !0;
    const e = t.get("hass");
    if (!e) return !0;
    const s = this._config.timer_entity;
    return e.states[this._config.entity] !== this.hass.states[this._config.entity] || s !== void 0 && e.states[s] !== this.hass.states[s];
  }
  willUpdate() {
    const t = this._config && this.hass?.states[this._config.entity]?.state;
    t !== void 0 && (t === "Active" && this._lastState !== void 0 && this._lastState !== "Active" ? this._activating = !0 : t !== "Active" && (this._activating = !1), this._lastState = t);
  }
  render() {
    if (!this._config || !this.hass) return h;
    const t = this.hass.states[this._config.entity];
    if (!t)
      return l`
        <ha-card>
          <div class="warning">Entity not found: ${this._config.entity}</div>
        </ha-card>
      `;
    const e = t.attributes, s = t.state, i = e.chore_name ?? e.friendly_name ?? this._config.entity, o = e.description ?? "", r = e.icon ?? Ze, n = e.points ?? e.default_points, c = s === "Complete", a = s === "Active", p = this._config.show_description ?? !0, u = this._config.show_points ?? !0, d = this._config.show_duration && e.suggested_duration > 0 ? e.suggested_duration : null, f = this._timerStatus(t), m = f?.remaining ?? null, b = f?.paused ?? !1;
    return l`
      <ha-card
        class="chore ${c ? "complete" : s === "Not Requested" ? "not-requested" : "outstanding"} ${a ? "active" : ""} ${this._menuOpen ? "menu-open" : ""} ${this._activating ? "activating" : ""}"
        tabindex="0"
        role="button"
        aria-label="${i}: ${s}"
        aria-expanded=${this._menuOpen ? "true" : "false"}
        aria-disabled=${s === "Not Requested" ? "true" : "false"}
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._onPointerUp}
        @pointercancel=${this._cancelPress}
        @pointerleave=${this._cancelPress}
        @contextmenu=${(se) => se.preventDefault()}
        @keydown=${this._onKeyDown}
        @animationend=${(se) => {
      se.animationName === "sc-activate" && (this._activating = !1);
    }}
      >
        <div class="icon-wrap">
          <ha-icon class="icon" .icon=${r}></ha-icon>
          ${c ? l`<span class="check"><ha-icon .icon=${"mdi:check"}></ha-icon></span>` : a ? l`<span class="in-progress" title="In progress">
                  <ha-icon .icon=${"mdi:progress-clock"}></ha-icon>
                </span>` : h}
        </div>
        <div class="text">
          <div class="name">${i}</div>
          ${o && p ? l`<div class="description">${o}</div>` : h}
          ${d !== null ? l`<div class="duration" title="Suggested duration">
                <ha-icon .icon=${"mdi:timer-outline"}></ha-icon>
                <span>${St(d)}</span>
              </div>` : h}
          ${m !== null ? l`<div class="timer ${b ? "paused" : ""} ${m <= 0 ? "done" : ""}">
                <ha-icon .icon=${b ? "mdi:timer-pause-outline" : "mdi:timer-outline"}></ha-icon>
                <span>
                  ${m <= 0 ? "Time's up!" : `${Lt(m)} left${b ? " · paused" : ""}`}
                </span>
              </div>` : h}
        </div>
        ${n !== void 0 && u ? this._renderBadge(n) : h}
        ${this._renderMenu(t)}
      </ha-card>
    `;
  }
  /**
   * The slide-in options panel. Always rendered (hidden while closed) so it
   * can animate out as well as in. Pointer events inside it are kept from
   * reaching the card's own gesture handlers.
   */
  _renderMenu(t) {
    const e = this._menuOpen, s = Rt(t, this._timerEntity()), i = (o) => o.stopPropagation();
    return l`
      <div
        class="scrim ${e ? "open" : ""}"
        @pointerdown=${(o) => {
      o.stopPropagation(), this._closeMenu();
    }}
        @pointerup=${i}
      ></div>
      <div
        class="menu ${e ? "open" : ""}"
        role="menu"
        aria-hidden=${e ? "false" : "true"}
        @pointerdown=${i}
        @pointerup=${i}
      >
        ${s.map(
      (o, r) => l`
            <button
              class="menu-item ${o.id}"
              role="menuitem"
              style="--i: ${r}"
              tabindex=${e ? "0" : "-1"}
              @click=${(n) => {
        n.stopPropagation(), this._closeMenu(), this._run(o.id);
      }}
            >
              <ha-icon .icon=${o.icon}></ha-icon>
              <span>${o.label}</span>
            </button>
          `
    )}
      </div>
    `;
  }
  _openMenu() {
    this._menuOpen = !0, this._keyboardPress && this.updateComplete.then(
      () => this.shadowRoot?.querySelector(".menu-item")?.focus({ preventScroll: !0 })
    );
  }
  _closeMenu() {
    this._menuOpen && (this._menuOpen = !1, this.shadowRoot?.querySelector("ha-card")?.focus({ preventScroll: !0 }));
  }
  updated() {
    this._syncClock();
  }
  /** The configured timer helper's state, if it's set and exists. */
  _timerEntity() {
    const t = this._config.timer_entity;
    return t ? this.hass.states[t] : void 0;
  }
  _timerStatus(t) {
    return Ut(t, this._timerEntity(), !!this._config.timer_entity);
  }
  /** Tick every second while a timer is running; stop otherwise. */
  _syncClock() {
    const t = this._config && this.hass?.states[this._config.entity], e = t ? this._timerStatus(t) : null, s = e !== null && !e.paused;
    s && this._clockInterval === void 0 ? this._clockInterval = setInterval(() => this._clockTick++, 1e3) : s || this._stopClock();
  }
  _stopClock() {
    clearInterval(this._clockInterval), this._clockInterval = void 0;
  }
  _renderBadge(t) {
    const e = this._config;
    if (!e.color_by_points)
      return l`<div class="badge" title="${t} points">${t}</div>`;
    const [s, i, o] = Ht(
      t,
      e.high_points ?? ae,
      T(e.low_points_color, be),
      T(e.high_points_color, ye)
    );
    return l`<div
      class="badge points-colored"
      style="--sc-badge-color: rgb(${s}, ${i}, ${o})"
      title="${t} points"
    >
      ${t}
    </div>`;
  }
  // --- Gestures -----------------------------------------------------------
  _onPointerDown(t) {
    t.button !== void 0 && t.button !== 0 || this._menuOpen || (this._pressConsumed = !1, this._pressStart = { x: t.clientX, y: t.clientY }, clearTimeout(this._holdTimer), this._holdTimer = setTimeout(() => {
      this._pressConsumed = !0, this._handleAction("hold");
    }, Gt));
  }
  _onPointerMove(t) {
    if (!this._pressStart) return;
    const e = t.clientX - this._pressStart.x, s = t.clientY - this._pressStart.y;
    Math.hypot(e, s) > Jt && this._cancelPress();
  }
  _onPointerUp() {
    clearTimeout(this._holdTimer);
    const t = this._pressStart !== null;
    this._pressStart = null, !(!t || this._pressConsumed) && (!this._config.double_tap_action || this._config.double_tap_action.action === "none" ? this._handleAction("tap") : this._tapTimer !== void 0 ? (clearTimeout(this._tapTimer), this._tapTimer = void 0, this._handleAction("double_tap")) : this._tapTimer = setTimeout(() => {
      this._tapTimer = void 0, this._handleAction("tap");
    }, Zt));
  }
  _cancelPress() {
    clearTimeout(this._holdTimer), this._pressStart = null, this._pressConsumed = !0;
  }
  _clearTimers() {
    clearTimeout(this._holdTimer), clearTimeout(this._tapTimer), this._tapTimer = void 0;
  }
  _onKeyDown(t) {
    if (t.key === "Escape" && this._menuOpen) {
      t.preventDefault(), this._closeMenu();
      return;
    }
    if (t.target === t.currentTarget && (t.key === "Enter" || t.key === " ")) {
      t.preventDefault(), this._keyboardPress = !0;
      try {
        this._handleAction("tap");
      } finally {
        this._keyboardPress = !1;
      }
    }
  }
  // --- Actions ------------------------------------------------------------
  _handleAction(t) {
    if (this.hass.states[this._config.entity]?.state === "Not Requested") return;
    const e = this._config[`${t}_action`]?.action ?? we[t];
    if (e === "none") return;
    if (e === $e) {
      this._menuOpen ? this._closeMenu() : this._openMenu();
      return;
    }
    const s = Qe(e);
    if (s?.operation) {
      const i = this.hass.states[this._config.entity], o = i && s.operation(i.state);
      o && this._run(o);
      return;
    }
    this._fire("hass-action", {
      config: {
        entity: this._config.entity,
        tap_action: this._config.tap_action,
        hold_action: this._config.hold_action,
        double_tap_action: this._config.double_tap_action
      },
      action: t
    });
  }
  /**
   * Carry out a chore operation: the chore service, plus the matching call
   * on the timer helper when one is configured. The chore goes first, so a
   * failed chore update never leaves the timer running on its own.
   */
  async _run(t) {
    const e = this.hass.states[this._config.entity];
    if (!e) return;
    const s = {
      chore_slug: e.attributes.chore_slug,
      user: e.attributes.assignee
    }, i = this._config.timer_entity, o = this._timerEntity()?.state, r = (n, c = {}) => i ? this.hass.callService("timer", n, { entity_id: i, ...c }) : void 0;
    try {
      switch (t) {
        case "complete":
          await this.hass.callService(z, "mark_complete", s), (o === "active" || o === "paused") && await r("cancel");
          break;
        case "incomplete":
          await this.hass.callService(z, "mark_pending", s);
          break;
        case "start": {
          (e.state !== "Active" || i) && await this.hass.callService(z, "mark_active", {
            ...s,
            ...i ? { timer_entity: i } : {}
          });
          const n = It(e);
          await r("start", n ? { duration: n } : {});
          break;
        }
        case "pause":
          await r("pause");
          break;
        case "resume":
          await r("start");
          break;
        case "stop":
          await this.hass.callService(z, "mark_pending", s), (o === "active" || o === "paused") && await r("cancel");
          break;
      }
      this._fire("haptic", t === "complete" ? "success" : "light");
    } catch (n) {
      this._fire("hass-notification", {
        message: `Couldn't update chore: ${n instanceof Error ? n.message : String(n)}`
      });
    }
  }
  _fire(t, e) {
    this.dispatchEvent(new CustomEvent(t, { detail: e, bubbles: !0, composed: !0 }));
  }
};
w.styles = Y`
    :host {
      --sc-badge-color: var(--primary-color, #03a9f4);
      --sc-active-color: var(--accent-color, #ff9800);
      --sc-badge-active-color: var(--sc-active-color);
      --sc-complete-check-color: var(--success-color, #43a047);
    }
    ha-card.chore {
      position: relative;
      display: flex;
      align-items: center;
      gap: 24px;
      min-height: 96px;
      padding: 16px 56px 16px 24px;
      box-sizing: border-box;
      cursor: pointer;
      outline: none;
      /* Clips the options panel while it's slid out past the right edge.
         clip (unlike hidden) can't be scrolled, even programmatically. */
      overflow: hidden;
      overflow: clip;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
      -webkit-tap-highlight-color: transparent;
    }
    ha-card.chore:focus-visible {
      box-shadow: 0 0 0 2px var(--primary-color);
    }
    /* Cards keep the theme's own card background in every state; outstanding
       vs complete is told apart by the faded content of complete chores. */
    /* In progress: ringed in the theme's accent color. */
    ha-card.active {
      box-shadow: 0 0 0 2px var(--sc-active-color);
    }
    ha-card.active .icon {
      color: var(--sc-active-color);
    }
    ha-card.active:focus-visible {
      box-shadow:
        0 0 0 2px var(--sc-active-color),
        0 0 0 4px var(--primary-color);
    }
    /* One-off "just started" pop: a quick bounce with an accent ripple. */
    ha-card.activating {
      animation: sc-activate 700ms ease-out;
    }
    ha-card.activating .icon-wrap {
      animation: sc-activate-icon 700ms ease-out;
    }
    @keyframes sc-activate {
      0% {
        box-shadow: 0 0 0 0 var(--sc-active-color);
      }
      40% {
        box-shadow:
          0 0 0 2px var(--sc-active-color),
          0 0 0 10px color-mix(in srgb, var(--sc-active-color) 35%, transparent);
      }
      100% {
        box-shadow:
          0 0 0 2px var(--sc-active-color),
          0 0 0 18px transparent;
      }
    }
    @keyframes sc-activate-icon {
      0% {
        transform: scale(1);
      }
      35% {
        transform: scale(1.18);
      }
      100% {
        transform: scale(1);
      }
    }
    .in-progress {
      position: absolute;
      right: -8px;
      bottom: -8px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--sc-active-color);
      display: flex;
      align-items: center;
      justify-content: center;
      --mdc-icon-size: 22px;
      color: var(--text-primary-color, #fff);
      animation: sc-pulse 2s ease-in-out infinite;
    }
    /* Gentle ongoing pulse so an in-progress chore reads as "live". */
    @keyframes sc-pulse {
      0%,
      100% {
        box-shadow: 0 0 0 0 color-mix(in srgb, var(--sc-active-color) 60%, transparent);
      }
      50% {
        box-shadow: 0 0 0 6px transparent;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      ha-card.activating,
      ha-card.activating .icon-wrap,
      .in-progress,
      .menu.open .menu-item {
        animation: none;
      }
      .menu,
      .menu.open,
      .scrim {
        transition: none;
      }
    }
    ha-card.complete .icon,
    ha-card.complete .text,
    ha-card.complete .badge,
    ha-card.not-requested .icon,
    ha-card.not-requested .text,
    ha-card.not-requested .badge {
      opacity: 0.5;
    }
    /* Not requested: a complete chore's look, with the whole card at 50% -
       back to full strength while its options panel is open, so the panel
       itself stays readable. */
    ha-card.not-requested {
      cursor: default;
      opacity: 0.5;
      transition: opacity 200ms ease;
    }
    ha-card.not-requested.menu-open {
      opacity: 1;
    }
    .icon-wrap {
      position: relative;
      flex: 0 0 auto;
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon {
      --mdc-icon-size: 56px;
      color: var(--primary-text-color);
    }
    .check {
      position: absolute;
      right: -8px;
      bottom: -8px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--sc-complete-check-color);
      display: flex;
      align-items: center;
      justify-content: center;
      --mdc-icon-size: 22px;
      color: var(--text-primary-color, #fff);
    }
    .text {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .name {
      font-size: 2em;
      line-height: 1.2;
      color: var(--primary-text-color);
    }
    .description {
      font-size: 1.05em;
      line-height: 1.35;
      color: var(--primary-text-color);
    }
    .duration {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 1.05em;
      color: var(--secondary-text-color);
      --mdc-icon-size: 20px;
    }
    .timer {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 1.05em;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      color: var(--sc-active-color);
      --mdc-icon-size: 20px;
    }
    .timer.paused {
      color: var(--secondary-text-color);
    }
    .timer.done {
      color: var(--error-color, #db4437);
    }
    /* Options panel: slides in from the right over a light scrim. */
    .scrim {
      position: absolute;
      inset: 0;
      z-index: 1;
      background: color-mix(
        in srgb,
        var(--ha-card-background, var(--card-background-color, #fff)) 55%,
        transparent
      );
      opacity: 0;
      pointer-events: none;
      transition: opacity 200ms ease;
    }
    .scrim.open {
      opacity: 1;
      pointer-events: auto;
    }
    .menu {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 2;
      max-width: 100%;
      box-sizing: border-box;
      display: flex;
      align-items: stretch;
      gap: 8px;
      padding: 8px;
      background: var(--ha-card-background, var(--card-background-color, #fff));
      box-shadow: -6px 0 16px rgba(0, 0, 0, 0.18);
      transform: translateX(calc(100% + 20px));
      visibility: hidden;
      transition:
        transform 240ms cubic-bezier(0.4, 0, 0.2, 1),
        visibility 0s linear 240ms;
      cursor: default;
    }
    .menu.open {
      transform: none;
      visibility: visible;
      transition: transform 240ms cubic-bezier(0.2, 0, 0, 1);
    }
    .menu-item {
      --sc-item-color: var(--primary-color);
      flex: 0 0 auto;
      min-width: 76px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 6px 10px;
      border: none;
      border-radius: 12px;
      font: inherit;
      font-size: 0.95em;
      font-weight: 500;
      color: var(--sc-item-color);
      background: color-mix(in srgb, var(--sc-item-color) 14%, transparent);
      cursor: pointer;
      --mdc-icon-size: 30px;
      -webkit-tap-highlight-color: transparent;
    }
    .menu-item:hover {
      background: color-mix(in srgb, var(--sc-item-color) 24%, transparent);
    }
    .menu-item:focus-visible {
      outline: 2px solid var(--sc-item-color);
      outline-offset: 1px;
    }
    .menu.open .menu-item {
      animation: sc-item-in 260ms cubic-bezier(0.2, 0, 0, 1) both;
      animation-delay: calc(var(--i) * 45ms);
    }
    @keyframes sc-item-in {
      from {
        opacity: 0;
        transform: translateX(16px);
      }
    }
    .menu-item.complete {
      --sc-item-color: var(--success-color, #43a047);
    }
    .menu-item.start,
    .menu-item.resume,
    .menu-item.pause {
      --sc-item-color: var(--sc-active-color);
    }
    .menu-item.stop {
      --sc-item-color: var(--error-color, #db4437);
    }
    .menu-item.incomplete {
      --sc-item-color: var(--secondary-text-color);
    }
    .badge {
      position: absolute;
      top: 8px;
      right: 8px;
      min-width: 32px;
      height: 32px;
      padding: 0 6px;
      box-sizing: border-box;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 15px;
      font-variant-numeric: tabular-nums;
      color: var(--text-primary-color, #fff);
      background: var(--sc-badge-color);
    }
    ha-card.active .badge:not(.points-colored) {
      background: var(--sc-badge-active-color);
    }
    .warning {
      padding: 16px;
      color: var(--error-color, #db4437);
    }
  `;
I([
  M({ attribute: !1 })
], w.prototype, "hass", 2);
I([
  _()
], w.prototype, "_config", 2);
I([
  _()
], w.prototype, "_activating", 2);
I([
  _()
], w.prototype, "_menuOpen", 2);
I([
  _()
], w.prototype, "_clockTick", 2);
w = I([
  D("simple-chores-chore-card")
], w);
window.customCards = window.customCards ?? [];
window.customCards.push({
  type: "simple-chores-chore-card",
  name: "Chore",
  description: "Shows a single Simple Chores chore with its points and completion state.",
  preview: !0
});
var Qt = Object.defineProperty, es = Object.getOwnPropertyDescriptor, et = (t, e, s, i) => {
  for (var o = i > 1 ? void 0 : i ? es(e, s) : e, r = t.length - 1, n; r >= 0; r--)
    (n = t[r]) && (o = (i ? n(e, s, o) : n(o)) || o);
  return i && o && Qt(e, s, o), o;
};
const ze = "simple-chores-chore-list-card-editor-assignees", ne = {
  assignee: "Assignee",
  show_not_requested: "Show not requested chores",
  completed_last: "Move completed chores to the end",
  hide_completed: "Hide completed chores",
  hide_completed_after: "Hide completed chores after (seconds)"
}, ts = {
  hide_completed_after: "How long a completed chore stays visible before it fades out."
};
let ce = class extends E {
  constructor() {
    super(...arguments), this._config = {
      type: "custom:simple-chores-chore-list-card",
      assignee: ""
    };
  }
  _assignees() {
    return ge(fe(this.hass.states), []);
  }
  _targetSchema() {
    return [
      {
        name: "assignee",
        required: !0,
        selector: {
          select: {
            options: this._assignees(),
            custom_value: !0,
            mode: "dropdown"
          }
        }
      }
    ];
  }
  _renderFallbackTarget() {
    return l`
      <label>
        Assignee
        <input
          type="text"
          list=${ze}
          placeholder="username"
          .value=${this._config.assignee ?? ""}
          @input=${(t) => this._update({ assignee: t.target.value })}
        />
      </label>
      <datalist id=${ze}>
        ${this._assignees().map((t) => l`<option value=${t}></option>`)}
      </datalist>
    `;
  }
  _extraToggles() {
    return ["show_not_requested", "completed_last"];
  }
  _extraDefaults() {
    return { hide_completed: !0, hide_completed_after: le };
  }
  _hideCompleted() {
    return this._config.hide_completed ?? !0;
  }
  _extraSchema() {
    return [
      { name: "hide_completed", selector: { boolean: {} } },
      ...this._hideCompleted() ? [
        {
          name: "hide_completed_after",
          selector: {
            number: { min: 0, step: 1, mode: "box", unit_of_measurement: "s" }
          }
        }
      ] : []
    ];
  }
  _renderFallbackExtras() {
    const t = this._config.hide_completed_after ?? le;
    return l`
      <label class="checkbox-item">
        <input
          type="checkbox"
          .checked=${this._hideCompleted()}
          @change=${(e) => this._update({ hide_completed: e.target.checked })}
        />
        ${ne.hide_completed}
      </label>
      ${this._hideCompleted() ? l`<label>
            ${ne.hide_completed_after}
            <input
              type="number"
              min="0"
              class="hide-after"
              .value=${String(t)}
              @input=${(e) => {
      const s = Number(e.target.value);
      Number.isFinite(s) && s >= 0 && this._update({ hide_completed_after: s });
    }}
            />
          </label>` : h}
    `;
  }
  _helper(t) {
    return ts[t] ?? super._helper(t);
  }
  _label(t) {
    return ne[t] ?? super._label(t);
  }
};
et([
  _()
], ce.prototype, "_config", 2);
ce = et([
  D("simple-chores-chore-list-card-editor")
], ce);
var ss = Object.defineProperty, is = Object.getOwnPropertyDescriptor, R = (t, e, s, i) => {
  for (var o = i > 1 ? void 0 : i ? is(e, s) : e, r = t.length - 1, n; r >= 0; r--)
    (n = t[r]) && (o = (i ? n(e, s, o) : n(o)) || o);
  return i && o && ss(e, s, o), o;
};
const le = 30, os = 300, rs = 250, ns = [
  "type",
  "assignee",
  "show_not_requested",
  "hide_completed",
  "hide_completed_after",
  "completed_last"
];
function as(t, e, s = !1) {
  const i = e.toLowerCase();
  return Object.entries(t).filter(
    ([o, r]) => xe(o, r) && String(r.attributes.assignee ?? "").toLowerCase() === i && (s || r.state !== "Not Requested")
  ).map(([o, r]) => ({
    id: o,
    name: String(r.attributes.chore_name ?? o)
  })).sort((o, r) => o.name.localeCompare(r.name) || o.id.localeCompare(r.id)).map((o) => o.id);
}
function je() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? !1;
}
let x = class extends v {
  constructor() {
    super(...arguments), this._entityIds = [], this._tick = 0, this._cards = /* @__PURE__ */ new Map(), this._hiding = /* @__PURE__ */ new Map(), this._hidden = /* @__PURE__ */ new Set(), this._allDone = !1, this._firstSeenComplete = /* @__PURE__ */ new Map(), this._prevRects = null;
  }
  setConfig(t) {
    if (!t.assignee)
      throw new Error("simple-chores-chore-list-card: 'assignee' is required");
    this._config = t;
  }
  getCardSize() {
    return Math.max(1, this._entityIds.length * 2);
  }
  static getStubConfig(t) {
    return { assignee: (t ? ge(fe(t.states), []) : [])[0] ?? "" };
  }
  static async getConfigElement() {
    return document.createElement("simple-chores-chore-list-card-editor");
  }
  connectedCallback() {
    super.connectedCallback(), this._config && this._tick++;
  }
  disconnectedCallback() {
    super.disconnectedCallback(), clearTimeout(this._hideTimer);
  }
  /** When a completed chore should be hidden, or null if it shouldn't be. */
  _hideAt(t, e) {
    const s = this.hass.states[t];
    if (!s || s.state !== "Complete")
      return this._firstSeenComplete.delete(t), null;
    if (!(this._config.hide_completed ?? !0)) return null;
    let i = s.last_changed ? Date.parse(s.last_changed) : NaN;
    Number.isNaN(i) && (this._firstSeenComplete.has(t) || this._firstSeenComplete.set(t, e), i = this._firstSeenComplete.get(t));
    const o = Math.max(0, this._config.hide_completed_after ?? le);
    return i + o * 1e3;
  }
  willUpdate(t) {
    if (!(!this._config || !this.hass)) {
      if (t.has("_config"))
        for (const [e, s] of this._cards) s.setConfig(this._childConfig(e));
      (t.has("hass") || t.has("_config") || t.has("_tick")) && this._refreshEntityIds();
      for (const e of [...this._cards.keys()])
        this._entityIds.includes(e) || this._cards.delete(e);
      for (const e of this._entityIds) {
        let s = this._cards.get(e);
        s || (s = document.createElement("simple-chores-chore-card"), s.setConfig(this._childConfig(e)), this._cards.set(e, s)), s.hass = this.hass;
      }
    }
  }
  _refreshEntityIds() {
    const t = Date.now(), e = new Set(this._entityIds);
    let s = 1 / 0;
    const i = as(
      this.hass.states,
      this._config.assignee,
      this._config.show_not_requested ?? !1
    ), o = i.filter((r) => {
      const n = this._hideAt(r, t);
      return n === null || n > t ? (this._hiding.has(r) && this._cancelHide(r), this._hidden.delete(r), n !== null && (s = Math.min(s, n)), !0) : this._hiding.has(r) ? !0 : this._hidden.has(r) ? !1 : e.has(r) && this._cards.get(r)?.isConnected ? (this._startHide(r), !0) : !1;
    });
    if (this._config.completed_last) {
      const r = (n) => this.hass.states[n]?.state === "Complete" ? 1 : 0;
      o.sort((n, c) => r(n) - r(c));
    }
    if (this._allDone = o.length === 0 && i.length > 0, clearTimeout(this._hideTimer), s !== 1 / 0 && this.isConnected) {
      const r = Math.min(s - t, 2147483647);
      this._hideTimer = setTimeout(() => this._tick++, r);
    }
    o.join("|") !== this._entityIds.join("|") && (this._prevRects = this._captureRects(), this._entityIds = o);
  }
  _startHide(t) {
    const e = this._cards.get(t);
    e.style.pointerEvents = "none";
    const s = () => {
      this._hiding.has(t) && (this._hiding.delete(t), this._hidden.add(t), this._tick++);
    };
    if (typeof e.animate != "function" || je()) {
      this._hiding.set(t, null), queueMicrotask(s);
      return;
    }
    const i = e.animate(
      [
        { opacity: 1, transform: "scale(1)" },
        { opacity: 0, transform: "scale(0.96)" }
      ],
      { duration: os, easing: "ease-in", fill: "forwards" }
    );
    this._hiding.set(t, i), i.onfinish = s;
  }
  _cancelHide(t) {
    this._hiding.get(t)?.cancel(), this._hiding.delete(t);
    const e = this._cards.get(t);
    e && (e.style.pointerEvents = "");
  }
  _captureRects() {
    if (je()) return null;
    const t = /* @__PURE__ */ new Map();
    for (const [e, s] of this._cards)
      s.isConnected && t.set(e, s.getBoundingClientRect());
    return t;
  }
  updated() {
    const t = this._prevRects;
    if (this._prevRects = null, !!t)
      for (const [e, s] of this._cards) {
        const i = t.get(e);
        if (!i || typeof s.animate != "function" || this._hiding.has(e)) continue;
        const o = i.top - s.getBoundingClientRect().top;
        Math.abs(o) < 1 || s.animate(
          [{ transform: `translateY(${o}px)` }, { transform: "translateY(0)" }],
          { duration: rs, easing: "ease-out" }
        );
      }
  }
  _childConfig(t) {
    const e = { ...this._config };
    for (const s of ns) delete e[s];
    return { ...e, type: "custom:simple-chores-chore-card", entity: t };
  }
  render() {
    return !this._config || !this.hass ? h : this._entityIds.length === 0 ? l`<ha-card class="empty">
        ${this._allDone ? "All done!" : `No chores for ${this._config.assignee}`}
      </ha-card>` : l`${this._entityIds.map((t) => this._cards.get(t))}`;
  }
};
x.styles = Y`
    :host {
      display: flex;
      flex-direction: column;
      /* Same spacing HA's own vertical-stack card uses between cards. */
      gap: var(--vertical-stack-card-gap, var(--stack-card-gap, 8px));
      background: none;
    }
    .empty {
      padding: 16px;
      color: var(--secondary-text-color);
    }
  `;
R([
  M({ attribute: !1 })
], x.prototype, "hass", 2);
R([
  _()
], x.prototype, "_config", 2);
R([
  _()
], x.prototype, "_entityIds", 2);
R([
  _()
], x.prototype, "_tick", 2);
R([
  _()
], x.prototype, "_allDone", 2);
x = R([
  D("simple-chores-chore-list-card")
], x);
window.customCards = window.customCards ?? [];
window.customCards.push({
  type: "simple-chores-chore-list-card",
  name: "Chore list",
  description: "Shows every Simple Chores chore for one assignee as a list of chore cards.",
  preview: !0
});
