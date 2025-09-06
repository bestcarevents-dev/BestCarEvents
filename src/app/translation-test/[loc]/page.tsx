import {getTranslationsOrDefault} from '@/lib/translate/runtime';

type PageProps = {
  params: { loc: string };
};

export default async function Page({ params }: PageProps) {
  const locale = params.loc;
  const texts = ['Welcome to BestCarEvents', 'Join now'];
  const translated = await getTranslationsOrDefault(texts, locale, 'en');

  return (
    <div style={{padding: 24}}>
      <h1>Locale: {locale}</h1>
      <div style={{marginTop: 16}}>
        <h2>Original (en)</h2>
        <div>{texts[0]}</div>
        <div>{texts[1]}</div>
      </div>
      <div style={{marginTop: 16}}>
        <h2>From cache ({locale})</h2>
        <div>{translated[0]}</div>
        <div>{translated[1]}</div>
      </div>
      <p style={{opacity: 0.6, marginTop: 16}}>
        If you see English here, the translation is being queued in the background. Reload in a few seconds.
      </p>
    </div>
  );
}


