import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'

// Initialize Cloudinary with environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'mxqmbzkh'
const apiKey = process.env.CLOUDINARY_API_KEY || '572621157925692'
const apiSecret = process.env.CLOUDINARY_API_SECRET || '4KKzCSU0nlSNDSfycGUuc7wRPN0'

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
    secure: true,
  })
} else {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })
}

export function isCloudinaryConfigured(): boolean {
  const url = process.env.CLOUDINARY_URL
  if (url && !url.includes('mock')) return true
  return Boolean(cloudName && apiKey && apiSecret && !apiKey.includes('mock'))
}

/**
 * Uploads a base64 string, Buffer, or remote URL directly to Cloudinary.
 * Returns the permanent HTTPS CDN URL and public_id.
 */
export async function uploadImageToCloudinary(
  fileData: string,
  options?: { folder?: string; publicId?: string }
): Promise<{ url: string; publicId: string; width?: number; height?: number; format?: string }> {
  const folder = options?.folder || 'anmol-enterprises/products'

  // Ensure data URL is formatted properly if raw base64 without prefix is passed
  let uploadSource = fileData
  if (
    !fileData.startsWith('data:') &&
    !fileData.startsWith('http://') &&
    !fileData.startsWith('https://')
  ) {
    uploadSource = `data:image/jpeg;base64,${fileData}`
  }

  const result: UploadApiResponse = await cloudinary.uploader.upload(uploadSource, {
    folder,
    public_id: options?.publicId,
    resource_type: 'image',
    overwrite: true,
    unique_filename: true,
  })

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
  }
}

/**
 * Deletes an image from Cloudinary by its public ID.
 */
export async function deleteImageFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const res = await cloudinary.uploader.destroy(publicId)
    return res.result === 'ok'
  } catch (err) {
    console.warn(`[Cloudinary] Failed to delete image ${publicId}:`, err)
    return false
  }
}

export default cloudinary
