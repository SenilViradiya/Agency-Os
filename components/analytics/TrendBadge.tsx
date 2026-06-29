'use client';

import React from 'react';
import { Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';

interface TrendBadgeProps {
  value: number;
  label?: string;
}

export default function TrendBadge({ value, label }: TrendBadgeProps) {
  if (value === 0 || isNaN(value)) {
    return (
      <Tag color="default" style={{ margin: 0, borderRadius: 6, fontSize: 11 }}>
        <MinusOutlined style={{ marginRight: 2 }} /> No change
      </Tag>
    );
  }

  const isPositive = value > 0;

  return (
    <Tag
      color={isPositive ? 'success' : 'error'}
      style={{ margin: 0, borderRadius: 6, fontSize: 11, fontWeight: 600 }}
    >
      {isPositive ? (
        <ArrowUpOutlined style={{ marginRight: 2 }} />
      ) : (
        <ArrowDownOutlined style={{ marginRight: 2 }} />
      )}
      {Math.abs(value).toFixed(1)}%
      {label && <span style={{ fontWeight: 400, marginLeft: 4 }}>{label}</span>}
    </Tag>
  );
}
