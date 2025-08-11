import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Eye, Clock, User, Star } from 'lucide-react';
import Link from 'next/link';

type ForumPostCardProps = {
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

export default function ForumPostCard({ 
  id, 
  title, 
  content, 
  category, 
  author, 
  createdAt, 
  views, 
  replies, 
  likes, 
  featured = false,
  images,
  tags 
}: ForumPostCardProps) {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Link href={`/forum/${id}`}>
      <Card className={`overflow-hidden group bg-white border transition-all duration-300 cursor-pointer ${
        featured 
          ? 'border-2 border-[#80A0A9] hover:border-[#80A0A9]/80' 
          : 'border-gray-200 hover:border-[#80A0A9]'
      }`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {images && images[0] && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                <Image 
                  src={images[0]} 
                  alt={title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant="secondary" 
                  className={featured ? "bg-[#E0D8C1]/30 text-[#80A0A9]" : "bg-[#E0D8C1]/20 text-[#80A0A9]"}
                >
                  {category}
                </Badge>
                {featured && (
                  <Star className="w-4 h-4 text-[#80A0A9]" />
                )}
              </div>
              <h3 className="text-xl font-headline font-bold text-gray-900 group-hover:text-[#80A0A9] transition-colors line-clamp-2 mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                {content.substring(0, 150)}...
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{author.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{views}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  <span>{replies}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
} 