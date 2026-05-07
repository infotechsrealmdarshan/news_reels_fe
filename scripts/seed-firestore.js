// This script can be used to seed your Firestore database with sample reel data
// Run with: node scripts/seed-firestore.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Your Firebase config (should match your .env.local)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const reelsCollection = collection(db, 'reels');

const sampleReels = [
  {
    title: "Breaking News: Tech Innovation",
    description: "Latest breakthrough in artificial intelligence and machine learning technologies are transforming industries worldwide.",
    videoUrl: "https://example.com/videos/tech-innovation.mp4",
    thumbnailUrl: "https://example.com/thumbnails/tech-innovation.jpg",
    category: "trending",
    videoId: "tech-innovation-001",
    isAd: false,
    cta: null
  },
  {
    title: "Celebrity Relationship Updates",
    description: "Get the latest news on your favorite celebrity couples and their relationship milestones.",
    videoUrl: "https://example.com/videos/celebrity-news.mp4",
    thumbnailUrl: "https://example.com/thumbnails/celebrity-news.jpg",
    category: "relationships",
    videoId: "celebrity-rel-002",
    isAd: false,
    cta: null
  },
  {
    title: "Morning Wellness Routine",
    description: "Start your day right with these amazing wellness tips and exercises for a healthier lifestyle.",
    videoUrl: "https://example.com/videos/wellness-routine.mp4",
    thumbnailUrl: "https://example.com/thumbnails/wellness-routine.jpg",
    category: "wellness",
    videoId: "wellness-003",
    isAd: false,
    cta: null
  },
  {
    title: "Fashion Trends 2024",
    description: "Discover the hottest fashion trends for this season and how to incorporate them into your wardrobe.",
    videoUrl: "https://example.com/videos/fashion-trends.mp4",
    thumbnailUrl: "https://example.com/thumbnails/fashion-trends.jpg",
    category: "lifestyle",
    videoId: "fashion-004",
    isAd: false,
    cta: null
  },
  {
    title: "Cultural Festival Highlights",
    description: "Experience the vibrant colors and traditions of cultural festivals from around the world.",
    videoUrl: "https://example.com/videos/cultural-festival.mp4",
    thumbnailUrl: "https://example.com/thumbnails/cultural-festival.jpg",
    category: "culture",
    videoId: "culture-005",
    isAd: false,
    cta: null
  }
];

async function seedFirestore() {
  try {
    console.log('Starting to seed Firestore with sample reel data...');
    
    for (const reel of sampleReels) {
      const docRef = await addDoc(reelsCollection, {
        ...reel,
        viewCount: Math.floor(Math.random() * 10000),
        likes: Math.floor(Math.random() * 1000),
        publishedAt: serverTimestamp()
      });
      console.log(`Added reel: ${reel.title} with ID: ${docRef.id}`);
    }
    
    console.log('Successfully seeded Firestore with sample data!');
  } catch (error) {
    console.error('Error seeding Firestore:', error);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  seedFirestore();
}

module.exports = { seedFirestore };
