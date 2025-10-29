
import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Support two ways to provide config:
// 1) A single JSON string in NEXT_PUBLIC_FIREBASE_CONFIG
// 2) Individual NEXT_PUBLIC_FIREBASE_* env vars (common in Next.js)
function buildConfigFromEnv(): FirebaseOptions | null {
	if (process.env.NEXT_PUBLIC_FIREBASE_CONFIG) {
		try {
			const parsed = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG);
			if (Object.keys(parsed).length === 0) return null;
			return parsed as FirebaseOptions;
		} catch (e) {
			// ignore and try individual vars
			// eslint-disable-next-line no-console
			console.warn('NEXT_PUBLIC_FIREBASE_CONFIG exists but could not be parsed as JSON. Falling back to individual env vars.');
		}
	}

	const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
	const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
	const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
	const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
	const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
	const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
	const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

	if (apiKey && authDomain && projectId && storageBucket && messagingSenderId && appId) {
		const cfg: FirebaseOptions = {
			apiKey,
			authDomain,
			projectId,
			storageBucket,
			messagingSenderId,
			appId,
		};
		if (measurementId) (cfg as any).measurementId = measurementId;
		return cfg;
	}

	return null;
}

const firebaseConfig = buildConfigFromEnv();

if (!firebaseConfig) {
	// Helpful runtime error to guide the developer — avoids confusing Firebase errors like auth/configuration-not-found
	throw new Error(
		'Firebase configuration not found. Set NEXT_PUBLIC_FIREBASE_CONFIG (JSON) or individual NEXT_PUBLIC_FIREBASE_* env vars in .env.local. See README or Firebase console for required values.'
	);

}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
