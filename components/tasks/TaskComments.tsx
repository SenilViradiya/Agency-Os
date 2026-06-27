'use client';

import { useState } from 'react';
import { Avatar, Input, Button, Space, Typography, Flex, App } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import apiClient from '@/lib/apiClient';

dayjs.extend(relativeTime);
const { Text } = Typography;
const { TextArea } = Input;

interface TaskCommentsProps {
    taskId: string;
    comments: any[];
    onCommentAdded: (comment: any) => void;
}

export default function TaskComments({ taskId, comments, onCommentAdded }: TaskCommentsProps) {
    const { message } = App.useApp();
    const [submitting, setSubmitting] = useState(false);
    const [value, setValue] = useState('');

    const handleSubmit = async () => {
        if (!value.trim()) return;

        setSubmitting(true);
        try {
            const res = await apiClient.post(`/tasks/${taskId}/comments`, { text: value });
            if (res.data.success) {
                onCommentAdded(res.data.data);
                setValue('');
                message.success('Comment added');
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
            message.error('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Text strong>{comments.length} Comments</Text>
            </div>
            
            <Flex vertical gap={24} style={{ marginBottom: 24 }}>
                {comments.map((item: any) => (
                    <Flex key={item._id} gap={16} align="start">
                        <Avatar src={item.postedBy?.avatar} size="large">
                            {item.postedBy?.name?.charAt(0)}
                        </Avatar>
                        <div style={{ flex: 1 }}>
                            <Flex align="center" gap={8} style={{ marginBottom: 4 }}>
                                <Text strong>{item.postedBy?.name}</Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(item.createdAt).fromNow()}</Text>
                            </Flex>
                            <div style={{ color: '#262626', fontSize: 14, lineHeight: 1.6 }}>
                                {item.text}
                            </div>
                        </div>
                    </Flex>
                ))}
            </Flex>

            <div style={{ marginTop: 24, padding: '20px 0', borderTop: '1px solid #f0f0f0' }}>
                <Flex gap={12} align="start">
                    <Avatar size="default" />
                    <div style={{ flex: 1 }}>
                        <TextArea
                            rows={3}
                            onChange={(e) => setValue(e.target.value)}
                            value={value}
                            placeholder="Add a comment..."
                            style={{ borderRadius: 8, marginBottom: 12, border: '1px solid #d9d9d9' }}
                        />
                        <Button 
                            type="primary" 
                            loading={submitting} 
                            onClick={handleSubmit} 
                            icon={<SendOutlined />}
                            disabled={!value.trim()}
                            style={{ height: 40, borderRadius: 8, fontWeight: 600 }}
                        >
                            Send Comment
                        </Button>
                    </div>
                </Flex>
            </div>
        </div>
    );
}
