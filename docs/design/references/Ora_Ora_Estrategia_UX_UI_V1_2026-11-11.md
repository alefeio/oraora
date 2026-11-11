# Ora Ora — Estratégia completa de UX/UI e experiência digital

DOCUMENTO ESTRATÉGICO V1.0 · 11 DE NOVEMBRO DE 2026

A partir da pesquisa aprofundada, vamos avançar da análise de mercado para a definição integral da experiência do Ora Ora, contemplando as sete fases do projeto.

A proposta é estabelecer uma direção de produto suficientemente clara para orientar arquitetura, jornadas, identidade visual, prototipação, validação e implementação futura.

Há uma distinção importante: podemos concluir as definições estratégicas agora, mas não podemos considerar hipóteses de comportamento validadas sem testes com usuários reais. Portanto, apresentarei decisões recomendadas, alternativas e critérios objetivos de aprovação.

## 1. Diagnóstico estratégico — Fase 1

A pesquisa analisou plataformas de oração e fé, comunidades digitais, serviços de apoio entre pessoas e referências especializadas em UX/UI.

### O que o Ora Ora deve ser

## Uma comunidade de cuidado espiritual, não uma rede social religiosa.

O Ora Ora deve facilitar encontros significativos entre pessoas que desejam orar umas pelas outras, preservando a dignidade, a privacidade e a liberdade de cada participante.

Sua principal diferenciação não precisa ser a quantidade de funcionalidades. Deve ser a qualidade da experiência de cuidado.

O ciclo fundamental proposto é:

1

Encontrar

Uma pessoa e sua necessidade

2

Orar

Dedicar atenção genuína

3

Acolher

Transmitir presença e apoio

4

Acompanhar

Manter continuidade

5

Agradecer

Reconhecer o cuidado

6

Recomeçar

Participar livremente

Modelo conceitual proposto, não uma sequência obrigatória de seis telas.

### Referências mais relevantes

