// Coleta única de produtos da Shopping China -> scripts/importar/saida/produtos.json
// Uso: node scripts/importar/coletar.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const BASE = 'https://www.shoppingchina.com.py';
const LISTAGENS = [
  '/electronicos/celulares',
  '/informatica/notebooks',
  '/electronicos/smart-watch',
  '/informatica/macbook',
  '/informatica/tablet', // iPads (mistura marcas e acessórios; o filtro resolve)
  '/informatica/ipad-acc-apple', // só traz o Mac mini; o resto é acessório
  '/electronicos/auriculares', // AirPods
];

const PERFUMARIAS = {
  '/perfumeria/perfume-masculino': 'perfumes-arabes-masculino',
  '/perfumeria/perfume-femenino': 'perfumes-arabes-feminino',
  '/perfumeria/perfume-unisex': 'perfumes-arabes-unissex',
};
const MARCAS_PERFUME = {
  Lattafa: /\bLATTAFA\b/, Afnan: /\bAFNAN\b/, Armaf: /\bARMAF\b/, 'Al Haramain': /\bAL ?HARAMAIN\b/,
  'Maison Alhambra': /\bMAISON AL ?HAMBRA\b/, Rasasi: /\bRASASI\b/, Ajmal: /\bAJMAL\b/,
  'Al Wataniah': /\bAL ?WATANIAH\b/, Dior: /\bDIOR\b/, Chanel: /\bCHANEL\b/,
  'Paco Rabanne': /\bRABANNE\b/, 'Carolina Herrera': /\bCAROLINA HERRERA\b/, Azzaro: /\bAZZARO\b/,
  Armani: /\bARMANI\b/, Versace: /\bVERSACE\b/, 'Jean Paul Gaultier': /\b(JEAN PAUL )?GAULTIER\b/,
  'Calvin Klein': /\bCALVIN KLEIN\b/, 'Hugo Boss': /\b(HUGO )?BOSS\b/, Lancôme: /\bLANCOME\b/,
  YSL: /\b(YVES SAINT LAURENT|SAINT LAURENT|YSL)\b/, Prada: /\bPRADA\b/,
  'Dolce & Gabbana': /\b(DOLCE ?(&|AND|Y)? ?GABBANA|D ?& ?G)\b/, Givenchy: /\bGIVENCHY\b/,
  Valentino: /\bVALENTINO\b/, Montblanc: /\bMONT ?BLANC\b/, 'Ralph Lauren': /\bRALPH LAUREN\b/,
  Burberry: /\bBURBERRY\b/, Mugler: /\bMUGLER\b/,
};
const NAO_PERFUME = /\b(TESTER|KIT|SET|MINI|MINIATURA|ESTUCHE|DESODORANTE|DEO|BODY|MIST|SOLIDO)\b/;
const CONCENTRACOES = [
  ['EXTRAIT DE PARFUM', 'Extrait de Parfum'], ['EAU DE PARFUM', 'Eau de Parfum'], ['EAU DE TOILETTE', 'Eau de Toilette'],
  ['EAU DE COLOGNE', 'Eau de Cologne'], ['EDP', 'Eau de Parfum'], ['EDT', 'Eau de Toilette'],
  ['EDC', 'Eau de Cologne'], ['EXTRAIT', 'Extrait de Parfum'], ['PARFUM', 'Parfum'],
];

