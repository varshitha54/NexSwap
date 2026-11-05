package com.nexswap.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "exchange_requests", indexes = {
        @Index(name = "idx_exchange_book", columnList = "book_id"),
        @Index(name = "idx_exchange_requester", columnList = "requester_id"),
        @Index(name = "idx_exchange_owner", columnList = "owner_id"),
        @Index(name = "idx_exchange_status", columnList = "status"),
        @Index(name = "idx_exchange_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExchangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_id", nullable = false, foreignKey = @ForeignKey(name = "fk_exchange_book"))
    private Book book;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requester_id", nullable = false, foreignKey = @ForeignKey(name = "fk_exchange_requester"))
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false, foreignKey = @ForeignKey(name = "fk_exchange_owner"))
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offered_book_id", foreignKey = @ForeignKey(name = "fk_exchange_offered_book"))
    private Book offeredBook;

    @Column(length = 1000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ExchangeStatus status = ExchangeStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
