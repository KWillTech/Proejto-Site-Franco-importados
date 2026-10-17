# Subcategorias no menu — desenho

## Intenção

A barra de categorias da vitrine hoje é plana (Início, iPhone, MacBook, PlayStation, Xiaomi, Perfumes árabes, Perfumes importados). A loja quer agrupar por marca/tipo: "Apple" com Celulares, MacBook, Acessórios; "Perfumaria" com Masculino, Feminino. A dona precisa criar e reorganizar esses grupos sozinha pelo painel.

Cada modelo (ex.: "iPhone 17 Pro Max") é **um único produto**, com cor e armazenamento nas variações, como hoje. Por isso não há filtro por modelo: a grade da subcategoria já é a lista de modelos, e a busca do topo acha pelo nome.

## Objetivos

- Categoria pode ter uma categoria mãe (dois níveis no máximo).
- Barra da vitrine mostra só as principais; passar o mouse (ou foco pelo teclado) abre as subcategorias.
- Página da principal lista os produtos dela e de todas as subcategorias, com filtro por subcategoria.
- Página da subcategoria lista só os produtos dela.
- Tudo mantido pelo painel, na tela de categorias que já existe.

## Fora do escopo

Filtro por modelo, terceiro nível, mudança nos cartões da home, tela nova no painel, migração automática das categorias atuais.

## Anti-objetivos

- Menu que só funciona com mouse (precisa funcionar no celular e com teclado).
- Página da principal vazia porque os produtos estão nas subcategorias.
- Dona conseguir montar uma árvore inválida (ciclo, terceiro nível) pelo painel.

## Restrições

As Global Constraints do plano `docs/superpowers/plans/2026-10-11-loja-franco-importados.md` continuam valendo (visual do mockup, celular primeiro em 390px e 1280px, vitrine nunca grava, só administrador grava, textos em pt-BR). Ponytail: reusar `data.ts`, `CategoriesManager`, `ProductGrid`, `Nav`, `MobileMenu`; nada de componente novo que um existente resolva.

## Banco

- Migration nova `supabase/migrations/0003_subcategorias.sql`, rodada pela pessoa no SQL Editor depois da 0002, idempotente como a 0002:
  - `categories.parent_id uuid null references public.categories(id) on delete restrict`.
  - Garantia no banco de **dois níveis no máximo** (a mãe precisa ter `parent_id` nulo, e uma categoria que já tem filhas não pode virar filha) e de que uma categoria não é mãe de si mesma. Trigger ou check — escolha do builder.
- As políticas de RLS da 0002 já cobrem `categories`; nada muda nelas.
- `on delete restrict` faz o banco recusar excluir mãe com filhas; o app mostra a mensagem antes.

## Painel (`/admin/categorias`)

- Categorias e subcategorias são criadas separadas: "Nova categoria" (sempre principal, sem campo de mãe; uma principal nunca vira subcategoria) e "Nova subcategoria" (campo obrigatório **"Categoria"**, só principais; editar uma subcategoria permite trocar de mãe).
- Slug da subcategoria nova = `<slug da mãe>-<nome>` (ex.: `xiaomi-celulares`); renomear ou trocar de mãe não muda o slug.
- `categorySchema` ganha `parentId` (uuid ou nulo); a action confere os dois níveis antes de gravar e devolve mensagem clara.
- Lista mostra as subcategorias recuadas sob a mãe. A ordem (subir/descer) vale entre irmãs: principais entre si, subcategorias dentro da mesma mãe. **(escolha minha)**
- Excluir principal com subcategorias → "Mova ou exclua as subcategorias antes." A regra atual de categoria com produtos continua.
- Cartão da home continua podendo ser qualquer categoria visível (sem mudança).
- No cadastro de produto, dois selects: **Categoria** (só principais) e **Subcategoria** (filhas da escolhida, com "— nenhuma"; desabilitado sem filhas). Trocar a categoria limpa a subcategoria. Grava-se um só `categoryId` (subcategoria, ou a principal se não houver).

## Vitrine

- **Menu (desktop):** só principais visíveis. Principal com subcategorias visíveis abre um painel com a lista ao passar o mouse e ao receber foco; o nome da principal continua sendo link para a página dela. Principal oculta esconde o grupo inteiro; subcategoria oculta some da lista. Visual a partir do mockup/`globals.css` (navy, Montserrat).
- **Menu (celular, `MobileMenu`):** cada principal seguida das subcategorias recuadas, todas como links.
- **Página da principal (`/categoria/[slug]`):** produtos dela + de todas as subcategorias visíveis. Acima da grade, botões "Todos · <subcategorias>" que filtram pelo parâmetro `?sub=<slug>` (link compartilhável; `sub` inválido = Todos). Sem subcategorias, não mostra os botões.
- **Página da subcategoria:** mesma rota `/categoria/[slug]`, só os produtos dela, sem botões. Título pode mostrar a mãe ("Apple › Celulares") — escolha do builder.
- Subcategoria cuja mãe está oculta → 404, como categoria oculta hoje.
- Sitemap e `generateStaticParams` passam a incluir as subcategorias visíveis.

## Dados existentes

As categorias atuais continuam como principais. A dona cria "Apple"/"Perfumaria" e cria as subcategorias pelo formulário "Nova subcategoria". O `seed.sql` pode ganhar um exemplo (ex.: "Apple" com iPhone e MacBook) para desenvolvimento — escolha do builder.

## Regras de borda (escolhas minhas, após o builder check)

- **Mãe oculta:** a herança vale só na leitura da vitrine. As filhas guardam o próprio `visible`; `data.ts` trata como oculta toda subcategoria cuja mãe está oculta (menu, sitemap, `generateStaticParams`, página da categoria). O painel não força nada; na lista, subcategoria sob mãe oculta mostra a etiqueta "oculta pela categoria mãe".
- **"Oculta" continua significando "fora do menu e da página da categoria"**, como hoje: busca, home e link direto do produto não mudam.
- **Principal com produtos diretos pode ganhar filhas.** A página dela mostra os produtos diretos + os das filhas visíveis; no filtro, "Todos" inclui os diretos.
- **Mover de mãe:** mudar `parentId` não mexe em `position`. A ordem é por `position` global filtrada entre irmãs; subir/descer troca a `position` com a irmã vizinha (mesma mãe). Categoria nova continua indo para o fim (comportamento atual).
- **Slug continua único na tabela inteira**, gerado como hoje (`uniqueSlug(slugify(nome))`); um segundo "Masculino" vira `masculino-2`. A rota segue `/categoria/[slug]`, sem a mãe no caminho.
- **Dois níveis no banco:** trigger (um `check` não enxerga a linha da mãe).

## Testes esperados

- Validação: `parentId` aceita nulo/uuid; regra de dois níveis na action.
- Leitura: montagem da árvore do menu a partir das linhas (ordem por `position`, ocultas fora) e produtos da principal incluindo os das subcategorias.
- Filtro `?sub=` na página da principal.
- O e2e `tests/e2e/pedido.spec.ts` continua passando.

## Deixado ao builder

Forma exata da checagem no banco, markup/ARIA do painel suspenso (desde que abra com mouse, foco e funcione sem JS para navegar), formato do título da subcategoria, exemplo no seed.
