import React, { useState, useEffect, useCallback } from 'react';
import { Card, Descriptions, Spin, message, Typography, Row, Col } from 'antd';
import { BarChartOutlined, ClockCircleOutlined, FileTextOutlined, LineChartOutlined } from '@ant-design/icons';
import { getQueryStats, getRecentQueries, getPopularQueries } from '../../api';
import { Bar } from '@ant-design/plots'; // Using Ant Design Charts

const { Title, Text } = Typography;

const QueryStatsPage = ({ kbId }) => {
  const [stats, setStats] = useState(null);
  const [recentQueries, setRecentQueries] = useState([]);
  const [popularQueries, setPopularQueries] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingPopular, setLoadingPopular] = useState(true);

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
  }, [kbId]);

  useEffect(() => {
    if (kbId) {
      fetchAllStats();
    }
  }, [kbId, fetchAllStats]);

  if (!kbId) return <Spin tip="Loading KB context..."/>;
  
  const dailyCountsData = stats?.daily_counts 
    ? Object.entries(stats.daily_counts).map(([date, count]) => ({ date, count })).sort((a,b) => new Date(a.date) - new Date(b.date))
    : [];

  return (
    <div>
      <Title level={4}>Query Statistics for KB: {kbId}</Title>
      {loadingStats ? <Spin /> : stats ? (
        <Row gutter={[16,16]}>
            <Col xs={24} sm={12} md={8} lg={6}>
                <Card>
                    <BarChartOutlined style={{fontSize: '24px', color: '#1890ff'}}/>
                    <Title level={5}>Total Queries</Title>
                    <Text style={{fontSize: '20px'}}>{stats.total_queries}</Text>
                </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
                <Card>
                    <ClockCircleOutlined style={{fontSize: '24px', color: '#52c41a'}}/>
                    <Title level={5}>Avg. Duration</Title>
                    <Text style={{fontSize: '20px'}}>{stats.avg_duration ? `${stats.avg_duration.toFixed(2)} ms` : 'N/A'}</Text>
                </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
                <Card>
                    <FileTextOutlined style={{fontSize: '24px', color: '#faad14'}}/>
                    <Title level={5}>Total Tokens</Title>
                    <Text style={{fontSize: '20px'}}>{stats.total_tokens}</Text>
                </Card>
            </Col>
        </Row>
      ) : <Text>No overall stats available.</Text>}

      {loadingStats ? null : dailyCountsData.length > 0 && (
        <Card title="Daily Query Counts" style={{marginTop: 16}}>
           <Bar 
            data={dailyCountsData} 
            xField='count' 
            yField='date' 
            height={300}
            seriesField='date'
            legend={{position: 'top-left'}}
            yAxis={{label: { autoRotate: false}}}
            tooltip={{ title: (d) => d, formatter: (datum) => ({ name: "Queries", value: datum.count }) }}
            />
        </Card>
      )}

      <Row gutter={16} style={{marginTop: 16}}>
        <Col xs={24} md={12}>
            <Card title="Recent Queries">
                {loadingRecent ? <Spin/> : recentQueries.length > 0 ? (
                    <List size="small" dataSource={recentQueries} renderItem={item => (
                        <List.Item>
                            <Text ellipsis>{item.query_text}</Text>
                        </List.Item>
                    )}/>
                ) : <Text>No recent queries.</Text>}
            </Card>
        </Col>
        <Col xs={24} md={12}>
            <Card title="Popular Queries">
                {loadingPopular ? <Spin/> : popularQueries.length > 0 ? (
                    <List size="small" dataSource={popularQueries} renderItem={item => (
                        <List.Item>
                            <Text ellipsis>{item.query}</Text> <Tag>{item.count} times</Tag>
                        </List.Item>
                    )}/>
                ) : <Text>No popular queries.</Text>}
            </Card>
        </Col>
      </Row>
    </div>
  );
};

export default QueryStatsPage;