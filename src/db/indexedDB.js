// db/indexedDB.js
// All IndexedDB access for the app's user store lives in this file.

const DB_NAME = 'SnakeGamePremiumDB';
const DB_VERSION = 1;
const USERS_STORE = 'users';

/**
 * Opens (and if needed, creates/upgrades) the IndexedDB database.
 * Returns a Promise that resolves with the open IDBDatabase instance.
 */
export function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(USERS_STORE)) {
        const store = db.createObjectStore(USERS_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        // Emails must be unique - enforce with a unique index.
        store.createIndex('email', 'email', { unique: true });
        store.createIndex('username', 'username', { unique: false });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Adds a new user to the users store.
 * user: { username, email, password }
 * Rejects if the email is already registered.
 */
export async function addUser(user) {
  const existing = await getUserByEmail(user.email);
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(USERS_STORE, 'readwrite');
    const store = tx.objectStore(USERS_STORE);
    const request = store.add(user);

    request.onsuccess = (event) => {
      resolve({ ...user, id: event.target.result });
    };
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Looks up a single user by email. Resolves with the user object or
 * undefined if no matching user exists.
 */
export async function getUserByEmail(email) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(USERS_STORE, 'readonly');
    const store = tx.objectStore(USERS_STORE);
    const index = store.index('email');
    const request = index.get(email);

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Validates email/password credentials against the stored users.
 * Resolves with the matching user (password included) on success,
 * or null if the credentials are invalid.
 */
export async function loginUser(email, password) {
  const user = await getUserByEmail(email);
  if (!user) return null;
  if (user.password !== password) return null;
  return user;
}

/**
 * Returns every user currently stored in the database.
 */
export async function getAllUsers() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(USERS_STORE, 'readonly');
    const store = tx.objectStore(USERS_STORE);
    const request = store.getAll();

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}
