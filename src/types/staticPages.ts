export type StaticPageKey = "about" | "contact";

export type PageImage = {
  url: string;
  alt?: string;
};

export type BaseStaticPageContent = {
  title: string;
  subtitle?: string;
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
};

export type StaticPageContent = BaseStaticPageContent & {
  contact?: ContactDetails;
};

export type StaticPagesDocument = Record<StaticPageKey, StaticPageContent>;


