export function buildHrefLangTags(baseUrl: string, path: string, locales: string[]) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return locales.map((locale) => ({
    rel: 'alternate',
    hrefLang: locale,
    href: `${baseUrl}/${locale}${normalizedPath}`,
  }));
}

export function localizedUrl(baseUrl: string, path: string, locale: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}/${locale}${normalizedPath}`;
}


