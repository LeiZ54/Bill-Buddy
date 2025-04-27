package org.lei.bill_buddy.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.lei.bill_buddy.enums.ActionType;
import org.lei.bill_buddy.enums.ObjectType;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "activities")
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActionType action;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ObjectType objectType;

    @Column(nullable = false)
    private Long objectId;

    @Column(nullable = false)
    private String template;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String params;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