| Referência pesquisada                                                                               | Aprendizado para o Ora Ora                                                |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [Pray.com](https://www.pray.com/help/praying-for-others?utm_source=chatgpt.com)                     | Confirmar que alguém orou pode transmitir presença humana                 |
| [YouVersion](https://help.youversion.com/l/en/article/fj48sysun2-prayer-ios?utm_source=chatgpt.com) | Pedidos devem ter continuidade, atualizações e histórico                  |
| [Lifted Prayer](https://www.liftedprayer.com/pt-BR?utm_source=chatgpt.com)                          | Cada pedido pode ser uma experiência própria, não apenas um post          |
| [2o3 — Brasil](https://2o3.app/pedidos-de-oracao/?utm_source=chatgpt.com)                           | A visibilidade de cada pedido deve ser compreensível e controlável        |
| [Inner Room](https://www.24-7prayer.com/a-new-inner-room-app/?utm_source=chatgpt.com)               | Privacidade e ausência de distrações são parte da experiência espiritual  |
| [7 Cups](https://www.7cups.com/about/faq.php?utm_source=chatgpt.com)                                | Comunidades de apoio precisam de limites, moderação e segurança emocional |

A investigação utilizou principalmente páginas oficiais, centrais de ajuda e descrições dos produtos. As áreas autenticadas dos concorrentes não foram integralmente auditadas; por isso, não seria correto afirmar que seus fluxos completos são superiores aos do Ora Ora.

### Decisões estratégicas decorrentes

- Fortalecida: organizar a experiência em torno de pessoas, orações e continuidade, não de publicações e métricas.
- Fortalecida: oferecer privacidade contextual, com escolhas claras antes da publicação.
- Fortalecida: fazer da experiência mobile a principal referência de projeto.
- Enfraquecida: utilizar um dashboard administrativo tradicional como página inicial do participante.
- Enfraquecida: obrigar toda pessoa vulnerável a orar antes de poder receber qualquer acolhimento.
- Descartada como direção de produto: rankings espirituais, pontos por oração, sequências obrigatórias e competição por engajamento.

Essas conclusões orientam as próximas fases, mas ainda serão confrontadas com as necessidades reais do público.

## 2. Comportamento, necessidades e princípios de UX — Fase 2

A proposta de UX deve começar pelas situações que levam alguém a procurar a plataforma, e não por dados demográficos isolados.

### 2.1. Perfis provisórios

Os perfis abaixo são arquétipos de pesquisa, não personas validadas.

| Perfil                             | Necessidade principal                 | Maior risco de fricção                         |
| ---------------------------------- | ------------------------------------- | ---------------------------------------------- |
| Pessoa fragilizada                 | Receber acolhimento sem julgamento    | Sentir que precisa merecer ajuda               |
| Intercessor voluntário             | Encontrar alguém por quem orar        | Não saber se sua participação teve significado |
| Participante recorrente            | Acompanhar pedidos e pessoas          | Perder continuidade e contexto                 |
| Pessoa reservada                   | Pedir oração com discrição            | Expor informações íntimas sem perceber         |
| Usuário com pouca fluência digital | Entender e executar tarefas simples   | Navegação confusa e terminologia técnica       |
| Pessoa que deseja agradecer        | Compartilhar uma atualização positiva | Sentir-se pressionada a relatar um milagre     |

Esses perfis podem coexistir na mesma pessoa. Alguém pode chegar precisando de ajuda e, em outro momento, desejar interceder.

Por isso, não recomendo dividir os usuários em tipos fixos de conta, como "quem ora" e "quem recebe oração".

### 2.2. Jobs to Be Done

A formulação dos principais trabalhos a realizar fica assim:

JTBD 01 — PEDIR ACOLHIMENTO

Quando estou passando por uma dificuldade e não sei com quem compartilhar, quero pedir oração de forma segura, para sentir que alguém conhece minha necessidade e se importa.

JTBD 02 — INTERCEDER

Quando tenho disposição para orar, quero encontrar uma necessidade real, compreendê-la e dedicar um momento de atenção àquela pessoa.

JTBD 03 — ACOMPANHAR

Quando já participei de uma corrente de cuidado, quero encontrar facilmente meus pedidos e as pessoas por quem orei, sem precisar procurar em um feed.

JTBD 04 — CONTROLAR MINHA PRIVACIDADE

Quando compartilho algo delicado, quero saber exatamente quem poderá ver o que escrevi e poder alterar ou retirar minha publicação.

### 2.3. Princípios definitivos de design

Proponho estabelecer oito princípios permanentes para a experiência:

1. Pessoas antes de métricas: não representar a fé como desempenho.
2. Acolhimento antes de exigências: nenhuma regra comunitária pode impedir o acesso a orientações de segurança ou acolhimento básico.
3. Clareza antes de estética: a beleza deve facilitar a compreensão, nunca prejudicá-la.
4. Privacidade antes de exposição: compartilhar precisa ser uma escolha informada.
5. Intenção antes de interação: orar não deve parecer curtir uma publicação.
6. Continuidade antes de volume: valorizar vínculos e acompanhamentos, não quantidade de acessos.
7. Simplicidade antes de funcionalidades: apresentar somente o que ajuda na tarefa atual.
8. Confiança antes de crescimento: jamais sacrificar segurança por aumento de participação.

Esses princípios serão critérios de revisão para todas as telas futuras.

### 2.4. Comportamento cognitivo e acessibilidade

A pesquisa de Nielsen Norman Group favorece orientação contextual em vez de tutoriais extensos e intrusivos. A documentação GOV.UK também recomenda perguntar somente o necessário, usando linguagem compreensível e etapas simples.&#x20;

NN/G+2



Para o Ora Ora, isso significa que o usuário deve aprender a plataforma enquanto utiliza suas funcionalidades, com explicações curtas nos momentos relevantes.

A reciprocidade, por exemplo, precisa de orientação específica porque não é um padrão de navegação conhecido. Já ações comuns, como editar o perfil, não exigem uma sequência introdutória.

Definição da Fase 2: o Ora Ora terá uma experiência orientada por necessidades e estados emocionais, sem perfis rígidos, onboarding longo ou mecanismos de participação compulsória.

## 3. Arquitetura da experiência — Fase 3

Esta fase define como o site público e a experiência autenticada devem funcionar conceitualmente.

### 3.1. Site público

A homepage precisa responder rapidamente a quatro questões: o que é o Ora Ora, por que existe, como participar e como os pedidos são protegidos.

#### Mensagem principal proposta

ORA ORA · PESSOAS QUE ORAM UMAS PELAS OUTRAS

# Ninguém precisa enfrentar tudo sozinho.

Um lugar para compartilhar suas necessidades, encontrar pessoas por quem orar e participar de uma comunidade de cuidado e fé.

Quero orar por alguém

Preciso de oração

Proposta de conteúdo para teste, não o layout definitivo da homepage.

A assinatura da marca permanece "Pessoas que oram umas pelas outras". O título principal poderá ser comparado com outras mensagens nos testes de compreensão.

#### Arquitetura pública recomendada

| Página ou seção                  | Papel                                                       |
| -------------------------------- | ----------------------------------------------------------- |
| Início                           | Comunicar proposta de valor e oferecer dois caminhos claros |
| Como funciona                    | Explicar oração, participação e reciprocidade               |
| Sobre o Ora Ora                  | Apresentar origem, propósito e compromisso                  |
| Segurança e privacidade          | Explicar visibilidade, moderação e direitos                 |
| Perguntas frequentes             | Resolver dúvidas sem exigir cadastro                        |
| Entrar / Criar conta             | Permitir o acesso quando necessário                         |
| Termos e Política de Privacidade | Dar transparência jurídica e operacional                    |

A homepage deve mostrar o funcionamento em poucas etapas, permitir conhecer as regras antes de criar a conta e evitar apresentar pedidos reais de pessoas identificáveis como material promocional.

Depoimentos e histórias públicas somente deverão aparecer com autorização específica, sem indução para compartilhamento de dados íntimos.

### 3.2. Qual modelo de área restrita devemos utilizar?

O maior problema de um dashboard tradicional é que ele costuma responder à pergunta "quais são meus dados?", enquanto o participante do Ora Ora provavelmente chega com outra necessidade: "o que posso fazer aqui agora?"

Comparei três modelos.

Modelo A — Painel pessoal

Não recomendado

Cards, indicadores, atividades, números e atalhos. É organizado, mas tende a parecer um software administrativo e desloca a atenção da pessoa para as métricas.

Modelo B — Jornada de cuidado

Recomendado

Uma atividade principal, caminhos claros para orar ou pedir oração e acompanhamentos contextualizados. Equilibra simplicidade, acolhimento e continuidade.

Modelo C — Feed comunitário

Não recomendado

Publicações contínuas e interações sociais, como uma rede tradicional. Facilita descoberta, mas pode incentivar rolagem excessiva, exposição e competição por atenção.

Representações esquemáticas das estruturas, apenas para comparação arquitetural. Não são wireframes aprovados.

Recomendação: seguir com o Modelo B como hipótese preferencial, preservando recursos de descoberta de pedidos sem criar um feed infinito.

### 3.3. Arquitetura autenticada proposta

A navegação mobile deverá partir de quatro destinos principais:

Início

Orar

Pedidos

Você

Conteúdo de cada destino

Início: convite à participação, acompanhamentos relevantes e orientações contextuais.

Orar: necessidades disponíveis, detalhes do pedido e momento de oração.

Pedidos: criar pedido, acompanhar os próprios pedidos, atualizar ou encerrar.

Você: histórico pessoal, preferências, notificações, privacidade e ajuda.

No desktop, a arquitetura deve permanecer a mesma. A disposição dos elementos pode mudar, mas o usuário não deve precisar reaprender o produto ao trocar de dispositivo.

A expressão "Minha jornada" pode aparecer como título de conteúdo pessoal, sem necessariamente virar mais uma opção de navegação.

### 3.4. As seis jornadas essenciais

Jornada 1 — Primeiro acesso

Após verificar a conta, a pessoa encontra uma saudação breve e dois caminhos: "Quero orar por alguém" ou "Preciso de oração". Não há tutorial obrigatório. O sistema explica reciprocidade quando ela se torna relevante.

Jornada 2 — Orar por alguém

Encontrar um pedido → ler com atenção → reservar um momento para orar → confirmar, voluntariamente, que orou → escolher se deseja acompanhar futuras atualizações.

O registro da oração não pode exigir duração mínima nem contabilizar desempenho espiritual.

Jornada 3 — Pedir oração

Escrever a necessidade → escolher visibilidade e identificação → revisar o que será compartilhado → compreender a reciprocidade → publicar ou optar pela alternativa de acolhimento → acompanhar o estado do pedido.

O formulário será curto, com possibilidade de salvar um rascunho privado.

Jornada 4 — Acompanhar a participação

Consultar pedidos próprios, verificar manifestações de oração, atualizar uma situação, rever pedidos por quem já orou e interromper o acompanhamento quando desejar.

Não haverá pontuação, nível ou ranking.

Jornada 5 — Retornar

A pessoa pode voltar para continuar uma oração, acompanhar uma atualização ou oferecer cuidado novamente. Notificações serão opcionais, específicas e nunca culpabilizadoras.

Jornada 6 — Segurança

A partir de um pedido ou interação, a pessoa poderá denunciar, ocultar conteúdo, interromper uma interação e consultar as orientações da comunidade. Nas configurações, poderá exercer controles sobre privacidade e dados pessoais.

### 3.5. O princípio de reciprocidade

Este é o ponto mais importante para a identidade do produto.

A pesquisa mostrou que exigir uma ação prévia de uma pessoa em sofrimento pode produzir uma experiência de rejeição. Ao mesmo tempo, remover a reciprocidade por completo descaracterizaria o conceito original.

Precisamos preservar seu significado sem transformá-la em pagamento por ajuda.

| Alternativa                   | Vantagem                                                        | Problema                                                 |
| ----------------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| A — Bloqueio obrigatório      | Regra fácil de entender e aplicar                               | Pode negar acolhimento a quem está fragilizado           |
| B — Convite antes de publicar | Preserva o ritual de reciprocidade                              | Ainda pode gerar resistência e abandono                  |
| C — Reciprocidade acolhedora  | Mantém a cultura de cuidar sem bloquear o acolhimento essencial | Requer comunicação e regras operacionais mais cuidadosas |

Recomendo a alternativa C, com a reciprocidade apresentada como primeiro caminho preferencial e não como uma exigência absoluta para merecer cuidado.

Seu funcionamento conceitual seria:

Quero pedir uma oração

Convite à reciprocidade

“Aqui, cuidamos uns dos outros. Que tal começar orando por alguém?”

Posso orar agora

Encontro um pedido e participo

Preciso de acolhimento agora

Acesso a uma alternativa sem obrigação prévia

Pedido preparado com segurança

Publicação ou encaminhamento conforme visibilidade, moderação e capacidade operacional

A rota alternativa precisa ser genuína, não um botão que leva à mesma exigência. Se depender de uma equipe humana de acolhimento, essa equipe e seu processo deverão existir antes de a opção ser oferecida.

Essa proposta deve ser submetida a testes comparativos antes de se tornar regra final.

### 3.6. Ciclo de vida dos pedidos

A estrutura conceitual dos pedidos deverá contemplar:

| Estado            | O que significa                                             |
| ----------------- | ----------------------------------------------------------- |
| Rascunho          | Conteúdo salvo privadamente, ainda não enviado              |
| Em análise        | Pedido aguardando moderação, quando aplicável               |
| Publicado         | Disponível para o público autorizado                        |
| Em acompanhamento | Pedido com manifestações de oração ou acompanhamento ativo  |
| Encerrado         | Autor não deseja continuar recebendo interações             |
| Arquivado         | Mantido no histórico, conforme escolha e regras de retenção |
| Removido          | Retirado de circulação por exclusão solicitada ou moderação |

"Em acompanhamento" poderá ser um atributo, e não um estado exclusivo: isso evita confundir o ciclo de publicação com o ciclo de intercessão.

A pessoa poderá registrar agradecimentos e, se desejar, indicar que considera uma oração respondida. A plataforma não deve certificar milagres nem prometer resultados.

Essa arquitetura fornece uma base funcional para o redesenho sem antecipar o modelo de banco de dados.

## 4. Direção visual e Design System — Fase 4

A identidade do Ora Ora já possui uma base simbólica consistente: os dois Os unidos em um infinito, a representação da eternidade de Deus e a conexão entre pessoas.

A pesquisa não encontrou motivo para abandonar essa direção. O desafio está em definir como essa identidade deve se comportar dentro da experiência digital.

### 4.1. Três direções visuais propostas

Direção A — Acolhimento contemplativo

Preferida

Fundo creme, roxo como cor principal, dourado em detalhes discretos, bastante espaço livre, cantos suavemente arredondados e tipografia humana.

Vantagem: equilíbrio entre espiritualidade, acolhimento e sofisticação.

Risco: excesso de suavidade pode enfraquecer a hierarquia de ações.

Direção B — Comunidade calorosa

Uso mais expressivo de coral, dourado e verde-sálvia, fotografias humanas espontâneas e composições mais dinâmicas.

Vantagem: transmite proximidade e vitalidade comunitária.

Risco: pode parecer um aplicativo social convencional ou excessivamente informal.

Direção C — Serenidade essencial

Composição muito limpa, superfícies brancas e creme, tipografia de destaque, roxo profundo e uso mínimo de elementos decorativos.

Vantagem: excelente base para legibilidade e concentração.

Risco: pode se tornar impessoal ou lembrar aplicativos de produtividade.

Amostras de linguagem visual, não telas do produto. As cores de demonstração não substituem a validação de contraste de cada componente.

### 4.2. Direção preferencial

Recomendo combinar a humanidade visual da Direção A com a clareza operacional da Direção C.

A Direção B poderá contribuir com detalhes de comunicação e conteúdo comunitário, sem dominar toda a interface.

### 4.3. Paleta e aplicação

Roxo

\#533E7E

Dourado

\#F4B25C

Coral

\#E78976

Sálvia

\#8FAE9A

Creme

\#FCF7EE

Uma verificação inicial de contraste fornece as seguintes relações aproximadas com o fundo creme:

| Cor sobre `#FCF7EE` | Contraste | Texto normal AA |
| ------------------- | --------- | --------------- |
| Roxo `#533E7E`      | 8,34:1    | &#x20;Aprovado  |
| Dourado `#F4B25C`   | 1,73:1    | &#x20;Reprovado |
| Coral `#E78976`     | 2,39:1    | &#x20;Reprovado |
| Sálvia `#8FAE9A`    | 2,26:1    | &#x20;Reprovado |

O WCAG 2.2 AA exige, em geral, contraste mínimo de 4,5:1 para texto comum e 3:1 para texto grande.&#x20;

W3C+1



Isso não significa eliminar dourado, coral e sálvia. Significa usá-los como acentos, fundos ou elementos de apoio, com textos de cores apropriadas.

Recomendo manter Nunito como candidata para títulos e mensagens acolhedoras, e Inter para interface funcional, desde que os testes de leitura confirmem a combinação.

### 4.4. Componentes prioritários do Design System

O sistema visual futuro deverá contemplar componentes próprios para pedidos de oração, cartões de acompanhamento, escolhas de privacidade, confirmações de intercessão, alertas sensíveis e mensagens vazias.

Os estados de carregamento, erro, moderação, ausência de pedidos e conexão lenta serão considerados parte do design, não detalhes secundários de implementação.

Resultado da Fase 4: direção visual preferencial estabelecida, paleta preservada e princípios de aplicação definidos. Tipografia, componentes e composições finais ainda dependerão de validação.

## 5. Acessibilidade, privacidade e confiança — Fase 5

Esta fase terá caráter obrigatório, e não apenas consultivo.

### 5.1. Acessibilidade

O nível mínimo de referência será WCAG 2.2 AA.

Além dos requisitos formais, recomendo que as principais ações mobile utilizem áreas de toque próximas ou superiores a 48 CSS pixels, sempre que adequado. O mínimo de 24×24 CSS pixels do critério 2.5.8 AA, com suas exceções, é um piso de conformidade, não uma meta ideal para toda a interface.&#x20;

W3C+1



Também serão exigidos testes de navegação por teclado, leitores de tela, ampliação de texto, orientação mobile, mensagens de erro compreensíveis e reflow sem perda de informação na largura equivalente a 320 CSS pixels.&#x20;

W3C



### 5.2. Modelo de privacidade recomendado

O Ora Ora deve diferenciar claramente identidade e visibilidade.

| Escolha                 | O que o participante deve entender                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| Rascunho privado        | O conteúdo não foi publicado para a comunidade                                                  |
| Pedido sem nome público | Pessoas autorizadas podem ler o pedido, mas não visualizam o nome do autor                      |
| Pedido identificado     | Nome de exibição e conteúdo são compartilhados com o público selecionado                        |
| Público restrito        | Somente destinatários efetivamente autorizados podem visualizar, se essa funcionalidade existir |

Um ponto essencial: publicar sem nome não garante anonimato real. A própria história relatada pode revelar a identidade de alguém, e a plataforma pode precisar manter dados da conta.

Antes de publicar, a pessoa deverá visualizar uma prévia com o conteúdo exato e a indicação de quem poderá lê-lo.

### 5.3. Proteções estruturais

Recomendo estabelecer estas condições antes de abrir a plataforma ao público:

- Pedidos sensíveis não devem ser indexados por mecanismos de busca.
- Informações pessoais não devem aparecer em notificações de forma desnecessária.
- Mensagens privadas livres entre desconhecidos ficam fora do MVP, até existir moderação adequada.
- Todo pedido deve poder ser denunciado e ocultado.
- Informações de saúde ou de outras pessoas merecem alertas contextualizados antes da publicação.
- Logs e ferramentas analíticas não devem armazenar o conteúdo integral dos pedidos.
- Deve existir política de retenção, exclusão e acesso administrativo.
- Contas de menores de idade exigem uma decisão específica de elegibilidade e salvaguardas; recomendo não incluí-las no piloto inicial.

A legislação brasileira considera convicção religiosa e dados referentes à saúde informações pessoais sensíveis. A ANPD recomenda avaliar a elaboração de relatório de impacto quando o tratamento puder apresentar alto risco.&#x20;

www2.camara.leg.br+1



A implementação definitiva exigirá avaliação jurídica e de proteção de dados, inclusive da base legal apropriada para cada tratamento. Não basta colocar uma caixa de consentimento em um formulário.

### 5.4. Segurança emocional e moderação

A comunidade precisará de regras explícitas contra assédio, exposição de terceiros, exploração financeira, promessas de cura, solicitação de dados particulares e aconselhamento perigoso.

Uma pessoa que relata sofrimento grave deve receber orientação apropriada. O Ora Ora não poderá se apresentar como substituto de atendimento médico ou psicológico.

Para o Brasil, recursos de apoio como o CVV 188 e, em situações de emergência, o SAMU 192 deverão estar disponíveis nos contextos pertinentes.&#x20;

Ministério da Saúde+1



O administrador também precisará de meios para revisar denúncias, restringir conteúdo, registrar decisões e proteger dados sensíveis. Isso é uma dependência de segurança da experiência do participante, mesmo que o redesenho administrativo seja tratado em outra frente.

Resultado da Fase 5: privacidade por padrão, moderação, proteção emocional e acessibilidade tornam-se condições de lançamento.

## 6. Síntese estratégica e prioridades — Fase 6

### 6.1. Escopo recomendado por etapa

### MVP — Experiência essencial

Prioridade P0

Tudo que precisamos para entregar o ciclo de cuidado com segurança.

Site público claro e responsivo

Autenticação e primeiro acesso acessíveis

Descoberta de pedidos autorizados

Momento de oração e confirmação voluntária

Criação e acompanhamento de pedidos

Reciprocidade acolhedora e tratamento de exceções

Privacidade, moderação, denúncia e exclusão

Acessibilidade WCAG 2.2 AA

### Evolução 1 — Continuidade

Prioridade P1

Acompanhamento voluntário de pedidos

Atualizações e agradecimentos

Notificações opcionais e contextualizadas

Preferências de temas de oração

Refinamentos de descoberta e navegação

### Futuro — Comunidade ampliada

Prioridade P2

Grupos de oração com governança própria

Círculos de cuidado e acompanhamento continuado

Recursos de acessibilidade e idiomas adicionais

Possíveis iniciativas solidárias, submetidas a estudo ético e jurídico separado

Os itens são um escopo proposto, não uma indicação de que já foram implementados ou testados.

### 6.2. Como medir sucesso sem medir a fé

Precisamos de indicadores de experiência, e não de espiritualidade.

| Dimensão       | Métrica recomendada                                             |
| -------------- | --------------------------------------------------------------- |
| Compreensão    | Percentual que explica corretamente como participar             |
| Usabilidade    | Conclusão de tarefas sem assistência                            |
| Privacidade    | Compreensão correta de quem vê cada pedido                      |
| Acolhimento    | Avaliação voluntária de segurança e respeito                    |
| Continuidade   | Participantes que optam por acompanhar um pedido                |
| Confiabilidade | Erros, falhas de publicação e ocorrências de exposição indevida |
| Segurança      | Tempo de tratamento de denúncias e incidentes                   |

Os números iniciais servirão para estabelecer uma linha de base. Não devemos inventar metas de conversão ou retenção antes de observar uso real.

A métrica central poderá ser a proporção de jornadas de cuidado concluídas com segurança e compreensão, acompanhada de indicadores de privacidade e satisfação.

A confirmação "orei" representa uma declaração voluntária do participante, não uma prova de oração realizada.

### 6.3. Riscos mais relevantes

| Risco                                          | Gravidade proposta | Mitigação                                             |
| ---------------------------------------------- | ------------------ | ----------------------------------------------------- |
| Reciprocidade interpretada como cobrança       | Alta               | Testes de compreensão e rota acolhedora               |
| Exposição de informações íntimas               | Crítica            | Privacidade e revisão antes de publicar               |
| Pedido sem resposta produzir abandono          | Alta               | Comunicação transparente, sem promessa de atendimento |
| Participação virar competição                  | Alta               | Ausência de rankings e pontuações                     |
| Interações inadequadas                         | Crítica            | Moderação, denúncia e limitação de contato            |
| Interface difícil para usuários iniciantes     | Alta               | Testes mobile com perfis diversos                     |
| Crescimento superior à capacidade de moderação | Crítica            | Piloto controlado e critérios de expansão             |

## 7. Validação, decisões e aprovação — Fase 7

Podemos estabelecer agora o processo completo de aprovação, mas algumas evidências ainda precisam ser coletadas.

### 7.1. Pesquisa com usuários

A recomendação é realizar 12 a 15 entrevistas exploratórias, com recrutamento intencional de pessoas que costumam pedir oração, pessoas que intercedem, participantes reservados e usuários com menor familiaridade digital.

As entrevistas devem investigar acontecimentos reais, como o último pedido de oração que a pessoa fez, onde procurou ajuda e o que a deixou confortável ou desconfortável.

Não devemos simplesmente perguntar se a pessoa gostou da ideia do Ora Ora, porque isso pode produzir respostas socialmente desejáveis. A Nielsen Norman Group recomenda explorar experiências concretas e complementar o relato com observação de comportamento.&#x20;

NN/G



### 7.2. Testes antes dos layouts

1. Teste de conceito e reciprocidade

   Comparar as três alternativas de reciprocidade com participantes reais. Verificar compreensão, percepção de justiça, acolhimento e confiança.

2. Card sorting e tree testing

   Avaliar se as pessoas entendem a organização de "Orar", "Pedidos", "Início" e "Você" e conseguem localizar tarefas sem ajuda. Tree testing é indicado para verificar a encontrabilidade antes do desenho das telas.&#x20;

   NN/G

3. Protótipos de baixa fidelidade

   Testar primeiro acesso, oração, pedido, privacidade, acompanhamento e denúncia. Realizar pelo menos duas rodadas iterativas com aproximadamente cinco a oito participantes por rodada, diversificando os perfis.

4. Comparação visual

   Avaliar as três direções em relação a confiança, legibilidade, acolhimento e coerência com a marca. Preferência estética não deve substituir resultados de usabilidade.

5. Validação final

   Submeter os protótipos refinados a testes assistivos, auditoria WCAG, testes de conexão lenta e revisão das salvaguardas de privacidade e moderação.

### 7.3. Critérios de aprovação

Proponho estes objetivos iniciais para os testes, a serem ajustados conforme o protocolo:

| Verificação                | Critério proposto                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------- |
| Entender o propósito       | Pelo menos 80% explicam corretamente o serviço, sem orientação                        |
| Localizar a ação principal | Pelo menos 90% encontram como orar ou pedir oração                                    |
| Criar pedido               | Pelo menos 85% concluem a tarefa sem ajuda                                            |
| Interpretar privacidade    | Nenhum erro crítico de interpretação de exposição nos testes finais                   |
| Entender reciprocidade     | Participantes conseguem explicar a regra sem interpretá-la como compra ou merecimento |
| Acessibilidade             | Nenhuma falha bloqueadora e conformidade WCAG 2.2 AA verificada                       |

Esses percentuais são critérios de projeto propostos, não resultados existentes nem estimativas estatísticas. Amostras pequenas ajudam a detectar problemas, mas não comprovam taxas populacionais precisas.&#x20;

NN/G



### 7.4. Gates de decisão e desenvolvimento

1. GATE UX-01 — Estratégia do produto

   Aprovar posicionamento, princípios de experiência, perfis provisórios, escopo e riscos. O presente documento constitui a proposta inicial.
2. GATE UX-02 — Comportamento e reciprocidade

   Concluir entrevistas, testes de conceito e definição do modelo definitivo de reciprocidade e acolhimento.
3. GATE UX-03 — Arquitetura da informação

   Aprovar estrutura do site público, destinos da área restrita, terminologia e fluxo de navegação.
4. GATE UX-04 — Wireframes e jornadas

   Criar e validar protótipos de baixa fidelidade dos seis fluxos essenciais.
5. GATE UX-05 — Identidade e alta fidelidade

   Refinar a direção visual selecionada, criar layouts responsivos e componentes principais.
6. GATE UX-06 — Design System e segurança

   Especificar componentes, estados, acessibilidade, moderação e decisões de privacidade.
7. GATE UX-07 — Preparação técnica

   Auditar o que já existe no Next.js, definir reaproveitamento, migrações necessárias, testes e plano de implementação por sprints.
8. GATE UX-08 — Homologação e lançamento

   Executar sprints em branches isoladas, validar cada entrega, homologar fluxos e liberar um piloto controlado antes da expansão.

O Cursor poderá executar a implementação depois dos gates de aprovação, mas a solução visual e funcional deve nascer das decisões de produto, não das facilidades do código existente.

## 8. Decisões consolidadas e pendências

### Definido estrategicamente

Posicionamento: comunidade de cuidado espiritual entre pessoas.

Experiência preferida: jornada contextual de cuidado em lugar de dashboard tradicional ou feed infinito.

Navegação proposta: Início, Orar, Pedidos e Você.

Visual preferido: acolhimento contemplativo com clareza e legibilidade.

Princípios essenciais: reciprocidade sem coerção, privacidade, acessibilidade, participação voluntária e continuidade.

MVP: orar, pedir, acompanhar e participar com segurança.

### A validar antes dos layouts finais

- Interpretação do princípio de reciprocidade pelo público.
- Modelo seguro e operacional para quem precisa de acolhimento imediato.
- Compreensão dos nomes e destinos da navegação.
- Preferências de identificação e visibilidade.
- Significado do gesto "orei por você".
- Capacidade real de moderação e atendimento.
- Legibilidade e percepção emocional da direção visual.

### Minha recomendação para o avanço

A proposta das sete fases está definida, mas recomendo não tratá-la como aprovação automática das telas. O próximo marco efetivo deve ser o GATE UX-02: validar as hipóteses mais sensíveis, especialmente a reciprocidade e a privacidade, antes de consolidar a arquitetura e desenhar os layouts de alta fidelidade.

Assim, o Ora Ora poderá evoluir com uma experiência reconhecível, humana e consistente, sem perder seu propósito original:

Pessoas que oram umas pelas outras.