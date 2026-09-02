import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AuditActivity } from '../models/AuditActivity';
import { sendTransactionalEmail, getSupportTicketEmailTemplate } from '../services/emailService';
import { env } from '../config/env';

export async function submitContactQuery(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, subject, message, category, organizationName, tournamentTitle } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ success: false, error: 'Subject and message are required.' });
    }

    const senderName = name?.trim() || 'Tournament Organizer';
    const senderEmail = email?.trim() || 'support@pointx.in';

    // 1. Fetch all admin users in the platform
    const adminUsers = await User.find({
      $or: [{ role: 'admin' }, { isOriginalAdmin: true }]
    }).select('email name');

    const adminEmails = new Set<string>();
    adminUsers.forEach((admin) => {
      if (admin.email && admin.email.includes('@')) {
        adminEmails.add(admin.email.trim());
      }
    });

    // Fallback: Add sender email from environment / official email
    if (env.BREVO_SENDER_EMAIL && env.BREVO_SENDER_EMAIL.includes('@')) {
      adminEmails.add(env.BREVO_SENDER_EMAIL.trim());
    }

    // Default support inbox
    adminEmails.add('support@pointx.in');

    const { subject: emailSubject, html: emailHtml } = getSupportTicketEmailTemplate({
      senderName,
      senderEmail,
      organizationName,
      category,
      subject,
      message,
      tournamentTitle
    });

    // 2. Dispatch email to all admins in parallel
    const emailPromises = Array.from(adminEmails).map((adminEmail) =>
      sendTransactionalEmail({
        toEmail: adminEmail,
        toName: 'PointX Super Admin',
        subject: emailSubject,
        htmlContent: emailHtml,
        textContent: `[Support Query from ${senderName} (${senderEmail})] Topic: ${category || 'General'} - Subject: ${subject}\n\n${message}`
      })
    );

    await Promise.allSettled(emailPromises);

    // 3. Log Audit Activity for tracking
    await AuditActivity.create({
      customId: `ticket-${Date.now().toString(36)}`,
      userId: (req as any).user?._id?.toString() || 'public-user',
      userName: senderName,
      userEmail: senderEmail,
      action: 'Support Query Submitted',
      category: 'security',
      details: `Organizer submitted inquiry: "${subject}" (${category || 'General'}). Dispatched to ${adminEmails.size} admin inboxes.`
    });

    return res.status(200).json({
      success: true,
      message: 'Support query successfully delivered to all platform administrators.'
    });
  } catch (error) {
    next(error);
  }
}
