# Button

Botão retangular, sem cantos arredondados, com rótulo em caixa alta espaçada — a mesma voz tipográfica de "ATACADO E VAREJO" na logotipo.

**O consumidor fornece:** `children` (o rótulo, curto e no infinitivo: "Adicionar à sacola", "Finalizar compra"), `onClick` ou `href`, e opcionalmente `variant`, `size`, `full`, `icon`/`iconRight`.

- `primary` (preto `brand`, texto `on-brand`): a ação principal da área. **Um por tela/cartão.**
- `secondary` (contorno `ink`): ações paralelas — "Ver detalhes", "Comprar no atacado". No hover inverte para preto.
- `ghost` (link sublinhado): "Ver todos", ações terciárias em cabeçalhos de seção.
- `full` no celular, carrinho e checkout. `lg` (56px) só no Hero e na página de produto.
- Desabilitado = esgotado/indisponível; diga o motivo no rótulo ("Esgotado"), não só esmaeça.

Não use: cantos arredondados, sombras, gradientes, ou mais de duas variantes lado a lado.
