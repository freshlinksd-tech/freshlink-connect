/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Post, Comment, Follower, Message, InterestOption } from '../types';

export const INTEREST_OPTIONS: InterestOption[] = [
  { id: 'technology', name: 'Technology', icon: 'Cpu', description: 'AI, coding, gadgets, and futuristic systems' },
  { id: 'travel', name: 'Travel', icon: 'Compass', description: 'Ocean travels, hidden gems, and road trips' },
  { id: 'fitness', name: 'Fitness', icon: 'Dumbbell', description: 'Strength, health, dieting, and yoga' },
  { id: 'photography', name: 'Photography', icon: 'Camera', description: 'Lenses, darkroom tips, landscapes, and light' },
  { id: 'food', name: 'Food', icon: 'Utensils', description: 'Spices, pastry baking, fine dining, and local eateries' },
  { id: 'business', name: 'Business', icon: 'Briefcase', description: 'Startups, venture capital, and leadership insights' }
];

export const SEED_USERS: User[] = [
  {
    id: 'user_alice',
    name: 'Alice Devon',
    email: 'alice@nexus.com',
    bio: 'Software Architect & AI researcher. Obsessed with neural networks, compiler optimization, and dark chocolate.',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&h=250&q=80',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    location: 'San Francisco, CA',
    interests: ['technology', 'business'],
    socialLinks: {
      twitter: 'alice_devon',
      github: 'aliced',
      website: 'alicedevon.io'
    },
    savedPosts: [],
    createdAt: '2026-01-15T10:00:00Z'
  },
  {
    id: 'user_bob',
    name: 'Bob Matthews',
    email: 'bob@nexus.com',
    bio: 'Wanderlust photojournalist. Capturing remote corners of the world. Currently driving through Patagonia.',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&h=250&q=80',
    coverImage: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
    location: 'Sarmiento, Argentina',
    interests: ['travel', 'photography'],
    socialLinks: {
      twitter: 'bob_patagonia',
      website: 'bobphotos.com'
    },
    savedPosts: [],
    createdAt: '2026-02-10T08:30:00Z'
  },
  {
    id: 'user_charlie',
    name: 'Charlie Flex',
    email: 'charlie@nexus.com',
    bio: 'Strength Coach & Certified Dietitian. Helping everyone build sustainable athletic habits. Eat whole, lift heavy.',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&h=250&q=80',
    coverImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
    location: 'Austin, TX',
    interests: ['fitness', 'food'],
    socialLinks: {
      twitter: 'charlie_flex',
      github: 'flexcoach'
    },
    savedPosts: [],
    createdAt: '2026-03-01T12:00:00Z'
  },
  {
    id: 'user_david',
    name: 'Chef David Chen',
    email: 'david@nexus.com',
    bio: 'Ex-Michelin sous-chef, now sharing experimental home cooking. Making gourmet techniques accessible to all.',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&h=250&q=80',
    coverImage: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
    location: 'Brooklyn, NY',
    interests: ['food', 'travel', 'business'],
    socialLinks: {
      twitter: 'chefdavid_chen',
      website: 'davidcooks.co'
    },
    savedPosts: [],
    createdAt: '2026-03-12T09:15:00Z'
  }
];

