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
    <Card className="group relative w-full overflow-hidden rounded-[18px] border border-[#C7BCA3]/70 bg-gradient-to-br from-[#FAF7EE] via-[#F3EADA] to-[#ECE3D1] shadow-[0_8px_28px_rgba(0,0,0,0.10)] transition-all duration-500 hover:shadow-[0_16px_44px_rgba(0,0,0,0.18)]">
      {/* Subtle luxury vignette */}
      <div className="pointer-events-none absolute inset-0 opacity-60 bg-[radial-gradient(90%_80%_at_80%_10%,rgba(255,255,255,0.6)_0%,rgba(255,255,255,0)_55%)]" />
      {/* Corner studs */}
      <div className="pointer-events-none absolute top-2 left-2 h-2 w-2 rounded-full bg-[#B38E4A]/70 shadow" />
      <div className="pointer-events-none absolute top-2 right-2 h-2 w-2 rounded-full bg-[#B38E4A]/70 shadow" />
      <div className="pointer-events-none absolute bottom-2 left-2 h-2 w-2 rounded-full bg-[#B38E4A]/70 shadow" />
      <div className="pointer-events-none absolute bottom-2 right-2 h-2 w-2 rounded-full bg-[#B38E4A]/70 shadow" />
      <div className="flex flex-col md:flex-row">
        {/* Framed image with brass bevel and film-grain feel */}
        <div className="relative w-full md:w-2/5 aspect-video md:aspect-[4/3] shrink-0 bg-[#EDE7DA]">
          {/* Outer frame */}
          <div className="absolute inset-0 m-4 rounded-[14px] border border-[#9E8653] bg-gradient-to-br from-[#2a2a2a] to-[#111] p-[6px]">
            {/* Inner bevel */}
            <div className="relative h-full w-full rounded-[10px] border border-[#C9B37E]/70 bg-[#0e0e0e] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover w-full h-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
              data-ai-hint={hint}
            />
            {/* Light sweep */}
            <div className="pointer-events-none absolute -inset-y-8 -left-1/3 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1400ms] ease-out skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_70%_20%,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_60%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-[#D9B970] via-[#F1DA99] to-[#C9962D] opacity-95" />
            </div>
          </div>
          {featured && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center rounded-full bg-[#F1DA99] text-black px-3 py-1 text-xs font-bold shadow ring-1 ring-black/10">Featured</span>
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
            <h3 className="mt-1 text-[30px] md:text-[36px] leading-tight font-headline font-extrabold tracking-[-0.01em] bg-gradient-to-r from-[#121212] via-[#1f1f1f] to-[#121212] bg-clip-text text-transparent">
              {name}
            </h3>
            <p className="mt-3 text-[24px] font-mono font-bold bg-gradient-to-r from-[#D9B970] via-[#F1DA99] to-[#C9962D] bg-clip-text text-transparent drop-shadow-[0_1px_0_rgba(0,0,0,0.15)]">
              {price}
            </p>

            {/* Spec plaques */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {specs.map((spec) => {
                const Icon = iconMap[spec.name] || Zap;
                return (
                  <div key={spec.name} className="flex items-center gap-3 rounded-[12px] border border-[#C9B37E] bg-gradient-to-b from-[#F6F1E5] to-[#EDE2C9] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_0_rgba(0,0,0,0.06)]">
                    <Icon className="w-5 h-5 text-[#6B7C80]" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[#7A6E57]">{spec.name}</p>
                      <p className="text-[17px] font-semibold text-[#232323]">{spec.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-7 flex justify-end">
            <Button asChild className="rounded-full bg-[#111111] hover:bg-black text-white font-semibold shadow-md hover:shadow-lg transition-all ring-1 ring-[#D9B970]/60">
              <Link href="/cars">
                View Listing <ArrowRight className="ml-2 h-4 w-4 text-[#F1DA99] transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
