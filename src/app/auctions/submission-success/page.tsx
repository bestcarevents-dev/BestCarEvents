"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function SubmissionSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-24 flex items-center justify-center">
      <Card className="max-w-lg w-full text-center">
        <CardHeader className="items-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
          <CardTitle className="text-3xl font-bold font-headline">Auction Submission Received!</CardTitle>
          <CardDescription className="text-lg">
            Thank you for submitting your car for auction. Our team will review the details and you'll be notified upon approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
            <Button asChild>
                <Link href="/auctions">Back to Auctions</Link>
            </Button>
            <Button asChild variant="outline">
                <Link href="/">Return Home</Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
