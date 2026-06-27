'use client';

import React from 'react';
import { Modal, Form, Input, Typography, Space, Alert } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;

interface RevisionModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (data: { revisionNotes: string }) => void;
    item: any;
    loading?: boolean;
}

export default function RevisionModal({ open, onClose, onConfirm, item, loading }: RevisionModalProps) {
    const [form] = Form.useForm();

    const handleSubmit = () => {
        form.validateFields().then(values => {
            onConfirm(values);
        });
    };

    return (
        <Modal
            title={<Space><ExclamationCircleOutlined style={{ color: '#ff4d4f' }} /> Request Revision ↩</Space>}
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            confirmLoading={loading}
            okText="Send Revision Request"
            okButtonProps={{ danger: true }}
            destroyOnClose
            width={480}
        >
            <Alert
                message="This will send the content back to the Editing stage."
                type="warning"
                showIcon
                style={{ marginBottom: 20 }}
            />

            <div style={{ marginBottom: 20 }}>
                <Text type="secondary">Reviewing:</Text>
                <div style={{ marginTop: 4 }}>
                    <Text strong style={{ fontSize: 16 }}>{item?.title}</Text>
                </div>
            </div>

            <Form form={form} layout="vertical">
                <Form.Item 
                    label="What needs to be changed?" 
                    name="revisionNotes"
                    rules={[{ required: true, message: 'Please provide revision notes' }]}
                >
                    <TextArea 
                        rows={6} 
                        placeholder="Please re-edit the outro section. The background music is too loud and overlaps with the speaker..." 
                    />
                </Form.Item>
            </Form>

            <Text type="danger" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                * The editor will be notified and a new revision task will be automatically created.
            </Text>
        </Modal>
    );
}
