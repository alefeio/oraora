# UI-01 — Três direções visuais (sem implementação)

Todas as propostas preservam **as mesmas rotas, regras, campos, permissões e jornada**.  
Mudam apenas personalidade visual, tipografia aplicada, composição e componentes.

Referência pedida: **Acolhimento contemplativo + Serenidade essencial**.  
Paleta e símbolo oficiais permanecem.

---

## Conceito A — Acolhimento contemporâneo

### Personalidade
Calor humano, leveza e proximidade. Espaços generosos, cantos suaves, atmosfera de “casa acolhedora digital”.

### Tipografia
- Display: Nunito 700/800, tracking ligeiramente aberto em títulos.
- Corpo: Inter 400/500, line-height generoso (1.6–1.75).
- Escala amigável; H1 emocional, não monumental.

### Cores
- Cream como base dominante.
- Primary para CTAs e títulos.
- Coral/gold como **manchas de luz** e underline de ênfase (não texto).
- Sage para estados de paz / sucesso suave.

### Composição
- Hero com logo + essência (evitar repetir tagline do arquivo como H1).
- Seções com ritmo generoso; menos cards — preferir blocos tipográficos.
- Auth com faixa lateral suave ou glow discreto (desktop).

### Componentes
- Botões primary arredondados médios; secondary “soft fill”.
- Cards só onde há interação/listagem; home usa blocos sem borda forte.
- Campos com fundo cream-soft e borda que escurece no focus.

### Mobile
- Nav compacta com todos os destinos essenciais acessíveis.
- CTAs empilhados full-width.
- Feed em lista respirável (não grade densa).

### Pontos fortes
Alinha-se ao acolhimento da marca; fácil de aplicar sobre o código atual; confortável para fé + comunidade.

### Riscos
Pode parecer “soft SaaS genérico” se os cards e pills permanecerem; precisa disciplina para não infantilizar.

### Adequação ao Ora Ora
Alta — combina fé e humanidade sem teatralidade.

---

## Conceito B — Elegância contemplativa

### Personalidade
Serenidade, sofisticação quieta, silêncio visual. Menos elementos, mais presença tipográfica. “Capela moderna digital”.

### Tipografia
- Display: Nunito com contraste forte de escala (H1 grande, corpo contido).
- Mais peso no tracking negativo dos títulos.
- Menos uppercase; ênfases por tamanho/cor, não por badges.

### Cores
- Cream + primary quase monocromáticos.
- Gold/coral extremamente parcimoniosos (1 acento por viewport).
- Superfícies quase planas; bordas hairline.

### Composição
- Muito espaço negativo.
- Home e institucional com composição editorial (coluna tipográfica).
- Auth centrado, mínimo; sem decoração concorrente.
- Área logada: densidade controlada, hierarquia clara título → história → CTA.

### Componentes
- Quase sem sombra; elevação por tipografia e espaço.
- Botões sóbrios; ghost bem usado.
- Cards “sem card”: lista com divisor, não caixa.

### Mobile
- Uma coluna; tipografia escala sem perder respiro.
- Evitar chips pill excessivos — filtros como texto/underline.

### Pontos fortes
Mais distinto; transmite confiança e profundidade espiritual; reduz poluição.

### Riscos
Pode parecer frio ou elitista se o acolhimento sumir; admin e feed podem precisar exceções de densidade.

### Adequação ao Ora Ora
Alta para institucional e momentos de oração; média para feed operacional (exige equilíbrio).

---

## Conceito C — Comunidade moderna

### Personalidade
Energia comunitária contida: dinâmica, clara, contemporânea. Mantém sobriedade espiritual, mas com ritmo mais “produto vivo”.

### Tipografia
- Nunito forte em headings curtos.
- Inter denso e legível em listagens.
- Microcopy de status mais presente (sem mudar significado).

### Cores
- Primary dominante.
- Sage/coral em badges e indicadores de cuidado/estado.
- Gold para momentos de “luz” (sucesso de oração válida, por exemplo) — sempre com texto escuro.

### Composição
- Home com caminho Conhecer → Orar → Pedir mais visual (ícones lineares do MiniGuia, sem clichê religioso).
- Feed com hierarquia de prioridade mais evidente (ainda a mesma ordenação).
- Nav app com estado ativo claro.

### Componentes
- Chips e badges mais expressivos (ainda acessíveis).
- Cards refinados, não eliminados — melhores para listas.
- Feedback visual mais rico em loading/sucesso.

### Mobile
- Bottom emphasis nos CTAs principais (sem mudar destinos).
- Filtros de categoria visíveis e fáceis.

### Pontos fortes
Clareza operacional; boa para retenção da jornada autenticada; usa mais a paleta.

### Riscos
Desliza para “app social / dashboard”; pode competir com a serenidade pedida.

### Adequação ao Ora Ora
Média-alta — útil no app; menos ideal como linguagem única institucional.

---

## Comparativo

| Dimensão | A Acolhimento | B Contemplativa | C Comunidade |
|---|---|---|---|
| Personalidade | Calor + leveza | Sofisticação quieta | Dinâmica sóbria |
| Tipografia | Amigável | Expressiva/minimal | Produto clara |
| Cores | Cream + acentos suaves | Quase mono + 1 acento | Acentos em estados |
| Composição | Generosa | Editorial | Produto/jornada |
| Componentes | Soft, menos bordas | Quase sem cards | Cards refinados |
| Mobile | Acolhedor | Sereno | Operacional |
| Risco principal | Genericidade soft | Frieza | Visual de app social |
| Fit institucional | Alto | Muito alto | Médio |
| Fit área logada | Alto | Médio-alto | Alto |

---

## Recomendação: **Conceito A com alma do Conceito B**

**Direção recomendada:** *Acolhimento contemporâneo*, absorvendo a **disciplina tipográfica e a redução de cards** do Conceito B.

### Justificativa técnica

1. O brief pede **acolhimento + serenidade** — A carrega o calor; B evita a poluição.
2. O app autenticado precisa ser legível e humano (A), sem virar dashboard (rejeitar C como linguagem global).
3. O institucional PROD-0 já inclina-se a B; unificar sob A+B cria um sistema único sem reinventar a marca.
4. Implementação futura cabe em tokens Tailwind/CSS existentes — sem dependências novas.
5. Preserva todas as regras: só muda superfícies, ritmo e hierarquia.

### O que explicitamente **não** fazer nesta direção

- Não remover reciprocidade nem “suavizar” elegibilidade.
- Não reorganizar destinos de navegação.
- Não introduzir doações/financeiro.
- Não trocar Nunito/Inter nem a paleta oficial.
- Não usar gold/coral/sage como texto pequeno.

### Decisão necessária do proprietário

Escolher:

1. **A+B (recomendado)**  
2. A puro  
3. B puro  
4. C (apenas se quiser priorizar energia do app autenticado)

Nenhuma implementação até aprovação (Gate UI-02).
