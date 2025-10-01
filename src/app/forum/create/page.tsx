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
import { useEffect, useRef, useState } from "react";
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
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
    const [showPreview, setShowPreview] = useState(false);
    
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const contentRef = useRef<HTMLTextAreaElement | null>(null);

    // Simple markdown renderer for live preview (mirrors post page)
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

    // Formatting helpers
    const surroundSelection = (before: string, after?: string) => {
      const el = contentRef.current;
      if (!el) return;
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const a = content.slice(0, start);
      const selected = content.slice(start, end);
      const b = content.slice(end);
      const close = after === undefined ? before : after;
      const next = `${a}${before}${selected || 'text'}${close}${b}`;
      setContent(next);
      requestAnimationFrame(() => {
        const cursor = start + before.length + (selected ? selected.length : 4);
        el.focus();
        el.setSelectionRange(cursor, cursor);
      });
    };

    const prefixLines = (prefix: string) => {
      const el = contentRef.current;
      if (!el) return;
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const a = content.slice(0, start);
      const selected = content.slice(start, end) || 'item';
      const b = content.slice(end);
      const transformed = selected.split('\n').map(line => `${prefix}${line || 'item'}`).join('\n');
      const next = `${a}${transformed}${b}`;
      setContent(next);
      requestAnimationFrame(() => {
        const cursor = start + transformed.length;
        el.focus();
        el.setSelectionRange(cursor, cursor);
      });
    };
    const makeHeading = (level: 1 | 2 | 3) => prefixLines('#'.repeat(level) + ' ');
    const makeInlineCode = () => surroundSelection('`');
    const makeBold = () => surroundSelection('**');
    const makeItalic = () => surroundSelection('*');
    const makeUL = () => prefixLines('- ');
    const makeOL = () => prefixLines('1. ');

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
      { name: 'Image', syntax: '![alt](url)', example: '![Car image](https://example.com/car.jpg)' },
      { name: 'Code Inline', syntax: '`code`', example: 'Use `console.log()` for debugging' },
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

        // Resolve full name and avatar from Firestore profile, fallback to auth
        let authorName = '';
        let authorAvatar: string | null | undefined = null;
        try {
          const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
          const data = userSnap.exists() ? (userSnap.data() as any) : undefined;
          const full = [data?.firstName, data?.lastName].filter(Boolean).join(' ').trim();
          authorName = full || currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous';
          authorAvatar = (data?.photoURL as string) || currentUser.photoURL || null;
        } catch {
          authorName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous';
          authorAvatar = currentUser.photoURL || null;
        }

        const postData = {
          title: title.trim(),
          content: content.trim(),
          category,
          tags,
          images: imageUrl ? [imageUrl] : [],
          author: {
            name: authorName,
            avatar: authorAvatar,
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
        <div className="bg-white">
          <div className="container mx-auto px-4 py-12">
            <div className="py-12 text-center text-gray-600">
              <p>Loading...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-6">
            <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Link href="/forum" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Forum
              </Link>
            </Button>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-headline font-bold text-gray-900 mb-4">
                Create a New Post
              </h1>
              <p className="text-lg text-gray-600">
                Share your thoughts, questions, or experiences with the car community.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="bg-gray-50 border-b border-gray-200">
                    <CardTitle className="text-xl text-gray-900">Post Title *</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Input
                      placeholder="Enter a descriptive title for your post..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-lg bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"
                      maxLength={200}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      {title.length}/200 characters
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="bg-gray-50 border-b border-gray-200">
                    <CardTitle className="text-xl text-gray-900">Category *</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:border-yellow-400 focus:ring-yellow-400">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 text-gray-900">
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl text-gray-900">Post Content *</CardTitle>
                      <Collapsible open={isMarkdownOpen} onOpenChange={setIsMarkdownOpen}>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
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
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <h4 className="text-sm font-semibold mb-3 text-gray-900">Markdown Formatting Guide</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              {markdownFormats.map((format, index) => (
                                <div key={index} className="bg-white rounded p-2 border border-gray-200">
                                  <div className="font-medium text-yellow-600 mb-1">{format.name}</div>
                                  <div className="text-gray-900 mb-1">Syntax: <code className="bg-gray-100 px-1 rounded">{format.syntax}</code></div>
                                  <div className="text-gray-600">Example: {format.example}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-200 mb-4">
                      <Button type="button" variant="outline" size="sm" onClick={makeBold} className="border-gray-300 text-gray-700 hover:bg-gray-50">Bold</Button>
                      <Button type="button" variant="outline" size="sm" onClick={makeItalic} className="border-gray-300 text-gray-700 hover:bg-gray-50">Italic</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => makeHeading(1)} className="border-gray-300 text-gray-700 hover:bg-gray-50">H1</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => makeHeading(2)} className="border-gray-300 text-gray-700 hover:bg-gray-50">H2</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => makeHeading(3)} className="border-gray-300 text-gray-700 hover:bg-gray-50">H3</Button>
                      <Button type="button" variant="outline" size="sm" onClick={makeUL} className="border-gray-300 text-gray-700 hover:bg-gray-50">List</Button>
                      <Button type="button" variant="outline" size="sm" onClick={makeOL} className="border-gray-300 text-gray-700 hover:bg-gray-50">1.</Button>
                      <Button type="button" variant="outline" size="sm" onClick={makeInlineCode} className="border-gray-300 text-gray-700 hover:bg-gray-50">Code</Button>
                      <div className="ml-auto">
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview((p) => !p)} className="border-gray-300">
                          {showPreview ? 'Edit' : 'Preview'}
                        </Button>
                      </div>
                    </div>

                    {!showPreview ? (
                      <Textarea
                        placeholder="Write your post content here... Use the toolbar to format."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        ref={contentRef}
                        className="min-h-[300px] resize-none bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"
                      />
                    ) : (
                      <div className="prose max-w-none text-gray-700 leading-relaxed min-h-[300px] p-4 bg-gray-50 rounded border border-gray-200" dangerouslySetInnerHTML={{ __html: renderMarkdown(content, imagePreview ? [imagePreview] : []) }} />
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      {content.length} characters
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="bg-gray-50 border-b border-gray-200">
                    <CardTitle className="text-xl text-gray-900">Image (Optional)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {imagePreview && (
                        <div className="relative">
                          <img src={imagePreview} alt="Preview" className="mb-4 rounded-lg max-h-48 object-contain border border-gray-200" />
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
                        <label htmlFor="image" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-600">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 5MB)</p>
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
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="bg-gray-50 border-b border-gray-200">
                    <CardTitle className="text-xl text-gray-900">Tags (Optional)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a tag..."
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addTag()}
                          maxLength={20}
                          className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"
                        />
                        <Button onClick={addTag} disabled={!newTag.trim() || tags.length >= 5} className="bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600 focus:ring-yellow-400">
                          Add
                        </Button>
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1 bg-gray-100 text-gray-700 border-gray-200">
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
                      <p className="text-xs text-gray-500">
                        {tags.length}/5 tags
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardContent className="pt-6">
                    <Button
                      onClick={handleSubmit}
                      disabled={loading || !title.trim() || !content.trim() || !category}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600 focus:ring-yellow-400"
                      size="lg"
                    >
                      {loading ? 'Creating Post...' : 'Publish Post'}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Your post will be visible to the entire community
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
} 