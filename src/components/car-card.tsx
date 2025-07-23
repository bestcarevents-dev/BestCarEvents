import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type CarCardProps = {
  id: string;
  name: string;
  price: string;
  location: string;
  image: string;
  hint: string;
  type?: 'car' | 'auction';
  featured?: boolean;
};

export default function CarCard({ id, name, price, location, image, hint, type = 'car', featured }: CarCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col group bg-transparent border-0 shadow-none rounded-none">
      <div className="relative overflow-hidden rounded-2xl">
        <Image src={image} alt={name} width={600} height={400} className="object-cover aspect-video w-full group-hover:scale-105 transition-transform duration-500 ease-in-out" data-ai-hint={hint} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
        {featured && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center rounded-full bg-yellow-400 text-black px-3 py-1 text-xs font-bold shadow-lg animate-pulse">Featured</span>
          </div>
        )}
      </div>
      <CardContent className="p-0 pt-5 flex-grow flex flex-col">
        <h3 className="text-xl font-headline font-bold leading-tight text-foreground group-hover:text-primary transition-colors">{name}</h3>
        <div className="flex justify-between items-center mt-auto pt-4">
            <p className="text-2xl font-mono font-bold text-primary">{price}</p>
            <Button variant="ghost" size="icon" asChild>
                <Link href={`/${type === 'auction' ? 'auctions' : 'cars'}/${id}`}>
                    <ArrowRight className="w-6 h-6 transform group-hover:translate-x-1 transition-transform"/>
                    <span className="sr-only">View Details</span>
                </Link>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
