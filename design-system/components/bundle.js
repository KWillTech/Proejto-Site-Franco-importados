/* @ds-bundle: {"format":4,"namespace":"Franco","components":[{"name":"Button"},{"name":"Icon"},{"name":"Badge"},{"name":"Input"},{"name":"Price"},{"name":"QuantityStepper"},{"name":"ProductCard"},{"name":"Navbar"},{"name":"Hero"},{"name":"SectionHeading"},{"name":"Alert"},{"name":"Footer"}]} */
(function () {
  var React = window.React, h = React.createElement;
  var LOGO_DARK_INK = "/design-system/assets/Logos/franco-logo-preto.png";  /* logotipo preta, fundo transparente */
  var LOGO_LIGHT_INK = "/design-system/assets/Logos/franco-logo-branco.png"; /* logotipo branca, fundo transparente */

  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(" "); }
  function rest(p, keys) { var o = {}; for (var k in p) if (keys.indexOf(k) < 0) o[k] = p[k]; return o; }

  var PATHS = {
    sacola: ["M5 8h14l-1 12H6L5 8z", "M9 8V6a3 3 0 0 1 6 0v2"],
    busca: ["M20 20l-4.5-4.5", { c: [11, 11, 6] }],
    conta: ["M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6", { c: [12, 8, 4] }],
    menu: ["M4 7h16M4 12h16M4 17h16"],
    fechar: ["M6 6l12 12M18 6L6 18"],
    mais: ["M12 5v14M5 12h14"],
    menos: ["M5 12h14"],
    favorito: ["M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"],
    caminhao: ["M3 6h11v10H3z", "M14 10h4l3 3v3h-7", { c: [7, 18, 1.6] }, { c: [17, 18, 1.6] }],
    "seta-direita": ["M5 12h14M13 6l6 6-6 6"],
    conversa: ["M4 5h16v11H9l-5 4V5z"],
    check: ["M5 12.5l4.5 4.5L19 7.5"]
  };

  function Icon(p) {
    var parts = PATHS[p.name] || [];
    var size = p.size || 20;
    return h("svg", { className: cx("fi-icon", p.className), width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "square", strokeLinejoin: "miter", "aria-hidden": p.label ? undefined : true, role: p.label ? "img" : undefined, "aria-label": p.label },
      parts.map(function (d, i) { return typeof d === "string" ? h("path", { key: i, d: d }) : h("circle", { key: i, cx: d.c[0], cy: d.c[1], r: d.c[2] }); }));
  }

  function Button(p) {
    var variant = p.variant || "primary", size = p.size || "md";
    var tag = p.href ? "a" : "button";
    var props = rest(p, ["variant", "size", "full", "icon", "iconRight", "className", "children"]);
    if (!p.href && !props.type) props.type = "button";
    props.className = cx("fi-btn", "fi-btn-" + variant, size !== "md" && "fi-btn-" + size, p.full && "fi-btn-full", p.className);
    return h(tag, props, p.icon && h(Icon, { name: p.icon, size: 18 }), p.children, p.iconRight && h(Icon, { name: p.iconRight, size: 18 }));
  }

  function Badge(p) {
    return h("span", { className: cx("fi-badge", "fi-badge-" + (p.tone || "neutral"), p.className) }, p.children);
  }

  var uid = 0;
  function Input(p) {
    var idRef = React.useRef(null); if (!idRef.current) idRef.current = p.id || "fi-in-" + (++uid);
    var id = idRef.current, hint = p.error || p.hint, hintId = hint ? id + "-hint" : undefined;
    var props = rest(p, ["label", "hint", "error", "className"]);
    props.id = id; props.className = "fi-input"; props["aria-invalid"] = p.error ? true : undefined; props["aria-describedby"] = hintId;
    return h("div", { className: cx("fi-field", p.error && "fi-field-error", p.className) },
      p.label && h("label", { className: "fi-field-label", htmlFor: id }, p.label),
      h("input", props),
      hint && h("span", { className: "fi-field-hint", id: hintId }, p.error || p.hint));
  }

  var BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  function money(v) { return BRL.format(v).replace(/ /g, " "); }
  function Price(p) {
    var onSale = p.compareAt != null && p.compareAt > p.value;
    var n = p.installments || 0;
    return h("div", { className: cx("fi-price", onSale && "fi-price-sale", p.size === "sm" && "fi-price-sm", p.className) },
      h("div", { className: "fi-price-line" },
        onSale && h("s", { className: "fi-price-was", "aria-label": "De " + money(p.compareAt) }, money(p.compareAt)),
        h("span", { className: "fi-price-now" }, money(p.value))),
      n > 1 && h("span", { className: "fi-price-inst" }, "ou " + n + "x de " + money(p.value / n) + " sem juros"),
      p.pix && h("span", { className: "fi-price-inst" }, money(p.value * (1 - p.pix / 100)) + " no Pix (" + p.pix + "% off)"));
  }

  function QuantityStepper(p) {
    var min = p.min == null ? 1 : p.min, max = p.max == null ? 99 : p.max;
    var st = React.useState(p.defaultValue == null ? min : p.defaultValue);
    var val = p.value == null ? st[0] : p.value;
    function set(v) { v = Math.max(min, Math.min(max, v)); if (p.value == null) st[1](v); if (p.onChange) p.onChange(v); }
    return h("div", { className: cx("fi-step", p.className), role: "group", "aria-label": p.label || "Quantidade" },
      h("button", { type: "button", onClick: function () { set(val - 1); }, disabled: val <= min, "aria-label": "Diminuir" }, h(Icon, { name: "menos", size: 16 })),
      h("output", { "aria-live": "polite" }, val),
      h("button", { type: "button", onClick: function () { set(val + 1); }, disabled: val >= max, "aria-label": "Aumentar" }, h(Icon, { name: "mais", size: 16 })));
  }

  function ProductCard(p) {
    var off = p.compareAt && p.compareAt > p.price ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
    var badge = p.badge || (off ? "-" + off + "%" : null);
    var tone = p.badgeTone || (off && !p.badge ? "sale" : "ink");
    return h("article", { className: cx("fi-card", p.className) },
      h("div", { className: "fi-card-media" },
        p.image ? h("img", { src: p.image, alt: p.imageAlt || p.name, loading: "lazy" }) : h("span", { className: "fi-card-media-empty", "aria-hidden": true }, "FR"),
        badge && h("span", { className: "fi-card-badge" }, h(Badge, { tone: tone }, badge)),
        h("button", { type: "button", className: "fi-card-fav", "aria-label": "Favoritar " + p.name, "aria-pressed": !!p.favorite, onClick: p.onFavorite }, h(Icon, { name: "favorito" }))),
      h("div", { className: "fi-card-body" },
        p.brand && h("span", { className: "fi-card-brand" }, p.brand),
        h("h3", { className: "fi-card-name" }, p.href ? h("a", { href: p.href }, p.name) : p.name)),
      h(Price, { value: p.price, compareAt: p.compareAt, installments: p.installments, size: "sm" }),
      p.onAdd && h(Button, { variant: "secondary", size: "sm", full: true, onClick: p.onAdd }, "Adicionar à sacola"));
  }

  function Logo(p) {
    return h(React.Fragment, null,
      h("img", { className: cx(p.className, "fi-logo-light"), src: p.src || LOGO_DARK_INK, alt: "Franco Importados — atacado e varejo" }),
      h("img", { className: cx(p.className, "fi-logo-dark"), src: p.srcInverse || LOGO_LIGHT_INK, alt: "Franco Importados — atacado e varejo" }));
  }

  function Navbar(p) {
    var links = p.links || [];
    return h("header", { className: p.className },
      p.announcement && h("div", { className: "fi-announce" }, p.announcement),
      h("nav", { className: "fi-nav", "aria-label": "Principal" },
        h("div", { style: { display: "flex", alignItems: "center" } },
          h("div", { className: "fi-nav-actions", style: { justifyContent: "flex-start" } }, h("button", { type: "button", className: "fi-nav-menu", "aria-label": "Abrir menu", onClick: p.onMenu }, h(Icon, { name: "menu" }))),
          h("div", { className: "fi-nav-links" }, links.map(function (l, i) { return h("a", { key: i, href: l.href || "#", "aria-current": l.current ? "page" : undefined }, l.label); }))),
        h("a", { className: "fi-nav-logo", href: p.homeHref || "/" }, h(Logo, { src: p.logoSrc, srcInverse: p.logoSrcInverse })),
        h("div", { className: "fi-nav-actions" },
          h("button", { type: "button", "aria-label": "Buscar", onClick: p.onSearch }, h(Icon, { name: "busca" })),
          h("button", { type: "button", "aria-label": "Minha conta", onClick: p.onAccount }, h(Icon, { name: "conta" })),
          h("button", { type: "button", "aria-label": "Sacola, " + (p.cartCount || 0) + " itens", onClick: p.onCart }, h(Icon, { name: "sacola" }), p.cartCount ? h("span", { className: "fi-nav-count", "aria-hidden": true }, p.cartCount) : null))));
  }

  function Hero(p) {
    return h("section", { className: cx("fi-hero", p.className) },
      h("div", { className: "fi-hero-text" },
        p.eyebrow && h("p", { className: "fi-eyebrow" }, p.eyebrow),
        h("h1", { className: "fi-hero-title" }, p.title),
        p.text && h("p", { className: "fi-hero-copy" }, p.text),
        (p.primary || p.secondary) && h("div", { className: "fi-hero-actions" },
          p.primary && h(Button, { href: p.primary.href, size: "lg", iconRight: "seta-direita" }, p.primary.label),
          p.secondary && h(Button, { href: p.secondary.href, size: "lg", variant: "secondary" }, p.secondary.label))),
      h("div", { className: "fi-hero-media" }, p.image ? h("img", { src: p.image, alt: p.imageAlt || "" }) : h("span", { className: "fi-hero-mono", "aria-hidden": true }, "FR")));
  }

  function SectionHeading(p) {
    return h("div", { className: cx("fi-section-head", p.className) },
      h("div", null, p.eyebrow && h("p", { className: "fi-eyebrow" }, p.eyebrow), h("h2", null, p.title)),
      p.action && h(Button, { variant: "ghost", href: p.action.href }, p.action.label));
  }

  var ALERT_ICON = { success: "check", warning: "conversa", danger: "fechar", info: "caminhao" };
  function Alert(p) {
    var tone = p.tone || "info";
    return h("div", { className: cx("fi-alert", "fi-alert-" + tone, p.className), role: tone === "danger" ? "alert" : "status" },
      h(Icon, { name: p.icon || ALERT_ICON[tone] }),
      h("div", { className: "fi-alert-body" }, p.title && h("span", { className: "fi-alert-title" }, p.title), p.children && h("span", null, p.children)));
  }

  function Footer(p) {
    var cols = p.columns || [];
    return h("footer", { className: cx("fi-footer", p.className) },
      h("div", { className: "fi-footer-cols" },
        h("div", null, h(Logo, { className: "fi-footer-logo", src: p.logoSrc, srcInverse: p.logoSrcInverse }), p.tagline && h("p", { style: { fontSize: 14, lineHeight: "20px", opacity: .8, maxWidth: "32ch" } }, p.tagline)),
        cols.map(function (c, i) { return h("div", { key: i }, h("h4", null, c.title), h("ul", null, c.links.map(function (l, j) { return h("li", { key: j }, h("a", { href: l.href || "#" }, l.label)); }))); })),
      h("div", { className: "fi-footer-bottom" }, h("span", null, p.legal || "© Franco Importados"), p.note && h("span", null, p.note)));
  }

  window.Franco = Object.assign(window.Franco || {}, { Button: Button, Icon: Icon, Badge: Badge, Input: Input, Price: Price, QuantityStepper: QuantityStepper, ProductCard: ProductCard, Navbar: Navbar, Hero: Hero, SectionHeading: SectionHeading, Alert: Alert, Footer: Footer, Logo: Logo, formatBRL: money });
})();
