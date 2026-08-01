import { Post, User } from '../types';

export interface SystemSnapshot {
  snapshotId: string;
  timestamp: string;
  expectedPostsCount: number;
  expectedUsersCount: number;
  expectedCommentsCount?: number;
}

export interface ReconciliationReportResult {
  snapshot: SystemSnapshot;
  actualPostsCount: number;
  actualUsersCount: number;
  postsDiscrepancy: number;
  usersDiscrepancy: number;
  hasDiscrepancy: boolean;
  discrepancyDetails: string[];
  generatedAt: string;
}

/**
 * Creates or retrieves a system snapshot timestamp and baseline count.
 */
export function createSystemSnapshot(postsCount: number, usersCount: number): SystemSnapshot {
  return {
    snapshotId: `snap_${Date.now()}`,
    timestamp: new Date().toISOString(),
    expectedPostsCount: postsCount,
    expectedUsersCount: usersCount
  };
}

/**
 * Compares actual document count in 'posts' and 'users' collections against a SystemSnapshot timestamp.
 */
export function generateAdminDataReconciliationReport(
  posts: Post[],
  users: User[],
  snapshot?: SystemSnapshot | null
): ReconciliationReportResult {
  const generatedAt = new Date().toISOString();
  
  // Default fallback baseline snapshot if none provided
  const activeSnapshot: SystemSnapshot = snapshot || {
    snapshotId: 'snap_system_baseline',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago baseline
    expectedPostsCount: posts.length,
    expectedUsersCount: users.length
  };

  const actualPostsCount = posts.length;
  const actualUsersCount = users.length;

  const postsDiscrepancy = actualPostsCount - activeSnapshot.expectedPostsCount;
  const usersDiscrepancy = actualUsersCount - activeSnapshot.expectedUsersCount;

  const discrepancyDetails: string[] = [];

  if (postsDiscrepancy !== 0) {
    const direction = postsDiscrepancy > 0 ? 'exceeds' : 'lacks';
    discrepancyDetails.push(
      `Posts collection count (${actualPostsCount}) ${direction} SystemSnapshot baseline (${activeSnapshot.expectedPostsCount}) by ${Math.abs(postsDiscrepancy)} item(s).`
    );
  }

  if (usersDiscrepancy !== 0) {
    const direction = usersDiscrepancy > 0 ? 'exceeds' : 'lacks';
    discrepancyDetails.push(
      `Users collection count (${actualUsersCount}) ${direction} SystemSnapshot baseline (${activeSnapshot.expectedUsersCount}) by ${Math.abs(usersDiscrepancy)} profile(s).`
    );
  }

  return {
    snapshot: activeSnapshot,
    actualPostsCount,
    actualUsersCount,
    postsDiscrepancy,
    usersDiscrepancy,
    hasDiscrepancy: postsDiscrepancy !== 0 || usersDiscrepancy !== 0,
    discrepancyDetails,
    generatedAt
  };
}
