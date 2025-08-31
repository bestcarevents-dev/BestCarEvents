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
    <Card className="overflow-hidden flex flex-col group rounded-2xl border border-white/20 bg-white/70 backdrop-blur-sm shadow-md hover:shadow-2xl transition-all duration-500">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(65%_140%_at_85%_10%,rgba(255,255,255,0.65)_0%,rgba(255,255,255,0)_60%)]" />
        <Image src={image} alt={name} width={600} height={400} className="object-cover aspect-video w-full transition-transform duration-700 ease-out group-hover:scale-[1.06]" data-ai-hint={hint} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
        {featured && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center rounded-full bg-yellow-400 text-black px-3 py-1 text-xs font-bold shadow-lg ring-1 ring-black/10">Featured</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 opacity-80" />
      </div>
      <CardContent className="p-5 sm:p-6 flex-grow flex flex-col">
        <h3 className="text-xl sm:text-[1.35rem] font-headline font-extrabold leading-tight text-gray-900 tracking-tight">
          <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent group-hover:from-gray-900 group-hover:to-gray-700 transition-colors">{name}</span>
        </h3>
        <div className="flex justify-between items-center mt-auto pt-4">
            <p className="text-2xl font-mono font-bold bg-gradient-to-r from-yellow-500 to-amber-400 bg-clip-text text-transparent drop-shadow-sm">{price}</p>
            <Button variant="ghost" size="icon" asChild className="rounded-full border border-yellow-500/30 text-gray-800 hover:text-gray-900 bg-white/70 hover:bg-white shadow-sm hover:shadow-md transition-all">
              <Link href={`/${type === 'auction' ? 'auctions' : 'cars'}/${id}`}>
                <ArrowRight className="w-6 h-6 transform transition-transform group-hover:translate-x-1"/>
                <span className="sr-only">View Details</span>
              </Link>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
