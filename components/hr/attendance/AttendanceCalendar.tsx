'use client';

import { Typography, Tooltip, Flex } from 'antd';
import dayjs from 'dayjs';

const { Text } = Typography;

interface AttendanceCalendarProps {
    records: any[];
    month: string; // YYYY-MM
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    present: { color: '#52c41a', bg: '#f6ffed', label: 'Present' },
    absent: { color: '#ff4d4f', bg: '#fff1f0', label: 'Absent' },
    half_day: { color: '#faad14', bg: '#fffbe6', label: 'Half Day' },
    on_leave: { color: '#1890ff', bg: '#e6f7ff', label: 'On Leave' },
    holiday: { color: '#8c8c8c', bg: '#f5f5f5', label: 'Holiday' },
    work_from_home: { color: '#722ed1', bg: '#f9f0ff', label: 'WFH' },
};

export default function AttendanceCalendar({ records, month }: AttendanceCalendarProps) {
    const monthStart = dayjs(month).startOf('month');
    const monthEnd = dayjs(month).endOf('month');
    const daysInMonth = monthEnd.date();

    // Build a map of date => record
    const recordMap = new Map<string, any>();
    for (const rec of records) {
        const dateKey = dayjs(rec.date).format('YYYY-MM-DD');
        recordMap.set(dateKey, rec);
    }

    // Calculate first day offset (Monday = 0)
    const firstDayOfWeek = (monthStart.day() + 6) % 7; // Convert Sunday=0 to Monday=0 system

    const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const cells: { day: number; dateStr: string; record: any }[] = [];

    // Empty cells for first week offset
    for (let i = 0; i < firstDayOfWeek; i++) {
        cells.push({ day: 0, dateStr: '', record: null });
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = dayjs(month).date(d).format('YYYY-MM-DD');
        cells.push({ day: d, dateStr, record: recordMap.get(dateStr) || null });
    }

    const today = dayjs().format('YYYY-MM-DD');

    return (
        <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, minWidth: 350 }}>
                {/* Day Headers */}
                {dayHeaders.map((h) => (
                    <div key={h} style={{ textAlign: 'center', padding: '8px 4px', fontWeight: 600, color: '#8c8c8c', fontSize: 12 }}>
                        {h}
                    </div>
                ))}

                {/* Calendar Cells */}
                {cells.map((cell, idx) => {
                    if (cell.day === 0) {
                        return <div key={`empty-${idx}`} />;
                    }

                    const rec = cell.record;
                    const config = rec ? statusConfig[rec.status] : null;
                    const isToday = cell.dateStr === today;
                    const isSunday = dayjs(cell.dateStr).day() === 0;

                    return (
                        <Tooltip
                            key={cell.dateStr}
                            title={
                                rec
                                    ? `${config?.label || rec.status} ${rec.totalHours ? `• ${rec.totalHours}h` : ''} ${rec.notes ? `• ${rec.notes}` : ''}`
                                    : isSunday
                                    ? 'Sunday'
                                    : 'No record'
                            }
                        >
                            <div
                                style={{
                                    padding: '6px 4px',
                                    borderRadius: 8,
                                    textAlign: 'center',
                                    backgroundColor: config?.bg || (isSunday ? '#fafafa' : '#fff'),
                                    border: isToday ? '2px solid #6C63FF' : '1px solid #f0f0f0',
                                    cursor: 'default',
                                    minHeight: 44,
                                    display: 'flex',
                                    flexorientation: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 12,
                                        fontWeight: isToday ? 700 : 400,
                                        color: isSunday ? '#d9d9d9' : '#262626',
                                    }}
                                >
                                    {cell.day}
                                </Text>
                                {config && (
                                    <div
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            backgroundColor: config.color,
                                            marginTop: 2,
                                        }}
                                    />
                                )}
                            </div>
                        </Tooltip>
                    );
                })}
            </div>

            {/* Legend */}
            <Flex gap={16} wrap="wrap" style={{ marginTop: 12, padding: '8px 0' }}>
                {Object.entries(statusConfig).map(([key, conf]) => (
                    <Flex key={key} align="center" gap={4}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: conf.color }} />
                        <Text type="secondary" style={{ fontSize: 11 }}>{conf.label}</Text>
                    </Flex>
                ))}
            </Flex>
        </div>
    );
}
