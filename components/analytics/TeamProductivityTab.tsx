'use client';

import React, { useState, useEffect } from 'react';
import { Row, Col, Empty, Skeleton, Card } from 'antd';
import dynamic from 'next/dynamic';
import MemberProductivityCard from './MemberProductivityCard';
import apiClient from '@/lib/apiClient';
import { useAnalyticsStore } from '@/store/analyticsStore';

const Bar = dynamic(() => import('@ant-design/charts').then((m) => m.Bar), { ssr: false });

interface TeamData {
  members: Array<{
    userId: string;
    name: string;
    avatar: string;
    role: string;
    tasksAssigned: number;
    tasksCompleted: number;
    tasksInProgress: number;
    tasksOverdue: number;
    taskCompletionRate: number;
    tasksCompletedOnTime: number;
    tasksCompletedLate: number;
    onTimeDeliveryRate: number;
    contentItemsOwned: number;
    contentItemsDelivered: number;
    contentRevisionRate: number;
    approvalFirstPassRate: number;
    totalRevisionsSent: number;
    weeklyTaskCompletion: { week: string; completed: number }[];
  }>;
  teamComparison: Array<{
    name: string;
    tasksCompleted: number;
    onTimeRate: number;
    contentDelivered: number;
  }>;
}

export default function TeamProductivityTab() {
  const { dateRange } = useAnalyticsStore();
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/analytics/team', {
          params: {
            startDate: dateRange[0].toISOString(),
            endDate: dateRange[1].toISOString(),
          },
        });
        if (res.data.success) setData(res.data.data);
      } catch (error) {
        console.error('Failed to fetch team analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  if (loading) {
    return (
      <div>
        <Card style={{ borderRadius: 12, marginBottom: 24 }}><Skeleton active /></Card>
        <Row gutter={[16, 16]}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Col xs={24} lg={12} key={i}><Card style={{ borderRadius: 12 }}><Skeleton active paragraph={{ rows: 6 }} /></Card></Col>
          ))}
        </Row>
      </div>
    );
  }

  if (!data || data.members.length === 0) return <Empty description="No team data available" />;

  const barColor = (datum: Record<string, unknown>) => {
    const rate = datum.onTimeRate as number;
    if (rate >= 80) return '#52c41a';
    if (rate >= 60) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <div>
      {/* Team Comparison Bar Chart */}
      <Card title="Team Comparison — Tasks Completed" style={{ borderRadius: 12, marginBottom: 24 }}>
        <Bar
          data={data.teamComparison}
          xField="name"
          yField="tasksCompleted"
          autoFit
          height={Math.max(200, data.teamComparison.length * 50)}
          style={{ fill: barColor, radiusTopRight: 4, radiusBottomRight: 4 }}
          axis={{
            x: { title: false },
            y: { title: 'Tasks Completed' },
          }}
          tooltip={{
            items: [
              { field: 'tasksCompleted', name: 'Tasks Completed' },
              { field: 'onTimeRate', name: 'On-Time Rate', valueFormatter: (v: number) => `${v}%` },
              { field: 'contentDelivered', name: 'Content Delivered' },
            ],
          }}
        />
      </Card>

      {/* Member Cards */}
      <Row gutter={[16, 16]}>
        {data.members.map((member) => (
          <Col xs={24} lg={12} key={member.userId}>
            <MemberProductivityCard member={member} />
          </Col>
        ))}
      </Row>
    </div>
  );
}
