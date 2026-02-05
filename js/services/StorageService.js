/**
 * StorageService - Handles IndexedDB operations for offline-first storage
 */
export class StorageService {
  constructor() {
    this._dbName = "f17n355-db";
    this._dbVersion = 1;
    this._db = null;
  }

  /**
   * Initialize the database
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this._dbName, this._dbVersion);

      request.onerror = () => {
        reject(new Error("Failed to open database"));
      };

      request.onsuccess = (event) => {
        this._db = event.target.result;
        resolve(this._db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains("athletes")) {
          db.createObjectStore("athletes", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("workouts")) {
          const workoutStore = db.createObjectStore("workouts", {
            keyPath: "id",
          });
          workoutStore.createIndex("date", "date", { unique: false });
          workoutStore.createIndex("tier", "tier", { unique: false });
          workoutStore.createIndex("milestoneType", "milestoneType", {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains("progress")) {
          db.createObjectStore("progress", { keyPath: "id" });
        }
      };
    });
  }

  /**
   * Get database connection (lazy initialization)
   */
  async getDb() {
    if (!this._db) {
      await this.initialize();
    }
    return this._db;
  }

  /**
   * Generic get item from store
   */
  async getItem(storeName, key) {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new Error(`Failed to get item from ${storeName}`));
    });
  }

  /**
   * Generic get all items from store
   */
  async getAllItems(storeName) {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () =>
        reject(new Error(`Failed to get all items from ${storeName}`));
    });
  }

  /**
   * Generic put item to store
   */
  async putItem(storeName, item) {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new Error(`Failed to put item to ${storeName}`));
    });
  }

  /**
   * Generic delete item from store
   */
  async deleteItem(storeName, key) {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(`Failed to delete item from ${storeName}`));
    });
  }

  /**
   * Query items by index
   */
  async queryByIndex(storeName, indexName, value) {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () =>
        reject(new Error(`Failed to query ${storeName} by ${indexName}`));
    });
  }

  /**
   * Clear all data from a store
   */
  async clearStore(storeName) {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to clear ${storeName}`));
    });
  }
}
