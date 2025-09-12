import { fetchStaticPage } from "@/lib/staticPages";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";

export const revalidate = 60;

export default async function ContactPage() {
  const content = await fetchStaticPage("contact");

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50 via-yellow-50 to-white pointer-events-none" />
        <div className="container mx-auto px-4 py-16 md:py-20 relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50/70 px-4 py-1 text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
            <span className="uppercase tracking-[0.2em] text-[11px]">Get in touch</span>
          </div>
          <h1 className="mt-6 font-serif text-5xl md:text-7xl font-black tracking-tight text-slate-900">
            {content.title}
          </h1>
          {content.subtitle && (
            <p className="mt-4 text-lg md:text-2xl text-amber-900/80 max-w-3xl italic">{content.subtitle}</p>
          )}
          <div className="mt-8 h-px w-40 bg-gradient-to-r from-transparent via-amber-500/70 to-transparent" />
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12 md:pb-16 grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-amber-200 bg-white shadow-[0_8px_30px_rgba(191,146,42,0.12)] p-6">
            <article className="max-w-none text-[1.075rem] leading-8 text-slate-800">
              {content.body.split(/\n\n+/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </article>
            {content.images?.length ? (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {content.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-[4/3] overflow-hidden rounded-xl border-2 border-amber-200 bg-amber-50/60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt || "Contact image"} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <ContactForm />
        </div>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
            <h2 className="font-serif font-semibold text-slate-900 text-xl">Contact details</h2>
            <div className="mt-4 space-y-2 text-slate-800">
              {content.contact?.email && (
                <div>
                  <span className="font-medium">Email: </span>
                  <Link className="text-amber-800 hover:underline" href={`mailto:${content.contact.email}`}>{content.contact.email}</Link>
                </div>
              )}
              {content.contact?.phone && (
                <div>
                  <span className="font-medium">Phone: </span>
                  <Link className="text-amber-800 hover:underline" href={`tel:${content.contact.phone}`}>{content.contact.phone}</Link>
                </div>
              )}
              {content.contact?.instagram && (
                <div>
                  <span className="font-medium">Instagram: </span>
                  <a className="text-amber-800 hover:underline" href={content.contact.instagram} target="_blank" rel="noreferrer noopener">Instagram</a>
                </div>
              )}
              {content.contact?.address && (
                <div>
                  <span className="font-medium">Address: </span>
                  <span>{content.contact.address}</span>
                </div>
              )}
            </div>
          </div>
          {content.contact?.mapEmbedUrl && (
            <div className="rounded-2xl overflow-hidden border border-amber-200">
              <iframe
                src={content.contact.mapEmbedUrl}
                width="100%"
                height="280"
                loading="lazy"
                style={{ border: 0 }}
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}


