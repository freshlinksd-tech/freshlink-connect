/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  email: string;
  bio: string;
  profileImage: string;
  coverImage: string;
  location: string;
  interests: string[];
  socialLinks: {
    twitter?: string;
    github?: string;
    website?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
  savedPosts: string[]; // Post IDs
  createdAt: string;
  hasSetupAccount?: boolean;
  isBlocked?: boolean;
  role?: 'super_admin' | 'admin' | 'user';
  isAdmin?: boolean;
  phoneNumber?: string;
  panNumber?: string;
  officialDocId?: string;
  idPhoto?: string; // photo of id
  isApprovedByAdmin?: boolean; // admin security clearance approval
  hasVerifiedDetails?: boolean;
  clearanceRemarks?: string; // Remarks/reason for clearance actions
  walletBalance?: number;
  walletCredits?: number;
  isMonetizationEnabled?: boolean;
  monthlySubscriptionPrice?: number;
  subscribedCreators?: string[]; // IDs of creators subscribed to
}

export interface Post {
  id: string;
  userId: string;
  title: string;
  content: string;
  mediaUrl?: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  createdAt: string;
  readingTime: number; // in minutes
  mediaUrls?: string[]; // Multiple photos selection support
  videoUrl?: string; // Video upload support
  isPremium?: boolean; // monetization field
}

export interface Like {
  userId: string;
  postId: string;
}

export interface Comment {
  id: string;
  userId: string;
  postId: string;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Follower {
  followerId: string;
  followingId: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  mediaUrl?: string;
  createdAt: string;
  read: boolean;
  status?: 'sent' | 'delivered' | 'seen';
  updatedAt?: string;
}

export interface InterestOption {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string; // Lucide icon identifier
  progressObjective: string;
  isEarned: boolean;
  currentValue: number;
  targetValue: number;
  colorClass: string; // Tailwind bg/text colors
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amountNpr: number;
  paymentMethod: string;
  details: string;
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string; // Admin comments/remarks for the withdrawal decision
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string; // Recipient user
  senderId: string; // Actor user (e.g., who liked, commented, followed)
  senderName: string;
  senderImage?: string;
  type: 'like' | 'comment' | 'follow' | 'report_decision' | 'withdrawal_decision' | 'ad_alert' | 'system';
  message: string;
  postId?: string; // Optional related post
  createdAt: string;
  read: boolean;
}

export interface PostReport {
  id: string;
  postId: string;
  postTitle: string;
  postAuthorId: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  remarks: string;
  status: 'pending' | 'resolved' | 'dismissed'; // resolved = post deleted, dismissed = report rejected
  createdAt: string;
}

export interface AdBanner {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  targetUrl: string; // Redirection URL (social media post, external link, etc.)
  active: boolean;
  createdAt: string;
}

