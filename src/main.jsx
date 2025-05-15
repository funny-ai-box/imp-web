import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'antd/dist/reset.css';
import './utils/GlobalMessage'; // 导入全局消息工具
import { getPublicKey } from './api'; // 导入获取公钥方法

// 应用启动时尝试预加载公钥
getPublicKey().catch(err => {
  console.warn('预加载公钥失败:', err);
  // 这里不显示错误，因为用户还未有交互
  // 在实际登录/注册时会再次尝试获取
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)