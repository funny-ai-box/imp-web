import {
  HomeOutlined,
  BookOutlined,
  ApiOutlined,
  SettingOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';

// Define menu configuration
const menuConfig = [
  {
    key: '1',
    icon: <HomeOutlined />,
    label: '首页',
    path: '/',
  },
  {
    key: '2',
    icon: <BookOutlined />,
    label: '知识库',
    path: '/knowledge-bases',
  },

  {
    key: '4',
    icon: <SettingOutlined />,
    label: '基础配置',
    children: [
      {
        key: '4-1', 
        icon: <AppstoreOutlined />,
        label: '大模型配置',
        path: '/basic-config/llm-config',
      }
    ]
  }
];

export default menuConfig;