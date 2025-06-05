import { Booking } from '@/shared/types/booking';

const DB_NAME = 'barber-app-db';
const DB_VERSION = 1;
const BOOKINGS_STORE = 'bookings';

export class IndexedDBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(BOOKINGS_STORE)) {
          db.createObjectStore(BOOKINGS_STORE, { keyPath: 'id' });
        }
      };
    });
  }

  async saveBooking(booking: Booking): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(BOOKINGS_STORE, 'readwrite');
      const store = transaction.objectStore(BOOKINGS_STORE);
      const request = store.put(booking);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getBooking(id: string): Promise<Booking | null> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(BOOKINGS_STORE, 'readonly');
      const store = transaction.objectStore(BOOKINGS_STORE);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAllBookings(): Promise<Booking[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(BOOKINGS_STORE, 'readonly');
      const store = transaction.objectStore(BOOKINGS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteBooking(id: string): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(BOOKINGS_STORE, 'readwrite');
      const store = transaction.objectStore(BOOKINGS_STORE);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearAllBookings(): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(BOOKINGS_STORE, 'readwrite');
      const store = transaction.objectStore(BOOKINGS_STORE);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const indexedDBService = new IndexedDBService(); 