# Brand fonts for the PDF export

Drop the **static TTFs** here to switch the PDF export from its fallback
fonts (Times/Helvetica) to the book's real typefaces:

```
Fraunces-Regular.ttf
Fraunces-SemiBold.ttf
Inter-Regular.ttf
Inter-SemiBold.ttf
Inter-Italic.ttf      (optional)
```

No code change — [`lib/pdf-fonts.ts`](../../lib/pdf-fonts.ts) picks them up on
the next deploy. Both families need to be present or it stays on the
fallbacks rather than mixing metrics.

Both are SIL Open Font License, so they can be embedded in a product you sell.
Download the static TTFs from Google Fonts (not the variable or woff2 builds —
react-pdf can't read those).

## Why here and not `public/`

On Vercel, `public/` is served by the CDN and is **not** bundled into the
serverless function, so reading it from disk at runtime always misses. This
directory is pulled into the function explicitly by `outputFileTracingIncludes`
in `next.config.mjs`.

## Checking it worked

The export response carries an `x-pdf-fonts` header: `embedded` when the real
fonts are in use, `fallback` when they aren't.

```bash
curl -sI -X POST https://your-domain.com/api/export/pdf \
  -H 'content-type: application/json' -d '{}' | grep -i x-pdf-fonts
```
