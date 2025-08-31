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
    <Card className="w-full overflow-hidden rounded-2xl shadow-md transition-all duration-500 hover:shadow-2xl bg-white/70 backdrop-blur-sm border border-white/30 group">
      <div className="flex flex-col md:flex-row">
        <div className="relative w-full md:w-2/5 aspect-video md:aspect-[4/3] shrink-0">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            data-ai-hint={hint}
          />
          {featured && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center rounded-full bg-yellow-400 text-black px-3 py-1 text-xs font-bold shadow-lg ring-1 ring-black/10">Featured</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 opacity-90" />
        </div>
        <div className="flex flex-col flex-grow p-6 md:p-8">
          <div className="flex-grow">
            <span className="font-semibold text-[#80A0A9]">{year}</span>
            <h3 className="text-3xl lg:text-4xl font-headline font-extrabold text-gray-900 mt-1 tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">{name}</h3>
            <p className="text-2xl font-mono font-bold mt-4 bg-gradient-to-r from-yellow-500 to-amber-400 bg-clip-text text-transparent">{price}</p>
            
            <div className="mt-6 pt-6 border-t border-[#E0D8C1]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {specs.map((spec) => {
                  const Icon = iconMap[spec.name] || Zap;
                  return (
                    <div key={spec.name} className="flex items-center gap-3">
                      <Icon className="w-7 h-7 text-[#80A0A9]" />
                      <div>
                        <p className="text-sm font-semibold text-gray-600">{spec.name}</p>
                        <p className="text-xl font-bold text-gray-900">{spec.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button asChild className="rounded-full bg-[#80A0A9] hover:bg-[#80A0A9]/90 text-white shadow-sm hover:shadow-md transition-all">
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
