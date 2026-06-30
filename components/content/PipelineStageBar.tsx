'use client';

import { Steps, Progress, Typography, Flex, Divider } from 'antd';
import { 
    FileTextOutlined, 
    VideoCameraOutlined, 
    EditOutlined, 
    PictureOutlined, 
    MessageOutlined, 
    CheckCircleOutlined, 
    SendOutlined,
    MinusCircleOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface PipelineStageBarProps {
    currentStage: string;
    stageStatuses: Record<string, string>;
}

const PIPELINE_STAGES = [
    { key: 'script', title: 'Script', icon: <FileTextOutlined /> },
    { key: 'shoot', title: 'Shoot', icon: <VideoCameraOutlined /> },
    { key: 'edit', title: 'Edit', icon: <EditOutlined /> },
    { key: 'thumbnail', title: 'Thumbnail', icon: <PictureOutlined /> },
    { key: 'caption', title: 'Caption', icon: <MessageOutlined /> },
    { key: 'approval', title: 'Approval', icon: <CheckCircleOutlined /> },
    { key: 'publish', title: 'Publish', icon: <SendOutlined /> },
];

export default function PipelineStageBar({ currentStage, stageStatuses }: PipelineStageBarProps) {
    const currentIdx = PIPELINE_STAGES.findIndex(s => s.key === currentStage);
    const doneCount = Object.values(stageStatuses).filter(s => s === 'done' || s === 'skipped').length;
    const progressPercent = Math.round((doneCount / PIPELINE_STAGES.length) * 100);

    const items = PIPELINE_STAGES.map((stage, idx) => {
        const status = stageStatuses[stage.key];
        
        let stepStatus: 'wait' | 'process' | 'finish' | 'error' = 'wait';
        let icon = stage.icon;

        if (status === 'done') {
            stepStatus = 'finish';
        } else if (status === 'skipped') {
            stepStatus = 'finish';
            icon = <MinusCircleOutlined style={{ color: '#bfbfbf' }} />;
        } else if (stage.key === currentStage) {
            stepStatus = 'process';
        }

        return {
            title: stage.title,
            status: stepStatus,
            icon: icon,
        };
    });

    return (
        <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', marginBottom: 24 }}>
            <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
                <div>
                    <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase' }}>Production Progress</Text>
                    <div style={{ marginTop: 4 }}>
                        <Text strong style={{ fontSize: 20 }}>{progressPercent}% Complete</Text>
                    </div>
                </div>
                <div style={{ width: 300 }}>
                    <Progress percent={progressPercent} strokeColor="#6C63FF" showInfo={false} />
                </div>
            </Flex>
            
            <Steps
                size="small"
                current={currentIdx}
                items={items}
                responsive={true}
                style={{ marginTop: 8 }}
            />
        </div>
    );
}
