import { Tag } from 'antd';
import { 
    ArrowUpOutlined, 
    LineOutlined, 
    ArrowDownOutlined, 
    QuestionCircleOutlined 
} from '@ant-design/icons';

interface PriorityChipProps {
    priority: 'low' | 'medium' | 'high' | string;
}

export default function PriorityChip({ priority }: PriorityChipProps) {
    const getProps = () => {
        switch (priority.toLowerCase()) {
            case 'high':
                return { color: 'red', icon: <ArrowUpOutlined /> };
            case 'medium':
                return { color: 'orange', icon: <LineOutlined /> };
            case 'low':
                return { color: 'blue', icon: <ArrowDownOutlined /> };
            default:
                return { color: 'default', icon: <QuestionCircleOutlined /> };
        }
    };

    const { color, icon } = getProps();

    return (
        <Tag 
            color={color} 
            icon={icon}
            style={{ 
                fontWeight: 700, 
                borderRadius: '4px',
                borderWidth: 1 
            }}
        >
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
        </Tag>
    );
}
