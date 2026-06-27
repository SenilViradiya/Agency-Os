'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Checkbox, Typography, Space, Alert } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;

interface ApprovalModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (data: { approvalNotes: string, readyToPublish: boolean }) => void;
    item: any;
    loading?: boolean;
}

export default function ApprovalModal({ open, onClose, onConfirm, item, loading }: ApprovalModalProps) {
    const [form] = Form.useForm();

    const handleSubmit = () => {
        form.validateFields().then(values => {
            onConfirm(values);
        });
    };

    return (
        <Modal
            title={<Space><CheckCircleOutlined style={{ color: '#52c41a' }} /> Approve Content ✓</Space>}
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            confirmLoading={loading}
            okText="Confirm Approval →"
            okButtonProps={{ style: { backgroundColor: '#52c41a', borderColor: '#52c41a' } }}
            destroyOnClose
            width={480}
        >
            <div style={{ marginBottom: 20 }}>
                <Text type="secondary">Approving:</Text>
                <div style={{ marginTop: 4 }}>
                    <Text strong style={{ fontSize: 16 }}>{item?.title}</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>({item?.contentNumber})</Text>
                </div>
            </div>

            <Form 
                form={form} 
                layout="vertical" 
                initialValues={{ readyToPublish: true }}
            >
                <Form.Item label="Approval notes (optional)" name="approvalNotes">
                    <TextArea 
                        rows={4} 
                        placeholder="Great work! The quality is top-notch. Ready to publish." 
                    />
                </Form.Item>
                <Form.Item name="readyToPublish" valuePropName="checked">
                    <Checkbox>Mark as ready to publish immediately</Checkbox>
                </Form.Item>
            </Form>

            <Alert
                message="This will move the content to the Publishing Queue and notify the editor."
                type="info"
                showIcon
                style={{ marginTop: 16 }}
            />
        </Modal>
    );
}
