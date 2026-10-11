Franco Importados vende produtos importados no **atacado e no varejo**. A identidade é preto e branco, de inspiração editorial: um monograma **FR** em serifa Didone pesada, cruzado por "FRANCO IMPORTADOS" em sans fina e espaçada, com a assinatura "ATACADO E VAREJO" logo abaixo. O site deve parecer uma boutique de importados — sóbrio, confiável, com o produto em primeiro plano — e nunca uma loja de ofertas barulhenta.

## Conteúdo e voz

- Escreva em português do Brasil, tratando o cliente por **você**. Frases curtas, diretas e cordiais: "Enviamos para todo o Brasil.", "Restam 2 peças em estoque."
- **Caixa alta só em rótulos curtos** (botões, selos, sobretítulos, menu), sempre com o espaçamento largo dos estilos `label` e `eyebrow` — como "ATACADO E VAREJO" na logotipo. Títulos e textos usam caixa normal (só a primeira letra maiúscula).
- Botões no infinitivo: "Adicionar à sacola", "Finalizar compra", "Seja revendedor". Use **sacola**, não "carrinho".
- Sempre deixe claro o canal: varejo (preço unitário, parcelamento) ou atacado (lote mínimo, preço por quantidade, "Seja revendedor").
- Destaque procedência e confiança: país de origem no cartão ("Importado · Itália"), garantia, prazos reais.
- Preços sempre por `Franco.formatBRL()`: "R$ 1.299,90", "ou 10x de R$ 129,99 sem juros", "R$ 1.234,91 no Pix".
- Sem emoji, sem exclamações em série, sem "IMPERDÍVEL!!!".

## Cor

- A marca é **monocromática**. `ink` sobre `bg` é a combinação principal; `brand` (preto) é a cor de ação — botão primário, contador da sacola, seleção ativa — com `on-brand` por cima.
- Use `surface` para faixas alternadas e fundos de foto de produto; `surface-raised` para cartões flutuantes, menus e a sacola lateral; `surface-inverse` + `ink-inverse` para a faixa de anúncio, o rodapé e blocos de impacto.
- Hierarquia de texto: `ink` (títulos, nomes, preços) → `ink-muted` (descrições, marca) → `ink-subtle` (legendas, preço riscado, placeholders). Todas passam 4.5:1 sobre `bg`, `surface` e `surface-raised` nos dois temas.
- `line` para fios decorativos; `line-strong` para bordas de campos e controles (3:1). `speckle` é o cinza pontilhado da logo — só textura e imagem ausente, nunca texto.
- **Cor fora do preto e branco é exceção funcional.** `sale` (vermelho) só para preço promocional e selo de desconto. `success`, `warning`, `danger` e `info` só em feedback, sempre com os fundos `*-bg` correspondentes e sempre acompanhados de texto ou ícone.
- Tema escuro (`Escuro`): inverte a marca — `brand` vira quase branco com `on-brand` preto, e a logotipo troca para a versão branca. Defina `data-theme="dark"` no `<html>`.

## Tipografia

- Duas famílias, ambas do Google Fonts: **Bodoni Moda** (`display`) ecoa o monograma FR; **Jost** (`sans`) ecoa o "FRANCO IMPORTADOS" geométrico e fino da logo.
- `display-xl` só no Hero (um por página); `display-lg` em títulos de campanha/categoria; `heading-1` em títulos de seção e no nome do produto na página de produto. A serifa nunca desce abaixo de 28px.
- Todo o resto em Jost: `heading-2` e `heading-3` para subtítulos de interface, `body` para texto corrido, `body-sm` para metadados, `caption` para parcelamento e ajuda, `price` para preços.
- `eyebrow` (12px, 0.24em) e `label` (13px, 0.14em) sempre em caixa alta (`text-transform: uppercase`).
- Preços com algarismos tabulares (`font-variant-numeric: tabular-nums`).

## Espaçamento e layout

- Escala de 4px: `space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-6` 24 · `space-8` 32 · `space-12` 48 · `space-16` 64 · `space-24` 96.
- Conteúdo até `container-max` (1280px), com margem lateral `space-4` no celular e `space-8` no desktop. Entre seções: `space-12` no celular, `space-16` no desktop.
- Grade de produtos: 2 colunas no celular, 3 no tablet, 4 no desktop, espaço `space-6`.
- Generosidade de branco é parte da marca: na dúvida, mais respiro e menos elementos.

## Formas, bordas e sombras

- **Tudo é reto.** `radius-none` em botões, campos, cartões e imagens, como a geometria da logo. `radius-sm` (2px) só em selos e caixas de seleção; `radius-pill` só no contador da sacola e em chips de filtro.
- Separe com fios de `hairline` (1px) em `line`, não com sombras. Cartões de produto não têm borda nem sombra.
- Sombras só no que flutua: `shadow-sm` no cabeçalho fixo, `shadow-lg` na sacola lateral, menus e modais.

## Estados e interação

- Hover: botão primário escurece para `brand-hover`; secundário inverte para preto cheio; links ganham sublinhado fino. Imagem de produto aproxima 3% em 0.4s.
- Foco: anel sólido de 2px em `focus` com 2px de afastamento — visível em todas as superfícies, nos dois temas. Nunca remova o contorno.
- Desabilitado: fundo `surface`, texto `ink-subtle`, e o motivo escrito ("Esgotado").
- Transições curtas (0.15s em cor, 0.4s em imagem); sem animações de entrada chamativas.

## Imagens

- Fotos de produto em fundo neutro claro (próximo de `surface`), luz suave, recorte 4:5 nas listagens. Sem molduras, sem sombras aplicadas.
- Fotos de ambiente no Hero e em campanhas: tons neutros e naturais, sem filtros coloridos que disputem com o preto e branco.
- Sem foto disponível, use o monograma "FR" em `speckle` sobre `surface` (já embutido no `ProductCard`).

## Logotipo

- Use os arquivos do grupo **Logos**: `franco-logo-preto.png` sobre fundos claros, `franco-logo-branco.png` sobre `surface-inverse` e no tema escuro. `franco-logo-original.jpeg` é o arquivo de origem (fundo branco) — não use no site.
- Altura mínima de 36px (celular) e 52px no cabeçalho desktop; respiro ao redor de pelo menos metade da altura do monograma.
- Não recolorir, esticar, aplicar sombra, nem colocar sobre fotos movimentadas.

## Iconografia

- Conjunto próprio de 12 ícones de traço (grupo **Icons** e o componente `Icon`): 24px de grade, traço 1.5px, terminações retas — leves como a sans da logo. Em React use `Franco.Icon`, que herda `currentColor`.
- Os SVGs do grupo **Icons** têm tinta fixa `#0a0a0a` (= `ink` claro); para o tema escuro use o componente ou recolora o `stroke`.
- Não há ícones de marcas de terceiros (pagamento, redes sociais) no sistema: use os arquivos oficiais de cada empresa.
- Sem emoji como ícone.
