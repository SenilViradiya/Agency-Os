'use client';

import React, { useState, useEffect } from 'react';
import {
  Row, Col, Empty, Skeleton, Card, Flex, Tag, Typography,
  Progress, Descriptions, Avatar, Alert, Table, Button,
} from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import StatCard from './StatCard';
import apiClient from '@/lib/apiClient';
import { useAnalyticsStore } from '@/store/analyticsStore';
import dayjs from 'dayjs';

const Bar = dynamic(() => import('@ant-design/charts').then((m) => m.Bar), { ssr: false });
const { Text, Title } = Typography;

interface ClientData {
  clientId: string;
  businessName: string;
  tier: string;
  status: string;
  assignedManager: string;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  avgProjectCompletion: number;
  totalContentItems: number;
  publishedContentItems: number;
  pendingContentItems: number;
  contentDeliveryRate: number;
  totalRevisions: number;
  avgRevisionsPerContent: number;
  contractEndDate: string | null;
  daysUntilRenewal: number;
  monthlyRetainerValue: number;
  healthScore: number;
  healthStatus: 'excellent' | 'good' | 'at_risk' | 'critical';
}

interface ClientAnalytics {
  clients: ClientData[];
  deliveryRateByClient: { clientName: string; deliveryRate: number; healthStatus: string }[];
  expiringContracts: {
    clientId: string;
    businessName: string;
    contractEndDate: string;
    daysUntilRenewal: number;
    monthlyRetainerValue: number;
  }[];
}

const healthColors: Record<string, string> = {
  excellent: '#52c41a',
  good: '#1890ff',
  at_risk: '#faad14',
  critical: '#ff4d4f',
};

const tierColors: Record<string, string> = {
  standard: 'default',
  premium: 'gold',
  enterprise: 'purple',
};

