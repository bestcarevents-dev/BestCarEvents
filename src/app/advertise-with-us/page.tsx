"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Mail, Globe, Linkedin, Facebook, Users, Calendar, Image, Video, TrendingUp, Award, ChevronDown, ChevronUp, ArrowRight, LogIn, BarChart3, Car, CheckCircle, Zap, Gift } from "lucide-react";
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

// Free posting categories
const freeCategories = [
  {
    name: "Events",
    icon: <Calendar className="w-8 h-8" />,
    description: "List your car events, meetups, and gatherings for free",
    color: "bg-blue-100 text-blue-600"
  },
  {
    name: "Clubs",
    icon: <Users className="w-8 h-8" />,
    description: "Promote your car clubs and communities at no cost",
    color: "bg-green-100 text-green-600"
  },
  {
    name: "Hotels",
    icon: <Star className="w-8 h-8" />,
    description: "Showcase your hotel services to car enthusiasts",
    color: "bg-purple-100 text-purple-600"
  },
  {
    name: "Auctions",
    icon: <Award className="w-8 h-8" />,
    description: "Feature your car auctions and sales events",
    color: "bg-orange-100 text-orange-600"
  },
  {
    name: "Services",
    icon: <Car className="w-8 h-8" />,
    description: "Advertise your automotive services for free",
    color: "bg-red-100 text-red-600"
  },
  {
    name: "Forums",
    icon: <Zap className="w-8 h-8" />,
    description: "Any other car-related services you offer",
    color: "bg-yellow-100 text-yellow-600"
  }
];

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
        icon: <Image className="w-5 h-5 text-black" />
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
        icon: <TrendingUp className="w-5 h-5 text-black" />
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
        icon: <Video className="w-5 h-5 text-black  " />
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
        icon: <Award className="w-5 h-5 text-black" />
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
  {
    text: "Lower pricing than competitors like AutoScout24 and ClassicDriver",
    isFree: false
  },
  {
    text: "Exclusive promotional offers with FREE listings for the first 2 months",
    isFree: true
  },
  {
    text: "FREE basic listings for hotels, events, auctions, clubs, and services",
    isFree: true
  },
  {
    text: "Greater visibility with social media integration and banner placement",
    isFree: false
  },
  {
    text: "Flexible pricing plans designed to meet the needs of all sellers",
    isFree: false
  },
  {
    text: "FREE community access to thousands of car enthusiasts",
    isFree: true
  }
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
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section - Free Features Emphasis */}
        <div className="mb-8">
          <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 shadow-lg">
            <CardHeader className="text-center p-0 mb-6">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Gift className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              <CardTitle className="text-xl md:text-2xl font-bold text-yellow-600 mb-3">
                🎉 Post Your Listings for FREE! 🎉
              </CardTitle>
              <CardDescription className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto font-semibold">
                List your hotel, event, auction, club, or any car-related service for FREE today — get seen by thousands of car lovers!
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-center mb-6">
                <p className="text-base text-gray-600 mb-4">
                  <strong>All listings in categories like Hotels, Events, Auctions, Services, etc. are 100% FREE to post!</strong>
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Button size="default" asChild className="font-bold rounded-full bg-green-600 hover:bg-green-700 text-white px-6 py-2 text-base w-full sm:w-auto">
                    <Link href={currentUser ? "/post-a-listing" : "/register"}>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      {currentUser ? "Post Your Listing for Free" : "Subscribe/Register for Free"}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  {!currentUser && (
                    <Button size="default" asChild variant="outline" className="font-bold rounded-full border-2 border-yellow-600 text-yellow-600 hover:bg-yellow-50 px-6 py-2 text-base w-full sm:w-auto">
                      <Link href="/login">
                        <LogIn className="mr-2 h-5 w-5" />
                        Login to Post
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Free Categories Section */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
            What Can You Post for FREE?
          </h2>
          <p className="text-lg text-center text-gray-600 mb-8 max-w-3xl mx-auto">
            Choose from these categories and start posting immediately. No hidden fees, no complicated pricing — just free exposure to our community of car enthusiasts.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {freeCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 border-2 border-gray-200 hover:border-yellow-300 bg-white">
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex p-3 rounded-full mb-4 ${category.color}`}>
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-gray-600 mb-4">{category.description}</p>
                  <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
                    <CheckCircle className="w-5 h-5" />
                    <span>100% FREE</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Call to Action for Free Posting */}
          <Card className="p-6 bg-green-50 border-2 border-green-200 text-center">
            <CardContent className="p-0">
              <h3 className="text-2xl font-bold text-green-700 mb-4">
                Ready to Get Started?
              </h3>
              <p className="text-lg text-gray-700 mb-6">
                Post your listing for free in the relevant category and get seen by thousands of car lovers!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="font-bold rounded-full bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg w-full sm:w-auto">
                  <Link href={currentUser ? "/post-a-listing" : "/register"}>
                    <CheckCircle className="mr-2 h-6 w-6" />
                    {currentUser ? "Post Your Listing for Free" : "Subscribe/Register for Free"}
                    <ArrowRight className="ml-2 h-6 w-6" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Optional Paid Upgrades Section */}
        <div className="mb-16">
          <Card className="p-8 bg-yellow-50 border-2 border-yellow-200">
            <CardHeader className="text-center p-0 mb-6">
              <CardTitle className="text-3xl font-bold text-yellow-700 mb-2">
                Want More Visibility?
              </CardTitle>
              <CardDescription className="text-lg text-gray-700 max-w-3xl mx-auto">
                While basic listings are free, you can choose optional paid upgrades for enhanced visibility, banner ads, homepage features, and premium positioning.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg border border-yellow-200">
                  <h4 className="text-xl font-bold text-yellow-700 mb-3">Free Features Include:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700" >Basic listing in your category</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700" >Essential details and images</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700" >Community visibility</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700" >Direct contact with enthusiasts</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg border border-yellow-200">
                  <h4 className="text-xl font-bold text-yellow-700 mb-3">Paid Upgrades Include:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-600" />
                      <span className="text-gray-700" >Banner advertisements</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-600" />
                      <span className="text-gray-700" >Homepage featured placement</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-600" />
                      <span className="text-gray-700" >Newsletter mentions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-600" />
                      <span className="text-gray-700" >Priority positioning</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

       
        {/* Pricing Plans Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold font-headline text-center mb-10 text-gray-900">Premium Advertisement Plans</h2>
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
                <CardContent className="flex flex-col flex-grow space-y-4">
                  <div className="flex-grow">
                    {plan.options.map((opt, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4 last:mb-0">
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
                  </div>
                  {/* Get Started Button for each plan */}
                  <div className="mt-4 flex justify-center">
                    {plan.title === "Banner Advertisement" && (
                      <Button asChild size="lg" className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-full px-8 py-3">
                        <Link href="/advertise/my-ads">
                          Get Started <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                    )}
                    {plan.title === "Event/Club/Hotel/Auction Listing" && (
                      <Button asChild size="lg" className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-full px-8 py-3">
                        <Link href="/advertise/listings">
                          Get Started <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                    )}
                    {plan.title === "Newsletter Mentions (2 per month, 12 months)" && (
                      <Button asChild size="lg" className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-full px-8 py-3">
                        <Link href="/advertise/newsletter-mentions">
                          Get Started <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                    )}
                  </div>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
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
          {/* Post Your Car Button */}
          <div className="text-center mt-12 mb-8">
            <Button asChild size="lg" className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-full px-10 py-4">
              <Link href="/cars/sell">
                Post Your Car <ArrowRight className="ml-2 h-6 w-6" />
              </Link>
            </Button>
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
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-200">
                    {item.isFree ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                    ) : (
                      <Star className="w-5 h-5 text-yellow-600 mt-1 flex-shrink-0" />
                    )}
                    <span className="font-medium text-base text-gray-900">
                      {item.text}
                      {item.isFree && (
                        <span className="ml-2 inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                          FREE
                        </span>
                      )}
                    </span>
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
          {/* View Packages Button */}
          <div className="text-center mt-8">
            <Button asChild size="lg" className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-full px-10 py-4">
              <Link href="/advertise/dashboard">
                View Packages <ArrowRight className="ml-2 h-6 w-6" />
              </Link>
            </Button>
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
                <Button size="lg" asChild className="font-bold rounded-full bg-yellow-600 hover:bg-yellow-700 w-full sm:w-auto">
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
                  <Button size="lg" asChild className="font-bold rounded-full bg-yellow-600 hover:bg-yellow-700 w-full sm:w-auto">
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

        {/* Custom Offer & Contact Section */}
        <Card className="text-center p-8 bg-white border border-gray-200 rounded-lg mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold font-headline text-gray-900">Not satisfied with the offers?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Please feel free to make your own offer, for us it's important to have you on board.</p>
            <p className="text-lg font-semibold mb-6 text-gray-900">Join us today and connect with an elite audience of car collectors and enthusiasts. Promote your events, clubs, hotels, or auctions in a way that ensures high visibility and engagement.</p>
            <Button size="lg" asChild className="font-bold rounded-full bg-yellow-600 hover:bg-yellow-700 w-full sm:w-auto" >
              <a href="mailto:info@bestcarevents.com">
                <Mail className="mr-2 h-5 w-5" />
                Contact Us: info@bestcarevents.com
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
