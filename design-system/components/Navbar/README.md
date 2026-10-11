# Navbar

Cabeçalho do site: faixa de anúncio preta opcional, links à esquerda, logotipo centralizada e ações (busca, conta, sacola) à direita.

**O consumidor fornece:** `links` (até 5 categorias), `cartCount`, `announcement` (uma frase), callbacks `onSearch`/`onAccount`/`onCart`/`onMenu` e, se hospedar a logo em outro lugar, `logoSrc` (preta) e `logoSrcInverse` (branca).

- A logotipo troca sozinha para a versão branca no tema escuro.
- Abaixo de 760px os links somem e aparece o botão de menu; a logo desce para 36px.
- Fixe no topo ao rolar com `shadow-sm`.
