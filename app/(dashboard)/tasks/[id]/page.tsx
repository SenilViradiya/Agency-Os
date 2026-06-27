'use client';

import { use } from 'react';
import TaskDetailView from '@/components/tasks/TaskDetailView';
import { Card } from 'antd';

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <TaskDetailView taskId={id} />
        </div>
    );
}
