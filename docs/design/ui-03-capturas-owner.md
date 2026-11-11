# UI-03 — Instruções de captura (proprietário)

## Objetivo

Obter evidências **visuais** das telas autenticadas ainda sem screenshot, para desbloquear layouts finais no UI-04.

## Como capturar

1. Abra o Preview funcional com seu login SSO Vercel (não desative a proteção).  
   `https://oraora-git-hardening-gate-2-6d-account-b52bb2-alefeios-projects.vercel.app`
2. Entre com a conta de homologação (já existente).  
3. **Não** envie senha, cookies, tokens ou HTML com dados pessoais identificáveis.  
4. Prefira fixtures/pedidos de teste. Se aparecer e-mail real, recorte/omita.  
5. Salve PNGs em `docs/design/evidence/ui-02/owner-captures/` (ou `ui-03/owner-captures/`).  
6. Nome: `ui03-owner-<tela>-<estado>-<desktop|mobile>.png`

## Checklist definitiva

| # | Tela | Rota | Estados | Desktop | Mobile |
|---|---|---|---|---|---|
| 1 | Encontrar | `/encontrar` | lista; vazio; categoria ativa | ☐ | ☐ |
| 2 | Detalhe | `/encontrar/[id]` | pedido + CTA | ☐ | ☐ |
| 3 | Intercessão | `/encontrar/[id]/orar` | form; erro se houver | ☐ | ☐ |
| 4 | Pedir elegível | `/pedir` | formulário | ☐ | ☐ |
| 5 | Pedir bloqueado | `/pedir` | mensagem elegibilidade | ☐ | ☐ |
| 6 | Acompanhamento | `/oracoes/[id]` | pending; accepted; rejected | ☐ | ☐ |
| 7 | Conta | `/account` | sessão + ações | ☐ | ☐ |
| 8 | Admin | `/admin/revisao` | se papel admin | ☐ / N/A | ☐ / N/A |
| 9 | Redefinir senha | `/redefinir-senha` | form | ☐ | ☐ |

## Status

**AUTHENTICATED SCREENS: PENDING** — não homologadas visualmente ao vivo.  
O Design System pode ser revisado agora; **layouts finais dessas telas não**.
