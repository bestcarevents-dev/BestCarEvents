export type StaticPageKey = "about" | "contact" | "privacy";

export type PageImage = {
  url: string;
  alt?: string;
};

export type BaseStaticPageContent = {
  title: string;
  subtitle?: string;
  quote?: string;
  body: string;
  images: PageImage[];
  updatedAt?: number;
};

export type ContactDetails = {
  email?: string;
  phone?: string;
  address?: string;
  mapEmbedUrl?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  youtube?: string;
  twitter?: string;
  website?: string;
  tiktok?: string;
  telegram?: string;
  whatsapp?: string;
};

export type StaticPageContent = BaseStaticPageContent & {
  contact?: ContactDetails;
};

export type StaticPagesDocument = Record<StaticPageKey, StaticPageContent>;


