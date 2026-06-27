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
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Typography, Badge, Card, Flex, Space } from 'antd';
import LeadCard from './LeadCard';

const { Text } = Typography;

const COLUMNS = [
    { id: 'new', title: 'New' },
    { id: 'contacted', title: 'Contacted' },
    { id: 'qualified', title: 'Qualified' },
    { id: 'proposal_sent', title: 'Proposal Sent' },
    { id: 'negotiation', title: 'Negotiation' },
    { id: 'won', title: 'Won' },
    { id: 'lost', title: 'Lost' },
];

interface LeadKanbanProps {
    leads: any[];
    onStatusChange: (leadId: string, newStatus: string) => void;
    onCardClick: (lead: any) => void;
}

export default function LeadKanban({ leads, onStatusChange, onCardClick }: LeadKanbanProps) {
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

    const groupedLeads = useMemo(() => {
        return COLUMNS.reduce((acc: any, col) => {
            acc[col.id] = leads.filter(l => l.status === col.id);
            return acc;
        }, {});
    }, [leads]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const leadId = active.id as string;
        const overId = over.id as string;

        // Find which column the lead was dropped into
        const newStatus = COLUMNS.find(c => c.id === overId)?.id ||
            leads.find(l => l._id === overId)?.status;

        if (newStatus && newStatus !== leads.find(l => l._id === leadId)?.status) {
            onStatusChange(leadId, newStatus);
        }

        setActiveId(null);
    };

    const activeLead = useMemo(() =>
        leads.find(l => l._id === activeId),
        [leads, activeId]);

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
                minHeight: 'calc(100vh - 250px)',
            }}>
                {COLUMNS.map((column) => (
                    <div key={column.id} style={{ minWidth: 280, width: 280 }}>
                        <Card
                            size="small"
                            styles={{
                                body: { padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '12px', minHeight: 'calc(100vh - 280px)' }
                            }}
                            style={{ border: 'none', backgroundColor: 'transparent' }}
                        >
                            <Flex justify="space-between" align="center" style={{ marginBottom: 16, padding: '0 4px' }}>
                                <Space size="small">
                                    <Text strong style={{ fontSize: 11, textTransform: 'uppercase', color: '#8c8c8c' }}>
                                        {column.title}
                                    </Text>
                                    <Badge 
                                        count={groupedLeads[column.id].length} 
                                        style={{ backgroundColor: '#6C63FF', fontSize: 10 }}
                                    />
                                </Space>
                                <Text style={{ fontSize: 11, fontWeight: 700, color: '#6C63FF' }}>
                                    ₹{groupedLeads[column.id].reduce((sum: number, l: any) => sum + (l.budget || 0), 0).toLocaleString('en-IN')}
                                </Text>
                            </Flex>

                            <SortableContext
                                id={column.id}
                                items={groupedLeads[column.id].map((l: any) => l._id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div style={{ minHeight: 100 }}>
                                    {groupedLeads[column.id].map((lead: any) => (
                                        <LeadCard
                                            key={lead._id}
                                            lead={lead}
                                            onClick={onCardClick}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </Card>
                    </div>
                ))}
            </div>

            <DragOverlay>
                {activeLead ? (
                    <LeadCard lead={activeLead} onClick={() => { }} />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
