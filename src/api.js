import axios from 'axios';
import rsaEncrypt from './utils/RSAEncrypt';

// 基础URL包含/api
const API_BASE_URL = '/api';

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

// 添加响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    // HTTP状态码是2xx时会进入这里
    // 但我们还需要检查业务状态码
    const data = response.data;
    
    // 如果业务状态码不是200，可以在这里统一处理
    // 但为了灵活性，我们将错误处理留给各个组件
    return response;
  },
  (error) => {
    // HTTP状态码不是2xx时会进入这里
    if (error.response && error.response.status === 403) {
      // 清除localStorage中的token
      localStorage.removeItem('authToken');
      
      // 显示提示信息
      if (window.GlobalMessage) {
        window.GlobalMessage.error('登录已过期，请重新登录');
      } else {
        console.error('登录已过期，请重新登录');
      }
      
      // 重定向到登录页面
      window.location.href = '/login';
      
      // 防止后续Promise链继续执行
      return new Promise(() => {});
    }
    
    return Promise.reject(error);
  }
);

export const getPublicKey = async () => {
  try {
    // 检查是否已有公钥
    if (rsaEncrypt.hasPublicKey()) {
      return { success: true };
    }

    const response = await apiClient.get('/v1/auth/public_key');
    
    // 检查响应是否成功
    if (response.data && response.data.code === 200 && response.data.data && response.data.data.public_key) {
      const publicKey = response.data.data.public_key;
      rsaEncrypt.setPublicKey(publicKey);
      return { success: true };
    } else {
      console.error('获取公钥失败:', response.data);
      return { success: false, message: response.data?.message || '获取公钥失败' };
    }
  } catch (error) {
    console.error('获取公钥出错:', error);
    return { success: false, message: error.response?.data?.message || '获取公钥失败，请稍后重试' };
  }
};

// 使用公钥加密密码
export const encryptPassword = (password) => {
  if (!password) return password;
  
  try {
    if (!rsaEncrypt.hasPublicKey()) {
      throw new Error('公钥未设置，请先获取公钥');
    }
    
    return rsaEncrypt.encrypt(password);
  } catch (error) {
    console.error('密码加密失败:', error);
    throw error;
  }
};

export const registerUser = async (data) => {
  // 先确保有公钥
  const publicKeyResult = await getPublicKey();
  if (!publicKeyResult.success) {
    throw new Error(publicKeyResult.message);
  }
  
  // 加密密码
  const encryptedData = {
    ...data,
    password: encryptPassword(data.password)
  };
  
  return apiClient.post('/v1/auth/register', encryptedData);
};

export const loginUser = async (data) => {
  // 先确保有公钥
  const publicKeyResult = await getPublicKey();
  if (!publicKeyResult.success) {
    throw new Error(publicKeyResult.message);
  }
  
  // 加密密码
  const encryptedData = {
    ...data,
    password: encryptPassword(data.password)
  };
  
  return apiClient.post('/v1/auth/login', encryptedData);
};

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