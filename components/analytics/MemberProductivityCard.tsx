'use client';

import React from 'react';
import { Card, Flex, Avatar, Tag, Progress, Typography, Tooltip, Divider, Statistic } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';

const Area = dynamic(() => import('@ant-design/charts').then((m) => m.Area), { ssr: false });
const { Text } = Typography;

interface MemberData {
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
}

interface MemberProductivityCardProps {
  member: MemberData;
}

const getProgressColor = (value: number) => {
  if (value >= 80) return '#52c41a';
  if (value >= 60) return '#faad14';
  return '#ff4d4f';
};

const getHealthDot = (rate: number) => {
  const color = rate >= 80 ? '#52c41a' : rate >= 60 ? '#faad14' : '#ff4d4f';
  return (
    <Tooltip title={`On-time: ${rate}%`}>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: color,
          display: 'inline-block',
          marginLeft: 8,
        }}
      />
    </Tooltip>
  );
};

export default function MemberProductivityCard({ member }: MemberProductivityCardProps) {
  return (
    <Card
      style={{ borderRadius: 12, height: '100%' }}
      styles={{ body: { padding: '20px 24px' } }}
    >
      {/* Header */}
      <Flex align="center" gap={12} style={{ marginBottom: 16 }}>
        <Avatar size={48} src={member.avatar || undefined}>
          {member.name.charAt(0)}
        </Avatar>
        <div style={{ flex: 1 }}>
          <Flex align="center" gap={8}>
            <Text strong style={{ fontSize: 16 }}>{member.name}</Text>
            {getHealthDot(member.onTimeDeliveryRate)}
          </Flex>
          <Tag color="blue" style={{ marginTop: 2 }}>{member.role}</Tag>
        </div>
      </Flex>

      {/* Stats Row */}
      <Flex gap={16} style={{ marginBottom: 16 }} wrap="wrap">
        <Statistic
          title="Assigned"
          value={member.tasksAssigned}
          styles={{ content: { fontSize: 20, fontWeight: 700 } }}
        />
        <Statistic
          title="Completed"
          value={member.tasksCompleted}
          styles={{ content: { fontSize: 20, fontWeight: 700, color: '#52c41a' } }}
        />
        <Statistic
          title="Overdue"
          value={member.tasksOverdue}
          styles={{
            content: {
              fontSize: 20,
              fontWeight: 700,
              color: member.tasksOverdue > 0 ? '#ff4d4f' : '#8c8c8c',
            },
          }}
        />
        <Statistic
          title="On-Time"
          value={member.onTimeDeliveryRate}
          suffix="%"
          styles={{
            content: {
              fontSize: 20,
              fontWeight: 700,
              color: getProgressColor(member.onTimeDeliveryRate),
            },
          }}
        />
      </Flex>

      {/* Progress Bars */}
      <div style={{ marginBottom: 16 }}>
        <Flex justify="space-between" style={{ marginBottom: 4 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Task Completion</Text>
          <Text style={{ fontSize: 12, fontWeight: 600 }}>{member.taskCompletionRate}%</Text>
        </Flex>
        <Progress
          percent={member.taskCompletionRate}
          showInfo={false}
          strokeColor={getProgressColor(member.taskCompletionRate)}
          size="small"
        />

        <Flex justify="space-between" style={{ marginBottom: 4, marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>On-Time Delivery</Text>
          <Text style={{ fontSize: 12, fontWeight: 600 }}>{member.onTimeDeliveryRate}%</Text>
        </Flex>
        <Progress
          percent={member.onTimeDeliveryRate}
          showInfo={false}
          strokeColor={getProgressColor(member.onTimeDeliveryRate)}
          size="small"
        />

        <Flex justify="space-between" style={{ marginBottom: 4, marginTop: 8 }}>
          <Tooltip title="Content approved without revision">
            <Text type="secondary" style={{ fontSize: 12 }}>First Pass Approval</Text>
          </Tooltip>
          <Text style={{ fontSize: 12, fontWeight: 600 }}>{member.approvalFirstPassRate}%</Text>
        </Flex>
        <Progress
          percent={member.approvalFirstPassRate}
          showInfo={false}
          strokeColor={getProgressColor(member.approvalFirstPassRate)}
          size="small"
        />
      </div>

      {/* Content stats */}
      <Flex gap={24} style={{ marginBottom: 12 }}>
        <div>
          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Content Owned</Text>
          <Text strong>{member.contentItemsOwned}</Text>
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Delivered</Text>
          <Text strong style={{ color: '#52c41a' }}>{member.contentItemsDelivered}</Text>
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Revision Rate</Text>
          <Text strong style={{ color: member.contentRevisionRate > 30 ? '#ff4d4f' : undefined }}>
            {member.contentRevisionRate}%
          </Text>
        </div>
      </Flex>

      {/* Mini sparkline */}
      {member.weeklyTaskCompletion.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>Last 4 Weeks</Text>
          <Area
            data={member.weeklyTaskCompletion}
            xField="week"
            yField="completed"
            autoFit
            height={60}
            axis={false}
            style={{ fill: 'linear-gradient(90deg, #6C63FF22, #6C63FF88)', lineWidth: 2, stroke: '#6C63FF' }}
            interaction={{ tooltip: false }}
          />
        </div>
      )}

      <Divider style={{ margin: '8px 0' }} />

      {/* Footer */}
      <Flex align="center" gap={8}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          Total revisions sent back: {member.totalRevisionsSent}
        </Text>
        {member.totalRevisionsSent > 3 && (
          <Tag color="warning" style={{ margin: 0, fontSize: 10 }}>
            <WarningOutlined /> High revision rate
          </Tag>
        )}
      </Flex>
    </Card>
  );
}
