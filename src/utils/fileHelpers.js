import { API_BASE_URL } from './envConfig';

/**
 * Resolve a file URL to absolute URL and decode properly
 * @param {string} fileUrl - Relative or absolute file URL from API (may be double-encoded)
 * @param {boolean} useProxy - Use /proxy/uploads for dev server compatibility
 * @returns {string} - Fully qualified, properly decoded URL for file access
 */
export const resolveFileUrl = (fileUrl, useProxy = false) => {
  if (!fileUrl) return '';
  
  // Handle double-encoded URLs from backend
  let decodedUrl = fileUrl;
  try {
    // Decode once
    decodedUrl = decodeURIComponent(fileUrl);
    // If it still looks encoded (has %20, %2520 patterns), decode again
    if (decodedUrl.includes('%')) {
      decodedUrl = decodeURIComponent(decodedUrl);
    }
  } catch (e) {
    // If decoding fails, use original
    decodedUrl = fileUrl;
  }
  
  // Already absolute URL
  if (decodedUrl.startsWith('http://') || decodedUrl.startsWith('https://')) {
    return decodedUrl;
  }
  
  // During development with Vite, use relative URLs which will be proxied
  if (import.meta.env.DEV && decodedUrl.startsWith('/uploads')) {
    return decodedUrl;
  }
  
  // In production or when accessing backend directly, use full URL
  const baseUrl = API_BASE_URL || 'http://localhost:4000';
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanPath = decodedUrl.startsWith('/') ? decodedUrl : `/${decodedUrl}`;
  
  return `${cleanBase}${cleanPath}`;
};

/**
 * Format file size to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
