// In Vite, custom env variables must be prefixed with VITE_
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;

// If VITE_API_BASE_URL is set (e.g. in production), use it with trailing slash trimmed;
// otherwise fallback to empty string (which uses the current origin or Vite dev proxy).
export const API_BASE_URL = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, '') : '';

export const API_ENDPOINTS = {
  sampleInbox: `${API_BASE_URL}/api/sample-inbox`,
  sampleKaggleCsv: `${API_BASE_URL}/api/sample-kaggle-csv`,
  uploadCsv: `${API_BASE_URL}/api/upload-csv`,
  auditDataset: `${API_BASE_URL}/api/audit-dataset`,
  health: `${API_BASE_URL}/api/health`,
};

