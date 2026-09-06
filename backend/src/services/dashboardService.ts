import { pool } from '../config/db.js';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  activeRegions: number;
  activePractices: number;
  systemAlertsCount: number;
  systemAlerts: Array<{
    type: string;
    message: string;
    severity: 'critical' | 'warning' | 'info';
  }>;
  userDistribution: Array<{
    name: string;
    value: number;
    percentage: number;
    color: string;
  }>;
  recentActivities: Array<{
    id: number;
    userName: string;
    userInitials: string;
    action: string;
    entity: string;
    time: string;
    createdAt: string;
    status: 'Success' | 'Failed' | 'Pending';
  }>;
}

export class DashboardService {
  static async getDashboardStats(): Promise<DashboardStats> {
    // 1. User metrics
    const userMetricsRes = await pool.query(`
      SELECT 
        COUNT(*)::int as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END)::int as active_users
      FROM users
    `);
    const totalUsers = userMetricsRes.rows[0]?.total_users || 0;
    const activeUsers = userMetricsRes.rows[0]?.active_users || 0;

    // 2. Active Regions
    const regionRes = await pool.query(`
      SELECT COUNT(*)::int as active_regions 
      FROM regions 
      WHERE is_active = TRUE OR status = 'active'
    `);
    const activeRegions = regionRes.rows[0]?.active_regions || 0;

    // 3. Active Practices
    const practiceRes = await pool.query(`
      SELECT COUNT(*)::int as active_practices 
      FROM practices 
      WHERE is_active = TRUE OR status = 'active'
    `);
    const activePractices = practiceRes.rows[0]?.active_practices || 0;

    // 4. System Alerts metrics
    const alertsRes = await pool.query(`
      SELECT 
        (SELECT COUNT(*)::int FROM training_assignments WHERE approval_status = 'pending') as pending_approvals,
        (SELECT COUNT(*)::int FROM resources WHERE current_status = 'bench') as bench_count,
        (SELECT COUNT(*)::int FROM users WHERE must_reset_password = TRUE) as password_reset_count
    `);
    const pendingApprovals = alertsRes.rows[0]?.pending_approvals || 0;
    const benchCount = alertsRes.rows[0]?.bench_count || 0;
    const passwordResetCount = alertsRes.rows[0]?.password_reset_count || 0;

    const systemAlerts: DashboardStats['systemAlerts'] = [];
    if (pendingApprovals > 0) {
      systemAlerts.push({
        type: 'pending_approvals',
        message: `${pendingApprovals} Training Assignment${pendingApprovals > 1 ? 's' : ''} Pending Approval`,
        severity: 'critical',
      });
    }
    if (benchCount > 0) {
      systemAlerts.push({
        type: 'bench_resources',
        message: `${benchCount} Resource${benchCount > 1 ? 's' : ''} Currently on Bench`,
        severity: 'warning',
      });
    }
    if (passwordResetCount > 0) {
      systemAlerts.push({
        type: 'password_reset',
        message: `${passwordResetCount} User${passwordResetCount > 1 ? 's' : ''} Require Password Reset`,
        severity: 'info',
      });
    }

    const systemAlertsCount = pendingApprovals + (benchCount > 0 ? 1 : 0) + (passwordResetCount > 0 ? 1 : 0);

    // 5. User Distribution by Practice
    const distRes = await pool.query(`
      SELECT 
        COALESCE(p.name, 'Unassigned') as practice_name,
        COUNT(u.id)::int as count
      FROM users u
      LEFT JOIN practices p ON u.practice_id = p.id
      GROUP BY p.name
      ORDER BY count DESC
    `);

    const colors = ['#004ac6', '#645efb', '#bc4800', '#059669', '#0284c7', '#d97706', '#8b5cf6'];
    const userDistribution = distRes.rows.map((row: any, idx: number) => {
      const val = row.count;
      const pct = totalUsers > 0 ? Math.round((val / totalUsers) * 100) : 0;
      return {
        name: row.practice_name,
        value: val,
        percentage: pct,
        color: colors[idx % colors.length],
      };
    });

    // 6. Recent Audit Logs
    const auditRes = await pool.query(`
      SELECT 
        al.id,
        al.user_id,
        COALESCE(u.name, 'System Auto') as user_name,
        al.action,
        al.entity_type,
        al.entity_id,
        al.details,
        al.created_at
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `);

    const recentActivities = auditRes.rows.map((row: any) => {
      const userName = row.user_name || 'System Auto';
      const initials = userName === 'System Auto' 
        ? 'SYS' 
        : userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

      const entity = row.details 
        ? (row.details.length > 35 ? row.details.slice(0, 32) + '...' : row.details)
        : `${row.entity_type}${row.entity_id ? `: #${row.entity_id}` : ''}`;

      return {
        id: row.id,
        userName,
        userInitials: initials,
        action: row.action,
        entity,
        time: this.formatRelativeTime(row.created_at),
        createdAt: row.created_at,
        status: 'Success' as const,
      };
    });

    return {
      totalUsers,
      activeUsers,
      activeRegions,
      activePractices,
      systemAlertsCount,
      systemAlerts,
      userDistribution,
      recentActivities,
    };
  }

  private static formatRelativeTime(dateInput: string | Date): string {
    if (!dateInput) return 'Just now';
    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }
}
