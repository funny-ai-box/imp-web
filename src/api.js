import axios from 'axios';

const API_BASE_URL = ''; // Configure your actual API base URL, e.g., http://localhost:8000

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getPublicKey = () => apiClient.get('/v1/auth/public_key');
export const registerUser = (data) => apiClient.post('/v1/auth/register', data);
export const loginUser = (data) => apiClient.post('/v1/auth/login', data);

export const getLlmProviderList = () => apiClient.get('/v1/foundation/llm_provider/provider_list');
export const getLlmProviderDetail = (providerId) => apiClient.get(`/v1/foundation/llm_provider/provider_detail?provider_id=${providerId}`);
export const getLlmModelList = (providerId) => apiClient.get(`/v1/foundation/llm_provider/model_list?provider_id=${providerId}`);

export const listKnowledgeBases = (params) => apiClient.get('/v1/knowledge_base/list', { params });
export const createKnowledgeBase = (data) => apiClient.post('/v1/knowledge_base/create', data);
export const getKnowledgeBaseDetail = (kbId) => apiClient.get(`/v1/knowledge_base/detail?kb_id=${kbId}`);
export const searchKnowledgeBaseChunks = (data) => apiClient.post('/v1/knowledge_base/update', data); // NB: API doc calls this "update" but it's a search

export const deleteEmbeddings = (data) => apiClient.post('/v1/knowledge_base/embedding/delete', data);
export const createDocumentEmbeddings = (data) => apiClient.post('/v1/knowledge_base/embedding/document_embeddings', data);

export const queryKnowledgeBase = (data) => apiClient.post('/v1/knowledge_base/query/ask', data);
export const getQueryHistory = (kbId, params) => apiClient.get(`/v1/knowledge_base/query/history?kb_id=${kbId}`, { params });
export const getQueryStats = (kbId) => apiClient.get(`/v1/knowledge_base/query/stats?kb_id=${kbId}`);
export const getRecentQueries = (kbId, params) => apiClient.get(`/v1/knowledge_base/query/recent?kb_id=${kbId}`, { params });
export const getPopularQueries = (kbId, params) => apiClient.get(`/v1/knowledge_base/query/popular?kb_id=${kbId}`, { params });
export const queryPublicKnowledgeBase = (data) => apiClient.post('/v1/knowledge_base/query/public/ask', data);

export default apiClient;
