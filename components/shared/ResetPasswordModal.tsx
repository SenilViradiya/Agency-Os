'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Button, Alert, Typography, App } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import apiClient from '@/lib/apiClient';

const { Text } = Typography;

interface ResetPasswordModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  apiEndpoint: string; // e.g. "/api/users/[id]/reset-password" or direct route URL
  context?: 'team' | 'portal';
}

export default function ResetPasswordModal({
  open,
  onClose,
  userId,
  userName,
  apiEndpoint,
  context = 'team',
}: ResetPasswordModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    const uppercaseChars = 'ABCDEFGHJKMNPQRSTUVWXYZ';
    const numberChars = '23456789';
    const specialChars = '!@#$';

    let attempts = 0;
    let password = '';
    while (attempts < 500) {
      password = '';
      for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        password += chars[randomIndex];
      }

      const hasUppercase = [...password].some((char) => uppercaseChars.includes(char));
      const hasNumber = [...password].some((char) => numberChars.includes(char));
      const hasSpecial = [...password].some((char) => specialChars.includes(char));

      if (hasUppercase && hasNumber && hasSpecial) {
        break;
      }
      attempts++;
    }

    if (password) {
      setGeneratedPassword(password);
      form.setFieldsValue({
        newPassword: password,
        confirmPassword: password,
      });
      // Force validation
      form.validateFields();
    }
  };

  const handleReset = async (values: any) => {
    setLoading(true);
    try {
      const resolvedEndpoint = apiEndpoint.replace('[id]', userId);
      const res = await apiClient.post(resolvedEndpoint, {
        newPassword: values.newPassword,
      });

      if (res.data.success) {
        if (context === 'portal') {
          message.success(`Password reset. Share it with ${userName} (client portal).`);
        } else {
          message.success(`Password reset. Share it with ${userName} directly.`);
        }
        form.resetFields();
        setGeneratedPassword('');
        onClose();
      } else {
        message.error(res.data.error || 'Failed to reset password');
      }
    } catch (error: any) {
      console.error(error);
      message.error(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setGeneratedPassword('');
    onClose();
  };

  const warningMessage =
    context === 'portal'
      ? 'Share the new password with your client directly via WhatsApp or phone call.'
      : "You are resetting this user's password. Share the new password with them directly via WhatsApp or phone call.";

  return (
    <Modal
      title={`Reset Password — ${userName}`}
      open={open}
      onCancel={handleCancel}
      width={440}
      footer={null}
      destroyOnHidden
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
        <Alert message={warningMessage} type="warning" showIcon />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleReset}
          requiredMark={false}
          style={{ width: '100%' }}
        >
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please input the new password' },
              { min: 8, message: 'Password must be at least 8 characters' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  if (!/[A-Z]/.test(value)) {
                    return Promise.reject(new Error('Password must contain at least 1 uppercase letter'));
                  }
                  if (!/[0-9]/.test(value)) {
                    return Promise.reject(new Error('Password must contain at least 1 number'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input.Password
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              size="large"
              prefix={<LockOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm the password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="Confirm password"
              size="large"
              prefix={<LockOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
            />
          </Form.Item>

          <div style={{ marginBottom: 20 }}>
            <Button
              type="default"
              size="small"
              onClick={handleGeneratePassword}
              style={{ fontSize: 12 }}
            >
              Generate Random Password
            </Button>
          </div>

          {generatedPassword && (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                border: '1px dashed #d9d9d9',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Generated password:
                </Text>
                <Text copyable code style={{ fontSize: 14, fontFamily: 'monospace' }}>
                  {generatedPassword}
                </Text>
                <Text type="danger" style={{ fontSize: 11, marginTop: 4 }}>
                  Copy this before clicking Reset — it won't be shown again.
                </Text>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button type="primary" danger htmlType="submit" loading={loading}>
              Reset Password
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
