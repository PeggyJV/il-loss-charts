import crypto from 'crypto';
import * as firebase from 'firebase-admin';

import appConfig from '@config';

const config = appConfig.firebase;
const baseUrl = appConfig.pools.deepLinkBaseUrl;
const algo = 'sha256';

class ShortLinks {
    static instance: ShortLinks;

    firebase: typeof firebase = firebase;
    firestore: FirebaseFirestore.Firestore;
    shorts: FirebaseFirestore.CollectionReference;

    private constructor() {
        try {
            this.init();
            this.firestore = firebase.firestore();
            this.shorts = this.firestore.collection('shorts');
        } catch (error) {
            console.error('Could not initialize Firebase Admin');
            throw error;
        }
    }

    private init() {
        if (config.serviceAccount.length === 0) {
            throw new Error('Firebase Service Account not configured!');
        }

        this.firebase.initializeApp({
            credential: firebase.credential.cert(config.serviceAccount),
        });
    }

    static getInstance(): ShortLinks {
        if (this.instance == null) {
            this.instance = new ShortLinks();
        }

        return this.instance;
    }

    poolUrl(poolId: string): string {
        return `${baseUrl}/${poolId}`;
    }

    hash(val: string): string {
        return crypto
            .createHash(algo)
            .update(val, 'utf8')
            .digest('hex')
            .slice(0, 5);
    }

    async _getUrl(key: string): Promise<string | undefined> {
        const doc = await this.shorts.doc(key).get();
        const data = doc?.data();
        if (data == null) {
            return;
        }

        return data.url as string;
    }

    async getByPool(poolId: string): Promise<string> {
        const url = this.poolUrl(poolId);
        const query = this.shorts.where('url', '==', url);

        const { docs } = await query.get();
        const data = docs[0];
        if (data == null) {
            // Throws so we don't memoize errors
            throw new Error('Could not find short url for pool');
        }

        return data.id;
    }

    async createShort(poolId: string, key: string): Promise<string> {
        const url = this.poolUrl(poolId);
        const result = await this.shorts.doc(key).set({ url });
        if (result.writeTime == null) {
            throw new Error('Could not write short to datastore');
        }

        return key;
    }

    async generateShort(
        network: string,
        poolId: string,
        iteration = 1,
    ): Promise<string> {
        if (iteration > 10) {
            throw new Error('Too many short url collisions');
        }

        const key = this.hash(`${network}:${poolId}:${iteration}`);
        const existing = await this._getUrl(key);
        if (existing) {
            return this.generateShort(network, poolId, iteration + 1);
        }

        return this.createShort(poolId, key);
    }
}

export default ShortLinks.getInstance();
