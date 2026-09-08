import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { CertificationService } from '../services/certificationService.js';
import { ResourceService } from '../services/resourceService.js';
import { NotificationService } from '../services/notificationService.js';

export const getResourceCertifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.resourceId) ? req.params.resourceId[0] : req.params.resourceId;
    const resourceId = parseInt(rawId, 10);
    if (isNaN(resourceId)) {
      res.status(400).json({ error: 'Invalid resource ID' });
      return;
    }

    const resource = await ResourceService.getResourceById(resourceId);
    if (!resource) {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }

    const user = req.user!;
    const userRoles = user.roles || (user.role ? [user.role] : []);

    // Permission check
    const isAdmin = userRoles.includes('System Administrator');
    const isPracticeLead = userRoles.includes('Practice Lead');
    const isSelf = resource.user_id === user.userId;
    const isRegionalLead = userRoles.includes('Regional Lead') && resource.region_id === user.regionId;
    const isMentor = userRoles.includes('Mentor') && resource.mentor_id === user.userId;

    if (!isAdmin && !isPracticeLead && !isSelf && !isRegionalLead && !isMentor) {
      res.status(403).json({ error: 'Access forbidden: You cannot view certifications for this resource' });
      return;
    }

    const certs = await CertificationService.getCertificationsByResource(resourceId);
    res.status(200).json(certs);
  } catch (error: any) {
    console.error('Error fetching certifications:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getPendingCertificationsQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const userRoles = user.roles || (user.role ? [user.role] : []);

    const isAdmin = userRoles.includes('System Administrator');
    const isRegionalLead = userRoles.includes('Regional Lead');

    if (!isAdmin && !isRegionalLead) {
      res.status(403).json({ error: 'Access forbidden: Only Regional Lead or Admin can access pending queue' });
      return;
    }

    const regionId = isAdmin ? undefined : user.regionId;
    const pendingCerts = await CertificationService.getPendingCertificationsByRegion(regionId, isAdmin);
    res.status(200).json(pendingCerts);
  } catch (error: any) {
    console.error('Error fetching pending certifications:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const uploadCertification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.resourceId) ? req.params.resourceId[0] : req.params.resourceId;
    const resourceId = parseInt(rawId, 10);
    if (isNaN(resourceId)) {
      res.status(400).json({ error: 'Invalid resource ID' });
      return;
    }

    const resource = await ResourceService.getResourceById(resourceId);
    if (!resource) {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }

    const user = req.user!;

    // Hard Rule: Resource self-upload for their own profile ONLY
    if (resource.user_id !== user.userId) {
      res.status(403).json({ error: 'Access forbidden: You can only upload certifications for your own profile' });
      return;
    }

    const { name, issuing_body, date_earned } = req.body;
    let certificate_url = req.body.certificate_url;

    if (req.file) {
      certificate_url = `/uploads/certificates/${req.file.filename}`;
    }

    if (!name || !date_earned) {
      res.status(400).json({ error: 'Certification name and date_earned are required' });
      return;
    }

    if (!certificate_url) {
      certificate_url = `/uploads/certificates/sample_cert_${Date.now()}.pdf`;
    }

    const created = await CertificationService.createCertification(resourceId, {
      name,
      issuing_body,
      date_earned,
      certificate_url,
    });

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error uploading certification:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const verifyCertification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const certId = parseInt(rawId, 10);
    if (isNaN(certId)) {
      res.status(400).json({ error: 'Invalid certification ID' });
      return;
    }

    const cert = await CertificationService.getCertificationById(certId);
    if (!cert) {
      res.status(404).json({ error: 'Certification not found' });
      return;
    }

    const user = req.user!;
    const userRoles = user.roles || (user.role ? [user.role] : []);

    // Hard Rule: Nobody can self-verify their own certification
    if (cert.resource_user_id === user.userId) {
      res.status(403).json({ error: 'Access forbidden: You cannot self-verify your own certification' });
      return;
    }

    const isAdmin = userRoles.includes('System Administrator');
    const isRegionalLead = userRoles.includes('Regional Lead');

    if (!isAdmin && !isRegionalLead) {
      res.status(403).json({ error: 'Access forbidden: Only Regional Lead or Admin can verify certifications' });
      return;
    }

    // Check if the cert uploader is a Regional Lead
    const uploaderRoles = await CertificationService.getUserRoles(cert.resource_user_id);
    const uploaderIsRegionalLead = uploaderRoles.includes('Regional Lead');

    // Approval Hierarchy:
    // - Regional Lead certs → Only Admin can approve
    // - All other users' certs → Regional Lead (same region) can approve
    if (uploaderIsRegionalLead && !isAdmin) {
      res.status(403).json({ error: 'Access forbidden: Regional Lead certifications can only be verified by System Administrator' });
      return;
    }

    // Regional Lead can only verify certs for users in their own region
    if (isRegionalLead && !isAdmin && cert.resource_region_id !== user.regionId) {
      res.status(403).json({ error: 'Access forbidden: You can only verify certifications for resources in your region' });
      return;
    }

    const { verification_status } = req.body;
    if (!['verified', 'rejected'].includes(verification_status)) {
      res.status(400).json({ error: "verification_status must be 'verified' or 'rejected'" });
      return;
    }

    const updated = await CertificationService.verifyCertification(certId, user.userId, verification_status);

    // Send notification to resource
    try {
      await NotificationService.createNotification({
        user_id: cert.resource_user_id,
        type: 'CERTIFICATION_VERIFICATION',
        message: `Your certification "${cert.name}" has been ${verification_status}.`,
        related_entity_type: 'certifications',
        related_entity_id: certId,
      });
    } catch (e) {
      console.warn('Failed to send notification:', e);
    }

    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error verifying certification:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const deleteCertification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const certId = parseInt(rawId, 10);
    if (isNaN(certId)) {
      res.status(400).json({ error: 'Invalid certification ID' });
      return;
    }

    const cert = await CertificationService.getCertificationById(certId);
    if (!cert) {
      res.status(404).json({ error: 'Certification not found' });
      return;
    }

    const user = req.user!;
    const userRoles = user.roles || (user.role ? [user.role] : []);

    const isAdmin = userRoles.includes('System Administrator');
    const isSelf = cert.resource_user_id === user.userId;

    if (!isAdmin && !isSelf) {
      res.status(403).json({ error: 'Access forbidden: You cannot delete this certification' });
      return;
    }

    // Hard Rule: Resource can delete their own ONLY while pending
    if (isSelf && !isAdmin && cert.verification_status !== 'pending') {
      res.status(403).json({ error: 'Access forbidden: Verified or rejected certifications cannot be deleted by resource' });
      return;
    }

    await CertificationService.deleteCertification(certId);
    res.status(200).json({ message: 'Certification deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting certification:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
