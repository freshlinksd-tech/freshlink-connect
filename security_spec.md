# Security Specification: Zero-Trust Firestore Rules Verification

## 1. Data Invariants
- **Users**: A user profile is bound to their authenticated UID (`request.auth.uid`). Users are forbidden from modifying system-level role flags (`role`, `isAdmin`) or security bypass credentials.
- **Posts**: A post must always have a valid, non-empty title and content. Only the author or an admin can modify/delete a post.
- **Likes**: A like is an atomic association of `userId` and `postId`. Users can only create or delete likes under their own UID.
- **Comments**: A comment must specify a valid target `postId` and have a comment body size within [1, 5000] characters.
- **Followers**: Follow relationships must strictly bind `followerId` to the current user's UID.
- **Messages**: Direct messages are restricted such that only the sender or receiver can read or modify.
- **Withdrawal Requests**: Withdrawals can only be requested by the owning user and are system-locked once approved/rejected.
- **Notifications**: Users can only read, update, or delete notifications where they are the target recipient.
- **Post Reports**: Reports can be submitted by any signed-in user, but only read or resolved by admins.
- **Ads**: Campaigns can be updated in clickCount by anyone (for tracking clicks), but content changes are restricted to the author or admin.

---

## 2. The "Dirty Dozen" Malicious Payloads

### Payload 1: Privilege Escalation (User Setting Self as Admin)
```json
{
  "id": "attacker_uid",
  "name": "Attacker",
  "email": "attacker@gmail.com",
  "role": "super_admin",
  "isAdmin": true
}
```
*Expected Result*: **PERMISSION_DENIED** (Blocked by `isValidUser` denying user self-updating of role fields).

### Payload 2: Identity Spoofing (Post as Someone Else)
```json
{
  "id": "post_attacker",
  "userId": "victim_uid",
  "title": "Malicious Post",
  "content": "Hijacked post content.",
  "category": "tech",
  "status": "published",
  "createdAt": "2026-07-10T12:00:00Z",
  "readingTime": 1
}
```
*Expected Result*: **PERMISSION_DENIED** (Blocked by `isValidPost` which requires `data.userId == request.auth.uid`).

### Payload 3: Shadow Update (Injecting Ghost Field in User profile)
```json
{
  "id": "user_uid",
  "name": "User",
  "email": "user@gmail.com",
  "createdAt": "2026-07-10T12:00:00Z",
  "ghostField": "maliciousValue"
}
```
*Expected Result*: **PERMISSION_DENIED** (Blocked by key-filtering and strict schema boundaries).

### Payload 4: Denial of Wallet (ID Poisoning Attack with a 10KB string)
```json
{
  "id": "very_long_poison_id_over_128_characters_...",
  "userId": "user_uid",
  "title": "Crash",
  "content": "Junk"
}
```
*Expected Result*: **PERMISSION_DENIED** (Blocked by `isValidId()` check on paths).

### Payload 5: Rogue Like (Liking posts on behalf of another User)
```json
{
  "userId": "victim_uid",
  "postId": "some_post_id"
}
```
*Expected Result*: **PERMISSION_DENIED** (Blocked by `isValidLike` verifying `data.userId == request.auth.uid`).

### Payload 6: Message Interception (Reading private messages between other users)
```json
{
  "senderId": "victim_1",
  "receiverId": "victim_2"
}
```
*Expected Result*: **PERMISSION_DENIED** (Blocked by message security gates checking `resource.data.senderId == request.auth.uid` or `receiverId`).

### Payload 7: Terminal State Bypass (Self-approving a rejection on Withdrawal request)
```json
{
  "id": "withdraw_123",
  "userId": "attacker_uid",
  "amountNpr": 1000,
  "paymentMethod": "esewa",
  "details": "eSewa number",
  "status": "approved",
  "createdAt": "2026-07-10T12:00:00Z"
}
```
*Expected Result*: **PERMISSION_DENIED** (Blocked by `isValidWithdrawal` ensuring `status` changes are strictly restricted to admin tier).

### Payload 8: Message Modification Hijack (Altering message content sent by someone else)
```json
{
  "message": "Hijacked content",
  "senderId": "victim_uid"
}
```
*Expected Result*: **PERMISSION_DENIED** (Blocked by update restrictions on message sender validation).

### Payload 9: Rogue Follower Injection (Submitting follower pair on behalf of others)
```json
{
  "followerId": "victim_uid",
  "followingId": "target_uid"
}
```
*Expected Result*: **PERMISSION_DENIED** (Blocked by `isValidFollower` restricting followerId to caller's UID).

### Payload 10: Private Notification Eavesdropping (Listing notification collections belonging to victims)
```json
{
  "userId": "victim_uid",
  "senderId": "someone_else"
}
```
*Expected Result*: **PERMISSION_DENIED** (Blocked by read access limits on target recipient validation).

### Payload 11: Campaign Manipulation (Changing Ad content or details bypass)
```json
{
  "id": "ad_123",
  "userId": "attacker_uid",
  "name": "Malicious Campaign",
  "active": true,
  "content": "Spam Link"
}
```
*Expected Result*: **PERMISSION_DENIED** (Blocked by Ad owner-verification checks).

### Payload 12: Admin Action Simulation (Deleting other user's post as a normal subscriber)
*Expected Result*: **PERMISSION_DENIED** (Blocked by update/delete checks requiring author status or actual Admin credentials).

---

## 3. The Test Runner Configuration
A complete test runner setup (`firestore.rules.test.ts`) verifies these scenarios by instantiating dry-run authenticated connections against Firestore emulator endpoints or locally mocked rules contexts, ensuring that each of the "Dirty Dozen" payloads yields a security assertion exception.
