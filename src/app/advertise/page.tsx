import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const pricingTiers = [
  {
    name: "Homepage Banner",
    price: "$299",
    period: "/ mo",
    features: [
      "Prominent top-of-page placement",
      "High visibility to all visitors",
      "Ideal for brand awareness",
      "Weekly performance report",
    ],
    cta: "Get Started",
  },
  {
    name: "Featured Listing",
    price: "$99",
    period: "/ listing",
    features: [
      "Top placement in search results",
      "Highlighted for 30 days",
      "Increased visibility and clicks",
      "Perfect for selling a car quickly",
    ],
    cta: "Choose Plan",
    popular: true,
  },
  {
    name: "Event Sponsorship",
    price: "$499",
    period: "/ event",
    features: [
      "Your brand featured on event pages",
      "Targeted audience of enthusiasts",
      "Logo on event materials",
      "Direct link to your website",
    ],
    cta: "Contact Us",
  },
];

export default function AdvertisePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold font-headline">Advertise With Us</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Reach thousands of dedicated car enthusiasts and collectors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16">
        {pricingTiers.map((tier) => (
          <Card key={tier.name} className={`flex flex-col ${tier.popular ? 'border-primary' : ''}`}>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-headline">{tier.name}</CardTitle>
              <CardDescription>
                <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                <span className="text-muted-foreground">{tier.period}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-4">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 mt-1 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <div className="p-6">
              <Button className="w-full" variant={tier.popular ? 'default' : 'outline'}>
                {tier.cta}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <div className="text-center mt-16 bg-card p-8 rounded-lg">
        <h2 className="text-3xl font-bold font-headline">Have a custom request?</h2>
        <p className="text-muted-foreground mt-2">We offer custom packages for large-scale advertisers and partners.</p>
        <Button size="lg" className="mt-6">Contact Sales</Button>
      </div>
    </div>
  );
}
