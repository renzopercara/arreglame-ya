'use client';

import React from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  name?: string;
  avatar?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

/**
 * UserAvatar Component (BLOCK 5)
 * 
 * Renders user avatar with proper fallbacks:
 * - If avatar URL exists: displays image
 * - If no avatar: shows colored circle with user's initial
 * - If no name: shows User icon
 * 
 * Never renders empty or breaks layout
 */
export default function UserAvatar({ 
  name, 
  avatar, 
  size = 'md',
  className = '' 
}: UserAvatarProps) {
  const initial = name ? name.charAt(0).toUpperCase() : null;
  
  // If avatar URL exists, show image
  if (avatar) {
    return (
      <div 
        className={`${sizeClasses[size]} ${className} rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md`}
      >
        <img 
          src={avatar} 
          alt={name || 'User avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            // If image fails to load, hide it and show fallback
            e.currentTarget.style.display = 'none';
          }}
        />
        {/* Fallback shown when image fails */}
        {initial && (
          <span className="font-bold text-white">
            {initial}
          </span>
        )}
      </div>
    );
  }

  // If no avatar but has name, show initial
  if (initial) {
    return (
      <div 
        className={`${sizeClasses[size]} ${className} rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md`}
      >
        {initial}
      </div>
    );
  }

  // Ultimate fallback: User icon
  return (
    <div 
      className={`${sizeClasses[size]} ${className} rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white shadow-md`}
    >
      <User className={iconSizes[size]} />
    </div>
  );
}
