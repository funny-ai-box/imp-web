import  { useState, useEffect, useCallback } from 'react';
import { useParams,  Routes, Route, NavLink, Outlet } from 'react-router-dom';
import { getKnowledgeBaseDetail, searchKnowledgeBaseChunks, createDocumentEmbeddings, deleteEmbeddings } from '../api';
import { Card, Descriptions, Spin, message, Tag, Typography, Divider, Button, Form, Input, InputNumber, Table, Space } from 'antd';
import moment from 'moment';

const { Title, Paragraph } = Typography;

const SearchChunks = ({ kbId }) => {
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

const ManageEmbeddings = ({ kbId }) => {
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
        <Card title="Delete Embeddings">
            <Paragraph>Delete embeddings for an entire document or specific chunks.</Paragraph>
            <Form form={deleteForm} onFinish={handleDeleteEmbeddings} layout="vertical">
                <Form.Item name="document_id_to_delete" label="Document ID (optional, deletes all its chunks)">
                <Input placeholder="Enter Document ID to delete all its embeddings" />
                </Form.Item>
                <Form.Item name="chunk_ids_to_delete" label="Chunk IDs (optional, comma-separated)">
                <Input.TextArea rows={2} placeholder="e.g., chunk_id_1, chunk_id_2" />
                </Form.Item>
                <Form.Item>
                <Button type="danger" htmlType="submit" loading={deleteLoading}>Delete Embeddings</Button>
                </Form.Item>
            </Form>
        </Card>
    </Space>
  );
};


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

const KnowledgeBaseDetailPage = () => (
  <Routes>
    <Route path="/" element={<KnowledgeBaseDetailContent />}>
      <Route index element={<SearchChunksWrapper />} />
      <Route path="embeddings" element={<ManageEmbeddingsWrapper />} />
  
    </Route>
  </Routes>
);

// Wrapper components to pass context from Outlet to child route elements
import { useOutletContext } from 'react-router-dom';

const SearchChunksWrapper = () => {
  const { kbId } = useOutletContext();
  return <SearchChunks kbId={kbId} />;
};
const ManageEmbeddingsWrapper = () => {
  const { kbId } = useOutletContext();
  return <ManageEmbeddings kbId={kbId} />;
};



export default KnowledgeBaseDetailPage;
