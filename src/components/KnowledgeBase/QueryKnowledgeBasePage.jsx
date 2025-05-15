import React, { useState } from 'react';
import { Form, Input, Button, Card, Spin, Typography, Checkbox, InputNumber, Select, message, List, Tag, Collapse } from 'antd';
import { queryKnowledgeBase, queryPublicKnowledgeBase } from '../../api'; // Assuming you might have a public query too

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

const QueryKnowledgeBasePage = ({ kbId, kbName, isPublicQuery = false }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const onFinish = async (values) => {
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        kb_id: kbId,
        query: values.query,
        top_k: values.top_k,
        filter: values.filter ? JSON.parse(values.filter) : {},
        provider_type: values.provider_type,
        model: values.model,
        include_sources: values.include_sources,
      };
      const response = isPublicQuery 
        ? await queryPublicKnowledgeBase(payload) 
        : await queryKnowledgeBase(payload);
      
      setResult(response.data?.data);
      if (!response.data?.data) {
        message.info('No response or unexpected format from API.');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to query Knowledge Base.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={isPublicQuery ? `Query Public Knowledge Base: ${kbName || kbId}` : `Query Knowledge Base: ${kbName || kbId}`}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          top_k: 5,
          provider_type: 'OpenAI',
          model: 'gpt-4',
          include_sources: true,
          filter: '{}',
        }}
      >
        <Form.Item name="query" label="Your Question" rules={[{ required: true }]}>
          <Input.TextArea rows={3} placeholder="Ask something..." />
        </Form.Item>
        <Form.Item name="top_k" label="Number of Chunks to Retrieve (Top K)" rules={[{ required: true }]}>
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="filter" label="Metadata Filter (JSON String)">
          <Input placeholder='e.g., {"tag": "important"}' />
        </Form.Item>
        <Form.Item name="provider_type" label="LLM Provider Type" rules={[{ required: true }]}>
          <Input placeholder="e.g., OpenAI, Anthropic" />
        </Form.Item>
        <Form.Item name="model" label="LLM Model Name" rules={[{ required: true }]}>
          <Input placeholder="e.g., gpt-4, claude-2" />
        </Form.Item>
        <Form.Item name="include_sources" valuePropName="checked">
          <Checkbox>Include Sources in Response</Checkbox>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Ask
          </Button>
        </Form.Item>
      </Form>

      {loading && <Spin tip="Processing your query..." style={{ display: 'block', marginTop: 20 }} />}

      {result && (
        <div style={{ marginTop: 20 }}>
          <Title level={4}>Response</Title>
          <Paragraph style={{ whiteSpace: 'pre-wrap', background: '#f0f2f5', padding: '10px', borderRadius: '4px' }}>
            {result.response || 'No textual response provided.'}
          </Paragraph>
          
          <Paragraph>
            <Text strong>Query: </Text>{result.query}<br/>
            <Text strong>Tokens Used: </Text>{result.tokens_used || 'N/A'}<br/>
            <Text strong>Duration: </Text>{result.duration_ms ? `${result.duration_ms} ms` : 'N/A'}<br/>
            <Text strong>Total Chunks Retrieved: </Text>{result.total_chunks || 'N/A'}
          </Paragraph>

          {result.sources && result.sources.length > 0 && (
            <>
              <Title level={5} style={{marginTop: '20px'}}>Sources Used ({result.sources.length})</Title>
              <List
                size="small"
                bordered
                dataSource={result.sources}
                renderItem={(item) => (
                  <List.Item>
                    <Text>Document ID: {item.document_id}</Text> <Tag>Score: {item.score ? item.score.toFixed(4) : 'N/A'}</Tag>
                    {item.id && <Text>(Chunk ID: {item.id})</Text>}
                  </List.Item>
                )}
              />
            </>
          )}
          
          {result.retrieved_chunks && result.retrieved_chunks.length > 0 && (
             <Collapse style={{marginTop: '20px'}}>
                <Panel header={`Retrieved Chunks Details (${result.retrieved_chunks.length})`} key="1">
                    <List
                        itemLayout="vertical"
                        dataSource={result.retrieved_chunks}
                        renderItem={chunk => (
                            <List.Item key={chunk.id}>
                                <List.Item.Meta
                                    title={<Text strong>Chunk ID: {chunk.id} (Document ID: {chunk.document_id})</Text>}
                                    description={
                                        <>
                                            <Paragraph>Index: {chunk.chunk_index}, Tokens: {chunk.token_count}</Paragraph>
                                            <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}>
                                                <Text strong>Content Preview: </Text>{chunk.content_preview || chunk.content}
                                            </Paragraph>
                                        </>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </Panel>
            </Collapse>
          )}
        </div>
      )}
    </Card>
  );
};