package com.invox.tenant.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:studiopixelaura.io@gmail.com}")
    private String fromEmail;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public void sendWorkspaceActivationEmail(String toEmail, String adminName, String companyName, String subdomain) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "INVOX SaaS Platform");
            helper.setTo(toEmail);
            helper.setSubject(String.format("Welcome to INVOX - Activate %s Workspace", companyName));

            String loginUrl = String.format("%s/login?org=%s", frontendUrl, subdomain);

            String html = String.format("""
                <div style='font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 600px; margin: auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; color: #1e293b;'>
                    <div style='margin-bottom: 24px;'>
                        <span style='display: inline-block; padding: 6px 14px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; font-weight: bold; border-radius: 8px; font-size: 14px;'>⚡ INVOX SaaS</span>
                    </div>
                    <h2 style='color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 700;'>Your B2B Workspace is Ready!</h2>
                    <p style='color: #475569; font-size: 15px; line-height: 1.6;'>
                        Hello <strong>%s</strong>,<br><br>
                        Your multi-tenant invoicing organization workspace for <strong>%s</strong> has been provisioned successfully.
                    </p>
                    <div style='background-color: #f8fafc; padding: 18px; border-radius: 14px; margin: 24px 0; border: 1px solid #e2e8f0;'>
                        <p style='margin: 6px 0; font-size: 13px; color: #64748b;'><strong>Company:</strong> %s</p>
                        <p style='margin: 6px 0; font-size: 13px; color: #64748b;'><strong>Workspace Domain:</strong> <span style='color: #6366f1; font-family: monospace; font-weight: bold;'>%s.invox.local</span></p>
                        <p style='margin: 6px 0; font-size: 13px; color: #64748b;'><strong>Assigned Role:</strong> <span style='background-color: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;'>ADMINISTRATOR</span></p>
                    </div>
                    <p style='color: #475569; font-size: 14px; line-height: 1.6;'>
                        To activate your account and establish your password, click the button below to access the sign-in portal:
                    </p>
                    <div style='text-align: center; margin: 28px 0;'>
                        <a href='%s' style='background: linear-gradient(135deg, #6366f1 0%%, #8b5cf6 100%%); color: #ffffff; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);'>
                            Set Password & Sign In →
                        </a>
                    </div>
                    <hr style='border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;' />
                    <p style='color: #94a3b8; font-size: 12px; text-align: center; margin: 0;'>
                        © 2026 INVOX SaaS Platform. Powered by WSO2 API Manager & Asgardeo IAM.
                    </p>
                </div>
            """, adminName, companyName, companyName, subdomain, loginUrl);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Workspace activation email successfully sent to '{}'", toEmail);
        } catch (Exception e) {
            log.error("Failed to send workspace activation email to '{}': {}", toEmail, e.getMessage(), e);
        }
    }

    public void sendTeamInvitationEmail(String toEmail, String inviteeName, String companyName, String subdomain, String role) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "INVOX SaaS Platform");
            helper.setTo(toEmail);
            helper.setSubject(String.format("You're invited to join %s on INVOX", companyName));

            String loginUrl = String.format("%s/login?org=%s", frontendUrl, subdomain);

            String html = String.format("""
                <div style='font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 600px; margin: auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; color: #1e293b;'>
                    <div style='margin-bottom: 24px;'>
                        <span style='display: inline-block; padding: 6px 14px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; font-weight: bold; border-radius: 8px; font-size: 14px;'>⚡ INVOX SaaS</span>
                    </div>
                    <h2 style='color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 700;'>You're Invited to Join %s!</h2>
                    <p style='color: #475569; font-size: 15px; line-height: 1.6;'>
                        Hello <strong>%s</strong>,<br><br>
                        You have been invited to join the <strong>%s</strong> organization workspace on INVOX as an <strong>%s</strong>.
                    </p>
                    <div style='background-color: #f8fafc; padding: 18px; border-radius: 14px; margin: 24px 0; border: 1px solid #e2e8f0;'>
                        <p style='margin: 6px 0; font-size: 13px; color: #64748b;'><strong>Organization:</strong> %s</p>
                        <p style='margin: 6px 0; font-size: 13px; color: #64748b;'><strong>Assigned Role:</strong> <span style='background-color: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;'>%s</span></p>
                        <p style='margin: 6px 0; font-size: 13px; color: #64748b;'><strong>Workspace Domain:</strong> <span style='color: #6366f1; font-family: monospace; font-weight: bold;'>%s.invox.local</span></p>
                    </div>
                    <div style='text-align: center; margin: 32px 0;'>
                        <a href='%s' style='background: linear-gradient(135deg, #6366f1 0%%, #8b5cf6 100%%); color: #ffffff; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);'>
                            Accept Invitation & Join Workspace →
                        </a>
                    </div>
                    <hr style='border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;' />
                    <p style='color: #94a3b8; font-size: 12px; text-align: center; margin: 0;'>
                        © 2026 INVOX SaaS Platform. Powered by WSO2 API Manager & Asgardeo IAM.
                    </p>
                </div>
            """, companyName, inviteeName, companyName, role, companyName, role, subdomain, loginUrl);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Team invitation email successfully sent to '{}'", toEmail);
        } catch (Exception e) {
            log.error("Failed to send team invitation email to '{}': {}", toEmail, e.getMessage(), e);
        }
    }
}
