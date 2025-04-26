package org.lei.bill_buddy.model;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.lei.bill_buddy.enums.ExpenseType;
import org.lei.bill_buddy.enums.RecurrenceUnit;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "recurring_expenses")
public class RecurringExpense {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payer_id", nullable = false)
    private User payer;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExpenseType type;

    @Column(nullable = false)
    private Boolean deleted = false;

    @Column
    private String description;

    @Column(name = "participant_ids", nullable = false, columnDefinition = "TEXT")
    private String participantIdsJson;

    @Column(name = "share_amounts", nullable = false, columnDefinition = "TEXT")
    private String shareAmountsJson;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "recurrence_unit")
    @Enumerated(EnumType.STRING)
    private RecurrenceUnit recurrenceUnit;

    @Column(name = "recurrence_interval")
    private Integer recurrenceInterval;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Transient
    private List<Long> participantIds = Collections.emptyList();

    @Transient
    private List<BigDecimal> shareAmounts = Collections.emptyList();

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @PrePersist
    @PreUpdate
    public void serializeLists() {
        try {
            if (participantIds != null) {
                this.participantIdsJson = objectMapper.writeValueAsString(participantIds);
            }
            if (shareAmounts != null) {
                this.shareAmountsJson = objectMapper.writeValueAsString(shareAmounts);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize participantIds or shareAmounts", e);
        }
    }

    @PostLoad
    public void deserializeLists() {
        try {
            if (participantIdsJson != null) {
                this.participantIds = objectMapper.readValue(participantIdsJson, new TypeReference<List<Long>>() {
                });
            }
            if (shareAmountsJson != null) {
                this.shareAmounts = objectMapper.readValue(shareAmountsJson, new TypeReference<List<BigDecimal>>() {
                });
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to deserialize participantIds or shareAmounts", e);
        }
    }

}
