'use client';

import { useState, useMemo } from 'react';
import { Card, Typography, Flex, Button, Space, Tag, Badge, Tooltip } from 'antd';
import { 
    LeftOutlined, 
    RightOutlined, 
    FileTextOutlined,
    VideoCameraOutlined,
    EditOutlined,
    PictureOutlined,
    MessageOutlined,
    CheckCircleOutlined,
    SendOutlined,
    PlusOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface ContentCalendarProps {
    items: any[];
    currentMonth: dayjs.Dayjs;
    onMonthChange: (month: dayjs.Dayjs) => void;
    onItemClick: (item: any) => void;
    onAddClick: (date: dayjs.Dayjs) => void;
}

const STAGE_CONFIG: Record<string, { icon: any, color: string }> = {
    script: { icon: <FileTextOutlined />, color: 'blue' },
    shoot: { icon: <VideoCameraOutlined />, color: 'orange' },
    edit: { icon: <EditOutlined />, color: 'purple' },
    thumbnail: { icon: <PictureOutlined />, color: 'magenta' },
    caption: { icon: <MessageOutlined />, color: 'cyan' },
    approval: { icon: <CheckCircleOutlined />, color: 'gold' },
    publish: { icon: <SendOutlined />, color: 'green' },
    completed: { icon: <CheckCircleOutlined />, color: 'default' },
};

export default function ContentCalendar({ items, currentMonth, onMonthChange, onItemClick, onAddClick }: ContentCalendarProps) {
    const calendarData = useMemo(() => {
        const startOfMonth = currentMonth.startOf('month');
        const endOfMonth = currentMonth.endOf('month');
        const startDate = startOfMonth.startOf('week');
        const endDate = endOfMonth.endOf('week');

        const days = [];
        let day = startDate;
        while (day.isBefore(endDate) || day.isSame(endDate, 'day')) {
            days.push(day);
            day = day.add(1, 'day');
        }
        return days;
    }, [currentMonth]);

    const itemsByDate = useMemo(() => {
        const map: Record<string, any[]> = {};
        items.forEach(item => {
            if (item.plannedPublishDate) {
                const dateKey = dayjs(item.plannedPublishDate).format('YYYY-MM-DD');
                if (!map[dateKey]) map[dateKey] = [];
                map[dateKey].push(item);
            }
        });
        return map;
    }, [items]);

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
            <Flex justify="space-between" align="center" style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
                <Title level={4} style={{ margin: 0 }}>{currentMonth.format('MMMM YYYY')}</Title>
                <Space>
                    <Button icon={<LeftOutlined />} onClick={() => onMonthChange(currentMonth.subtract(1, 'month'))} />
                    <Button onClick={() => onMonthChange(dayjs())}>Today</Button>
                    <Button icon={<RightOutlined />} onClick={() => onMonthChange(currentMonth.add(1, 'month'))} />
                </Space>
            </Flex>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                {weekDays.map(day => (
                    <div key={day} style={{ padding: '12px 0', borderRight: '1px solid #f0f0f0' }}>
                        <Text strong type="secondary" style={{ fontSize: 12 }}>{day.toUpperCase()}</Text>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(120px, auto)' }}>
                {calendarData.map((day, idx) => {
                    const dateKey = day.format('YYYY-MM-DD');
                    const dayItems = itemsByDate[dateKey] || [];
                    const isToday = day.isSame(dayjs(), 'day');
                    const isCurrentMonth = day.isSame(currentMonth, 'month');

                    return (
                        <div 
                            key={idx} 
                            style={{ 
                                padding: 8, 
                                borderRight: '1px solid #f0f0f0', 
                                borderBottom: '1px solid #f0f0f0',
                                backgroundColor: isCurrentMonth ? (isToday ? '#f0f5ff' : '#fff') : '#fafafa',
                                minHeight: 120,
                                transition: 'all 0.3s'
                            }}
                            className="calendar-day-cell"
                        >
                            <Flex justify="space-between" align="start">
                                <Text 
                                    strong={isToday} 
                                    style={{ 
                                        color: isToday ? '#1677ff' : (isCurrentMonth ? '#262626' : '#bfbfbf'),
                                        fontSize: 13
                                    }}
                                >
                                    {day.format('D')}
                                </Text>
                                <Button 
                                    type="text" 
                                    size="small" 
                                    icon={<PlusOutlined style={{ fontSize: 10, color: '#bfbfbf' }} />} 
                                    onClick={() => onAddClick(day)}
                                />
                            </Flex>

                            <div style={{ marginTop: 8 }}>
                                {dayItems.slice(0, 3).map(item => (
                                    <Tooltip key={item._id} title={`${item.title} (${item.currentStage})`}>
                                        <div 
                                            onClick={() => onItemClick(item)}
                                            style={{ 
                                                marginBottom: 4, 
                                                cursor: 'pointer',
                                                padding: '2px 6px',
                                                borderRadius: 4,
                                                backgroundColor: `var(--ant-${STAGE_CONFIG[item.currentStage]?.color}-1)`,
                                                borderLeft: `3px solid var(--ant-${STAGE_CONFIG[item.currentStage]?.color}-5)`,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            <Space size={4}>
                                                <span style={{ color: `var(--ant-${STAGE_CONFIG[item.currentStage]?.color}-6)`, fontSize: 10 }}>
                                                    {STAGE_CONFIG[item.currentStage]?.icon}
                                                </span>
                                                <Text style={{ fontSize: 11 }}>{item.title}</Text>
                                            </Space>
                                        </div>
                                    </Tooltip>
                                ))}
                                {dayItems.length > 3 && (
                                    <Text type="secondary" style={{ fontSize: 10, paddingLeft: 4 }}>
                                        + {dayItems.length - 3} more
                                    </Text>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <Flex gap={16} wrap="wrap" style={{ padding: '16px 24px', background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
                {Object.entries(STAGE_CONFIG).map(([stage, config]) => (
                    <Space key={stage} size={4}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: `var(--ant-${config.color}-5)` }} />
                        <Text style={{ fontSize: 11, textTransform: 'capitalize' }}>{stage}</Text>
                    </Space>
                ))}
            </Flex>
        </Card>
    );
}
