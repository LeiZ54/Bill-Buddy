package org.lei.bill_buddy.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.lei.bill_buddy.enums.Currency;
import org.lei.bill_buddy.enums.GroupType;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "groups_table")
public class Group {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User creator;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private GroupType type;

    @Column(name = "default_currency", nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    private Currency defaultCurrency = Currency.USD;

    @Column(nullable = false)
    private Boolean deleted = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
