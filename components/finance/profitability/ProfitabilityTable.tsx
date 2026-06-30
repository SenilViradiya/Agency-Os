'use client';

import React from 'react';
import { Table, Tag, Typography, Progress } from 'antd';

const { Text } = Typography;

interface ProfitabilityTableProps {
  data: any[];
  loading: boolean;
}

export default function ProfitabilityTable({ data, loading }: ProfitabilityTableProps) {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Premium': return 'gold';
      case 'Standard': return 'blue';
      case 'Basic': return 'gray';
      default: return 'default';
    }
  };

  const getMarginTag = (margin: number) => {
    let color = 'red';
    if (margin >= 40) color = 'green';
    else if (margin >= 20) color = 'orange';
    
    return (
      <Tag color={color} style={{ borderRadius: 6, fontWeight: 700 }}>
        {margin.toFixed(1)}%
      </Tag>
    );
  };

  const columns = [
    {
      title: 'Business Name',
      dataIndex: 'businessName',
      key: 'businessName',
      render: (text: string, record: any) => (
        <div>
          <Text strong>{text}</Text>
          {record.tier && (
            <div style={{ marginTop: 2 }}>
              <Tag color={getTierColor(record.tier)} style={{ fontSize: 10, lineHeight: '14px', height: 'auto', borderRadius: 4 }}>
                {record.tier.toUpperCase()}
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Revenue Collected',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right' as const,
      sorter: (a: any, b: any) => a.revenue - b.revenue,
      render: (val: number) => <Text strong>₹{val.toLocaleString('en-IN')}</Text>,
    },
    {
      title: 'Direct Expenses',
      dataIndex: 'directExpenses',
      key: 'directExpenses',
      align: 'right' as const,
      render: (val: number) => <Text type="secondary">₹{val.toLocaleString('en-IN')}</Text>,
    },
    {
      title: 'Vendor Subcontract Costs',
      dataIndex: 'vendorCosts',
      key: 'vendorCosts',
      align: 'right' as const,
      render: (val: number) => <Text type="secondary">₹{val.toLocaleString('en-IN')}</Text>,
    },
    {
      title: 'Total Costs',
      dataIndex: 'totalCost',
      key: 'totalCost',
      align: 'right' as const,
      sorter: (a: any, b: any) => a.totalCost - b.totalCost,
      render: (val: number) => <Text strong type="danger">₹{val.toLocaleString('en-IN')}</Text>,
    },
    {
      title: 'Net Profit',
      dataIndex: 'netProfit',
      key: 'netProfit',
      align: 'right' as const,
      sorter: (a: any, b: any) => a.netProfit - b.netProfit,
      render: (val: number) => {
        const isLoss = val < 0;
        return (
          <Text strong style={{ color: isLoss ? '#ff4d4f' : '#52c41a' }}>
            {isLoss ? '-' : ''}₹{Math.abs(val).toLocaleString('en-IN')}
          </Text>
        );
      },
    },
    {
      title: 'Invoices Sent / Paid',
      key: 'invoices',
      align: 'center' as const,
      render: (_: any, record: any) => (
        <Text style={{ fontSize: 13 }}>
          {record.invoicesPaid} / {record.invoicesSent}
        </Text>
      ),
    },
    {
      title: 'Profit Margin',
      dataIndex: 'profitMargin',
      key: 'profitMargin',
      align: 'right' as const,
      sorter: (a: any, b: any) => a.profitMargin - b.profitMargin,
      render: (val: number, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
          <div style={{ width: 60 }} className="no-print">
            <Progress 
              percent={Math.max(0, Math.min(100, Math.round(val)))} 
              size="small" 
              showInfo={false} 
              status={val < 20 ? 'exception' : 'normal'}
              strokeColor={val >= 40 ? '#52c41a' : val >= 20 ? '#faad14' : '#ff4d4f'}
            />
          </div>
          {getMarginTag(val)}
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="clientId"
      loading={loading}
      pagination={false}
      style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
      }}
    />
  );
}
