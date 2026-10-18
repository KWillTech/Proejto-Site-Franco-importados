# Preço pelo dólar — desenho

Data: 2026-10-18 · Branch: `feat/loja`

## Intenção

O dono compra em dólar no fornecedor e vende em reais. Hoje o preço em reais é digitado à mão em cada
variação e fica defasado quando o dólar muda. Ele quer que o site busque o dólar do dia sozinho e
recalcule o preço de todos os produtos, sem reajuste manual.

## Regra de preço (decidida pelo dono)

```
preço de venda (R$) = custo (US$) × dólar do dia + margem (R$)
```

- **Custo em US$:** por variação, editável.
- **Margem:** valor fixo em reais, por variação, editável. Não é porcentagem.
- **Atacado = varejo:** os dois recebem o mesmo valor calculado, por enquanto.
- **Todos os produtos** passam a ser calculados assim, sem exceção.

## Comportamento

1. **Cotação diária automática.** Uma vez por dia o site busca o dólar comercial (venda), grava a
   cotação com data e hora e recalcula o preço de todas as variações que têm custo.
2. **Variação sem custo (ou sem margem) sai da vitrine.** Decisão do dono: "melhor não estar na vitrine do que estar
   com preço errado". Um produto sem nenhuma variação com custo some da vitrine: listagens, busca,
   página do produto e sitemap. Quando o custo for preenchido, o produto volta sozinho, sem nenhum
   passo manual.
3. **Aba "Cálculo" no painel**, entre Banners e Configurações. O esboço aprovado está em
   `.superpowers/brainstorm/1573-1792354013/content/calculo-v3.html`.
   - **Topo:** a cotação usada, com data e hora da última atualização.
   - **Busca:** um campo que filtra a tabela pelo nome do produto (pedido do dono).
   - **Tabela:** uma linha por variação, com Produto, Variação, Custo (US$), Margem (R$) e Preço de
     venda (R$). O preço de venda é recalculado na tela enquanto se digita, com a cotação atual.
   - **Destaque:** linhas sem custo aparecem em destaque, como "fora da vitrine".
   - **Salvar alterações:** grava custo e margem e recalcula os preços na hora com a cotação gravada.
4. **Cadastro de produto (aba Produtos).** O preço deixa de ser digitado ali, porque agora vem da aba
   Cálculo. Uma variação nova nasce sem custo, portanto fora da vitrine, até ser preenchida no Cálculo.

## Fora do escopo

- **Botão "Atualizar agora":** o dono aceitou cortar. Se a busca da cotação falhar, os preços ficam
  com a última cotação boa.
- **Histórico de cotações, margem em %, atacado com preço diferente e arredondamento "comercial"**
  (por exemplo, terminar em ,90).

## Anti-objetivos (o que seria fracasso mesmo funcionando)

- Produto na vitrine com preço calculado a partir de cotação inválida (zero, vazia ou absurda).
  Nesse caso, mantenha a cotação anterior e não recalcule.
- Qualquer pessoa na internet conseguir disparar a atualização ou alterar a cotação.
- Carrinho já montado pelo cliente mostrando preço velho sem aviso. O mecanismo já existe:
  `priceChanged` em `src/lib/cart.ts`, que só precisa continuar funcionando.

## Restrições

- **Stack:** Next.js 16 + Supabase, hospedado na Vercel no plano gratuito. No plano gratuito o
  agendamento (Vercel Cron) roda no máximo uma vez por dia, e o horário não é exato.
- **Preços em centavos:** o sistema guarda `variants.retail_cents` e `wholesale_cents` como inteiros.
  O carrinho, o resumo do pedido e a mensagem do WhatsApp leem esses campos e devem continuar assim.
- **Cache da vitrine:** a vitrine usa cache invalidado com `revalidatePath`. Depois de recalcular,
  invalide o cache para a vitrine mostrar os preços novos.
- **Migrações:** são SQL rodado à mão no SQL Editor do Supabase (`supabase/migrations/000N_*.sql`),
  no estilo das existentes, com comentário de como rodar e verificar.
- **Segurança:** a escrita no banco segue as políticas de RLS da `0002_admins.sql`. Só admin edita
  pelo painel.

## Escolhas minhas (não decididas pelo dono; o builder pode rever)

- **Fonte da cotação:** AwesomeAPI (`https://economia.awesomeapi.com.br/json/last/USD-BRL`), campo
  `ask` (dólar comercial, venda). É gratuita e não pede chave.
- **Horário:** cron diário às 09:00 UTC (06:00 de Brasília).
- **Onde ficam os dados:** custo e margem são dados comerciais sigilosos e **não podem** ir para
  `variants`, porque `variants` é lida pela chave anon (`0001_init.sql`). Eles ficam numa tabela nova,
  só de admin, com RLS própria, uma linha por variação. O custo é guardado em centavos de dólar e a
  margem em centavos de real, ambos inteiros e nulos enquanto não preenchidos. A cotação, com data e
  hora, vira colunas em `settings`, que já é uma linha única e pública. A cotação pode ser pública.
- **Visibilidade:** a variação só aparece na vitrine com **custo e margem** preenchidos. Margem zero
  digitada é válida. Margem vazia não é.
- **Primeira cotação:** se ainda não existir cotação gravada, o "Salvar" do Cálculo busca uma na hora,
  pela mesma rotina do cron. Assim o dono não espera o primeiro cron para usar a aba.
- **Credenciais:** a rota do cron usa `SUPABASE_SERVICE_ROLE_KEY`, só no servidor, e confere
  `CRON_SECRET`. O dono cadastra as duas variáveis na Vercel, e o `.env.example` passa a listá-las.
- **Onde fica o preço calculado:** o preço é calculado e gravado em `retail_cents` e `wholesale_cents`,
  em vez de ser calculado na leitura. Assim nada que lê preço precisa mudar.
- **Arredondamento:** para o centavo mais próximo.
- **Cotação plausível:** só é aceita entre R$ 1 e R$ 20. Fora disso, é ignorada e o erro vai para o log.

## Deixado para o builder

- **Como esconder variações sem custo:** filtro na consulta, no mapeamento em `src/lib/data.ts` ou
  outro meio, desde que nenhuma tela da vitrine mostre preço sem custo.
- **Recálculo:** se fica numa função SQL única (chamada pelo cron e pelo "Salvar") ou no app.
- **Migração dos produtos existentes:** custo e margem começam nulos. Ao rodar a migração, todo o
  catálogo sai da vitrine até ser preenchido no Cálculo. O dono escolheu isso, mas o comentário da
  migração precisa avisar em letras claras.
- **Layout fino da aba**, seguindo `admin.module.css` e os componentes de admin existentes.
