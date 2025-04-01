package org.lei.bill_buddy.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "histories")
public class History {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Lob
    @Column(name = "user_lent_json", columnDefinition = "TEXT")
    private String userLentJson;

    @Lob
    @Column(name = "user_paid_json", columnDefinition = "TEXT")
    private String userPaidJson;

    @Lob
    @Column(name = "member_ids", columnDefinition = "TEXT")
    private String memberIds;

    @Lob
    @Column(name = "expense_ids", columnDefinition = "TEXT")
    private String expenseIds;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

}
