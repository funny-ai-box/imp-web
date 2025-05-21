import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Card, 
  Table, 
  Space, 
  Tag, 
  Typography, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Button, 
  Row, 
  Col,
  Tooltip,
  Drawer,
  Descriptions,
  message,
  Divider,
  Rate,
  Image,
  Tabs,
  Collapse,
  Empty
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  UserOutlined,
  FileTextOutlined,
  MessageOutlined,
  StarOutlined,
  RobotOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CodeOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { getXhsGenerationLogs } from '../../api/applications';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const XhsGenerationLogsPage = () => {
  // 状态管理
  const [form] = Form.useForm();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({});
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const isFirstRender = useRef(true);
  
  // 获取日志数据
  const fetchLogs = useCallback(async (page = pagination.current, pageSize = pagination.pageSize, currentFilters = filters) => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: pageSize,
        ...currentFilters
      };
      
      // 处理日期范围
      if (currentFilters.date_range && currentFilters.date_range.length === 2) {
        params.start_date = currentFilters.date_range[0].format('YYYY-MM-DD');
        params.end_date = currentFilters.date_range[1].format('YYYY-MM-DD');
        delete params.date_range;
      }
      
      console.log('API请求参数:', params);
      const response = await getXhsGenerationLogs(params);
      console.log('API响应:', response.data);
      
      if (response.data && response.data.code === 200) {
        setLogs(response.data.data.items || []);
        setPagination({
          current: response.data.data.page,
          pageSize: response.data.data.per_page,
          total: response.data.data.total
        });
      } else {
        message.error(response.data?.message || '获取日志失败');
        setLogs([]);
      }
    } catch (error) {
      console.error('获取日志失败:', error);
      message.error('获取日志失败: ' + (error.response?.data?.message || error.message));
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters]);
  
  // 初始加载
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      fetchLogs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // 查询表单提交
  const handleSearch = (values) => {
    const newFilters = { ...values };
    setFilters(newFilters);
    fetchLogs(1, pagination.pageSize, newFilters);
  };
  
  // 重置查询表单
  const handleReset = () => {
    form.resetFields();
    setFilters({});
    fetchLogs(1, pagination.pageSize, {});
  };
  
  // 表格分页变化
  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
    fetchLogs(newPagination.current, newPagination.pageSize, filters);
  };
  
  // 查看详情
  const handleViewDetail = (record) => {
    setSelectedLog(record);
    setDetailVisible(true);
  };
  
  // 格式化持续时间（毫秒转换为秒）
  const formatDuration = (ms) => {
    if (!ms && ms !== 0) return '-';
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  // 格式化JSON字符串
  const formatJSON = (jsonString) => {
    try {
      if (!jsonString) return null;
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      console.error('JSON解析错误:', e);
      return jsonString;
    }
  };
  
  // 解析消息历史
  const parseMessages = (messagesStr) => {
    try {
      if (!messagesStr) return [];
      return JSON.parse(messagesStr);
    } catch (e) {
      console.error('解析消息历史错误:', e);
      return [];
    }
  };
  
  // 获取状态标签颜色
  const getStatusTagColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'processing':
        return 'processing';
      default:
        return 'default';
    }
  };
  
  // 获取状态图标
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined />;
      case 'failed':
        return <CloseCircleOutlined />;
      case 'processing':
        return <SyncOutlined spin />;
      default:
        return null;
    }
  };
  
  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
  
    {
      title: '提示词',
      dataIndex: 'prompt',
      key: 'prompt',
      ellipsis: true,
      render: (text) => <Tooltip title={text}>{text}</Tooltip>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag icon={getStatusIcon(status)} color={getStatusTagColor(status)}>
          {status === 'completed' ? '成功' : status === 'failed' ? '失败' : '处理中'}
        </Tag>
      )
    },
    {
      title: '失败原因',
      dataIndex: 'error_message',
      key: 'error_message',

      render: (text) => text || '-'

    },
    {
      title: '模型',
      dataIndex: 'model_id',
      key: 'model_id',
      width: 140,
      ellipsis: true,
      render: (text) => text || '-'
    },
    {
      title: '提供商',
      dataIndex: 'provider_type',
      key: 'provider_type',
      width: 100,
      render: (text) => text || '-'
    },
    {
      title: '处理时间',
      dataIndex: 'duration_ms',
      key: 'duration_ms',
      width: 100,
      render: (duration) => formatDuration(duration)
    },
    {
      title: '令牌数',
      dataIndex: 'tokens_used',
      key: 'tokens_used',
      width: 100,
      render: (tokens) => tokens ? `${tokens}` : '-'
    },

    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (text) => text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />} 
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ];
  
  // 详情抽屉内容
  const renderDetail = () => {
    if (!selectedLog) return null;
    
    // 解析消息历史
    const messages = parseMessages(selectedLog.messages);
    
    return (
      <div>
        <Tabs defaultActiveKey="1">
          <TabPane tab="基本信息" key="1">
            <Descriptions title="基本信息" bordered column={2}>
              <Descriptions.Item label="ID">{selectedLog.id}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusTagColor(selectedLog.status)}>
                  {selectedLog.status === 'completed' ? '成功' : selectedLog.status === 'failed' ? '失败' : '处理中'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="应用ID">{selectedLog.app_id}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedLog.created_at ? moment(selectedLog.created_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
              <Descriptions.Item label="AI提供商">{selectedLog.provider_type || '-'}</Descriptions.Item>
              <Descriptions.Item label="模型">{selectedLog.model_id || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理时间">{selectedLog.duration_ms ? `${formatDuration(selectedLog.duration_ms)} (${selectedLog.duration_ms} ms)` : '-'}</Descriptions.Item>
              <Descriptions.Item label="令牌数">{selectedLog.tokens_used || '-'}</Descriptions.Item>
              <Descriptions.Item label="IP地址">{selectedLog.ip_address || '-'}</Descriptions.Item>
              <Descriptions.Item label="用户评分">
                {selectedLog.user_rating ? <Rate disabled defaultValue={selectedLog.user_rating} /> : '-'}
              </Descriptions.Item>
            </Descriptions>
            
            {selectedLog.error_message && (
              <div style={{ marginTop: 16 }}>
                <Title level={5} style={{ color: '#f5222d' }}>错误信息</Title>
                <Paragraph style={{ 
                  backgroundColor: '#fff2f0', 
                  padding: 12, 
                  borderRadius: 4,
                  border: '1px solid #ffccc7' 
                }}>
                  {selectedLog.error_message}
                </Paragraph>
              </div>
            )}
            
            <Divider />
            
            <Title level={5}>提示词</Title>
            <Paragraph style={{ 
              backgroundColor: '#f5f5f5', 
              padding: 12, 
              borderRadius: 4 
            }}>
              {selectedLog.prompt}
            </Paragraph>
            
            {selectedLog.image_urls && selectedLog.image_urls.length > 0 && (
              <>
                <Title level={5}>上传图片</Title>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selectedLog.image_urls.map((url, index) => (
                    <Image
                      key={index}
                      src={url}
                      width={120}
                      height={120}
                      style={{ objectFit: 'cover' }}
                    />
                  ))}
                </div>
              </>
            )}
            
            {selectedLog.content && (
              <>
                <Divider />
                
                <Title level={5}>生成结果</Title>
                <Card title={selectedLog.title || '无标题'} bordered={false} style={{ marginBottom: 16 }}>
                  <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{selectedLog.content}</Paragraph>
                  
                  {selectedLog.tags && selectedLog.tags.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      {selectedLog.tags.map((tag, index) => (
                        <Tag key={index} color="blue">{tag}</Tag>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}
            
            {selectedLog.user_feedback && (
              <>
                <Title level={5}>用户反馈</Title>
                <Paragraph style={{ 
                  backgroundColor: '#e6f7ff', 
                  padding: 12, 
                  borderRadius: 4,
                  border: '1px solid #91d5ff'
                }}>
                  {selectedLog.user_feedback}
                </Paragraph>
              </>
            )}
          </TabPane>
          
          <TabPane tab="消息历史" key="2">
            {messages && messages.length > 0 ? (
              <div>
                {messages.map((msg, index) => (
                  <Card 
                    key={index}
                    title={
                      <Space>
                        {msg.role === 'user' ? (
                          <><UserOutlined /> 用户</>
                        ) : (
                          <><RobotOutlined /> 助手</>
                        )}
                      </Space>
                    }
                    style={{ marginBottom: 16 }}
                    type={msg.role === 'user' ? 'inner' : ''}
                  >
                    <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Paragraph>
                  </Card>
                ))}
              </div>
            ) : (
              <Empty description="没有消息历史数据" />
            )}
          </TabPane>
          
          <TabPane tab="原始响应" key="3">
            {selectedLog.raw_response ? (
              <Collapse defaultActiveKey={['1']}>
                <Panel header="原始响应数据" key="1">
                  <pre style={{ 
                    backgroundColor: '#f5f5f5', 
                    padding: 12, 
                    borderRadius: 4,
                    overflow: 'auto',
                    maxHeight: '500px'
                  }}>
                    {formatJSON(selectedLog.raw_response)}
                  </pre>
                </Panel>
              </Collapse>
            ) : (
              <Empty description="没有原始响应数据" />
            )}
          </TabPane>
        </Tabs>
      </div>
    );
  };
  
  return (
    <div>
      <Title level={2}>小红书文案生成调用日志</Title>
      
      <Card style={{ marginBottom: 16 }}>
        <Form
          form={form}
          onFinish={handleSearch}
        >
          <Row gutter={16}>
            <Col xs={12} sm={6} md={4} lg={4}>
              <Form.Item name="status" label="状态">
                <Select allowClear placeholder="选择状态">
                  <Option value="completed">成功</Option>
                  <Option value="failed">失败</Option>
                  <Option value="processing">处理中</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="provider_type" label="提供商">
                <Select allowClear placeholder="选择提供商">
                
                  <Option value="Yanxi">言犀</Option>
                  <Option value="Volcano">火山引擎</Option>
         
                </Select>
              </Form.Item>
            </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="model_id" label="模型">
                <Select allowClear placeholder="选择模型">
                
                  <Option value="Chatrhino-750B">Chatrhino-750B</Option>
                  <Option value="doubao-1.5-vision-pro-32k-250115">doubao-1.5-vision-pro-32k-250115</Option>
         
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="date_range" label="日期范围">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
           
            <Col xs={24} sm={24} md={24} lg={24} style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={handleReset}>重置</Button>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  查询
                </Button>
                <Button icon={<ReloadOutlined />} onClick={() => fetchLogs()}>
                  刷新
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>
      
      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
        onChange={handleTableChange}
        scroll={{ x: 1300 }}
      />
      
      <Drawer
        title="调用详情"
        width={800}
        onClose={() => setDetailVisible(false)}
        open={detailVisible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        {renderDetail()}
      </Drawer>
    </div>
  );
};

export default XhsGenerationLogsPage;