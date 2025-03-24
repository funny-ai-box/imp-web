import axios from 'axios';
import { Message } from '@arco-design/web-react';
import JSEncrypt from 'jsencrypt';

interface HttpResponse<T = any> {
  public_key: string | PromiseLike<string>;
  code: number;
  data: T;
  message: string;
}

// Create axios instance
const httpClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Add request interceptor for authentication
httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
httpClient.interceptors.response.use(
  (response) => {
    const res = response.data;
    
    // Handle API success but business logic errors
    if (res.code !== 200) {
      Message.error(res.message || 'Error');
      if (res.code === 401) {
        // Clear user session and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        localStorage.setItem('userStatus', 'logout');
        window.location.href = '/login';
      }
      return Promise.reject(new Error(res.message || 'Error'));
    }
    
    return res;
  },
  (error) => {
    Message.error(error.message || 'Request Failed');
    return Promise.reject(error);
  }
);

// Get RSA public key for password encryption
export async function getPublicKey(): Promise<string> {
  try {
    const response = await httpClient.get<HttpResponse<{ public_key: string }>>('/v1/auth/public_key');
    return response.data.public_key;
  } catch (error) {
    console.error('Failed to fetch public key:', error);
    throw error;
  }
}

// Encrypt password with RSA public key
export function encryptPassword(password: string, publicKey: string): string {
  const encrypt = new JSEncrypt();
  encrypt.setPublicKey(publicKey);
  return encrypt.encrypt(password) || '';
}

// Generic HTTP request method
export async function request<T>(config: {
  method: 'get' | 'post' | 'put' | 'delete';
  url: string;
  data?: any;
  params?: any;
}): Promise<T> {
  try {
    const response = await httpClient.request<any, HttpResponse<T>>({
      method: config.method,
      url: config.url,
      data: config.method !== 'get' ? config.data : undefined,
      params: config.method === 'get' ? config.params : undefined,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Login method
export interface LoginParams {
  phone: string;
  password: string;
}

export interface UserInfo {
  id: string;
  last_login_at: string;
  phone: string;
  role: number;
  status: number;
  username: string;
}

export interface LoginResponse {
  token: string;
  user: UserInfo;
}

export async function login(params: LoginParams): Promise<LoginResponse> {
  // Get public key first
  const publicKey = await getPublicKey();
  
  // Encrypt password
  const encryptedPassword = encryptPassword(params.password, publicKey);
  
  // Call login API
  const response = await request<LoginResponse>({
    method: 'post',
    url: '/v1/auth/login',
    data: {
      phone: params.phone,
      password: encryptedPassword,
    },
  });
  
  // Save token and user info to localStorage
  localStorage.setItem('token', response.token);
  localStorage.setItem('userInfo', JSON.stringify(response.user));
  localStorage.setItem('userStatus', 'login');
  
  return response;
}

// Register method
export interface RegisterParams {
  phone: string;
  password: string;
  username: string;
}

export async function register(params: RegisterParams): Promise<void> {
  // Get public key first
  const publicKey = await getPublicKey();
  
  // Encrypt password
  const encryptedPassword = encryptPassword(params.password, publicKey);
  
  // Call register API
  await request<void>({
    method: 'post',
    url: '/v1/auth/register',
    data: {
      phone: params.phone,
      password: encryptedPassword,
      username: params.username,
    },
  });
}

export default {
  getPublicKey,
  encryptPassword,
  request,
  login,
  register,
};