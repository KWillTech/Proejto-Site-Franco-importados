# Loja Franco Importados — desenho

Data: 2026-10-11

Neste documento, o que está marcado **(decisão do cliente)** foi dito por ele. O que está marcado **(escolha minha)** é um padrão que adotei sem ele ter pedido; pode ser revisto.

## Por que isso existe

A Franco Importados vende eletrônicos e perfumes importados no atacado e no varejo. Hoje muitos clientes chamam no WhatsApp só para perguntar preço. O site deve mostrar o catálogo com os dois preços, deixar o cliente montar o pedido sozinho e entregar esse pedido pronto no WhatsApp da loja.

**Sucesso para o cliente: mais pedidos fechados.**

## O que é

Uma loja virtual sem pagamento. O cliente navega, monta o carrinho e clica em "Enviar pedido"; o site abre o WhatsApp da loja com a mensagem do pedido já escrita. Pagamento, frete e entrega são combinados na conversa.

Dois públicos usam o site:

- **Cliente:** varejo ou revenda. Sem cadastro e sem login.
- **Administração:** a dona da loja e o desenvolvedor, por um painel com login.

## Objetivos

- Mostrar todo o catálogo com preço de varejo e preço de atacado.
- Aplicar o preço de atacado automaticamente quando o pedido atinge o mínimo.
- Entregar o pedido no WhatsApp de forma que a dona não precise perguntar nada sobre os itens.
- A dona mantém a loja sozinha, sem chamar o desenvolvedor.
- Aparência de loja de alto padrão.

## Fora do escopo

- Pagamento online, cálculo de frete, emissão de nota.
- Conta de cliente, histórico de pedidos, lista de desejos.
- Controle de quantidade em estoque (só existe disponível ou esgotado).
- Blog, avaliações, newsletter, cupons.

## O que seria fracasso mesmo funcionando

- O cliente ainda precisar perguntar preço no WhatsApp.
- A dona depender do desenvolvedor para trocar produto, preço, banner ou número do WhatsApp.
- Visual genérico, vazio ou "branco demais". Duas propostas foram recusadas por isso.
- A logo da Franco ausente ou redesenhada.

## Visual

