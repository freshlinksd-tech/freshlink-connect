/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface RateLimitTracker {
  timestamps: number[];
  isBlockedUntil: number;
}

// Map of userId -> actionType -> Tracker
const actionTrackers: Record<string, Record<string, RateLimitTracker>> = {};

const MAX_ACTIONS_WINDOW = 5; // Max 5 actions
const TIME_WINDOW_MS = 10000; // In 10 seconds
const COOL_DOWN_PERIOD_MS = 15000; // Block for 15 seconds if exceeded

export interface RateLimitResult {
  allowed: boolean;
  blockedRemainingMs: number;
  totalActionsInWindow: number;
}

/**
 * Checks and updates rate limits for a specific user and action type.
 * Returns information about whether the action is permitted or blocked.
 */
export function checkRateLimit(userId: string, actionType: string): RateLimitResult {
  const now = Date.now();

  if (!actionTrackers[userId]) {
    actionTrackers[userId] = {};
  }

  if (!actionTrackers[userId][actionType]) {
    actionTrackers[userId][actionType] = {
      timestamps: [],
      isBlockedUntil: 0
    };
  }

  const tracker = actionTrackers[userId][actionType];

  // 1. Check if user is currently in cool-down
  if (tracker.isBlockedUntil > now) {
    return {
      allowed: false,
      blockedRemainingMs: tracker.isBlockedUntil - now,
      totalActionsInWindow: tracker.timestamps.length
    };
  }

  // 2. Filter out timestamps outside the active window
  tracker.timestamps = tracker.timestamps.filter(ts => now - ts < TIME_WINDOW_MS);

  // 3. Check threshold violation
  if (tracker.timestamps.length >= MAX_ACTIONS_WINDOW) {
    tracker.isBlockedUntil = now + COOL_DOWN_PERIOD_MS;
    return {
      allowed: false,
      blockedRemainingMs: COOL_DOWN_PERIOD_MS,
      totalActionsInWindow: tracker.timestamps.length
    };
  }

  // 4. Log the new action timestamp
  tracker.timestamps.push(now);

  return {
    allowed: true,
    blockedRemainingMs: 0,
    totalActionsInWindow: tracker.timestamps.length
  };
}

/**
 * Resets rate limits for a user (e.g. after successful captcha validation or warning acknowledgement).
 */
export function resetRateLimit(userId: string, actionType: string) {
  if (actionTrackers[userId] && actionTrackers[userId][actionType]) {
    actionTrackers[userId][actionType] = {
      timestamps: [],
      isBlockedUntil: 0
    };
  }
}
