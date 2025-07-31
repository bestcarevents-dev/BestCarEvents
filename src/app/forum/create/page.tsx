'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, UploadCloud, X, Hash, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function CreatePostPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(false);
    const [isMarkdownOpen, setIsMarkdownOpen] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    useEffect(() => {
      const auth = getAuth(app);
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        if (!user) {
          router.push('/login');
        }
      });
      return () => unsubscribe();
    }, [router]);

    // Cleanup image preview on unmount
    useEffect(() => {
      return () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
      };
    }, [imagePreview]);

    const categories = [
      { value: 'events', label: 'Events' },
      { value: 'parts', label: 'Parts & Modifications' },
      { value: 'maintenance', label: 'Maintenance' },
      { value: 'reviews', label: 'Car Reviews' },
      { value: 'general', label: 'General Discussion' },
      { value: 'buying-selling', label: 'Buying & Selling' },
      { value: 'racing', label: 'Racing & Performance' },
      { value: 'other', label: 'Other' }
    ];

    const markdownFormats = [
      { name: 'Bold', syntax: '**text**', example: '**This is bold text**' },
      { name: 'Italic', syntax: '*text*', example: '*This is italic text*' },
      { name: 'Bold & Italic', syntax: '***text***', example: '***This is bold and italic***' },
      { name: 'Heading 1', syntax: '# Heading', example: '# Main Heading' },
      { name: 'Heading 2', syntax: '## Heading', example: '## Sub Heading' },
      { name: 'Heading 3', syntax: '### Heading', example: '### Section Heading' },
      { name: 'Unordered List', syntax: '- item', example: '- First item\n- Second item\n- Third item' },
      { name: 'Ordered List', syntax: '1. item', example: '1. First item\n2. Second item\n3. Third item' },
      { name: 'Link', syntax: '[text](url)', example: '[Visit our website](https://example.com)' },
      { name: 'Image', syntax: '![alt](url)', example: '![Car image](https://example.com/car.jpg)' },
      { name: 'Code Inline', syntax: '`code`', example: 'Use `console.log()` for debugging' },
      { name: 'Code Block', syntax: '```\ncode\n```', example: '```\nfunction hello() {\n  return "Hello World!";\n}\n```' },
      { name: 'Quote', syntax: '> text', example: '> This is a quote from someone' },
      { name: 'Horizontal Rule', syntax: '---', example: '---' },
      { name: 'Strikethrough', syntax: '~~text~~', example: '~~This text is crossed out~~' },
      { name: 'Highlight', syntax: '==text==', example: '==This text is highlighted==' }
    ];

    const handleImageUpload = (file: File | null) => {
      if (file) {
        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file));
      } else {
        setSelectedImage(null);
        setImagePreview(null);
      }
    };

    const removeImage = () => {
      setSelectedImage(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }
    };

    const addTag = () => {
      if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
        setTags(prev => [...prev, newTag.trim()]);
        setNewTag('');
      }
    };

    const removeTag = (tagToRemove: string) => {
      setTags(prev => prev.filter(tag => tag !== tagToRemove));
    };

    const handleSubmit = async () => {
      if (!title.trim() || !content.trim() || !category || !currentUser) return;

      setLoading(true);
      const db = getFirestore(app);
      const storage = getStorage(app);

      try {
        let imageUrl = '';
        if (selectedImage) {
          const imageRef = ref(storage, `forum-images/${Date.now()}_${selectedImage.name}`);
          await uploadBytes(imageRef, selectedImage);
          imageUrl = await getDownloadURL(imageRef);
        }

        const postData = {
          title: title.trim(),
          content: content.trim(),
          category,
          tags,
          images: imageUrl ? [imageUrl] : [],
          author: {
            name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
            avatar: currentUser.photoURL,
            id: currentUser.uid
          },
          createdAt: serverTimestamp(),
          views: 0,
          replies: 0,
          likes: 0,
          featured: false
        };

        const docRef = await addDoc(collection(db, "forum_posts"), postData);
        router.push(`/forum/${docRef.id}`);
      } catch (error) {
        console.error('Error creating post:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!currentUser) {
      return (
        <div className="container mx-auto px-4 py-12">
          <div className="py-12 text-center text-muted-foreground">
            <p>Loading...</p>
          </div>
        </div>
      );
    }

    return (
    <div className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <Button asChild variant="outline">
            <Link href="/forum" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Forum
            </Link>
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-4">
              Create a New Post
            </h1>
            <p className="text-lg text-muted-foreground">
              Share your thoughts, questions, or experiences with the car community.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Post Title *</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Enter a descriptive title for your post..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-lg"
                    maxLength={200}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {title.length}/200 characters
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Category *</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Post Content *</CardTitle>
                    <Collapsible open={isMarkdownOpen} onOpenChange={setIsMarkdownOpen}>
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm">
                          {isMarkdownOpen ? (
                            <>
                              <ChevronDown className="w-4 h-4 mr-2" />
                              Hide Formatting
                            </>
                          ) : (
                            <>
                              <ChevronRight className="w-4 h-4 mr-2" />
                              Show Formatting
                            </>
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-4">
                        <div className="bg-muted rounded-lg p-4 border">
                          <h4 className="text-sm font-semibold mb-3">Markdown Formatting Guide</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            {markdownFormats.map((format, index) => (
                              <div key={index} className="bg-background rounded p-2 border">
                                <div className="font-medium text-primary mb-1">{format.name}</div>
                                <div className="text-foreground mb-1">Syntax: <code className="bg-muted px-1 rounded">{format.syntax}</code></div>
                                <div className="text-muted-foreground">Example: {format.example}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Write your post content here... You can use markdown formatting like **bold**, *italic*, - lists, etc."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[300px] resize-none"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {content.length} characters
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Image (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {imagePreview && (
                      <div className="relative">
                        <img src={imagePreview} alt="Preview" className="mb-4 rounded-lg max-h-48 object-contain border" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removeImage}
                          className="absolute top-2 right-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex flex-col items-center justify-center w-full">
                      <label htmlFor="image" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">PNG, JPG or GIF (MAX. 5MB)</p>
                        </div>
                        <Input
                          id="image"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files ? e.target.files[0] : null;
                            if (file && file.size <= 5 * 1024 * 1024) {
                              handleImageUpload(file);
                            } else if (file) {
                              alert('File size must be less than 5MB');
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Tags (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        maxLength={20}
                      />
                      <Button onClick={addTag} disabled={!newTag.trim() || tags.length >= 5}>
                        Add
                      </Button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {tag}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTag(tag)}
                              className="h-4 w-4 p-0 hover:bg-transparent"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {tags.length}/5 tags
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !title.trim() || !content.trim() || !category}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? 'Creating Post...' : 'Publish Post'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Your post will be visible to the entire community
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
    </div>
  );
} 