"use client"

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Search, Car, Hotel, Users, Gavel, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormPreferences } from "@/hooks/useFormPreferences";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase";

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

  const carsPrefs = useFormPreferences("cars");
  const eventsPrefs = useFormPreferences("events");
  const hotelsPrefs = useFormPreferences("hotels");
  const servicesPrefs = useFormPreferences("services");
  const sharedPrefs = useFormPreferences("shared");
  // Per-tab city/location options
  const [eventsCities, setEventsCities] = useState<string[] | null>(null);
  const [hotelsCities, setHotelsCities] = useState<string[] | null>(null);
  const [clubsCities, setClubsCities] = useState<string[] | null>(null);
  const [auctionsCities, setAuctionsCities] = useState<string[] | null>(null);
  const [othersLocations, setOthersLocations] = useState<string[] | null>(null);

  useEffect(() => {
    const db = getFirestore(app);
    const extractCity = (value?: string | null) => {
      if (!value || typeof value !== 'string') return null;
      return value.split(',')[0]?.trim() || null;
    };
    (async () => {
      try {
        if (activeTab === 'events' && eventsCities == null) {
          const snap = await getDocs(collection(db, 'events'));
          const set = new Set<string>();
          snap.docs.forEach(d => {
            const data: any = d.data();
            const c = extractCity(data?.city); // strictly use city
            if (c) set.add(c);
          });
          setEventsCities(Array.from(set).sort((a, b) => a.localeCompare(b)));
        }
        if (activeTab === 'hotels' && hotelsCities == null) {
          const snap = await getDocs(collection(db, 'hotels'));
          const set = new Set<string>();
          snap.docs.forEach(d => {
            const data: any = d.data();
            const c = extractCity(data?.city) || extractCity(data?.location);
            if (c) set.add(c);
          });
          setHotelsCities(Array.from(set).sort((a, b) => a.localeCompare(b)));
        }
        if (activeTab === 'clubs' && clubsCities == null) {
          const snap = await getDocs(collection(db, 'clubs'));
          const set = new Set<string>();
          snap.docs.forEach(d => {
            const data: any = d.data();
            const c = extractCity(data?.city) || extractCity(data?.location);
            if (c) set.add(c);
          });
          setClubsCities(Array.from(set).sort((a, b) => a.localeCompare(b)));
        }
        if (activeTab === 'auctions' && auctionsCities == null) {
          const snap = await getDocs(collection(db, 'auctions'));
          const set = new Set<string>();
          snap.docs.forEach(d => {
            const data: any = d.data();
            const c = extractCity(data?.city) || extractCity(data?.location);
            if (c) set.add(c);
          });
          setAuctionsCities(Array.from(set).sort((a, b) => a.localeCompare(b)));
        }
        if (activeTab === 'others' && othersLocations == null) {
          const snap = await getDocs(collection(db, 'others'));
          const set = new Set<string>();
          snap.docs.forEach(d => {
            const data: any = d.data();
            const c = extractCity(data?.location) || extractCity(data?.city);
            if (c) set.add(c);
          });
          setOthersLocations(Array.from(set).sort((a, b) => a.localeCompare(b)));
        }
      } catch (e) {
        // ignore per-tab failures
      }
    })();
  }, [activeTab, eventsCities, hotelsCities, clubsCities, auctionsCities, othersLocations]);

  // Reset filters when switching tabs to avoid stale selections
  useEffect(() => {
    setFilter1("");
    setFilter2("");
  }, [activeTab]);

  type FilterConfig = {
    filter1: { label: string; options: string[]; key: string };
    filter2: { label: string; options: string[]; key: string };
  };

  const getFilterOptions = (): FilterConfig => {
    switch (activeTab) {
      case "cars":
        return {
          filter1: {
            label: "Make",
            options: ["all", ...(carsPrefs.data?.makes || [])],
            key: "make",
          },
          filter2: {
            label: "Body Style",
            options: ["all", ...(carsPrefs.data?.bodyStyles || [])],
            key: "bodystyle",
          }
        };
      case "hotels":
        return {
          filter1: {
            label: "City",
            options: ["all", ...((hotelsCities ?? [])?.length ? (hotelsCities as string[]) : (sharedPrefs.data?.citiesWhitelist || []))],
            key: "city",
          },
          filter2: {
            label: "Storage Type",
            options: ["all", ...(hotelsPrefs.data?.storageTypes || [])],
            key: "storagetype",
          }
        };
      case "events":
        return {
          filter1: {
            label: "Event Type",
            options: ["all", ...(eventsPrefs.data?.eventTypes || [])],
            key: "eventtype",
          },
          filter2: {
            label: "City",
            options: ["all", ...((eventsCities ?? [])?.length ? (eventsCities as string[]) : (sharedPrefs.data?.citiesWhitelist || []))],
            key: "city",
          }
        };
      case "clubs":
        return {
          filter1: {
            label: "City",
            options: ["all", ...((clubsCities ?? [])?.length ? (clubsCities as string[]) : (sharedPrefs.data?.citiesWhitelist || []))],
            key: "city",
          },
          filter2: {
            label: "Activity",
            options: ["all", "Meetups", "Track Days", "Scenic Drives", "Social Events", "Racing", "Car Shows", "Charity Events"],
            key: "activity",
          }
        };
      case "auctions":
        return {
          filter1: {
            label: "City",
            options: ["all", ...((auctionsCities ?? [])?.length ? (auctionsCities as string[]) : (sharedPrefs.data?.citiesWhitelist || []))],
            key: "city",
          },
          filter2: {
            label: "Auction Type",
            options: ["all", ...(/* prefer preferences if later added */[])],
            key: "auctiontype",
          }
        };
      case "others":
        return {
          filter1: {
            label: "Service Type",
            options: ["all", ...((servicesPrefs.data?.serviceTypes || []).map((t) => t.label))],
            key: "servicetype",
          },
          filter2: {
            label: "Location",
            options: ["all", ...((othersLocations ?? [])?.length ? (othersLocations as string[]) : (sharedPrefs.data?.citiesWhitelist || []))],
            key: "location",
          }
        };
      default:
        return {
          filter1: { label: "Filter 1", options: ["all"], key: "filter1" },
          filter2: { label: "Filter 2", options: ["all"], key: "filter2" }
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
      params.append(filterOptions.filter1.key, filter1);
    }
    
    if (filter2 && filter2 !== "all") {
      params.append(filterOptions.filter2.key, filter2);
    }
    
    // Navigate to the appropriate page with search parameters
    const searchParams = params.toString();
    const url = `/${activeTab}${searchParams ? `?${searchParams}` : ""}`;
    router.push(url);
  };

  const filterOptions = getFilterOptions();

  return (
    <div className="">
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
