import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, deleteDoc, query, limit } from 'firebase/firestore';
import { SEED_USERS, SEED_POSTS, SEED_FOLLOWERS, SEED_COMMENTS, SEED_MESSAGES } from './src/data/seedData';
import { User, Post, Comment, Follower, Message, AdBanner, WithdrawalRequest, Notification, PostReport, Draft } from './src/types';

let firebaseDb: any = null;
let isUsingFirebase = false;

const memoryDb = {
  users: [...SEED_USERS] as User[],
  posts: [...SEED_POSTS] as Post[],
  comments: [...SEED_COMMENTS] as Comment[],
  followers: [...SEED_FOLLOWERS] as Follower[],
  messages: [...SEED_MESSAGES] as Message[],
  ads: [] as AdBanner[],
  withdrawals: [] as WithdrawalRequest[],
  notifications: [] as Notification[],
  postReports: [] as PostReport[],
  drafts: [] as Draft[]
};

async function initFirebase() {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const apps = getApps();
      const fbApp = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
      firebaseDb = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);
      isUsingFirebase = true;
      console.log('🔥 Connected successfully to Firebase Firestore!');
      
      // Seed Firebase Firestore if empty
      await seedFirebaseIfEmpty();
    } else {
      throw new Error('firebase-applet-config.json not found. Firestore is required as the primary database.');
    }
  } catch (err) {
    console.error('❌ Could not initialize Firebase database:', err);
    isUsingFirebase = false;
  }
}

async function initDatabases() {
  console.log('🔥 Connecting directly to Firebase Firestore...');
  await initFirebase();
}

async function seedFirebaseIfEmpty() {
  if (!firebaseDb) return;
  try {
    const postsRef = collection(firebaseDb, 'posts');
    const q = query(postsRef, limit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
      console.log('🌱 Seeding Firebase Firestore with initial seed data...');
      // Seed users
      for (const u of SEED_USERS) {
        await setDoc(doc(firebaseDb, 'users', u.id), u);
      }
      // Seed posts
      for (const p of SEED_POSTS) {
        await setDoc(doc(firebaseDb, 'posts', p.id), p);
      }
      // Seed comments
      for (const c of SEED_COMMENTS) {
        await setDoc(doc(firebaseDb, 'comments', c.id), c);
      }
      // Seed followers
      for (const f of SEED_FOLLOWERS) {
        const docId = `${f.followerId}_${f.followingId}`;
        await setDoc(doc(firebaseDb, 'followers', docId), f);
      }
      // Seed messages
      for (const m of SEED_MESSAGES) {
        await setDoc(doc(firebaseDb, 'messages', m.id), m);
      }
      console.log('✅ Firebase database seeding completed successfully!');
    } else {
      console.log('✅ Firebase Firestore has existing data, skipping seeding.');
    }
  } catch (err) {
    console.error('❌ Error seeding Firebase Firestore:', err);
  }
}

// --- Database Utility Adapters ---

async function dbFindAll(collectionName: string): Promise<any[]> {
  if (isUsingFirebase && firebaseDb) {
    try {
      const colRef = collection(firebaseDb, collectionName);
      const snapshot = await getDocs(colRef);
      return snapshot.docs.map(d => d.data());
    } catch (err) {
      console.error(`⚠️ Firestore read error, falling back to Memory DB for ${collectionName}:`, err);
      if (collectionName === 'likes') {
        return (global as any).memoryLikes || [];
      }
      return (memoryDb as any)[collectionName] || [];
    }
  } else {
    if (collectionName === 'likes') {
      return (global as any).memoryLikes || [];
    }
    return (memoryDb as any)[collectionName] || [];
  }
}

async function dbFindOne(collectionName: string, id: string): Promise<any | null> {
  if (isUsingFirebase && firebaseDb) {
    try {
      const docRef = doc(firebaseDb, collectionName, id);
      const snap = await getDoc(docRef);
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      console.error(`⚠️ Firestore read error, falling back to Memory DB for ${collectionName}/${id}:`, err);
      return (memoryDb as any)[collectionName]?.find((item: any) => item.id === id) || null;
    }
  } else {
    return (memoryDb as any)[collectionName]?.find((item: any) => item.id === id) || null;
  }
}

async function dbUpsert(collectionName: string, id: string, data: any): Promise<void> {
  // Sync in-memory db as fallback
  const arr = (memoryDb as any)[collectionName];
  if (Array.isArray(arr)) {
    const idx = arr.findIndex((item: any) => item.id === id);
    if (idx >= 0) {
      arr[idx] = { ...arr[idx], ...data };
    } else {
      arr.push(data);
    }
  }

  if (isUsingFirebase && firebaseDb) {
    try {
      await setDoc(doc(firebaseDb, collectionName, id), data, { merge: true });
    } catch (err) {
      console.error(`⚠️ Firestore write error for ${collectionName}/${id}:`, err);
    }
  }
}

