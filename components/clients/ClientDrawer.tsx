'use client';

import { useEffect, useState } from 'react';
import { 
    Drawer, 
    Form, 
    Input, 
    Button, 
    Select, 
    DatePicker, 
    InputNumber, 
    Space, 
    Typography, 
    Divider, 
    Row, 
    Col,
    Tabs
} from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import UserSelect from '@/components/shared/UserSelect';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface ClientDrawerProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: any) => void;
    initialData?: any;
    loading?: boolean;
}

const SERVICES = ['YouTube Management', 'Reels', 'Shorts', 'Meta Ads', 'Google Ads', 'Graphic Design', 'Video Editing', 'SEO', 'Website Development'];
const TIERS = ['standard', 'premium', 'enterprise'];
const STATUSES = ['active', 'inactive', 'churned', 'on_hold'];

export default function ClientDrawer({ open, onClose, onSubmit, initialData, loading }: ClientDrawerProps) {
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState('1');

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.setFieldsValue({
                    ...initialData,
                    contractStartDate: initialData.contractStartDate ? dayjs(initialData.contractStartDate) : null,
                    contractEndDate: initialData.contractEndDate ? dayjs(initialData.contractEndDate) : null,
                    assignedManager: typeof initialData.assignedManager === 'object' ? initialData.assignedManager._id : initialData.assignedManager,
                    assignedTeam: initialData.assignedTeam?.map((t: any) => typeof t === 'object' ? t._id : t) || [],
                });
            } else {
                form.resetFields();
                form.setFieldsValue({
                    status: 'active',
                    tier: 'standard',
                    services: [],
                    monthlyRetainerValue: 0,
                    address: { country: 'India' },
                });
            }
            setActiveTab('1');
        }
    }, [initialData, open, form]);

    const onFinish = (values: any) => {
        onSubmit({
            ...values,
            contractStartDate: values.contractStartDate ? values.contractStartDate.toDate() : null,
            contractEndDate: values.contractEndDate ? values.contractEndDate.toDate() : null,
        });
    };

    const tabItems = [
        {
            key: '1',
            label: 'Basic Info',
            children: (
                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item name="businessName" label="Business Name" rules={[{ required: true }]}>
                            <Input placeholder="Acme Corp" />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item name="contactPerson" label="Contact Person" rules={[{ required: true }]}>
                            <Input placeholder="John Doe" />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                            <Input placeholder="john@example.com" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
                            <Input placeholder="10-digit number" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="whatsappNumber" label="WhatsApp">
                            <Input placeholder="WhatsApp number" />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item name="website" label="Website / Linktree">
                            <Input placeholder="https://..." />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                            <Select>
                                {STATUSES.map(s => <Option key={s} value={s}>{s.replace('_', ' ')}</Option>)}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
            )
        },
        {
            key: '2',
            label: 'Contract',
            children: (
                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item name="tier" label="Tier" rules={[{ required: true }]}>
                            <Select>
                                {TIERS.map(t => <Option key={t} value={t}>{t}</Option>)}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item name="monthlyRetainerValue" label="Monthly Retainer (₹)">
                            <InputNumber style={{ width: '100%' }} min={0} formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item name="services" label="Services">
                            <Select mode="multiple">
                                {SERVICES.map(s => <Option key={s} value={s}>{s}</Option>)}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="contractStartDate" label="Contract Start">
                            <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="contractEndDate" label="Contract End">
                            <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
                        </Form.Item>
                    </Col>
                </Row>
            )
        },
        {
            key: '3',
            label: 'Social',
            children: (
                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item name={['socialHandles', 'instagram']} label="Instagram URL">
                            <Input placeholder="https://instagram.com/..." />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item name={['socialHandles', 'youtube']} label="YouTube Channel URL">
                            <Input placeholder="https://youtube.com/..." />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item name={['socialHandles', 'linkedin']} label="LinkedIn URL">
                            <Input placeholder="https://linkedin.com/in/..." />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item name={['socialHandles', 'twitter']} label="Twitter / X URL">
                            <Input placeholder="https://x.com/..." />
                        </Form.Item>
                    </Col>
                </Row>
            )
        },
        {
            key: '4',
            label: 'Team',
            children: (
                <Row gutter={16}>
                    <Col span={24} style={{ marginBottom: 24 }}>
                        <Form.Item name="assignedManager" rules={[{ required: true }]}>
                            <UserSelect 
                                label="Assigned Manager" 
                            />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item name="assignedTeam">
                            <UserSelect 
                                multiple 
                                label="Team Members" 
                            />
                        </Form.Item>
                    </Col>
                </Row>
            )
        },
        {
            key: '5',
            label: 'Address',
            children: (
                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item name={['address', 'street']} label="Street Address">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name={['address', 'city']} label="City">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name={['address', 'state']} label="State">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name={['address', 'pincode']} label="Pincode">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name={['address', 'country']} label="Country">
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>
            )
        }
    ];

    return (
        <Drawer
            title={initialData ? 'Edit Client' : 'Add New Client'}
            placement="right"
            onClose={onClose}
            open={open}
            size="large"
            extra={<Button type="text" icon={<CloseOutlined />} onClick={onClose} />}
            footer={
                <div style={{ textAlign: 'right', padding: '10px 0' }}>
                    <Space>
                        <Button onClick={onClose} disabled={loading}>Cancel</Button>
                        <Button type="primary" onClick={() => form.submit()} loading={loading}>
                            {initialData ? 'Update Client' : 'Create Client'}
                        </Button>
                    </Space>
                </div>
            }
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                requiredMark="optional"
            >
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
            </Form>
        </Drawer>
    );
}
