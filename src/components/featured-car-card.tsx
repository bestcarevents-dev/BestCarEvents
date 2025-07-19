import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Gauge, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
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
};

const iconMap: { [key: string]: React.ElementType } = {
  "0-60 mph": Rocket,
  "Horsepower": Zap,
  "Top Speed": Gauge,
};

export default function FeaturedCarCard({ name, year, price, image, hint, specs }: FeaturedCarCardProps) {
  return (
    <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl group">
      <Image
        src={image}
        alt={name}
        fill
        className="object-cover w-full h-full transition-transform duration-500 ease-in-out group-hover:scale-105"
        data-ai-hint={hint}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      
      <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 text-white">
        <div className="w-full">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="max-w-xl">
              <span className="text-lg font-semibold text-primary">{year}</span>
              <h3 className="text-4xl lg:text-5xl font-headline font-extrabold text-white text-shadow-lg mt-1">{name}</h3>
              <p className="text-3xl font-mono font-bold text-primary mt-4">${parseInt(price).toLocaleString()}</p>
            </div>
            
            <div className="flex-shrink-0">
              <Button size="lg" asChild className="font-bold rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white hover:text-black transition-all duration-300 group-hover:shadow-lg">
                  <Link href="/cars">View Listing <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" /></Link>
              </Button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/20">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {specs.map((spec) => {
                const Icon = iconMap[spec.name] || Zap;
                return (
                  <div key={spec.name} className="flex items-center gap-3">
                    <Icon className="w-7 h-7 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-white/80">{spec.name}</p>
                      <p className="text-xl font-bold text-white">{spec.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
