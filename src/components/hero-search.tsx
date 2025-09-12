"use client"

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Search, Car, Hotel, Users, Gavel, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function HeroSearch() {
  const [activeTab, setActiveTab] = useState("events");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter1, setFilter1] = useState("");
  const [filter2, setFilter2] = useState("");
  const router = useRouter();

  const getPlaceholderText = () => {
    switch (activeTab) {
      case "events":
        return "Event type or name...";
      case "cars":
        return "Make or model...";
      case "hotels":
        return "Hotel name or location...";
      case "clubs":
        return "Club name or type...";
      case "auctions":
        return "Auction name or type...";
      case "others":
        return "Service type or name...";
      default:
        return "Search...";
    }
  };

  const getFilterOptions = () => {
    switch (activeTab) {
      case "cars":
        return {
          filter1: {
            label: "Make",
            options: ["BMW", "Mercedes", "Audi", "Toyota", "Honda", "Ford", "Chevrolet", "Porsche", "Ferrari", "Lamborghini"]
          },
          filter2: {
            label: "Body Style",
            options: ["Sedan", "SUV", "Coupe", "Convertible", "Hatchback", "Wagon", "Truck", "Van"]
          }
        };
      case "hotels":
        return {
          filter1: {
            label: "City",
            options: ["New York", "Los Angeles", "Chicago", "Miami", "Las Vegas", "San Francisco", "Boston", "Seattle"]
          },
          filter2: {
            label: "Storage Type",
            options: ["Indoor", "Outdoor", "Climate Controlled", "Secure", "24/7 Access"]
          }
        };
      case "events":
        return {
          filter1: {
            label: "Category",
            options: ["Car Show", "Race", "Meetup", "Auction", "Exhibition", "Rally", "Track Day"]
          },
          filter2: {
            label: "Vehicle Focus",
            options: ["Classic", "Sports", "Luxury", "Muscle", "Exotic", "JDM", "European"]
          }
        };
      case "clubs":
        return {
          filter1: {
            label: "City",
            options: ["New York", "Los Angeles", "Chicago", "Miami", "Las Vegas", "San Francisco", "Boston", "Seattle"]
          },
          filter2: {
            label: "Activity",
            options: ["Meetups", "Track Days", "Scenic Drives", "Social Events", "Racing", "Car Shows", "Charity Events"]
          }
        };
      case "auctions":
        return {
          filter1: {
            label: "City",
            options: ["New York", "Los Angeles", "Chicago", "Miami", "Las Vegas", "San Francisco", "Boston", "Seattle"]
          },
          filter2: {
            label: "Auction Type",
            options: ["Classic", "Sports", "Luxury", "Muscle", "Exotic", "Vintage", "Modern"]
          }
        };
      case "others":
        return {
          filter1: {
            label: "Service Type",
            options: ["Car Storage", "Garage Services", "Spare Parts", "Restoration", "Detailing", "Wrapping & Vinyl", "Towing Services", "Transport", "Insurance", "Finance", "Consulting"]
          },
          filter2: {
            label: "Location",
            options: ["New York", "Los Angeles", "Chicago", "Miami", "Las Vegas", "San Francisco", "Boston", "Seattle"]
          }
        };
      default:
        return {
          filter1: { label: "Filter 1", options: [] },
          filter2: { label: "Filter 2", options: [] }
        };
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build search parameters
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) {
      params.append("search", searchQuery.trim());
    }

    // Add filter parameters based on active tab
    const filterOptions = getFilterOptions();
    
    if (filter1 && filter1 !== "all") {
      params.append(filterOptions.filter1.label.toLowerCase().replace(" ", ""), filter1);
    }
    
    if (filter2 && filter2 !== "all") {
      params.append(filterOptions.filter2.label.toLowerCase().replace(" ", ""), filter2);
    }
    
    // Navigate to the appropriate page with search parameters
    const searchParams = params.toString();
    const url = `/${activeTab}${searchParams ? `?${searchParams}` : ""}`;
    router.push(url);
  };

  const filterOptions = getFilterOptions();

  return (
    <div className="bg-secondary/30 backdrop-blur-md rounded-xl p-4 lg:p-6 border border-primary/30 shadow-2xl">
      <form onSubmit={handleSearch}>
        <div className="flex flex-wrap items-center gap-2 mx-auto mb-6 justify-center">
          <Button
            type="button"
            onClick={() => setActiveTab("events")}
            variant="ghost"
            className={cn(
              "flex-1 min-w-[100px] justify-center rounded-full font-semibold py-3 text-sm sm:text-base",
              activeTab === 'events' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-transparent text-white hover:bg-white/10'
              )}
          >
            <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Events</span>
            <span className="sm:hidden">Events</span>
          </Button>
          <Button
            type="button"
            onClick={() => setActiveTab("cars")}
            variant="ghost"
            className={cn(
              "flex-1 min-w-[100px] justify-center rounded-full font-semibold py-3 text-sm sm:text-base",
              activeTab === 'cars' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-transparent text-white hover:bg-white/10'
            )}
          >
            <Car className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Cars</span>
            <span className="sm:hidden">Cars</span>
          </Button>
           <Button
            type="button"
            onClick={() => setActiveTab("hotels")}
            variant="ghost"
            className={cn(
              "flex-1 min-w-[100px] justify-center rounded-full font-semibold py-3 text-sm sm:text-base",
              activeTab === 'hotels' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-transparent text-white hover:bg-white/10'
            )}
          >
            <Hotel className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Hotels</span>
            <span className="sm:hidden">Hotels</span>
          </Button>
          <Button
            type="button"
            onClick={() => setActiveTab("clubs")}
            variant="ghost"
            className={cn(
              "flex-1 min-w-[100px] justify-center rounded-full font-semibold py-3 text-sm sm:text-base",
              activeTab === 'clubs' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-transparent text-white hover:bg-white/10'
            )}
          >
            <Users className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Clubs</span>
            <span className="sm:hidden">Clubs</span>
          </Button>
          <Button
            type="button"
            onClick={() => setActiveTab("auctions")}
            variant="ghost"
            className={cn(
              "flex-1 min-w-[100px] justify-center rounded-full font-semibold py-3 text-sm sm:text-base",
              activeTab === 'auctions' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-transparent text-white hover:bg-white/10'
            )}
          >
            <Gavel className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Auctions</span>
            <span className="sm:hidden">Auctions</span>
          </Button>
          <Button
            type="button"
            onClick={() => setActiveTab("others")}
            variant="ghost"
            className={cn(
              "flex-1 min-w-[100px] justify-center rounded-full font-semibold py-3 text-sm sm:text-base",
              activeTab === 'others' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-transparent text-white hover:bg-white/10'
            )}
          >
            <Settings className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Others</span>
            <span className="sm:hidden">Others</span>
          </Button>
        </div>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Input
              placeholder={getPlaceholderText()}
              className="h-14 bg-secondary/40 border-primary/40 text-foreground placeholder:text-foreground/70 focus-visible:ring-2 focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters Grid - Maximum 2 filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filter 1 */}
            <Select value={filter1} onValueChange={setFilter1}>
              <SelectTrigger className="h-14 bg-secondary/40 border-primary/40 text-foreground placeholder:text-foreground/70 focus:ring-primary">
                <SelectValue placeholder={`${filterOptions.filter1.label}...`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any {filterOptions.filter1.label}</SelectItem>
                {filterOptions.filter1.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter 2 */}
            <Select value={filter2} onValueChange={setFilter2}>
              <SelectTrigger className="h-14 bg-secondary/40 border-primary/40 text-foreground placeholder:text-foreground/70 focus:ring-primary">
                <SelectValue placeholder={`${filterOptions.filter2.label}...`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any {filterOptions.filter2.label}</SelectItem>
                {filterOptions.filter2.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit"
            size="lg" 
            className="w-full h-16 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 border border-primary/50 shadow-[0_8px_30px_rgba(217,180,85,0.45)]"
          >
            <Search className="mr-2 h-5 w-5" />
            Search Now
          </Button>
        </div>
      </form>
    </div>
  );
}
