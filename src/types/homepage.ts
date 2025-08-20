export type HeroSlide = {
  headline: string;
  subheadline: string;
  image: string;
  hint?: string;
};

export type PromoContent = {
  badgeText: string;
  mainHeading: string;
  chips: string[];
  carsLinePrefix: string; // e.g., "Cars:"
  carsLineHighlight: string; // e.g., "2 months free"
  ctaLabel: string;
  ctaHref: string;
};

export type ValuePropositionItem = {
  title: string;
  description: string;
};

export type ValuePropositionContent = {
  heading: string;
  description: string;
  items: ValuePropositionItem[]; // expected length 3
};

export type SectionCopy = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

export type GallerySectionCopy = {
  title: string;
  layout?: 'random' | 'simple';
};

export type VideoSectionCopy = {
  title: string;
  text: string;
};

export type HomepageContent = {
  hero?: { slides: HeroSlide[] };
  promo?: PromoContent;
  value?: ValuePropositionContent;
  featuredCars?: SectionCopy;
  featuredEvents?: SectionCopy;
  featuredAuctions?: SectionCopy;
  featuredHotels?: SectionCopy;
  featuredClubs?: SectionCopy;
  featuredServices?: SectionCopy;
  video?: VideoSectionCopy;
  galleries?: {
    main?: GallerySectionCopy;
    location1?: GallerySectionCopy;
    location2?: GallerySectionCopy;
  };
}; 