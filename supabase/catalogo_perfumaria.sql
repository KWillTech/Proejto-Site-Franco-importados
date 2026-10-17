-- Catálogo de perfumaria: 31 perfumes do PDF "Catalogo_Perfumaria_clientes", cada um na subcategoria
-- Masculino / Feminino / Unissex de "Perfumaria" (slugs perfumes-arabes-masculino / -feminino / -unissex).
-- Rode inteiro no SQL Editor do Supabase, DEPOIS da 0003_subcategorias.sql.
-- ATENÇÃO: APAGA os 8 perfumes de exemplo (com variações e fotos deles, por cascade). Eletrônicos não são tocados.
-- Preço de varejo = atacado = preço "À VISTA (DINHEIRO/PIX)" do catálogo, em centavos. pix_percent fica nulo
-- (o à vista já é o preço, então a vitrine não mostra desconto no Pix) e o parcelamento é "em até 12x".
-- As fotos ficam em public/produtos e vão no deploy do app. A vitrine tem cache: pode levar até ~15 min
-- (ou um novo deploy) para mostrar os produtos.
-- Não rode duas vezes: o segundo insert falha por slug repetido e a transação desfaz tudo.

begin;

delete from public.products where name in (
  'Afnan 9PM EDP 100ml', 'Al Haramain Amber Oud Gold 120ml', 'Armaf Club de Nuit Intense 105ml',
  'Lattafa Asad EDP 100ml', 'Lattafa Khamrah EDP 100ml', 'Lattafa Yara EDP',
  'Maison Alhambra Jean Lowe 100ml', 'Rasasi Hawas for Him 100ml'
);

