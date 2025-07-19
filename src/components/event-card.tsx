import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';

type EventCardProps = {
  name: string;
  date: string;
  location: string;
  image: string;
  hint: string;
};

export default function EventCard({ name, date, location, image, hint }: EventCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col group border-0 shadow-lg rounded-xl">
      <CardHeader className="p-0">
        <div className="relative aspect-video overflow-hidden rounded-t-xl">
          <Image src={image} alt={name} fill objectFit="cover" className="group-hover:scale-105 transition-transform duration-300" data-ai-hint={hint}/>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow bg-card">
        <h3 className="text-lg font-headline font-semibold leading-tight text-foreground truncate">{name}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
          <Calendar className="w-4 h-4" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 bg-card rounded-b-xl">
        <Button asChild className="w-full font-bold rounded-full">
          <Link href="#">View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
