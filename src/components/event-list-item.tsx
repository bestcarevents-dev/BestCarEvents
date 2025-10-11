import Image from 'next/image';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

export type EventListItemProps = {
  id?: string | number;
  documentId?: string;
  name: string;
  date: string;
  endDate?: string;
  location: string;
  image: string;
  hint: string;
  description: string;
};

export default function EventListItem({ id, documentId, name, date, endDate, location, image, hint, description }: EventListItemProps) {
  const resolvedId = typeof documentId !== 'undefined' ? documentId : (typeof id !== 'undefined' ? String(id) : '');
  const href = resolvedId ? `/events/${resolvedId}` : '/events';
  return (
    <Card className="w-full overflow-hidden rounded-[18px] border border-[#C7BCA3]/60 bg-gradient-to-br from-[#FAF7EE] via-[#F3EADA] to-[#ECE3D1] shadow-[0_10px_30px_rgba(0,0,0,0.10)] transition-all duration-500 hover:shadow-[0_18px_48px_rgba(0,0,0,0.16)]">
      <div className="flex flex-col md:flex-row">
        {/* Framed image with brass rail */}
        <div className="relative w-full md:w-1/3 aspect-[4/5] md:aspect-[4/5] shrink-0 bg-[#EDE7DA]">
          <div className="absolute inset-0 m-4 rounded-[14px] border border-[#B49A6A]/55 overflow-hidden shadow-inner bg-gradient-to-br from-[#0b0b0b] to-[#1a1a1a]">
            <Image
              src={image}
              alt={name}
              fill
              className="object-contain transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
              data-ai-hint={hint}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_70%_20%,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_60%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-[#C3A76D] via-[#E7D08A] to-[#B98A2A] opacity-95" />
          </div>
          {/* Corner studs */}
          <div className="pointer-events-none absolute top-2 left-2 h-2 w-2 rounded-full bg-[#B38E4A] shadow" />
          <div className="pointer-events-none absolute top-2 right-2 h-2 w-2 rounded-full bg-[#B38E4A] shadow" />
        </div>
        {/* Content */}
        <div className="flex flex-col flex-grow p-6 md:p-8">
          <div className="flex-grow">
            {/* Plaques */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-sm mb-4">
              <span className="inline-flex items-center gap-2 rounded-[10px] border border-[#D9CEB6] bg-[#F4F0E7] px-3 py-1 text-[#7A6E57]">
                <Calendar className="w-4 h-4 text-[#7D8C91]" />
                {endDate ? `${date} - ${endDate}` : date}
              </span>
              <span className="inline-flex items-center gap-2 rounded-[10px] border border-[#D9CEB6] bg-[#F4F0E7] px-3 py-1 text-[#7A6E57]">
                <MapPin className="w-4 h-4 text-[#7D8C91]" />
                {location}
              </span>
            </div>
            {/* Title */}
            <h3 className="font-headline text-[26px] md:text-[30px] tracking-[0.02em] mb-3 notranslate" translate="no" data-no-translate>
              <Link href={href} className="text-[#1d1d1d] hover:text-[#2a2a2a] transition notranslate" translate="no" data-no-translate>
                {name}
              </Link>
            </h3>
            {/* Description */}
            <p className="text-[#2a2a2a] line-clamp-3 leading-relaxed">
              {description}
            </p>
          </div>
          {/* CTA */}
          <div className="mt-7 flex justify-end">
            <Button asChild className="rounded-full bg-[#C3A76D] hover:bg-[#B99754] text-black font-semibold shadow-sm hover:shadow transition-all">
              <Link href={href}>
                View Event <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