**(decisão do cliente)** O site segue o modelo da PMG Imports (https://pmgimports.com.br/): mesma estrutura, proporções e estilo, com a marca e os produtos da Franco. O cliente recusou três interpretações livres e aprovou a réplica fiel.

A referência aprovada é `docs/superpowers/specs/assets/home-mockup.html`. Abra no navegador em tela larga e em tela de celular; ela vale mais que a descrição abaixo.

Medidas tiradas do site de referência:

| Item | Valor |
|---|---|
| Fonte | Montserrat (400, 500, 700) |
| Cor principal (navy) | `#0e1733` |
| Texto secundário | `#95a5a6` |
| Preço | `#0f6e56`, 16px, peso 700 |
| Fundo da faixa de benefícios | `rgba(149,165,166,.1)` |
| Fundo do rodapé | `#ecf0f1` |
| Dourado das tags dos banners | `#d8b26a` (aproximado a olho) |
| Largura máxima do conteúdo | 1300px |
| Cartões e banners | raio de 20px |
| Cartão de produto | barra navy de 4px entre a foto e o texto |
| Botões | pílula (raio 40px), 10px, peso 700, caixa alta, espaçamento 1px |
| Títulos de seção | 34px, peso 700, navy, centralizados |
| Troca para o layout de celular | abaixo de 768px |

Estrutura da home, de cima para baixo:

1. Faixa navy com um aviso curto.
2. Cabeçalho: logo à esquerda, busca no centro, atalhos à direita, menu de categorias embaixo. No celular: botão de menu, logo no centro, carrinho, busca na linha de baixo.
3. Banner rotativo em largura total, com setas e marcadores.
4. Faixa cinza com quatro benefícios (ícone circular e texto).
5. Três cartões de categoria: fundo navy, título, tag dourada, imagem e chamada "Conheça todos…".
6. "Lançamentos": grade dos produtos em destaque, 4 por linha em tela larga e 2 no celular.
7. Rodapé cinza em colunas.
8. Botão flutuante do WhatsApp.

**Logo:** usar `design-system/assets/Logos/franco-logo-preto.png` em fundo claro e `franco-logo-branco.png` em fundo escuro. Não redesenhar nem recolorir.

**Sobre a pasta `design-system/`:** ela descreve uma identidade em preto e branco com as fontes Bodoni Moda e Jost. O cliente decidiu trocar essa direção pelo modelo da PMG. Da pasta, só a logo continua valendo. **(escolha minha)** Atualizar tokens e README da pasta para o novo padrão faz parte do trabalho, para não haver duas fontes de verdade.

**Copiar o estilo, não o conteúdo.** Não usar fotos, textos, logo ou nome da PMG. Enquanto não houver fotos reais, usar imagens de exemplo próprias.

**(escolha minha)** O celular é a tela principal: a maioria dos clientes chega pelo WhatsApp.

## Vitrine

### Páginas

- **Home**, como descrita acima.
- **Categoria:** grade de produtos da categoria.
- **Busca:** resultados por nome do produto.
- **Produto:** fotos, nome, descrição, escolha de variações, os dois preços, quantidade e botão de comprar.
- **Carrinho:** itens, quantidades, total e envio do pedido.

### Cartão de produto

Foto, nome, preço e os botões "Comprar" e "Espiar". Selos opcionais no canto da foto.

- **(escolha minha)** "Espiar" abre uma visualização rápida do produto sem sair da página.
- **(escolha minha)** Em produto com variações, "Comprar" leva à escolha da variação antes de adicionar; o cartão mostra "a partir de" com o menor preço.
- Produto esgotado continua aparecendo, marcado como esgotado e sem botão de comprar. **(escolha minha)**

### Varejo e atacado

- **(decisão do cliente)** Cada produto tem preço de varejo e preço de atacado.
- **(decisão do cliente)** O atacado vale quando o carrinho soma **10 peças ou mais no total**, misturando produtos. Abaixo disso vale o varejo.
- Ao atingir 10 peças, todos os itens do carrinho passam para o preço de atacado. Se o cliente voltar para menos de 10, todos voltam ao varejo.
- A vitrine tem um seletor Varejo / Atacado que só troca a tabela exibida, para consulta. Não muda o que é cobrado no carrinho. **(escolha minha: fica logo abaixo do título "Lançamentos" e no topo das páginas de categoria e busca.)**
- **(decisão do cliente)** O carrinho avisa quantas peças faltam para o atacado, por exemplo "Faltam 3 peças para o preço de atacado".
- **(escolha minha)** O mínimo de 10 fica num único lugar da configuração, para mudar sem mexer em várias telas.

### Pix e parcelamento

- **(decisão do cliente)** A loja dá desconto no Pix e parcela no cartão. Os dois são definidos **no cadastro de cada produto**: percentual de desconto no Pix e número de parcelas.
- Como no mockup, o cartão e a página do produto mostram o preço com Pix em destaque ("R$ … com Pix") e o parcelamento embaixo ("em até Nx", sem valor de parcela).
- **(escolha minha)** Os dois campos são por produto, não por variação, e são opcionais: sem percentual de Pix, o destaque é o preço normal; sem parcelas, a linha de parcelamento não aparece.
- **(escolha minha)** O desconto do Pix vale sobre o preço em vigor, seja varejo ou atacado. O parcelamento vale sobre o preço sem desconto; juros do parcelamento: consulte o vendedor.
- **(escolha minha)** O carrinho e a mensagem do WhatsApp mostram o total normal e o total no Pix. **(decisão do cliente, 2026-10-17)** O cliente escolhe a forma de pagamento (Pix, Crédito, Débito, Boleto; no crédito e no boleto, o número de parcelas até o menor limite dos produtos, com o aviso "Juros do parcelamento: consulte o vendedor.") e ela vai na mensagem. A cobrança continua na conversa.
- **(escolha minha)** Como o percentual varia por produto, a faixa de benefícios diz "Desconto no Pix" sem citar número. O texto da faixa do topo é da dona, editável no painel.

### Variações

- **(decisão do cliente)** Um produto é cadastrado uma vez e o cliente escolhe as variações (cor, armazenamento, tamanho do frasco).
- **(escolha minha)** Cada combinação tem seu próprio preço de varejo, preço de atacado e situação (disponível ou esgotado). Um iPhone de 512GB custa mais que o de 256GB.
- Produto sem variação tem um único par de preços.
- Para a regra das 10 peças, cada unidade conta como uma peça, de qualquer produto ou variação.

### Carrinho e envio do pedido

- **(decisão do cliente)** Não há pagamento no site. O carrinho termina no botão "Enviar pedido", que abre o WhatsApp da loja com a mensagem pronta.
- **(decisão do cliente)** A mensagem informa se o pedido saiu como varejo ou atacado.
- **(escolha minha)** Antes de enviar, o site pede nome e cidade do cliente. Nada além disso.
- **(escolha minha)** O carrinho fica guardado no navegador do cliente e sobrevive a fechar a página.
- **(escolha minha)** O pedido não é gravado no site; o registro é a conversa no WhatsApp.
- **(escolha minha)** Depois de enviar, o carrinho é mantido até o cliente esvaziar, para o caso de o WhatsApp não abrir.

Formato da mensagem **(escolha minha)**:

```
Olá! Quero fazer um pedido pelo site.

Nome: Maria Souza
Cidade: Goiânia - GO
Tipo: ATACADO (12 peças)

1. iPhone 17 Pro — Azul, 256GB
   2 x R$ 8.990,00 = R$ 17.980,00
2. Lattafa Khamrah EDP 100ml
   10 x R$ 219,90 = R$ 2.199,00

Total: R$ 20.179,00
Total no Pix: R$ 18.161,10
```

### Atalhos do cabeçalho

**(escolha minha)** Como não existe conta de cliente, "Minha conta" sai. "Atendimento" abre o WhatsApp da loja. "Meu carrinho" mostra a contagem de peças.

### Menu e categorias

**(escolha minha)** O menu é "Início" (link fixo para a home) seguido das categorias cadastradas no painel. O item "Atacado" do mockup era só exemplo e não existe como página.

**(escolha minha)** As categorias têm um nível só, como no mockup: iPhone, MacBook, PlayStation, Xiaomi, Perfumes árabes, Perfumes importados. Não há grupos pai como "Eletrônicos" com submenu.

### Medição

**(escolha minha)** A primeira versão não registra cliques nem pedidos e não usa ferramenta de estatísticas. A dona acompanha o resultado pelos pedidos que chegam no WhatsApp.

## Painel administrativo

**(decisão do cliente)** A dona gerencia a loja pelo painel.

- **Acesso:** duas contas, a da dona e a do desenvolvedor, com os mesmos poderes. Não há cadastro público; as contas são criadas pelo desenvolvedor. **(escolha minha)**
- **Produtos:** criar, editar e excluir. Campos: nome, categoria, descrição, fotos, variações, preço de varejo e de atacado, percentual de desconto no Pix, número de parcelas, selo opcional.
- **Destaque:** marcador por produto. Os marcados aparecem em "Lançamentos" na home. **(decisão do cliente)**
- **Disponível / esgotado:** por produto e por variação, para tirar de venda sem apagar. **(decisão do cliente)**
- **Banners do topo:** adicionar, trocar imagem (uma para tela larga, uma para celular), definir link e ordem. **(decisão do cliente)**
- **Categorias do menu:** criar, renomear, ordenar e ocultar. **(decisão do cliente)**
- **Número do WhatsApp** que recebe os pedidos. **(decisão do cliente)**
- **(escolha minha)** O texto da faixa do topo também é editável. Os três cartões de categoria da home são escolhidos entre as categorias, cada uma com sua imagem. A faixa de benefícios e o rodapé ficam fixos no código.
- **(escolha minha)** O painel é simples e funcional; não precisa seguir o visual da vitrine. Deve funcionar bem no celular, porque a dona provavelmente vai usá-lo por lá.

## Catálogo inicial

**(decisão do cliente)** O catálogo real ainda não está organizado. O site nasce com produtos e valores fictícios, claramente substituíveis pelo painel:

- Eletrônicos: iPhone, MacBook, PlayStation 5, Xiaomi.
- Perfumes: importados e árabes.

O número do WhatsApp começa com um valor provisório, trocado depois pelo painel.

## Como é feito

**(decisão do cliente, sobre recomendação minha)**

- **Next.js** para a vitrine e o painel no mesmo projeto.
- **Banco Postgres** para produtos, categorias, banners e configurações.
- **Hospedagem na Vercel**, começando no plano gratuito.

**(escolha minha)** Usar **Supabase** para banco, login do painel e armazenamento das fotos, por resolver as três coisas num serviço só com plano gratuito.

Requisitos que não são opcionais:

- Só as duas contas do painel alteram dados. A vitrine apenas lê.
- A regra de preço (varejo ou atacado conforme o total de peças, desconto do Pix e parcelas) tem uma única implementação, usada no carrinho e na mensagem, com testes automáticos.
- As páginas da vitrine carregam rápido no celular e são encontráveis no Google (título, descrição e imagem por produto).

## Deixado para quem constrói

- Organização do código, modelo exato das tabelas e bibliotecas auxiliares.
- Layout das páginas de produto, categoria, busca e carrinho, seguindo o estilo do mockup da home e as páginas equivalentes do site de referência.
- Layout do painel.
- Tamanhos e tratamento das imagens enviadas.
- Textos de apoio (mensagens de erro, estados vazios), em português do Brasil, tratando o cliente por "você".
