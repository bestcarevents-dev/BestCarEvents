import { fetchStaticPage } from "@/lib/staticPages";
import Image from "next/image";
import { Mail, Instagram, Facebook, Twitter, Youtube, Linkedin, Globe, MessageCircle, Send, BadgePercent } from "lucide-react";

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

      <section className="container mx-auto px-4 py-10 md:py-14" style={{ paddingTop: "1em" }}>
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-10">
          <div className="lg:col-span-7">
            <article className="max-w-3xl text-[1.075rem] leading-8 text-slate-800">
              {content.body.split(/\n\n+/).map((para, i) => (
                <p key={i} className={i === 0 ? "first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-5xl first-letter:font-serif first-letter:font-bold first-letter:text-amber-700" : undefined}>
                  {para}
                </p>
              ))}
            </article>
            {content.quote && (
              <div className="mt-10 rounded-xl border border-amber-200/60 bg-amber-50/40 p-6">
                <blockquote className="text-amber-900 italic text-lg">
                  {`“${content.quote}”`}
                </blockquote>
              </div>
            )}
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
              <h3 className="font-serif text-xl font-semibold text-slate-900">Contact</h3>
              <ul className="mt-4 space-y-4 text-slate-700">
                {content.contact?.email && (
                  <li className="flex items-center gap-3">
                    <Mail size={18} className="text-amber-700" />
                    <a href={`mailto:${content.contact.email}`} className="underline decoration-amber-500 underline-offset-2">{content.contact.email}</a>
                  </li>
                )}
              </ul>
            </div>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-white p-6 shadow-[0_8px_30px_rgba(191,146,42,0.12)]">
              <h3 className="font-serif text-xl font-semibold text-slate-900">Follow us on</h3>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {content.contact?.instagram && (
                  <a aria-label="Instagram" href={content.contact.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition">
                    <Instagram size={18} />
                  </a>
                )}
                {content.contact?.facebook && (
                  <a aria-label="Facebook" href={content.contact.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition">
                    <Facebook size={18} />
                  </a>
                )}
                {content.contact?.twitter && (
                  <a aria-label="Twitter" href={content.contact.twitter} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition">
                    <Twitter size={18} />
                  </a>
                )}
                {content.contact?.youtube && (
                  <a aria-label="YouTube" href={content.contact.youtube} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition">
                    <Youtube size={18} />
                  </a>
                )}
                {content.contact?.linkedin && (
                  <a aria-label="LinkedIn" href={content.contact.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition">
                    <Linkedin size={18} />
                  </a>
                )}
                {content.contact?.tiktok && (
                  <a aria-label="TikTok" href={content.contact.tiktok} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition">
                    <BadgePercent size={18} />
                  </a>
                )}
                {content.contact?.telegram && (
                  <a aria-label="Telegram" href={content.contact.telegram} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition">
                    <Send size={18} />
                  </a>
                )}
                {content.contact?.whatsapp && (
                  <a aria-label="WhatsApp" href={content.contact.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition">
                    <MessageCircle size={18} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


