import * as admin from 'firebase-admin';

let initialized = false;

export function getAdmin(): typeof admin {
  if (initialized && admin.apps.length) return admin;

  // Prefer explicit FIREBASE_* envs; otherwise fall back to GOOGLE_APPLICATION_CREDENTIALS_JSON
  let serviceAccount: any = null;

  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
    };
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      const creds = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      serviceAccount = {
        type: 'service_account',
        project_id: creds.project_id,
        private_key_id: creds.private_key_id,
        private_key: (creds.private_key as string)?.replace(/\\n/g, '\n'),
        client_email: creds.client_email,
        client_id: creds.client_id,
        auth_uri: creds.auth_uri,
        token_uri: creds.token_uri,
        auth_provider_x509_cert_url: creds.auth_provider_x509_cert_url,
        client_x509_cert_url: creds.client_x509_cert_url,
        universe_domain: creds.universe_domain,
      };
    } catch (e) {
      throw new Error('Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON');
    }
  }

  if (!serviceAccount || !serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('Firebase Admin credentials are not configured');
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
      projectId: serviceAccount.project_id,
    });
  }
  initialized = true;
  return admin;
}
