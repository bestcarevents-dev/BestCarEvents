"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Mail, Globe, Linkedin, Facebook, Users, Calendar, Image, Video, TrendingUp, Award, ChevronDown, ChevronUp, ArrowRight, LogIn, BarChart3, Car } from "lucide-react";
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { app } from "@/lib/firebase";
import Link from "next/link";

// Helper function to format prices with both CHF and EUR
const formatPrice = (chfPrice: string, eurPrice: string) => {
  return (
    <div className="flex flex-col items-center">
      <span className="font-bold text-lg">{chfPrice}</span>
      <span className="text-sm text-gray-600">{eurPrice}</span>
    </div>
  );
};

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
        chfPrice: "CHF 5'600",
        eurPrice: "EUR 6'000",
        details: "Homepage banner will be exposed on every side of the website plus in your category."
      },
      {
        name: "Category Page Banner",
        duration: "1 year",
        chfPrice: "CHF 2'300",
        eurPrice: "EUR 2'500",
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
        chfPrice: "CHF 4'400",
        eurPrice: "EUR 4'800",
        details: "Only one or two per category. Photos exposed in the slideshow on the website, under their category and on the home site."
      },
      {
        name: "Standard Listing",
        duration: "1 month",
        chfPrice: "CHF 370",
        eurPrice: "EUR 400",
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
        chfPrice: "CHF 550",
        eurPrice: "EUR 600",
        details: "Dedicated section with up to 4 images, description, and a link to your website."
      },
      {
        name: "Standard Mention",
        duration: "Per mention per month",
        chfPrice: "CHF 370",
        eurPrice: "EUR 400",
        details: "Brief mention with one image and a link to your website."
      }
    ]
  }
];

