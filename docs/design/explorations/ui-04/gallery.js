(() => {
const CATALOG = [
  {
    group: "Site público e institucional",
    items: [
      screen("home", "Homepage pública", "/", "Protótipo reconstruído a partir do código", "Prioritária. Copy real da home funcional. Botão Antes mostra captura real do UI-01.", [
        ["", "Composição"],
      ], { desktop: "../../evidence/ui-01/ui01-homepage-desktop.png", mobile: "../../evidence/ui-01/ui01-homepage-mobile.png" }, true),
      screen("institucional", "Institucional PROD-0", "/", "Protótipo reconstruído a partir do código", "Landing sem cadastro, sem banco e sem CTAs de produto.", [
        ["", "Página"],
      ], { desktop: "../../evidence/ui-01/prod0-desktop-hero.png", mobile: "../../evidence/ui-01/prod0-mobile-hero.png" }),
      screen("chrome", "Cabeçalho e rodapé", "—", "Protótipo de composição", "Destinos atuais. Logo oficial, menor.", [["", "Peças"]]),
    ],
  },
  {
    group: "Autenticação",
    items: [
      screen("login", "Login", "/login", "Protótipo reconstruído a partir do código", "Campos, mínimo de senha e link de recuperação iguais. Antes = captura real do UI-01.", [
        ["", "Formulário"],
        ["nao-verificado", "E-mail não verificado"],
        ["foco", "Foco visível"],
      ], { desktop: "../../evidence/ui-01/ui01-login-desktop.png" }),
      screen("signup", "Cadastro", "/signup", "Protótipo reconstruído a partir do código", "Inclui cadastro aberto e ambiente com cadastro fechado.", [
        ["", "Aberto"],
        ["fechado", "Indisponível"],
        ["criando", "Criando…"],
        ["erro", "Erro"],
      ], { desktop: "../../evidence/ui-01/ui01-signup-desktop.png" }),
      screen("forgot", "Esqueci minha senha", "/esqueci-minha-senha", "Protótipo reconstruído a partir do código", "Ack neutro: não revela se o e-mail existe.", [
        ["", "Formulário"],
        ["ack", "Instruções enviadas"],
        ["falha", "Falha"],
        ["enviando", "Enviando…"],
      ], { desktop: "../../evidence/ui-01/ui01-forgot-password-desktop.png" }),
      screen("reset", "Redefinir senha", "/redefinir-senha", "Protótipo reconstruído a partir do código", "Sem captura anterior no UI-01. Token não é real.", [
        ["", "Formulário"],
        ["invalido", "Link inválido"],
        ["expirado", "Link expirado"],
        ["erro", "Confirmação diferente"],
        ["salvando", "Salvando…"],
        ["sucesso", "Senha atualizada"],
      ]),
      screen("confirm", "Confirme seu e-mail", "/confirme-seu-email", "Protótipo reconstruído · e-mail ilustrativo", "Título real da tela: Confira seu e-mail.", [
        ["com-email", "Com e-mail"],
        ["sem-email", "Sem e-mail"],
        ["reenviado", "Reenviado"],
        ["erro", "Falha no reenvio"],
        ["reenviando", "Reenviando…"],
      ], { desktop: "../../evidence/ui-01/ui01-confirm-email-desktop.png" }),
      screen("verified", "E-mail verificado", "/email-verificado", "Protótipo reconstruído a partir do código", "Estados de sucesso, pendente, expirado e inválido.", [
        ["sucesso", "Confirmado"],
        ["pendente", "Pendente"],
        ["expirado", "Expirado"],
        ["invalido", "Inválido"],
      ], { desktop: "../../evidence/ui-01/ui01-email-verified-pending-desktop.png" }),
    ],
  },
  {
    group: "Área autenticada",
    items: [
      screen("account", "Minha conta", "/account", "Protótipo reconstruído · estado ilustrativo · pendente de homologação real", "Prioritária. Mesmos campos e ações. Valores ilustrativos.", [
        ["", "Verificada"],
        ["nao-verificada", "Não verificada"],
        ["carregando", "Carregando"],
      ], null, true),
      screen("encontrar", "Encontrar pedidos", "/encontrar", "Protótipo reconstruído · estado ilustrativo · pendente de homologação real", "Prioritária. Filtros e vazio reais; itens da lista são ilustrativos.", [
        ["vazio", "Vazio"],
        ["lista", "Com pedidos"],
        ["saude", "Categoria Saúde"],
        ["cat-luto", "Categoria sem itens"],
        ["carregando", "Carregando"],
      ], null, true),
      screen("pedir-bloqueado", "Pedir oração bloqueado", "/pedir", "Protótipo reconstruído · pendente de homologação real", "Prioritária. Mensagens de elegibilidade e princípio preservados.", [
        ["", "Reciprocidade"],
        ["pendente", "Revisão pendente"],
      ], null, true),
      screen("detalhe", "Detalhe de pedido", "/encontrar/[id]", "Protótipo reconstruído · estado ilustrativo · pendente de homologação real", "História, intenção, status e CTA preservados.", [["", "Leitura"]]),
      screen("orar", "Orar por alguém", "/encontrar/[id]/orar", "Protótipo reconstruído · estado ilustrativo · pendente de homologação real", "Palavra opcional e texto da oração. Referências do catálogo de sementes.", [
        ["", "Formulário"],
        ["erro", "Erro"],
        ["enviando", "Enviando…"],
      ]),
      screen("pedir", "Criar pedido elegível", "/pedir", "Protótipo reconstruído · estado ilustrativo · pendente de homologação real", "Campos e aviso de consumo da autorização iguais.", [
        ["", "Formulário"],
        ["erro", "Erro"],
        ["publicando", "Publicando…"],
      ]),
      screen("oracao", "Acompanhamento da oração", "/oracoes/[id]", "Protótipo reconstruído · estado ilustrativo · pendente de homologação real", "Outcomes pending, manual_review, accepted e rejected.", [
        ["pendente", "Pendente"],
        ["manual", "Revisão manual"],
        ["aceita", "Aceita"],
        ["rejeitada", "Rejeitada"],
      ]),
    ],
  },
  {
    group: "Administração",
    items: [
      screen("admin", "Revisão de orações", "/admin/revisao", "Protótipo reconstruído · estado ilustrativo · pendente de homologação real", "Aprovar e rejeitar. Visual mais operacional.", [
        ["", "Fila"],
        ["vazia", "Fila vazia"],
        ["erro", "Falha na decisão"],
        ["decidindo", "Ações desabilitadas"],
        ["carregando", "Carregando"],
      ]),
    ],
  },
];

function screen(id, name, route, classification, note, states, before, priority) {
  return { id, name, route, classification, note, states, before: before || null, priority: Boolean(priority) };
}

const flat = CATALOG.flatMap((group) => group.items);

const side = document.querySelector("#side");
const title = document.querySelector("#title");
const meta = document.querySelector("#meta");
const stateSelect = document.querySelector("#state");
const frame = document.querySelector("#frame");
const shot = document.querySelector("#shot");
const missing = document.querySelector("#missing");
const openLink = document.querySelector("#open-link");
let current = flat[0];
let viewport = "desktop";
let showBefore = false;

function renderNav() {
  side.innerHTML = `<h1>Ora Ora · UI-04</h1><p class="sub">Galeria visual isolada. Não altera o aplicativo. Faixa dourada = tela prioritária.</p>`;
  for (const group of CATALOG) {
    const h = document.createElement("h2");
    h.textContent = group.group;
    side.append(h);
    for (const item of group.items) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = item.priority ? `${item.name} · prioritária` : item.name;
      b.dataset.id = item.id;
      if (item.priority) b.classList.add("priority");
      if (item.id === current.id) b.setAttribute("aria-current", "true");
      b.addEventListener("click", () => select(item.id));
      side.append(b);
    }
  }
}

function select(id, stateId) {
  const next = flat.find((item) => item.id === id) || flat[0];
  if (!current || next.id !== current.id) showBefore = false;
  current = next;
  const params = new URLSearchParams(location.hash.slice(1));
  params.set("screen", current.id);
  const chosen = stateId || params.get("state") || current.states[0][0];
  if (chosen) params.set("state", chosen);
  else params.delete("state");
  history.replaceState(null, "", `#${params}`);
  renderNav();
  paint(chosen);
}

function paint(stateId) {
  const known = current.states.some(([id]) => id === stateId) ? stateId : current.states[0][0];
  title.textContent = current.name;
  const mode = showBefore
    ? "Visualização: captura real anterior (UI-01)"
    : "Visualização: proposta UI-04 (protótipo isolado)";
  meta.innerHTML = `<div><strong>Rota:</strong> ${current.route}</div>
    <div><strong>Evidência:</strong> ${current.classification}</div>
    <div><strong>${mode}</strong></div>
    <div>${current.note}</div>`;
  stateSelect.innerHTML = "";
  for (const [id, label] of current.states) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = label;
    if (id === known) opt.selected = true;
    stateSelect.append(opt);
  }
  const src = `prototype.html?screen=${encodeURIComponent(current.id)}${known ? `&state=${encodeURIComponent(known)}` : ""}`;
  openLink.href = src;
  const beforeSrc = current.before ? current.before[viewport] : null;
  document.querySelector("#before").disabled = !current.before;
  document.querySelector("#before").setAttribute("aria-pressed", showBefore ? "true" : "false");
  if (showBefore && beforeSrc) {
    frame.hidden = true;
    shot.hidden = false;
    missing.hidden = true;
    shot.src = beforeSrc;
    shot.alt = `Captura real anterior de ${current.name}`;
  } else if (showBefore && !beforeSrc) {
    frame.hidden = true;
    shot.hidden = true;
    missing.hidden = false;
  } else {
    frame.hidden = false;
    shot.hidden = true;
    missing.hidden = true;
    if (frame.dataset.src !== src) {
      frame.dataset.src = src;
      frame.src = src;
    }
  }
  fit();
}

