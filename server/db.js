import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const KEY_FILE = path.join(__dirname, '..', 'firebase-key.json');

// Password hashing
export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Initial trips seeds
const initialTrips = [
  {
    id: "trip-nepal",
    title: "Bhabua to Nepal Tour (जनकपुर-काठमांडू-पोखरा दर्शन)",
    destination: "Nepal",
    startDate: "2026-06-25",
    endDate: "2026-07-02",
    price: 8999,
    busType: "AC Volvo Luxury Bus",
    totalSeats: 65,
    status: "upcoming",
    description: "Experience the ultimate Nepal pilgrimage and sightseeing tour. Visit Mother Janaki Temple in Janakpur, Pashupatinath Temple in Kathmandu, and enjoy beautiful lakes in Pokhara.",
    descriptionHi: "नेपाल यात्रा और दर्शन का संपूर्ण अनुभव। जनकपुर में माता जानकी मंदिर दर्शन, काठमांडू में पशुपतिनाथ मंदिर और स्वयंभूनाथ के दर्शन, तथा पोखरा की वादियों और फेवा झील की सैर।",
    createdAt: new Date().toISOString()
  },
  {
    id: "trip-kedarnath",
    title: "Bhabua to Kedarnath Dham Darshan",
    destination: "Kedarnath",
    startDate: "2026-07-10",
    endDate: "2026-07-18",
    price: 15499,
    busType: "AC Volvo Luxury Bus",
    totalSeats: 65,
    status: "upcoming",
    description: "A sacred journey from Bhabua to the holy Kedarnath temple in Uttarakhand. Includes hotel stay, transit, food, and guide support.",
    descriptionHi: "उत्तराखंड के पवित्र केदारनाथ धाम की मंगलमय तीर्थ यात्रा। इसमें होटल प्रवास, बस यात्रा, भोजन और गाइड सहायता शामिल है।",
    createdAt: new Date().toISOString()
  },
  {
    id: "trip-amarnath",
    title: "Bhabua to Shri Amarnath Yatra",
    destination: "Amarnath",
    startDate: "2026-07-25",
    endDate: "2026-08-04",
    price: 18999,
    busType: "AC Volvo Luxury Bus",
    totalSeats: 65,
    status: "upcoming",
    description: "Embark on the divine spiritual journey to Baba Barfani Amarnath Cave. Hotel stays, medical assistance support, and registration guidance included.",
    descriptionHi: "बाबा बर्फानी अमरनाथ गुफा की पावन यात्रा। होटल में ठहरने की व्यवस्था, मेडिकल सपोर्ट और यात्रा रजिस्ट्रेशन सहायता शामिल है।",
    createdAt: new Date().toISOString()
  },
  {
    id: "trip-sikkim",
    title: "Bhabua to Sikkim Gangtok Scenic Tour",
    destination: "Sikkim Gangtok",
    startDate: "2026-08-10",
    endDate: "2026-08-17",
    price: 12999,
    busType: "AC Volvo Luxury Bus",
    totalSeats: 65,
    status: "upcoming",
    description: "Explore the stunning landscapes of Sikkim, Gangtok, Tsomgo Lake, and Baba Mandir with AC sleeper comfort.",
    descriptionHi: "सिक्किम, गंगटोक, त्सोमगो झील और बाबा मंदिर की सुंदर वादियों की सैर, आरामदेह AC स्लीपर बस के सफर के साथ।",
    createdAt: new Date().toISOString()
  }
];

// Initial admin seed
const initialAdmin = {
  id: "admin-id-123",
  username: "admin",
  password: hashPassword("admin123"),
  name: "Platform Admin",
  phone: "6200851221",
  address: "Bhabua Nagar Parishad, Ward No. 11",
  role: "admin",
  createdAt: new Date().toISOString()
};

// Mode Flag
let firebaseInitialized = false;
let firestore = null;

