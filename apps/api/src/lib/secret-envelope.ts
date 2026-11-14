import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const AES_KEY_BYTES = 32;
const GCM_NONCE_BYTES = 12;
const GCM_TAG_BYTES = 16;
const CREDENTIAL_VERSION = 1;

export class SecretConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecretConfigurationError';
  }
}

export interface EncryptedSecretEnvelope {
  encryptedApiKey: string;
  apiKeyNonce: string;
  wrappedDataKey: string;
  wrappedDataKeyNonce: string;
  masterKeyId: string;
  credentialVersion: number;
}

function decodeMasterKey(encoded: string, keyId: string): Buffer {
  const key = Buffer.from(encoded.trim(), 'base64');
  if (key.length !== AES_KEY_BYTES) {
    throw new SecretConfigurationError(
      `AI secrets master key "${keyId}" must be exactly 32 bytes encoded as base64`
    );
  }
  return key;
}

function getMasterKeyring(): { activeKeyId: string; keys: Map<string, Buffer> } {
  const serializedKeyring = process.env.AI_SECRETS_MASTER_KEYS?.trim();
  if (serializedKeyring) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(serializedKeyring);
    } catch {
      throw new SecretConfigurationError('AI_SECRETS_MASTER_KEYS must be a JSON object of base64 keys');
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new SecretConfigurationError('AI_SECRETS_MASTER_KEYS must be a JSON object of base64 keys');
    }

    const keys = new Map<string, Buffer>();
    for (const [keyId, value] of Object.entries(parsed)) {
      if (!keyId.trim() || typeof value !== 'string') {
        throw new SecretConfigurationError('AI_SECRETS_MASTER_KEYS contains an invalid key entry');
      }
      keys.set(keyId, decodeMasterKey(value, keyId));
    }

    const activeKeyId = process.env.AI_SECRETS_ACTIVE_MASTER_KEY_ID?.trim();
    if (!activeKeyId) {
      throw new SecretConfigurationError(
        'AI_SECRETS_ACTIVE_MASTER_KEY_ID is required when AI_SECRETS_MASTER_KEYS is configured'
      );
    }
    if (!keys.has(activeKeyId)) {
      throw new SecretConfigurationError(
        `active AI secrets master key "${activeKeyId}" is missing from AI_SECRETS_MASTER_KEYS`
      );
    }
    return { activeKeyId, keys };
  }

  const singleKey = process.env.AI_SECRETS_MASTER_KEY?.trim();
  if (!singleKey) {
    throw new SecretConfigurationError(
      'AI secrets encryption is not configured; set AI_SECRETS_MASTER_KEY or AI_SECRETS_MASTER_KEYS'
    );
  }

  const activeKeyId = process.env.AI_SECRETS_ACTIVE_MASTER_KEY_ID?.trim() || 'v1';
  return {
    activeKeyId,
    keys: new Map([[activeKeyId, decodeMasterKey(singleKey, activeKeyId)]]),
  };
}

