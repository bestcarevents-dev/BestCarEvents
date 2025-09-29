import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram, Youtube, Linkedin, Globe, MessageCircle, Send, BadgePercent } from "lucide-react";
import FooterNewsletter from "@/components/FooterNewsletter";
import { fetchStaticPage } from "@/lib/staticPages";

export default async function Footer() {
  const content = await fetchStaticPage("contact");
  return (
    <footer className="bg-muted/90 text-muted-foreground border-t border-[#E0D8C1]/30">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          <div className="md:col-span-4">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/logo.png" alt="BestCarEvents Logo" width={80} height={80} />
              <span className="text-xl font-bold font-headline tracking-tighter text-foreground">BestCarEvents</span>
            </Link>
            <p className="text-sm max-w-xs">The premier destination for automotive enthusiasts to discover events, buy and sell unique cars, and connect with a vibrant community.</p>
             <div className="flex mt-6 space-x-4">
                <Link href="#" className="hover:text-[#E0D8C1] transition-colors"><Facebook size={20}/></Link>
                <Link href="#" className="hover:text-[#E0D8C1] transition-colors"><Twitter size={20}/></Link>
                <Link href="#" className="hover:text-[#E0D8C1] transition-colors"><Instagram size={20}/></Link>
              </div>
          </div>

          <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold font-headline text-foreground">Marketplace</h3>
              <ul className="mt-4 space-y-3">
                <li><Link href="/cars" className="text-sm hover:text-[#E0D8C1] transition-colors">Cars for Sale</Link></li>
                <li><Link href="/auctions" className="text-sm hover:text-[#E0D8C1] transition-colors">Auctions</Link></li>
                <li><Link href="/advertise/cars-listing" className="text-sm hover:text-[#E0D8C1] transition-colors">My Car Listing</Link></li>
                <li><Link href="/advertise/hotel-listing" className="text-sm hover:text-[#E0D8C1] transition-colors">My Hotel Listings</Link></li>
                <li><Link href="/advertise/club-listing" className="text-sm hover:text-[#E0D8C1] transition-colors">My Club Listing</Link></li>
                <li><Link href="/advertise/events-listing" className="text-sm hover:text-[#E0D8C1] transition-colors">My Event Listing</Link></li>
                <li><Link href="/advertise/dashboard" className="text-sm hover:text-[#E0D8C1] transition-colors">My Listing/Advertise Dashboard</Link></li>
              </ul>
            </div>
             <div>
              <h3 className="font-semibold font-headline text-foreground">Events</h3>
              <ul className="mt-4 space-y-3">
                <li><Link href="/events" className="text-sm hover:text-[#E0D8C1] transition-colors">All Events</Link></li>
                <li><Link href="/events/host" className="text-sm hover:text-[#E0D8C1] transition-colors">Submit an Event</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold font-headline text-foreground">Community</h3>
              <ul className="mt-4 space-y-3">
                <li><Link href="/forum" className="text-sm hover:text-[#E0D8C1] transition-colors">Forum</Link></li>
                <li><Link href="/clubs" className="text-sm hover:text-[#E0D8C1] transition-colors">Car Clubs</Link></li>
                <li><Link href="/advertise/my-ads" className="text-sm hover:text-[#E0D8C1] transition-colors">Advertise</Link></li>
              </ul>
            </div>
             <div>
              <h3 className="font-semibold font-headline text-foreground">Company</h3>
              <ul className="mt-4 space-y-3">
                 <li><Link href="/about" className="text-sm hover:text-[#E0D8C1] transition-colors">About Us</Link></li>
                 <li><Link href="/contact" className="text-sm hover:text-[#E0D8C1] transition-colors">Contact</Link></li>
                 <li><Link href="/terms" className="text-sm hover:text-[#E0D8C1] transition-colors">Terms of Service</Link></li>
                 <li><Link href="/privacy" className="text-sm hover:text-[#E0D8C1] transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-8">
          <FooterNewsletter />
        </div>
        {/* Social icons under newsletter, reusing /contact logic */}
        <div className="mt-6 flex justify-center">
          <div className="flex flex-wrap items-center gap-3">
            {content.contact?.instagram && (
              <a aria-label="Instagram" href={content.contact.instagram} target="_blank" rel="noreferrer noopener" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition">
                <Instagram size={18} />
              </a>
            )}
            {content.contact?.facebook && (
              <a aria-label="Facebook" href={content.contact.facebook} target="_blank" rel="noreferrer noopener" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition">
                <Facebook size={18} />
              </a>
            )}
            {content.contact?.twitter && (
              <a aria-label="Twitter" href={content.contact.twitter} target="_blank" rel="noreferrer noopener" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition">
                <Twitter size={18} />
              </a>
            )}
            {content.contact?.youtube && (
              <a aria-label="YouTube" href={content.contact.youtube} target="_blank" rel="noreferrer noopener" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition">
                <Youtube size={18} />
              </a>
            )}
            {content.contact?.linkedin && (
              <a aria-label="LinkedIn" href={content.contact.linkedin} target="_blank" rel="noreferrer noopener" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition">
                <Linkedin size={18} />
              </a>
            )}
            {content.contact?.tiktok && (
              <a aria-label="TikTok" href={content.contact.tiktok} target="_blank" rel="noreferrer noopener" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition">
                <BadgePercent size={18} />
              </a>
            )}
            {content.contact?.telegram && (
              <a aria-label="Telegram" href={content.contact.telegram} target="_blank" rel="noreferrer noopener" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition">
                <Send size={18} />
              </a>
            )}
            {content.contact?.whatsapp && (
              <a aria-label="WhatsApp" href={content.contact.whatsapp} target="_blank" rel="noreferrer noopener" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition">
                <MessageCircle size={18} />
              </a>
            )}
            {content.contact?.website && (
              <a aria-label="Website" href={content.contact.website} target="_blank" rel="noreferrer noopener" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition">
                <Globe size={18} />
              </a>
            )}
          </div>
        </div>
        <div className="mt-12 border-t border-[#E0D8C1]/30 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} BestCarEvents. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
