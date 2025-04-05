package org.lei.bill_buddy.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.lei.bill_buddy.DTO.EmailDTO;
import org.lei.bill_buddy.config.RabbitMQConfig;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class EmailConsumer {
    private final JavaMailSender mailSender;

    @Value("${spring.mail.name}")
    private String fromEmail;

    @Value("#{${reset-password.code.expiration}}")
    private long codeExpirationMillis;

    @RabbitListener(queues = RabbitMQConfig.EMAIL_QUEUE_NAME)
    public void handleMessage(EmailDTO email) {
        try {
            if ("verify".equalsIgnoreCase(email.getType())) {
                sendVerificationCodeEmail(
                        email.getGivenName(),
                        email.getToEmail(),
                        email.getCode()
                );
            } else if ("invite".equalsIgnoreCase(email.getType())) {
                sendInvitationEmail(
                        email.getGroupName(),
                        email.getToEmail(),
                        email.getInviteLink()
                );
            } else {
                System.err.println("Unknown email type: " + email.getType());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
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

    public void sendVerificationCodeEmail(String givenName, String toEmail, String code) throws MessagingException, IOException {
        String templatePath = "templates/verification-code-email.html";
        Resource resource = new ClassPathResource(templatePath);
        String htmlContent = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

        htmlContent = htmlContent.replace("{{givenName}}", givenName);
        htmlContent = htmlContent.replace("{{verificationCode}}", code);
        htmlContent = htmlContent.replace("{{expirationTime}}", Long.toString(codeExpirationMillis / 1000 / 60));
        sendEmail(toEmail, "Reset Password Link", htmlContent);
    }
}

