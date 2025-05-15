import React, { useState, useEffect, useCallback } from 'react';
import { 
  useParams,
  Routes, 
  Route, 
  NavLink, 
  Outlet,
  useOutletContext
} from 'react-router-dom';
import { 
  getKnowledgeBaseDetail, 
  searchKnowledgeBaseChunks, 
  createDocumentEmbeddings, 
  deleteEmbeddings 
} from '../../api'; // Fixed path
import { 
  Card, 
  Descriptions, 
  Spin, 
  message, 
  Tag, 
  Typography, 
  Divider, 
  Form,
  Input,
  InputNumber,
  Button,
  Table,
  Space,
  List,
  Checkbox,
  Select,
  Collapse
} from 'antd';
import moment from 'moment';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

// SearchChunks component - defined in the same file
const SearchChunksComponent = ({ kbId }) => {
  const [form] = Form.useForm();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        kb_id: kbId,
        query: values.query,
        top_k: values.top_k,
        filter: values.filter ? JSON.parse(values.filter) : {}
      };
      const response = await searchKnowledgeBaseChunks(payload);
      setResults(response.data?.data || []);
      if (!response.data?.data || response.data.data.length === 0) {
        message.info('No chunks found for this query.');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to search chunks.');
    } finally {
      setLoading(false);
    }
  };
  
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 150, ellipsis: true },
    { title: 'Document ID', dataIndex: 'document_id', key: 'document_id', width: 150, ellipsis: true },
    { title: 'Preview', dataIndex: 'content_preview', key: 'content_preview', ellipsis: true },
    { title: 'Score', dataIndex: 'score', key: 'score', width: 80, render: score => score !== undefined ? score.toFixed(4) : '-' },
    { title: 'Tokens', dataIndex: 'token_count', key: 'token_count', width: 80 },
  ];

  return (
    <Card title="Search Chunks in Knowledge Base">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="query" label="Query Text" rules={[{ required: true }]}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="top_k" label="Top K" initialValue={5}>
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item name="filter" label="Filter (JSON string)" initialValue="{}">
          <Input.TextArea rows={1} placeholder='e.g., {"source": "manual"}' />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>Search Chunks</Button>
        </Form.Item>
      </Form>
      {results.length > 0 && (
        <>
          <Divider />
          <Title level={5}>Search Results ({results.length})</Title>
          <Table dataSource={results} columns={columns} rowKey="id" size="small" scroll={{ x: 800 }}/>
        </>
      )}
    </Card>
  );
};

