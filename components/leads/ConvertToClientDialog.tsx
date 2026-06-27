'use client';

import { 
    Modal, 
    Form, 
    Input, 
    InputNumber, 
    Select, 
    DatePicker, 
    Typography, 
    Divider, 
    Row, 
    Col 
} from 'antd';
import dayjs from 'dayjs';
import UserSelect from '@/components/shared/UserSelect';

const { Text, Title } = Typography;
const { Option } = Select;

interface ConvertToClientDialogProps {
    open: boolean;
    onClose: () => void;
    onConvert: (values: any) => void;
    lead: any;
    loading: boolean;
}

export default function ConvertToClientDialog({ open, onClose, onConvert, lead, loading }: ConvertToClientDialogProps) {
    const [form] = Form.useForm();

    const handleOk = () => {
        form.submit();
    };

    const onFinish = (values: any) => {
        onConvert({
            ...values,
            contractStartDate: values.contractStartDate ? values.contractStartDate.toDate() : null,
            contractEndDate: values.contractEndDate ? values.contractEndDate.toDate() : null,
        });
    };

    if (!lead) return null;

    return (
        <Modal
            title={<Title level={4} style={{ margin: 0, textAlign: 'center' }}>Convert Lead to Client 🎉</Title>}
            open={open}
            onCancel={onClose}
            onOk={handleOk}
            confirmLoading={loading}
            okText="Convert & Create Client"
            width={600}
        >
            <div style={{ backgroundColor: '#f5f5f5', padding: '16px 24px', borderRadius: 12, marginBottom: 24, marginTop: 16 }}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Business Name</Text>
                        <Text strong style={{ fontSize: 15 }}>{lead.businessName}</Text>
                    </Col>
                    <Col span={12}>
                        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Contact Person</Text>
                        <Text strong style={{ fontSize: 15 }}>{lead.name}</Text>
                    </Col>
                </Row>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                    monthlyRetainerValue: lead?.budget || 0,
                    tier: 'standard',
                    assignedManager: lead?.assignedTo?._id || lead?.assignedTo || '',
                    assignedTeam: [],
                }}
            >
                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item 
                            name="monthlyRetainerValue" 
                            label="Monthly Retainer Value (₹)"
                            rules={[{ required: true }]}
                        >
                            <InputNumber 
                                style={{ width: '100%' }} 
                                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item name="tier" label="Client Tier" rules={[{ required: true }]}>
                            <Select>
                                <Option value="standard">Standard</Option>
                                <Option value="premium">Premium</Option>
                                <Option value="enterprise">Enterprise</Option>
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
                    <Col span={24} style={{ marginBottom: 24 }}>
                        <Form.Item name="assignedManager" rules={[{ required: true, message: 'Manager is required' }]}>
                                <UserSelect label="Assigned Manager" />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item name="assignedTeam">
                                <UserSelect multiple label="Project Team Members" />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
}