async function dbUpdateOne(collectionName: string, id: string, updates: any): Promise<any> {
  const existing = await dbFindOne(collectionName, id);
  const merged = { ...(existing || {}), ...updates, id };
  await dbUpsert(collectionName, id, merged);
  return merged;
}

async function dbDeleteOne(collectionName: string, id: string): Promise<void> {
  // Sync in-memory db as fallback
  const arr = (memoryDb as any)[collectionName];
  if (Array.isArray(arr)) {
    (memoryDb as any)[collectionName] = arr.filter((item: any) => item.id !== id);
  }

  if (isUsingFirebase && firebaseDb) {
    try {
      await deleteDoc(doc(firebaseDb, collectionName, id));
    } catch (err) {
      console.error(`⚠️ Firestore delete error for ${collectionName}/${id}:`, err);
    }
  }
}

// Custom Helpers for Likes (which don't have standard "id")
async function dbToggleLike(userId: string, postId: string, reactionType: string, isDelete: boolean): Promise<void> {
  // Update in-memory state
  let likes = (global as any).memoryLikes || [];
  if (isDelete) {
    likes = likes.filter((l: any) => !(l.userId === userId && l.postId === postId));
  } else {
    const existing = likes.find((l: any) => l.userId === userId && l.postId === postId);
    if (existing) {
      existing.reactionType = reactionType;
    } else {
      likes.push({ userId, postId, reactionType });
    }
  }
  (global as any).memoryLikes = likes;

  if (isUsingFirebase && firebaseDb) {
    try {
      const docId = `${userId}_${postId}`;
      const docRef = doc(firebaseDb, 'likes', docId);
      if (isDelete) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { userId, postId, reactionType }, { merge: true });
      }
    } catch (err) {
      console.error('⚠️ Firestore like error:', err);
    }
  }
}

