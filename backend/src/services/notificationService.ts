import { pool } from '../config/db.js';

export class NotificationService {
  static async syncPendingSkillRequestNotifications(regionalLeadUserId: number) {
    await pool.query(
      `INSERT INTO notifications (user_id, type, message, related_entity_type, related_entity_id)
       SELECT $1, 'skill_request', 'New skill proposal: ' || sr.skill_name, 'skill_request', sr.id
       FROM skill_requests sr
       INNER JOIN users requester ON requester.id = sr.requested_by
       LEFT JOIN resources requester_resource ON requester_resource.user_id = requester.id
       INNER JOIN users lead ON lead.id = $1
       WHERE sr.status = 'pending'
         AND COALESCE(requester_resource.region_id, requester.region_id) = lead.region_id
         AND NOT EXISTS (
           SELECT 1 FROM notifications existing
           WHERE existing.user_id = $1
             AND existing.related_entity_type = 'skill_request'
             AND existing.related_entity_id = sr.id
         )`,
      [regionalLeadUserId]
    );
  }

  static async getForUser(userId: number) {
    const result = await pool.query(
      `SELECT id, user_id, type, message, related_entity_type, related_entity_id, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  static async createNotification(data: {
    user_id: number;
    type: string;
    message: string;
    related_entity_type?: string;
    related_entity_id?: number;
  }) {
    const { user_id, type, message, related_entity_type, related_entity_id } = data;
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, message, related_entity_type, related_entity_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, type, message, related_entity_type || null, related_entity_id || null]
    );
    return result.rows[0];
  }

  static async markAsRead(id: number, userId: number) {

    const result = await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    return result.rows.length > 0;
  }
}
