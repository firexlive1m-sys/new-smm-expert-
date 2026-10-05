import React from 'react';
import {
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Send,
  MessageSquare,
  AtSign,
  Video,
  Share2,
} from 'lucide-react';

interface PlatformIconProps {
  nameOrSlug: string;
  imageUrl?: string;
  className?: string;
  fallbackSize?: number;
}

export const PlatformIcon: React.FC<PlatformIconProps> = ({
  nameOrSlug,
  imageUrl,
  className = 'w-6 h-6',
  fallbackSize = 20,
}) => {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={nameOrSlug}
        className={`${className} object-contain`}
        loading="lazy"
        onError={(e) => {
          // If image fails, fallback to vector icon
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  const lower = nameOrSlug.toLowerCase();

  if (lower.includes('instagram')) {
    return <Instagram className={`${className} text-[#E1306C]`} size={fallbackSize} />;
  }
  if (lower.includes('youtube')) {
    return <Youtube className={`${className} text-[#FF0000]`} size={fallbackSize} />;
  }
  if (lower.includes('facebook')) {
    return <Facebook className={`${className} text-[#1877F2]`} size={fallbackSize} />;
  }
  if (lower.includes('twitter') || lower.includes(' x')) {
    return <Twitter className={`${className} text-[#1DA1F2]`} size={fallbackSize} />;
  }
  if (lower.includes('tiktok')) {
    return <Video className={`${className} text-[#000000]`} size={fallbackSize} />;
  }
  if (lower.includes('telegram')) {
    return <Send className={`${className} text-[#229ED9]`} size={fallbackSize} />;
  }
  if (lower.includes('whatsapp')) {
    return <MessageSquare className={`${className} text-[#25D366]`} size={fallbackSize} />;
  }
  if (lower.includes('threads')) {
    return <AtSign className={`${className} text-[#000000]`} size={fallbackSize} />;
  }

  return <Share2 className={`${className} text-[#F72585]`} size={fallbackSize} />;
};
