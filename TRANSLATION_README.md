# Server-Side Multilingual Translation via Google Cloud Translation v3

This document describes the server-side translation system that provides cached, glossary-correct translations for multiple locales (sv, da, ur, …) in Next.js. It translates on publish/update, never on first view, and stores results for fast retrieval.

## Overview

The system uses:
- Google Cloud Translation v3 (server-side) with optional glossary
- Firestore-backed cache keyed by `sha256(text) + ':' + locale`
- Webhook endpoint to translate content on publish/edit
- i18n routes (`/en`, `/sv`, `/da`, `/ur`) with SEO-friendly `hreflang`

## How It Works

### 1) Translation Clients
- `src/lib/translate/googleClient.ts` creates a single `TranslationServiceClient` using a service account JSON provided via `GOOGLE_APPLICATION_CREDENTIALS_JSON`.
- Optional glossary configured via `GOOGLE_TRANSLATION_GLOSSARY_ID` and `GOOGLE_CLOUD_LOCATION`.

### 2) Cache Keys
- `src/lib/translate/cache.ts` computes `sha256(text)` and builds cache keys `{hash}:{locale}`.
- Firestore collection `translations_cache` stores `{ value, updatedAt }` documents.

### 3) Batch Translation
- `src/lib/translate/translator.ts` batches texts into ≤ 5000 characters per request.
- Applies glossary when available.
- Exponential backoff for rate limiting; logs character counts and request totals.

### 4) Webhook: translate on publish
- `POST /api/translate` accepts `{ sourceLocale, targetLocales, items: [{ id, text }] }`.
- Immediately translates into all target locales and persists to cache.

### 5) Serving localized routes
- `next.config.ts` defines i18n locales. Use cached translations by key when rendering.
- If a cache miss occurs, render default locale and call `ensureTranslationsAsync` to queue background translation.

## Features

### ✅ Implemented
- [x] Server-side translations (no keys in the browser)
- [x] Cache-first lookups; no duplicate API calls for identical text
- [x] Batch translation with glossary support
- [x] Webhook to translate on publish/edit
- [x] i18n routes + hreflang helpers for SEO
- [x] Background fallback on cache miss

### 🔄 Operational Flow
- Content publish/edit triggers the webhook.
- Extract user-visible strings, call the webhook with all target locales.
- Cache stores translations keyed by hash+locale.
- Page render reads from cache; if missing, default locale rendered and async translate queued.

### 📱 Responsive Design
- Language switcher works on both desktop and mobile
- Translations are applied consistently across all screen sizes
- Website layout and functionality preserved

## Usage

### Environment Variables
Add the following to `.env.local` (server-side only):

```
GOOGLE_APPLICATION_CREDENTIALS_JSON={...service account JSON...}
GOOGLE_CLOUD_PROJECT=titanium-link-466608-j7
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_TRANSLATION_GLOSSARY_ID=bestcar-glossary   # optional

# Firebase Admin (already used in project)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
FIREBASE_CLIENT_ID=
FIREBASE_AUTH_URI=
FIREBASE_TOKEN_URI=
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=
FIREBASE_CLIENT_X509_CERT_URL=
FIREBASE_UNIVERSE_DOMAIN=
```

### Webhook
`POST /api/translate`

Body:
```json
{
  "sourceLocale": "en",
  "targetLocales": ["sv", "da", "ur"],
  "items": [
    {"id": "title", "text": "Your premier destination for car events"},
    {"id": "cta", "text": "Join now"}
  ]
}
```

### Rendering with cache
- For each text block, compute `hash = sha256(text)` and lookup key `hash:locale` in Firestore.
- If not present, render default locale; call `ensureTranslationsAsync([...], 'en', locale)`.

## File Structure

```
src/
├── contexts/
│   └── LanguageContext.tsx          # Language state management with Google Translate
├── app/
│   └── layout.tsx                   # Root layout with LanguageProvider
└── components/
    └── layout/
        ├── header.tsx               # Language switcher with flags
        └── footer.tsx               # Standard footer (auto-translated)
```

## How Google Translate Works

1. **When Italian is selected:**
   - Google Translate script is loaded
   - Translate element is initialized
   - Entire page content is translated to Italian
   - Translation is applied to all text elements

2. **When English is selected:**
   - Google Translate is removed
   - Original English content is restored
   - No translation overhead

3. **Benefits:**
   - **Free**: No API costs
   - **Automatic**: No manual work
   - **Complete**: Translates everything
   - **Reliable**: Google's translation service
   - **Fast**: Instant switching

## Technical Details

### Google Translate Element
```javascript
// Automatically loaded when Italian is selected
new google.translate.TranslateElement({
  pageLanguage: 'en',
  includedLanguages: 'it',
  autoDisplay: false,
}, 'google_translate_element');
```

### Language Switching
```javascript
// Switch to Italian
setLanguage('it'); // Loads Google Translate

// Switch to English  
setLanguage('en'); // Removes Google Translate
```

## Advantages

| Concern | Solution |
|--------|----------|
| API cost | Cache-first; batch requests; only translate once per unique text |
| Consistency | Glossary applied automatically |
| Performance | Pre-translate on publish; fast cache reads at request time |
| SEO | i18n routes, localized metadata, hreflang |

## Best Practices

1. Keep canonical content in English for best MT quality
2. Extract only user-visible strings for translation
3. Avoid translating slugs more than once; store stable localized slugs
4. Monitor logs to track character usage and cache hit rates

## Troubleshooting

### Translation not working?
1. Check if the component is wrapped in `LanguageProvider`
2. Verify Google Translate script is loading (check browser console)
3. Ensure the component is marked as `"use client"`
4. Check if any ad blockers are blocking Google Translate

### Layout issues with translated text?
1. Italian text is often longer - adjust CSS accordingly
2. Use responsive design principles
3. Test with both languages during development

### Rate limits
Automatic exponential backoff is implemented. If persistent, reduce batch size or throttle webhook triggers.

## Future Enhancements

- [ ] Add admin UI for glossary term management
- [ ] Per-collection JSON bundles for CDN edge caching
- [ ] Localized slug generation and storage

## Conclusion

This implementation provides a **complete, automatic, and free** translation solution that:
- ✅ Requires **zero manual work**
- ✅ Translates **entire website** automatically
- ✅ Works with **all future content**
- ✅ Is **completely free** to use
- ✅ Provides **instant language switching**
- ✅ Maintains **website functionality**

Perfect for large websites where manual translation would be impractical! 