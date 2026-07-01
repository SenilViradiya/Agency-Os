'use client';

import { useState, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Typography, Badge, Card, Flex, Space } from 'antd';
import TaskCard from './TaskCard';

const { Text } = Typography;

const COLUMNS = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'in_review', title: 'In Review' },
    { id: 'done', title: 'Done' },
];

interface TaskBoardProps {
    tasks: any[];
    onStatusChange: (taskId: string, newStatus: string) => void;
    onTaskClick: (task: any) => void;
}

interface ColumnDroppableProps {
    id: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
}

function ColumnDroppable({ id, children, style }: ColumnDroppableProps) {
    const { setNodeRef } = useDroppable({ id });
    return (
        <div ref={setNodeRef} style={style}>
            {children}
        </div>
    );
}

export default function TaskBoard({ tasks, onStatusChange, onTaskClick }: TaskBoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const groupedTasks = useMemo(() => {
        return COLUMNS.reduce((acc: any, col) => {
            acc[col.id] = tasks.filter(t => t.status === col.id);
            return acc;
        }, {});
    }, [tasks]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const taskId = active.id as string;
        const overId = over.id as string;

        // Find which column the task was dropped into
        const newStatus = COLUMNS.find(c => c.id === overId)?.id ||
            tasks.find(t => t._id === overId)?.status;

        if (newStatus && newStatus !== tasks.find(t => t._id === taskId)?.status) {
            onStatusChange(taskId, newStatus);
        }

        setActiveId(null);
    };

    const activeTask = useMemo(() =>
        tasks.find(t => t._id === activeId),
        [tasks, activeId]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div style={{
                display: 'flex',
                gap: 16,
                paddingBottom: 16,
                overflowX: 'auto',
                minHeight: 'calc(100vh - 300px)',
            }}>
                {COLUMNS.map((column) => (
                    <div key={column.id} style={{ minWidth: 280, width: 280 }}>
                        <Card
                            size="small"
                            styles={{
                                body: { padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '12px', minHeight: 'calc(100vh - 320px)' }
                            }}
                            style={{ border: 'none', backgroundColor: 'transparent' }}
                        >
                            <Flex justify="space-between" align="center" style={{ marginBottom: 16, padding: '0 4px' }}>
                                <Space size="small">
                                    <Text strong style={{ fontSize: 11, textTransform: 'uppercase', color: '#8c8c8c' }}>
                                        {column.title}
                                    </Text>
                                    <Badge 
                                        count={groupedTasks[column.id].length} 
                                        style={{ backgroundColor: '#6C63FF', fontSize: 10 }}
                                    />
                                </Space>
                            </Flex>

                            <SortableContext
                                id={column.id}
                                items={groupedTasks[column.id].map((t: any) => t._id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <ColumnDroppable 
                                    id={column.id}
                                    style={{ minHeight: 'calc(100vh - 380px)', display: 'flex', flexDirection: 'column', gap: 4 }}
                                >
                                    {groupedTasks[column.id].map((task: any) => (
                                        <TaskCard
                                            key={task._id}
                                            task={task}
                                            onClick={onTaskClick}
                                        />
                                    ))}
                                </ColumnDroppable>
                            </SortableContext>
                        </Card>
                    </div>
                ))}
            </div>

            <DragOverlay>
                {activeTask ? (
                    <TaskCard task={activeTask} onClick={() => { }} />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
