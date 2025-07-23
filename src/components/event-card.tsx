import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type EventCardProps = {
  id: number; // Add id to props
  name: string;
  date: string;
  location: string;
  image: string;
  hint: string;
  featured?: boolean;
};

export default function EventCard({ id, name, date, location, image, hint, featured }: EventCardProps) {
  return (
    <Link href={`/events/${id}`} passHref>
      <Card className="overflow-hidden flex flex-col group bg-transparent border-0 shadow-none rounded-none cursor-pointer">
          <div className="relative overflow-hidden rounded-2xl">
            <Image src={image} alt={name} width={600} height={400} className="object-cover aspect-video w-full group-hover:scale-105 transition-transform duration-500 ease-in-out" data-ai-hint={hint}/>
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
            {featured && (
              <div className="absolute top-3 left-3 z-10">
                <span className="inline-flex items-center rounded-full bg-yellow-400 text-black px-3 py-1 text-xs font-bold shadow-lg animate-pulse">Featured</span>
              </div>
            )}
          </div>
          <CardContent className="p-0 pt-5 flex-grow flex flex-col">
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>{location}</span>
                  </div>
              </div>
              <h3 className="text-xl font-headline font-bold leading-tight text-foreground group-hover:text-primary transition-colors flex-grow">{name}</h3>
              <div className="flex justify-end items-center mt-auto pt-4">
                  {/* Arrow icon remains, but the whole card is now the link */}
                  <div className="p-2 -mr-2">
                    <ArrowRight className="w-6 h-6 transform group-hover:translate-x-1 transition-transform"/>
                    <span className="sr-only">View Details</span>
                  </div>
              </div>
        </CardContent>
      </Card>
    </Link>
  );
}