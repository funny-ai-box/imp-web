import React, { useState, useEffect, useCallback } from 'react';
import { Table, message, Typography, Spin } from 'antd';
import { getQueryHistory } from '../../api';
import moment from 'moment';

const { Title } = Typography;

const QueryHistoryPage = ({ kbId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

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
  }, [kbId, pagination.current, pagination.pageSize]);

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

export default QueryHistoryPage;