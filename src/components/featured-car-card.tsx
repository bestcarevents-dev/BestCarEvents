import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Zap, Gauge, Rocket } from 'lucide-react';
import Link from 'next/link';

type CarSpec = {
  name: string;
  value: string;
};

type FeaturedCarCardProps = {
  name: string;
  year: string;
  price: string;
  image: string;
  hint: string;
  specs: CarSpec[];
  featured?: boolean;
};

const iconMap: { [key: string]: React.ElementType } = {
  "0-60 mph": Rocket,
  "Horsepower": Zap,
  "Top Speed": Gauge,
};

export default function FeaturedCarCard({ name, year, price, image, hint, specs, featured = false }: FeaturedCarCardProps) {
  return (
    <Card className="w-full overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl bg-card group">
      <div className="flex flex-col md:flex-row">
        <div className="relative w-full md:w-2/5 aspect-video md:aspect-[4/3] shrink-0">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover w-full h-full transition-transform duration-500 ease-in-out group-hover:scale-105"
            data-ai-hint={hint}
          />
          {featured && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center rounded-full bg-yellow-400 text-black px-3 py-1 text-xs font-bold shadow-lg animate-pulse">Featured</span>
            </div>
          )}
        </div>
        <div className="flex flex-col flex-grow p-6 md:p-8">
          <div className="flex-grow">
            <span className="font-semibold text-primary">{year}</span>
            <h3 className="text-3xl lg:text-4xl font-headline font-extrabold text-foreground mt-1">{name}</h3>
            <p className="text-2xl font-mono font-bold text-primary mt-4">{price}</p>
            
            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {specs.map((spec) => {
                  const Icon = iconMap[spec.name] || Zap;
                  return (
                    <div key={spec.name} className="flex items-center gap-3">
                      <Icon className="w-7 h-7 text-primary/80" />
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">{spec.name}</p>
                        <p className="text-xl font-bold text-foreground">{spec.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button asChild>
              <Link href="/cars">
                View Listing <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
