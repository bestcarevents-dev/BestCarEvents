"use client"

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, MapPin, Search, Car, Hotel, Users, Gavel } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

export default function HeroSearch() {
  const [activeTab, setActiveTab] = useState("events");
  const [date, setDate] = useState<Date>();

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
      default:
        return "Search...";
    }
  };

  return (
    <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 lg:p-6 border border-white/10 shadow-2xl">
      <div className="flex flex-wrap items-center gap-2 mx-auto mb-6 justify-center">
        <Button
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
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-1">
             <Input
              placeholder={getPlaceholderText()}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 h-14"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 pointer-events-none" />
            <Input
              placeholder="Location..."
              className="pl-12 bg-white/10 border-white/20 text-white placeholder:text-gray-300 h-14"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal h-14 bg-white/10 border-white/20 hover:bg-white/20 text-white hover:text-white",
                  !date && "text-gray-300"
                )}
              >
                <CalendarIcon className="mr-3 ml-1 h-5 w-5" />
                {date ? format(date, "MM/dd/yyyy") : <span>mm/dd/yyyy</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button size="lg" className="w-full h-16 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90">
          <Search className="mr-2 h-5 w-5" />
          Search Now
        </Button>
      </div>
    </div>
  );
}
