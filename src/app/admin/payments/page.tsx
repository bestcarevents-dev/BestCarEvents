"use client";

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, DollarSign, Calendar } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  paymentMethod: string;
  status: string;
  createdAt: any;
  paymentId?: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    todayPayments: 0
  });
  const db = getFirestore(app);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        // Fetch recent payments (last 100)
        const paymentsQuery = query(
          collection(db, "payments"),
          orderBy("createdAt", "desc"),
          limit(100)
        );
        const snapshot = await getDocs(paymentsQuery);
        const paymentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
        setPayments(paymentsData);

        // Calculate stats
        const totalPayments = paymentsData.length;
        const totalAmount = paymentsData.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayPayments = paymentsData.filter(payment => {
          const paymentDate = payment.createdAt?.toDate?.() || new Date(payment.createdAt);
          return paymentDate >= today;
        }).length;

        setStats({
          totalPayments,
          totalAmount,
          todayPayments
        });
      } catch (error) {
        console.error("Error fetching payments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [db]);

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const dateObj = date.toDate?.() || new Date(date);
    return dateObj.toLocaleDateString('en-GB') + " " + dateObj.toLocaleTimeString('en-GB');
  };

  const formatAmount = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency
    }).format(amount);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold mb-4">Payment Transactions</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayments}</div>
            <p className="text-xs text-muted-foreground">
              All time transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(stats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              All time revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Payments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayPayments}</div>
            <p className="text-xs text-muted-foreground">
              Transactions today
            </p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <p>Loading payments...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <p>No payment transactions found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.createdAt)}</TableCell>
                  <TableCell>{payment.customerEmail}</TableCell>
                  <TableCell>{payment.description}</TableCell>
                  <TableCell>{formatAmount(payment.amount, payment.currency)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{payment.paymentMethod}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={payment.status === "completed" ? "default" : "secondary"}
                    >
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {payment.paymentId || "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
} 