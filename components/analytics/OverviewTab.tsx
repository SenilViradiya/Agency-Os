'use client';

import React, { useState, useEffect } from 'react';
import { Row, Col, Flex, Empty, Skeleton, Typography, Card } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  ExperimentOutlined,
  TrophyOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import dynamic from 'next/dynamic';
import StatCard from './StatCard';
import apiClient from '@/lib/apiClient';
import { useAnalyticsStore } from '@/store/analyticsStore';

const Column = dynamic(() => import('@ant-design/charts').then((m) => m.Column), { ssr: false });
const Pie = dynamic(() => import('@ant-design/charts').then((m) => m.Pie), { ssr: false });
const Area = dynamic(() => import('@ant-design/charts').then((m) => m.Area), { ssr: false });

const { Title } = Typography;

interface OverviewData {
  summary: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    taskCompletionRate: number;
    totalContentItems: number;
    publishedContent: number;
    contentDeliveryRate: number;
    totalRevisions: number;
    avgRevisionsPerContent: number;
    activeProjects: number;
    completedProjects: number;
    activeClients: number;
    newLeadsThisPeriod: number;
    wonLeadsThisPeriod: number;
    leadConversionRate: number;
  };
  taskCompletionTrend: { date: string; created: number; completed: number }[];
  tasksByType: { type: string; count: number }[];
  contentPublishedTrend: { week: string; created: number; published: number }[];
  contentByPlatform: { platform: string; count: number }[];
  contentByStage: { stage: string; count: number }[];
}

const STAGE_COLORS: Record<string, string> = {
  script: '#1890ff',
  shoot: '#fa8c16',
  edit: '#722ed1',
  thumbnail: '#eb2f96',
  caption: '#13c2c2',
  approval: '#faad14',
  publish: '#52c41a',
  completed: '#87d068',
};

