import { pool } from '../config/db.js';
import { CreateCertificationInput, VerificationStatus } from '../types/certification.js';

export class CertificationService {
  static async getCertificationsByResource(resourceId: number) {
    const query = `
      SELECT c.*,
             u_res.name as resource_name,
             u_v.name as verified_by_name
      FROM certifications c
      INNER JOIN resources r ON c.resource_id = r.id
      INNER JOIN users u_res ON r.user_id = u_res.id
      LEFT JOIN users u_v ON c.verified_by = u_v.id
      WHERE c.resource_id = $1
      ORDER BY c.created_at DESC
    `;
    const result = await pool.query(query, [resourceId]);
    return result.rows;
  }

  static async getCertificationById(id: number) {
    const query = `
      SELECT c.*,
             r.user_id as resource_user_id,
             r.region_id as resource_region_id,
             u_res.name as resource_name,
             u_v.name as verified_by_name
      FROM certifications c
      INNER JOIN resources r ON c.resource_id = r.id
      INNER JOIN users u_res ON r.user_id = u_res.id
      LEFT JOIN users u_v ON c.verified_by = u_v.id
      WHERE c.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get user roles by user ID
   */
  static async getUserRoles(userId: number): Promise<string[]> {
    const query = `
      SELECT ro.name
      FROM user_roles ur
      INNER JOIN roles ro ON ur.role_id = ro.id
      WHERE ur.user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows.map((r: any) => r.name);
  }

  /**
   * Get pending certifications for the verification queue.
   * - Regional Lead: sees pending certs for non-Regional-Lead users in their region
   * - Admin: sees ALL pending certs (including Regional Lead certs)
   */
  static async getPendingCertificationsByRegion(regionId?: number | null, isAdmin: boolean = false) {
    const params: any[] = [];
    let filters = "WHERE c.verification_status = 'pending'";

    if (!isAdmin && regionId !== undefined && regionId !== null) {
      // Regional Lead: filter by region AND exclude certs from other Regional Leads
      params.push(regionId);
      filters += ` AND r.region_id = $1
        AND NOT EXISTS (
          SELECT 1 FROM user_roles ur2
          INNER JOIN roles ro2 ON ur2.role_id = ro2.id
          WHERE ur2.user_id = r.user_id AND ro2.name = 'Regional Lead'
        )`;
    }

    const query = `
      SELECT c.*,
             u_res.name as resource_name,
             u_res.email as resource_email,
             r.designation,
             reg.name as region_name
      FROM certifications c
      INNER JOIN resources r ON c.resource_id = r.id
      INNER JOIN users u_res ON r.user_id = u_res.id
      LEFT JOIN regions reg ON r.region_id = reg.id
      ${filters}
      ORDER BY c.created_at ASC
    `;
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async createCertification(resourceId: number, data: CreateCertificationInput) {
    const { name, issuing_body, date_earned, certificate_url } = data;
    const query = `
      INSERT INTO certifications (resource_id, name, issuing_body, date_earned, certificate_url, verification_status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *
    `;
    const result = await pool.query(query, [
      resourceId,
      name.trim(),
      issuing_body ? issuing_body.trim() : null,
      date_earned,
      certificate_url || '',
    ]);
    return result.rows[0];
  }

  static async verifyCertification(
    certId: number,
    verifiedByUserId: number,
    verificationStatus: 'verified' | 'rejected'
  ) {
    const query = `
      UPDATE certifications
      SET verification_status = $1,
          verified_by = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [verificationStatus, verifiedByUserId, certId]);
    return result.rows[0] || null;
  }

  static async deleteCertification(certId: number) {
    const query = `DELETE FROM certifications WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [certId]);
    return result.rows[0] || null;
  }
}

