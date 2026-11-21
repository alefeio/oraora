# Galeria UI-04 — como revisar

Propostas visuais isoladas. **Não** são o aplicativo Ora Ora e **não** acessam API, banco ou sessão.

## Abrir no Windows (recomendado)

No PowerShell, a partir da raiz do repositório:

```powershell
cd docs\design\explorations\ui-04
npx --yes serve -l 4174 .
```

Depois abra no navegador:

- Galeria: [http://127.0.0.1:4174/](http://127.0.0.1:4174/)
- Antes/depois: [http://127.0.0.1:4174/comparar.html](http://127.0.0.1:4174/comparar.html)

Para encerrar o servidor: `Ctrl+C` no terminal.

## Alternativa sem `npx`

```powershell
cd docs\design\explorations\ui-04
node -e "require('http').createServer((q,s)=>{const fs=require('fs'),p=require('path');let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/'||u==='')u='/index.html';const f=p.join(process.cwd(),u);fs.readFile(f,(e,d)=>{if(e){s.writeHead(404);s.end('not found');return;}const t={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg'}[p.extname(f)]||'application/octet-stream';s.writeHead(200,{'Content-Type':t});s.end(d);});}).listen(4174,'127.0.0.1',()=>console.log('http://127.0.0.1:4174/'))"
```

## Abrir o arquivo direto

Também é possível abrir `index.html` e `comparar.html` no navegador (duplo clique). CSS, JS e a logomarca em `../assets/logo.png` devem carregar. Se algum iframe ou imagem falhar, use o servidor local acima.

## Como usar a galeria

1. Escolha a tela na coluna esquerda (grupos: site público, autenticação, área autenticada, administração).
2. Telas com faixa dourada são as **quatro prioritárias**.
3. Alterne **Desktop** / **Mobile**.
4. Use **Estado** para ver vazios, erros e demais estados reconstruídos do código.
5. **Captura real anterior** só existe quando há evidência do UI-01; mostra a captura antiga, não a proposta.
6. **Antes/depois** abre o comparativo lado a lado das telas públicas já capturadas.

## Preview Vercel (opcional, não publicado aqui)

É possível apontar um Preview só para `docs/design/explorations/ui-04/`, sem ligar o app. Riscos: URL pública, indexação e possível confusão com o produto real. **Não** publicar automaticamente; só se o proprietário pedir um Preview isolado e estático.

## O que não fazer

- Não usar esta pasta como app de homologação autenticada.
- Não desligar SSO, middleware ou autenticação do Preview do produto.
- Não misturar estes arquivos com `src/` da aplicação funcional.