export const SEED_POSTS: Post[] = [
  {
    id: 'post_1',
    userId: 'user_alice',
    title: 'The Blueprint for LLM Fine-Tuning in 2026',
    content: `Large Language Models have revolutionized how we interactive-engineer user designs, but generic API prompts often fall short when specialized domain vertical compliance or stylistic constraints are needed.

To bridge this gap, custom fine-tuning has transitioned from an expensive elite sport to an accessible developer pipeline. Here is the modern methodology:

1. **Precision Annotation:** Clean your telemetry data. Remove redundant boilerplates, noisy context inputs, and system formatting tags. High density is better than extreme volume. Or coordinate with targeted labels!
2. **LoRA & QLoRA Adaptors:** Low-Rank Adaptation allows fine-tuning heavy 70B parameter foundations on accessible single-GPU machines. We map optimization structures into compact adapter layers.
3. **Evaluating Alignment:** Set strict benchmarks. Monitor and mitigate "Catastrophic Forgetting" triggers to ensure model general capabilities do not degrade while domain expertise climbs.

In our current test cycles, fine-tuning resulted in a 44% drop in latency and a 3x higher semantic precision score on proprietary schema compilations.`,
    mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    category: 'technology',
    tags: ['AI', 'LLMs', 'Fine-Tuning', 'Programming'],
    status: 'published',
    createdAt: '2026-06-10T14:20:00Z',
    readingTime: 4
  },
  {
    id: 'post_2',
    userId: 'user_bob',
    title: 'Patagonia Road Trip: Into the Wilderness',
    content: `There is a wind that screams over the high Patagonian steppes, carrying with it the cold breath of the southern ice fields. Sitting in the driver seat, dust scratching at the dashboard, you realize how truly remote this corner of the globe is.

Our travel crew completed a 1,200 km loop starting from El Calafate up along the legendary Ruta 40.

**Key Road Insights & Highlights:**
- **The Glaciers:** Hearing the deep, ancient crack of Perito Moreno as building-sized ice blocks shear into water is a visceral shock.
- **Off-Grid Mastery:** Fuel stations can be 300 km apart. Carry extra canisters, spare tires, water, and beef jerky.
- **The Photography:** The light here peak-shines at 9 PM during southern summers. The long golden hours turn Fitz Roy peaks into literal orange flares against slate skies.

I've uploaded some of my preferred panoramic raw frames below. Truly a bucket list challenge for any serious photographer.`,
    mediaUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
    category: 'travel',
    tags: ['Patagonia', 'RoadTrip', 'Photography', 'Adventure'],
    status: 'published',
    createdAt: '2026-06-11T16:45:00Z',
    readingTime: 5
  },
  {
    id: 'post_3',
    userId: 'user_charlie',
    title: 'The Myth of "Toning Sessions": Build Real Power',
    content: `If you walk into any commercial gym, you will see rows of people doing high-repetition, light-weight sets to "tone" their muscles. Let's break down the actual physiology:

You cannot "tone" a muscle. Muscles can only do two things: grow (hypertrophy) or shrink (atrophy). What people call a "toned look" is simply having a sufficient base of muscle mass paired with low-enough body fat to make those muscle outlines visible.

**A Better Protocol for Athletic Progression:**
1. **Compound Multi-Joint Lifts:** Master squats, deadlifts, overhead presses, and pull-ups. They recruit huge kinetic chains and trigger optimal hormonal feedback.
2. **Progressive Overload:** If you lift 100 lbs today for 8 reps, try 102 lbs next week. Muscle adapts only to unmatched triggers.
3. **Calorically Aligned Dieting:** High protein is essential, but starving yourself strips away muscle! Lean on high-quality carbohydrate fuel.

Stop chasing sweat metrics; chase tangible, incremental load gains, and the aesthetics will follow naturally!`,
    mediaUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=80',
    category: 'fitness',
    tags: ['Fitness', 'Weightlifting', 'Health', 'Workout'],
    status: 'published',
    createdAt: '2026-06-12T08:00:00Z',
    readingTime: 3
  },
  {
    id: 'post_4',
    userId: 'user_david',
    title: 'Mastering the 72-Hour Sourdough Neapolitan Crust',
    content: `Bringing restaurant-caliber pizza to a domestic kitchen oven is an exercise in heat retention and hydration science. Traditional deck ovens flame at 900°F matching a 60-second express bake. Here is how we replicate it inside standard 550°F kitchen setups:

**The Crucial Hydration Equation:**
At home, you need a slightly higher hydration ratio (around 68%) to prevent the dough from turning into biscuit brick crackers during the longer 6-minute bake.

**The Poolish Pre-Ferment Process:**
- 100g Typo 00 Flour + 100g Water + 0.5g Instant Yeast.
- Rest on the counter for 4 hours, then cold-ferment in the fridge for 24 hours. The organic acid compounds generated here develop intense aroma.
- Incorporate this poolish into the final dough and execute standard windowpane kneading. Cold-proves for another 48 hours.

The result? An ultra-airy, Leopard-spotted crust that explodes with woodfire aroma, despite being baked inside a standard NY kitchen apartment oven!`,
    mediaUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    category: 'food',
    tags: ['Food', 'Baking', 'Recipes', 'Sourdough', 'Pizza'],
    status: 'published',
    createdAt: '2026-06-13T11:30:00Z',
    readingTime: 6
  }
];

export const SEED_FOLLOWERS: Follower[] = [
  { followerId: 'user_alice', followingId: 'user_bob' },
  { followerId: 'user_bob', followingId: 'user_alice' },
  { followerId: 'user_charlie', followingId: 'user_david' },
  { followerId: 'user_david', followingId: 'user_charlie' },
  { followerId: 'user_david', followingId: 'user_alice' }
];

export const SEED_COMMENTS: Comment[] = [
  {
    id: 'com_1',
    userId: 'user_bob',
    postId: 'post_1',
    comment: 'This is super clean instruction, Alice! Do you have standard hyperparameter templates for consumer-grade RTX 4090s?',
    createdAt: '2026-06-10T15:30:00Z'
  },
  {
    id: 'com_2',
    userId: 'user_alice',
    postId: 'post_2',
    comment: 'Bob, these shots are majestic. Patagonia is on my bucket list. The sharpness in the Fitz Roy summits is crisp!',
    createdAt: '2026-06-11T18:00:00Z'
  },
  {
    id: 'com_3',
    userId: 'user_david',
    postId: 'post_3',
    comment: 'Totally agree on progressive overload. I applied this to physical rehab and muscle retention after a kitchen accident. Life-saver!',
    createdAt: '2026-06-12T10:15:00Z'
  }
];

export const SEED_MESSAGES: Message[] = [
  {
    id: 'msg_1',
    senderId: 'user_bob',
    receiverId: 'user_alice',
    message: 'Hey Alice! Hope you are doing well. I saw your post on fine-tuning. Super dope!',
    createdAt: '2026-06-13T09:00:00Z',
    read: true
  },
  {
    id: 'msg_2',
    senderId: 'user_alice',
    receiverId: 'user_bob',
    message: 'Thanks Bob! Keep crushing Patagonia. The photography of Fitz Roy is literally blowing up on the home feeds!',
    createdAt: '2026-06-13T09:12:00Z',
    read: true
  },
  {
    id: 'msg_3',
    senderId: 'user_bob',
    receiverId: 'user_alice',
    message: 'Haha, appreciated! Is there a quick chat session where I can ask you a few questions about local GPU specs to train a custom Lightroom model?',
    createdAt: '2026-06-13T09:15:00Z',
    read: false
  },
  {
    id: 'msg_4',
    senderId: 'user_david',
    receiverId: 'user_charlie',
    message: 'Hey Charlie, cooked that high-protein post-workout salmon sourdough sandwich today. Let me know if you want the macro count!',
    createdAt: '2026-06-13T14:00:00Z',
    read: false
  }
];
