/**
 * POST /api/uploads — raw image body (Content-Type image/jpeg | image/png | image/webp), max 6 MB.
 * The file's magic bytes must match its type. Saved as <uuid>.<ext> and served from /uploads.
 * Open to anyone (a restaurant picks its cover before its account exists) but rate-limited.
 */
import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import express, { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { HttpError } from '../../middleware/error.ts'

export const UPLOAD_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../../uploads')
mkdirSync(UPLOAD_DIR, { recursive: true })

const TYPES: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  'image/jpeg': { ext: 'jpg', magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: 'png', magic: (b) => b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) },
  'image/webp': { ext: 'webp', magic: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
}

export const uploadsRouter = Router()
uploadsRouter.post(
  '/uploads',
  rateLimit({ windowMs: 10 * 60_000, limit: 40, standardHeaders: 'draft-8', legacyHeaders: false }),
  express.raw({ type: Object.keys(TYPES), limit: '6mb' }),
  (req, res) => {
    const t = TYPES[String(req.headers['content-type']).split(';')[0]]
    const body = req.body as Buffer
    if (!t) throw new HttpError(415, 'UNSUPPORTED_TYPE', 'Upload a JPG, PNG or WebP image.')
    if (!Buffer.isBuffer(body) || body.length < 16) throw new HttpError(400, 'EMPTY', 'That file is empty.')
    if (!t.magic(body)) throw new HttpError(400, 'NOT_AN_IMAGE', 'That file isn’t a real image.')
    const name = `${randomUUID()}.${t.ext}`
    writeFileSync(resolve(UPLOAD_DIR, name), body)
    res.status(201).json({ url: `/uploads/${name}` })
  },
)
