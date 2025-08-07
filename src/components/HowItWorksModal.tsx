"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Upload, CheckCircle, Star, TrendingUp } from "lucide-react";

interface HowItWorksModalProps {
  listingType?: string; // e.g., "event", "car", "service"
  triggerText?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  triggerSize?: "default" | "sm" | "lg" | "icon";
}

export default function HowItWorksModal({
  listingType = "listing",
  triggerText = "How it works",
  triggerVariant = "outline",
  triggerSize = "default"
}: HowItWorksModalProps) {
  const steps = [
    {
      icon: Upload,
      title: "Post a Free Listing",
      description: `Create and submit your ${listingType} listing completely free of charge.`
    },
    {
      icon: CheckCircle,
      title: "Get Approved",
      description: "Our team reviews your listing to ensure quality and compliance with our guidelines."
    },
    {
      icon: TrendingUp,
      title: "Go Live",
      description: `Once approved, your ${listingType} listing appears on our website for potential customers to discover.`
    },
    {
      icon: Star,
      title: "Feature Your Listing (Optional)",
      description: "Boost visibility and get more traction by featuring your listing with our premium placement options."
    }
  ];

  const featureTypes = [
    {
      name: "Standard Listing",
      duration: "1 month",
      description: "Enhanced visibility with priority placement"
    },
    {
      name: "Featured Listing", 
      duration: "1 year",
      description: "Maximum exposure with premium positioning and special highlighting"
    }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize}>
          <HelpCircle className="w-4 h-4 mr-2" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            How {listingType.charAt(0).toUpperCase() + listingType.slice(1)} Listings Work
          </DialogTitle>
          <DialogDescription>
            Learn how to create and promote your {listingType} listings effectively
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Process Steps */}
          <div>
            <h3 className="text-lg font-semibold mb-4">The Process</h3>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <step.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{step.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Types */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Feature Your Listing</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Want more visibility? Feature your listing to get premium placement and increased exposure.
            </p>
            <div className="grid gap-3">
              {featureTypes.map((feature, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{feature.name}</h4>
                    <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                      {feature.duration}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* How to Feature */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">How to Feature Your Listing</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>First, purchase credit for the feature type you want</li>
              <li>Go to your listings dashboard</li>
              <li>Click the "Feature" button next to your listing</li>
              <li>Select your preferred feature type</li>
              <li>Confirm to apply your credit and feature the listing</li>
            </ol>
          </div>

          {/* Benefits */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Benefits of Featuring</h3>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Higher search ranking and visibility</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Premium placement on listing pages</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Special highlighting and badges</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Increased click-through rates</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 