/**
 * Example usage of the Email Service
 * 
 * This file demonstrates how to use the email utility across the application.
 */

import { emailService } from './email';

// ========================================
// Example 1: Send a basic email
// ========================================
async function sendBasicEmail() {
  const result = await emailService.send({
    to: 'user@example.com',
    subject: 'Hello from Innozverse',
    html: '<h1>Hello!</h1><p>This is a test email.</p>',
    text: 'Hello! This is a test email.',
  });

  if (result.success) {
    console.log('Email sent successfully!', result.messageId);
  } else {
    console.error('Failed to send email:', result.error);
  }
}

// ========================================
// Example 2: Send invitation email
// ========================================
async function sendUserInvitation() {
  const result = await emailService.sendInvitation({
    to: 'newuser@example.com',
    name: 'John Doe',
    inviteUrl: 'https://innozverse.com/accept-invite?token=abc123',
    inviterName: 'Jane Smith', // Optional
  });

  if (result.success) {
    console.log('Invitation sent!', result.messageId);
  } else {
    console.error('Failed to send invitation:', result.error);
  }
}

// ========================================
// Example 3: Send password reset email
// ========================================
async function sendPasswordResetEmail() {
  const result = await emailService.sendPasswordReset({
    to: 'user@example.com',
    name: 'John Doe',
    resetUrl: 'https://innozverse.com/reset-password?token=xyz789',
  });

  if (result.success) {
    console.log('Password reset email sent!', result.messageId);
  } else {
    console.error('Failed to send password reset:', result.error);
  }
}

// ========================================
// Example 4: Send welcome email
// ========================================
async function sendWelcomeEmail() {
  const result = await emailService.sendWelcome({
    to: 'newuser@example.com',
    name: 'John Doe',
  });

  if (result.success) {
    console.log('Welcome email sent!', result.messageId);
  } else {
    console.error('Failed to send welcome email:', result.error);
  }
}

// ========================================
// Example 5: Send email with CC/BCC
// ========================================
async function sendEmailWithCopies() {
  const result = await emailService.send({
    to: 'user@example.com',
    cc: 'manager@example.com',
    bcc: ['admin@example.com', 'log@example.com'],
    subject: 'Important Update',
    html: '<p>This is an important update.</p>',
  });

  if (result.success) {
    console.log('Email sent with copies!', result.messageId);
  }
}

// ========================================
// Example 6: Send email with attachments
// ========================================
async function sendEmailWithAttachment() {
  const result = await emailService.send({
    to: 'user@example.com',
    subject: 'Your Report',
    html: '<p>Please find your report attached.</p>',
    attachments: [
      {
        filename: 'report.pdf',
        data: Buffer.from('PDF content here'),
        contentType: 'application/pdf',
      },
    ],
  });

  if (result.success) {
    console.log('Email with attachment sent!', result.messageId);
  }
}

// ========================================
// Example 7: Use in route handler (Fastify)
// ========================================
/*
import { FastifyRequest, FastifyReply } from 'fastify';
import { emailService } from '../utils/email';

async function inviteUserHandler(request: FastifyRequest, reply: FastifyReply) {
  const { email, name } = request.body as { email: string; name: string };
  
  // Generate invite token
  const inviteToken = generateInviteToken();
  const inviteUrl = `${process.env.WEB_APP_URL}/accept-invite?token=${inviteToken}`;
  
  // Send invitation email
  const emailResult = await emailService.sendInvitation({
    to: email,
    name: name,
    inviteUrl: inviteUrl,
    inviterName: request.user.name,
  });
  
  if (!emailResult.success) {
    return reply.status(500).send({
      error: 'Failed to send invitation email',
      details: emailResult.error,
    });
  }
  
  return reply.send({
    status: 'ok',
    message: 'Invitation sent successfully',
    messageId: emailResult.messageId,
  });
}
*/

// ========================================
// Example 8: Using Mailgun templates
// ========================================
async function sendWithMailgunTemplate() {
  const result = await emailService.send({
    to: 'user@example.com',
    subject: 'Custom Template Email',
    template: 'welcome-template', // Mailgun template name
    variables: {
      name: 'John Doe',
      accountType: 'Premium',
      expiryDate: '2024-12-31',
    },
  });

  if (result.success) {
    console.log('Template email sent!', result.messageId);
  }
}

export {
  sendBasicEmail,
  sendUserInvitation,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendEmailWithCopies,
  sendEmailWithAttachment,
  sendWithMailgunTemplate,
};
