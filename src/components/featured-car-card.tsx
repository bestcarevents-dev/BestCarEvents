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
  id?: string;
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

function formatPriceDisplay(price: string): string {
  const match = price.match(/^(\D+)?\s*(\d[\d.,]*)/);
  if (!match) return price;
  const currency = (match[1] || '').trim();
  const numeric = match[2].replace(/[,\s]/g, '');
  const withCommas = Number(numeric).toLocaleString();
  return `${currency ? currency + ' ' : ''}${withCommas}`;
}

export default function FeaturedCarCard({ id, name, year, price, image, hint, specs, featured = false }: FeaturedCarCardProps) {
  const displayPrice = formatPriceDisplay(price);
  return (
    <Card className="group w-full overflow-hidden rounded-[18px] border border-[#C7BCA3]/50 bg-[#F8F6F1] shadow-[0_6px_24px_rgba(0,0,0,0.08)] transition-all duration-500 hover:shadow-[0_12px_36px_rgba(0,0,0,0.14)]">
      <div className="flex flex-col md:flex-row">
        {/* Framed image with brass bevel and film-grain feel */}
        <div className="relative w-full md:w-2/5 aspect-video md:aspect-[4/3] shrink-0 bg-[#EDE7DA]">
          <div className="absolute inset-0 m-4 rounded-[14px] border border-[#B49A6A]/50 shadow-inner bg-gradient-to-br from-[#0b0b0b] to-[#1c1c1c] overflow-hidden">
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover w-full h-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
              data-ai-hint={hint}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_70%_20%,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_60%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#C3A76D] via-[#E7D08A] to-[#B98A2A] opacity-90" />
          </div>
          {featured && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center rounded-full bg-[#E7D08A] text-black px-3 py-1 text-xs font-bold shadow ring-1 ring-black/10">Featured</span>
            </div>
          )}
        </div>

        {/* Content side: vintage type and plaques */}
        <div className="flex flex-col flex-grow p-6 md:p-8">
          <div className="flex-grow">
            <div className="flex items-baseline gap-3">
              <span className="font-semibold tracking-[0.08em] text-[#7D8C91]">{year}</span>
              <div className="h-[1px] w-8 bg-gradient-to-r from-[#C3A76D] to-transparent" />
            </div>
            <h3 className="mt-1 text-[28px] md:text-[34px] leading-tight font-headline font-extrabold tracking-[-0.01em] text-[#1e1e1e]">
              {name}
            </h3>
            <p className="mt-3 text-[22px] font-mono font-bold text-[#2a2a2a]">
              {displayPrice}
            </p>

            {/* Spec plaques */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {specs.map((spec) => {
                const Icon = iconMap[spec.name] || Zap;
                return (
                  <div key={spec.name} className="flex items-center gap-3 rounded-[12px] border border-[#D9CEB6] bg-[#F4F0E7] px-4 py-3 shadow-sm">
                    <Icon className="w-5 h-5 text-[#7D8C91]" />
                    <div>
                      <p className="text-[12px] uppercase tracking-[0.12em] text-[#7A6E57]">{spec.name}</p>
                      <p className="text-[16px] font-semibold text-[#232323]">{spec.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-7 flex justify-end">
            <Button asChild className="rounded-full bg-[#C3A76D] hover:bg-[#B99754] text-black font-semibold shadow-sm hover:shadow transition-all">
              <Link href={id ? `/cars/${id}` : '/cars'}>
                View Listing <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
