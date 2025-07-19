"use client"

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, MapPin, Search, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

export default function HeroSearch() {
  const [activeTab, setActiveTab] = useState("events");
  const [date, setDate] = useState<Date>();

  return (
    <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 lg:p-6 border border-white/10 shadow-2xl">
      <div className="flex items-center space-x-2 max-w-xs mx-auto mb-6">
        <Button
          onClick={() => setActiveTab("events")}
          variant="ghost"
          className={cn(
            "flex-1 justify-center rounded-full font-semibold py-3", 
            activeTab === 'events' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-transparent text-white hover:bg-white/10'
            )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          Find Events
        </Button>
        <Button
          onClick={() => setActiveTab("cars")}
          variant="ghost"
          className={cn(
            "flex-1 justify-center rounded-full font-semibold py-3", 
            activeTab === 'cars' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-transparent text-white hover:bg-white/10'
          )}
        >
          <Car className="mr-2 h-4 w-4" />
          Find Cars
        </Button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-1">
             <Input
              placeholder={activeTab === 'events' ? "Event type or name..." : "Make or model..."}
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
