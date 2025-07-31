'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import PartnerAdRotator from '@/components/PartnerAdRotator';
import ForumPostCard from '@/components/forum-post-card';

type ForumPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  author: {
    name: string;
    avatar?: string;
  };
  createdAt: any;
  views: number;
  replies: number;
  likes: number;
  featured?: boolean;
  images?: string[];
  tags?: string[];
};

export default function ForumPage() {
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
      const fetchPosts = async () => {
        setLoading(true);
        const db = getFirestore(app);
        const postsRef = collection(db, "forum_posts");
        const q = query(postsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as ForumPost[];
        setPosts(data);
        setLoading(false);
      };
      fetchPosts();
    }, []);

    useEffect(() => {
      const auth = getAuth(app);
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
      });
      return () => unsubscribe();
    }, []);

    const filteredPosts = posts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    const featuredPosts = filteredPosts.filter(post => post.featured === true);
    const regularPosts = filteredPosts.filter(post => post.featured !== true);

    const categories = [
      { value: 'all', label: 'All Categories' },
      { value: 'events', label: 'Events' },
      { value: 'parts', label: 'Parts & Modifications' },
      { value: 'maintenance', label: 'Maintenance' },
      { value: 'reviews', label: 'Car Reviews' },
      { value: 'general', label: 'General Discussion' },
      { value: 'buying-selling', label: 'Buying & Selling' },
      { value: 'racing', label: 'Racing & Performance' },
      { value: 'other', label: 'Other' }
    ];

    return (
    <div className="bg-white">
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
                <div className="text-center md:text-left mb-4 md:mb-0">
                    <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-gray-900">Community Forum</h1>
                    <p className="mt-4 text-lg text-gray-600 max-w-2xl">
                    Connect with fellow car enthusiasts. Share experiences, ask questions, and discuss everything automotive.
                    </p>
                </div>
                {currentUser ? (
                  <div className="flex gap-2">
                    
                    <Button asChild>
                      <Link href="/forum/create" className="flex items-center">
                          <PlusCircle className="mr-2 h-5 w-5" />
                          Create Post
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Dialog open={showDialog} onOpenChange={setShowDialog}>
                      <DialogTrigger asChild>
                        <Button className="flex items-center">
                          <PlusCircle className="mr-2 h-5 w-5" />
                          Create Post
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md w-full">
                        <DialogHeader>
                          <DialogTitle>Login Required</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 text-center">
                          <p className="text-lg font-semibold mb-2 text-destructive">Please login to create a post.</p>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Close</Button>
                            </DialogClose>
                            <Button asChild variant="default">
                              <a href="/login">Login</a>
                            </Button>
                          </DialogFooter>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
            </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input 
                placeholder="Search posts..." 
                className="md:col-span-2 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                 <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                   <SelectValue placeholder="Category: Any" />
                 </SelectTrigger>
                 <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                 </SelectContent>
              </Select>
              <Button onClick={() => {}}>Search</Button>
            </div>
          </div>

          <div className="mb-4">
            <PartnerAdRotator page="Forum" maxVisible={2} />
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-600">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="py-12 text-center text-gray-600">No posts found.</div>
          ) : (
            <>
              {/* Featured Posts */}
              {featuredPosts.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-yellow-400/10 rounded-full">
                      <Star className="w-6 h-6 text-yellow-500" />
                    </div>
                    <h2 className="text-2xl font-headline font-bold text-gray-900">Featured Posts</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-yellow-400/50 to-transparent"></div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {featuredPosts.map((post) => (
                      <ForumPostCard key={post.id} {...post} featured={true} />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Posts */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-8 bg-yellow-600 rounded-full"></div>
                  <h2 className="text-2xl font-headline font-bold text-gray-900">All Posts</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-yellow-600/50 to-transparent"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {regularPosts.map((post) => (
                     <ForumPostCard key={post.id} {...post} />
                   ))}
                </div>
                {regularPosts.length === 0 && (
                  <div className="text-center py-12 text-gray-600">
                    <p className="text-lg">No posts found.</p>
                    <p className="text-sm mt-2">Be the first to start a discussion!</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
    </div>
  );
} 