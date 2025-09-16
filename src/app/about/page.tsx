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
        <div className="container mx-auto px-4 py-10 md:py-14 relative" style={{ paddingBottom: 0 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50/70 px-4 py-1 text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
            <span className="uppercase tracking-[0.2em] text-[11px]">Our Story</span>
          </div>
          <h1 className="mt-4 md:mt-5 font-serif text-5xl md:text-7xl font-black tracking-tight text-slate-900">
            {content.title}
          </h1>
          {content.subtitle && (
            <p className="mt-2 md:mt-3 text-lg md:text-2xl text-amber-900/80 max-w-3xl italic">
              {content.subtitle}
            </p>
          )}
          <div className="mt-6 h-px w-40 bg-gradient-to-r from-transparent via-amber-500/70 to-transparent" />
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

      <section className="container mx-auto px-4 py-10 md:py-14">
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
            <div className="mt-6 rounded-2xl border border-amber-200 bg-white p-6 shadow-[0_8px_30px_rgba(191,146,42,0.12)]">
              <h3 className="font-serif text-xl font-semibold text-slate-900">Connect with us</h3>
              <ul className="mt-4 space-y-4 text-slate-700">
                <li className="flex items-center gap-3">
                  {/* Mail icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-700"><path d="M4 4h16v16H4z"></path><path d="m22 6-10 7L2 6"></path></svg>
                  <a href={`mailto:${content.contact?.email || 'info@bestcarevents.com'}`} className="underline decoration-amber-500 underline-offset-2">{content.contact?.email || 'info@bestcarevents.com'}</a>
                </li>
                <li className="flex items-center gap-3">
                  {/* Instagram icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-700"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                  <a href={content.contact?.instagram || 'https://instagram.com/bestcarevents'} target="_blank" rel="noopener noreferrer" className="underline decoration-amber-500 underline-offset-2">BestCarEvents</a>
                </li>
                <li className="flex items-center gap-3">
                  {/* Facebook icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-amber-700"><path d="M22 12a10 10 0 1 0-11.5 9.95v-7.04H7.9V12h2.6V9.8c0-2.57 1.53-3.99 3.87-3.99 1.12 0 2.3.2 2.3.2v2.53h-1.3c-1.28 0-1.68.8-1.68 1.62V12h2.86l-.46 2.91h-2.4v7.04A10 10 0 0 0 22 12z"></path></svg>
                  <a href={content.contact?.facebook || 'https://facebook.com/bestcarevents'} target="_blank" rel="noopener noreferrer" className="underline decoration-amber-500 underline-offset-2">Facebook</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


