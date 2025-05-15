import { Typography, Card, Row, Col } from 'antd';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOutlined, ApiOutlined, SettingOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const { Text } = Typography;

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      <Title level={2}>欢迎使用 IMP-SERVER 客户端</Title>
      <Paragraph>
        这是 IMP-SERVER API 的演示前端界面。
        请使用侧边栏导航来浏览可用的功能。
      </Paragraph>

      {isAuthenticated ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Link to="/knowledge-bases">
              <Card hoverable>
                <BookOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
                <Title level={4}>管理知识库</Title>
                <Paragraph>创建、查看和查询您的知识库。</Paragraph>
              </Card>
            </Link>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Link to="/foundation-models">
              <Card hoverable>
                <ApiOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
                <Title level={4}>浏览基础模型</Title>
                <Paragraph>查看可用的 LLM 提供商及其模型。</Paragraph>
              </Card>
            </Link>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Link to="/basic-config/llm-config">
              <Card hoverable>
                <SettingOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
                <Title level={4}>配置大模型</Title>
                <Paragraph>管理您的大模型 API 密钥和配置信息。</Paragraph>
              </Card>
            </Link>
          </Col>
        </Row>
      ) : (
        <Paragraph>
          请<Link to="/login">登录</Link>或<Link to="/register">注册</Link>以访问所有功能。
        </Paragraph>
      )}
       <Card title="关于公共知识库查询" style={{marginTop: 20}}>
        <Paragraph>
            API 文档包含一个用于查询公共知识库的端点：
            <Text code>POST /v1/knowledge_base/query/public/ask</Text>。
        </Paragraph>
        <Paragraph>
            此功能允许未经身份验证的用户查询被标记为公共的知识库。
            要使用此功能，您通常需要一个已知的公共 <Text code>kb_id</Text>。
            此演示版本没有专门用于浏览公共知识库的页面，但查询组件可以适配。
            例如，您可以创建一个接受 <Text code>kb_id</Text> 作为 URL 参数的页面，并使用公共查询 API。
        </Paragraph>
        <Paragraph>
            示例：<Link to="/public-query/some-public-kb-id">查询公共知识库（替换 ID）</Link>（此路由尚未明确设置，仅展示概念）。
        </Paragraph>
      </Card>
    </div>
  );
};

export default HomePage;