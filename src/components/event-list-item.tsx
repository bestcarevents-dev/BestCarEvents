import Image from 'next/image';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

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
    <Card className="w-full overflow-hidden shadow-lg transition-shadow duration-300 hover:shadow-2xl bg-card">
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
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{date}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{location}</span>
              </div>
            </div>
            <h3 className="font-headline font-bold text-2xl text-foreground mb-3">
              <Link href="/events" className="hover:text-primary transition-colors">{name}</Link>
            </h3>
            <p className="text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
          </div>
          <div className="mt-6 flex justify-end">
            <Button asChild variant="outline">
              <Link href="/events">
                View Event <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
