/* Helpers do protótipo UI-04. Sem rede, sem API. */
(() => {
const ORA = {
  logo: "../assets/logo.png",
  alt: "Ora Ora — Pessoas que oram umas pelas outras.",
  tagline: "Pessoas que oram umas pelas outras.",
  essence: "A fé aproxima pessoas. O cuidado se transforma em solidariedade.",
  principle: "Antes de pedir uma oração, ore por alguém.",
  disclaimer:
    "Ambiente em desenvolvimento. Oração e reciprocidade já existem; solidariedade financeira ainda não está disponível.",
  categories: [
    ["saude", "Saúde"],
    ["familia", "Família"],
    ["relacionamentos", "Relacionamentos"],
    ["trabalho-desemprego", "Trabalho e desemprego"],
    ["financas", "Finanças"],
    ["dependencia", "Dependência"],
    ["luto", "Luto"],
    ["sofrimento-emocional", "Sofrimento emocional"],
    ["vida-espiritual", "Vida espiritual"],
    ["gratidao", "Gratidão"],
    ["outros", "Outros"],
  ],
};

function to(screen, state) {
  const q = new URLSearchParams({ screen });
  if (state) q.set("state", state);
  return `prototype.html?${q}`;
}

function logoLink(screen) {
  const href = screen ? to(screen) : to("home");
  return `<a href="${href}"><img class="logo" src="${ORA.logo}" alt="${ORA.alt}" /></a>`;
}

function btn(label, href, variant, opts = {}) {
  const cls = ["btn", `btn-${variant}`, opts.block ? "btn-block" : "", opts.lg ? "btn-lg" : "", opts.extra || ""]
    .filter(Boolean)
    .join(" ");
  if (opts.disabled) {
    return `<button class="${cls}" type="button" disabled>${label}</button>`;
  }
  if (opts.submit) {
    return `<button class="${cls}" type="button">${label}</button>`;
  }
  const current = opts.current ? ` aria-current="page"` : "";
  return `<a class="${cls}" href="${href}"${current}>${label}</a>`;
}

function header(mode, active) {
  const nav =
    mode === "public"
      ? `<a class="nav-link" href="${to("encontrar", "vazio")}">Encontrar</a>
         ${btn("Entrar", to("login"), "ghost")}
         ${btn("Criar conta", to("signup"), "primary")}`
      : `${btn("Encontrar", to("encontrar", "vazio"), "ghost", { current: active === "encontrar" })}
         ${btn("Pedir", to("pedir"), "secondary", { current: active === "pedir" })}
         ${btn("Conta", to("account"), "primary", { current: active === "account" })}`;
  return `<header class="topbar">
    <div class="topbar-inner">
      ${logoLink("home")}
      <nav class="nav" aria-label="Principal">${nav}</nav>
    </div>
  </header>`;
}

function footer() {
  return `<footer class="foot">
    <div class="foot-inner">
      <div class="foot-brand">
        <a class="foot-name" href="${to("home")}">Ora Ora</a>
        <p class="tagline">${ORA.tagline}</p>
      </div>
      <div class="foot-copy">
        <p class="muted">${ORA.essence}</p>
        <p class="principle principle-foot">${ORA.principle}</p>
        <p class="disclaimer">${ORA.disclaimer}</p>
      </div>
    </div>
  </footer>`;
}

function shell(context, active, main, mode = "app") {
  return `<div class="page">${header(mode, active)}<main>${main}</main>${footer()}</div>`;
}

function field(label, control, hint) {
  const hintHtml = hint ? `<span class="hint">${hint}</span>` : "";
  return `<label class="field"><span class="field-name">${label}</span>${control}${hintHtml}</label>`;
}

function input(type, opts = {}) {
  const attrs = [
    `type="${type}"`,
    opts.name ? `name="${opts.name}"` : "",
    opts.value ? `value="${opts.value}"` : "",
    opts.placeholder ? `placeholder="${opts.placeholder}"` : "",
    opts.required ? "required" : "",
    opts.minlength ? `minlength="${opts.minlength}"` : "",
    opts.autocomplete ? `autocomplete="${opts.autocomplete}"` : "",
    opts.disabled ? "disabled" : "",
    opts.focus ? `class="demo-focus"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `<input ${attrs} />`;
}

function chips(activeSlug) {
  const allCurrent = activeSlug ? "" : ` aria-current="true"`;
  const all = `<li><a class="chip" href="${to("encontrar", "vazio")}"${allCurrent}>Todas</a></li>`;
  const rest = ORA.categories
    .map(([slug, name]) => {
      const current = slug === activeSlug ? ` aria-current="true"` : "";
      const state = slug === "saude" ? "saude" : `cat-${slug}`;
      return `<li><a class="chip" href="${to("encontrar", state)}"${current}>${name}</a></li>`;
    })
    .join("");
  return `<ul class="chips">${all}${rest}</ul>`;
}

function flag(text) {
  return `<p class="flag">${text}</p>`;
}

function authLayout(title, subtitle, body, foot, opts = {}) {
  const principle = opts.principle ? `<p class="principle">${ORA.principle}</p>` : "";
  const footHtml = foot ? `<p class="auth-foot">${foot}</p>` : "";
  return `<div class="auth-shell">
    <div class="auth-panel">
      <header class="auth-head">
        ${logoLink("home")}
        <div class="auth-titles">
          <h1>${title}</h1>
          <p class="lead">${subtitle}</p>
          ${principle}
        </div>
      </header>
      <div class="card auth-card">${body}</div>
      ${footHtml}
    </div>
  </div>`;
}

window.ORA = ORA;
window.oraUi = { to, btn, header, footer, shell, field, input, chips, flag, authLayout, logoLink };
})();
