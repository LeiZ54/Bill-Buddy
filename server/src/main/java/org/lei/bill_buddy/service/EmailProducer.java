package org.lei.bill_buddy.service;

import lombok.RequiredArgsConstructor;
import org.lei.bill_buddy.DTO.EmailDTO;
import org.lei.bill_buddy.config.RabbitMQConfig;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailProducer {
    private final RabbitTemplate rabbitTemplate;

    public void sendEmail(EmailDTO email) {
        rabbitTemplate.convertAndSend(RabbitMQConfig.EMAIL_EXCHANGE_NAME, RabbitMQConfig.EMAIL_ROUTING_KEY, email);
    }
}

