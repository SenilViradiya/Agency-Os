import { Typography, Flex } from 'antd';

const { Title, Paragraph } = Typography;

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
    return (
        <Flex justify="space-between" align="center" style={{ marginBottom: 32 }}>
            <div>
                <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
                    {title}
                </Title>
                {subtitle && (
                    <Paragraph type="secondary" style={{ margin: 0, fontSize: 16 }}>
                        {subtitle}
                    </Paragraph>
                )}
            </div>
            {action && <div>{action}</div>}
        </Flex>
    );
}
