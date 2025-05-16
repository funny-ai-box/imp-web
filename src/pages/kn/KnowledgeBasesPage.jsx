import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Select, Space, message, Tag, Typography, Tooltip, Card, Row, Col, Statistic, Divider, Empty, Pagination, Badge } from 'antd';
import { PlusOutlined, EyeOutlined, SearchOutlined, MessageOutlined, DatabaseOutlined, ReloadOutlined, BookOutlined, FileTextOutlined } from '@ant-design/icons';
import { listKnowledgeBases } from '../../api';
import CreateKnowledgeBaseModal from '../../components/KnowledgeBase/CreateKnowledgeBaseModal';
import { Link } from 'react-router-dom';
import moment from 'moment';
import 'moment/locale/zh-cn';  // 设置 moment 为中文

// 设置 moment 语言为中文
moment.locale('zh-cn');

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const KnowledgeBasesPage = () => {
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({ name: '', is_active: '', is_public: '' });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // 用于触发刷新
  const [summary, setSummary] = useState({ total: 0, active: 0, public: 0, totalDocs: 0, totalChunks: 0 });

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
        const kbs = response.data.data.items || [];
        setKnowledgeBases(kbs);
        setPagination({
          current: response.data.data.page,
          pageSize: response.data.data.per_page,
          total: response.data.data.total,
        });
        
        // 计算统计数据
        const active = kbs.filter(kb => kb.is_active).length;
        const publicKb = kbs.filter(kb => kb.is_public).length;
        const totalDocs = kbs.reduce((sum, kb) => sum + (kb.document_count || 0), 0);
        const totalChunks = kbs.reduce((sum, kb) => sum + (kb.total_chunks || 0), 0);
        
        setSummary({
          total: response.data.data.total || kbs.length,
          active,
          public: publicKb,
          totalDocs,
          totalChunks
        });
      } else {
        setKnowledgeBases([]);
        setPagination(prev => ({ ...prev, total:0, current: 1}));
        message.info('未找到知识库或API响应格式异常');
      }
    } catch (error) {
      message.error(error.response?.data?.message || '获取知识库列表失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters]);

  useEffect(() => {
    fetchKBs();
  }, [fetchKBs, refreshKey]);

  const handleTableChange = (newPagination) => {
    fetchKBs(newPagination.current, newPagination.pageSize, filters);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchKBs(1, pagination.pageSize, newFilters);
  };
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  const columns = [
    { 
      title: '知识库名称', 
      dataIndex: 'name', 
      key: 'name', 
      render: (text, record) => (
        <Space>
          <BookOutlined />
          <Link to={`/knowledge-bases/${record.id}`}>{text}</Link>
          {record.is_public && <Badge status="success" text="公开" />}
        </Space>
      )
    },
    { 
      title: '描述', 
      dataIndex: 'description', 
      key: 'description', 
      ellipsis: true, 
      render: text => <Tooltip title={text}>{text || '-'}</Tooltip> 
    },
    { 
      title: '文档数', 
      dataIndex: 'document_count', 
      key: 'document_count', 
      align: 'center',
      render: count => <Tag color="blue">{count || 0}</Tag>
    },
    { 
      title: '块数', 
      dataIndex: 'total_chunks', 
      key: 'total_chunks', 
      align: 'center',
      render: count => <Tag color="purple">{count || 0}</Tag>
    },
    { 
      title: '公开状态', 
      dataIndex: 'is_public', 
      key: 'is_public', 
      align: 'center',
      render: isPublic => (
        <Tag color={isPublic ? 'green' : 'orange'}>
          {isPublic ? '公开' : '私有'}
        </Tag>
      )
    },
    { 
      title: '活跃状态', 
      dataIndex: 'is_active', 
      key: 'is_active', 
      align: 'center',
      render: isActive => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '活跃' : '停用'}
        </Tag>
      )
    },
    { 
      title: '嵌入提供商', 
      dataIndex: 'embedding_provider', 
      key: 'embedding_provider',
      align: 'center',
      render: provider => <Tag>{provider}</Tag>
    },
    { 
      title: '嵌入模型', 
      dataIndex: 'embedding_model', 
      key: 'embedding_model',
      ellipsis: true,
      render: model => <Text type="secondary" style={{ fontSize: '12px' }}>{model}</Text>
    },
    { 
      title: '创建时间', 
      dataIndex: 'created_at', 
      key: 'created_at', 
      render: text => moment(text).format('YYYY-MM-DD HH:mm') 
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (text, record) => (
        <Space size="small">
          <Link to={`/knowledge-bases/${record.id}`}>
            <Button icon={<EyeOutlined />} size="small">详情</Button>
          </Link>
          <Link to={`/knowledge-bases/${record.id}/query`}>
            <Button type="primary" icon={<MessageOutlined />} size="small">查询</Button>
          </Link>
        </Space>
      ),
    },
  ];

  const renderEmpty = () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description="暂无知识库数据"
    >
      <Button type="primary" onClick={() => setIsModalVisible(true)}>
        创建第一个知识库
      </Button>
    </Empty>
  );

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Space align="center" style={{ marginBottom: 16 }}>
            <Title level={2} style={{ margin: 0 }}>知识库管理</Title>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              size="small"
            >
              刷新
            </Button>
          </Space>
          <Paragraph type="secondary">
            创建和管理知识库，上传文档并向量化后进行语义查询
          </Paragraph>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card hoverable>
            <Statistic title="知识库总数" value={summary.total} prefix={<DatabaseOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable>
            <Statistic title="文档总数" value={summary.totalDocs} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable>
            <Statistic title="文本块总数" value={summary.totalChunks} prefix={<BookOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Search
              placeholder="搜索知识库名称"
              value={filters.name}
              onChange={e => handleFilterChange('name', e.target.value)}
              allowClear
              onSearch={() => fetchKBs(1, pagination.pageSize, filters)}
            />
          </Col>
          <Col xs={12} sm={5}>
            <Select
              placeholder="活跃状态"
              value={filters.is_active}
              onChange={value => handleFilterChange('is_active', value)}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="true">活跃</Option>
              <Option value="false">停用</Option>
            </Select>
          </Col>
          <Col xs={12} sm={5}>
            <Select
              placeholder="公开状态"
              value={filters.is_public}
              onChange={value => handleFilterChange('is_public', value)}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="true">公开</Option>
              <Option value="false">私有</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6} style={{ textAlign: 'right' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => setIsModalVisible(true)}
            >
              创建知识库
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={knowledgeBases}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          rowKey="id"
          locale={{ emptyText: renderEmpty() }}
          scroll={{ x: 1300 }}
        />
      </Card>

      <CreateKnowledgeBaseModal
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onSuccess={() => {
          setIsModalVisible(false);
          handleRefresh();
        }}
      />
    </div>
  );
};

export default KnowledgeBasesPage;