"use client";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  userType: "regular" | "admin" | "banned";
  createdAt: any; // Firebase Timestamp
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore(app);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
      setUsers(usersData);
      setLoading(false);
    };
    fetchUsers();
  }, [db]);

  const handleUserTypeChange = async (userId: string, newUserType: "regular" | "admin" | "banned") => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { userType: newUserType });
      setUsers(users.map(user => user.id === userId ? { ...user, userType: newUserType } : user));
    } catch (error) {
      console.error("Error updating user type: ", error);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-semibold mb-4">Manage Users</h1>
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>User Type</TableHead>
                <TableHead>Registered On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    {
                      user.userType === "banned" ? (
                        <Badge variant="destructive">banned</Badge>
                      ) : (
                        <Badge variant={user.userType === "admin" ? "default" : "secondary"}>
                          {user.userType}
                        </Badge>
                      )
                    }
                  </TableCell>
                  <TableCell>{user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('en-GB') : "-"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleUserTypeChange(user.id, user.userType === "admin" ? "regular" : "admin")}>
                          Make {user.userType === "admin" ? "Regular" : "Admin"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.userType === "banned" ? (
                          <DropdownMenuItem onClick={() => handleUserTypeChange(user.id, "regular")}>Unban User</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleUserTypeChange(user.id, "banned")}>Ban User</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
