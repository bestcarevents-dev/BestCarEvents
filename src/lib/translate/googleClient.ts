import {v3} from '@google-cloud/translate';

type TranslationClients = {
  translationClient: v3.TranslationServiceClient;
  projectId: string;
  location: string;
  glossaryName?: string;
};

function readServiceAccountFromEnv(): {clientEmail: string; privateKey: string; projectId: string} {
  const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!json) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON is not set');
  }
  const parsed = JSON.parse(json);
  const clientEmail = parsed.client_email as string;
  const privateKey = (parsed.private_key as string)?.replace(/\\n/g, '\n');
  const projectId = (process.env.GOOGLE_CLOUD_PROJECT || parsed.project_id) as string;
  if (!clientEmail || !privateKey || !projectId) {
    throw new Error('Invalid service account JSON: missing client_email/private_key/project_id');
  }
  return {clientEmail, privateKey, projectId};
}

let cached: TranslationClients | null = null;

export function getTranslationClients(): TranslationClients {
  if (cached) return cached;

  const {clientEmail, privateKey, projectId} = readServiceAccountFromEnv();
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'global';
  const glossaryId = process.env.GOOGLE_TRANSLATION_GLOSSARY_ID || undefined;

  const translationClient = new v3.TranslationServiceClient({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    projectId,
  });

  const glossaryName = glossaryId
    ? `projects/${projectId}/locations/${location}/glossaries/${glossaryId}`
    : undefined;

  cached = {translationClient, projectId, location, glossaryName};
  return cached;
}


