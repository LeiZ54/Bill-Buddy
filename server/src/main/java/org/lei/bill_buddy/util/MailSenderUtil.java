package org.lei.bill_buddy.util;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
public class MailSenderUtil {

    private final JavaMailSender mailSender;
    @Value("${spring.mail.username}")
    private String fromEmail;

    @Autowired
    public MailSenderUtil(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    private void sendEmail(String toEmail, String subject, String content) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromEmail);
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(content, true);
        mailSender.send(message);
    }

    public void sendInvitationEmail(String groupName, String toEmail, String inviteLink) throws MessagingException, IOException {
        String templatePath = "templates/invite-email.html";
        Resource resource = new ClassPathResource(templatePath);
        String htmlContent = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

        htmlContent = htmlContent.replace("{{groupName}}", groupName);
        htmlContent = htmlContent.replace("{{inviteLink}}", inviteLink);
        sendEmail(toEmail, "You have been invited to join the group: " + groupName, htmlContent);
    }

    public void sendVerificationCodeEmail(String username, String toEmail, String code) throws MessagingException, IOException {
        String templatePath = "templates/verification-code-email.html";
        Resource resource = new ClassPathResource(templatePath);
        String htmlContent = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

        htmlContent = htmlContent.replace("{{username}}", username);
        htmlContent = htmlContent.replace("{{verificationCode}}", code);
        sendEmail(toEmail, "Reset Password Link", htmlContent);
    }
}
