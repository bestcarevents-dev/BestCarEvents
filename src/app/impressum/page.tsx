import { fetchImpressum } from "@/lib/impressum";

const PHRASE = "Best Car Events by Custoza";
function withNoTranslate(text: string) {
  const input = text ?? "";
  const parts = input.split(PHRASE);
  if (parts.length === 1) return input;
  const nodes: any[] = [];
  let consumeLeadingNewline = false;
  for (let i = 0; i < parts.length; i++) {
    let segment = parts[i] as string;
    if (consumeLeadingNewline) {
      segment = segment.replace(/^\n+/, "");
      consumeLeadingNewline = false;
    }
    if (segment) nodes.push(segment);
    if (i < parts.length - 1) {
      nodes.push(
        <span key={`nt-${i}`} className="notranslate" translate="no" data-no-translate>
          {PHRASE}
        </span>
      );
      const nextPart = parts[i + 1] ?? "";
      // If the next part begins with one or more newlines, insert equivalent <br/>s
      // and consume those newlines from the next segment to preserve layout reliably
      // across translators that may drop raw newlines at element boundaries.
      const newlineMatch = nextPart.match(/^\n+/);
      if (newlineMatch) {
        const count = newlineMatch[0].length;
        for (let k = 0; k < count; k++) {
          nodes.push(<br key={`br-${i}-${k}`} />);
        }
        consumeLeadingNewline = true;
      } else if (nextPart && !/^\s/.test(nextPart)) {
        // Otherwise, ensure a separating space if the next text starts immediately.
        nodes.push(" ");
      }
    }
  }
  return nodes;
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


