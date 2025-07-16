/**
 * Video compression utilities for optimizing videos for mobile viewing
 * Uses Web APIs to compress videos client-side before upload
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  maxBitrate?: number
  maxDuration?: number
  quality?: number // 0.1 to 1.0
  format?: 'mp4' | 'webm'
}

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
  duration: number
  width: number
  height: number
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1280,
  maxHeight: 720,
  maxBitrate: 2000000, // 2Mbps
  maxDuration: 60, // 60 seconds
  quality: 0.8,
  format: 'mp4'
}

/**
 * Compress a video file using Web APIs
 */
export async function compressVideo(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    video.onloadedmetadata = () => {
      // Calculate new dimensions maintaining aspect ratio
      const { width, height } = calculateDimensions(
        video.videoWidth,
        video.videoHeight,
        opts.maxWidth!,
        opts.maxHeight!
      )

      canvas.width = width
      canvas.height = height

      // Set up MediaRecorder for compression
      const stream = canvas.captureStream()
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: getMimeType(opts.format!),
        videoBitsPerSecond: opts.maxBitrate
      })

      const chunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const compressedBlob = new Blob(chunks, { type: getMimeType(opts.format!) })
        const compressedFile = new File([compressedBlob], file.name, {
          type: getMimeType(opts.format!)
        })

        const result: CompressionResult = {
          file: compressedFile,
          originalSize: file.size,
          compressedSize: compressedFile.size,
          compressionRatio: (1 - compressedFile.size / file.size) * 100,
          duration: video.duration,
          width,
          height
        }

        resolve(result)
      }

      // Start recording
      mediaRecorder.start()

      // Play video and draw frames to canvas
      video.currentTime = 0
      video.play()

      const drawFrame = () => {
        if (video.ended || video.paused) {
          mediaRecorder.stop()
          return
        }

        ctx.drawImage(video, 0, 0, width, height)
        requestAnimationFrame(drawFrame)
      }

      drawFrame()

      // Stop after max duration
      if (opts.maxDuration && video.duration > opts.maxDuration) {
        setTimeout(() => {
          video.pause()
          mediaRecorder.stop()
        }, opts.maxDuration * 1000)
      }
    }

    video.onerror = () => {
      reject(new Error('Failed to load video'))
    }

    video.src = URL.createObjectURL(file)
  })
}

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight

  let width = originalWidth
  let height = originalHeight

  if (width > maxWidth) {
    width = maxWidth
    height = width / aspectRatio
  }

  if (height > maxHeight) {
    height = maxHeight
    width = height * aspectRatio
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  }
}

/**
 * Get MIME type for video format
 */
function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    mp4: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
    webm: 'video/webm; codecs="vp8, vorbis"'
  }
  return mimeTypes[format] || mimeTypes.mp4
}

/**
 * Check if video compression is supported
 */
export function isVideoCompressionSupported(): boolean {
  return (
    typeof MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof HTMLVideoElement !== 'undefined'
  )
}

/**
 * Get video metadata without compression
 */
export function getVideoMetadata(file: File): Promise<{
  duration: number
  width: number
  height: number
  size: number
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    
    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: file.size
      })
    }

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'))
    }

    video.src = URL.createObjectURL(file)
  })
}

/**
 * Generate thumbnail from video
 */
export function generateThumbnail(
  file: File,
  time: number = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      video.ontimeupdate = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8)
        resolve(thumbnail)
      }

      video.currentTime = time
    }

    video.onerror = () => {
      reject(new Error('Failed to generate thumbnail'))
    }

    video.src = URL.createObjectURL(file)
  })
}

/**
 * Validate video file
 */
export function validateVideoFile(file: File): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const maxSize = 270 * 1024 * 1024 // 270MB
  const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']

  if (!allowedTypes.includes(file.type)) {
    errors.push('Invalid video format. Please use MP4, WebM, MOV, or AVI.')
  }

  if (file.size > maxSize) {
    errors.push('Video file is too large. Maximum size is 270MB.')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`
} 