const packages = [
  {
    name: "Gold Package",
    chfPrice: "CHF 14'000",
    eurPrice: "EUR 15'300",
    oldChfPrice: "CHF 16'500",
    oldEurPrice: "EUR 18'000",
    perMonthChf: "CHF 1'167",
    perMonthEur: "EUR 1'275",
    savings: "save over 15%",
    features: [
      "Homepage banner on every side, plus your category (worth CHF 5'600 / EUR 6'000) and on the newsletter for 1 year",
      "Featured listing for 1 year (worth CHF 4'400 / EUR 4'800)",
      "Premium mention in newsletter 4 times per month for 12 months (worth CHF 6'600 / EUR 7'200)"
    ]
  },
  {
    name: "Silver Package",
    chfPrice: "CHF 9'900",
    eurPrice: "EUR 10'800",
    oldChfPrice: "CHF 11'100",
    oldEurPrice: "EUR 12'100",
    perMonthChf: "CHF 825",
    perMonthEur: "EUR 900",
    savings: "save over 10%",
    features: [
      "Homepage banner for 1 year (worth CHF 2'300 / EUR 2'500)",
      "Standard listing for 1 year (worth CHF 4'400 / EUR 4'800)",
      "Standard mention in newsletter 4 times per month for 12 months (worth CHF 4'400 / EUR 4'800)"
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
    icon: <Globe className="w-6 h-6 text-yellow-600" />,
    label: "Instagram",
    url: "https://www.instagram.com/luxelifestylemotors/",
    desc: "with almost 3'000 selected car enthusiastic followers"
  },
  {
    icon: <Linkedin className="w-6 h-6 text-yellow-600" />,
    label: "LinkedIn Group",
    url: "https://www.linkedin.com/groups/4037474/",
    desc: "with almost 6'000 selected car enthusiastic followers"
  },
  {
    icon: <Facebook className="w-6 h-6 text-yellow-600" />,
    label: "Facebook Group",
    url: "https://www.facebook.com/groups/107019762698741",
    desc: "with over 5'000 selected car enthusiastic followers"
  },
  {
    icon: <Users className="w-6 h-6 text-yellow-600" />,
    label: "WhatsApp Group",
    url: "#",
    desc: "with selected car enthusiastic"
  }
];

const carSalePricing = [
  {
    title: "Car Sale Listing Pricing",
    subtitle: "Introductory Offer: Free Listings until September 30th, 2025",
    plans: [
      {
        name: "Basic Listing",
        price: "CHF 39 / EUR 42",
        duration: "per month",
        features: [
          "Basic listing with essential details",
          "Car model and price information",
          "Up to 5 images",
          "Great visibility at an affordable price"
        ],
        icon: <Image className="w-5 h-5" />
      },
      {
        name: "Enhanced Listing",
        price: "CHF 69 / EUR 74",
        duration: "per month",
        features: [
          "Everything in Basic Listing, plus:",
          "Up to 10 images",
          "Priority placement on the website",
          "Visibility across social media platforms",
          "Instagram, Facebook, LinkedIn exposure"
        ],
        icon: <TrendingUp className="w-5 h-5" />
      },
      {
        name: "Premium Listing",
        price: "CHF 99 / EUR 107",
        duration: "per month",
        features: [
          "Everything in Enhanced Listing, plus:",
          "Professional video or virtual tour",
          "Priority placement on homepage",
          "Featured across all social media platforms",
          "Top-tier exposure and maximum visibility"
        ],
        icon: <Video className="w-5 h-5" />
      },
      {
        name: "Exclusive Banner Placement",
        price: "CHF 149 / EUR 161",
        duration: "per month",
        features: [
          "Prominent homepage banner placement",
          "Featured across key categories",
          "Maximum exposure to potential buyers",
          "Enhanced visibility for up to 30 days",
          "Premium positioning for serious sellers"
        ],
        icon: <Award className="w-5 h-5" />
      }
    ]
  }
];

const optionalAddons = [
  {
    name: "Featured in Newsletters",
    options: [
      {
        name: "Weekly Feature",
        price: "CHF 49 / EUR 53",
        duration: "per week",
        details: "Get featured in our weekly newsletter, reaching a curated list of luxury car enthusiasts and collectors."
      },
      {
        name: "Monthly Package",
        price: "CHF 179 / EUR 192",
        duration: "per month",
        details: "Special Offer: Save 10% when opting for the monthly package!",
        savings: "Save 10%"
      }
    ]
  },
  {
    name: "Car Auction Listing",
    price: "CHF 149 / EUR 161",
    duration: "for 1 month",
    details: "Feature your car in a dedicated auction section on our platform, offering exposure to serious buyers."
  }
];

const whyChooseBestCar = [
  "Lower pricing than competitors like AutoScout24 and ClassicDriver",
  "Exclusive promotional offers with free listings for the first 2-3 months",
  "Greater visibility with social media integration and banner placement",
  "Flexible pricing plans designed to meet the needs of all sellers"
];

export default function AdvertisePage() {
  const [showWhyChoose, setShowWhyChoose] = useState(false);
  const [showOptionalAddons, setShowOptionalAddons] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-16">
        {/* Context Instructions Section */}
        <Card className="mb-12 p-8 bg-white border border-gray-200 shadow-lg">
          <CardHeader className="text-center p-0 mb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <BarChart3 className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-yellow-600 mb-2">
              Comprehensive Advertisement & Listing Dashboard
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 max-w-3xl mx-auto">
              Access our powerful dashboard to buy ad Credits, manage listings, and feature your content across all categories
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">How It Works:</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                    <div>
                      <p className="font-medium text-gray-900">Buy any ad Credit (slot)</p>
                      <p className="text-sm text-gray-600">Purchase credits for banners, listings, or newsletter features</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                    <div>
                      <p className="font-medium text-gray-900">Advertise using your Credit</p>
                      <p className="text-sm text-gray-600">Use your purchased credits to create and manage advertisements</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                    <div>
                      <p className="font-medium text-gray-900">Feature across categories</p>
                      <p className="text-sm text-gray-600">Feature cars, auctions, hotels, clubs with comprehensive options</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Available Options:</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-gray-600">Banner advertisements</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-gray-600">Event/Club/Hotel/Auction listings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-gray-600">Newsletter mentions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-gray-600">Car listings with multiple tiers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-gray-600">Featured placements</span>
                  </div>
                </div>
              </div>
            </div>
            
            {!authChecked ? (
              <div className="text-center">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
                </div>
              </div>
            ) : currentUser ? (
              <div className="text-center">
                <Button size="lg" asChild className="font-bold rounded-full bg-yellow-600 hover:bg-yellow-700">
                  <Link href="/advertise/dashboard">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <p className="text-sm text-gray-600 mt-3">
                  Access your comprehensive dashboard to manage all advertisements and listings
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-4">
                  <p className="text-gray-600 mb-4">
                    Please log in to access our comprehensive advertisement dashboard
                  </p>
                  <Button size="lg" asChild className="font-bold rounded-full bg-yellow-600 hover:bg-yellow-700">
                    <Link href="/login">
                      <LogIn className="mr-2 h-5 w-5" />
                      Login to Continue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Don't have an account? <Link href="/register" className="text-yellow-600 hover:underline">Register here</Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Plans Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold font-headline text-center mb-10 text-gray-900">Advertisment Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <Card key={plan.title} className="flex flex-col h-full hover:shadow-lg transition-shadow bg-white border border-gray-200">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      {plan.title === "Banner Advertisement" ? (
                        <Globe className="w-5 h-5 text-yellow-600" />
                      ) : plan.title === "Event/Club/Hotel/Auction Listing" ? (
                        <Calendar className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <Mail className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-xl font-headline text-yellow-600">{plan.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  {plan.options.map((opt, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="font-semibold text-lg text-gray-900 mb-2">{opt.name}</div>
                      <div className="text-gray-600 text-sm mb-3">{opt.details}</div>
                      <div className="flex items-center justify-between">
                        <span className="inline-block bg-yellow-100 text-yellow-800 font-bold px-3 py-1 rounded-full text-sm">{opt.duration}</span>
                        <div className="inline-block bg-yellow-600 text-white font-bold px-3 py-1 rounded-full text-sm">
                          <div className="flex flex-col items-center">
                            <span className="text-sm">{opt.chfPrice}</span>
                            <span className="text-xs opacity-90">{opt.eurPrice}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Why Choose Section - Moved here */}
        <div className="mb-16">
          <div className="text-center mb-6">
            <Button
              variant="ghost"
              onClick={() => setShowWhyChoose(!showWhyChoose)}
              className="text-2xl font-bold font-headline hover:bg-transparent p-0 text-gray-900"
            >
              Why choose these options?
              {showWhyChoose ? (
                <ChevronUp className="ml-2 h-6 w-6" />
              ) : (
                <ChevronDown className="ml-2 h-6 w-6" />
              )}
            </Button>
          </div>
          
          {showWhyChoose && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto animate-in slide-in-from-top-2 duration-300">
              {whyChoose.map((item, i) => (
                <Card key={i} className="bg-gray-50 border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-headline text-yellow-600 mb-1">{item.title}</CardTitle>
                    <CardDescription className="text-gray-600">{item.desc}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Car Sale Listing Pricing Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold font-headline text-center mb-4 text-gray-900">Car Sale Listing Pricing</h2>
          <div className="text-center mb-8">
            <Card className="p-6 bg-yellow-50 border border-yellow-200">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-xl font-bold text-yellow-600 mb-2">🎉 Introductory Offer</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="font-semibold text-gray-900">Free Listings: For the first two months (ending the 30th September 2025) car listings are free of charge as part of our promotional offer.</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {carSalePricing[0].plans.map((plan, idx) => (
              <Card key={idx} className="flex flex-col h-full hover:shadow-lg transition-shadow bg-white border border-gray-200">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      {plan.icon}
                    </div>
                  </div>
                  <CardTitle className="text-lg font-headline text-yellow-600">{plan.name}</CardTitle>
                  <CardDescription className="text-center">
                    <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-1">{plan.duration}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                  {plan.features.map((feature, featureIdx) => (
                    <div key={featureIdx} className="flex items-start gap-2 text-sm">
                      <Star className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-900">{feature}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Optional Add-ons */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <Button
                variant="ghost"
                onClick={() => setShowOptionalAddons(!showOptionalAddons)}
                className="text-2xl font-bold font-headline hover:bg-transparent p-0 text-gray-900"
              >
                Optional Add-ons
                {showOptionalAddons ? (
                  <ChevronUp className="ml-2 h-6 w-6" />
                ) : (
                  <ChevronDown className="ml-2 h-6 w-6" />
                )}
              </Button>
            </div>
            
            {showOptionalAddons && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
                <Card className="p-6 bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-xl font-headline text-yellow-600">{optionalAddons[0].name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {optionalAddons[0].options?.map((option, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-lg text-gray-900">{option.name}</span>
                          {option.savings && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-semibold">
                              {option.savings}
                            </span>
                          )}
                        </div>
                        <div className="text-gray-600 text-sm mb-2">{option.details}</div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block bg-yellow-100 text-yellow-800 font-bold px-3 py-1 rounded-full text-sm">
                            {option.price}
                          </span>
                          <span className="text-gray-600 text-sm">{option.duration}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="p-6 bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-xl font-headline text-yellow-600">{optionalAddons[1].name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-gray-600 text-sm mb-3">{optionalAddons[1].details}</div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block bg-yellow-100 text-yellow-800 font-bold px-3 py-1 rounded-full text-sm">
                          {optionalAddons[1].price}
                        </span>
                        <span className="text-gray-600 text-sm">{optionalAddons[1].duration}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Why Choose BestCarEvents.com */}
          <Card className="p-6 bg-yellow-50 border border-yellow-200">
            <CardHeader>
              <CardTitle className="text-2xl font-bold font-headline text-center text-yellow-600">Why Choose BestCarEvents.com?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {whyChooseBestCar.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Star className="w-5 h-5 text-yellow-600 mt-1" />
                    <span className="font-medium text-base text-gray-900">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">All prices are subject to VAT.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Special Packages Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold font-headline text-center mb-10 text-gray-900">Special Packages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {packages.map((pkg) => (
              <Card key={pkg.name} className="border-2 border-yellow-600 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="text-2xl font-headline text-yellow-600">{pkg.name}</CardTitle>
                  <CardDescription className="text-lg mt-2">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="line-through text-gray-500 text-sm">{pkg.oldChfPrice} / {pkg.oldEurPrice}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-900 font-bold text-2xl">{pkg.chfPrice}</span>
                        <span className="text-gray-900 font-bold text-2xl">/</span>
                        <span className="text-gray-900 font-bold text-2xl">{pkg.eurPrice}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-600 font-semibold text-sm">({pkg.perMonthChf} / {pkg.perMonthEur}/mo)</span>
                        <span className="text-green-600 font-semibold text-sm">{pkg.savings}</span>
                      </div>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 mt-4">
                  {pkg.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Star className="w-5 h-5 text-yellow-600 mt-1" />
                      <span className="text-base text-gray-900">{f}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Social Networks Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold font-headline text-center mb-8 text-gray-900">We also publicise your event, hotel, club or auction over these networks:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {networks.map((net, i) => (
              <a key={i} href={net.url} target="_blank" rel="noopener noreferrer">
                <Card className="flex flex-col items-center p-6 hover:shadow-xl transition-shadow bg-white border border-gray-200">
                  <div className="mb-3">{net.icon}</div>
                  <div className="font-semibold text-lg text-gray-900 mb-1">{net.label}</div>
                  <div className="text-gray-600 text-sm text-center">{net.desc}</div>
                </Card>
              </a>
            ))}
          </div>
        </div>

        {/* Custom Offer & Contact Section */}
        <Card className="text-center p-8 bg-white border border-gray-200 rounded-lg mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold font-headline text-gray-900">Not satisfied with the offers?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Please feel free to make your own offer, for us it's important to have you on board.</p>
            <p className="text-lg font-semibold mb-6 text-gray-900">Join us today and connect with an elite audience of car collectors and enthusiasts. Promote your events, clubs, hotels, or auctions in a way that ensures high visibility and engagement.</p>
            <Button size="lg" asChild className="font-bold rounded-full bg-yellow-600 hover:bg-yellow-700" >
              <a href="mailto:info@bestcarevents.com"><Mail className="mr-2" />Contact Us: info@bestcarevents.com</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
