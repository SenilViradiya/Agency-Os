'use client';

import React, { useState, useEffect } from 'react';
import { Row, Col, Empty, Skeleton, Card, Table, Tag, Typography } from 'antd';
import dynamic from 'next/dynamic';
import StatCard from './StatCard';
import apiClient from '@/lib/apiClient';
import { useAnalyticsStore } from '@/store/analyticsStore';

const Column = dynamic(() => import('@ant-design/charts').then((m) => m.Column), { ssr: false });
const Pie = dynamic(() => import('@ant-design/charts').then((m) => m.Pie), { ssr: false });
const Bar = dynamic(() => import('@ant-design/charts').then((m) => m.Bar), { ssr: false });
const Gauge = dynamic(() => import('@ant-design/charts').then((m) => m.Gauge), { ssr: false });

const { Text } = Typography;

interface ContentData {
  summary: {
    totalCreated: number;
    totalPublished: number;
    totalInProduction: number;
    totalInApproval: number;
    totalRevisionRequested: number;
    avgDaysFromCreateToPublish: number;
    avgRevisionsPerItem: number;
    firstPassApprovalRate: number;
  };
  weeklyTrend: { week: string; created: number; published: number }[];
  byContentType: { contentType: string; count: number }[];
  avgDaysPerStage: { stage: string; avgDays: number }[];
  firstPassApprovalRate: number;
  contentWithMostRevisions: {
    contentNumber: string;
    title: string;
    clientName: string;
    totalRevisions: number;
    status: string;
    assignedToName: string;
  }[];
}

const statusColors: Record<string, string> = {
  draft: 'default',
  in_production: 'processing',
  in_approval: 'warning',
  approved: 'success',
  published: 'green',
  revision_requested: 'error',
};

export default function ContentPerformanceTab() {
  const { dateRange } = useAnalyticsStore();
  const [data, setData] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/analytics/content', {
          params: {
            startDate: dateRange[0].toISOString(),
            endDate: dateRange[1].toISOString(),
          },
        });
        if (res.data.success) setData(res.data.data);
      } catch (error) {
        console.error('Failed to fetch content analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  if (loading) {
    return (
      <div>
        <Row gutter={[16, 16]}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Col xs={24} sm={12} lg={6} key={i}><Card style={{ borderRadius: 12 }}><Skeleton active paragraph={{ rows: 1 }} /></Card></Col>
          ))}
        </Row>
      </div>
    );
  }

  if (!data) return <Empty description="No content data available" />;

  const { summary } = data;

  const weeklyData = data.weeklyTrend.flatMap((d) => [
    { week: d.week, count: d.created, type: 'Created' },
    { week: d.week, count: d.published, type: 'Published' },
  ]);

  const gaugeColor = summary.firstPassApprovalRate >= 70 ? '#52c41a' : summary.firstPassApprovalRate >= 50 ? '#faad14' : '#ff4d4f';

  const columns = [
    { title: 'CNT#', dataIndex: 'contentNumber', key: 'contentNumber', width: 100 },
    { title: 'Title', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: 'Client', dataIndex: 'clientName', key: 'clientName', width: 150 },
    {
      title: 'Revisions',
      dataIndex: 'totalRevisions',
      key: 'totalRevisions',
      width: 100,
      sorter: (a: { totalRevisions: number }, b: { totalRevisions: number }) => b.totalRevisions - a.totalRevisions,
      render: (v: number) => <Text strong style={{ color: v > 2 ? '#ff4d4f' : undefined }}>{v}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (s: string) => (
        <Tag color={statusColors[s] || 'default'}>
          {s.replace(/_/g, ' ').toUpperCase()}
        </Tag>
      ),
    },
    { title: 'Assigned To', dataIndex: 'assignedToName', key: 'assignedToName', width: 140 },
  ];

  return (
    <div>
      {/* Row 1 - Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Total Created" value={summary.totalCreated} color="#6C63FF" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Published"
            value={summary.totalPublished}
            subValue={`${summary.totalCreated > 0 ? Math.round((summary.totalPublished / summary.totalCreated) * 1000) / 10 : 0}%`}
            subLabel="delivery rate"
            color="#52c41a"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Avg Days to Publish"
            value={summary.avgDaysFromCreateToPublish}
            suffix="days"
            color="#fa8c16"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="First Pass Rate"
            value={`${summary.firstPassApprovalRate}`}
            suffix="%"
            color={gaugeColor}
          />
        </Col>
      </Row>

      {/* Row 2 - Weekly + By Type */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={13}>
          <Card title="Weekly Content: Created vs Published" style={{ borderRadius: 12 }}>
            {weeklyData.length > 0 ? (
              <Column
                data={weeklyData}
                xField="week"
                yField="count"
                colorField="type"
                group
                autoFit
                height={280}
                scale={{ color: { range: ['#d9d9d9', '#6C63FF'] } }}
                axis={{ x: { title: false }, y: { title: false } }}
              />
            ) : <Empty description="No weekly data" />}
          </Card>
        </Col>
        <Col xs={24} lg={11}>
          <Card title="Content by Type" style={{ borderRadius: 12 }}>
            {data.byContentType.length > 0 ? (
              <Pie
                data={data.byContentType}
                angleField="count"
                colorField="contentType"
                innerRadius={0.6}
                autoFit
                height={280}
                label={{ text: 'count', style: { fontWeight: 600 } }}
                legend={{ color: { position: 'bottom', layout: { justifyContent: 'center' } } }}
              />
            ) : <Empty description="No type data" />}
          </Card>
        </Col>
      </Row>

      {/* Row 3 - Avg Days + Gauge */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Avg Days Per Pipeline Stage" style={{ borderRadius: 12 }}>
            {data.avgDaysPerStage.length > 0 ? (
              <Bar
                data={data.avgDaysPerStage}
                xField="stage"
                yField="avgDays"
                colorField="stage"
                autoFit
                height={280}
                legend={false}
                axis={{ x: { title: false }, y: { title: 'Days' } }}
                style={{ radiusTopRight: 4, radiusBottomRight: 4 }}
                scale={{
                  color: {
                    range: ['#1890ff', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2', '#faad14', '#52c41a'],
                  },
                }}
              />
            ) : <Empty description="No stage data" />}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="First Pass Approval Rate" style={{ borderRadius: 12 }}>
            <Gauge
              data={{ target: summary.firstPassApprovalRate / 100, total: 1, name: 'rate' }}
              autoFit
              height={280}
              scale={{
                color: {
                  range: [gaugeColor, '#f0f0f0'],
                },
              }}
              style={{ textContent: `${summary.firstPassApprovalRate}%` }}
            />
          </Card>
        </Col>
      </Row>

      {/* Row 4 - Table */}
      <Card title="Content With Most Revisions" style={{ borderRadius: 12 }}>
        {data.contentWithMostRevisions.length > 0 ? (
          <Table
            dataSource={data.contentWithMostRevisions}
            columns={columns}
            rowKey="contentNumber"
            pagination={false}
            size="small"
          />
        ) : (
          <Empty description="All content approved first time 🎉" />
        )}
      </Card>
    </div>
  );
}
