const nodemailer = require("nodemailer");

exports.sendResetEmail = async ({ to, resetURL }) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Brand Colors (You can change these)
        const brandColor = "#2563EB"; // Blue-600 (matches your React app)
        const backgroundColor = "#F3F4F6"; // Gray-100

        await transporter.sendMail({
            from: `Tekna Support <${process.env.EMAIL}>`, // Professional sender name
            to,
            subject: "Reset your password", // Clear subject line
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    /* Mobile responsive styles */
                    @media screen and (max-width: 600px) {
                        .content-table { width: 100% !important; }
                        .padding-box { padding: 20px !important; }
                    }
                </style>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: ${backgroundColor};">
                
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${backgroundColor}; width: 100%;">
                    <tr>
                        <td align="center" style="padding: 40px 0;">
                            
                            <table class="content-table" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                                
                                <tr>
                                    <td style="background-color: ${brandColor}; padding: 30px; text-align: center;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">TEKNA</h1>
                                    </td>
                                </tr>

                                <tr>
                                    <td class="padding-box" style="padding: 40px;">
                                        <h2 style="color: #111827; font-size: 20px; margin-top: 0; margin-bottom: 16px;">Password Reset Request</h2>
                                        
                                        <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                                            Hello,
                                            <br><br>
                                            We received a request to reset the password for your account. If you didn't make this request, you can safely ignore this email.
                                        </p>

                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td align="center" style="padding-bottom: 24px;">
                                                    <a href="${resetURL}" style="background-color: ${brandColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; mso-padding-alt: 0;">
                                                        <span style="mso-text-raise: 15pt;">Reset Password</span>
                                                        </a>
                                                </td>
                                            </tr>
                                        </table>

                                        <p style="color: #4B5563; font-size: 14px; line-height: 24px; margin-bottom: 0;">
                                            This password reset link will expire in <strong>10 minutes</strong>.
                                        </p>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="background-color: #F9FAFB; padding: 30px; border-top: 1px solid #E5E7EB;">
                                        <p style="color: #6B7280; font-size: 12px; line-height: 18px; margin: 0 0 10px 0;">
                                            If the button above doesn't work, copy and paste the following link into your browser:
                                        </p>
                                        <p style="word-break: break-all; font-size: 12px; color: ${brandColor}; margin: 0;">
                                            <a href="${resetURL}" style="color: ${brandColor}; text-decoration: none;">${resetURL}</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="padding-top: 24px; text-align: center;">
                                        <p style="color: #9CA3AF; font-size: 12px;">&copy; ${new Date().getFullYear()} Tekna Window Systems. All rights reserved.</p>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>
                </table>
            </body>
            </html>
            `,
        });

        return true;
    } catch (err) {
        console.error("Nodemailer error:", err);
        return false;
    }
};
