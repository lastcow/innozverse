# Email Service Utility

A comprehensive email sending utility using Mailgun for the Innozverse application.

## Features

- ✅ Send plain text and HTML emails
- ✅ Pre-built templates for common emails (invitation, password reset, welcome)
- ✅ Support for CC, BCC, and multiple recipients
- ✅ File attachments support
- ✅ Mailgun template integration
- ✅ Automatic fallback when email is disabled
- ✅ TypeScript support with full type safety
- ✅ Singleton pattern for easy reuse

## Setup

### 1. Install Dependencies

Already installed:
- `mailgun.js` - Official Mailgun SDK
- `form-data` - Required for Mailgun

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Mailgun Email Configuration
MAILGUN_API_KEY=your-mailgun-api-key-here
MAILGUN_DOMAIN=your-domain.com
MAILGUN_FROM_EMAIL=noreply@innozverse.com
MAILGUN_ENABLED=true  # Set to 'true' to enable email sending
```

### 3. Get Mailgun Credentials

1. Sign up at https://www.mailgun.com
2. Verify your domain (or use sandbox domain for testing)
3. Get your API key from: Settings → API Keys
4. Your domain is shown in: Sending → Domains

## Usage

### Import the Service

```typescript
import { emailService } from './utils/email';
```

### Basic Email

```typescript
const result = await emailService.send({
  to: 'user@example.com',
  subject: 'Hello!',
  html: '<h1>Hello World</h1>',
  text: 'Hello World',
});

if (result.success) {
  console.log('Email sent!', result.messageId);
} else {
  console.error('Failed:', result.error);
}
```

### Invitation Email

```typescript
const result = await emailService.sendInvitation({
  to: 'newuser@example.com',
  name: 'John Doe',
  inviteUrl: 'https://innozverse.com/invite/abc123',
  inviterName: 'Jane Smith', // Optional
});
```

### Password Reset Email

```typescript
const result = await emailService.sendPasswordReset({
  to: 'user@example.com',
  name: 'John Doe',
  resetUrl: 'https://innozverse.com/reset/xyz789',
});
```

### Welcome Email

```typescript
const result = await emailService.sendWelcome({
  to: 'newuser@example.com',
  name: 'John Doe',
});
```

### Advanced Options

```typescript
const result = await emailService.send({
  to: ['user1@example.com', 'user2@example.com'],
  cc: 'manager@example.com',
  bcc: ['admin@example.com', 'log@example.com'],
  subject: 'Quarterly Report',
  html: '<h1>Report</h1>',
  from: 'reports@innozverse.com', // Override default sender
  attachments: [
    {
      filename: 'report.pdf',
      data: pdfBuffer,
      contentType: 'application/pdf',
    },
  ],
});
```

### Using Mailgun Templates

```typescript
const result = await emailService.send({
  to: 'user@example.com',
  subject: 'Welcome!',
  template: 'welcome-template', // Mailgun template name
  variables: {
    userName: 'John',
    accountType: 'Premium',
  },
});
```

## API Reference

### `emailService.send(options)`

Send a custom email.

**Parameters:**
- `to` (string | string[]) - Recipient email(s)
- `subject` (string) - Email subject
- `html` (string, optional) - HTML content
- `text` (string, optional) - Plain text content
- `from` (string, optional) - Sender email (defaults to MAILGUN_FROM_EMAIL)
- `cc` (string | string[], optional) - CC recipients
- `bcc` (string | string[], optional) - BCC recipients
- `attachments` (array, optional) - File attachments
- `template` (string, optional) - Mailgun template name
- `variables` (object, optional) - Template variables

**Returns:**
```typescript
{
  success: boolean;
  messageId?: string;
  error?: string;
}
```

### `emailService.sendInvitation(options)`

Send a user invitation email with a pre-designed template.

**Parameters:**
- `to` (string) - Recipient email
- `name` (string) - Recipient name
- `inviteUrl` (string) - Invitation acceptance URL
- `inviterName` (string, optional) - Name of person sending invite

### `emailService.sendPasswordReset(options)`

Send a password reset email.

**Parameters:**
- `to` (string) - Recipient email
- `name` (string) - Recipient name
- `resetUrl` (string) - Password reset URL

### `emailService.sendWelcome(options)`

Send a welcome email to new users.

**Parameters:**
- `to` (string) - Recipient email
- `name` (string) - Recipient name

## Integration Examples

### In a Fastify Route

```typescript
import { emailService } from '../utils/email';

