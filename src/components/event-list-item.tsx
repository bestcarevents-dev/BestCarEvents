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
    <Card className="w-full overflow-hidden shadow-lg transition-shadow duration-300 hover:shadow-2xl bg-white border-gray-200">
      <div className="flex flex-col md:flex-row">
        <div className="relative w-full md:w-1/3 aspect-video md:aspect-auto shrink-0">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
            data-ai-hint={hint}
          />
        </div>
        <div className="flex flex-col flex-grow p-6 md:p-8">
          <div className="flex-grow">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-600" />
                <span>{date}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-yellow-600" />
                <span>{location}</span>
              </div>
            </div>
            <h3 className="font-headline font-bold text-2xl text-gray-900 mb-3">
              <Link href={href} className="hover:text-yellow-600 transition-colors">{name}</Link>
            </h3>
            <p className="text-gray-600 line-clamp-2 leading-relaxed">{description}</p>
          </div>
          <div className="mt-6 flex justify-end">
            <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
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
