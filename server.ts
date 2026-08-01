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
  drafts: [] as Draft[],
  audit_logs: [] as any[],
  system_logs: [] as any[]
};

async function withTimeout<T>(promise: Promise<T>, ms = 3500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Firestore query timeout after ${ms}ms`)), ms))
  ]);
}

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
      
      // Seed & pre-warm Firestore in background non-blocking
      seedFirebaseIfEmpty().catch(err => console.error("Background seed error:", err));
      warmupMemoryDbFromFirestore().catch(err => console.error("Background warmup error:", err));
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

async function warmupMemoryDbFromFirestore() {
  if (!firebaseDb) return;
  const collections = ['users', 'posts', 'comments', 'followers', 'messages', 'ads', 'withdrawals', 'notifications', 'postReports', 'drafts', 'audit_logs', 'system_logs'];
  for (const col of collections) {
    try {
      const colRef = collection(firebaseDb, col);
      const snapshot = await withTimeout(getDocs(colRef), 4000);
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (docs.length > 0) {
        if (col === 'likes') {
          (global as any).memoryLikes = docs;
        } else {
          const existing = (memoryDb as any)[col] || [];
          const map = new Map<string, any>();
          existing.forEach((item: any) => { if (item && item.id) map.set(item.id, item); });
          docs.forEach((item: any) => { if (item && item.id) map.set(item.id, item); });
          (memoryDb as any)[col] = Array.from(map.values());
        }
      }
    } catch (e) {
      // Quiet fail during background warmup
    }
  }
  console.log('⚡ Warmup of in-memory cache from Firestore completed!');
}

async function seedFirebaseIfEmpty() {
  if (!firebaseDb) return;
  try {
    console.log('🌱 Syncing default seed documents into Firebase Firestore...');

    const tasks: Promise<any>[] = [];

    for (const u of SEED_USERS) {
      tasks.push(withTimeout(setDoc(doc(firebaseDb, 'users', u.id), u, { merge: true }), 4000));
    }

    for (const p of SEED_POSTS) {
      tasks.push(withTimeout(setDoc(doc(firebaseDb, 'posts', p.id), p, { merge: true }), 4000));
    }

    for (const c of SEED_COMMENTS) {
      tasks.push(withTimeout(setDoc(doc(firebaseDb, 'comments', c.id), c, { merge: true }), 4000));
    }

    for (const f of SEED_FOLLOWERS) {
      const docId = `${f.followerId}_${f.followingId}`;
      tasks.push(withTimeout(setDoc(doc(firebaseDb, 'followers', docId), f, { merge: true }), 4000));
    }

    for (const m of SEED_MESSAGES) {
      tasks.push(withTimeout(setDoc(doc(firebaseDb, 'messages', m.id), m, { merge: true }), 4000));
    }

    await Promise.allSettled(tasks);
    console.log('✅ Firebase Firestore collection seed sync finished!');
  } catch (err) {
    console.error('❌ Error verifying Firebase Firestore collections:', err);
  }
}

// --- Database Utility Adapters ---

async function dbFindAll(collectionName: string): Promise<any[]> {
  let fetched: any[] = [];
  if (isUsingFirebase && firebaseDb) {
    try {
      const colRef = collection(firebaseDb, collectionName);
      const snapshot = await withTimeout(getDocs(colRef), 3500);
      fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn(`⚠️ Firestore read timeout/error, using Memory DB cache for ${collectionName}:`, (err as any)?.message);
      if (collectionName === 'likes') {
        return (global as any).memoryLikes || [];
      }
      fetched = (memoryDb as any)[collectionName] || [];
    }
  } else {
    if (collectionName === 'likes') {
      return (global as any).memoryLikes || [];
    }
    fetched = (memoryDb as any)[collectionName] || [];
  }

  // Special handling for likes which use composite keys (userId_postId)
  if (collectionName === 'likes') {
    const memoryLikes = (global as any).memoryLikes || [];
    const likeMap = new Map<string, any>();
    memoryLikes.forEach((l: any) => {
      if (l && l.userId && l.postId) likeMap.set(`${l.userId}_${l.postId}`, l);
    });
    fetched.forEach((l: any) => {
      if (l && l.userId && l.postId) likeMap.set(`${l.userId}_${l.postId}`, l);
    });
    const mergedLikes = Array.from(likeMap.values());
    (global as any).memoryLikes = mergedLikes;
    return mergedLikes;
  }

  // Special handling for followers which use composite keys (followerId_followingId)
  if (collectionName === 'followers') {
    const memoryFollowers = memoryDb.followers || [];
    const fMap = new Map<string, any>();
    SEED_FOLLOWERS.forEach(f => fMap.set(`${f.followerId}_${f.followingId}`, f));
    memoryFollowers.forEach((f: any) => {
      if (f && f.followerId && f.followingId) fMap.set(`${f.followerId}_${f.followingId}`, f);
    });
    fetched.forEach((f: any) => {
      if (f && f.followerId && f.followingId) fMap.set(`${f.followerId}_${f.followingId}`, f);
    });
    const mergedFollowers = Array.from(fMap.values());
    memoryDb.followers = mergedFollowers;
    return mergedFollowers;
  }

  // Standard merge by id for all other collections
  const localItems = (memoryDb as any)[collectionName] || [];
  const map = new Map<string, any>();

  if (collectionName === 'users') SEED_USERS.forEach(u => map.set(u.id, u));
  if (collectionName === 'posts') SEED_POSTS.forEach(p => map.set(p.id, p));
  if (collectionName === 'comments') SEED_COMMENTS.forEach(c => map.set(c.id, c));
  if (collectionName === 'messages') SEED_MESSAGES.forEach(m => map.set(m.id, m));

  localItems.forEach((item: any) => {
    if (item && item.id) map.set(item.id, item);
  });
  fetched.forEach((item: any) => {
    if (item && item.id) map.set(item.id, item);
  });

  const merged = Array.from(map.values());
  (memoryDb as any)[collectionName] = merged;
  return merged;
}

async function dbFindOne(collectionName: string, id: string): Promise<any | null> {
  const localItem = (memoryDb as any)[collectionName]?.find((item: any) => item.id === id);
  if (localItem) return localItem;

  if (isUsingFirebase && firebaseDb) {
    try {
      const docRef = doc(firebaseDb, collectionName, id);
      const snap = await withTimeout(getDoc(docRef), 3000);
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } catch (err) {
      return null;
    }
  }
  return null;
}

async function dbUpsert(collectionName: string, id: string, data: any): Promise<void> {
  // Sync in-memory db immediately
  const arr = (memoryDb as any)[collectionName];
  if (Array.isArray(arr)) {
    const idx = arr.findIndex((item: any) => item.id === id);
    if (idx >= 0) {
      arr[idx] = { ...arr[idx], ...data };
    } else {
      arr.push(data);
    }
  } else {
    (memoryDb as any)[collectionName] = [data];
  }

  if (isUsingFirebase && firebaseDb) {
    try {
      await withTimeout(setDoc(doc(firebaseDb, collectionName, id), data, { merge: true }), 5000);
    } catch (err) {
      console.error(`⚠️ Firestore background write error for ${collectionName}/${id}:`, (err as any)?.message);
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
        await withTimeout(deleteDoc(docRef), 5000);
      } else {
        await withTimeout(setDoc(docRef, { userId, postId, reactionType }, { merge: true }), 5000);
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
        await withTimeout(deleteDoc(docRef), 5000);
      } else {
        await withTimeout(setDoc(docRef, { followerId, followingId }, { merge: true }), 5000);
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
  await initDatabases();

  // --- API Routes ---

  // --- SEO DYNAMIC ROUTES ---
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const posts = await dbFindAll('posts');
      const baseUrl = 'https://freshlinkconnect.info';
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      
      // Main Landing Page
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>1.0</priority>\n`;
      xml += `  </url>\n`;

      // Every blog post dynamic URL
      for (const p of posts) {
        if (p.id) {
          const lastMod = p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          xml += `  <url>\n`;
          xml += `    <loc>${baseUrl}/?post=${encodeURIComponent(p.id)}</loc>\n`;
          xml += `    <lastmod>${lastMod}</lastmod>\n`;
          xml += `    <changefreq>weekly</changefreq>\n`;
          xml += `    <priority>0.8</priority>\n`;
          xml += `  </url>\n`;
        }
      }

      xml += `</urlset>`;
      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (err) {
      res.status(500).send('Error generating sitemap');
    }
  });

  app.get('/robots.txt', (req, res) => {
    const robots = `# robots.txt for FreshLink Connect
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://freshlinkconnect.info/sitemap.xml
`;
    res.header('Content-Type', 'text/plain');
    res.send(robots);
  });

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

  // --- DATA AUDIT LOGS & SYSTEM LOGS ---
  app.get(['/api/audit-logs', '/api/system-logs'], async (req, res) => {
    try {
      const logs = await dbFindAll('system_logs');
      const auditLogs = await dbFindAll('audit_logs');
      const combinedMap = new Map();
      [...logs, ...auditLogs].forEach(item => {
        if (item && item.id) combinedMap.set(item.id, item);
      });
      res.json(Array.from(combinedMap.values()));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post(['/api/audit-logs', '/api/system-logs'], async (req, res) => {
    const entry = req.body;
    try {
      if (!entry.id) entry.id = `sys_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await Promise.allSettled([
        dbUpsert('system_logs', entry.id, entry),
        dbUpsert('audit_logs', entry.id, entry)
      ]);
      res.json(entry);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete(['/api/audit-logs', '/api/system-logs'], async (req, res) => {
    try {
      const logs = await dbFindAll('system_logs');
      const auditLogs = await dbFindAll('audit_logs');
      for (const log of [...logs, ...auditLogs]) {
        if (log && log.id) {
          await dbDeleteOne('system_logs', log.id);
          await dbDeleteOne('audit_logs', log.id);
        }
      }
      res.json({ success: true, count: logs.length + auditLogs.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- SEO & SITEMAP / ROBOTS ROUTES ---
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(
`User-agent: *
Allow: /
Allow: /sitemap.xml
Disallow: /api/admin
Disallow: /api/withdrawals
Disallow: /admin

Sitemap: https://freshlinkconnect.info/sitemap.xml`
    );
  });

  app.get('/sitemap.xml', async (req, res) => {
    try {
      const posts = await dbFindAll('posts');
      const users = await dbFindAll('users');

      const baseUrl = 'https://freshlinkconnect.info';
      const nowISO = new Date().toISOString();

      const staticRoutes = [
        { url: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
        { url: `${baseUrl}/?tab=feed`, priority: '0.9', changefreq: 'always' },
        { url: `${baseUrl}/?tab=explore`, priority: '0.8', changefreq: 'daily' },
        { url: `${baseUrl}/?tab=monetization`, priority: '0.6', changefreq: 'weekly' }
      ];

      const categories = ['technology', 'programming', 'design', 'lifestyle', 'business', 'sports', 'travel', 'food'];
      const categoryRoutes = categories.map(cat => ({
        url: `${baseUrl}/?tab=feed&category=${cat}`,
        priority: '0.7',
        changefreq: 'daily'
      }));

      const userUrls = users.map((u: any) => ({
        url: `${baseUrl}/?tab=profile&user=${u.id}`,
        priority: '0.7',
        changefreq: 'weekly'
      }));

      const postUrls = posts.map((p: any) => ({
        url: `${baseUrl}/?post=${p.id}`,
        priority: '0.8',
        changefreq: 'weekly'
      }));

      const allUrls = [...staticRoutes, ...categoryRoutes, ...userUrls, ...postUrls];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      for (const item of allUrls) {
        xml += `  <url>\n`;
        xml += `    <loc>${item.url}</loc>\n`;
        xml += `    <lastmod>${nowISO}</lastmod>\n`;
        xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
        xml += `    <priority>${item.priority}</priority>\n`;
        xml += `  </url>\n`;
      }

      xml += `</urlset>`;

      res.type('application/xml');
      res.send(xml);
    } catch (err: any) {
      res.status(500).send('<error>Failed to generate sitemap</error>');
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
