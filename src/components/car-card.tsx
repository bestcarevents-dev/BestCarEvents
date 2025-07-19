import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

type CarCardProps = {
  name: string;
  price: string;
  location: string;
  image: string;
  hint: string;
};

export default function CarCard({ name, price, location, image, hint }: CarCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col group">
      <CardHeader className="p-0">
        <div className="relative aspect-video">
          <Image src={image} alt={name} layout="fill" objectFit="cover" className="group-hover:scale-105 transition-transform duration-300" data-ai-hint={hint} />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-headline leading-tight">{name}</CardTitle>
        <p className="text-xl font-bold text-primary mt-2">${price}</p>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full font-bold">View Details</Button>
      </CardFooter>
    </Card>
  );
}