function fit() {
  const host = document.querySelector("#host");
  const base = viewport === "mobile" ? 390 : 1280;
  const height = viewport === "mobile" ? 844 : 900;
  const avail = Math.max(320, host.clientWidth - 8);
  const scale = Math.min(1, avail / base);
  const device = document.querySelector("#device");
  device.style.width = `${base}px`;
  device.style.height = `${height}px`;
  const scaler = document.querySelector("#scaler");
  scaler.style.transform = `scale(${scale})`;
  scaler.style.width = `${base}px`;
  scaler.style.height = `${height}px`;
  host.style.height = `${height * scale + 8}px`;
  frame.style.width = `${base}px`;
  frame.style.height = `${height}px`;
  shot.style.width = `${base}px`;
  shot.style.height = "auto";
  shot.style.maxHeight = "none";
  shot.style.objectFit = "unset";
}

document.querySelector("#desktop").addEventListener("click", () => setViewport("desktop"));
document.querySelector("#mobile").addEventListener("click", () => setViewport("mobile"));
document.querySelector("#before").addEventListener("click", () => {
  showBefore = !showBefore;
  paint(stateSelect.value);
});
stateSelect.addEventListener("change", () => select(current.id, stateSelect.value));
window.addEventListener("resize", fit);

function setViewport(next) {
  viewport = next;
  document.querySelector("#desktop").setAttribute("aria-pressed", next === "desktop" ? "true" : "false");
  document.querySelector("#mobile").setAttribute("aria-pressed", next === "mobile" ? "true" : "false");
  paint(stateSelect.value);
}

const initial = new URLSearchParams(location.hash.slice(1));
select(initial.get("screen") || "home", initial.get("state") || "");
})();
