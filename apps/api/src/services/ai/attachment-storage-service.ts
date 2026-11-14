import { createHash } from 'crypto';
import { gzipSync } from 'zlib';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { logger } from '../../lib/logger';
import type { ChatAttachment } from './chat-service';

const storageLogger = logger.child({ module: 'ai-attachment-storage' });

const endpoints = (process.env.AI_ATTACHMENT_S3_ENDPOINT || process.env.S3_ENDPOINT || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const accessKeyId = process.env.AI_ATTACHMENT_S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.AI_ATTACHMENT_S3_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;
const bucket = process.env.AI_ATTACHMENT_S3_BUCKET || process.env.S3_BUCKET || 'woolet';
const region = process.env.AI_ATTACHMENT_S3_REGION || process.env.S3_REGION || 'us-east-1';
const retentionDays = Number(process.env.AI_ATTACHMENT_RETENTION_DAYS || 365);

const s3Clients = accessKeyId && secretAccessKey
  ? endpoints.map((endpoint) => new S3Client({
      endpoint,
      region,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    }))
  : [];

function parseDataUrl(dataUrl: string): { mimeType: string; body: Buffer } | null {
  const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUrl);
  if (!match) return null;

  const [, mimeType, base64Marker, data] = match;
  const body = base64Marker ? Buffer.from(data, 'base64') : Buffer.from(decodeURIComponent(data), 'utf8');
  return { mimeType, body };
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120) || 'attachment';
}

function getRetentionDate() {
  return new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);
}

export async function persistChatAttachments(input: {
  userId: string;
  sessionId: string;
  attachments: ChatAttachment[];
}) {
  if (s3Clients.length === 0 || input.attachments.length === 0) {
    return [];
  }

  const retentionUntil = getRetentionDate();
  const persisted = [];

  for (const attachment of input.attachments) {
    const parsed = parseDataUrl(attachment.dataUrl);
    if (!parsed) continue;

    const hash = createHash('sha256').update(parsed.body).digest('hex').slice(0, 24);
    const safeName = sanitizeFileName(attachment.name);
    const compressedBody = gzipSync(parsed.body, { level: 9 });
    const compress = compressedBody.length < parsed.body.length;
    const body = compress ? compressedBody : parsed.body;
    const key = `ai-chat/${input.userId}/${input.sessionId}/${Date.now()}-${hash}-${safeName}${compress ? '.gz' : ''}`;

    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: parsed.mimeType,
        ContentEncoding: compress ? 'gzip' : undefined,
        Expires: retentionUntil,
        Metadata: {
          originalName: safeName,
          originalMimeType: parsed.mimeType,
          originalSize: String(parsed.body.length),
          retentionUntil: retentionUntil.toISOString(),
          compression: compress ? 'gzip-9' : 'none-already-compressed',
        },
      });

      let uploaded = false;
      let lastError: unknown;

      for (const client of s3Clients) {
        try {
          await client.send(command);
          uploaded = true;
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!uploaded) {
        throw lastError || new Error('No S3 endpoint accepted upload');
      }

      persisted.push({
        name: attachment.name,
        mimeType: parsed.mimeType,
        key,
        size: parsed.body.length,
        storedSize: body.length,
        retentionUntil: retentionUntil.toISOString(),
      });
    } catch (error) {
      storageLogger.error({
        event: 'attachment.persist_failed',
        key,
        userId: input.userId,
        sessionId: input.sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return persisted;
}
