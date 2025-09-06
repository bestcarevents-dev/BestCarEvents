import { fetchStaticPage } from "@/lib/staticPages";
import Link from "next/link";

export const revalidate = 60;

export default async function ContactPage() {
  const content = await fetchStaticPage("contact");

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-yellow-50 to-white pointer-events-none" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-4 py-1 text-yellow-700">
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            <span className="uppercase tracking-widest text-xs">Get in touch</span>
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900">
            {content.title}
          </h1>
          {content.subtitle && (
            <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-3xl">{content.subtitle}</p>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-yellow-100 bg-white shadow-sm p-6">
            <article className="prose prose-lg max-w-none text-gray-800">
              {content.body.split(/\n\n+/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </article>
            {content.images?.length ? (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {content.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-yellow-100 bg-amber-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt || "Contact image"} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-yellow-100 bg-yellow-50/60 p-6">
            <h2 className="font-semibold text-gray-900 text-xl">Contact details</h2>
            <div className="mt-4 space-y-2 text-gray-700">
              {content.contact?.email && (
                <div>
                  <span className="font-medium">Email: </span>
                  <Link className="text-yellow-700 hover:underline" href={`mailto:${content.contact.email}`}>{content.contact.email}</Link>
                </div>
              )}
              {content.contact?.phone && (
                <div>
                  <span className="font-medium">Phone: </span>
                  <Link className="text-yellow-700 hover:underline" href={`tel:${content.contact.phone}`}>{content.contact.phone}</Link>
                </div>
              )}
              {content.contact?.instagram && (
                <div>
                  <span className="font-medium">Instagram: </span>
                  <a className="text-yellow-700 hover:underline" href={content.contact.instagram} target="_blank" rel="noreferrer noopener">Instagram</a>
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
            <div className="rounded-2xl overflow-hidden border border-yellow-100">
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


