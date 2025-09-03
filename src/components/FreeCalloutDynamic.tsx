"use client";

import { useEffect, useState } from "react";
import FreeCallout from "@/components/free-callout";
import { fetchFreeCallout, defaultFreeCallouts, type FreeCalloutSection, type FreeCalloutContent } from "@/lib/freeCallout";

type Props = {
  section: FreeCalloutSection;
  className?: string;
};

export default function FreeCalloutDynamic({ section, className }: Props) {
  const [content, setContent] = useState<FreeCalloutContent>(defaultFreeCallouts[section]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await fetchFreeCallout(section);
        if (isMounted) setContent(data);
      } catch {
        // ignore, default content already set
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [section]);

  return (
    <div className="mb-8">
      <FreeCallout
        title={content.title}
        icon={content.icon}
        messages={content.messages}
        ctaHref={content.ctaHref}
        ctaText={content.ctaText}
        className={className}
      />
    </div>
  );
}


