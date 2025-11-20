const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendResetEmail = async ({ to, resetURL }) => {
    console.log("🔥 Resend API KEY:", process.env.RESEND_API_KEY);

    // Brand Colors
    const brandColor = "#2563eb"; // Blue-600
    const backgroundColor = "#f3f4f6"; // Gray-100

    try {
        await resend.emails.send({
            from: "Tekna Support <onboarding@resend.dev>",
            to,
            subject: "Reset your Tekna password",
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                <title>Reset Password</title>
                <style>
                    body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: ${backgroundColor}; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                    .header { background-color: #ffffff; padding: 30px 40px; text-align: center; border-bottom: 1px solid #e5e7eb; }
                    .logo { font-size: 24px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; text-decoration: none; }
                    .content { padding: 40px 40px; color: #334155; line-height: 1.6; }
                    .button-container { text-align: center; margin: 30px 0; }
                    .button { background-color: ${brandColor}; color: #ffffff !important; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 16px; }
                    .footer { background-color: #f8fafc; padding: 20px 40px; text-align: center; font-size: 12px; color: #94a3b8; }
                    .link-fallback { color: ${brandColor}; word-break: break-all; font-size: 13px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <a href="#" class="logo">TEKNA</a>
                    </div>

                    <div class="content">
                        <h2 style="margin-top: 0; color: #0f172a;">Password Reset Request</h2>
                        <p>Hello,</p>
                        <p>We received a request to reset the password for your <strong>Tekna</strong> account. If you made this request, please click the button below:</p>
                        
                        <div class="button-container">
                            <a href="${resetURL}" class="button" target="_blank">Reset Password</a>
                        </div>

                        <p style="font-size: 14px; color: #64748b;">This link will expire in <strong>10 minutes</strong> for security reasons.</p>
                        
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                        
                        <p style="font-size: 13px; color: #64748b;">
                            If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
                        </p>

                        <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">
                            Button not working? Copy and paste this link into your browser:<br>
                            <a href="${resetURL}" class="link-fallback">${resetURL}</a>
                        </p>
                    </div>

                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Tekna Window Systems. All rights reserved.</p>
                        <p>This is an automated message, please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
            `,
        });

        return true;
    } catch (err) {
        console.error("Email sending error:", err);
        return false;
    }
};