export default function OverviewTab() {
  const { dateRange } = useAnalyticsStore();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/analytics/overview', {
          params: {
            startDate: dateRange[0].toISOString(),
            endDate: dateRange[1].toISOString(),
          },
        });
        if (res.data.success) setData(res.data.data);
      } catch (error) {
        console.error('Failed to fetch overview analytics:', error);
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
          {Array.from({ length: 6 }).map((_, i) => (
            <Col xs={24} sm={12} lg={8} xl={4} key={i}>
              <Card style={{ borderRadius: 12 }}>
                <Skeleton active paragraph={{ rows: 1 }} />
              </Card>
            </Col>
          ))}
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col span={14}><Card style={{ borderRadius: 12, height: 300 }}><Skeleton active /></Card></Col>
          <Col span={10}><Card style={{ borderRadius: 12, height: 300 }}><Skeleton active /></Card></Col>
        </Row>
      </div>
    );
  }

  if (!data) return <Empty description="No analytics data available" />;

  const { summary } = data;

  // Transform task trend for grouped column chart
  const taskTrendData = data.taskCompletionTrend.flatMap((d) => [
    { date: d.date, count: d.created, type: 'Created' },
    { date: d.date, count: d.completed, type: 'Completed' },
  ]);

  // Transform content trend for area chart
  const contentTrendData = data.contentPublishedTrend.flatMap((d) => [
    { week: d.week, count: d.created, type: 'Created' },
    { week: d.week, count: d.published, type: 'Published' },
  ]);

  // Content stage data with colors
  const stageData = data.contentByStage.map((d) => ({
    ...d,
    stage: d.stage.charAt(0).toUpperCase() + d.stage.slice(1),
    color: STAGE_COLORS[d.stage] || '#8c8c8c',
  }));

  return (
    <div>
      {/* Row 1 — Summary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <StatCard
            title="Tasks Completed"
            value={summary.completedTasks}
            subValue={`${summary.taskCompletionRate}%`}
            subLabel="completion rate"
            icon={<CheckCircleOutlined />}
            color="#52c41a"
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <StatCard
            title="On-Time Rate"
            value={`${summary.taskCompletionRate}`}
            suffix="%"
            subValue={`${summary.overdueTasks}`}
            subLabel="overdue tasks"
            icon={<ClockCircleOutlined />}
            color="#faad14"
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <StatCard
            title="Content Published"
            value={summary.publishedContent}
            subValue={`${summary.contentDeliveryRate}%`}
            subLabel="delivery rate"
            icon={<RocketOutlined />}
            color="#1890ff"
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <StatCard
            title="Avg Revisions"
            value={summary.avgRevisionsPerContent}
            subValue={`${summary.totalRevisions}`}
            subLabel="total revisions"
            icon={<ExperimentOutlined />}
            color="#722ed1"
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <StatCard
            title="Lead Conversion"
            value={`${summary.leadConversionRate}`}
            suffix="%"
            subValue={`${summary.wonLeadsThisPeriod}/${summary.newLeadsThisPeriod}`}
            subLabel="won"
            icon={<TrophyOutlined />}
            color="#eb2f96"
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <StatCard
            title="Active Projects"
            value={summary.activeProjects}
            subValue={`${summary.completedProjects}`}
            subLabel="completed"
            icon={<ProjectOutlined />}
            color="#6C63FF"
          />
        </Col>
      </Row>

      {/* Row 2 — Task Trend + Tasks by Type */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card title="Task Completion Trend" style={{ borderRadius: 12 }}>
            {taskTrendData.length > 0 ? (
              <Column
                data={taskTrendData}
                xField="date"
                yField="count"
                colorField="type"
                group
                autoFit
                height={280}
                style={{ maxWidth: 4 }}
                axis={{
                  x: { title: false, labelAutoRotate: true },
                  y: { title: false },
                }}
                scale={{ color: { range: ['#d9d9d9', '#6C63FF'] } }}
              />
            ) : (
              <Empty description="No task trend data" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Tasks by Type" style={{ borderRadius: 12 }}>
            {data.tasksByType.length > 0 ? (
              <Pie
                data={data.tasksByType}
                angleField="count"
                colorField="type"
                innerRadius={0.6}
                autoFit
                height={280}
                label={{ text: 'count', style: { fontWeight: 600 } }}
                legend={{ color: { position: 'bottom', layout: { justifyContent: 'center' } } }}
              />
            ) : (
              <Empty description="No task data" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Row 3 — Content Trend + Content by Platform */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card title="Content Published Trend" style={{ borderRadius: 12 }}>
            {contentTrendData.length > 0 ? (
              <Area
                data={contentTrendData}
                xField="week"
                yField="count"
                colorField="type"
                autoFit
                height={280}
                style={{ fillOpacity: 0.3 }}
                scale={{ color: { range: ['#d9d9d9', '#6C63FF'] } }}
                axis={{
                  x: { title: false },
                  y: { title: false },
                }}
              />
            ) : (
              <Empty description="No content trend data" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Content by Platform" style={{ borderRadius: 12 }}>
            {data.contentByPlatform.length > 0 ? (
              <Pie
                data={data.contentByPlatform}
                angleField="count"
                colorField="platform"
                innerRadius={0.6}
                autoFit
                height={280}
                label={{ text: 'count', style: { fontWeight: 600 } }}
                legend={{ color: { position: 'bottom', layout: { justifyContent: 'center' } } }}
                scale={{
                  color: {
                    range: ['#ff4d4f', '#eb2f96', '#1890ff', '#722ed1', '#13c2c2', '#52c41a', '#fa8c16'],
                  },
                }}
              />
            ) : (
              <Empty description="No platform data" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Row 4 — Content Pipeline Distribution */}
      <Card title="Content Pipeline Distribution" style={{ borderRadius: 12 }}>
        {stageData.length > 0 ? (
          <Column
            data={stageData}
            xField="stage"
            yField="count"
            colorField="stage"
            autoFit
            height={280}
            scale={{
              color: {
                range: Object.values(STAGE_COLORS),
              },
            }}
            legend={false}
            axis={{
              x: { title: false },
              y: { title: 'Content Items' },
            }}
            style={{ maxWidth: 50, radiusTopLeft: 6, radiusTopRight: 6 }}
          />
        ) : (
          <Empty description="No pipeline data" />
        )}
      </Card>
    </div>
  );
}
