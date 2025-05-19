import apiClient from './index';

// 获取小红书文案生成历史记录
export const getXhsGenerationLogs = (params) => {
  return apiClient.get('/v1/applications/xhs_copy/generations', { params });
};

// 这里可以添加更多与应用中心相关的API调用
export const getApplicationList = () => {
  return apiClient.get('/v1/applications/list');
};

export const getApplicationDetail = (appId) => {
  return apiClient.get(`/v1/applications/${appId}/detail`);
};

// 用户评价文案生成结果
export const rateXhsGeneration = (id, data) => {
  return apiClient.post(`/v1/applications/xhs_copy/generations/${id}/rate`, data);
};

// 删除文案生成记录
export const deleteXhsGeneration = (id) => {
  return apiClient.delete(`/v1/applications/xhs_copy/generations/${id}`);
};