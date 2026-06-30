'use client';

import React from 'react';
import { Flex, Typography, Tabs } from 'antd';
import {
  BarChartOutlined,
  TeamOutlined,
  FileTextOutlined,
  HeartOutlined,
} from '@ant-design/icons';
import DateRangeFilter from '@/components/analytics/DateRangeFilter';
import OverviewTab from '@/components/analytics/OverviewTab';
import TeamProductivityTab from '@/components/analytics/TeamProductivityTab';
import ContentPerformanceTab from '@/components/analytics/ContentPerformanceTab';
import ClientHealthTab from '@/components/analytics/ClientHealthTab';
import { useAnalyticsStore } from '@/store/analyticsStore';

const { Title } = Typography;

const tabItems = [
  {
    key: 'overview',
    label: (
      <span><BarChartOutlined style={{ marginRight: 6 }} />Overview</span>
    ),
    children: <OverviewTab />,
  },
  {
    key: 'team',
    label: (
      <span><TeamOutlined style={{ marginRight: 6 }} />Team Productivity</span>
    ),
    children: <TeamProductivityTab />,
  },
  {
    key: 'content',
    label: (
      <span><FileTextOutlined style={{ marginRight: 6 }} />Content Performance</span>
    ),
    children: <ContentPerformanceTab />,
  },
  {
    key: 'client',
    label: (
      <span><HeartOutlined style={{ marginRight: 6 }} />Client Health</span>
    ),
    children: <ClientHealthTab />,
  },
];

export default function AnalyticsPage() {
  const { dateRange, setDateRange, activeTab, setActiveTab } = useAnalyticsStore();

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Top Bar */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap" gap={12}>
        <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
          📊 Analytics
        </Title>
        <DateRangeFilter
          defaultValue={[dateRange[0], dateRange[1]]}
          onChange={(dates) => setDateRange(dates)}
        />
      </Flex>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
        style={{ marginTop: -8 }}
      />
    </div>
  );
}
