'use client';

import React from 'react';
import { User } from '@/types';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function UserAvatar({ user, size = 'md', className = '' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-24 w-24 text-3xl'
  };

  const initials = user.full_name?.charAt(0) || user.username?.charAt(0) || '?';


  return (
    <div className={`${sizeClasses[size]} bg-indigo-100 rounded-full flex items-center justify-center ${className}`}>
      {user.profile_picture_url ? (
        <img
          src={user.profile_picture_url}
          alt={`${user.full_name || user.username}'s profile`}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      ) : (
        <span className="font-medium text-indigo-600">
          {initials}
        </span>
      )}
    </div>
  );
}