fastify.post('/invite', async (request, reply) => {
  const { email, name } = request.body;
  
  const token = generateInviteToken();
  const inviteUrl = `${process.env.WEB_APP_URL}/invite/${token}`;
  
  const result = await emailService.sendInvitation({
    to: email,
    name: name,
    inviteUrl: inviteUrl,
  });
  
  if (!result.success) {
    return reply.status(500).send({ error: result.error });
  }
  
  return reply.send({ message: 'Invitation sent' });
});
```

### After User Registration

```typescript
async function registerUser(userData) {
  // Create user in database
  const user = await createUser(userData);
  
  // Send welcome email (don't await - send in background)
  emailService.sendWelcome({
    to: user.email,
    name: user.name,
  }).catch(err => console.error('Failed to send welcome email:', err));
  
  return user;
}
```

## Email Templates

The service includes three pre-built responsive email templates:

1. **Invitation Email** - Beautiful gradient header, clear CTA button
2. **Password Reset** - Security warnings, expiry notice
3. **Welcome Email** - Feature highlights, getting started guide

All templates are:
- Mobile responsive
- Accessible
- Branded with Innozverse colors
- Include both HTML and plain text versions

## Testing

### Development Mode

When `MAILGUN_ENABLED=false`, emails are logged to console instead of being sent:

```
Email sending is disabled. Email that would be sent:
{
  to: 'user@example.com',
  subject: 'Test Email'
}
```

### Testing with Mailgun Sandbox

For development, use Mailgun's sandbox domain:
1. Domain: `sandbox[hash].mailgun.org`
2. Only sends to authorized recipients
3. No credit card required

## Error Handling

Always check the result:

```typescript
const result = await emailService.send({ ... });

if (!result.success) {
  // Handle error
  console.error('Email failed:', result.error);
  // Log to error tracking service
  // Notify admin
  // Show user-friendly message
}
```

## Best Practices

1. **Don't await in critical paths** - Send emails in background
2. **Always provide both HTML and text** - Better deliverability
3. **Use descriptive subjects** - Avoid spam filters
4. **Include unsubscribe links** - For marketing emails
5. **Monitor bounce rates** - Clean your email list
6. **Use templates** - Maintain consistent branding

## Troubleshooting

### Email not sending?

1. Check `MAILGUN_ENABLED=true` in `.env`
2. Verify API key and domain are correct
3. Check Mailgun dashboard for errors
4. Ensure domain is verified in Mailgun
5. Check application logs for errors

### Emails going to spam?

1. Verify your domain with SPF/DKIM records
2. Warm up your sending domain
3. Avoid spam trigger words
4. Include plain text version
5. Test with Mail Tester

## Security Notes

- Never commit `.env` file with real credentials
- Use environment variables for all secrets
- Rotate API keys periodically
- Limit API key permissions in Mailgun
- Validate all email addresses before sending

## Production Checklist

- [ ] Valid Mailgun account with verified domain
- [ ] SPF and DKIM records configured
- [ ] Environment variables set in production
- [ ] Error logging configured
- [ ] Email templates tested across devices
- [ ] Unsubscribe mechanism implemented (if needed)
- [ ] Rate limiting configured
- [ ] Bounce handling implemented

## Support

- Mailgun Docs: https://documentation.mailgun.com
- Issue Tracker: https://github.com/lastcow/innozverse/issues
