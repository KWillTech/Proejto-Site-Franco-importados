# ProductCard

Cartão de produto para vitrines e listagens: imagem 4:5 sobre `surface`, marca/origem em caixa alta, nome em até 2 linhas e preço.

**O consumidor fornece:** `name`, `price`, e opcionalmente `brand` (marca ou origem), `image` (+ `imageAlt`), `href`, `compareAt`, `installments`, `badge`/`badgeTone`, `favorite`/`onFavorite`, `onAdd`.

- Imagens de produto em fundo neutro claro, recortadas em 4:5, sem bordas nem sombras. Sem imagem, o cartão mostra o monograma "FR" em `speckle`.
- Grade: 2 colunas no celular, 3 no tablet, 4 no desktop, com `space-6` de espaço.
- Desconto vira selo `sale` "-N%" automaticamente; não combine com outro selo.
- Mostre `onAdd` (botão secundário) só em listagens onde a compra rápida faz sentido.
