// Server-side Firebase Admin SDK initialization for API routes
import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

const serviceAccount = {
    // Place your service account credentials here or use environment variables for security
    // "type": "service_account",
    // ...
};

let app: App;
if (!getApps().length) {
    app = initializeApp({
        credential: cert(serviceAccount as any),
        databaseURL: "https://arogyantra-edcea-default-rtdb.firebaseio.com",
    });
} else {
    app = getApps()[0];
}

export const adminDatabase = getDatabase(app);
