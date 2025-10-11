export type ImpressumSection = {
  id: string;
  title: string;
  content: string;
};

export type ImpressumDoc = {
  title: string;
  subtitle?: string;
  sections: ImpressumSection[];
  updatedAt: number;
};


