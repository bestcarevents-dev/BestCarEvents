"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { CreditCard } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Billing Management</CardTitle>
          <CardDescription>Manage your subscription and payment methods.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Current Plan</div>
                <div className="text-muted-foreground">Pro Partner (Billed Monthly)</div>
              </div>
              <Button variant="outline">Upgrade Plan</Button>
            </div>
          </div>
          <div className="mb-8">
            <div className="text-lg font-semibold mb-2">Invoices</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>2024-05-01</TableCell>
                  <TableCell><span className="text-green-600 font-semibold">Paid</span></TableCell>
                  <TableCell>$49.00</TableCell>
                  <TableCell><Button size="sm" variant="outline">PDF</Button></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2024-04-01</TableCell>
                  <TableCell><span className="text-green-600 font-semibold">Paid</span></TableCell>
                  <TableCell>$49.00</TableCell>
                  <TableCell><Button size="sm" variant="outline">PDF</Button></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2024-03-01</TableCell>
                  <TableCell><span className="text-green-600 font-semibold">Paid</span></TableCell>
                  <TableCell>$49.00</TableCell>
                  <TableCell><Button size="sm" variant="outline">PDF</Button></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">Payment Method</div>
              <div className="text-muted-foreground">Visa ending in 4242</div>
            </div>
            <Button>Update Payment Method</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 