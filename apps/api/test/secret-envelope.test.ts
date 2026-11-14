import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { randomBytes } from 'node:crypto';

import {
  decryptApiKey,
  decryptModelApiKey,
  encryptApiKey,
  encryptModelApiKey,
  getSecretEncryptionStatus,
} from '../src/lib/secret-envelope';

const previousEnvironment = {
  key: process.env.AI_SECRETS_MASTER_KEY,
  keys: process.env.AI_SECRETS_MASTER_KEYS,
  activeKeyId: process.env.AI_SECRETS_ACTIVE_MASTER_KEY_ID,
};

describe('secret envelope', () => {
  beforeEach(() => {
    process.env.AI_SECRETS_MASTER_KEY = randomBytes(32).toString('base64');
    delete process.env.AI_SECRETS_MASTER_KEYS;
    process.env.AI_SECRETS_ACTIVE_MASTER_KEY_ID = 'test-v1';
  });

  afterEach(() => {
    if (previousEnvironment.key === undefined) delete process.env.AI_SECRETS_MASTER_KEY;
    else process.env.AI_SECRETS_MASTER_KEY = previousEnvironment.key;
    if (previousEnvironment.keys === undefined) delete process.env.AI_SECRETS_MASTER_KEYS;
    else process.env.AI_SECRETS_MASTER_KEYS = previousEnvironment.keys;
    if (previousEnvironment.activeKeyId === undefined) delete process.env.AI_SECRETS_ACTIVE_MASTER_KEY_ID;
    else process.env.AI_SECRETS_ACTIVE_MASTER_KEY_ID = previousEnvironment.activeKeyId;
  });

  it('encrypts every API key with a unique data key and decrypts it', () => {
    const providerId = 'custom_provider-a';
    const first = encryptApiKey(providerId, 'sk-test-secret-value');
    const second = encryptApiKey(providerId, 'sk-test-secret-value');

    expect(first.encryptedApiKey).not.toBe(second.encryptedApiKey);
    expect(first.wrappedDataKey).not.toBe(second.wrappedDataKey);
    expect(decryptApiKey(providerId, first)).toBe('sk-test-secret-value');
    expect(decryptApiKey(providerId, second)).toBe('sk-test-secret-value');
  });

  it('binds ciphertext to its provider id with authenticated data', () => {
    const envelope = encryptApiKey('custom_provider-a', 'sk-test-secret-value');
    expect(() => decryptApiKey('custom_provider-b', envelope)).toThrow();
  });

  it('encrypts model credentials independently and binds them to the model id', () => {
    const modelId = 'alemai:qwen3-6';
    const envelope = encryptModelApiKey(modelId, 'sk-model-specific-secret');

    expect(decryptModelApiKey(modelId, envelope)).toBe('sk-model-specific-secret');
    expect(() => decryptModelApiKey('alemai:gemma4', envelope)).toThrow();
    expect(() => decryptApiKey(modelId, envelope)).toThrow();
  });

  it('reports a missing master key without throwing', () => {
    delete process.env.AI_SECRETS_MASTER_KEY;
    expect(getSecretEncryptionStatus().configured).toBe(false);
  });
});
