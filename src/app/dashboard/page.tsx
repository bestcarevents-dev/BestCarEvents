import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle } from "lucide-react";

export default function DashboardPage() {
  const myListings = [
    { id: "1", type: "Car", name: "2021 Porsche 911 Turbo S", status: "Active", views: 1204 },
    { id: "2", type: "Event", name: "Supercar Sunday - April", status: "Upcoming", views: 876 },
    { id: "3", type: "Car", name: "1967 Ford Mustang Shelby GT500", status: "Sold", views: 5432 },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-4xl font-extrabold font-headline">My Dashboard</h1>
            <p className="mt-2 text-muted-foreground">Welcome back, User!</p>
        </div>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4"/>
            Create New Listing
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
            <CardHeader>
                <CardTitle>Active Listings</CardTitle>
                <CardDescription>Cars and events currently live.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-bold">2</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Total Views</CardTitle>
                <CardDescription>Across all your listings.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-bold">7,512</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Messages</CardTitle>
                <CardDescription>New inquiries this week.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-bold">5</p>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>My Listings</CardTitle>
            <CardDescription>Manage your cars and events here.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {myListings.map(listing => (
                        <TableRow key={listing.id}>
                            <TableCell>{listing.type}</TableCell>
                            <TableCell className="font-medium">{listing.name}</TableCell>
                            <TableCell>{listing.status}</TableCell>
                            <TableCell>{listing.views.toLocaleString()}</TableCell>
                            <TableCell>
                                <Button variant="outline" size="sm">Edit</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
