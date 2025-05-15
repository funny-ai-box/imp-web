
import { Typography, Card, Row, Col } from 'antd';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOutlined, ApiOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const { Text } = Typography;

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      <Title level={2}>Welcome to IMP-SERVER Client</Title>
      <Paragraph>
        This is a demonstration frontend for the IMP-SERVER API.
        Navigate using the sidebar to explore available features.
      </Paragraph>

      {isAuthenticated ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Link to="/knowledge-bases">
              <Card hoverable>
                <BookOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
                <Title level={4}>Manage Knowledge Bases</Title>
                <Paragraph>Create, view, and query your knowledge bases.</Paragraph>
              </Card>
            </Link>
          </Col>
          <Col xs={24} sm={12}>
            <Link to="/foundation-models">
              <Card hoverable>
                <ApiOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
                <Title level={4}>Explore Foundation Models</Title>
                <Paragraph>View available LLM providers and their models.</Paragraph>
              </Card>
            </Link>
          </Col>
        </Row>
      ) : (
        <Paragraph>
          Please <Link to="/login">log in</Link> or <Link to="/register">register</Link> to access all features.
        </Paragraph>
      )}
       <Card title="About Public Knowledge Base Queries" style={{marginTop: 20}}>
        <Paragraph>
            The API documentation includes an endpoint for querying public knowledge bases:
            <Text code>POST /v1/knowledge_base/query/public/ask</Text>.
        </Paragraph>
        <Paragraph>
            This feature allows unauthenticated users to query KBs that are marked as public.
            To use this, you would typically need a known public <Text code>kb_id</Text>.
            This demo does not have a dedicated page for browsing public KBs, but the querying component can be adapted.
            For example, you could create a page that takes a <Text code>kb_id</Text> as a URL parameter and uses the public query API.
        </Paragraph>
        <Paragraph>
            Example: <Link to="/public-query/some-public-kb-id">Query public KB (replace ID)</Link> (This route is not explicitly set up but shows the idea).
        </Paragraph>
      </Card>
    </div>
  );
};

export default HomePage;
