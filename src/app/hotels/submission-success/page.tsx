"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Clock, Mail, Settings } from "lucide-react";

export default function SubmissionSuccessPage() {
  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto bg-white border border-gray-200 shadow-sm">
          <CardHeader className="text-center bg-gray-50 border-b border-gray-200">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold font-headline text-gray-900">Hotel Submitted!</CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Thank you for submitting your car-friendly hotel.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-700 mb-4">
                  Your listing has been successfully submitted and is now under review by our team.
                </p>
                <p className="text-gray-600 text-sm">
                  We typically review submissions within 24-48 hours. You'll receive an email notification once your listing is approved.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  What happens next?
                </h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Our team will review your submission for quality and completeness</li>
                  <li>• We'll verify your contact information and listing details</li>
                  <li>• Once approved, your hotel will appear in our listings</li>
                  <li>• You'll receive an email confirmation with your listing details</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  While you wait...
                </h3>
                <ul className="text-yellow-800 text-sm space-y-1">
                  <li>• Prepare additional high-quality images of your property</li>
                  <li>• Gather amenities and special services details</li>
                  <li>• Share your upcoming listing with your audience</li>
                  <li>• Explore our community forum to connect with travelers</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white">
                  <Link href="/hotels" className="flex items-center justify-center">
                    Browse Car Hotels
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Link href="/" className="flex items-center justify-center">
                    Return Home
                  </Link>
                </Button>
              </div>

              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-gray-600 text-sm mb-2">Have questions about your submission?</p>
                <Button asChild variant="link" className="text-yellow-600 hover:text-yellow-700 p-0">
                  <a href="mailto:info@bestcarevents.com?subject=Hotels Submission Question" className="flex items-center justify-center">
                    <Mail className="w-4 h-4 mr-1" />
                    Contact Support
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
