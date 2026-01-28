/**
 * Configuration for API endpoints
 * Handles both development (proxy) and production (full URL) environments
 */

// Get API base URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

/**
 * Get the full API URL for a given endpoint
 * In development: uses proxy (returns relative path)
 * In production: returns full URL if VITE_API_BASE_URL is set
 * 
 * @param {string} endpoint - API endpoint path (e.g., '/api/process')
 * @returns {string} Full API URL or relative path
 */
const getApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  
  // If API_BASE_URL is set (production), use full URL
  if (API_BASE_URL) {
    // Remove trailing slash from base URL if present
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
    return `${baseUrl}${cleanEndpoint}`
  }
  
  // In development, use relative path (Vite proxy will handle it)
  return cleanEndpoint
}

const config = {
  getApiUrl,
  API_BASE_URL
}

export default config

