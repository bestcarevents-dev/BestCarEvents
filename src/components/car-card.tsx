import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatPrice as formatPriceUtil } from '@/lib/utils';


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
  const displayPrice = formatPriceUtil(price);
  return (
    <Card className={`overflow-hidden flex flex-col group rounded-[18px] ${type === 'auction' ? 'border border-[#C7BCA3]/50 bg-[#F8F6F1] shadow-[0_6px_24px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.14)]' : 'border border-white/20 bg-white/70 backdrop-blur-sm shadow-md hover:shadow-2xl'} transition-all duration-500`}>
      <div className="relative overflow-hidden rounded-2xl bg-[#EDE7DA]">
        {type !== 'auction' && (
          <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(65%_140%_at_85%_10%,rgba(255,255,255,0.65)_0%,rgba(255,255,255,0)_60%)]" />
        )}
        {type === 'auction' ? (
          <div className="m-3 rounded-[14px] border border-[#B49A6A]/50 overflow-hidden shadow-inner">
            <div className="relative aspect-video bg-[#EDE7DA]">
              <Image src={image} alt={name} fill className="object-contain w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.06]" data-ai-hint={hint} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_70%_20%,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_60%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#C3A76D] via-[#E7D08A] to-[#B98A2A] opacity-90" />
          </div>
        ) : (
          <Image src={image} alt={name} width={600} height={400} className="object-cover aspect-video w-full transition-transform duration-700 ease-out group-hover:scale-[1.06]" data-ai-hint={hint} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        )}
        {type !== 'auction' && <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />}
        {featured && (
          <div className="absolute top-3 left-3 z-10">
            <span className={`inline-flex items-center rounded-full ${type === 'auction' ? 'bg-[#E7D08A] text-black ring-1 ring-black/10' : 'bg-yellow-400 text-black ring-1 ring-black/10'} px-3 py-1 text-xs font-bold shadow-lg`}>Featured</span>
          </div>
        )}
        {type !== 'auction' && <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 opacity-80" />}
      </div>
      <CardContent className="p-5 sm:p-6 flex-grow flex flex-col">
        <h3 className="text-xl sm:text-[1.35rem] font-headline leading-tight tracking-[0.02em] text-[#1f1f1f] notranslate" translate="no" data-no-translate>
          <span className="text-[#1f1f1f] group-hover:opacity-90 transition-opacity notranslate" translate="no" data-no-translate>{name}</span>
        </h3>
        <div className="flex justify-between items-center mt-auto pt-4">
            <p className={`text-2xl font-semibold ${type === 'auction' ? 'text-[#2a2a2a]' : 'text-[#2a2a2a]'}`}>{displayPrice}</p>
            <Button variant="ghost" size="icon" asChild className={`${type === 'auction' ? 'rounded-full border border-[#D9CEB6] text-[#1f1f1f] hover:bg-[#F8F6F1]' : 'rounded-full border border-yellow-500/30 text-gray-800 hover:text-gray-900 bg-white/70 hover:bg-white shadow-sm hover:shadow-md'} transition-all`}>
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
