import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Select, Space, message, Tag, Typography, Tooltip } from 'antd';
import { PlusOutlined, EyeOutlined, SearchOutlined, MessageOutlined } from '@ant-design/icons';
import { listKnowledgeBases } from '../../api';
import CreateKnowledgeBaseModal from '../../components/KnowledgeBase/CreateKnowledgeBaseModal';
import { Link } from 'react-router-dom';
import moment from 'moment';

const { Option } = Select;
const { Title } = Typography;

const KnowledgeBasesPage = () => {
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({ name: '', is_active: '', is_public: '' });
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchKBs = useCallback(async (page = pagination.current, pageSize = pagination.pageSize, currentFilters = filters) => {
    setLoading(true);
    try {
      const params = {
        page: page,
        per_page: pageSize,
        name: currentFilters.name || undefined,
        is_active: currentFilters.is_active || undefined,
        is_public: currentFilters.is_public || undefined,
      };
      const response = await listKnowledgeBases(params);
      if (response.data && response.data.data) {
        setKnowledgeBases(response.data.data.items || []);
        setPagination({
          current: response.data.data.page,
          pageSize: response.data.data.per_page,
          total: response.data.data.total,
        });
      } else {
        setKnowledgeBases([]);
        setPagination(prev => ({ ...prev, total:0, current: 1}));
        message.info('No knowledge bases found or API response format is unexpected.');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to fetch knowledge bases.');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters]);

  useEffect(() => {
    fetchKBs();
  }, [fetchKBs]);

  const handleTableChange = (newPagination) => {
    fetchKBs(newPagination.current, newPagination.pageSize, filters);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchKBs(1, pagination.pageSize, newFilters);
  };
  
  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (text, record) => <Link to={`/knowledge-bases/${record.id}`}>{text}</Link> },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true, render: text => <Tooltip title={text}>{text || '-'}</Tooltip> },
    { title: 'Docs', dataIndex: 'document_count', key: 'document_count', align: 'center' },
    { title: 'Chunks', dataIndex: 'total_chunks', key: 'total_chunks', align: 'center' },
    { title: 'Public', dataIndex: 'is_public', key: 'is_public', render: isPublic => <Tag color={isPublic ? 'green' : 'volcano'}>{isPublic ? 'Yes' : 'No'}</Tag> },
    { title: 'Active', dataIndex: 'is_active', key: 'is_active', render: isActive => <Tag color={isActive ? 'blue' : 'red'}>{isActive ? 'Yes' : 'No'}</Tag> },
    { title: 'Embedding Provider', dataIndex: 'embedding_provider', key: 'embedding_provider' },
    { title: 'Embedding Model', dataIndex: 'embedding_model', key: 'embedding_model' },
    { title: 'Created At', dataIndex: 'created_at', key: 'created_at', render: text => moment(text).format('YYYY-MM-DD HH:mm') },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Space size="middle">
          <Link to={`/knowledge-bases/${record.id}`}><Button icon={<EyeOutlined />} size="small">Details</Button></Link>
          <Link to={`/knowledge-bases/${record.id}/query`}><Button icon={<MessageOutlined />} size="small">Query</Button></Link>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Knowledge Bases</Title>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search by name"
          value={filters.name}
          onChange={e => handleFilterChange('name', e.target.value)}
          style={{ width: 200 }}
          suffix={<SearchOutlined />}
        />
        <Select
          placeholder="Is Active?"
          value={filters.is_active}
          onChange={value => handleFilterChange('is_active', value)}
          style={{ width: 120 }}
          allowClear
        >
          <Option value="true">Active</Option>
          <Option value="false">Inactive</Option>
        </Select>
        <Select
          placeholder="Is Public?"
          value={filters.is_public}
          onChange={value => handleFilterChange('is_public', value)}
          style={{ width: 120 }}
          allowClear
        >
          <Option value="true">Public</Option>
          <Option value="false">Private</Option>
        </Select>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          Create New
        </Button>
      </Space>
      <Table
        columns={columns}
        dataSource={knowledgeBases}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        rowKey="id"
      />
      <CreateKnowledgeBaseModal
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onSuccess={() => {
          setIsModalVisible(false);
          fetchKBs(1, pagination.pageSize, filters); 
        }}
      />
    </div>
  );
};

export default KnowledgeBasesPage;