import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Mail, Globe, Linkedin, Facebook, Users } from "lucide-react";

const whyJoin = [
  "Targeted Audience: Gain direct access to an exclusive community of high-standard car collectors who are always on the lookout for premium events, clubs, auctions, and hotels.",
  "Enhanced Visibility: Promote your offerings on a dedicated platform visited by car enthusiasts and collectors.",
  "Increased Engagement: Our strategic marketing tools, including banners and weekly newsletters, ensure high visibility and engagement.",
  "Reputable Platform: Align your brand with a trusted and respected name in the car collector community.",
  "Customized Marketing: Tailor your promotional efforts to meet the specific needs and interests of a niche market."
];

const pricingPlans = [
  {
    title: "Banner Advertisement",
    options: [
      {
        name: "Homepage Banner (All Pages + Category)",
        duration: "1 year",
        price: "CHF/EUR 6’000",
        details: "Homepage banner will be exposed on every side of the website plus in your category."
      },
      {
        name: "Category Page Banner",
        duration: "1 year",
        price: "CHF/EUR 2’500",
        details: "Event/Club/Hotel/Auction page banner only on the page of your category."
      }
    ]
  },
  {
    title: "Event/Club/Hotel/Auction Listing",
    options: [
      {
        name: "Featured Listing",
        duration: "1 year",
        price: "CHF/EUR 4’800",
        details: "Only one or two per category. Photos exposed in the slideshow on the website, under their category and on the home site."
      },
      {
        name: "Standard Listing",
        duration: "1 month",
        price: "CHF/EUR 400",
        details: "Standard listing in your category."
      }
    ]
  },
  {
    title: "Newsletter Mentions (2 per month, 12 months)",
    options: [
      {
        name: "Premium Mention",
        duration: "Per mention per month",
        price: "CHF/EUR 600",
        details: "Dedicated section with up to 4 images, description, and a link to your website."
      },
      {
        name: "Standard Mention",
        duration: "Per mention per month",
        price: "CHF/EUR 400",
        details: "Brief mention with one image and a link to your website."
      }
    ]
  }
];

const packages = [
  {
    name: "Gold Package",
    price: "CHF/EUR 15'300",
    oldPrice: "CHF/EUR 18'000",
    perMonth: "CHF/EUR 1’275",
    savings: "save over 15%",
    features: [
      "Homepage banner on every side, plus your category (worth CHF/EUR 6'000) and on the newsletter for 1 year",
      "Featured listing for 1 year (worth CHF/EUR 4'800)",
      "Premium mention in newsletter 4 times per month for 12 months (worth CHF/EUR 7'200)"
    ]
  },
  {
    name: "Silver Package",
    price: "CHF/EUR 10'800",
    oldPrice: "CHF/EUR 12'100",
    perMonth: "CHF/EUR 900",
    savings: "save over 10%",
    features: [
      "Homepage banner for 1 year (worth CHF/EUR 2'500)",
      "Standard listing for 1 year (worth CHF/EUR 4'800)",
      "Standard mention in newsletter 4 times per month for 12 months (worth CHF/EUR 4'800)"
    ]
  }
];

const whyChoose = [
  {
    title: "Homepage banner",
    desc: "Ideal for maximum exposure, reaching all site visitors."
  },
  {
    title: "Event/Club/Hotel/Auction page banner",
    desc: "Targeted visibility on relevant pages, ensuring your advertisement reaches the right audience."
  },
  {
    title: "Featured listing",
    desc: "Stand out among other listings, attracting more attention and clicks."
  },
  {
    title: "Newsletter mentions",
    desc: "Engage directly with our community through our highly-read newsletters."
  }
];

