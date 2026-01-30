# Email Verification Setup

This application includes email verification functionality for user registration. Currently, it's set up in demo mode with visual notifications.

## Current Demo Mode ✅

The app is currently running in **demo mode** which:
- Shows a beautiful popup notification with the verification code
- Displays the OTP prominently in the UI
- Also logs the code to the console
- Perfect for testing and development

## Setting Up Real Email Sending 📧

To send actual emails to users, follow these steps:

### 1. Create EmailJS Account
1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Create Email Service
1. In EmailJS dashboard, click "Email Services"
2. Add a new email service (Gmail, Outlook, etc.)
3. Follow the connection wizard
4. Note your **Service ID**

### 3. Create Email Template
1. Go to "Email Templates"
2. Create a new template with this content:

**Subject:** `Arthasetu Banking - Email Verification`

**HTML Content:**
```html
<h2>Email Verification</h2>
<p>Hello {{to_name}},</p>
<p>Your verification code for Arthasetu Banking is:</p>
<div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
  {{verification_code}}
</div>
<p>This code will expire in 5 minutes.</p>
<p><small>If you didn't request this code, please ignore this email.</small></p>
<p>Thank you,<br>Arthasetu Banking Team</p>
```

3. Note your **Template ID**

### 4. Get Public Key
1. Go to Account → API Keys
2. Copy your **Public Key**

### 5. Update Configuration
Edit `services/emailConfig.ts`:

```typescript
export const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'your_actual_public_key_here',
  SERVICE_ID: 'your_actual_service_id_here', 
  TEMPLATE_ID: 'your_actual_template_id_here'
};

export const USE_MOCK_EMAIL = false; // Change to false for real emails
```

### 6. Restart the App
```bash
npm run dev
```

## Testing Email Verification

### Demo Mode (Current)
1. Enter any email address
2. Click "Verify Email"
3. See the verification code in the popup notification
4. Enter the code to complete verification

### Production Mode
1. Enter a real email address
2. Click "Verify Email"
3. Check your email inbox for the verification code
4. Enter the code to complete verification

## Security Features

- ✅ Email format validation
- ✅ Duplicate email prevention
- ✅ Disposable email blocking
- ✅ OTP expiration (5 minutes)
- ✅ Rate limiting (can be added)
- ✅ Case-insensitive email handling

## Troubleshooting

**Email not sending?**
- Check EmailJS configuration
- Verify email service is connected
- Check template variables match
- Ensure all IDs are correct

**OTP not working?**
- Check if OTP expired (5 minutes)
- Ensure correct email is being used
- Clear browser localStorage and try again

**Demo mode not showing?**
- Check browser console for errors
- Ensure popup notifications aren't blocked
- Refresh the page and try again

## Cost Considerations

EmailJS free tier includes:
- 200 emails per month
- 2 email services
- Limited templates

For production use, consider upgrading to a paid plan or using other email services like:
- SendGrid
- AWS SES
- Mailgun
- Resend
