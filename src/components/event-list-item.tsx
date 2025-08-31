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
  location: string;
  image: string;
  hint: string;
  description: string;
};

export default function EventListItem({ id, documentId, name, date, location, image, hint, description }: EventListItemProps) {
  const resolvedId = typeof documentId !== 'undefined' ? documentId : (typeof id !== 'undefined' ? String(id) : '');
  const href = resolvedId ? `/events/${resolvedId}` : '/events';
  return (
    <Card className="w-full overflow-hidden rounded-[18px] border border-[#C7BCA3]/50 bg-[#F8F6F1] shadow-[0_6px_24px_rgba(0,0,0,0.08)] transition-all duration-500 hover:shadow-[0_12px_36px_rgba(0,0,0,0.14)]">
      <div className="flex flex-col md:flex-row">
        {/* Framed image */}
        <div className="relative w-full md:w-1/3 aspect-video md:aspect-auto shrink-0 bg-[#EDE7DA]">
          <div className="absolute inset-0 m-4 rounded-[12px] border border-[#B49A6A]/50 overflow-hidden shadow-inner bg-gradient-to-br from-[#0b0b0b] to-[#1c1c1c]">
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
              data-ai-hint={hint}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_70%_20%,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_60%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#C3A76D] via-[#E7D08A] to-[#B98A2A] opacity-90" />
          </div>
        </div>
        {/* Content */}
        <div className="flex flex-col flex-grow p-6 md:p-8">
          <div className="flex-grow">
            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-sm mb-3">
              <span className="inline-flex items-center gap-2 rounded-[10px] border border-[#D9CEB6] bg-[#F4F0E7] px-3 py-1 text-[#7A6E57]">
                <Calendar className="w-4 h-4 text-[#7D8C91]" />
                {date}
              </span>
              <span className="inline-flex items-center gap-2 rounded-[10px] border border-[#D9CEB6] bg-[#F4F0E7] px-3 py-1 text-[#7A6E57]">
                <MapPin className="w-4 h-4 text-[#7D8C91]" />
                {location}
              </span>
            </div>
            <h3 className="font-headline font-extrabold text-2xl md:text-3xl tracking-[-0.01em] mb-3">
              <Link href={href} className="bg-gradient-to-r from-[#1d1d1d] via-[#2a2a2a] to-[#1d1d1d] bg-clip-text text-transparent hover:opacity-90 transition">
                {name}
              </Link>
            </h3>
            <p className="text-gray-700 line-clamp-2 leading-relaxed">{description}</p>
          </div>
          <div className="mt-6 flex justify-end">
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
