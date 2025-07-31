'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, Eye, Clock, User, Heart, Share, Reply, ThumbsUp, ThumbsDown, Copy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getFirestore, doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, updateDoc, increment, deleteDoc, setDoc, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import Image from 'next/image';
import { useParams } from 'next/navigation';

type ForumPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  author: {
    name: string;
    avatar?: string;
    id: string;
  };
  createdAt: any;
  views: number;
  replies: number;
  likes: number;
  featured?: boolean;
  images?: string[];
  tags?: string[];
};

type Comment = {
  id: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    id: string;
  };
  createdAt: any;
  likes: number;
  replies?: Reply[];
};

type Reply = {
  id: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    id: string;
  };
  createdAt: any;
  likes: number;
};

// Simple markdown renderer with image support
const renderMarkdown = (text: string, images?: string[]) => {
  let result = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
    .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
    .replace(/^1\. (.*$)/gim, '<li class="ml-4">$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p><h/g, '<h')
    .replace(/<\/h><\/p>/g, '</h>')
    .replace(/<p><li/g, '<ul><li')
    .replace(/<\/li><\/p>/g, '</li></ul>');

  // Add images inline if they exist
  if (images && images.length > 0) {
    const imageHtml = images.map((image, index) => `
      <div class="my-4">
        <img src="${image}" alt="Post image ${index + 1}" class="max-w-full h-auto rounded-lg shadow-md" />
      </div>
    `).join('');
    result += imageHtml;
  }

  return result;
};

export default function PostDetailPage() {
    const params = useParams();
    const postId = params.id as string;
    
    const [post, setPost] = useState<ForumPost | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
    const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

    useEffect(() => {
      const fetchPost = async () => {
        setLoading(true);
        const db = getFirestore(app);
        const postDoc = await getDoc(doc(db, "forum_posts", postId));
        
        if (postDoc.exists()) {
          const postData = { id: postDoc.id, ...postDoc.data() } as ForumPost;
          setPost(postData);
          
          // Increment view count
          await updateDoc(doc(db, "forum_posts", postId), {
            views: increment(1)
          });
        }
        setLoading(false);
      };
      
      if (postId) {
        fetchPost();
      }
    }, [postId]);

    useEffect(() => {
      const db = getFirestore(app);
      const commentsRef = collection(db, "forum_posts", postId, "comments");
      const q = query(commentsRef, orderBy("createdAt", "desc"));
      
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const commentsData = await Promise.all(snapshot.docs.map(async (doc) => {
          const commentData = { id: doc.id, ...doc.data() } as Comment;
          
          // Fetch replies for this comment
          const repliesRef = collection(db, "forum_posts", postId, "comments", doc.id, "replies");
          const repliesQuery = query(repliesRef, orderBy("createdAt", "asc"));
          const repliesSnapshot = await getDocs(repliesQuery);
          const replies = repliesSnapshot.docs.map(replyDoc => ({ 
            id: replyDoc.id, 
            ...replyDoc.data() 
          })) as Reply[];
          
          return { ...commentData, replies };
        }));
        setComments(commentsData);
      });

      return () => unsubscribe();
    }, [postId]);

    useEffect(() => {
      const auth = getAuth(app);
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        if (user) {
          // Check if user has liked the post
          checkUserLikes(user.uid);
        }
      });
      return () => unsubscribe();
    }, []);

    const checkUserLikes = async (userId: string) => {
      const db = getFirestore(app);
      try {
        // Check post likes
        const postLikeDoc = await getDoc(doc(db, "forum_posts", postId, "likes", userId));
        if (postLikeDoc.exists()) {
          setLikedPosts(prev => new Set([...prev, postId]));
        }

        // Check comment likes
        const commentsSnapshot = await getDocs(collection(db, "forum_posts", postId, "comments"));
        const likedCommentIds = new Set<string>();
        
        for (const commentDoc of commentsSnapshot.docs) {
          const commentLikeDoc = await getDoc(doc(db, "forum_posts", postId, "comments", commentDoc.id, "likes", userId));
          if (commentLikeDoc.exists()) {
            likedCommentIds.add(commentDoc.id);
          }
        }
        setLikedComments(likedCommentIds);
      } catch (error) {
        console.error('Error checking user likes:', error);
      }
    };

    const handleLikePost = async () => {
      if (!currentUser) {
        alert('Please login to like posts');
        return;
      }

      const db = getFirestore(app);
      const likeRef = doc(db, "forum_posts", postId, "likes", currentUser.uid);
      
      // Instantly update UI
      if (likedPosts.has(postId)) {
        // Unlike
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        setPost(prev => prev ? { ...prev, likes: prev.likes - 1 } : null);
      } else {
        // Like
        setLikedPosts(prev => new Set([...prev, postId]));
        setPost(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
      }
      
      try {
        if (likedPosts.has(postId)) {
          // Unlike
          await deleteDoc(likeRef);
          await updateDoc(doc(db, "forum_posts", postId), {
            likes: increment(-1)
          });
        } else {
          // Like
          await setDoc(likeRef, {
            userId: currentUser.uid,
            timestamp: new Date()
          });
          await updateDoc(doc(db, "forum_posts", postId), {
            likes: increment(1)
          });
        }
      } catch (error) {
        console.error('Error updating like:', error);
        // Revert UI changes on error
        if (likedPosts.has(postId)) {
          setLikedPosts(prev => new Set([...prev, postId]));
          setPost(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
        } else {
          setLikedPosts(prev => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
          });
          setPost(prev => prev ? { ...prev, likes: prev.likes - 1 } : null);
        }
      }
    };

    const handleLikeComment = async (commentId: string) => {
      if (!currentUser) {
        alert('Please login to like comments');
        return;
      }

      const db = getFirestore(app);
      const likeRef = doc(db, "forum_posts", postId, "comments", commentId, "likes", currentUser.uid);
      
      // Instantly update UI
      if (likedComments.has(commentId)) {
        // Unlike
        setLikedComments(prev => {
          const newSet = new Set(prev);
          newSet.delete(commentId);
          return newSet;
        });
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, likes: comment.likes - 1 }
            : comment
        ));
      } else {
        // Like
        setLikedComments(prev => new Set([...prev, commentId]));
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, likes: comment.likes + 1 }
            : comment
        ));
      }
      
      try {
        if (likedComments.has(commentId)) {
          // Unlike
          await deleteDoc(likeRef);
        } else {
          // Like
          await setDoc(likeRef, {
            userId: currentUser.uid,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Error updating comment like:', error);
        // Revert UI changes on error
        if (likedComments.has(commentId)) {
          setLikedComments(prev => new Set([...prev, commentId]));
          setComments(prev => prev.map(comment => 
            comment.id === commentId 
              ? { ...comment, likes: comment.likes + 1 }
              : comment
          ));
        } else {
          setLikedComments(prev => {
            const newSet = new Set(prev);
            newSet.delete(commentId);
            return newSet;
          });
          setComments(prev => prev.map(comment => 
            comment.id === commentId 
              ? { ...comment, likes: comment.likes - 1 }
              : comment
          ));
        }
      }
    };

    const handleSubmitComment = async () => {
      if (!newComment.trim() || !currentUser) return;
      
      setSubmitting(true);
      const db = getFirestore(app);
      
      try {
        await addDoc(collection(db, "forum_posts", postId, "comments"), {
          content: newComment,
          author: {
            name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
            avatar: currentUser.photoURL,
            id: currentUser.uid
          },
          createdAt: new Date(),
          likes: 0
        });

        // Update post reply count
        await updateDoc(doc(db, "forum_posts", postId), {
          replies: increment(1)
        });

        setNewComment('');
      } catch (error) {
        console.error('Error adding comment:', error);
      } finally {
        setSubmitting(false);
      }
    };

    const handleSubmitReply = async (commentId: string) => {
      if (!replyContent.trim() || !currentUser) return;
      
      setSubmitting(true);
      const db = getFirestore(app);
      
      try {
        await addDoc(collection(db, "forum_posts", postId, "comments", commentId, "replies"), {
          content: replyContent,
          author: {
            name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
            avatar: currentUser.photoURL,
            id: currentUser.uid
          },
          createdAt: new Date(),
          likes: 0
        });

        // Update post reply count
        await updateDoc(doc(db, "forum_posts", postId), {
          replies: increment(1)
        });

        setReplyContent('');
        setReplyingTo(null);
      } catch (error) {
        console.error('Error adding reply:', error);
      } finally {
        setSubmitting(false);
      }
    };

    const handleShare = async () => {
      const url = window.location.href;
      try {
        await navigator.clipboard.writeText(url);
        // You could add a toast notification here
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    };

    const formatDate = (timestamp: any) => {
      if (!timestamp) return 'Unknown date';
      const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    if (loading) {
      return <div className="container mx-auto py-24 text-center text-2xl font-bold animate-pulse">Loading post...</div>;
    }

    if (!post) {
      return <div className="container mx-auto py-24 text-center text-destructive text-2xl font-bold flex flex-col items-center"><MessageCircle className="w-12 h-12 mb-4 animate-spin" />Post not found.</div>;
    }

    return (
        <div className="container mx-auto px-4 py-10 bg-white animate-fade-in">
            {/* Forum Post Header */}
            <div className="mb-8">
                <Button variant="outline" onClick={() => window.history.back()} className="mb-4 text-gray-700 border-gray-300 hover:bg-gray-50">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Forum
                </Button>
                
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-start gap-4 mb-4">
                        <Avatar className="w-12 h-12">
                            <AvatarImage src={post.author.avatar} />
                            <AvatarFallback className="bg-yellow-100 text-yellow-800">
                                {post.author.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
                                {post.featured && <Badge className="bg-yellow-500 text-white">Featured</Badge>}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                <span className="font-medium text-gray-900">{post.author.name}</span>
                                <span>•</span>
                                <span>{formatDate(post.createdAt)}</span>
                                <span>•</span>
                                <span>{post.category}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    {post.views} views
                                </span>
                                <span className="flex items-center gap-1">
                                    <MessageCircle className="w-4 h-4" />
                                    {post.replies} replies
                                </span>
                                <span className="flex items-center gap-1">
                                    <Heart className="w-4 h-4" />
                                    {post.likes} likes
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Post Content */}
                    <div className="prose max-w-none text-gray-700 leading-relaxed">
                        <div 
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content, post.images) }}
                        />
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                            {post.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-gray-600 border-gray-300">
                                    #{tag}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-200">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`flex items-center gap-2 ${likedPosts.has(postId) ? 'text-red-600 hover:text-red-700' : 'text-gray-600 hover:text-yellow-600'}`}
                            onClick={handleLikePost}
                        >
                            <Heart className={`w-4 h-4 ${likedPosts.has(postId) ? 'fill-current' : ''}`} />
                            <span>Like</span>
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="flex items-center gap-2 text-gray-600 hover:text-yellow-600"
                            onClick={handleShare}
                        >
                            <Share className="w-4 h-4" />
                            <span>Share</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Comments ({comments.length})</h2>
                
                {/* Add Comment */}
                {currentUser ? (
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                        <div className="flex gap-4">
                            <Avatar className="w-10 h-10">
                                <AvatarImage src={currentUser.photoURL || undefined} />
                                <AvatarFallback className="bg-yellow-100 text-yellow-800">
                                    {currentUser.displayName?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <Textarea
                                    placeholder="Add a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="min-h-[100px] resize-none bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                                />
                                <div className="flex justify-end mt-3">
                                    <Button 
                                        onClick={handleSubmitComment}
                                        disabled={!newComment.trim() || submitting}
                                        className="bg-yellow-600 hover:bg-yellow-700"
                                    >
                                        {submitting ? 'Posting...' : 'Post Comment'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
                        <p className="text-gray-600 mb-4">Please login to add a comment.</p>
                        <Button asChild>
                            <Link href="/login">Login to Comment</Link>
                        </Button>
                    </div>
                )}

                {/* Comments List */}
                <div className="space-y-6">
                    {comments.length === 0 ? (
                        <div className="text-center py-8 text-gray-600">
                            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium">No comments yet</p>
                            <p className="text-sm">Be the first to share your thoughts!</p>
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex gap-4">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={comment.author.avatar} />
                                        <AvatarFallback className="bg-gray-100 text-gray-700">
                                            {comment.author.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-medium text-gray-900">{comment.author.name}</span>
                                            <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
                                        </div>
                                        <p className="text-gray-700 mb-3 whitespace-pre-wrap">{comment.content}</p>
                                        <div className="flex items-center gap-4">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className={`flex items-center gap-1 ${likedComments.has(comment.id) ? 'text-red-600 hover:text-red-700' : 'text-gray-600 hover:text-yellow-600'}`}
                                                onClick={() => handleLikeComment(comment.id)}
                                            >
                                                <ThumbsUp className={`w-3 h-3 ${likedComments.has(comment.id) ? 'fill-current' : ''}`} />
                                                <span>{comment.likes}</span>
                                            </Button>
                                            <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-600 hover:text-yellow-600">
                                                <ThumbsDown className="w-3 h-3" />
                                            </Button>
                                            {currentUser && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="flex items-center gap-1 text-gray-600 hover:text-yellow-600"
                                                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                                >
                                                    <Reply className="w-3 h-3" />
                                                    <span>Reply</span>
                                                </Button>
                                            )}
                                        </div>

                                        {/* Reply Form */}
                                        {replyingTo === comment.id && currentUser && (
                                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                                <div className="flex gap-3">
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarImage src={currentUser.photoURL || undefined} />
                                                        <AvatarFallback className="bg-yellow-100 text-yellow-800 text-xs">
                                                            {currentUser.displayName?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <Textarea
                                                            placeholder="Write a reply..."
                                                            value={replyContent}
                                                            onChange={(e) => setReplyContent(e.target.value)}
                                                            className="min-h-[80px] resize-none bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                                                        />
                                                        <div className="flex justify-end gap-2 mt-2">
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={() => {
                                                                    setReplyingTo(null);
                                                                    setReplyContent('');
                                                                }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button 
                                                                size="sm"
                                                                onClick={() => handleSubmitReply(comment.id)}
                                                                disabled={!replyContent.trim() || submitting}
                                                                className="bg-yellow-600 hover:bg-yellow-700"
                                                            >
                                                                {submitting ? 'Posting...' : 'Reply'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Display Replies */}
                                        {comment.replies && comment.replies.length > 0 && (
                                            <div className="mt-4 space-y-3">
                                                {comment.replies.map((reply) => (
                                                    <div key={reply.id} className="ml-8 p-3 bg-gray-50 rounded-lg border-l-4 border-yellow-200">
                                                        <div className="flex gap-3">
                                                            <Avatar className="w-8 h-8">
                                                                <AvatarImage src={reply.author.avatar} />
                                                                <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">
                                                                    {reply.author.name.charAt(0).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-medium text-gray-900 text-sm">{reply.author.name}</span>
                                                                    <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                                                                </div>
                                                                <p className="text-gray-700 text-sm whitespace-pre-wrap">{reply.content}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
} 