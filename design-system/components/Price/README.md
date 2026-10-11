# Price

Bloco de preço em reais (formato pt-BR, algarismos tabulares) com preço "de", parcelamento e Pix opcionais.

**O consumidor fornece:** `value` (número em reais), e opcionalmente `compareAt`, `installments`, `pix` (%), `size`.

- Com `compareAt` maior que `value`, o preço antigo aparece riscado em `ink-subtle` e o atual em `sale`.
- Mostre o parcelamento sempre que existir; "sem juros" é o padrão do texto.
- Nunca escreva preços à mão: use `Franco.formatBRL()` para manter "R$ 1.299,90".