const CORES = {
  'SPACE BLACK': 'Preto-espacial', 'SPACE GRAY': 'Cinza-espacial', 'SPACE GREY': 'Cinza-espacial',
  'SKY BLUE': 'Azul-céu', 'DEEP BLUE': 'Azul-profundo', 'COSMIC ORANGE': 'Laranja-cósmico',
  'COSMIC WHITE': 'Branco-cósmico', 'MOONLIGHT BLUE': 'Azul-luar', 'MIST BLUE': 'Azul-névoa',
  MIDNIGHT: 'Meia-noite', STARLIGHT: 'Estelar', NATURAL: 'Natural', DESERT: 'Deserto',
  BLACK: 'Preto', NEGRO: 'Preto', WHITE: 'Branco', BLANCO: 'Branco', BLUE: 'Azul', AZUL: 'Azul',
  GRAY: 'Cinza', GREY: 'Cinza', GRIS: 'Cinza', GREEN: 'Verde', VERDE: 'Verde', PINK: 'Rosa',
  ROSA: 'Rosa', PURPLE: 'Roxo', MORADO: 'Roxo', VIOLET: 'Violeta', VIOLETA: 'Violeta',
  RED: 'Vermelho', ROJO: 'Vermelho', GOLD: 'Dourado', DORADO: 'Dourado', SILVER: 'Prateado',
  PLATA: 'Prateado', ORANGE: 'Laranja', YELLOW: 'Amarelo', LAVENDER: 'Lavanda',
  BURGUNDY: 'Burgundy', GLACIER: 'Glacier', CITRUS: 'Citrus', INDIGO: 'Indigo', BLUSH: 'Blush',
  'GLACIER BLUE': 'Azul-glacial', 'INDIAN RED': 'Vermelho', 'MINT GREEN': 'Verde-menta',
  'MIDNIGHT BLACK': 'Preto-meia-noite', 'MOCHA BROWN': 'Marrom-mocha', 'TITAN GRAY': 'Cinza-titânio',
  'ARANDANO BLUE': 'Azul-arándano', 'BEACH GOLD': 'Dourado-areia', 'OBSIDIAN BLACK': 'Preto-obsidiana',
  'CLOUD WHITE': 'Branco-nuvem', 'BLUE SHADOW': 'Azul-sombra', 'ROSE GOLD': 'Ouro-rosa',
  'JET BLACK': 'Preto-brilhante', 'LIGHT GOLD': 'Dourado-claro', 'SILVER GRAY': 'Prateado-cinza',
  LAVANDER: 'Lavanda', GRAPHITE: 'Grafite', GRAFITI: 'Grafite', SAGE: 'Sálvia', TEAL: 'Verde-azulado',
  ULTRAMARINE: 'Ultramarino', CORAL: 'Coral', NARANJA: 'Laranja', ROSADO: 'Rosa', SATINADO: 'Satinado',
  KHAKI: 'Cáqui', MARRÓN: 'Marrom', MARRON: 'Marrom', SLATE: 'Ardósia', MOSS: 'Musgo',
  TITANIUM: 'Titânio', BEIGE: 'Bege', BROWN: 'Marrom', MINT: 'Menta', CREAM: 'Creme',
};
const RE_COR = new RegExp(`\\b(${Object.keys(CORES).sort((a, b) => b.length - a.length).join('|')})\\b`, 'g');
const MARCAS = { IPHONE: 'iPhone', IPAD: 'iPad', MACBOOK: 'MacBook', AIRPODS: 'AirPods', GALAXY: 'Galaxy' };
const SIGLAS = new Set(['RAM', 'ANC', 'GPS', 'LTE', 'SSD', 'USB', 'OLED', 'FE', 'AI', 'TV', 'NFC']);

// Só aparelhos: a 1ª palavra do título diz o tipo (capa, cabo, pulseira etc. ficam de fora).
export function categoria(titulo) {
  const t = titulo.toUpperCase();
  if (/\b(CPO|UPO|ASIS)\b/.test(t)) return null; // recondicionado/usado
  const tipo = t.split(/\s+/)[0];
  const tem = (re) => re.test(t);
  if (tipo === 'CELULAR') {
    if (tem(/\bIPHONE\b/)) return 'iphone-celulares';
    if (tem(/\bSAMSUNG\b/)) return 'xiaomi-samsung';
    if (tem(/\bMOTOROLA\b/)) return 'xiaomi-motorola';
    if (tem(/\bREALME\b/)) return 'xiaomi-realme';
    if (tem(/\b(XIAOMI|REDMI|POCO)\b/)) return 'xiaomi-celulares';
    return null;
  }
  if (tipo === 'SMARTWATCH') return tem(/\bAPPLE WATCH\b/) ? 'iphone-apple-watch' : 'xiaomi-smart-watch';
  if (tipo === 'AURICULAR') return tem(/\bAIRPODS\b/) ? 'iphone-airpods' : null;
  if (tipo === 'IPAD' || (tipo === 'TABLET' && tem(/\bAPPLE\b.*\bIPAD\b/))) return 'iphone-ipad';
  if (tipo === 'MACBOOK' || (tipo === 'APPLE' && tem(/\bMAC (MINI|STUDIO|PRO)\b|\bIMAC\b/))) return 'iphone-macbook';
  if (tipo === 'NOTEBOOK') return tem(/\b(SAMSUNG|DELL|ASUS|LENOVO)\b/) ? 'macbook' : null;
  return null;
}

const bonito = (p) =>
  MARCAS[p] ?? (SIGLAS.has(p) || /\d/.test(p) ? p : p[0] + p.slice(1).toLowerCase());

// Marca da lista (ou null) se for perfume de verdade: sem tester, kit, set, miniatura, desodorante.
export function marcaPerfume(titulo) {
  const t = titulo.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  if (NAO_PERFUME.test(t)) return null;
  return Object.entries(MARCAS_PERFUME).find(([, re]) => re.test(t))?.[0] ?? null;
}

