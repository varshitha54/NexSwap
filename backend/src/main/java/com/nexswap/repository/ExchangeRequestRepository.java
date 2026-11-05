package com.nexswap.repository;

import com.nexswap.entity.ExchangeRequest;
import com.nexswap.entity.ExchangeStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ExchangeRequestRepository extends JpaRepository<ExchangeRequest, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"book", "requester", "owner", "offeredBook"})
    @Query("SELECT e FROM ExchangeRequest e WHERE e.id = :id")
    Optional<ExchangeRequest> findByIdForUpdate(@Param("id") Long id);

    @EntityGraph(attributePaths = {"book", "requester", "owner", "offeredBook"})
    List<ExchangeRequest> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    @EntityGraph(attributePaths = {"book", "requester", "owner", "offeredBook"})
    List<ExchangeRequest> findByRequesterIdOrderByCreatedAtDesc(Long requesterId);

    @EntityGraph(attributePaths = {"book", "requester", "owner", "offeredBook"})
    List<ExchangeRequest> findTop5ByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    @EntityGraph(attributePaths = {"book", "requester", "owner", "offeredBook"})
    List<ExchangeRequest> findTop5ByRequesterIdOrderByCreatedAtDesc(Long requesterId);

    @EntityGraph(attributePaths = {"book", "requester", "owner", "offeredBook"})
    List<ExchangeRequest> findByBookIdAndStatus(Long bookId, ExchangeStatus status);

    @EntityGraph(attributePaths = {"book", "requester", "owner", "offeredBook"})
    List<ExchangeRequest> findByOfferedBookIdAndStatus(Long offeredBookId, ExchangeStatus status);

    boolean existsByBookIdAndRequesterIdAndStatus(Long bookId, Long requesterId, ExchangeStatus status);

    boolean existsByBookIdAndStatus(Long bookId, ExchangeStatus status);

    long countByOwnerIdAndStatus(Long ownerId, ExchangeStatus status);

    long countByRequesterIdAndStatus(Long requesterId, ExchangeStatus status);

    long countByStatus(ExchangeStatus status);

    @Query("""
            SELECT COUNT(e) FROM ExchangeRequest e
            WHERE e.status = :status
              AND (e.owner.id = :userId OR e.requester.id = :userId)
            """)
    long countCompletedForUser(@Param("status") ExchangeStatus status, @Param("userId") Long userId);

    @Query("""
            SELECT COUNT(e) FROM ExchangeRequest e
            WHERE e.status = :status AND e.owner.id = :ownerId
              AND e.book.id = :bookId
            """)
    long countByBookAndOwnerAndStatus(@Param("bookId") Long bookId,
                                      @Param("ownerId") Long ownerId,
                                      @Param("status") ExchangeStatus status);

    @Query("""
            SELECT COUNT(e) FROM ExchangeRequest e
            WHERE (e.book.id = :bookId OR e.offeredBook.id = :bookId)
              AND e.status IN :statuses
            """)
    long countBookInOpenExchanges(@Param("bookId") Long bookId,
                                  @Param("statuses") Collection<ExchangeStatus> statuses);
}
