# Admin-managed AI provider secrets

Woolet uses envelope encryption for API keys added through the Admin Panel.

## What is stored

For every provider or model credential, the API server:

1. generates a unique random 256-bit data-encryption key (DEK);
2. encrypts the API key with AES-256-GCM and provider- or model-specific authenticated data;
3. encrypts that DEK with the active master key (KEK), also with AES-256-GCM;
4. stores only the two ciphertexts, their nonces, the KEK identifier, and the API key's final four characters.

The plaintext API key and plaintext DEK are never written to PostgreSQL or returned by tRPC. Hashing is not suitable here because Woolet must recover the API key to authenticate outgoing provider requests.

## Credential precedence

Woolet resolves credentials in this order:

1. an encrypted key assigned to the exact model in PostgreSQL;
2. an encrypted provider credential in PostgreSQL;
3. the provider's GitHub/environment secret.

This lets models inside the same provider use different credentials. Removing a model override makes it inherit the provider credential again. Removing a built-in provider override makes its models fall back to the GitHub/environment secret. A disabled provider database row remains an explicit provider state and does not silently fall back to environment credentials.

## Master key storage

The master key must never be stored in PostgreSQL, source control, a Docker image, or the Admin Panel. In production, store it in the deployment platform's secret manager (AWS Secrets Manager/KMS-backed secrets, GCP Secret Manager, Azure Key Vault, Doppler, 1Password Secrets Automation, or a Kubernetes Secret encrypted at rest) and inject it into the API container at runtime.

Generate a key:

```sh
openssl rand -base64 32
```

For a single key:

```dotenv
AI_SECRETS_MASTER_KEY=<base64 32-byte key>
AI_SECRETS_ACTIVE_MASTER_KEY_ID=v1
```

When deploying through GitHub Actions, create these values as GitHub environment secrets. The deploy workflow passes them to the server and the API container at runtime. After adding or changing a GitHub secret, run the **Deploy Woolet** workflow manually so the server `.env` and container are refreshed; changing a secret alone does not start a deployment.

For rotation, use a versioned keyring:

```dotenv
AI_SECRETS_MASTER_KEYS={"v1":"<old base64 key>","v2":"<new base64 key>"}
AI_SECRETS_ACTIVE_MASTER_KEY_ID=v2
```

New or replaced API keys are wrapped with `v2`; existing records remain decryptable with `v1`. Do not remove an old master key until every credential that references it has been replaced or rewrapped. Losing a referenced master key makes those provider credentials unrecoverable; keep an access-controlled backup in the secret manager.

## Operational rules

- Restrict master-key access to the API runtime and a small production-operations group.
- Never log API request headers, provider objects, plaintext keys, or the master-key variables.
- Use HTTPS provider endpoints in production. The API rejects plain HTTP there.
- Rotate a provider or model credential from the Admin Panel if it may have leaked.
- Back up PostgreSQL and the master-key versions separately. Both are required for recovery.