export function parsePerfume(titulo) {
  let t = titulo.toUpperCase().replace(/\s+/g, ' ').replace(/^PERFUME\s+/, '');
  t = t.replace(/([A-Z])(\d+\s?ML?)\b/, '$1 $2'); // "EDP100ML" -> "EDP 100ML"
  const m = t.match(/\b(\d+)\s?ML?\b/); // alguns títulos trazem "100M"
  if (m) t = t.replace(m[0], '');
  let conc = '';
  for (const [chave, nome] of CONCENTRACOES) {
    const re = new RegExp(`\\b${chave}\\b`);
    if (re.test(t)) { conc = nome; t = t.replace(re, ''); break; }
  }
  const base = t.split(/\s+/).filter(Boolean).map(bonito).join(' ');
  return { model: [base, conc].filter(Boolean).join(' '), size: m ? m[1] + 'ml' : '' };
}

// shortcut: cor só vale se estiver na lista CORES (senão o anúncio não agrupa), ampliar a lista se sobrar produto solto.
export function parseTitulo(titulo) {
  let t = titulo.toUpperCase().replace(/\s+/g, ' ').trim();
  t = t.replace(/^(CELULAR|NOTEBOOK|SMARTWATCH|AURICULAR|TABLET)\s+/, '');
  t = t.replace(/\bAPPLE\s+(?!WATCH)/, '')
    // códigos de peça Apple (MGDR4LL/A, MKW4LL, MG474LLA, BE/A) variam por cor/armazenamento
    .replace(/\s*\b[A-Z0-9]*\d[A-Z0-9]*(LL|HN|LW|LS)(\s?\/\s?A|A)?\b/g, '').replace(/\s*\b[A-Z0-9]{4,8}\s?[-/]\s?A\b/g, '').replace(/\s*\bA\d{4}\b/g, '');
  // armazenamento = maior GB/TB do título (a RAM é sempre menor)
  let storage = '';
  let achado;
  let maior = 0;
  for (const m of t.matchAll(/\b(\d+)\s?(GB|TB)\b/g)) {
    const gb = Number(m[1]) * (m[2] === 'TB' ? 1024 : 1);
    if (gb > maior) [maior, achado, storage] = [gb, m, m[1] + m[2]];
  }
  if (achado) t = t.slice(0, achado.index) + t.slice(achado.index + achado[0].length);
  let color = '';
  const cores = [...t.matchAll(RE_COR)];
  if (cores.length) {
    const c = cores[cores.length - 1];
    color = CORES[c[1]];
    t = t.slice(0, c.index) + t.slice(c.index + c[0].length);
  }
  const model = t.split(/\s+/).filter(Boolean).map(bonito).join(' ');
  return { model, color, storage };
}

export function agrupar(anuncios) {
  const grupos = new Map();
  for (const a of anuncios) {
    const cat = a.cat ?? categoria(a.title); // perfume já chega com a categoria da listagem
    const { model, color = '', storage = '', size = '' } = a.cat ? parsePerfume(a.title) : parseTitulo(a.title);
    // quem não tem cor/armazenamento no título não se mistura com quem tem
    const chave = `${cat}|${model}|${color ? 1 : 0}${storage ? 1 : 0}${size ? 1 : 0}`;
    if (!grupos.has(chave)) grupos.set(chave, { cat, model, itens: [] });
    grupos.get(chave).itens.push({ ...a, color, storage, size });
  }
  return [...grupos.values()].map(({ cat, model, itens }) => {
    const variam = (campo) => new Set(itens.map((i) => i[campo])).size > 1;
    const campos = [['Cor', 'color'], ['Armazenamento', 'storage'], ['Tamanho', 'size']].filter(([, c]) => variam(c));
    const vistos = new Set();
    const variants = [];
    for (const i of itens) {
      const option_values = campos.map(([, c]) => i[c]);
      const k = option_values.join('|');
      if (vistos.has(k)) continue; // mesmo modelo/cor/armazenamento repetido: fica o primeiro
      vistos.add(k);
      variants.push({ option_values, cost_usd_cents: i.cents, source_url: i.url });
    }
    return {
      // perfume com um tamanho só: o tamanho vai no nome (padrão do site)
      name: itens[0].size && !campos.length ? `${model} ${itens[0].size}` : model,
      category_slug: cat,
      description_es: itens[0].description_es,
      description: '',
      option_names: campos.map(([n]) => n),
      images: [...new Set(itens.flatMap((i) => i.images))].slice(0, 8),
      variants,
    };
  });
}

