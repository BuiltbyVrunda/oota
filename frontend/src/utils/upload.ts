import { ApiError } from '../api/client'

const MAX_SIDE = 1600

/** Downscale in the browser (≤1600px, WebP ~85%) so uploads are small, then POST the raw bytes. Returns '/uploads/…'. */
export async function uploadImage(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp|heic|heif|gif|avif)$/.test(file.type) && !file.type.startsWith('image/')) throw new ApiError(415, 'UNSUPPORTED_TYPE', 'Choose an image file (JPG, PNG or WebP).')
  let blob: Blob = file
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('encode failed'))), 'image/webp', 0.85))
    if (blob.type !== 'image/webp') blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('encode failed'))), 'image/jpeg', 0.85))
  } catch {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new ApiError(415, 'UNSUPPORTED_TYPE', 'This image format isn’t supported here. Try a JPG or PNG.')
  }
  if (blob.size > 6 * 1024 * 1024) throw new ApiError(413, 'TOO_LARGE', 'That image is too big (max 6 MB).')
  const res = await fetch('/api/uploads', { method: 'POST', body: blob, headers: { 'Content-Type': blob.type }, credentials: 'include' })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data?.error?.code ?? 'UPLOAD_FAILED', data?.error?.message ?? 'Upload failed. Try again.')
  return data.url as string
}
