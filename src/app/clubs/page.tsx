
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default function ClubsPage() {
  return (
    <div className="bg-background text-foreground">
      <main className="py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
            <div className="text-center md:text-left mb-4 md:mb-0">
                <h1 className="text-4xl md:text-5xl font-extrabold font-headline">Car Clubs</h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto md:mx-0">
                    Looking to take your passion for cars further while being in the company of other car lovers and petrolheads. Look no further. Keep reading for the world’s most and less popular car clubs. Each car club offers exclusive parties and events, recreational races, and more.
                </p>
            </div>
            <Button asChild>
                <Link href="/clubs/register" className="flex items-center">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Register Your Club
                </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