function encrypt(plaintext: Buffer, key: Buffer, aad: string) {
  const nonce = randomBytes(GCM_NONCE_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  cipher.setAAD(Buffer.from(aad, 'utf8'));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
  return {
    ciphertext: ciphertext.toString('base64'),
    nonce: nonce.toString('base64'),
  };
}

function decrypt(ciphertextWithTag: string, nonce: string, key: Buffer, aad: string) {
  const encrypted = Buffer.from(ciphertextWithTag, 'base64');
  if (encrypted.length <= GCM_TAG_BYTES) {
    throw new Error('encrypted secret is malformed');
  }

  const ciphertext = encrypted.subarray(0, -GCM_TAG_BYTES);
  const authTag = encrypted.subarray(-GCM_TAG_BYTES);
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(nonce, 'base64'));
  decipher.setAAD(Buffer.from(aad, 'utf8'));
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function secretAad(providerId: string, credentialVersion: number) {
  return `woolet:ai-provider:${providerId}:api-key:v${credentialVersion}`;
}

function dataKeyAad(providerId: string, credentialVersion: number) {
  return `woolet:ai-provider:${providerId}:data-key:v${credentialVersion}`;
}

function modelSecretAad(modelId: string, credentialVersion: number) {
  return `woolet:ai-model:${modelId}:api-key:v${credentialVersion}`;
}

function modelDataKeyAad(modelId: string, credentialVersion: number) {
  return `woolet:ai-model:${modelId}:data-key:v${credentialVersion}`;
}

function encryptCredential(
  apiKey: string,
  secretAuthenticatedData: string,
  dataKeyAuthenticatedData: string
): EncryptedSecretEnvelope {
  const { activeKeyId, keys } = getMasterKeyring();
  const masterKey = keys.get(activeKeyId)!;
  const dataKey = randomBytes(AES_KEY_BYTES);
  const encryptedSecret = encrypt(Buffer.from(apiKey, 'utf8'), dataKey, secretAuthenticatedData);
  const encryptedDataKey = encrypt(dataKey, masterKey, dataKeyAuthenticatedData);

  dataKey.fill(0);

  return {
    encryptedApiKey: encryptedSecret.ciphertext,
    apiKeyNonce: encryptedSecret.nonce,
    wrappedDataKey: encryptedDataKey.ciphertext,
    wrappedDataKeyNonce: encryptedDataKey.nonce,
    masterKeyId: activeKeyId,
    credentialVersion: CREDENTIAL_VERSION,
  };
}

export function encryptApiKey(providerId: string, apiKey: string): EncryptedSecretEnvelope {
  return encryptCredential(
    apiKey,
    secretAad(providerId, CREDENTIAL_VERSION),
    dataKeyAad(providerId, CREDENTIAL_VERSION)
  );
}

export function encryptModelApiKey(modelId: string, apiKey: string): EncryptedSecretEnvelope {
  return encryptCredential(
    apiKey,
    modelSecretAad(modelId, CREDENTIAL_VERSION),
    modelDataKeyAad(modelId, CREDENTIAL_VERSION)
  );
}

export function decryptApiKey(
  providerId: string,
  envelope: EncryptedSecretEnvelope
): string {
  const { keys } = getMasterKeyring();
  const masterKey = keys.get(envelope.masterKeyId);
  if (!masterKey) {
    throw new SecretConfigurationError(
      `AI secrets master key "${envelope.masterKeyId}" is required to decrypt provider "${providerId}"`
    );
  }

  const dataKey = decrypt(
    envelope.wrappedDataKey,
    envelope.wrappedDataKeyNonce,
    masterKey,
    dataKeyAad(providerId, envelope.credentialVersion)
  );

  try {
    return decrypt(
      envelope.encryptedApiKey,
      envelope.apiKeyNonce,
      dataKey,
      secretAad(providerId, envelope.credentialVersion)
    ).toString('utf8');
  } finally {
    dataKey.fill(0);
  }
}

export function decryptModelApiKey(modelId: string, envelope: EncryptedSecretEnvelope): string {
  const { keys } = getMasterKeyring();
  const masterKey = keys.get(envelope.masterKeyId);
  if (!masterKey) {
    throw new SecretConfigurationError(
      `AI secrets master key "${envelope.masterKeyId}" is required to decrypt model "${modelId}"`
    );
  }

  const dataKey = decrypt(
    envelope.wrappedDataKey,
    envelope.wrappedDataKeyNonce,
    masterKey,
    modelDataKeyAad(modelId, envelope.credentialVersion)
  );

  try {
    return decrypt(
      envelope.encryptedApiKey,
      envelope.apiKeyNonce,
      dataKey,
      modelSecretAad(modelId, envelope.credentialVersion)
    ).toString('utf8');
  } finally {
    dataKey.fill(0);
  }
}

export function getSecretEncryptionStatus() {
  try {
    const { activeKeyId } = getMasterKeyring();
    return { configured: true as const, activeKeyId };
  } catch (error) {
    return {
      configured: false as const,
      activeKeyId: null,
      message: error instanceof Error ? error.message : 'AI secrets encryption is not configured',
    };
  }
}
