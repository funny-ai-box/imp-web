import React, { useState } from 'react';
import { Upload, Button, message, Card, Typography, Progress, List, Tag, Space, Modal, Radio, Form, Input, Divider, Alert, Tooltip } from 'antd';
import { UploadOutlined, FileTextOutlined, DeleteOutlined, EyeOutlined, ScissorOutlined, SlidersFilled, FileSearchOutlined } from '@ant-design/icons';
import { uploadDocumentsToKnowledgeBase, processDocuments, previewDocument } from '../../api'; // 需要实现这些API

const { Dragger } = Upload;
const { Title, Paragraph, Text } = Typography;
const { confirm } = Modal;

const DocumentUploadComponent = ({ kbId }) => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processOptions, setProcessOptions] = useState({
    chunkSize: 1000,
    chunkOverlap: 200,
    skipEmbedding: false
  });
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('idle'); // 'idle', 'processing', 'completed', 'failed'
  const [processedFiles, setProcessedFiles] = useState([]);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // 处理文件上传
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择要上传的文件');
      return;
    }

    const formData = new FormData();
    fileList.forEach(file => {
      formData.append('files', file);
    });
    formData.append('kb_id', kbId);

    setUploading(true);
    try {
      const response = await uploadDocumentsToKnowledgeBase(formData);
      if (response.data?.code === 200) {
        message.success('文件上传成功');
        setProcessedFiles(response.data.data || []);
        setProcessingStatus('completed');
        setProcessModalVisible(true);
      } else {
        message.error(response.data?.message || '文件上传失败');
        setProcessingStatus('failed');
      }
    } catch (error) {
      message.error('文件上传失败: ' + (error.response?.data?.message || error.message));
      setProcessingStatus('failed');
    } finally {
      setUploading(false);
    }
  };

  // 处理上传文件的属性变化
  const handleUploadChange = ({ fileList }) => {
    // 过滤掉上传失败的文件
    const filteredFileList = fileList.filter(file => {
      if (file.status === 'error') {
        message.error(`${file.name} 文件上传失败`);
        return false;
      }
      return true;
    });
    setFileList(filteredFileList);
  };

  // 处理文件预览
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }

    setPreviewLoading(true);
    try {
      // 调用文档预览API
      const response = await previewDocument(file.name, kbId);
      if (response.data?.code === 200) {
        setPreviewDocument({
          title: file.name,
          content: response.data.data.content,
          type: file.type
        });
        setPreviewModalVisible(true);
      } else {
        message.error('无法预览文件');
      }
    } catch (error) {
      message.error('预览失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setPreviewLoading(false);
    }
  };

  // 处理文件删除
  const handleRemove = (file) => {
    confirm({
      title: '确认删除文件',
      content: `确定要删除 ${file.name} 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        message.success(`已删除 ${file.name}`);
        return true;
      },
    });
  };

  // 开始处理文档（分块和向量化）
  const startProcessing = async () => {
    if (processedFiles.length === 0) {
      message.warning('没有可处理的文件');
      return;
    }

    setProcessingStatus('processing');
    setProcessingProgress(0);

    try {
      const documentIds = processedFiles.map(file => file.document_id);
      
      // 模拟进度更新函数
      const updateProgress = (progress) => {
        setProcessingProgress(progress);
      };

      // 每秒更新一次进度，模拟处理过程
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 1000);

      // 调用文档处理API
      const response = await processDocuments({
        kb_id: kbId,
        document_ids: documentIds,
        chunk_size: processOptions.chunkSize,
        chunk_overlap: processOptions.chunkOverlap,
        skip_embedding: processOptions.skipEmbedding
      });

      clearInterval(progressInterval);

      if (response.data?.code === 200) {
        setProcessingProgress(100);
        setProcessingStatus('completed');
        message.success('文档处理成功');
        
        // 更新处理后的文件信息
        setProcessedFiles(response.data.data || processedFiles);
      } else {
        setProcessingStatus('failed');
        message.error(response.data?.message || '文档处理失败');
      }
    } catch (error) {
      setProcessingStatus('failed');
      message.error('文档处理失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 处理设置变更
  const handleProcessOptionsChange = (changedValues, allValues) => {
    setProcessOptions(allValues);
  };

  // 渲染处理模态框
  const renderProcessModal = () => (
    <Modal
      title="文档处理设置"
      open={processModalVisible}
      onCancel={() => {
        if (processingStatus !== 'processing') {
          setProcessModalVisible(false);
        }
      }}
      footer={processingStatus === 'processing' ? null : [
        <Button key="back" onClick={() => setProcessModalVisible(false)}>
          关闭
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={startProcessing}
          disabled={processingStatus === 'processing'}
        >
          开始处理
        </Button>
      ]}
      width={700}
    >
      {processingStatus === 'idle' && (
        <>
          <Alert
            message="文档处理说明"
            description="文档处理将按照设置的参数对文档进行切分和向量化，以便后续进行语义搜索。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Form
            initialValues={processOptions}
            onValuesChange={handleProcessOptionsChange}
            layout="vertical"
          >
            <Form.Item 
              name="chunkSize" 
              label={
                <Space>
                  <span>分块大小</span>
                  <Tooltip title="每个文本块的最大标记（token）数量，较大的值适合保留上下文，但可能降低检索精度">
                    <InfoCircleOutlined />
                  </Tooltip>
                </Space>
              }
            >
              <Radio.Group>
                <Radio value={500}>小 (500)</Radio>
                <Radio value={1000}>中 (1000)</Radio>
                <Radio value={1500}>大 (1500)</Radio>
                <Radio value={2000}>超大 (2000)</Radio>
              </Radio.Group>
            </Form.Item>
            
            <Form.Item 
              name="chunkOverlap" 
              label={
                <Space>
                  <span>分块重叠</span>
                  <Tooltip title="相邻块之间重叠的标记数量，有助于保持上下文连贯性">
                    <InfoCircleOutlined />
                  </Tooltip>
                </Space>
              }
            >
              <InputNumber min={0} max={500} style={{ width: 200 }} />
            </Form.Item>
            
            <Form.Item 
              name="skipEmbedding" 
              valuePropName="checked"
              label="仅分块不向量化"
            >
              <Checkbox>启用该选项将只进行文本分块，不生成向量表示</Checkbox>
            </Form.Item>
          </Form>
          
          <Divider />
          
          <div style={{ marginBottom: 16 }}>
            <Text strong>已上传文件列表：</Text>
          </div>
          
          <List
            size="small"
            bordered
            dataSource={processedFiles}
            renderItem={item => (
              <List.Item
                actions={[
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => handlePreview({ name: item.filename })}
                    icon={<EyeOutlined />}
                  >
                    预览
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<FileTextOutlined />}
                  title={item.filename}
                  description={`文档ID: ${item.document_id}`}
                />
              </List.Item>
            )}
          />
        </>
      )}
      
      {processingStatus === 'processing' && (
        <div style={{ textAlign: 'center' }}>
          <Progress 
            percent={processingProgress} 
            status="active" 
            style={{ marginBottom: 20 }}
          />
          <div>
            <ScissorOutlined style={{ fontSize: 36, marginBottom: 16 }} />
            <Title level={4}>正在处理文档</Title>
            <Paragraph>正在将文档分块并生成向量表示，请稍候...</Paragraph>
          </div>
        </div>
      )}
      
      {processingStatus === 'completed' && (
        <div style={{ textAlign: 'center' }}>
          <Progress 
            percent={100} 
            status="success" 
            style={{ marginBottom: 20 }}
          />
          <div>
            <CheckCircleOutlined style={{ fontSize: 36, color: '#52c41a', marginBottom: 16 }} />
            <Title level={4}>处理完成</Title>
            <Paragraph>文档已成功处理，现在可以通过语义搜索查询这些内容了</Paragraph>
            
            <List
              size="small"
              bordered
              style={{ marginTop: 20, textAlign: 'left' }}
              dataSource={processedFiles}
              renderItem={item => (
                <List.Item>
                  <Space>
                    <FileTextOutlined />
                    <Text>{item.filename}</Text>
                    <Tag color="green">已处理</Tag>
                    <Tag color="blue">块数: {item.chunk_count || '未知'}</Tag>
                    <Tag color="purple">令牌: {item.token_count || '未知'}</Tag>
                  </Space>
                </List.Item>
              )}
            />
          </div>
        </div>
      )}
      
      {processingStatus === 'failed' && (
        <div style={{ textAlign: 'center' }}>
          <Progress 
            percent={processingProgress} 
            status="exception" 
            style={{ marginBottom: 20 }}
          />
          <div>
            <CloseCircleOutlined style={{ fontSize: 36, color: '#f5222d', marginBottom: 16 }} />
            <Title level={4}>处理失败</Title>
            <Paragraph>文档处理过程中遇到错误，请重试或联系管理员</Paragraph>
          </div>
        </div>
      )}
    </Modal>
  );

  // 渲染文件预览模态框
  const renderPreviewModal = () => (
    <Modal
      title={previewDocument?.title || '文件预览'}
      open={previewModalVisible}
      onCancel={() => setPreviewModalVisible(false)}
      footer={[
        <Button key="back" onClick={() => setPreviewModalVisible(false)}>
          关闭
        </Button>
      ]}
      width={800}
      bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
    >
      {previewLoading ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin tip="加载预览..." />
        </div>
      ) : (
        <div>
          {previewDocument?.type?.includes('image') ? (
            <img 
              src={previewDocument.content} 
              alt={previewDocument.title} 
              style={{ maxWidth: '100%' }} 
            />
          ) : (
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-word',
              background: '#f5f5f5',
              padding: '16px',
              borderRadius: '4px'
            }}>
              {previewDocument?.content || '无法预览文件内容'}
            </pre>
          )}
        </div>
      )}
    </Modal>
  );

  // 辅助函数 - 文件转Base64
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div>
      <Card title={
        <Space>
          <UploadOutlined />
          <span>文档上传</span>
        </Space>
      }>
        <Alert
          message="支持的文件类型"
          description="PDF、Word (docx)、TXT、Markdown、Excel (xlsx)、CSV、HTML、PowerPoint (pptx)等文档格式"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Dragger
          fileList={fileList}
          onChange={handleUploadChange}
          onRemove={handleRemove}
          beforeUpload={file => {
            setFileList([...fileList, file]);
            return false; // 阻止自动上传
          }}
          multiple
          accept=".pdf,.docx,.txt,.md,.xlsx,.csv,.html,.pptx"
          listType="picture"
          showUploadList={{
            showPreviewIcon: true,
            showRemoveIcon: true,
            showDownloadIcon: false,
          }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined style={{ fontSize: 48, color: '#40a9ff' }} />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持单个或批量上传，上传后可以进行文档处理和向量化
          </p>
        </Dragger>
        
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Button
            type="primary"
            onClick={handleUpload}
            disabled={fileList.length === 0}
            loading={uploading}
            icon={<UploadOutlined />}
            size="large"
          >
            上传文件
          </Button>
          <Button
            type="default"
            onClick={() => setProcessModalVisible(true)}
            disabled={processedFiles.length === 0}
            icon={<ScissorOutlined />}
            style={{ marginLeft: 16 }}
            size="large"
          >
            处理文档
          </Button>
        </div>
      </Card>
      
      {renderProcessModal()}
      {renderPreviewModal()}
    </div>
  );
};

export default DocumentUploadComponent;