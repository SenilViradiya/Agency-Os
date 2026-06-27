'use client';

import { useEffect } from 'react';
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
    Col 
} from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import UserSelect from '@/components/shared/UserSelect';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface LeadDrawerProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: any) => void;
    initialData?: any;
    loading?: boolean;
}

const SOURCES = ['whatsapp', 'referral', 'cold_email', 'cold_call', 'instagram', 'website', 'other'];
const SERVICES = ['YouTube Management', 'Reels', 'Shorts', 'Meta Ads', 'Google Ads', 'Graphic Design', 'Video Editing', 'SEO', 'Website Development'];
const PRIORITIES = ['low', 'medium', 'high'];

export default function LeadDrawer({ open, onClose, onSubmit, initialData, loading }: LeadDrawerProps) {
    const [form] = Form.useForm();

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.setFieldsValue({
                    ...initialData,
                    followUpDate: initialData.followUpDate ? dayjs(initialData.followUpDate) : null,
                    assignedTo: typeof initialData.assignedTo === 'object' ? initialData.assignedTo._id : initialData.assignedTo,
                });
            } else {
                form.resetFields();
                form.setFieldsValue({
                    source: 'whatsapp',
                    priority: 'medium',
                    budget: 0,
                    services: [],
                });
            }
        }
    }, [initialData, open, form]);

    const onFinish = (values: any) => {
        onSubmit({
            ...values,
            followUpDate: values.followUpDate ? values.followUpDate.toDate() : null,
        });
    };

    return (
        <Drawer
            title={initialData ? 'Edit Lead' : 'Add New Lead'}
            placement="right"
            onClose={onClose}
            open={open}
            size="default"
            extra={
                <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
            }
            footer={
                <div style={{ textAlign: 'right', padding: '10px 0' }}>
                    <Space>
                        <Button onClick={onClose} disabled={loading}>Cancel</Button>
                        <Button 
                            type="primary" 
                            onClick={() => form.submit()} 
                            loading={loading}
                        >
                            {initialData ? 'Update Lead' : 'Create Lead'}
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
                <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ color: '#6C63FF', textTransform: 'uppercase', fontSize: 12 }}>
                        1. Contact Information
                    </Text>
                    <Divider style={{ margin: '8px 0 16px 0' }} />
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item
                                name="name"
                                label="Contact Name"
                                rules={[{ required: true, message: 'Please enter contact name' }]}
                            >
                                <Input placeholder="e.g. John Doe" />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name="businessName"
                                label="Business Name"
                                rules={[{ required: true, message: 'Please enter business name' }]}
                            >
                                <Input placeholder="e.g. Acme Corp" />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name="email"
                                label="Email Address"
                                rules={[
                                    { required: true, message: 'Please enter email' },
                                    { type: 'email', message: 'Please enter a valid email' }
                                ]}
                            >
                                <Input placeholder="john@example.com" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="phone"
                                label="Phone Number"
                                rules={[{ required: true, message: 'Please enter phone number' }]}
                            >
                                <Input placeholder="10-digit number" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="whatsappNumber"
                                label="WhatsApp (Optional)"
                            >
                                <Input placeholder="WhatsApp number" />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ color: '#6C63FF', textTransform: 'uppercase', fontSize: 12 }}>
                        2. Lead Information
                    </Text>
                    <Divider style={{ margin: '8px 0 16px 0' }} />
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="source"
                                label="Source"
                                rules={[{ required: true }]}
                            >
                                <Select>
                                    {SOURCES.map(s => (
                                        <Option key={s} value={s}>{s.replace('_', ' ')}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.source !== curr.source}>
                            {({ getFieldValue }) => (
                                <Col span={12}>
                                    <Form.Item
                                        name="referredBy"
                                        label="Referred By"
                                    >
                                        <Input disabled={getFieldValue('source') !== 'referral'} placeholder="Referrer name" />
                                    </Form.Item>
                                </Col>
                            )}
                        </Form.Item>
                        <Col span={12}>
                            <Form.Item name="industry" label="Industry">
                                <Input placeholder="e.g. Real Estate" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="budget" label="Budget (₹)">
                                <InputNumber style={{ width: '100%' }} min={0} formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="services" label="Services">
                                <Select mode="multiple" placeholder="Select services">
                                    {SERVICES.map(s => (
                                        <Option key={s} value={s}>{s}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="priority" label="Priority">
                                <Select>
                                    {PRIORITIES.map(p => (
                                        <Option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                                <Select>
                                    <Option value="new">New</Option>
                                    <Option value="contacted">Contacted</Option>
                                    <Option value="qualified">Qualified</Option>
                                    <Option value="proposal_sent">Proposal Sent</Option>
                                    <Option value="negotiation">Negotiation</Option>
                                    <Option value="won">Won</Option>
                                    <Option value="lost">Lost</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.status !== curr.status}>
                            {({ getFieldValue }) => getFieldValue('status') === 'lost' && (
                                <Col span={24}>
                                    <Form.Item name="lostReason" label="Reason for Loss">
                                        <TextArea rows={2} placeholder="Why was this lead lost?" />
                                    </Form.Item>
                                </Col>
                            )}
                        </Form.Item>
                    </Row>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ color: '#6C63FF', textTransform: 'uppercase', fontSize: 12 }}>
                        3. Assignment & Follow-up
                    </Text>
                    <Divider style={{ margin: '8px 0 16px 0' }} />
                    <Row gutter={16}>
                        <Col span={24} style={{ marginBottom: 24 }}>
                            <Form.Item
                                name="assignedTo"
                                rules={[{ required: true, message: 'Please assign to a user' }]}
                            >
                                <UserSelect 
                                    label="Assign To" 
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="followUpDate" label="Next Follow-up">
                                <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>

                <div>
                    <Text strong style={{ color: '#6C63FF', textTransform: 'uppercase', fontSize: 12 }}>
                        4. Additional Notes
                    </Text>
                    <Divider style={{ margin: '8px 0 16px 0' }} />
                    <Form.Item name="notes" label="Notes">
                        <TextArea rows={4} placeholder="Any specific requirements or context..." />
                    </Form.Item>
                </div>
            </Form>
        </Drawer>
    );
}
