// API Configuration
// Use environment variable for API URL in production, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export default {
  API_BASE_URL,
  // Helper function to create full API URL
  getApiUrl: (endpoint) => {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint
    // Ensure API base URL doesn't have trailing slash
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
    return `${baseUrl}/${cleanEndpoint}`
  }
}

