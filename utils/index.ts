import { format, formatDistanceToNow } from 'date-fns'
import type { User } from '@/types'

// Date Formatting
export const formatDate = (date: Date | string): string => {
  return format(new Date(date), 'MMM d, yyyy')
}

export const formatTime = (date: Date | string): string => {
  return format(new Date(date), 'h:mm a')
}

export const formatDateTime = (date: Date | string): string => {
  return format(new Date(date), 'MMM d, yyyy h:mm a')
}

export const getTimeAgo = (date: Date | string): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

// File Handling
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export const isValidFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type)
}

export const isValidFileSize = (file: File, maxSize: number): boolean => {
  return file.size <= maxSize
}

// User Helpers
export const getUserDisplayName = (user: User): string => {
  return user.name || user.email?.split('@')[0] || 'User'
}

export const getUserInitials = (user: User): string => {
  if (!user.name) return 'U'
  return user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

// Price Formatting
export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// String Helpers
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}

// Validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-]{10,}$/
  return phoneRegex.test(phone)
}

// Array Helpers
export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export const uniqueArray = <T>(array: T[]): T[] => {
  return Array.from(new Set(array))
}

// Object Helpers
export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key]
    }
    return result
  }, {} as Pick<T, K>)
}

export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj }
  keys.forEach(key => delete result[key])
  return result
} 