// Custom Helpers for Followers (which don't have standard "id")
async function dbToggleFollow(followerId: string, followingId: string, isDelete: boolean): Promise<void> {
  // Update in-memory state
  if (isDelete) {
    memoryDb.followers = memoryDb.followers.filter(f => !(f.followerId === followerId && f.followingId === followingId));
  } else {
    const exists = memoryDb.followers.some(f => f.followerId === followerId && f.followingId === followingId);
    if (!exists) {
      memoryDb.followers.push({ followerId, followingId });
    }
  }

  if (isUsingFirebase && firebaseDb) {
    try {
      const docId = `${followerId}_${followingId}`;
      const docRef = doc(firebaseDb, 'followers', docId);
      if (isDelete) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { followerId, followingId }, { merge: true });
      }
    } catch (err) {
      console.error('⚠️ Firestore follow error:', err);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON body parser with limit for base64 photo uploads
  app.use(express.json({ limit: '15mb' }));

  // Initialize database connection (prioritizing Firebase Firestore)
  initDatabases();

  // --- API Routes ---

  // DB Engine Status Endpoint
  app.get('/api/db-status', (req, res) => {
    let engine = 'In-Memory Fallback DB Engine';
    if (isUsingFirebase) {
      engine = 'Firebase Firestore';
    }
    res.json({
      engine,
      connected: isUsingFirebase,
      isUsingFirebase,
      isUsingRealMongo: false,
      hasUri: false,
      hasFirebaseConfig: fs.existsSync(path.join(process.cwd(), 'firebase-applet-config.json'))
    });
  });

  // --- FIRESTORE DATA MIGRATION ENGINE ---
  app.post('/api/migrate-from-firebase', async (req, res) => {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (!fs.existsSync(configPath)) {
        return res.status(404).json({ error: 'firebase-applet-config.json file not found at project root' });
      }
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      // Dynamically import Firebase to keep dependencies separated and avoid load-time overhead
      const { initializeApp, getApps } = await import('firebase/app');
      const { getFirestore, collection, getDocs } = await import('firebase/firestore');

      const apps = getApps();
      const fbApp = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
      const fbDb = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);

      const collectionsToMigrate = [
        { name: 'users', key: 'id' },
        { name: 'posts', key: 'id' },
        { name: 'likes', key: null },
        { name: 'comments', key: 'id' },
        { name: 'followers', key: null },
        { name: 'messages', key: 'id' },
        { name: 'ads', key: 'id' },
        { name: 'withdrawals', key: 'id' },
        { name: 'notifications', key: 'id' },
        { name: 'postReports', key: 'id' }
      ];

      const results: Record<string, { fetched: number; migrated: number; errors?: string }> = {};

      for (const colInfo of collectionsToMigrate) {
        try {
          const colRef = collection(fbDb, colInfo.name);
          const snapshot = await getDocs(colRef);
          const docs = snapshot.docs.map(doc => ({ ...doc.data() }));

          if (docs.length === 0) {
            results[colInfo.name] = { fetched: 0, migrated: 0 };
            continue;
          }

          let migratedCount = 0;

          // Merge them into memoryDb so they are instantly visible even in server-memory fallback mode
          const memCol = (memoryDb as any)[colInfo.name];
          if (Array.isArray(memCol)) {
            for (const docData of docs) {
              if (colInfo.key && docData[colInfo.key]) {
                const idx = memCol.findIndex((item: any) => item[colInfo.key] === docData[colInfo.key]);
                if (idx >= 0) {
                  memCol[idx] = { ...memCol[idx], ...docData };
                } else {
                  memCol.push(docData);
                }
              } else {
                if (colInfo.name === 'likes') {
                  let memoryLikes = (global as any).memoryLikes || [];
                  const idx = memoryLikes.findIndex((l: any) => l.userId === docData.userId && l.postId === docData.postId);
                  if (idx >= 0) {
                    memoryLikes[idx] = docData;
                  } else {
                    memoryLikes.push(docData);
                  }
                  (global as any).memoryLikes = memoryLikes;
                } else if (colInfo.name === 'followers') {
                  const idx = memCol.findIndex((f: any) => f.followerId === docData.followerId && f.followingId === docData.followingId);
                  if (idx >= 0) {
                    memCol[idx] = docData;
                  } else {
                    memCol.push(docData);
                  }
                } else {
                  memCol.push(docData);
                }
              }
              migratedCount++;
            }
          }

          results[colInfo.name] = { fetched: docs.length, migrated: migratedCount };
        } catch (err: any) {
          results[colInfo.name] = { fetched: 0, migrated: 0, errors: err.message };
        }
      }

      res.json({
        success: true,
        databaseMode: 'In-Memory Fallback DB Engine',
        results
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- MIGRATE LOCAL TO FIRESTORE ---
  app.post('/api/migrate-to-firebase', async (req, res) => {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (!fs.existsSync(configPath)) {
        return res.status(404).json({ error: 'firebase-applet-config.json file not found at project root' });
      }
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      // Dynamically import Firebase
      const { initializeApp, getApps } = await import('firebase/app');
      const { getFirestore, doc, setDoc } = await import('firebase/firestore');

      const apps = getApps();
      const fbApp = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
      const fbDb = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);

      const collectionsToMigrate = [
        { name: 'users', key: 'id' },
        { name: 'posts', key: 'id' },
        { name: 'likes', key: null },
        { name: 'comments', key: 'id' },
        { name: 'followers', key: null },
        { name: 'messages', key: 'id' },
        { name: 'ads', key: 'id' },
        { name: 'withdrawals', key: 'id' },
        { name: 'notifications', key: 'id' },
        { name: 'postReports', key: 'id' }
      ];

      const results: Record<string, { fetched: number; migrated: number; errors?: string }> = {};

      for (const colInfo of collectionsToMigrate) {
        try {
          // Fetch from local source: memoryDb
          let docs: any[] = [];
          if (colInfo.name === 'likes') {
            docs = (global as any).memoryLikes || [];
          } else {
            docs = (memoryDb as any)[colInfo.name] || [];
          }

          if (docs.length === 0) {
            results[colInfo.name] = { fetched: 0, migrated: 0 };
            continue;
          }

          let migratedCount = 0;
          for (const docData of docs) {
            // Determine unique Firestore document ID
            let docId = '';
            if (colInfo.key && docData[colInfo.key]) {
              docId = docData[colInfo.key];
            } else if (colInfo.name === 'likes') {
              docId = `${docData.userId}_${docData.postId}`;
            } else if (colInfo.name === 'followers') {
              docId = `${docData.followerId}_${docData.followingId}`;
            } else {
              // Generate some random ID if none exists
              docId = docData.id || Math.random().toString(36).substring(2, 15);
            }

            const docRef = doc(fbDb, colInfo.name, docId);
            await setDoc(docRef, docData, { merge: true });
            migratedCount++;
          }

          results[colInfo.name] = { fetched: docs.length, migrated: migratedCount };
        } catch (err: any) {
          results[colInfo.name] = { fetched: 0, migrated: 0, errors: err.message };
        }
      }

      res.json({
        success: true,
        results
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- USERS COLLECTIONS ---
  app.get('/api/users', async (req, res) => {
    try {
      const users = await dbFindAll('users');
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const user = await dbFindOne('users', id);
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/users', async (req, res) => {
    const user = req.body as User;
    if (!user.id) {
      return res.status(400).json({ error: 'User id is required' });
    }
    try {
      await dbUpsert('users', user.id, user);
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
      const updatedUser = await dbUpdateOne('users', id, updates);
      res.json(updatedUser);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await dbDeleteOne('users', id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- POSTS COLLECTIONS ---
  app.get('/api/posts', async (req, res) => {
    try {
      const posts = await dbFindAll('posts');
      res.json(posts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/posts', async (req, res) => {
    const post = req.body as Post;
    try {
      await dbUpsert('posts', post.id, post);
      res.json(post);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/posts/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
      const updatedPost = await dbUpdateOne('posts', id, updates);
      res.json(updatedPost);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/posts/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await dbDeleteOne('posts', id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- COMMENTS ---
  app.get('/api/comments', async (req, res) => {
    try {
      const comments = await dbFindAll('comments');
      res.json(comments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/comments', async (req, res) => {
    const comment = req.body as Comment;
    try {
      await dbUpsert('comments', comment.id, comment);
      res.json(comment);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/comments/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await dbDeleteOne('comments', id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- LIKES ---
  app.get('/api/likes', async (req, res) => {
    try {
      const likes = await dbFindAll('likes');
      res.json(likes);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/likes', async (req, res) => {
    const { userId, postId, reactionType, isDelete } = req.body;
    try {
      await dbToggleLike(userId, postId, reactionType, isDelete);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- FOLLOWERS ---
  app.get('/api/followers', async (req, res) => {
    try {
      const followers = await dbFindAll('followers');
      res.json(followers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/followers', async (req, res) => {
    const { followerId, followingId, isDelete } = req.body;
    try {
      await dbToggleFollow(followerId, followingId, isDelete);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- MESSAGES ---
  app.get('/api/messages', async (req, res) => {
    try {
      const messages = await dbFindAll('messages');
      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/messages', async (req, res) => {
    const message = req.body as Message;
    try {
      await dbUpsert('messages', message.id, message);
      res.json(message);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/messages/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
      const updatedMsg = await dbUpdateOne('messages', id, updates);
      res.json(updatedMsg);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- ADS BANNER ---
  app.get('/api/ads', async (req, res) => {
    try {
      const ads = await dbFindAll('ads');
      res.json(ads);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ads', async (req, res) => {
    const ad = req.body as AdBanner;
    try {
      await dbUpsert('ads', ad.id, ad);
      res.json(ad);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/ads/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
      const updatedAd = await dbUpdateOne('ads', id, updates);
      res.json(updatedAd);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- WITHDRAWALS ---
  app.get('/api/withdrawals', async (req, res) => {
    try {
      const withdrawals = await dbFindAll('withdrawals');
      res.json(withdrawals);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/withdrawals', async (req, res) => {
    const withdrawal = req.body as WithdrawalRequest;
    try {
      await dbUpsert('withdrawals', withdrawal.id, withdrawal);
      res.json(withdrawal);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/withdrawals/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
      const updatedWith = await dbUpdateOne('withdrawals', id, updates);
      res.json(updatedWith);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- NOTIFICATIONS ---
  app.get('/api/notifications', async (req, res) => {
    try {
      const notifications = await dbFindAll('notifications');
      res.json(notifications);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/notifications', async (req, res) => {
    const notif = req.body as Notification;
    try {
      await dbUpsert('notifications', notif.id, notif);
      res.json(notif);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/notifications/:id/read', async (req, res) => {
    const { id } = req.params;
    try {
      const updated = await dbUpdateOne('notifications', id, { read: true });
      res.json({ success: true, updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/notifications/read-all', async (req, res) => {
    const { userId } = req.body;
    try {
      const allNotifs = await dbFindAll('notifications');
      for (const n of allNotifs) {
        if (n.userId === userId && !n.read) {
          await dbUpdateOne('notifications', n.id, { read: true });
        }
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- POST REPORTS ---
  app.get('/api/post-reports', async (req, res) => {
    try {
      const reports = await dbFindAll('postReports');
      res.json(reports);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/post-reports', async (req, res) => {
    const report = req.body as PostReport;
    try {
      await dbUpsert('postReports', report.id, report);
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/post-reports/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
      const updatedRep = await dbUpdateOne('postReports', id, updates);
      res.json(updatedRep);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- SAVED DRAFTS ---
  app.get('/api/drafts', async (req, res) => {
    try {
      const drafts = await dbFindAll('drafts');
      res.json(drafts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/drafts', async (req, res) => {
    const draft = req.body as Draft;
    try {
      await dbUpsert('drafts', draft.id, draft);
      res.json(draft);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/drafts/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await dbDeleteOne('drafts', id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // --- Vite & Client static serving middleware ---

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Full-stack Server running on http://localhost:${PORT}`);
  });
}

startServer();