// ManageEmbeddings component - defined in the same file
const ManageEmbeddingsComponent = ({ kbId }) => {
  const [createForm] = Form.useForm();
  const [deleteForm] = Form.useForm();
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [createdEmbeddings, setCreatedEmbeddings] = useState([]);

  const handleCreateEmbeddings = async (values) => {
    setCreateLoading(true);
    try {
      const response = await createDocumentEmbeddings({ kb_id: kbId, document_id: values.document_id });
      setCreatedEmbeddings(response.data?.data || []);
      message.success(`Embeddings created/retrieved for document ${values.document_id}. Found ${response.data?.data?.length || 0} chunks.`);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to create embeddings.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteEmbeddings = async (values) => {
    setDeleteLoading(true);
    try {
      const payload = { kb_id: kbId };
      if (values.document_id_to_delete) payload.document_id = values.document_id_to_delete;
      if (values.chunk_ids_to_delete) payload.chunk_ids = values.chunk_ids_to_delete.split(',').map(s => s.trim()).filter(Boolean);
      
      if (!payload.document_id && (!payload.chunk_ids || payload.chunk_ids.length === 0)) {
        message.error('Please provide either a Document ID or Chunk IDs to delete.');
        setDeleteLoading(false);
        return;
      }
      await deleteEmbeddings(payload);
      message.success('Embeddings deletion request processed.');
      deleteForm.resetFields(['document_id_to_delete', 'chunk_ids_to_delete']);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to delete embeddings.');
    } finally {
      setDeleteLoading(false);
    }
  };
  
  const createdEmbeddingsColumns = [
    { title: 'Chunk ID', dataIndex: 'id', key: 'id', ellipsis: true },
    { title: 'Doc ID', dataIndex: 'document_id', key: 'document_id', ellipsis: true },
    { title: 'Preview', dataIndex: 'content_preview', key: 'content_preview', ellipsis: true },
    { title: 'Tokens', dataIndex: 'token_count', key: 'token_count' },
  ];

  return (
    <Space direction="vertical" style={{width: '100%'}}>
      <Card title="Create Document Embeddings">
        <Paragraph>Note: Document management (uploading, listing) is not covered by the provided API. Please enter a known Document ID.</Paragraph>
        <Form form={createForm} onFinish={handleCreateEmbeddings} layout="vertical">
          <Form.Item name="document_id" label="Document ID" rules={[{ required: true }]}>
            <Input placeholder="Enter Document ID whose chunks need embedding" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createLoading}>Create/Re-Embed Document</Button>
          </Form.Item>
        </Form>
        {createdEmbeddings.length > 0 && (
          <>
            <Divider/>
            <Title level={5}>Recently Processed Chunks ({createdEmbeddings.length})</Title>
            <Table dataSource={createdEmbeddings} columns={createdEmbeddingsColumns} rowKey="id" size="small" scroll={{x: 600}} />
          </>
        )}
      </Card>
      <Card title="Delete Embeddings" style={{ marginTop: 16 }}>
        <Paragraph>Delete embeddings for an entire document or specific chunks.</Paragraph>
        <Form form={deleteForm} onFinish={handleDeleteEmbeddings} layout="vertical">
          <Form.Item name="document_id_to_delete" label="Document ID (optional, deletes all its chunks)">
            <Input placeholder="Enter Document ID to delete all its embeddings" />
          </Form.Item>
          <Form.Item name="chunk_ids_to_delete" label="Chunk IDs (optional, comma-separated)">
            <Input.TextArea rows={2} placeholder="e.g., chunk_id_1, chunk_id_2" />
          </Form.Item>
          <Form.Item>
            <Button danger type="primary" htmlType="submit" loading={deleteLoading}>Delete Embeddings</Button>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
};

// QueryKnowledgeBase component - defined in the same file
const QueryKnowledgeBaseComponent = ({ kbId, kbName }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { queryKnowledgeBase } = require('../../api');

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
      const response = await queryKnowledgeBase(payload);
      
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
    <Card title={`Query Knowledge Base: ${kbName || kbId}`}>
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

// QueryHistory component - defined in the same file
const QueryHistoryComponent = ({ kbId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const { getQueryHistory } = require('../../api');

  const fetchHistory = useCallback(async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const params = { page, per_page: pageSize };
      const response = await getQueryHistory(kbId, params);
      if (response.data && response.data.data) {
        setHistory(response.data.data.items || []);
        setPagination({
          current: response.data.data.page,
          pageSize: response.data.data.per_page,
          total: response.data.data.total,
        });
      } else {
        setHistory([]);
        setPagination(prev => ({ ...prev, total:0, current: 1}));
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to fetch query history.');
    } finally {
      setLoading(false);
    }
  }, [kbId, pagination.current, pagination.pageSize, getQueryHistory]);

  useEffect(() => {
    if (kbId) {
      fetchHistory();
    }
  }, [kbId, fetchHistory]);

  const handleTableChange = (newPagination) => {
    fetchHistory(newPagination.current, newPagination.pageSize);
  };

  const columns = [
    { title: 'Query', dataIndex: 'query_text', key: 'query_text', ellipsis: true },
    { title: 'Response', dataIndex: 'response_text', key: 'response_text', ellipsis: true },
    { title: 'Tokens', dataIndex: 'token_count', key: 'token_count', align: 'center' },
    { title: 'Duration (ms)', dataIndex: 'duration_ms', key: 'duration_ms', align: 'center' },
    { title: 'Timestamp', dataIndex: 'created_at', key: 'created_at', render: text => moment(text).format('YYYY-MM-DD HH:mm:ss') },
  ];

  if (!kbId) return <Spin tip="Loading KB context..."/>;

  return (
    <div>
      <Title level={4}>Query History for KB: {kbId}</Title>
      <Table
        columns={columns}
        dataSource={history}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        rowKey="id"
        scroll={{ x: 800 }}
      />
    </div>
  );
};

// QueryStats component - defined in the same file
const QueryStatsComponent = ({ kbId }) => {
  const [stats, setStats] = useState(null);
  const [recentQueries, setRecentQueries] = useState([]);
  const [popularQueries, setPopularQueries] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const { getQueryStats, getRecentQueries, getPopularQueries } = require('../../api');

  const fetchAllStats = useCallback(async () => {
    setLoadingStats(true);
    setLoadingRecent(true);
    setLoadingPopular(true);
    try {
      const [statsRes, recentRes, popularRes] = await Promise.all([
        getQueryStats(kbId),
        getRecentQueries(kbId, { limit: 5 }),
        getPopularQueries(kbId, { limit: 5 })
      ]);
      setStats(statsRes.data?.data);
      setRecentQueries(recentRes.data?.data || []);
      setPopularQueries(popularRes.data?.data || []);
    } catch (error) {
      message.error('Failed to load query statistics.');
    } finally {
      setLoadingStats(false);
      setLoadingRecent(false);
      setLoadingPopular(false);
    }
  }, [kbId, getQueryStats, getRecentQueries, getPopularQueries]);

  useEffect(() => {
    if (kbId) {
      fetchAllStats();
    }
  }, [kbId, fetchAllStats]);

  if (!kbId) return <Spin tip="Loading KB context..."/>;
  
  return (
    <div>
      <Title level={4}>Query Statistics for KB: {kbId}</Title>
      {loadingStats ? <Spin /> : stats ? (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Card style={{ flex: '1 0 200px' }}>
            <Title level={5}>Total Queries</Title>
            <Text style={{fontSize: '20px'}}>{stats.total_queries}</Text>
          </Card>
          <Card style={{ flex: '1 0 200px' }}>
            <Title level={5}>Avg. Duration</Title>
            <Text style={{fontSize: '20px'}}>{stats.avg_duration ? `${stats.avg_duration.toFixed(2)} ms` : 'N/A'}</Text>
          </Card>
          <Card style={{ flex: '1 0 200px' }}>
            <Title level={5}>Total Tokens</Title>
            <Text style={{fontSize: '20px'}}>{stats.total_tokens}</Text>
          </Card>
        </div>
      ) : <Text>No overall stats available.</Text>}

      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
        <Card title="Recent Queries" style={{ flex: '1 0 300px' }}>
          {loadingRecent ? <Spin/> : recentQueries.length > 0 ? (
            <List
              size="small"
              dataSource={recentQueries}
              renderItem={item => (
                <List.Item>
                  <Text ellipsis>{item.query_text}</Text>
                </List.Item>
              )}
            />
          ) : <Text>No recent queries.</Text>}
        </Card>
        <Card title="Popular Queries" style={{ flex: '1 0 300px' }}>
          {loadingPopular ? <Spin/> : popularQueries.length > 0 ? (
            <List
              size="small"
              dataSource={popularQueries}
              renderItem={item => (
                <List.Item>
                  <Text ellipsis>{item.query}</Text> <Tag>{item.count} times</Tag>
                </List.Item>
              )}
            />
          ) : <Text>No popular queries.</Text>}
        </Card>
      </div>
    </div>
  );
};

// The main Knowledge Base detail content
const KnowledgeBaseDetailContent = () => {
  const { kbId } = useParams();
  const [kb, setKb] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getKnowledgeBaseDetail(kbId);
      setKb(response.data?.data);
    } catch (error) {
      message.error(error.response?.data?.message || `Failed to fetch details for KB ${kbId}.`);
    } finally {
      setLoading(false);
    }
  }, [kbId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) return <Spin tip="Loading Knowledge Base details..." />;
  if (!kb) return <Typography.Text>Knowledge Base not found.</Typography.Text>;

  const navStyle = ({ isActive }) => ({
    fontWeight: isActive ? 'bold' : 'normal',
    padding: '8px 16px',
    display: 'inline-block',
    borderBottom: isActive ? '2px solid #1890ff' : '2px solid transparent'
  });

  return (
    <div>
      <Title level={2}>{kb.name}</Title>
      <Paragraph>{kb.description}</Paragraph>
      <Descriptions bordered column={2}>
        <Descriptions.Item label="ID">{kb.id}</Descriptions.Item>
        <Descriptions.Item label="Vector Store Type">{kb.vector_store_type}</Descriptions.Item>
        <Descriptions.Item label="Embedding Provider">{kb.embedding_provider}</Descriptions.Item>
        <Descriptions.Item label="Embedding Model">{kb.embedding_model}</Descriptions.Item>
        <Descriptions.Item label="Dimension">{kb.embedding_dimension}</Descriptions.Item>
        <Descriptions.Item label="Chunk Size">{kb.chunk_size}</Descriptions.Item>
        <Descriptions.Item label="Chunk Overlap">{kb.chunk_overlap}</Descriptions.Item>
        <Descriptions.Item label="Documents">{kb.document_count}</Descriptions.Item>
        <Descriptions.Item label="Total Chunks">{kb.total_chunks}</Descriptions.Item>
        <Descriptions.Item label="Total Tokens">{kb.total_tokens}</Descriptions.Item>
        <Descriptions.Item label="Public">
          <Tag color={kb.is_public ? 'green' : 'volcano'}>{kb.is_public ? 'Yes' : 'No'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Active">
          <Tag color={kb.is_active ? 'blue' : 'red'}>{kb.is_active ? 'Yes' : 'No'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Created At">{moment(kb.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
        <Descriptions.Item label="Updated At">{moment(kb.updated_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
      </Descriptions>

      <Divider />
      
      <nav style={{ marginBottom: '20px', borderBottom: '1px solid #f0f0f0' }}>
        <NavLink to="" end style={navStyle}>Search Chunks</NavLink>
        <NavLink to="embeddings" style={navStyle}>Manage Embeddings</NavLink>
        <NavLink to="query" style={navStyle}>Query KB (RAG)</NavLink>
        <NavLink to="query-history" style={navStyle}>Query History</NavLink>
        <NavLink to="query-stats" style={navStyle}>Query Stats</NavLink>
      </nav>

      <Outlet context={{ kbId, kbName: kb.name }} />
    </div>
  );
};

// Helper components to use the outlet context
const SearchChunks = () => {
  const { kbId } = useOutletContext();
  return <SearchChunksComponent kbId={kbId} />;
};

const ManageEmbeddings = () => {
  const { kbId } = useOutletContext();
  return <ManageEmbeddingsComponent kbId={kbId} />;
};

const QueryKnowledgeBasePage = () => {
  const { kbId, kbName } = useOutletContext();
  return <QueryKnowledgeBaseComponent kbId={kbId} kbName={kbName} />;
};

const QueryHistoryPage = () => {
  const { kbId } = useOutletContext();
  return <QueryHistoryComponent kbId={kbId} />;
};

const QueryStatsPage = () => {
  const { kbId } = useOutletContext();
  return <QueryStatsComponent kbId={kbId} />;
};

// Define KnowledgeBaseDetailPage as a container for the nested routes
const KnowledgeBaseDetailPage = () => {
  return (
    <Routes>
      <Route path="/" element={<KnowledgeBaseDetailContent />}>
        <Route index element={<SearchChunks />} />
        <Route path="embeddings" element={<ManageEmbeddings />} />
        <Route path="query" element={<QueryKnowledgeBasePage />} />
        <Route path="query-history" element={<QueryHistoryPage />} />
        <Route path="query-stats" element={<QueryStatsPage />} />
      </Route>
    </Routes>
  );
};

export default KnowledgeBaseDetailPage;