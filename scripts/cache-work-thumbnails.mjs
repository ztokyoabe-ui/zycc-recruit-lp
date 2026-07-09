import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_JSON = path.join(ROOT, 'assets/cache/works.json');
const CACHE_JS = path.join(ROOT, 'assets/cache/works-cache.js');
const THUMB_DIR = path.join(ROOT, 'assets/cache/work-thumbs');
const SCHEMA_VERSION = 5;

function extFromType(type = '') {
  if (type.includes('png')) return '.png';
  if (type.includes('webp')) return '.webp';
  return '.jpg';
}

async function download(url, id) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  const type = response.headers.get('content-type') || '';
  const ext = extFromType(type);
  const file = `${String(id).replace(/[^a-z0-9_-]/gi, '')}${ext}`;
  const absolute = path.join(THUMB_DIR, file);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 1024) throw new Error(`too small ${url}`);
  await fs.writeFile(absolute, buffer);
  return `assets/cache/work-thumbs/${file}`;
}

async function main() {
  await fs.mkdir(THUMB_DIR, { recursive: true });
  const cache = JSON.parse(await fs.readFile(CACHE_JSON, 'utf8'));
  const works = [];
  let downloaded = 0;

  for (const work of cache.works || []) {
    const remoteThumbnail = work.meta?.remoteThumbnail || work.thumbnail || work.image || work.gallery?.[0] || '';
    if (!remoteThumbnail) throw new Error(`missing remote thumbnail source: ${work.title}`);
    const localThumbnail = await download(remoteThumbnail, work.id || work.sourceId || works.length);
    downloaded += 1;
    works.push({
      ...work,
      thumbnail: localThumbnail,
      image: work.image || remoteThumbnail,
      gallery: Array.isArray(work.gallery) && work.gallery.length ? work.gallery : [work.image || remoteThumbnail],
      meta: {
        ...(work.meta || {}),
        remoteThumbnail,
        thumbnailCachedAt: new Date().toISOString()
      }
    });
  }

  const next = {
    ...cache,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    count: works.length,
    works
  };

  await fs.writeFile(CACHE_JSON, JSON.stringify(next, null, 2));
  await fs.writeFile(CACHE_JS, `window.ZYCC_WORKS_CACHE=${JSON.stringify(next, null, 2)};\n`);

  const counts = {
    thumbnail: works.filter(w => w.thumbnail).length,
    image: works.filter(w => w.image).length,
    gallery: works.filter(w => Array.isArray(w.gallery) && w.gallery.length).length
  };
  console.log({ downloaded, counts, schemaVersion: next.schemaVersion });
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
