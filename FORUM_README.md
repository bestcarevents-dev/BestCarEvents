# Community Forum Module

A comprehensive community forum system for the BestCarEvents car community website.

## Features

### 🏠 Main Forum Page (`/forum`)
- **Post Listing**: Display all community posts with search and filtering
- **Search & Filter**: Search by title/content and filter by category
- **Featured Posts**: Highlighted posts with special styling
- **Responsive Design**: Mobile-friendly layout with grid system
- **Real-time Updates**: Live data from Firebase

### 📝 Post Creation (`/forum/create`)
- **Rich Text Editor**: Support for markdown formatting (bold, italic, lists)
- **Image Upload**: Multiple image upload with Firebase Storage
- **Category Selection**: Pre-defined categories for car community
- **Tag System**: Add up to 5 custom tags per post
- **Form Validation**: Required field validation and character limits
- **Preview**: Real-time preview of post content

### 📄 Post Detail (`/forum/[id]`)
- **Full Post Display**: Complete post with images and formatting
- **Comment System**: Real-time comments with user avatars
- **Like/Share**: Social interaction features
- **View Counter**: Automatic view tracking
- **Author Information**: User profiles and timestamps
- **Responsive Images**: Optimized image display

## Categories

The forum includes car-specific categories:
- **Events**: Car shows, meetups, track days
- **Parts & Modifications**: Aftermarket parts, upgrades, modifications
- **Maintenance**: Service tips, DIY guides, troubleshooting
- **Car Reviews**: Vehicle reviews and comparisons
- **General Discussion**: General automotive topics
- **Buying & Selling**: Marketplace discussions
- **Racing & Performance**: Performance tuning, racing events
- **Other**: Miscellaneous topics

## Technical Implementation

### Database Structure (Firebase Firestore)
```
forum_posts/
├── {postId}/
│   ├── title: string
│   ├── content: string
│   ├── category: string
│   ├── author: {
│   │   ├── name: string
│   │   ├── avatar: string (optional)
│   │   └── id: string
│   ├── createdAt: timestamp
│   ├── views: number
│   ├── replies: number
│   ├── likes: number
│   ├── featured: boolean
│   ├── images: string[]
│   ├── tags: string[]
│   └── comments/
│       └── {commentId}/
│           ├── content: string
│           ├── author: object
│           ├── createdAt: timestamp
│           └── likes: number
```

### File Storage (Firebase Storage)
- **Path**: `forum-images/{timestamp}-{filename}`
- **Size Limit**: 5MB per image
- **Format**: All common image formats
- **Max Images**: 5 per post

### UI Components
- **ForumPostCard**: Reusable post card component
- **Rich Text Editor**: Basic formatting toolbar
- **Image Upload**: Drag & drop interface
- **Comment System**: Nested comment structure
- **Search & Filter**: Real-time filtering

## Authentication

- **Login Required**: Post creation and commenting require authentication
- **User Profiles**: Display name, avatar, and user ID
- **Anonymous Fallback**: Graceful handling for unauthenticated users

## Styling

Follows the existing design system:
- **Colors**: Yellow accent theme (`yellow-400`, `yellow-500`, `yellow-600`)
- **Typography**: `font-headline` for headings
- **Components**: Shadcn/ui components
- **Icons**: Lucide React icons
- **Responsive**: Mobile-first design

## Usage

1. **View Posts**: Navigate to `/forum` to see all posts
2. **Search**: Use the search bar to find specific topics
3. **Filter**: Select categories to narrow down results
4. **Create Post**: Click "Create Post" (requires login)
5. **View Details**: Click on any post to see full content and comments
6. **Comment**: Add comments on post detail pages (requires login)

## Future Enhancements

- **Rich Text Editor**: Advanced WYSIWYG editor
- **Nested Comments**: Reply to specific comments
- **Post Moderation**: Admin approval system
- **User Reputation**: Points and badges system
- **Email Notifications**: Comment and reply notifications
- **Post Bookmarking**: Save favorite posts
- **Advanced Search**: Full-text search with filters
- **Post Sharing**: Social media integration 