create temp table novos (cat_slug text, name text, slug text, description text, cents int) on commit drop;
insert into novos values
  ('perfumes-arabes-masculino', 'Afnan 9PM Eau de Parfum 100ml', 'afnan-9pm-eau-de-parfum-100ml', 'Perfume sedutor e altamente elogiado. Combina o frescor inicial da maçã e bergamota com uma base adocicada quente de baunilha, âmbar e fava tonka. Perfeito para festas, encontros e ocasiões noturnas.

Notas principais: Maçã verde, Lavanda, Canela, Baunilha, Âmbar e Flor de Laranjeira.', 22490),
  ('perfumes-arabes-masculino', 'Lattafa Asad Bourbon Eau de Parfum 100ml', 'lattafa-asad-bourbon-eau-de-parfum-100ml', 'Uma interpretação rica e licorosa da linha Asad. Apresenta notas quentes de café, fava tonka e bourbon combinadas com especiarias finas e fundo amadeirado intenso. Exala presença e elegância.

Notas principais: Pimenta preta, Café, Acordo Bourbon, Fava Tonka, Baunilha e Âmbar.', 32800),
  ('perfumes-arabes-unissex', 'Lattafa Bade''e Al Oud (Oud For Glory) EDP 100ml', 'lattafa-bade-e-al-oud-oud-for-glory-edp-100ml', 'O ápice da perfumaria árabe de luxo. Destaca-se pela fusão perfeita entre açafrão, noz-moscada e o valioso óleo de Oud (Agarwood), envolto em patchouli e almíscar. Fragrância de altíssima fixação.

Notas principais: Açafrão, Noz-moscada, Lavanda, Oud natural, Patchouli e Almíscar.', 18950),
  ('perfumes-arabes-unissex', 'Lattafa Khamrah Eau de Parfum 100ml', 'lattafa-khamrah-eau-de-parfum-100ml', 'Um dos maiores fenômenos mundiais da perfumaria. Traz uma mistura aconchegante de canela, noz-moscada e pralinê sobre uma base cremosa de baunilha e mirra. Lembra sobremesas finas e noites elegantes.

Notas principais: Canela, Noz-moscada, Bergamota, Pralinê, Tuberosa, Baunilha e Fava Tonka.', 28650),
  ('perfumes-arabes-feminino', 'Lattafa Yara Moi (Yara White) EDP 100ml', 'lattafa-yara-moi-yara-white-edp-100ml', 'Conhecido mundialmente como o Yara Branco. Combina notas suculentas de pêssego e jasmim com um toque caramelizado suave e base amadeirada. Feminino, marcante, sofisticado e muito acolhedor.

Notas principais: Pêssego, Jasmim, Caramelo, Âmbar, Patchouli e Sândalo.', 18600),
  ('perfumes-arabes-masculino', 'Paco Rabanne 1 Million Eau de Toilette 100ml', 'paco-rabanne-1-million-eau-de-toilette-100ml', 'O clássico frasco em lingote de ouro. Abre com o frescor da tangerina e hortelã, evoluindo para um coração pulsante de canela e rosa, finalizando com o couro e âmbar ketal. O aroma do homem audacioso.

Notas principais: Mandarina, Hortelã, Canela, Notas Especiadas, Couro e Âmbar.', 54800),
  ('perfumes-arabes-masculino', 'Paco Rabanne Invictus Aqua EDT 100ml', 'paco-rabanne-invictus-aqua-edt-100ml', 'Uma explosão de frescor oceânico e energia vibrante. Mistura notas marinhas geladas e toranja com a profundidade da madeira de âmbar e violeta. Ideal para o clima tropical, dias ensolarados e uso diário com distinção.

Notas principais: Notas Marítimas, Toranja, Folha de Violeta, Madeira de Âmbar e Âmbar Cinzento.', 68500),
  ('perfumes-arabes-masculino', 'Paco Rabanne Invictus Eau de Toilette 100ml', 'paco-rabanne-invictus-eau-de-toilette-100ml', 'O lendário frasco em formato de troféu. Representa o contraste revigorante entre o frescor oceânico e a sensualidade masculina do louro e musgo de carvalho. Campeão absoluto de elogios.

Notas principais: Notas Oceânicas, Toranja, Folha de Louro, Jasmim, Musgo de Carvalho e Âmbar Cinzento.', 59200),
  ('perfumes-arabes-masculino', 'Jacques Bogart Silver Scent M EDT 100ml', 'jacques-bogart-silver-scent-m-edt-100ml', 'Famoso por sua projeção avassaladora e rastro inconfundível. Une flor de laranjeira radiante e limão gelado com cardamomo, noz-moscada e um fundo amadeirado denso de fava tonka e teca.

Notas principais: Flor de Laranjeira, Limão, Cardamomo, Noz-moscada, Gerânio, Fava Tonka e Madeira Teca.', 21950),
  ('perfumes-arabes-masculino', 'Yves Saint Laurent MYSLF EDP 100ml', 'yves-saint-laurent-myslf-edp-100ml', 'A mais nova e cobiçada declaração de masculinidade moderna da YSL. Combina a leveza cítrica da bergamota da Calábria com flor de laranjeira pura e fundo de ambrofix limpo e amadeirado. Puro requinte.

Notas principais: Bergamota da Calábria, Flor de Laranjeira da Tunísia, Patchouli e Ambrofix.', 97900),
  ('perfumes-arabes-masculino', 'Police To Be Born To Shine For Man EDT 125ml', 'police-to-be-born-to-shine-for-man-edt-125ml', 'Apresentado no icônico frasco em formato de caveira dourada. Fragrância envolvente que mescla maçã suculenta, mandarina e canela com lavanda aromática e base ambarada refinada.

Notas principais: Maçã, Mandarina, Canela, Cardamomo, Lavanda, Âmbar e Couro.', 42240),
  ('perfumes-arabes-masculino', 'Armaf Club de Nuit Intense Man EDT 105ml', 'armaf-club-de-nuit-intense-man-edt-105ml', 'O perfume árabe mais vendido no mundo. Uma abertura fresca de limão e abacaxi defumado que evolui para um coração de bétula e jasmim, sobre uma base sensual de almíscar e âmbar gris. Fixação lendária.

Notas principais: Limão Siciliano, Abacaxi, Groselha Preta, Bétula, Jasmim, Almíscar e Âmbar Gris.', 29650),
  ('perfumes-arabes-masculino', 'Lattafa Asad Eau de Parfum 100ml', 'lattafa-asad-eau-de-parfum-100ml', 'A fragrância masculina mais aclamada da Lattafa. Combina pimenta preta, abacaxi e café torrado com âmbar doce, baunilha e madeiras nobres. Presença marcante com assinatura de alta perfumaria.

Notas principais: Pimenta Preta, Tabaco, Abacaxi, Patchouli, Café, Baunilha, Âmbar e Benjoim.', 23800),
  ('perfumes-arabes-feminino', 'Lattafa Yara Candy Eau de Parfum 100ml', 'lattafa-yara-candy-eau-de-parfum-100ml', 'O lançamento mais doce e alegre da linha Yara. Notas irresistíveis de tangerina verde e morango silvestre envoltos em doces de groselha e baunilha cremosa. Extremamente viciante e jovial.

Notas principais: Tangerina Verde, Morango, Balas Frutadas, Gardênia, Baunilha, Almíscar e Âmbar.', 23480),
  ('perfumes-arabes-feminino', 'Lattafa Yara Tous Eau de Parfum 100ml', 'lattafa-yara-tous-eau-de-parfum-100ml', 'O famoso Yara Amarelo. Um coquetel tropical cremoso que une manga madura, maracujá e leite de coco sobre flores brancas radiantes e um fundo aveludado de baunilha. Perfeito para o verão.

Notas principais: Manga, Maracujá, Leite de Coco, Jasmim, Flor de Laranjeira, Baunilha e Almíscar.', 18900),
  ('perfumes-arabes-feminino', 'Lattafa Mayar Eau de Parfum 100ml', 'lattafa-mayar-eau-de-parfum-100ml', 'Uma joia feminina árabe que combina lichia fresca e framboesa com a elegância da rosa de Damasco e peônia branca. Fragrância luminosa, fresca, romântica e com excelente durabilidade na pele.

Notas principais: Lichia, Framboesa, Folha de Violeta, Rosa Branca, Peônia, Jasmim e Almíscar.', 19500),
  ('perfumes-arabes-unissex', 'Lattafa Musamam White Intense EDP 100ml', 'lattafa-musamam-white-intense-edp-100ml', 'Apresentado em um dos frascos mais deslumbrantes da perfumaria mundial com tampa em serpente esculpida. Combina bergamota, especiarias frescas e âmbar suave com madeiras nobres e ylang-ylang.

Notas principais: Bergamota, Laranja Doce, Especiarias, Mahonial, Ylang-Ylang, Âmbar, Cedro e Benjoim.', 29900),
  ('perfumes-arabes-unissex', 'Xerjoff Erba Pura Eau de Parfum 100ml', 'xerjoff-erba-pura-eau-de-parfum-100ml', 'Uma das fragrâncias de nicho mais admiradas e luxuosas do planeta. Cítricos sicilianos brilhantes envolvidos por uma cesta de frutas exóticas sobre um manto celestial de almíscar branco e baunilha de Madagascar.

Notas principais: Laranja Siciliana, Bergamota da Calábria, Frutas Mediterrâneas, Almíscar Branco, Baunilha e Âmbar.', 149800),
  ('perfumes-arabes-masculino', 'Paco Rabanne Invictus Parfum 100ml', 'paco-rabanne-invictus-parfum-100ml', 'A mais poderosa concentração da linha Invictus. Notas frescas de lavanda aromática e pimenta rosa colidem com sabão preto de luxo e a riqueza esfumaçada do sândalo e resina de benjoim.

Notas principais: Lavanda, Pimenta Rosa, Notas Marinhas, Sabão Negro, Mirra, Sândalo e Benjoim.', 68500),
  ('perfumes-arabes-masculino', 'Paco Rabanne Invictus Victory Elixir Parfum 100ml', 'paco-rabanne-invictus-victory-elixir-parfum-100ml', 'A versão mais rica, misteriosa e elogiada da linha Invictus. Traz uma overdose de âmbar quente, fava tonka licorosa e incenso aromático com toque picante de cardamomo e baunilha refinada.

Notas principais: Cardamomo, Pimenta Preta, Incenso, Patchouli, Fava Tonka e Baunilha de Madagascar.', 84650),
  ('perfumes-arabes-masculino', 'Azzaro Pour Homme Eau de Toilette 100ml', 'azzaro-pour-homme-eau-de-toilette-100ml', 'O clássico supremo da elegância masculina. Uma composição atemporal com lavanda, anis estrelado, manjericão e musgo de carvalho com couro refinado. O perfume do homem sofisticado e autêntico.

Notas principais: Lavanda, Anis Estrelado, Manjericão, Cardamomo, Vetiver, Musgo de Carvalho e Couro.', 25950),
  ('perfumes-arabes-feminino', 'Paco Rabanne Olympéa Eau de Parfum 80ml', 'paco-rabanne-olympea-eau-de-parfum-80ml', 'O encontro divino entre a feminilidade das flores brancas e o magnetismo da baunilha salgada. Abre com mandarina verde e jasmim aquático, repousando em notas quentes de sândalo e âmbar cinzento.

Notas principais: Mandarina Verde, Jasmim Hidropônico, Flor de Gengibre, Baunilha Salgada, Âmbar Cinzento e Caxemira.', 66530),
  ('perfumes-arabes-feminino', 'Armaf Delights Yum Yum Eau de Parfum 100ml', 'armaf-delights-yum-yum-eau-de-parfum-100ml', 'Uma fragrância deliciosa e envolvente da conceituada casa Armaf. Combina notas efervescentes de frutas vermelhas, pistache e baunilha com marshmallows doces sobre uma base aveludada e cremosa.

Notas principais: Pistache Doce, Frutas Vermelhas, Creme Chantilly, Marshmallow, Baunilha e Fava Tonka.', 27600),
  ('perfumes-arabes-feminino', 'Carolina Herrera 212 VIP Rosé Elixir EDP 80ml', 'carolina-herrera-212-vip-rose-elixir-edp-80ml', 'Uma interpretação mais sensual e radiante do consagrado 212 VIP Rosé. Combina notas efervescentes de groselha preta e licor de mandarina com flores de pêssego e um fundo chipre sofisticado de patchouli.

Notas principais: Groselha Preta, Mandarina, Flor de Pêssego, Frésia, Baunilha Bourbon e Patchouli.', 74580),
  ('perfumes-arabes-masculino', 'Paco Rabanne 1 Million Parfum 100ml', 'paco-rabanne-1-million-parfum-100ml', 'A versão Parfum do ícone mundial. Um contraste fascinante entre a tuberosa solar salgada e o couro masculino aveludado com notas de pinho e âmbar cinzento. Uma fragrância opulenta que se destaca na multidão.

Notas principais: Tuberosa Solar, Sal Marinho, Pinho, Couro Aveludado, Óleo de Monoi e Âmbar Gris.', 72590),
  ('perfumes-arabes-masculino', 'Carolina Herrera 212 Men NYC EDT 200ml', 'carolina-herrera-212-men-nyc-edt-200ml', 'O frasco gigante de 200ml do perfume que captura o dinamismo e estilo de Manhattan. Traz folhas cítricas frescas, gengibre verde e pimenta suave com gardênia masculina, sândalo e incenso refinado.

Notas principais: Folhas Cítricas, Grama Cortada, Gengibre, Pimenta Verde, Gardênia, Sândalo, Incenso e Almíscar.', 79480),
  ('perfumes-arabes-feminino', 'Carolina Herrera Good Girl Eau de Parfum 80ml', 'carolina-herrera-good-girl-eau-de-parfum-80ml', 'O icônico perfume do salto agulha. Celebra a dualidade da mulher moderna através do contraste sublime entre o brilho da tuberosa e jasmim sambac com a intensidade misteriosa do cacau torrado e fava tonka.

Notas principais: Amêndoa, Café, Tuberosa, Jasmim Sambac, Fava Tonka, Cacau e Sândalo.', 74980),
  ('perfumes-arabes-feminino', 'Britney Spears Fantasy Eau de Parfum 100ml', 'britney-spears-fantasy-eau-de-parfum-100ml', 'Uma das fragrâncias femininas mais vendidas e queridas da história. Combina kiwi exótico e lichia com chocolate branco derretido, cupcake doce e orquídea sobre uma base almiscarada suave.

Notas principais: Kiwi, Lichia Vermelha, Cupcake, Chocolate Branco, Orquídea, Almíscar e Raiz de Íris.', 25400),
  ('perfumes-arabes-unissex', 'French Avenue Liquid Brun Eau de Parfum 100ml', 'french-avenue-liquid-brun-eau-de-parfum-100ml', 'Uma obra-prima da casa French Avenue (linha de luxo da Fragrance World). Fragrância quente, refinada e opulenta que mescla canela, cardamomo e flor de laranjeira com baunilha bourbon, pralinê e madeiras preciosas.

Notas principais: Canela, Cardamomo, Bergamota, Flor de Laranjeira, Pralinê, Baunilha Bourbon, Fava Tonka e Madeira Guaiac.', 29681),
  ('perfumes-arabes-masculino', 'Christian Dior Sauvage Eau de Toilette 100ml', 'christian-dior-sauvage-eau-de-toilette-100ml', 'Um dos maiores fenômenos da perfumaria mundial de todos os tempos. Abre com a explosão radiante da bergamota da Calábria e evolui com pimenta de Sichuan sobre uma trilha magnética de ambroxan puro.

Notas principais: Bergamota da Calábria, Pimenta de Sichuan, Lavanda, Pimenta Rosa, Vetiver, Patchouli e Ambroxan.', 86490),
  ('perfumes-arabes-masculino', 'Animale For Men (Eau de Toilette) 100ml', 'animale-for-men-eau-de-toilette-100ml', 'For Men conta com notas frescas tropicais, que se misturam com acordes especificados e notas sensuais de almíscar e madeiras exóticas. Desde 1993, é um perfume feito pela natureza para esbanjar sensualidade e masculinidade de forma sofisticada.

Notas principais: Limão, Néroli e Frésia.', 23800);

insert into public.products (category_id, name, slug, description, featured, available, pix_percent, installments, option_names)
select c.id, n.name, n.slug, n.description, false, true, null, 12, '{}'
from novos n join public.categories c on c.slug = n.cat_slug;

insert into public.variants (product_id, option_values, retail_cents, wholesale_cents, available, position)
select p.id, '{}', n.cents, n.cents, true, 0
from novos n join public.products p on p.slug = n.slug;

insert into public.product_images (product_id, url, position)
select p.id, v.url, v.position
from (values
  ('afnan-9pm-eau-de-parfum-100ml', '/produtos/afnan-9pm-eau-de-parfum-100ml.jpg', 0),
  ('lattafa-asad-bourbon-eau-de-parfum-100ml', '/produtos/lattafa-asad-bourbon-eau-de-parfum-100ml.jpg', 0),
  ('lattafa-bade-e-al-oud-oud-for-glory-edp-100ml', '/produtos/lattafa-bade-e-al-oud-oud-for-glory-edp-100ml.jpg', 0),
  ('lattafa-khamrah-eau-de-parfum-100ml', '/produtos/lattafa-khamrah-eau-de-parfum-100ml.jpg', 0),
  ('lattafa-yara-moi-yara-white-edp-100ml', '/produtos/lattafa-yara-moi-yara-white-edp-100ml.jpg', 0),
  ('paco-rabanne-1-million-eau-de-toilette-100ml', '/produtos/paco-rabanne-1-million-eau-de-toilette-100ml.jpg', 0),
  ('paco-rabanne-invictus-aqua-edt-100ml', '/produtos/paco-rabanne-invictus-aqua-edt-100ml.jpg', 0),
  ('paco-rabanne-invictus-eau-de-toilette-100ml', '/produtos/paco-rabanne-invictus-eau-de-toilette-100ml.jpg', 0),
  ('jacques-bogart-silver-scent-m-edt-100ml', '/produtos/jacques-bogart-silver-scent-m-edt-100ml.jpg', 0),
  ('yves-saint-laurent-myslf-edp-100ml', '/produtos/yves-saint-laurent-myslf-edp-100ml.jpg', 0),
  ('police-to-be-born-to-shine-for-man-edt-125ml', '/produtos/police-to-be-born-to-shine-for-man-edt-125ml.jpg', 0),
  ('armaf-club-de-nuit-intense-man-edt-105ml', '/produtos/armaf-club-de-nuit-intense-man-edt-105ml.jpg', 0),
  ('lattafa-asad-eau-de-parfum-100ml', '/produtos/lattafa-asad-eau-de-parfum-100ml.jpg', 0),
  ('lattafa-yara-candy-eau-de-parfum-100ml', '/produtos/lattafa-yara-candy-eau-de-parfum-100ml.jpg', 0),
  ('lattafa-yara-tous-eau-de-parfum-100ml', '/produtos/lattafa-yara-tous-eau-de-parfum-100ml.jpg', 0),
  ('lattafa-mayar-eau-de-parfum-100ml', '/produtos/lattafa-mayar-eau-de-parfum-100ml.jpg', 0),
  ('lattafa-musamam-white-intense-edp-100ml', '/produtos/lattafa-musamam-white-intense-edp-100ml.jpg', 0),
  ('xerjoff-erba-pura-eau-de-parfum-100ml', '/produtos/xerjoff-erba-pura-eau-de-parfum-100ml.jpg', 0),
  ('paco-rabanne-invictus-parfum-100ml', '/produtos/paco-rabanne-invictus-parfum-100ml.jpg', 0),
  ('paco-rabanne-invictus-victory-elixir-parfum-100ml', '/produtos/paco-rabanne-invictus-victory-elixir-parfum-100ml.jpg', 0),
  ('azzaro-pour-homme-eau-de-toilette-100ml', '/produtos/azzaro-pour-homme-eau-de-toilette-100ml.jpg', 0),
  ('paco-rabanne-olympea-eau-de-parfum-80ml', '/produtos/paco-rabanne-olympea-eau-de-parfum-80ml.jpg', 0),
  ('armaf-delights-yum-yum-eau-de-parfum-100ml', '/produtos/armaf-delights-yum-yum-eau-de-parfum-100ml.jpg', 0),
  ('carolina-herrera-212-vip-rose-elixir-edp-80ml', '/produtos/carolina-herrera-212-vip-rose-elixir-edp-80ml.jpg', 0),
  ('paco-rabanne-1-million-parfum-100ml', '/produtos/paco-rabanne-1-million-parfum-100ml.jpg', 0),
  ('carolina-herrera-212-men-nyc-edt-200ml', '/produtos/carolina-herrera-212-men-nyc-edt-200ml.jpg', 0),
  ('carolina-herrera-good-girl-eau-de-parfum-80ml', '/produtos/carolina-herrera-good-girl-eau-de-parfum-80ml.jpg', 0),
  ('britney-spears-fantasy-eau-de-parfum-100ml', '/produtos/britney-spears-fantasy-eau-de-parfum-100ml.jpg', 0),
  ('french-avenue-liquid-brun-eau-de-parfum-100ml', '/produtos/french-avenue-liquid-brun-eau-de-parfum-100ml.jpg', 0),
  ('christian-dior-sauvage-eau-de-toilette-100ml', '/produtos/christian-dior-sauvage-eau-de-toilette-100ml.jpg', 0),
  ('animale-for-men-eau-de-toilette-100ml', '/produtos/animale-for-men-eau-de-toilette-100ml.jpg', 0)
) as v(slug, url, position)
join public.products p on p.slug = v.slug;

-- Confere que as 3 subcategorias existem e os 31 entraram; se não, a transação inteira é desfeita.
do $$
begin
  if (select count(*) from public.products p join novos n on n.slug = p.slug) <> 31 then
    raise exception 'Esperava 31 produtos; confira se as subcategorias perfumes-arabes-* existem (rode a 0003).';
  end if;
end $$;

commit;
