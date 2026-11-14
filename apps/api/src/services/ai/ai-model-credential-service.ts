import { eq } from 'drizzle-orm';

import { db } from '../../db';
import {
  aiModelCredentials,
  type AiModelCredentialRecord,
} from '../../db/schema';
import { decryptModelApiKey, encryptModelApiKey } from '../../lib/secret-envelope';

const API_KEY_MIN_LENGTH = 8;

function validateApiKey(rawApiKey: string) {
  const apiKey = rawApiKey.trim();
  if (apiKey.length < API_KEY_MIN_LENGTH || apiKey.length > 4096) {
    throw new Error(`API key must be between ${API_KEY_MIN_LENGTH} and 4096 characters`);
  }
  return apiKey;
}

export class AiModelCredentialService {
  static async list() {
    return db.query.aiModelCredentials.findMany();
  }

  static async find(modelId: string) {
    return db.query.aiModelCredentials.findFirst({
      where: eq(aiModelCredentials.modelId, modelId),
    });
  }

  static async set(modelId: string, rawApiKey: string) {
    const apiKey = validateApiKey(rawApiKey);
    const encrypted = encryptModelApiKey(modelId, apiKey);
    const now = new Date();
    const [credential] = await db
      .insert(aiModelCredentials)
      .values({
        modelId,
        ...encrypted,
        apiKeyHint: apiKey.slice(-4),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: aiModelCredentials.modelId,
        set: {
          ...encrypted,
          apiKeyHint: apiKey.slice(-4),
          updatedAt: now,
        },
      })
      .returning();
    return credential;
  }

  static async remove(modelId: string) {
    await db.delete(aiModelCredentials).where(eq(aiModelCredentials.modelId, modelId));
  }

  static decrypt(credential: AiModelCredentialRecord) {
    return decryptModelApiKey(credential.modelId, {
      encryptedApiKey: credential.encryptedApiKey,
      apiKeyNonce: credential.apiKeyNonce,
      wrappedDataKey: credential.wrappedDataKey,
      wrappedDataKeyNonce: credential.wrappedDataKeyNonce,
      masterKeyId: credential.masterKeyId,
      credentialVersion: credential.credentialVersion,
    });
  }
}
