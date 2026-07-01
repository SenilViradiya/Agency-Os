'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Card,
    Form,
    Input,
    Button,
    Typography,
    Alert,
    App as AntdApp,
    Modal,
    Result,
    Flex
} from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function PortalLoginForm() {
    const router = useRouter();
    const { message: msg } = AntdApp.useApp();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

    const onFinish = async (values: any) => {
        setLoading(true);
        setError(null);

        try {
            // Because this is rendered inside a portal SessionProvider, next-auth handles basePath automatically.
            // If it is not wrapped, it might fallback to standard /api/auth.
            // To be 100% safe, we can trigger NextAuth sign in using standard next-auth signIn.
            const result = await signIn('credentials', {
                email: values.email,
                password: values.password,
                redirect: false,
                callbackUrl: '/portal'
            });

            if (result?.error) {
                setError('Invalid email or password');
                msg.error('Invalid email or password');
            } else {
                msg.success('Success! Welcome to your Portal.');
                router.push('/portal');
                router.refresh();
            }
        } catch (err) {
            setError('An error occurred during authentication.');
            msg.error('Could not authenticate. Contact support.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card
            style={{
                borderRadius: 16,
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                border: 'none',
                width: '100%',
                maxWidth: 450
            }}
            styles={{ body: { padding: '40px' } }}
        >
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <Title level={2} style={{ margin: 0, fontWeight: 900, color: '#FF6584' }}>
                    AgencyOS
                </Title>
                <Text strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, color: '#8c8c8c', display: 'block', marginTop: 4 }}>
                    Client Portal
                </Text>
                <Text type="secondary" style={{ fontSize: 14, display: 'block', marginTop: 8 }}>
                    Sign in to view your projects and invoices
                </Text>
            </div>

            {error && (
                <Alert
                    message={error}
                    type="error"
                    showIcon
                    style={{ marginBottom: 24, borderRadius: 8 }}
                />
            )}

            <Form
                layout="vertical"
                onFinish={onFinish}
                size="large"
                requiredMark={false}
            >
                <Form.Item
                    name="email"
                    rules={[
                        { required: true, message: 'Please enter your email' },
                        { type: 'email', message: 'Invalid email address' }
                    ]}
                >
                    <Input
                        prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder="Email Address"
                        style={{ borderRadius: 8, height: 50 }}
                    />
                </Form.Item>

                <Form.Item
                    name="password"
                    rules={[{ required: true, message: 'Please enter your password' }]}
                    style={{ marginBottom: 24 }}
                >
                    <Input.Password
                        prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder="Password"
                        style={{ borderRadius: 8, height: 50 }}
                    />
                </Form.Item>

                <Form.Item style={{ marginBottom: 24 }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        block
                        loading={loading}
                        style={{
                            height: 50,
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: 16,
                            backgroundColor: '#FF6584',
                            borderColor: '#FF6584'
                        }}
                    >
                        {loading ? 'Entering Portal...' : 'Sign In'}
                    </Button>
                    <Flex justify="center" style={{ marginTop: 16 }}>
                        <Typography.Link
                            onClick={() => setForgotPasswordOpen(true)}
                            style={{ fontSize: 13, color: 'var(--text-secondary)' }}
                        >
                            Forgot password?
                        </Typography.Link>
                    </Flex>
                </Form.Item>
            </Form>

            <Modal
                title="Forgot your password?"
                open={forgotPasswordOpen}
                onCancel={() => setForgotPasswordOpen(false)}
                footer={[
                    <Button key="ok" type="primary" onClick={() => setForgotPasswordOpen(false)}>
                        OK
                    </Button>
                ]}
                width={400}
                centered
                destroyOnHidden
            >
                <Result
                    icon={<LockOutlined style={{ color: 'var(--text-secondary)' }} />}
                    title="Contact your account manager"
                    subTitle="Reach out to your AgencyOS account manager via WhatsApp or phone and they will reset your access within minutes."
                />
            </Modal>
        </Card>
    );
}