export default function ClientHealthTab() {
  const router = useRouter();
  const { dateRange } = useAnalyticsStore();
  const [data, setData] = useState<ClientAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/analytics/client', {
          params: {
            startDate: dateRange[0].toISOString(),
            endDate: dateRange[1].toISOString(),
          },
        });
        if (res.data.success) setData(res.data.data);
      } catch (error) {
        console.error('Failed to fetch client analytics:', error);
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
          {Array.from({ length: 3 }).map((_, i) => (
            <Col xs={24} sm={8} key={i}><Card style={{ borderRadius: 12 }}><Skeleton active paragraph={{ rows: 1 }} /></Card></Col>
          ))}
        </Row>
      </div>
    );
  }

  if (!data || data.clients.length === 0) return <Empty description="No client data available" />;

  const avgHealthScore = Math.round(
    data.clients.reduce((acc, c) => acc + c.healthScore, 0) / data.clients.length
  );

  const barColor = (datum: Record<string, unknown>) => {
    const status = datum.healthStatus as string;
    return healthColors[status] || '#8c8c8c';
  };

  const contractColumns = [
    { title: 'Client', dataIndex: 'businessName', key: 'businessName' },
    {
      title: 'Expiry Date',
      dataIndex: 'contractEndDate',
      key: 'contractEndDate',
      render: (d: string) => d ? dayjs(d).format('DD MMM YYYY') : 'N/A',
    },
    {
      title: 'Days Left',
      dataIndex: 'daysUntilRenewal',
      key: 'daysUntilRenewal',
      render: (d: number) => (
        <Tag color={d <= 0 ? 'error' : d <= 15 ? 'warning' : 'default'}>
          {d <= 0 ? 'EXPIRED' : `${d} days`}
        </Tag>
      ),
    },
    {
      title: 'Monthly Value',
      dataIndex: 'monthlyRetainerValue',
      key: 'monthlyRetainerValue',
      render: (v: number) => `₹${v.toLocaleString('en-IN')}`,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: { clientId: string }) => (
        <Button size="small" type="link" onClick={() => router.push(`/clients/${record.clientId}`)}>
          Schedule Renewal
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Row 1 — Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <StatCard title="Active Clients" value={data.clients.length} color="#6C63FF" />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title="Avg Health Score" value={avgHealthScore} suffix="/100" color={avgHealthScore >= 60 ? '#52c41a' : '#ff4d4f'} />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Expiring Soon"
            value={data.expiringContracts.length}
            color={data.expiringContracts.length > 0 ? '#ff4d4f' : '#52c41a'}
            subLabel="within 30 days"
          />
        </Col>
      </Row>

      {/* Row 2 — Delivery Rate Chart */}
      <Card title="Content Delivery Rate by Client" style={{ borderRadius: 12, marginBottom: 24 }}>
        <Bar
          data={data.deliveryRateByClient}
          xField="clientName"
          yField="deliveryRate"
          autoFit
          height={Math.max(200, data.deliveryRateByClient.length * 50)}
          style={{ fill: barColor, radiusTopRight: 4, radiusBottomRight: 4 }}
          axis={{ x: { title: false }, y: { title: 'Delivery Rate %' } }}
          annotations={[
            {
              type: 'lineY',
              yField: 80,
              style: { stroke: '#ff4d4f', lineDash: [4, 4], lineWidth: 1 },
            },
          ]}
        />
      </Card>

      {/* Row 3 — Client Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {data.clients.map((client) => (
          <Col xs={24} lg={12} key={client.clientId}>
            <Card
              style={{
                borderRadius: 12,
                border: client.daysUntilRenewal <= 0 ? '2px solid #ff4d4f' : '1px solid #f0f0f0',
              }}
              styles={{ body: { padding: '20px 24px' } }}
            >
              {/* Header */}
              <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                <Flex gap={12} align="center">
                  <Avatar size={40} style={{ backgroundColor: healthColors[client.healthStatus], fontWeight: 700 }}>
                    {client.businessName.charAt(0)}
                  </Avatar>
                  <div>
                    <Text strong style={{ fontSize: 16 }}>{client.businessName}</Text>
                    <div>
                      <Tag color={tierColors[client.tier]} style={{ marginTop: 2 }}>
                        {client.tier.toUpperCase()}
                      </Tag>
                    </div>
                  </div>
                </Flex>
                <div style={{ textAlign: 'right' }}>
                  <Title level={3} style={{ margin: 0, color: healthColors[client.healthStatus] }}>
                    {client.healthScore}
                  </Title>
                  <Tag color={healthColors[client.healthStatus]}>
                    {client.healthStatus.replace('_', ' ').toUpperCase()}
                  </Tag>
                </div>
              </Flex>

              {/* Metrics */}
              <Descriptions size="small" column={2} style={{ marginBottom: 12 }}>
                <Descriptions.Item label="Active Projects">{client.activeProjects}</Descriptions.Item>
                <Descriptions.Item label="Content Delivery">{client.contentDeliveryRate}%</Descriptions.Item>
                <Descriptions.Item label="Avg Revisions">{client.avgRevisionsPerContent}</Descriptions.Item>
                <Descriptions.Item label="Project Completion">{client.avgProjectCompletion}%</Descriptions.Item>
              </Descriptions>

              {/* Progress */}
              <div style={{ marginBottom: 12 }}>
                <Flex justify="space-between" style={{ marginBottom: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Health Score</Text>
                  <Text style={{ fontSize: 12, fontWeight: 600 }}>{client.healthScore}%</Text>
                </Flex>
                <Progress percent={client.healthScore} showInfo={false} strokeColor={healthColors[client.healthStatus]} size="small" />
                <Flex justify="space-between" style={{ marginBottom: 4, marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Content Delivery</Text>
                  <Text style={{ fontSize: 12, fontWeight: 600 }}>{client.contentDeliveryRate}%</Text>
                </Flex>
                <Progress percent={client.contentDeliveryRate} showInfo={false} strokeColor="#1890ff" size="small" />
              </div>

              {/* Contract */}
              <div style={{ backgroundColor: '#fafafa', padding: '10px 14px', borderRadius: 8, marginTop: 8 }}>
                <Flex justify="space-between" align="center">
                  <div>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Contract ends</Text>
                    <Text style={{ fontSize: 13 }}>
                      {client.contractEndDate ? dayjs(client.contractEndDate).format('DD MMM YYYY') : 'Not set'}
                    </Text>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {client.daysUntilRenewal <= 0 ? (
                      <Tag color="error">EXPIRED</Tag>
                    ) : client.daysUntilRenewal <= 30 ? (
                      <Tag color="warning"><WarningOutlined /> Expires in {client.daysUntilRenewal} days</Tag>
                    ) : null}
                    <Text style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                      ₹{client.monthlyRetainerValue.toLocaleString('en-IN')}/mo
                    </Text>
                  </div>
                </Flex>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Row 4 — Expiring Contracts Alert */}
      {data.expiringContracts.length > 0 && (
        <Alert
          type="warning"
          title="Contracts Expiring Soon"
          description={
            <Table
              dataSource={data.expiringContracts}
              columns={contractColumns}
              rowKey="clientId"
              pagination={false}
              size="small"
              style={{ marginTop: 12 }}
            />
          }
          showIcon
          icon={<WarningOutlined />}
          style={{ borderRadius: 12 }}
        />
      )}
    </div>
  );
}
