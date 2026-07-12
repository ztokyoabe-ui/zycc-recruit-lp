import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = resolve(root, 'index.html');
const outputPath = resolve(root, 'assets/cache/works.json');
const jsOutputPath = resolve(root, 'assets/cache/works-cache.js');
const API_ROOT = 'https://zycc.jp/wp-json/wp/v2/posts';
const PER_PAGE = 50;
const TIMEOUT_MS = 15000;
const SCHEMA_VERSION = 5;

const html = await readFile(indexPath, 'utf8');
const staticWorks = JSON.parse(html.match(/const OFFICIAL_WORKS=(\[[\s\S]*?\]);/)?.[1] || '[]');

function strip(html = '') {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeHtml(value = '') {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&#038;/g, '&')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normTitle(title = '') {
  return strip(decodeHtml(title)).replace(/[\s　「」『』（）()・,，/&'’]/g, '').toLowerCase();
}

function pickSized(media, preferred = ['medium_large', 'large', 'full']) {
  const sizes = media?.media_details?.sizes || {};
  for (const key of preferred) {
    if (sizes[key]?.source_url) return decodeHtml(sizes[key].source_url);
  }
  return decodeHtml(media?.source_url || '');
}

function imagesFromContent(html = '') {
  const matches = [...String(html).matchAll(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/g)];
  return [...new Set(matches.map((m) => decodeHtml(m[1])).filter(Boolean))].slice(0, 10);
}

function termsFromPost(post) {
  return (post?._embedded?.['wp:term'] || [])
    .flat()
    .map((term) => term?.name)
    .filter((name) => name && name !== '未分類');
}

function postToWork(post, fallback) {
  const media = post?._embedded?.['wp:featuredmedia']?.[0];
  const contentHtml = post?.content?.rendered || '';
  const contentImages = imagesFromContent(contentHtml);
  const image = pickSized(media, ['large', 'full']) || contentImages[0] || '';
  const thumbnail = pickSized(media, ['medium_large', 'medium', 'large']) || contentImages[0] || image;
  const gallery = [...new Set([image, ...contentImages].filter(Boolean))].slice(0, 8);
  const title = strip(post?.title?.rendered) || fallback?.title || '';
  const categories = termsFromPost(post);
  return {
    id: String(post.id),
    sourceId: post.id,
    title,
    year: (post.date || '').slice(0, 4) || fallback?.year || '',
    categories: categories.length ? categories : fallback?.cats || ['その他'],
    excerpt: strip(post?.excerpt?.rendered),
    content: contentHtml,
    textContent: strip(contentHtml),
    link: post?.link || '',
    date: post?.date || '',
    modified: post?.modified || '',
    thumbnail,
    image,
    gallery,
    meta: {
      slug: post?.slug || '',
      source: 'zycc.jp REST API'
    }
  };
}

async function fetchJson(url, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return {
      data: await response.json(),
      etag: response.headers.get('etag') || '',
      lastModified: response.headers.get('last-modified') || ''
    };
  } finally {
    clearTimeout(timer);
  }
}

const byTitle = new Map(staticWorks.map((work) => [normTitle(work.title), work]));
const hydrated = new Map();
let latestModified = '';
let latestCheckedAt = new Date().toISOString();
let etag = '';
let lastModifiedHeader = '';

for (let page = 1; page <= 8; page += 1) {
  const url = `${API_ROOT}?_embed=1&per_page=${PER_PAGE}&page=${page}`;
  const { data, etag: pageEtag, lastModified } = await fetchJson(url);
  if (page === 1) {
    etag = pageEtag;
    lastModifiedHeader = lastModified;
  }
  for (const post of data) {
    if (post.modified && (!latestModified || post.modified > latestModified)) latestModified = post.modified;
    const key = normTitle(post.title?.rendered);
    const fallback = byTitle.get(key);
    if (!fallback || hydrated.has(key)) continue;
    hydrated.set(key, postToWork(post, fallback));
  }
  if (hydrated.size >= staticWorks.length || data.length < PER_PAGE) break;
}

const works = staticWorks.map((fallback, index) => {
  const matched = hydrated.get(normTitle(fallback.title));
  return matched || {
    id: `static-${index}`,
    sourceId: null,
    title: fallback.title,
    year: fallback.year,
    categories: fallback.cats || ['その他'],
    excerpt: '',
    content: '',
    textContent: '',
    link: '',
    date: '',
    modified: '',
    thumbnail: '',
    image: '',
    gallery: [],
    meta: {
      source: 'local static index',
      missingFromApi: true
    }
  };
});

const cache = {
  schemaVersion: SCHEMA_VERSION,
  generatedAt: latestCheckedAt,
  source: API_ROOT,
  latestModified,
  etag,
  lastModified: lastModifiedHeader,
  count: works.length,
  works
};

await mkdir(dirname(outputPath), { recursive: true });
const json = JSON.stringify(cache, null, 2);
const js = `window.ZYCC_WORKS_CACHE=${json.replace(/<\/script/gi, '<\\/script')};\n`;
await writeFile(outputPath, `${json}\n`, 'utf8');
await writeFile(jsOutputPath, js, 'utf8');

console.log(`Wrote ${works.length} works to ${outputPath}`);
console.log(`Wrote inline cache to ${jsOutputPath}`);
console.log(`Matched ${hydrated.size}/${staticWorks.length}; latestModified=${latestModified}`);
