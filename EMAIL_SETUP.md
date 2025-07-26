# Email Authentication Setup Guide

## Overview
CallDocker now includes a robust email authentication system with:
- Email verification for company registration
- Password reset functionality
- Company UUID reminders
- Agent invitation emails

## Email Configuration

### 1. Create Environment File
Create a `.env` file in the `backend` directory with the following variables:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL for email links
FRONTEND_URL=http://localhost:5173

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 2. Gmail Setup (Recommended)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `SMTP_PASS`

### 3. Other Email Providers
You can use any SMTP provider. Common configurations:

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

**Yahoo:**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
```

**Custom SMTP:**
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
```

## Features

### Company Registration Flow
1. User fills out registration form
2. System sends verification email
3. User clicks verification link
4. Account is activated and user is logged in

### Password Reset Flow
1. User clicks "Forgot Password"
2. System sends reset email with token
3. User clicks reset link
4. User sets new password

### Agent Invitation Flow
1. Admin creates agent account with email
2. System sends invitation email with login details
3. Agent can log in with temporary password
4. Agent should change password on first login

### Company UUID Reminder
1. User clicks "Forgot UUID"
2. System sends email with company UUID
3. User can use UUID to log in

## Testing

### Test Email Configuration
1. Start the backend server
2. Try registering a new company
3. Check your email for verification link
4. Verify the account

### Development Testing
For development, you can use:
- Gmail with App Password
- Mailtrap.io (for testing)
- Ethereal Email (for testing)

## Security Notes

1. **JWT Secret**: Use a strong, random secret in production
2. **Email Credentials**: Never commit email credentials to version control
3. **Rate Limiting**: Email endpoints are rate-limited to prevent abuse
4. **Token Expiration**: Verification tokens expire after 24 hours

## Troubleshooting

### Common Issues

1. **"Failed to send verification email"**
   - Check SMTP credentials
   - Verify email provider settings
   - Check firewall/network settings

2. **"Invalid or expired token"**
   - Tokens expire after 24 hours
   - Request a new verification email

3. **"Company already exists"**
   - Email is already registered
   - Use "Forgot UUID" to find existing account

### Debug Mode
Enable debug logging by adding to `.env`:
```env
DEBUG=true
```

## Production Deployment

1. Use a production email service (SendGrid, Mailgun, etc.)
2. Set up proper DNS records (SPF, DKIM, DMARC)
3. Use environment variables for all sensitive data
4. Enable HTTPS for all email links
5. Set up email monitoring and alerts 