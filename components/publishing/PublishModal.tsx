'use client';

import React, { useState } from 'react';
import { 
    Modal, 
    Form, 
    Input, 
    Select, 
    DatePicker, 
    TimePicker, 
    Switch, 
    Button, 
    Space, 
    Typography, 
    Divider,
    Flex,
    App,
    Tag,
    Row,
    Col
} from 'antd';
import { 
    PlusOutlined, 
    MinusCircleOutlined, 
    RocketOutlined, 
    GlobalOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface PublishModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (data: any) => void;
    item: any;
    loading?: boolean;
}

const PLATFORMS = [
    'YouTube', 'Instagram', 'LinkedIn', 'Twitter', 'Facebook', 'TikTok', 'Blog', 'Other'
];

export default function PublishModal({ open, onClose, onConfirm, item, loading }: PublishModalProps) {
    const [form] = Form.useForm();
    const [showCrossPosting, setShowCrossPosting] = useState(false);

    if (!item) return null;

    const handleSubmit = () => {
        form.validateFields().then(values => {
            // Combine date and time
            const publishedAt = values.publishedAt.toDate();
            const time = values.publishedTime.toDate();
            publishedAt.setHours(time.getHours());
            publishedAt.setMinutes(time.getMinutes());

            onConfirm({
                publishedUrl: values.publishedUrl,
                platform: values.platform,
                publishedAt,
                publishNotes: values.publishNotes,
                additionalPlatforms: values.additionalPlatforms
            });
        });
    };

    return (
        <Modal
            title={<Space><RocketOutlined style={{ color: '#6C63FF' }} /> Log Published Content 🚀</Space>}
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            confirmLoading={loading}
            okText="Confirm Published ✓"
            okButtonProps={{ style: { backgroundColor: '#52c41a', borderColor: '#52c41a' } }}
            destroyOnClose
            width={580}
        >
            <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>LOGGING PUBLISH FOR:</Text>
                <div style={{ marginTop: 4 }}>
                    <Text strong style={{ fontSize: 18 }}>{item.title}</Text>
                    <div style={{ marginTop: 4 }}>
                        <Tag color="blue">{item.contentNumber}</Tag>
                        <Tag>{item.projectId?.name}</Tag>
                    </div>
                </div>
            </div>

            <Form 
                form={form} 
                layout="vertical"
                initialValues={{ 
                    platform: item.platforms[0] || 'YouTube',
                    publishedAt: dayjs(),
                    publishedTime: dayjs()
                }}
            >
                <Row gutter={16}>
                    <Col span={16}>
                        <Form.Item 
                            label="Published URL" 
                            name="publishedUrl"
                            rules={[
                                { required: true, message: 'URL is required' },
                                { type: 'url', message: 'Please enter a valid URL' }
                            ]}
                        >
                            <Input prefix={<GlobalOutlined />} placeholder="https://www.youtube.com/watch?v=..." size="large" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item 
                            label="Primary Platform" 
                            name="platform"
                            rules={[{ required: true }]}
                        >
                            <Select size="large">
                                {PLATFORMS.map(p => <Option key={p} value={p}>{p}</Option>)}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Published Date" name="publishedAt" rules={[{ required: true }]}>
                            <DatePicker style={{ width: '100%' }} size="large" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Published Time" name="publishedTime" rules={[{ required: true }]}>
                            <TimePicker style={{ width: '100%' }} format="HH:mm" size="large" />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item label="Publish Notes (Internal)" name="publishNotes">
                    <TextArea rows={3} placeholder="Add any details about the post results or platform-specific notes..." />
                </Form.Item>

                <Divider style={{ margin: '12px 0' }} />

                <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                    <Text strong>Cross-posted to other platforms?</Text>
                    <Switch checked={showCrossPosting} onChange={setShowCrossPosting} />
                </Flex>

                {showCrossPosting && (
                    <Form.List name="additionalPlatforms">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'platform']}
                                            rules={[{ required: true, message: 'Platform required' }]}
                                        >
                                            <Select placeholder="Platform" style={{ width: 120 }}>
                                                {PLATFORMS.map(p => <Option key={p} value={p}>{p}</Option>)}
                                            </Select>
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'url']}
                                            rules={[
                                                { required: true, message: 'URL required' },
                                                { type: 'url', message: 'Invalid URL' }
                                            ]}
                                        >
                                            <Input placeholder="Post URL" style={{ width: 280 }} />
                                        </Form.Item>
                                        <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f' }} />
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        Add Platform
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                )}
            </Form>
        </Modal>
    );
}


