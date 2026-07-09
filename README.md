# ZYCC Recruit LP v1.10

## Works Cache Architecture

```
LP display
  |
  |-- 1. localStorage: zyccWorksCacheV5
  |
  |-- 2. assets/cache/works-cache.js / works.json
  |
  `-- 3. ZYCC REST API background check
          |
          |-- latest modified check only
          |-- fetch changed posts only when newer
          `-- update localStorage and softly re-render
```

The Works section never waits for the official REST API before first paint. It renders a skeleton immediately, then local cache data, then checks the official site in the background.

## Runtime Flow

1. Render Works skeleton from the static title index.
2. Read `localStorage` cache and render immediately when available.
3. If `localStorage` is empty, read `window.ZYCC_WORKS_CACHE` from `assets/cache/works-cache.js`.
4. If the inline cache is unavailable, read `assets/cache/works.json`.
5. Store the cache into `localStorage`.
6. Check the official REST API with:
   `per_page=1&orderby=modified&order=desc`
7. If `latestModified` is unchanged, do nothing.
8. If newer data exists, fetch only posts changed after the cached `latestModified`.
9. Merge matching Works records, update `localStorage`, and fade-refresh the view.

Network calls use `AbortController` with an 8 second timeout. If the official site is slow or unavailable, the cached Works remain visible.

The runtime rejects old or incomplete browser caches. If `schemaVersion` is not current, or if `thumbnail`, `image`, and `gallery` counts fall below the validation threshold, `localStorage` is cleared and the bundled cache is loaded again.

Development reset:

```js
resetWorksCache()
```

or open:

```text
index.html?resetWorksCache=1
```

## Cache JSON

Cache file:

```
assets/cache/works.json
assets/cache/works-cache.js
```

`works-cache.js` mirrors the JSON into `window.ZYCC_WORKS_CACHE` so Works can display even when the LP is opened directly from `file://`.

Each record keeps:

- `sourceId`
- `title`
- `categories`
- `excerpt`
- `content`
- `thumbnail`
- `image`
- `gallery`
- `date`
- `modified`
- `link`
- `meta`

List/grid views use `thumbnail` only. In v5, `thumbnail` points to a bundled file under `assets/cache/work-thumbs/` so the list does not depend on remote image delivery. The original official thumbnail URL is kept in `meta.remoteThumbnail`. The modal loads `image` and `gallery` lazily when opened.

## Updating The JSON

Run this from the LP directory:

```bash
node scripts/update-works-cache.mjs
node scripts/cache-work-thumbnails.mjs
```

Commit the updated `assets/cache/works.json`, `assets/cache/works-cache.js`, and `assets/cache/work-thumbs/` with the LP. On Netlify, these files are served as static assets, so Works can display even when the official site is slow or temporarily down.

## Future CMS Changes

If ZYCC moves away from WordPress REST API, keep the LP-side cache contract stable:

- Continue writing `assets/cache/works.json` and `assets/cache/works-cache.js`.
- Keep `latestModified` or an equivalent monotonic revision field.
- Keep `thumbnail`, `image`, and `gallery` separate.
- Update only `scripts/update-works-cache.mjs` and the small background sync functions in `index.html`.

The UI should not depend on the CMS response shape directly.
