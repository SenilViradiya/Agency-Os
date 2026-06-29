'use client';

import React from 'react';
import { Card, Statistic, Skeleton, Flex, Typography } from 'antd';
import TrendBadge from './TrendBadge';

const { Text } = Typography;

interface StatCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  subValue?: string;
  subLabel?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  color?: string;
}

export default function StatCard({
  title,
  value,
  suffix,
  subValue,
  subLabel,
  trend,
  trendLabel,
  icon,
  loading = false,
  color = '#6C63FF',
}: StatCardProps) {
  return (
    <Card
      styles={{ body: { padding: '20px 24px' } }}
      style={{ borderRadius: 12, height: '100%' }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} />
      ) : (
        <>
          <Flex justify="space-between" align="start">
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                {title}
              </Text>
              <Statistic
                value={value}
                suffix={suffix}
                prefix={icon}
                styles={{
                  content: {
                    color,
                    fontSize: 28,
                    fontWeight: 700,
                    lineHeight: '36px',
                  },
                }}
              />
            </div>
            {trend !== undefined && (
              <TrendBadge value={trend} label={trendLabel} />
            )}
          </Flex>
          {(subValue || subLabel) && (
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
              {subValue && <Text style={{ fontSize: 12, fontWeight: 600 }}>{subValue}</Text>}
              {subLabel && ` ${subLabel}`}
            </Text>
          )}
        </>
      )}
    </Card>
  );
}
