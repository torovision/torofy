import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBcwWKhmrjcdRlJhDvaA8YI7j4Qctji4_U",
  authDomain: "torofy-d0179.firebaseapp.com",
  projectId: "torofy-d0179",
  storageBucket: "torofy-d0179.firebasestorage.app",
  messagingSenderId: "832914662816",
  appId: "1:832914662816:web:fd27cd9f12683aa3e9b0c5",
  measurementId: "G-QHGJGBWR3S"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Auth functions
export const registerUser = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const loginUser = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const logoutUser = () => signOut(auth);
export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);

// Firestore user data helpers
export async function initUserData(uid, displayName) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      displayName,
      likedSongs: [],
      playlists: [],
      recentArtists: [],
      recentSearches: [],
      createdAt: Date.now()
    });
  }
}

export async function getUserData(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function syncLikedSongs(uid, likedSongs) {
  await setDoc(doc(db, 'users', uid), { likedSongs }, { merge: true });
}

export async function syncPlaylists(uid, playlists) {
  await setDoc(doc(db, 'users', uid), { playlists }, { merge: true });
}

export async function syncRecentArtists(uid, recentArtists) {
  await setDoc(doc(db, 'users', uid), { recentArtists }, { merge: true });
}

export async function syncRecentSearches(uid, recentSearches) {
  await setDoc(doc(db, 'users', uid), { recentSearches }, { merge: true });
}

export { onAuthStateChanged };
