import { fetchStaticPage } from "@/lib/staticPages";
import Link from "next/link";
import { Mail, Phone, Instagram, Facebook, Twitter, Youtube, Linkedin, Globe, MessageCircle, Send, BadgePercent } from "lucide-react";
import ContactForm from "@/components/ContactForm";

export const revalidate = 60;

export default async function ContactPage() {
  const content = await fetchStaticPage("contact");

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50 via-yellow-50 to-white pointer-events-none" />
        <div className="container mx-auto px-4 py-16 md:py-20 relative" style={{ paddingBottom: 0 }}>
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
            <ul className="mt-4 space-y-3 text-slate-800">
              {content.contact?.email && (
                <li className="flex items-center gap-3">
                  <Mail size={18} className="text-amber-700" />
                  <Link className="text-amber-800 hover:underline" href={`mailto:${content.contact.email}`}>{content.contact.email}</Link>
                </li>
              )}
              {content.contact?.phone && (
                <li className="flex items-center gap-3">
                  <Phone size={18} className="text-amber-700" />
                  <Link className="text-amber-800 hover:underline" href={`tel:${content.contact.phone}`}>{content.contact.phone}</Link>
                </li>
              )}
              {content.contact?.website && (
                <li className="flex items-center gap-3">
                  <Globe size={18} className="text-amber-700" />
                  <a className="text-amber-800 hover:underline" href={content.contact.website} target="_blank" rel="noreferrer noopener">Website</a>
                </li>
              )}
              {content.contact?.instagram && (
                <li className="flex items-center gap-3">
                  <Instagram size={18} className="text-amber-700" />
                  <a className="text-amber-800 hover:underline" href={content.contact.instagram} target="_blank" rel="noreferrer noopener">Instagram</a>
                </li>
              )}
              {content.contact?.facebook && (
                <li className="flex items-center gap-3">
                  <Facebook size={18} className="text-amber-700" />
                  <a className="text-amber-800 hover:underline" href={content.contact.facebook} target="_blank" rel="noreferrer noopener">Facebook</a>
                </li>
              )}
              {content.contact?.twitter && (
                <li className="flex items-center gap-3">
                  <Twitter size={18} className="text-amber-700" />
                  <a className="text-amber-800 hover:underline" href={content.contact.twitter} target="_blank" rel="noreferrer noopener">Twitter</a>
                </li>
              )}
              {content.contact?.youtube && (
                <li className="flex items-center gap-3">
                  <Youtube size={18} className="text-amber-700" />
                  <a className="text-amber-800 hover:underline" href={content.contact.youtube} target="_blank" rel="noreferrer noopener">YouTube</a>
                </li>
              )}
              {content.contact?.linkedin && (
                <li className="flex items-center gap-3">
                  <Linkedin size={18} className="text-amber-700" />
                  <a className="text-amber-800 hover:underline" href={content.contact.linkedin} target="_blank" rel="noreferrer noopener">LinkedIn</a>
                </li>
              )}
              {content.contact?.tiktok && (
                <li className="flex items-center gap-3">
                  <BadgePercent size={18} className="text-amber-700" />
                  <a className="text-amber-800 hover:underline" href={content.contact.tiktok} target="_blank" rel="noreferrer noopener">TikTok</a>
                </li>
              )}
              {content.contact?.telegram && (
                <li className="flex items-center gap-3">
                  <Send size={18} className="text-amber-700" />
                  <a className="text-amber-800 hover:underline" href={content.contact.telegram} target="_blank" rel="noreferrer noopener">Telegram</a>
                </li>
              )}
              {content.contact?.whatsapp && (
                <li className="flex items-center gap-3">
                  <MessageCircle size={18} className="text-amber-700" />
                  <a className="text-amber-800 hover:underline" href={content.contact.whatsapp} target="_blank" rel="noreferrer noopener">WhatsApp</a>
                </li>
              )}
              {content.contact?.address && (
                <li className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-700"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  <span>{content.contact.address}</span>
                </li>
              )}
            </ul>
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


