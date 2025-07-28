"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const crypto_1 = __importDefault(require("crypto"));
// Email configuration
const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
    }
};
// Create transporter
const transporter = nodemailer_1.default.createTransport(emailConfig);
// Store verification tokens (in production, use Redis or database)
const verificationTokens = {};
class EmailService {
    // Generate verification token
    static generateToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    // Store verification token
    static storeToken(email, token, type) {
        verificationTokens[email] = {
            token,
            expires: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            type
        };
    }
    // Verify token
    static verifyToken(email, token, type) {
        const stored = verificationTokens[email];
        if (!stored || stored.token !== token || stored.type !== type || stored.expires < Date.now()) {
            return false;
        }
        delete verificationTokens[email]; // Remove after use
        return true;
    }
    // Send email verification
    static sendEmailVerification(email, companyName, token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
                const mailOptions = {
                    from: `"CallDocker" <${emailConfig.auth.user}>`,
                    to: email,
                    subject: 'Verify Your CallDocker Account',
                    html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(120deg, #00e6ef 0%, #2E73FF 100%); padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">Welcome to CallDocker!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Complete your company registration</p>
            </div>
            
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333; margin-bottom: 20px;">Hello!</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Thank you for registering <strong>${companyName}</strong> with CallDocker. 
                To complete your registration and start using our call center platform, 
                please verify your email address.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: linear-gradient(120deg, #00e6ef 0%, #2E73FF 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold; 
                          display: inline-block;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #2E73FF;">${verificationUrl}</a>
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">
                  This verification link will expire in 24 hours. If you didn't create a CallDocker account, 
                  you can safely ignore this email.
                </p>
              </div>
            </div>
          </div>
        `
                };
                yield transporter.sendMail(mailOptions);
                return true;
            }
            catch (error) {
                console.error('Email verification error:', error);
                return false;
            }
        });
    }
    // Send password reset email
    static sendPasswordReset(email, username, token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
                const mailOptions = {
                    from: `"CallDocker" <${emailConfig.auth.user}>`,
                    to: email,
                    subject: 'Reset Your CallDocker Password',
                    html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(120deg, #00e6ef 0%, #2E73FF 100%); padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">Password Reset Request</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">CallDocker Account Security</p>
            </div>
            
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333; margin-bottom: 20px;">Hello ${username}!</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                We received a request to reset the password for your CallDocker account. 
                Click the button below to create a new password.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: linear-gradient(120deg, #00e6ef 0%, #2E73FF 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold; 
                          display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #2E73FF;">${resetUrl}</a>
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">
                  This reset link will expire in 24 hours. If you didn't request a password reset, 
                  you can safely ignore this email and your password will remain unchanged.
                </p>
              </div>
            </div>
          </div>
        `
                };
                yield transporter.sendMail(mailOptions);
                return true;
            }
            catch (error) {
                console.error('Password reset email error:', error);
                return false;
            }
        });
    }
    // Send company UUID reminder
    static sendCompanyUuidReminder(email, companyName, uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mailOptions = {
                    from: `"CallDocker" <${emailConfig.auth.user}>`,
                    to: email,
                    subject: 'Your CallDocker Company UUID',
                    html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(120deg, #00e6ef 0%, #2E73FF 100%); padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">Company UUID Reminder</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">CallDocker Account Information</p>
            </div>
            
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333; margin-bottom: 20px;">Hello!</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                You requested a reminder of your Company UUID for <strong>${companyName}</strong>.
                Here's your unique identifier:
              </p>
              
              <div style="background: #fff; border: 2px solid #2E73FF; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Company UUID:</p>
                <p style="color: #2E73FF; font-family: monospace; font-size: 18px; font-weight: bold; margin: 0; word-break: break-all;">
                  ${uuid}
                </p>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Use this UUID to:
              </p>
              <ul style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                <li>Log in to your CallDocker dashboard</li>
                <li>Share with agents for their login</li>
                <li>Embed the widget on your website</li>
                <li>Access your call center features</li>
              </ul>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">
                  If you didn't request this reminder, please contact our support team immediately.
                </p>
              </div>
            </div>
          </div>
        `
                };
                yield transporter.sendMail(mailOptions);
                return true;
            }
            catch (error) {
                console.error('Company UUID reminder error:', error);
                return false;
            }
        });
    }
    // Send agent invitation
    static sendAgentInvitation(email, agentUsername, companyName, uuid, tempPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/agent-login?companyUuid=${uuid}&username=${agentUsername}`;
                const mailOptions = {
                    from: `"CallDocker" <${emailConfig.auth.user}>`,
                    to: email,
                    subject: 'Welcome to CallDocker - Agent Account Created',
                    html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(120deg, #00e6ef 0%, #2E73FF 100%); padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">Welcome to CallDocker!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Your agent account has been created</p>
            </div>
            
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333; margin-bottom: 20px;">Hello!</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                An administrator from <strong>${companyName}</strong> has created an agent account for you on CallDocker. 
                You can now log in and start handling calls!
              </p>
              
              <div style="background: #fff; border: 2px solid #2E73FF; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #333; margin: 0 0 15px 0;">Your Login Information:</h3>
                <p style="color: #666; margin: 5px 0;"><strong>Company UUID:</strong> <span style="font-family: monospace; color: #2E73FF;">${uuid}</span></p>
                <p style="color: #666; margin: 5px 0;"><strong>Username:</strong> <span style="font-family: monospace; color: #2E73FF;">${agentUsername}</span></p>
                <p style="color: #666; margin: 5px 0;"><strong>Temporary Password:</strong> <span style="font-family: monospace; color: #2E73FF;">${tempPassword}</span></p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" 
                   style="background: linear-gradient(120deg, #00e6ef 0%, #2E73FF 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold; 
                          display: inline-block;">
                  Login to Dashboard
                </a>
              </div>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  <strong>Important:</strong> Please change your password after your first login for security.
                </p>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">
                  If you have any questions, please contact your administrator or our support team.
                </p>
              </div>
            </div>
          </div>
        `
                };
                yield transporter.sendMail(mailOptions);
                return true;
            }
            catch (error) {
                console.error('Agent invitation error:', error);
                return false;
            }
        });
    }
}
exports.EmailService = EmailService;
