import { useState } from 'react';
import { Layout, Menu, Button, Typography } from 'antd';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  BookOutlined,
  LogoutOutlined,
  ApiOutlined,
  SettingOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;
const { SubMenu } = Menu;

const MainLayout = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
  };

  // 根据当前路径确定应该选中哪个菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/') return '1';
    if (path.startsWith('/knowledge-bases')) return '2';
    if (path.startsWith('/foundation-models')) return '3';
    if (path.startsWith('/basic-config/llm-config')) return '4-1';
    return '1'; // 默认选中首页
  };

  // 定义菜单项
  const menuItems = [
    {
      key: '1',
      icon: <HomeOutlined />,
      label: <Link to="/">首页</Link>,
    },
    {
      key: '2',
      icon: <BookOutlined />,
      label: <Link to="/knowledge-bases">知识库</Link>,
    },
    {
      key: '3',
      icon: <ApiOutlined />,
      label: <Link to="/foundation-models">基础模型</Link>,
    },
    {
      key: '4',
      icon: <SettingOutlined />,
      label: '基础配置',
      children: [
        {
          key: '4-1', 
          icon: <AppstoreOutlined />,
          label: <Link to="/basic-config/llm-config">大模型配置</Link>,
        }
      ]
    }
  ];
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', lineHeight: '32px', color: 'white' }}>
          IMP-SERVER
        </div>
        <Menu 
          theme="dark" 
          selectedKeys={[getSelectedKey()]} 
          mode="inline" 
          items={menuItems} 
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#001529' }}>
          <Title level={3} style={{color: 'white', margin: 0}}>IMP 客户端</Title>
          <div>
            {isAuthenticated && (
              <Button type="primary" danger icon={<LogoutOutlined />} onClick={handleLogout}>
                退出登录
              </Button>
            )}
          </div>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div style={{ padding: 24, minHeight: 360, background: '#fff' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;