// Initialize Firebase Admin
function initFirebase() {
  try {
    let serviceAccount = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else if (fs.existsSync(KEY_FILE)) {
      serviceAccount = JSON.parse(fs.readFileSync(KEY_FILE, 'utf-8'));
    }

    if (serviceAccount) {
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      }
      firestore = admin.firestore();
      try {
        firestore.settings({ preferRest: true });
      } catch (settingsError) {
        console.warn("Firestore settings already configured or failed:", settingsError.message);
      }
      firebaseInitialized = true;
      console.log(">>> Firebase Connection: SUCCESS (Connected to cloud Firestore)");
      seedFirebaseData();
    } else {
      console.warn("=========================================================");
      console.warn(">>> NOTICE: No Firebase Service Account credentials found!");
      console.warn("The database will automatically run in local fallback mode.");
      console.warn("=========================================================");
    }
  } catch (e) {
    console.error(">>> Firebase Connection: FAILED.", e);
  }
}

// Seed Firebase
async function seedFirebaseData() {
  try {
    // 1. Seed Trips if empty
    const tripsSnap = await firestore.collection('trips').limit(1).get();
    if (tripsSnap.empty) {
      console.log(">>> Seeding initial tours to Firebase Firestore...");
      for (const trip of initialTrips) {
        await firestore.collection('trips').doc(trip.id).set(trip);
      }
    }
    
    // 2. Seed Admin user if empty
    const adminSnap = await firestore.collection('users').where('username', '==', 'admin').get();
    if (adminSnap.empty) {
      console.log(">>> Seeding admin user account to Firebase Firestore...");
      await firestore.collection('users').doc(initialAdmin.id).set(initialAdmin);
    }
  } catch (error) {
    console.error(">>> Error seeding Firestore data:", error);
  }
}

// Fallback Local File Database Helpers
function initLocalDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify({ users: [initialAdmin], trips: initialTrips, bookings: [] }, null, 2), 'utf-8');
    }
  } catch (e) {
    console.warn(">>> Local DB initialization skipped (Read-only filesystem on Vercel):", e.message);
  }
}

initLocalDb();
initFirebase();

function readLocalDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (error) {
    return { users: [], trips: [], bookings: [] };
  }
}

function writeLocalDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Local database write error:", error);
  }
}

// Export database connector abstraction (Async Promises)
export const db = {
  isFirebaseActive() {
    return firebaseInitialized;
  },

  // USERS
  async getUsers() {
    if (firebaseInitialized) {
      const snapshot = await firestore.collection('users').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      return readLocalDb().users;
    }
  },
  
  async saveUser(user) {
    if (firebaseInitialized) {
      await firestore.collection('users').doc(user.id).set(user);
    } else {
      const data = readLocalDb();
      const idx = data.users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        data.users[idx] = user;
      } else {
        data.users.push(user);
      }
      writeLocalDb(data);
    }
  },

  // TRIPS
  async getTrips() {
    if (firebaseInitialized) {
      const snapshot = await firestore.collection('trips').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      return readLocalDb().trips;
    }
  },

  async saveTrip(trip) {
    if (firebaseInitialized) {
      await firestore.collection('trips').doc(trip.id).set(trip);
    } else {
      const data = readLocalDb();
      const idx = data.trips.findIndex(t => t.id === trip.id);
      if (idx !== -1) {
        data.trips[idx] = trip;
      } else {
        data.trips.push(trip);
      }
      writeLocalDb(data);
    }
  },

  async deleteTrip(tripId) {
    if (firebaseInitialized) {
      await firestore.collection('trips').doc(tripId).delete();
    } else {
      const data = readLocalDb();
      data.trips = data.trips.filter(t => t.id !== tripId);
      writeLocalDb(data);
    }
  },

  // BOOKINGS
  async getBookings() {
    if (firebaseInitialized) {
      const snapshot = await firestore.collection('bookings').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      return readLocalDb().bookings;
    }
  },
  
  async saveBooking(booking) {
    if (firebaseInitialized) {
      await firestore.collection('bookings').doc(booking.id).set(booking);
    } else {
      const data = readLocalDb();
      data.bookings.push(booking);
      writeLocalDb(data);
    }
  },

  async updateBooking(bookingId, updates) {
    if (firebaseInitialized) {
      await firestore.collection('bookings').doc(bookingId).update(updates);
    } else {
      const data = readLocalDb();
      const idx = data.bookings.findIndex(b => b.id === bookingId);
      if (idx !== -1) {
        data.bookings[idx] = { ...data.bookings[idx], ...updates };
        writeLocalDb(data);
      }
    }
  }
};