const networks = [
  {
    icon: <Globe className="w-6 h-6 text-primary" />,
    label: "Instagram",
    url: "https://www.instagram.com/luxelifestylemotors/",
    desc: "with almost 3'000 selected car enthusiastic followers"
  },
  {
    icon: <Linkedin className="w-6 h-6 text-primary" />,
    label: "LinkedIn Group",
    url: "https://www.linkedin.com/groups/4037474/",
    desc: "with almost 6'000 selected car enthusiastic followers"
  },
  {
    icon: <Facebook className="w-6 h-6 text-primary" />,
    label: "Facebook Group",
    url: "https://www.facebook.com/groups/107019762698741",
    desc: "with over 5'000 selected car enthusiastic followers"
  },
  {
    icon: <Users className="w-6 h-6 text-primary" />,
    label: "WhatsApp Group",
    url: "#",
    desc: "with selected car enthusiastic"
  }
];

export default function AdvertisePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Why Join Section */}
      <Card className="mb-12 p-8 bg-gradient-to-br from-primary/10 via-background to-accent/10 shadow-xl animate-fade-in-up">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-3xl font-headline text-primary mb-2 animate-fade-in-up">Why Join BEST CAR EVENTS?</CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-4 space-y-4">
          {whyJoin.map((item, i) => (
            <div key={i} className="flex items-start gap-3 animate-fade-in-up">
              <Star className="w-5 h-5 text-primary mt-1" />
              <span className="font-medium text-base text-foreground">{item}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pricing Plans Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold font-headline text-center mb-10">Pricing Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan) => (
            <Card key={plan.title} className="flex flex-col h-full">
              <CardHeader>
                <CardTitle className="text-xl font-headline text-primary">{plan.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow space-y-6">
                {plan.options.map((opt, idx) => (
                  <div key={idx} className="bg-muted/40 rounded-lg p-4 mb-2">
                    <div className="font-semibold text-lg text-foreground">{opt.name}</div>
                    <div className="text-muted-foreground text-sm mb-1">{opt.details}</div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="inline-block bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-sm">{opt.duration}</span>
                      <span className="inline-block bg-accent/20 text-foreground font-bold px-3 py-1 rounded-full text-sm">{opt.price}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Special Packages Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold font-headline text-center mb-10">Special Packages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {packages.map((pkg) => (
            <Card key={pkg.name} className="border-2 border-primary shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline text-primary">{pkg.name}</CardTitle>
                <CardDescription className="text-lg mt-2">
                  <span className="line-through text-muted-foreground mr-2">{pkg.oldPrice}</span>
                  <span className="text-foreground font-bold text-2xl">{pkg.price}</span>
                  <span className="ml-2 text-primary font-semibold">({pkg.perMonth}/mo)</span>
                  <span className="ml-2 text-green-600 font-semibold">{pkg.savings}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 mt-4">
                {pkg.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Star className="w-5 h-5 text-primary mt-1" />
                    <span className="text-base text-foreground">{f}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Why Choose Section */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold font-headline text-center mb-8">Why choose these options?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {whyChoose.map((item, i) => (
            <Card key={i} className="bg-muted/40">
              <CardHeader>
                <CardTitle className="text-lg font-headline text-primary mb-1">{item.title}</CardTitle>
                <CardDescription>{item.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Social Networks Section */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold font-headline text-center mb-8">We also publicise your event, hotel, club or auction over these networks:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {networks.map((net, i) => (
            <a key={i} href={net.url} target="_blank" rel="noopener noreferrer">
              <Card className="flex flex-col items-center p-6 hover:shadow-xl transition-shadow">
                <div className="mb-3">{net.icon}</div>
                <div className="font-semibold text-lg text-foreground mb-1">{net.label}</div>
                <div className="text-muted-foreground text-sm text-center">{net.desc}</div>
              </Card>
            </a>
          ))}
        </div>
      </div>

      {/* Custom Offer & Contact Section */}
      <Card className="text-center p-8 bg-card rounded-lg mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline">Not satisfied with the offers?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">Please feel free to make your own offer, for us it’s important to have you on board.</p>
          <p className="text-lg font-semibold mb-6">Join us today and connect with an elite audience of car collectors and enthusiasts. Promote your events, clubs, hotels, or auctions in a way that ensures high visibility and engagement.</p>
          <Button size="lg" asChild className="font-bold rounded-full" >
            <a href="mailto:info@bestcarevents.com"><Mail className="mr-2" />Contact Us: info@bestcarevents.com</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
