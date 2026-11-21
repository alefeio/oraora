# UI-04 — Aceite visual

Galeria: [explorations/ui-04/index.html](explorations/ui-04/index.html)  
Como abrir: [explorations/ui-04/README.md](explorations/ui-04/README.md)

Branch: `design/ui-redesign-discovery`  
Base de planejamento: `431a8d17d7c1521dd4067045c56389084b8a8b09`  
App funcional consultado: `hardening/gate-2-6d-account-recovery` @ `dca1d1e435c53472231c2a493a84b1dd42b4d8a7`  
Institucional consultado: `release/prod-0-institucional` @ `91064edca6ca39fe15531d8dad22c3e8a2c4e2de`

Nada foi alterado em React, Tailwind, APIs, Prisma, rotas ou nas branches funcional, institucional e main.

## Como ler as evidências

| Classificação | O que é |
|---|---|
| Captura real | Tela do produto em execução. No UI-04, isso vale só para o “antes”, herdado do UI-01. |
| Protótipo reconstruído a partir do código | HTML isolado com os textos, campos, ações e destinos que o React renderiza hoje. |
| Estado ilustrativo | Valor de exemplo, marcado na tela. Não é usuário, pedido ou oração real. |
| Pendente de homologação real | Layout autenticado ainda não visto no sistema com sessão verdadeira. |

A proposta nova não é captura do aplicativo.

## Matriz de preservação

Para todas as telas abaixo, o que muda é composição, espaçamento, tipo, cor, superfície, borda, sombra, hierarquia e responsividade.

| Tela | Rota | Preservado | Alterado só na apresentação |
|---|---|---|---|
| Homepage | `/` | CTAs, três passos, essência, princípio, parágrafo de participação, aviso do rodapé | Logo menor; tagline deixa de ser o H1 e permanece no rodapé; caminho editorial no lugar de três cards iguais |
| Institucional | `/` em PROD-0 | Todos os parágrafos, sem CTA de produto | Logo menor; “Princípio” em roxo com ponto coral; domínio em creme com sublinhado dourado |
| Cabeçalho | público e app | `/encontrar`, `/login`, `/signup`, `/pedir`, `/account` | Logo menor; Encontrar visível no mobile; item atual com sublinhado dourado |
| Rodapé | app e home | Essência, princípio, aviso de desenvolvimento | Logo menor; tagline em texto para continuar legível |
| Login | `/login` | E-mail, senha mín. 10, esqueci senha, cadastre-se, erro de e-mail não verificado | Coluna editorial + formulário |
| Cadastro | `/signup` | Nome, e-mail, senha, princípio, estado de cadastro fechado | Mesma casca visual do login |
| Esqueci senha | `/esqueci-minha-senha` | Campo, dica, ack neutro, falha genérica | Casca |
| Redefinir | `/redefinir-senha` | Dois campos, mensagens de link e de confirmação | Casca |
| Confirme e-mail | `/confirme-seu-email` | Título “Confira seu e-mail”, reenvio, botão desabilitado sem e-mail | Casca |
| E-mail verificado | `/email-verificado` | Sucesso, pendente, expirado, inválido e o botão de entrar | Casca |
| Minha conta | `/account` | Nome, e-mail, papel, e-mail verificado, três ações, texto de sessão | Nome em destaque; ações em coluna; valores ilustrativos |
| Encontrar | `/encontrar` | Título, texto do feed, 11 categorias, “Todas”, vazio normativo, contagem e hints | Chips de 44px; vazio em superfície sálvia; cartões só nos itens |
| Detalhe | `/encontrar/[id]` | Voltar, categoria, rótulo, status, história, intenção, CTA | Leitura à esquerda, intenção e CTA à direita no desktop |
| Orar | `/encontrar/[id]/orar` | Voltar, resumo, Palavra opcional, textarea, enviar | Mesmos campos, superfície mais calma |
| Pedir elegível | `/pedir` | Aviso de consumo da autorização e todos os campos | Um único cartão de formulário |
| Pedir bloqueado | `/pedir` | “Antes de pedir”, as duas mensagens de elegibilidade, o princípio e o CTA | A frase repetida fica em dois papéis: enunciado e citação do princípio |
| Acompanhamento | `/oracoes/[id]` | Banners e outcomes `pending`, `manual_review`, `accepted`, `rejected` | Mesmos textos; próximo passo segue `canPublish` |
| Revisão | `/admin/revisao` | Aprovar, rejeitar, fila vazia, erro, data em ISO | Densidade operacional, sem glow |

Não há incompatibilidade que exija mudar comportamento. Nenhuma proposta foi executada no aplicativo.

## O que não entrou porque não existe na interface

Não há tela separada para “limite de pedidos abertos”. A UI de `/pedir` só mostra `canPublish` e a mensagem do snapshot: sem oração válida, ou oração ainda em revisão. O limite continua na regra do servidor.

## Telas pendentes de validação real

Homologar com sessão verdadeira, sem desligar autenticação:

- `/account`
- `/encontrar` e `/encontrar/[id]`
- `/encontrar/[id]/orar`
- `/pedir` nos dois resultados de elegibilidade
- `/oracoes/[id]`
- `/admin/revisao`

Públicas já tinham captura real do estado anterior. A proposta nova delas também continua sendo protótipo até alguém aprovar e o UI-05 implementar.

## Acessibilidade deste gate

Auditoria numérica: [evidence/ui-04/contrast-audit.csv](evidence/ui-04/contrast-audit.csv).

- Texto semântico passa AA.
- Ouro, coral e sálvia continuam proibidos como texto.
- Foco desenhado: anel de 2px `#533E7E`, deslocado 2px.
- Borda atual `#CBBBA3` não chega a 3:1. O protótipo usa `#7A6A56` só na borda do controle.
- Alvos desenhados com no mínimo 44px. Isso não foi medido em dispositivo.
- `prefers-reduced-motion` desliga pulso e transição no protótipo.
- Botão desabilitado usa texto `#2A2140` sobre `#D9D2E4` e borda `#7A6A56`. Componente inativo é isento de 1.4.11; o par de texto ainda passa.

Protótipo estático não comprova teclado, leitor de tela, reflow no app nem ordem de foco real.

## Sprints visuais sugeridas, depois da aprovação

1. Fundação: tokens, inclusive a borda de controle, cabeçalho, rodapé e tamanho da logo.
2. Homepage funcional e página institucional.
3. Autenticação, com os estados de erro, espera e sucesso.
4. Minha conta, encontrar e detalhe.
5. Pedir (elegível e bloqueado), orar e acompanhamento.
6. Revisão administrativa.
7. Só então a verificação funcional de acessibilidade no aplicativo.

Não iniciar essas sprints antes do aceite visual. Não antecipar UI financeira.
