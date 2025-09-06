import { fetchStaticPage } from "@/lib/staticPages";
import Image from "next/image";

export const revalidate = 60;

export default async function AboutPage() {
  const content = await fetchStaticPage("about");
  const accent = "from-amber-50 via-yellow-50 to-white";

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-b ${accent} pointer-events-none`} />
        <div className="container mx-auto px-4 py-24 relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50/70 px-4 py-1 text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
            <span className="uppercase tracking-[0.2em] text-[11px]">Our Story</span>
          </div>
          <h1 className="mt-6 font-serif text-5xl md:text-7xl font-black tracking-tight text-slate-900">
            {content.title}
          </h1>
          {content.subtitle && (
            <p className="mt-4 text-lg md:text-2xl text-amber-900/80 max-w-3xl italic">
              {content.subtitle}
            </p>
          )}
          <div className="mt-8 h-px w-40 bg-gradient-to-r from-transparent via-amber-500/70 to-transparent" />
        </div>
        <div className="absolute -left-10 top-10 h-28 w-28 rounded-full bg-gradient-to-br from-amber-100/70 to-yellow-50/60 blur-xl" />
        <div className="absolute -right-10 -bottom-10 h-36 w-36 rounded-full bg-gradient-to-tr from-amber-100/70 to-yellow-50/60 blur-xl" />
      </section>

      {content.images?.length ? (
        <section className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {content.images.slice(0, 3).map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-[4/3] rounded-xl overflow-hidden bg-amber-50/60 border-2 border-amber-200 shadow-[0_10px_30px_rgba(191,146,42,0.15)]"
                style={{ transform: idx === 1 ? "rotate(-0.8deg)" : idx === 2 ? "rotate(0.8deg)" : undefined }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt || "About image"} className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-amber-900/5" />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-10">
          <div className="lg:col-span-7">
            <article className="max-w-3xl text-[1.075rem] leading-8 text-slate-800">
              {content.body.split(/\n\n+/).map((para, i) => (
                <p key={i} className={i === 0 ? "first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-5xl first-letter:font-serif first-letter:font-bold first-letter:text-amber-700" : undefined}>
                  {para}
                </p>
              ))}
            </article>
            <div className="mt-10 rounded-xl border border-amber-200/60 bg-amber-50/40 p-6">
              <blockquote className="text-amber-900 italic text-lg">
                “A unique community where passion meets opportunity — free for everyone.”
              </blockquote>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-[0_8px_30px_rgba(191,146,42,0.12)]">
              <h3 className="font-serif text-xl font-semibold text-slate-900">What we stand for</h3>
              <ul className="mt-4 space-y-3 text-slate-700">
                <li className="flex items-start gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-amber-600" />Community-first</li>
                <li className="flex items-start gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-amber-600" />Free for everyone</li>
                <li className="flex items-start gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-amber-600" />Global reach</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


