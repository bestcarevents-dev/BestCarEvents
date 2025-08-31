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
    <Card className="w-full overflow-hidden rounded-2xl border border-white/20 bg-white/70 backdrop-blur-sm shadow-md hover:shadow-2xl transition-all duration-500">
      <div className="flex flex-col md:flex-row">
        <div className="relative w-full md:w-1/3 aspect-video md:aspect-auto shrink-0">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            data-ai-hint={hint}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 opacity-80" />
        </div>
        <div className="flex flex-col flex-grow p-6 md:p-8">
          <div className="flex-grow">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700 mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-600" />
                <span>{date}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-yellow-600" />
                <span>{location}</span>
              </div>
            </div>
            <h3 className="font-headline font-extrabold text-2xl md:text-3xl text-gray-900 mb-3 tracking-tight">
              <Link href={href} className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent hover:from-gray-900 hover:to-gray-700 transition-colors">{name}</Link>
            </h3>
            <p className="text-gray-700 line-clamp-2 leading-relaxed">{description}</p>
          </div>
          <div className="mt-6 flex justify-end">
            <Button asChild variant="outline" className="rounded-full border border-yellow-500/30 text-gray-800 hover:text-gray-900 bg-white/70 hover:bg-white shadow-sm hover:shadow-md transition-all">
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
