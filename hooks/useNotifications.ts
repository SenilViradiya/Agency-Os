import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '@/lib/apiClient';

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiClient.get('/notifications?isRead=false&limit=10');
      if (res.data.success) {
        setNotifications(res.data.data);
        const newUnreadCount = res.data.meta.unreadCount;
        
        // Play sound if new notification arrives
        if (newUnreadCount > unreadCount && unreadCount !== 0) {
            audioRef.current?.play().catch(e => console.log('Audio play blocked'));
        }
        
        setUnreadCount(newUnreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [unreadCount]);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('/notification.mp3');
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
}
