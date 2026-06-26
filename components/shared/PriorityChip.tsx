import { Chip } from '@mui/material';

interface PriorityChipProps {
    priority: 'low' | 'medium' | 'high' | string;
}

export default function PriorityChip({ priority }: PriorityChipProps) {
    const getColor = () => {
        switch (priority.toLowerCase()) {
            case 'high':
                return 'error';
            case 'medium':
                return 'warning';
            case 'low':
                return 'info';
            default:
                return 'default';
        }
    };

    return (
        <Chip
            label={priority.charAt(0).toUpperCase() + priority.slice(1)}
            color={getColor() as any}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 700, borderRadius: '6px', borderWidth: 2 }}
        />
    );
}
