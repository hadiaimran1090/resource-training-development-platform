import { apiClient } from './apiClient';

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  message: string;
  related_entity_type: string | null;
  related_entity_id: number | null;
  is_read: boolean;
  created_at: string;
}

export const notificationApi = {
  getMyNotifications: async (): Promise<Notification[]> => (await apiClient.get('/notifications')).data,
  markAsRead: async (id: number): Promise<void> => { await apiClient.patch(`/notifications/${id}/read`); },
};
