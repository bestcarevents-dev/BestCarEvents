import { fetchStaticPage } from "@/lib/staticPages";
import Image from "next/image";

export const revalidate = 60;

export default async function AboutPage() {
  const content = await fetchStaticPage("about");
  const accent = "from-amber-100 via-yellow-50 to-white";

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-b ${accent} pointer-events-none`} />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-4 py-1 text-yellow-700">
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            <span className="uppercase tracking-widest text-xs">Our Story</span>
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900">
            {content.title}
          </h1>
          {content.subtitle && (
            <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-3xl">{content.subtitle}</p>
          )}
        </div>
      </section>

      {content.images?.length ? (
        <section className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.images.map((img, idx) => (
              <div key={idx} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-yellow-100 bg-amber-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt || "About image"} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="container mx-auto px-4 py-16">
        <article className="prose prose-lg max-w-3xl prose-headings:font-semibold prose-a:text-yellow-700 text-gray-800">
          {content.body.split(/\n\n+/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </article>
      </section>
    </div>
  );
}


