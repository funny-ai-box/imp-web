import { message } from 'antd';

// 全局消息工具，用于在非React组件中显示消息
const GlobalMessage = {
  success: (content) => {
    message.success(content);
  },
  error: (content) => {
    message.error(content);
  },
  warning: (content) => {
    message.warning(content);
  },
  info: (content) => {
    message.info(content);
  },
};

// 将消息工具挂载到window，使拦截器等非React环境可以使用
window.GlobalMessage = GlobalMessage;

export default GlobalMessage;