// ---- rede (só roda ao executar o arquivo) ----
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function baixar(url) {
  for (let tent = 1; ; tent++) {
    await esperar(1500);
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' } });
    if (r.ok) return r.text();
    if ((r.status === 429 || r.status >= 500) && tent < 4) { await esperar(5000 * tent); continue; }
    throw new Error(`${r.status} ${url}`);
  }
}

const decodificar = (s) =>
  s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

function lerProduto(html, url) {
  // o <h1> vem cortado com "..."; o alt da 1ª foto traz o título inteiro
  const title = decodificar(html.match(/first-img" alt="([^"]*)"/)?.[1] ?? '').trim();
  const m = html.match(/U\$\s*([\d.]+),(\d{2})\s*TAX FREE/);
  const cents = m ? Number(m[1].replace(/\./g, '')) * 100 + Number(m[2]) : 0;
  const images = [...html.matchAll(/<img class="d-block w-100[^>]*?src="([^"]+)"/g)].map((x) => x[1]);
  const bloco = html.match(/<div class="trix-content">([\s\S]*?)<\/div>\s*<\/p>/)?.[1] ?? '';
  const description_es = decodificar(bloco.replace(/<\/div>|<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, ''))
    .split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
  return { title, url, cents, images, description_es };
}

// pagina cada listagem até não aparecer link novo; devolve Map url -> listagem
async function listar(listas) {
  const urls = new Map();
  for (const lista of listas) {
    for (let pag = 1; pag <= 80; pag++) {
      const html = await baixar(`${BASE}${lista}?page=${pag}`);
      const novos = new Set([...html.matchAll(/href="(\/producto\/[^"'+ ]+)"/g)].map((x) => x[1]).filter((u) => !urls.has(u)));
      for (const u of novos) urls.set(u, lista);
      console.log(`${lista} p${pag}: ${novos.size} novos`);
      if (!novos.size) break;
    }
  }
  return urls;
}

const slug = (u) => u.replace('/producto/', '').replace(/-\d+$/, '').replace(/-/g, ' ');

// baixa as páginas dos produtos que passam em `aceita(slug, listagem)`; `extra` junta campos ao anúncio
async function baixarProdutos(urls, aceita, valido, descartados, extra = () => ({})) {
  const aceitos = [...urls].filter(([u, lista]) => aceita(slug(u), lista));
  console.log(`${urls.size} links, ${aceitos.length} passam no filtro`);
  const anuncios = [];
  for (const [u, lista] of aceitos) {
    try {
      const a = lerProduto(await baixar(BASE + u), BASE + u);
      if (!a.title || !a.cents || !valido(a.title)) descartados.push(`${u} (${a.title} / ${a.cents})`);
      else anuncios.push({ ...a, ...extra(lista) });
    } catch (e) {
      descartados.push(`${u} (${e.message})`);
    }
  }
  return anuncios;
}

const saida = (nome) => new URL(`./saida/${nome}`, import.meta.url);

async function main() {
  mkdirSync(saida(''), { recursive: true });
  const descartados = [];
  // shortcut: eletrônicos vêm do cache anuncios.json (preços de quando foi coletado), apague o arquivo para recoletar tudo.
  let eletronicos;
  if (existsSync(saida('anuncios.json'))) {
    eletronicos = JSON.parse(readFileSync(saida('anuncios.json'), 'utf8'));
  } else {
    eletronicos = await baixarProdutos(await listar(LISTAGENS), (s) => categoria(s), categoria, descartados);
    writeFileSync(saida('anuncios.json'), JSON.stringify(eletronicos));
  }
  // o cache guarda tudo que passou na marca; recondicionados saem aqui
  const usados = eletronicos.filter((a) => !categoria(a.title));
  descartados.push(...usados.map((a) => `${a.url} (${a.title}: recondicionado/usado)`));
  eletronicos = eletronicos.filter((a) => categoria(a.title));

  const perfumes = await baixarProdutos(
    await listar(Object.keys(PERFUMARIAS)),
    (s) => marcaPerfume(s),
    marcaPerfume,
    descartados,
    (lista) => ({ cat: PERFUMARIAS[lista] }),
  );
  writeFileSync(saida('anuncios-perfumes.json'), JSON.stringify(perfumes));

  const produtos = agrupar([...eletronicos, ...perfumes]);
  writeFileSync(saida('produtos.json'), JSON.stringify(produtos, null, 2));
  writeFileSync(saida('descartados.txt'), descartados.join('\n'));
  console.log(`${eletronicos.length + perfumes.length} anúncios -> ${produtos.length} produtos; ${descartados.length} descartados`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
