import { Post, User } from '../types';

export interface SecurityDiagnosticReport {
  timestamp: string;
  isPublicReadEnabled: boolean;
  publicPostsCount: number;
  privatePostsCount: number;
  invalidUserIdCount: number;
  issues: string[];
  recommendations: string[];
}

export function auditPostsVisibilityAndConstraints(posts: Post[], users: User[]): SecurityDiagnosticReport {
  const issues: string[] = [];
  const recommendations: string[] = [];
  const userIds = new Set(users.map(u => u.id));

  let publicPostsCount = 0;
  let privatePostsCount = 0;
  let invalidUserIdCount = 0;

  posts.forEach(post => {
    // Check if post is valid and public
    if ((post as any).isPrivate === true || (post as any).visibility === 'private') {
      privatePostsCount++;
      issues.push(`Post ID ${post.id} ('${post.title}') is marked as private.`);
    } else {
      publicPostsCount++;
    }

    // Check if author userId exists in user directory
    if (post.userId && !userIds.has(post.userId)) {
      invalidUserIdCount++;
      issues.push(`Post ID ${post.id} references non-existent userId '${post.userId}'.`);
    }
  });

  if (invalidUserIdCount > 0) {
    recommendations.push('Run user directory sync to ensure all author userIds map to valid profiles.');
  }

  if (privatePostsCount > 0) {
    recommendations.push('Verify post visibility flags to ensure feed items are intended to be public.');
  }

  return {
    timestamp: new Date().toISOString(),
    isPublicReadEnabled: true, // Verified in firestore.rules (allow read: if true)
    publicPostsCount,
    privatePostsCount,
    invalidUserIdCount,
    issues,
    recommendations
  };
}
