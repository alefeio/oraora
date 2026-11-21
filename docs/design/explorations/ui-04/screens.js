/* Telas reconstruídas a partir do código funcional. Textos normativos preservados. */
(() => {
const { to, btn, shell, field, input, chips, flag, authLayout, logoLink } = window.oraUi;
const ORA = window.ORA;

const ILLUSTRATIVE =
  "Dado ilustrativo para leitura do layout. Não é uma pessoa, um pedido ou uma oração real. Sem backend.";

function feedItem(opts) {
  const fixture = opts.fixture
    ? `<span class="badge warning">fixture de teste</span>`
    : "";
  const count =
    opts.count === 0
      ? "Ainda sem orações válidas"
      : `${opts.count} orações válidas`;
  return `<li>
    <a class="card-link" href="${to("detalhe")}">
      <div class="row-meta">
        <span class="badge">${opts.category}</span>
        <span>${opts.label}</span>
        ${fixture}
      </div>
      <h2>${opts.title}</h2>
      <p>${opts.story}</p>
      <div class="row-meta" style="margin-top:.65rem">
        <span>${count}</span>
        ${opts.hint ? `<span>${opts.hint}</span>` : ""}
      </div>
    </a>
  </li>`;
}

const ITEM_A = {
  category: "Saúde",
  label: "Anônimo",
  title: "Título ilustrativo",
  story: "Trecho ilustrativo no lugar da história. Este cartão mostra só a composição do feed.",
  count: 0,
  hint: "ainda sem orações",
  need: "Texto ilustrativo da intenção de oração.",
  status: "open",
};

const ITEM_B = {
  category: "Família",
  label: "Anônimo",
  title: "Outro título ilustrativo",
  story: "Segundo trecho ilustrativo, no mesmo papel do resumo de história do feed.",
  count: 2,
  hint: "poucas orações",
  fixture: true,
};

function home() {
  const main = `
    <section class="section">
      <div class="wrap hero-grid">
        <div class="hero-copy">
          <p class="kicker"><i class="dot" aria-hidden="true"></i> Essência</p>
          <h1>${ORA.essence}</h1>
          <hr class="rule" />
          <p class="lead">No Ora Ora, você conhece a história de alguém, oferece uma oração individual e participa de uma comunidade de fé, acolhimento e solidariedade.</p>
          <div class="btn-row">
            ${btn("Encontrar alguém para orar", to("encontrar", "vazio"), "primary", { lg: true })}
            ${btn("Criar minha conta", to("signup"), "secondary", { lg: true })}
          </div>
          <p class="principle">${ORA.principle}</p>
        </div>
        <ol class="path">
          <li class="path-item"><span class="path-num">01</span><div><h3>Conhecer</h3><p>Leia a história e a intenção específica de oração de outra pessoa, com respeito e cuidado.</p></div></li>
          <li class="path-item"><span class="path-num">02</span><div><h3>Orar</h3><p>Escreva uma intercessão individual. Se quiser, escolha uma passagem bíblica para acompanhar.</p></div></li>
          <li class="path-item"><span class="path-num">03</span><div><h3>Pedir</h3><p>Depois de cuidar de alguém, você também pode compartilhar o seu próprio pedido com a comunidade.</p></div></li>
        </ol>
      </div>
    </section>
    <section class="band">
      <div class="band-inner">
        <p>O Ora Ora existe para aproximar pessoas pela oração — com respeito, reciprocidade e cuidado concreto.</p>
      </div>
    </section>`;
  return shell("public", null, main, "public");
}

function institucional() {
  return `<div class="page">
    <main>
      <header class="inst-hero">
        <img class="logo" src="${ORA.logo}" alt="Ora Ora" />
        <h1>${ORA.tagline}</h1>
        <p class="lead">${ORA.essence}</p>
      </header>
      <section class="inst-section inst-grid">
        <div>
          <h2>Por que o Ora Ora existe</h2>
          <p>O Ora Ora nasce para aproximar pessoas pela fé: um espaço em que pedir e oferecer oração fazem parte do mesmo cuidado. Aqui, a solidariedade começa no gesto simples de interceder por alguém.</p>
        </div>
        <div>
          <h2>Pessoas orando umas pelas outras</h2>
          <p>Imaginamos uma rede acolhedora, em que pedidos e orações circulam com respeito e esperança. Sem promessas de milagres. Sem transformar doação em pagamento por oração.</p>
        </div>
      </section>
      <section class="inst-section inst-principle">
        <p class="kicker"><i class="dot" aria-hidden="true"></i> Princípio</p>
        <p class="statement">${ORA.principle}</p>
        <p class="muted">A reciprocidade espiritual não é troca comercial. É cuidado mútuo: antes de pedir, também oramos.</p>
      </section>
    </main>
    <section class="inst-prepare">
      <div class="inst-prepare-inner">
        <div>
          <h2>Em preparação</h2>
          <p>A plataforma está em preparação. Em breve, pessoas poderão orar umas pelas outras por aqui.</p>
        </div>
        <p class="domain">oraora.ia.br</p>
      </div>
    </section>
    <footer class="inst-foot">
      <div>
        <p><strong>Ora Ora</strong></p>
        <p>${ORA.tagline}</p>
      </div>
      <p class="meta">© 2026 Ora Ora. Conteúdo institucional.</p>
    </footer>
  </div>`;
}

function chrome() {
  const publicHeader = window.oraUi.header("public", null);
  const appHeader = window.oraUi.header("app", "encontrar");
  const foot = window.oraUi.footer();
  return `<main class="specimen">
    <p class="specimen-label">Cabeçalho público — marca legível; Encontrar visível também no mobile</p>
    ${publicHeader}
    <p class="specimen-label">Cabeçalho da área autenticada — mesmos destinos</p>
    ${appHeader}
    <p class="specimen-label">Rodapé — nome tipográfico (sem repetir o PNG); textos e princípio preservados</p>
    ${foot}
  </main>`;
}

function login(state) {
  const error =
    state === "nao-verificado"
      ? `<p class="alert" role="alert">Confirme seu e-mail antes de entrar.</p>
         <p class="muted"> <a class="text-link" href="${to("confirm", "com-email")}">Reenviar verificação</a></p>`
      : "";
  const focus = state === "foco";
  const body = `<form>
      ${field("E-mail", input("email", { name: "email", required: true, autocomplete: "email", focus, value: focus ? "pessoa.ilustrativa@exemplo.invalid" : "" }))}
      ${field("Senha", input("password", { name: "password", required: true, autocomplete: "current-password", minlength: 10 }))}
      <p style="margin:0;text-align:right"><a class="text-link" href="${to("forgot")}">Esqueci minha senha</a></p>
      ${error}
      ${btn("Entrar", to("account"), "primary", { block: true, submit: true })}
    </form>`;
  return authLayout(
    "Entrar",
    "Acesse sua conta no Ora Ora",
    body,
    `Não tem conta? <a class="text-link" href="${to("signup")}">Cadastre-se</a>`,
  );
}

function signup(state) {
  const body =
    state === "fechado"
      ? `<p class="alert" role="alert">O cadastro público neste ambiente está temporariamente indisponível. O envio de e-mail de verificação ainda não está configurado de forma segura.</p>
         <p class="muted">Quando o provedor de e-mail do projeto estiver ativo, o cadastro será reaberto sem enfraquecer a verificação de e-mail.</p>`
      : `<form>
          ${field("Nome", input("text", { required: true, autocomplete: "name", minlength: 2 }))}
          ${field("E-mail", input("email", { required: true, autocomplete: "email" }))}
          ${field("Senha (mín. 10)", input("password", { required: true, autocomplete: "new-password", minlength: 10 }))}
          ${state === "erro" ? `<p class="alert" role="alert">Não foi possível criar a conta.</p>` : ""}
          ${btn(state === "criando" ? "Criando…" : "Criar conta", to("confirm", "com-email"), "primary", { block: true, submit: true, disabled: state === "criando" })}
        </form>`;
  return authLayout(
    "Criar conta",
    "Comece a participar do Ora Ora",
    body,
    `Já tem conta? <a class="text-link" href="${to("login")}">Entrar</a>`,
    { principle: true },
  );
}

function forgot(state) {
  let body;
  if (state === "ack") {
    body = `<p class="muted">Se houver uma conta com este e-mail, enviamos instruções para redefinir a senha.</p>
      <p class="hint">Se o e-mail não chegar em alguns minutos, confira a caixa de spam ou tente de novo mais tarde.</p>`;
  } else if (state === "falha") {
    body = `<form>
      ${field("E-mail", input("email", { required: true, autocomplete: "email", value: "pessoa.ilustrativa@exemplo.invalid" }), "Usaremos este endereço apenas se houver conta associada.")}
      <p class="alert" role="alert">Não foi possível solicitar a recuperação agora. Tente novamente em instantes.</p>
      ${btn("Enviar link de recuperação", "#", "primary", { block: true, submit: true })}
    </form>`;
  } else {
    body = `<form>
      ${field("E-mail", input("email", { required: true, autocomplete: "email" }), "Usaremos este endereço apenas se houver conta associada.")}
      ${btn(state === "enviando" ? "Enviando…" : "Enviar link de recuperação", to("forgot", "ack"), "primary", { block: true, submit: true, disabled: state === "enviando" })}
    </form>`;
  }
  return authLayout(
    "Esqueci minha senha",
    "Recupere o acesso à sua conta no Ora Ora",
    body,
    `Lembrou a senha? <a class="text-link" href="${to("login")}">Voltar ao login</a>`,
  );
}

function reset(state) {
  let body;
  if (state === "invalido") {
    body = `<p class="alert" role="alert">Link de redefinição inválido ou incompleto.</p>
      <p class="hint">Você pode solicitar um novo link em <a class="text-link" href="${to("forgot")}">Esqueci minha senha</a>.</p>`;
  } else if (state === "expirado") {
    body = `<p class="alert" role="alert">Este link de redefinição expirou. Solicite um novo.</p>
      <p class="hint">Você pode solicitar um novo link em <a class="text-link" href="${to("forgot")}">Esqueci minha senha</a>.</p>`;
  } else if (state === "sucesso") {
    body = `<p class="ok">Senha atualizada.</p>
      <p class="muted">Sessões anteriores foram encerradas. Redirecionando para o login…</p>`;
  } else {
    const err =
      state === "erro"
        ? `<p class="alert" role="alert">A confirmação não coincide com a nova senha.</p>`
        : "";
    body = `<form>
      ${field("Nova senha (mín. 10)", input("password", { required: true, autocomplete: "new-password", minlength: 10 }))}
      ${field("Confirmar nova senha", input("password", { required: true, autocomplete: "new-password", minlength: 10 }))}
      ${err}
      ${btn(state === "salvando" ? "Salvando…" : "Redefinir senha", to("reset", "sucesso"), "primary", { block: true, submit: true, disabled: state === "salvando" })}
    </form>`;
  }
  return authLayout(
    "Redefinir senha",
    "Escolha uma nova senha para sua conta",
    body,
    `<a class="text-link" href="${to("login")}">Voltar ao login</a>`,
  );
}

function confirm(state) {
  const email = "pessoa.ilustrativa@exemplo.invalid";
  const withEmail = state !== "sem-email";
  const sent = state === "reenviado";
  const failed = state === "erro";
  const body = `
    <p class="muted">Enviamos um link de verificação${withEmail ? ` para ${email}` : ""}. Abra o e-mail e confirme sua conta antes de entrar.</p>
    <p class="hint">O link aponta para este ambiente Preview. Se você abrir um deployment antigo, a confirmação pode parecer incompleta — use sempre o e-mail mais recente.</p>
    ${sent ? `<p class="ok">Se a conta existir e ainda precisar de verificação, enviamos um novo e-mail.</p>` : ""}
    ${failed ? `<p class="alert" role="alert">Não foi possível reenviar agora. Aguarde um momento e tente de novo.</p>` : ""}
    ${state === "sem-email" ? `<p class="alert" role="alert">Informe o e-mail usado no cadastro para reenviar a verificação.</p>` : ""}
    ${btn(state === "reenviando" ? "Reenviando…" : "Reenviar e-mail de verificação", to("confirm", "reenviado"), "primary", { block: true, disabled: !withEmail || state === "reenviando" })}
    ${flag("E-mail ilustrativo. O botão desabilitado reproduz o estado sem endereço na URL.")}`;
  return authLayout(
    "Confira seu e-mail",
    "Confirme sua conta para entrar no Ora Ora",
    body,
    `Já confirmou? <a class="text-link" href="${to("login")}">Entrar</a>`,
  );
}

function verified(state) {
  const map = {
    sucesso: {
      title: "E-mail confirmado",
      body: "Sua conta está verificada. Agora você pode entrar com sua senha.",
      kind: "ok",
    },
    pendente: {
      title: "Confirmação pendente",
      body: "Abra o link enviado por e-mail para concluir a verificação. Abrir esta página diretamente não confirma a conta.",
      kind: "pending",
    },
    expirado: {
      title: "Link expirado",
      body: "Este link de verificação expirou. Solicite um novo a partir do cadastro ou da tela de confirmação.",
      kind: "error",
    },
    invalido: {
      title: "Link inválido ou já utilizado",
      body: "Não foi possível confirmar com este link. Se sua conta já estiver verificada, basta entrar.",
      kind: "error",
    },
  };
  const item = map[state] || map.sucesso;
  const titleClass = item.kind === "error" ? "alert" : item.kind === "ok" ? "ok" : "muted";
  const extraErr = item.kind === "error" ? `<p class="alert" role="alert">Verificação não concluída por este link.</p>` : "";
  const pendingHint =
    item.kind === "pending"
      ? `<p class="hint">Depois de clicar no e-mail, você deve ver a confirmação de sucesso. Se o link falhar, use <a class="text-link" href="${to("confirm", "com-email")}">Confirme seu e-mail</a>.</p>`
      : "";
  const errorHint =
    item.kind === "error"
      ? `<p class="hint">Precisa de um novo e-mail? Volte a <a class="text-link" href="${to("confirm", "com-email")}">Confirme seu e-mail</a>.</p>`
      : "";
  const body = `
    <p class="${titleClass}" style="margin:0">${item.title}</p>
    <p class="muted">${item.body}</p>
    ${extraErr}
    ${pendingHint}
    ${btn("Entrar na minha conta", to("login"), "primary", { block: true })}
    ${errorHint}`;
  return authLayout(
    "Verificação de e-mail",
    "Status da confirmação da sua conta",
    body,
    "",
  );
}

function account(state) {
  if (state === "carregando") {
    return shell(
      "app",
      "account",
      `<div class="account"><div class="skel" aria-hidden="true"><span class="wide"></span><span></span><span class="mid"></span></div><p class="visually-hidden">Carregando conta…</p></div>`,
    );
  }
  const verifiedEmail = state === "nao-verificada" ? "não (modo desenvolvimento)" : "sim";
  const main = `
    <div class="account">
      <header class="account-head">
        <h1>Minha conta</h1>
        <p class="muted">Sessão autenticada no Ora Ora</p>
      </header>
      <dl class="facts">
        <div class="fact fact-name"><dt>Nome</dt><dd>Pessoa ilustrativa</dd></div>
        <div class="fact"><dt>E-mail</dt><dd>pessoa.ilustrativa@exemplo.invalid</dd></div>
        <div class="fact"><dt>Papel</dt><dd>USER</dd></div>
        <div class="fact"><dt>E-mail verificado</dt><dd>${verifiedEmail}</dd></div>
      </dl>
      ${flag(ILLUSTRATIVE)}
      <aside class="aside-note">
        <p>Você pode encontrar pedidos, enviar orações e, quando elegível, publicar o seu próprio pedido. A solidariedade financeira ainda não está disponível.</p>
        <p class="principle">${ORA.principle}</p>
        <div class="btn-stack">
          ${btn("Encontrar alguém para orar", to("encontrar", "vazio"), "primary")}
          ${btn("Pedir oração", to("pedir"), "secondary")}
          ${btn("Sair", to("home"), "secondary")}
        </div>
      </aside>
    </div>`;
  return shell("app", "account", main);
}

function encontrar(state) {
  if (state === "carregando") {
    return shell(
      "app",
      "encontrar",
      `<div class="account"><div class="skel" aria-hidden="true"><span class="wide"></span><span></span><span></span></div><p class="visually-hidden">Carregando pedidos…</p></div>`,
    );
  }
  const active = state === "saude" ? "saude" : state.startsWith("cat-") ? state.slice(4) : "";
  let body;
  if (state === "lista" || state === "saude") {
    const items =
      state === "saude"
        ? feedItem(ITEM_A)
        : `${feedItem(ITEM_A)}${feedItem(ITEM_B)}`;
    body = `${flag(ILLUSTRATIVE)}<ul class="feed">${items}</ul>`;
  } else {
    body = `<section class="empty">
        <h2>Nenhum pedido na fila principal agora</h2>
        <p>Volte em breve ou explore outra categoria.</p>
      </section>`;
  }
  const main = `
    <div class="account" style="display:grid;grid-template-columns:1fr">
      <header class="account-head">
        <h1>Encontrar alguém para orar</h1>
        <p class="lead">O feed prioriza quem ainda recebeu poucas orações. Conheça uma história e ofereça um cuidado individual.</p>
      </header>
      <nav aria-label="Categorias">${chips(active)}</nav>
      ${body}
    </div>`;
  return shell("app", "encontrar", main);
}

function detalhe() {
  const main = `
    <div class="detail">
      <div class="detail-main">
        <a class="back" href="${to("encontrar", "lista")}">Voltar ao feed</a>
        <header class="account-head">
          <div class="row-meta">
            <span class="badge">${ITEM_A.category}</span>
            <span>${ITEM_A.label}</span>
            <span class="badge neutral">${ITEM_A.status}</span>
          </div>
          <h1>${ITEM_A.title}</h1>
        </header>
        <section>
          <h2>História</h2>
          <p class="story">${ITEM_A.story}</p>
        </section>
        ${flag(ILLUSTRATIVE)}
      </div>
      <aside class="detail-side">
        <section class="intent">
          <h2>O que apresentar em oração</h2>
          <p>${ITEM_A.need}</p>
        </section>
        <p class="meta">Ainda ninguém orou por este pedido</p>
        <p class="meta">ainda sem orações</p>
        <div>
          ${btn("Quero orar por Anônimo", to("orar"), "primary", { lg: true, block: true })}
          <p class="hint" style="margin-top:.5rem;text-align:center">Você será guiado a refletir, escolher uma Palavra (opcional) e escrever uma oração individual.</p>
        </div>
      </aside>
    </div>`;
  return shell("app", "encontrar", main);
}

function orar(state) {
  const error = state === "erro" ? `<p class="alert" role="alert">Não foi possível enviar.</p>` : "";
  const pending = state === "enviando";
  const main = `
    <div class="compose" style="grid-template-columns:1fr">
      <a class="back" href="${to("detalhe")}">Voltar ao pedido</a>
      <header class="account-head">
        <p class="meta">${ITEM_A.category} · ${ITEM_A.label}</p>
        <h1>Orar por ${ITEM_A.label}</h1>
        <p class="lead">Leia com atenção, escolha uma Palavra se desejar, e escreva uma oração individual.</p>
      </header>
      <section class="summary">
        <h2>${ITEM_A.title}</h2>
        <p class="story">${ITEM_A.story}</p>
        <p><strong>Intenção: </strong>${ITEM_A.need}</p>
      </section>
      <form class="card">
        ${field(
          "Palavra (opcional)",
          `<select>
            <option>Sem passagem selecionada</option>
            <option>Isaías 41:10</option>
            <option>Salmo 46:1</option>
          </select>`,
          "Exibimos apenas referências enquanto a licença do texto bíblico não estiver definida.",
        )}
        ${field(
          "Sua oração por Anônimo",
          `<textarea required rows="8" placeholder="Escreva com cuidado e respeito pela história desta pessoa.">${state === "erro" ? "Texto ilustrativo da oração." : ""}</textarea>`,
        )}
        ${error}
        ${btn(pending ? "Enviando…" : "Enviar oração", to("oracao", "pendente"), "primary", { lg: true, block: true, submit: true, disabled: pending })}
      </form>
      ${flag(ILLUSTRATIVE + " As referências bíblicas são as do catálogo de sementes do produto, não um texto de usuário.")}
    </div>`;
  return shell("app", "encontrar", main);
}

function pedir(state) {
  const error = state === "erro" ? `<p class="alert" role="alert">Não foi possível publicar.</p>` : "";
  const pending = state === "publicando";
  const options = ORA.categories.map(([, name]) => `<option>${name}</option>`).join("");
  const identity = ["Nome completo", "Primeiro nome", "Iniciais", "Anônimo"]
    .map((name, i) => `<option${name === "Anônimo" ? " selected" : ""}>${name}</option>`)
    .join("");
  const main = `
    <div class="compose" style="grid-template-columns:1fr;max-width:720px">
      <header class="account-head">
        <h1>Criar meu pedido</h1>
        <p class="lead">Você cuidou de alguém. Ao publicar, essa autorização será consumida. Um futuro novo pedido exigirá outra oração.</p>
      </header>
      <form class="card">
        ${field("Categoria", `<select required>${options}</select>`)}
        ${field("Título", input("text", { required: true }))}
        ${field("História", `<textarea required rows="6"></textarea>`)}
        ${field("O que apresentar em oração", `<textarea required rows="3"></textarea>`)}
        ${field(
          "Como deseja aparecer",
          `<select>${identity}</select>`,
          "O rótulo público é definido no servidor a partir do seu perfil e do modo escolhido.",
        )}
        ${error}
        ${btn(pending ? "Publicando…" : "Publicar pedido", to("detalhe"), "primary", { lg: true, block: true, submit: true, disabled: pending })}
      </form>
      ${flag("Formulário ilustrativo. Nenhum pedido é enviado.")}
    </div>`;
  return shell("app", "pedir", main);
}

function pedirBloqueado(state) {
  const pending = state === "pendente";
  const message = pending
    ? "Sua oração foi recebida. Estamos verificando a interação antes de liberar seu próximo pedido."
    : "Antes de pedir uma oração, ore por alguém.";
  const sameAsPrinciple = message === ORA.principle;
  const eligibility = sameAsPrinciple
    ? `<p class="block-eligibility" role="status">${message}</p>`
    : `<p class="block-eligibility block-eligibility-emphasis" role="status">${message}</p>`;
  const principleBlock = sameAsPrinciple
    ? `<p class="principle-label"><i class="dot gold" aria-hidden="true"></i> Princípio do Ora Ora</p>
       <p class="principle-quote">${ORA.principle}</p>`
    : `<div class="cite">
         <p class="kicker"><i class="dot gold" aria-hidden="true"></i> Princípio</p>
         <p>${ORA.principle}</p>
       </div>`;
  const main = `
    <div class="block">
      <header class="block-head">
        <h1>Antes de pedir</h1>
        ${eligibility}
      </header>
      <article class="block-panel">
        ${principleBlock}
        ${btn("Encontrar alguém para orar", to("encontrar", "vazio"), "primary", { lg: true })}
      </article>
      ${flag("Textos da regra preservados. Protótipo sem backend.")}
    </div>`;
  return shell("app", "pedir", main);
}

function oracao(state) {
  const outcome = state || "pendente";
  const banners = {
    pendente:
      `<p class="status warning" role="status">Sua oração foi recebida. Estamos verificando a interação antes de liberar seu próximo pedido.</p>`,
    manual:
      `<p class="status warning" role="status">Sua oração foi recebida. Estamos verificando a interação antes de liberar seu próximo pedido.</p>`,
    aceita:
      `<p class="status success" role="status">Sua oração foi considerada válida para reciprocidade.</p>`,
    rejeitada:
      `<p class="status neutral" role="status">Esta oração não liberou o direito de pedir. Você pode orar por outra pessoa com atenção individual à história.</p>`,
  };
  const badge = {
    pendente: ["warning", "pending"],
    manual: ["warning", "manual_review"],
    aceita: ["success", "accepted"],
    rejeitada: ["danger", "rejected"],
  }[outcome] || ["warning", "pending"];
  const passage = outcome === "aceita" ? `<span class="muted">Passagem: Salmo 46:1</span>` : "";
  const next =
    outcome === "aceita"
      ? `<p class="muted">Você cuidou de alguém. Agora, se precisar, também pode pedir uma oração.</p>
         ${btn("Criar meu pedido", to("pedir"), "primary")}`
      : btn("Encontrar alguém para orar", to("encontrar", "vazio"), "secondary");
  const main = `
    <div class="compose" style="grid-template-columns:1fr;max-width:720px">
      <h1>Sua oração</h1>
      ${banners[outcome] || banners.pendente}
      <section class="summary">
        <div class="row-meta">
          <span class="badge ${badge[0]}">${badge[1]}</span>
          ${passage}
        </div>
        <p>Texto ilustrativo da oração, usado só para mostrar a composição. Não é uma oração enviada por alguém.</p>
      </section>
      <div class="btn-stack">${next}</div>
      ${flag(ILLUSTRATIVE)}
    </div>`;
  return shell("app", null, main);
}

function admin(state) {
  let body;
  if (state === "vazia") {
    body = `<section class="empty"><h2>Nenhuma oração pendente</h2><p>A fila de revisão está vazia.</p></section>`;
  } else if (state === "carregando") {
    body = `<div class="skel" aria-hidden="true"><span class="wide"></span><span></span></div><p class="visually-hidden">Carregando…</p>`;
  } else {
    const disabled = state === "decidindo";
    const error =
      state === "erro" ? `<p class="alert" role="alert">Falha na decisão</p>` : "";
    body = `<ul class="admin-list">
      <li class="admin-item">
        <div class="row-meta">
          <span class="badge warning">pendente</span>
          <span>Pedido: Título ilustrativo</span>
          <span>2026-11-20T12:00:00.000Z</span>
        </div>
        <p>Texto ilustrativo da oração para a fila de revisão. Não é conteúdo de uma pessoa.</p>
        <div class="btn-row">
          ${btn(disabled ? "Aprovar" : "Aprovar", "#", "primary", { disabled })}
          ${btn("Rejeitar", "#", "secondary", { disabled })}
        </div>
        ${error}
      </li>
    </ul>
    ${flag(ILLUSTRATIVE + " Horário em ISO, como a tela atual renderiza createdAt.")}`;
  }
  const main = `
    <div class="admin">
      <header class="account-head">
        <h1>Revisão de orações</h1>
        <p class="muted">Ambiente controlado: aprove ou rejeite com auditoria. Não julgue eloquência religiosa.</p>
      </header>
      ${body}
      <a class="back" href="${to("encontrar", "vazio")}">Voltar ao feed</a>
    </div>`;
  return shell("app", null, main);
}

window.ORA_SCREENS = {
  home: { title: "Homepage pública", context: "public", render: home },
  institucional: { title: "Institucional PROD-0", context: "institutional", render: institucional },
  chrome: { title: "Cabeçalho e rodapé", context: "public", render: chrome },
  login: { title: "Entrar", context: "auth", render: login },
  signup: { title: "Criar conta", context: "auth", render: signup },
  forgot: { title: "Esqueci minha senha", context: "auth", render: forgot },
  reset: { title: "Redefinir senha", context: "auth", render: reset },
  confirm: { title: "Confira seu e-mail", context: "auth", render: confirm },
  verified: { title: "Verificação de e-mail", context: "auth", render: verified },
  account: { title: "Minha conta", context: "app", render: account },
  encontrar: { title: "Encontrar alguém para orar", context: "app", render: encontrar },
  detalhe: { title: "Pedido", context: "app", render: detalhe },
  orar: { title: "Orar", context: "app", render: orar },
  pedir: { title: "Criar meu pedido", context: "app", render: pedir },
  "pedir-bloqueado": { title: "Antes de pedir", context: "app", render: pedirBloqueado },
  oracao: { title: "Sua oração", context: "app", render: oracao },
  admin: { title: "Revisão de orações", context: "admin", render: admin },
};
})();
