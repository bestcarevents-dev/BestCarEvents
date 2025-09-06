"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getFirestore, collection, getDocs, query, orderBy, deleteDoc, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

type ForumPost = {
  id: string;
  title: string;
  content: string;
  category?: string;
  author?: any;
  createdAt?: any;
  replies?: number;
  views?: number;
  likes?: number;
  featured?: boolean;
};

export default function AdminForumModerationPage() {
  const db = getFirestore(app);
  const { toast } = useToast();

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState<{ type: "post" | "comment" | "reply"; postId: string; commentId?: string; replyId?: string } | null>(null);
  const [repliesModal, setRepliesModal] = useState<{ open: boolean; postId: string; title?: string } | null>(null);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replies, setReplies] = useState<Array<{ id: string; content: string; author?: any; createdAt?: any; parentType: "comment" | "reply"; parentId: string }>>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const postsQuery = query(collection(db, "forum_posts"), orderBy("createdAt", "desc"));
        const snap = await getDocs(postsQuery);
        const data = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as ForumPost[];
        setPosts(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return posts;
    return posts.filter(p => (p.title || "").toLowerCase().includes(s) || (p.content || "").toLowerCase().includes(s));
  }, [posts, search]);

  const deletePost = async (postId: string) => {
    // We do not assume subcollection names/structure beyond what's visible; delete only the post doc.
    try {
      await deleteDoc(doc(db, "forum_posts", postId));
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast({ title: "Deleted", description: "Post deleted." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete post.", variant: "destructive" });
    } finally {
      setConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Forum Moderation</h1>
        <p className="text-muted-foreground">Search and moderate forum posts. Deleting comments/replies requires opening the post detail first.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Posts</CardTitle>
          <CardDescription>Find and remove problematic posts. Click a row to view and moderate replies.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Search title or content" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((post) => (
                    <TableRow key={post.id} className="cursor-pointer" onClick={async () => {
                      setRepliesModal({ open: true, postId: post.id, title: post.title });
                      setRepliesLoading(true);
                      try {
                        const commentsSnap = await getDocs(collection(db, "forum_posts", post.id, "comments"));
                        const allReplies: Array<{ id: string; content: string; author?: any; createdAt?: any; parentType: "comment" | "reply"; parentId: string }> = [];
                        for (const c of commentsSnap.docs) {
                          const cData = c.data() as any;
                          allReplies.push({ id: c.id, content: cData.content || "", author: cData.author, createdAt: cData.createdAt, parentType: "comment", parentId: c.id });
                          const repliesSnap = await getDocs(collection(db, "forum_posts", post.id, "comments", c.id, "replies"));
                          for (const r of repliesSnap.docs) {
                            const rData = r.data() as any;
                            allReplies.push({ id: r.id, content: rData.content || "", author: rData.author, createdAt: rData.createdAt, parentType: "reply", parentId: c.id });
                          }
                        }
                        setReplies(allReplies);
                      } finally {
                        setRepliesLoading(false);
                      }
                    }}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>{post.category || '-'}</TableCell>
                      <TableCell>{post?.author?.name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Views: {post.views ?? 0}</Badge>
                          <Badge variant="secondary">Replies: {post.replies ?? 0}</Badge>
                          <Badge variant="secondary">Likes: {post.likes ?? 0}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <a className="underline text-sm" href={`/forum/${post.id}`} target="_blank" rel="noreferrer">View</a>
                        <Button variant="destructive" size="sm" onClick={() => setConfirm({ type: "post", postId: post.id })}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length === 0 && (
                <div className="p-6 text-sm text-muted-foreground">No posts found.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!confirm} onOpenChange={() => setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this {confirm?.type}?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            {confirm?.type === 'post' && (
              <Button variant="destructive" onClick={() => deletePost(confirm.postId)}>Delete</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Replies moderation modal */}
      <Dialog open={!!repliesModal?.open} onOpenChange={() => { setRepliesModal(null); setReplies([]); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Replies for: {repliesModal?.title || repliesModal?.postId}</DialogTitle>
          </DialogHeader>
          {repliesLoading ? (
            <div>Loading replies...</div>
          ) : replies.length === 0 ? (
            <div className="text-sm text-muted-foreground">No comments or replies found for this post.</div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {replies.map((item) => (
                <div key={`${item.parentType}-${item.parentId}-${item.id}`} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">
                      {item.parentType === 'comment' ? 'Comment' : 'Reply'} by {item.author?.name || 'Unknown'}
                    </div>
                    <div className="space-x-2">
                      <Button size="sm" variant="destructive" onClick={async () => {
                        try {
                          if (!repliesModal) return;
                          if (item.parentType === 'comment') {
                            await deleteDoc(doc(db, "forum_posts", repliesModal.postId, "comments", item.id));
                          } else {
                            await deleteDoc(doc(db, "forum_posts", repliesModal.postId, "comments", item.parentId, "replies", item.id));
                          }
                          setReplies(prev => prev.filter(r => !(r.id === item.id && r.parentId === item.parentId && r.parentType === item.parentType)));
                          toast({ title: 'Deleted', description: `${item.parentType} removed.` });
                        } catch (e) {
                          toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' });
                        }
                      }}>Delete</Button>
                    </div>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{item.content}</div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRepliesModal(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


