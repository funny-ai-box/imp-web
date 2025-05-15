import { useState } from 'react';
import { Layout, Menu, Button, Typography } from 'antd';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import routerConfig from '../../router';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const MainLayout = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { menuConfig } = routerConfig;

  const handleLogout = () => {
    logout();
  };

  // 根据当前路径确定应该选中哪个菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    
    // Iterate through all menu items to find the matching path
    for (const item of menuConfig) {
      if (item.path && path === item.path) {
        return item.key;
      }
      
      // Check children if they exist
      if (item.children) {
        for (const child of item.children) {
          if (child.path && path.startsWith(child.path) && child.showInMenu !== false) {
            return child.key;
          }
        }
      }
      
      // Check for path prefixes (like /knowledge-bases/*)
      if (item.path && path.startsWith(item.path + '/')) {
        return item.key;
      }
    }
    
    return '1'; // Default to home
  };

  // Convert menu configuration to Ant Design menu items
  const getMenuItems = () => {
    return menuConfig.map(item => {
      // If this item has children that should be displayed in the menu
      if (item.children && item.children.some(child => child.showInMenu !== false)) {
        return {
          key: item.key,
          icon: item.icon,
          label: item.label,
          children: item.children
            .filter(child => child.showInMenu !== false)
            .map(child => ({
              key: child.key,
              icon: child.icon,
              label: <Link to={child.path}>{child.label}</Link>,
            }))
        };
      }
      
      // Regular menu item with a link
      return {
        key: item.key,
        icon: item.icon,
        label: <Link to={item.path}>{item.label}</Link>,
      };
    });
  };
  
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
          items={getMenuItems()} 
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