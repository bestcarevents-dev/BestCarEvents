import {admin} from '@/lib/firebase-admin';
import crypto from 'crypto';

export type CacheProvider = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
};

class FirestoreCache implements CacheProvider {
  private collectionName: string;
  constructor(collectionName = 'translations_cache') {
    this.collectionName = collectionName;
  }
  async get(key: string): Promise<string | null> {
    const snap = await admin.firestore().collection(this.collectionName).doc(key).get();
    if (!snap.exists) return null;
    const data = snap.data() as {value: string} | undefined;
    return data?.value ?? null;
  }
  async set(key: string, value: string): Promise<void> {
    await admin
      .firestore()
      .collection(this.collectionName)
      .doc(key)
      .set({value, updatedAt: admin.firestore.FieldValue.serverTimestamp()});
  }
}

export const cache: CacheProvider = new FirestoreCache();

export function computeStableHash(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

export function cacheKeyFrom(hash: string, locale: string): string {
  return `${hash}:${locale}`;
}


