import { fetchImpressum } from "@/lib/impressum";

const PHRASE = "Best Car Events by Custoza";
function withNoTranslate(text: string) {
  const parts = (text ?? "").split(PHRASE);
  if (parts.length === 1) return text;
  const out: any[] = [];
  parts.forEach((part, idx) => {
    out.push(part);
    if (idx < parts.length - 1) {
      out.push(
        <span key={`nt-${idx}`} className="notranslate" translate="no" data-no-translate>
          {PHRASE}
        </span>
      );
      // Ensure a visible separator/space after the brand phrase when the following text
      // starts immediately without whitespace. This avoids awkward concatenation when
      // translators collapse leading spaces at element boundaries.
      const nextPart = parts[idx + 1] ?? "";
      if (nextPart && !/^\s/.test(nextPart)) {
        out.push(" ");
      }
    }
  });
  return out;
}

export default async function ImpressumPage() {
  const content = await fetchImpressum();
  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-gray-900">{content.title || "Impressum / Legal Notice"}</h1>
            {content.subtitle && (
              <p className="mt-4 text-lg text-gray-600">{content.subtitle}</p>
            )}
          </div>

          <div className="prose prose-lg max-w-none text-gray-700">
            {content.sections.map((section) => (
              <section key={section.id} className="mb-8">
                <h2 className="text-2xl font-bold font-headline text-gray-900 mb-4">{withNoTranslate(section.title)}</h2>
                <div className="whitespace-pre-wrap">{withNoTranslate(section.content)}</div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


