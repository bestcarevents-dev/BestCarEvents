
import { Button } from "@/components/ui/button"

export default function PartnersPage() {
  return (
    <div className="bg-background text-foreground">
      <main className="py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold font-headline">Partners</h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Promote your services to a dedicated audience of car enthusiasts. Become a partner and choose your relevant category to reach your target customers.
              </p>
            </div>
            <div className="mt-8">
              <Button size="lg">Become a Partner</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
