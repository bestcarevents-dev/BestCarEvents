import {getAdmin} from '@/lib/firebase-admin';
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
    const DEBUG = (global as any).__TRANSLATE_DEBUG === true || process.env.TRANSLATE_DEBUG === '1' || process.env.TRANSLATE_DEBUG === 'true';
    const admin = getAdmin();
    const t0 = Date.now();
    const snap = await admin.firestore().collection(this.collectionName).doc(key).get();
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.log('[translate/cache:get]', { key, ms: Date.now() - t0, exists: snap.exists });
    }
    if (!snap.exists) return null;
    const data = snap.data() as {value: string} | undefined;
    return data?.value ?? null;
  }
  async set(key: string, value: string): Promise<void> {
    const DEBUG = (global as any).__TRANSLATE_DEBUG === true || process.env.TRANSLATE_DEBUG === '1' || process.env.TRANSLATE_DEBUG === 'true';
    const admin = getAdmin();
    const t0 = Date.now();
    await admin
      .firestore()
      .collection(this.collectionName)
      .doc(key)
      .set({value, updatedAt: admin.firestore.FieldValue.serverTimestamp()});
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.log('[translate/cache:set]', { key, ms: Date.now() - t0 });
    }
  }
}

export const cache: CacheProvider = new FirestoreCache();

export function computeStableHash(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

export function cacheKeyFrom(hash: string, locale: string): string {
  return `${hash}:${locale}`;
}


