import Image from 'next/image';
import { Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';

export type EventListItemProps = {
  id: number;
  name: string;
  date: string;
  location: string;
  image: string;
  hint: string;
  description: string;
};

export default function EventListItem({ name, date, location, image, hint, description }: EventListItemProps) {
  return (
    <Link href="/events" className="block w-full">
      <div className="flex items-start gap-4 p-4 rounded-2xl border border-border hover:bg-muted/50 transition-colors duration-300">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
          <Image
            src={image}
            alt={name}
            fill
            className="rounded-xl object-cover"
            data-ai-hint={hint}
          />
        </div>
        <div className="flex-grow">
          <h3 className="font-headline font-semibold text-lg text-foreground">{name}</h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{description}</p>
        </div>
      </div>
    </Link>
  );
}