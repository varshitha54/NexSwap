package com.nexswap.repository;

import com.nexswap.entity.Book;
import com.nexswap.entity.BookCategory;
import com.nexswap.entity.BookStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long>, JpaSpecificationExecutor<Book> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Book b WHERE b.id = :id")
    Optional<Book> findByIdForUpdate(@Param("id") Long id);

    List<Book> findBySellerIdAndStatusNotOrderByCreatedAtDesc(Long sellerId, BookStatus status);

    List<Book> findTop8ByStatusOrderByCreatedAtDesc(BookStatus status);

    List<Book> findTop5BySellerIdAndStatusNotOrderByCreatedAtDesc(Long sellerId, BookStatus status);

    long countBySellerIdAndStatusNot(Long sellerId, BookStatus status);

    long countBySellerIdAndStatus(Long sellerId, BookStatus status);

    long countByStatus(BookStatus status);

    long countByStatusNot(BookStatus status);

    long countByStatusAndListingType(BookStatus status, com.nexswap.entity.ListingType listingType);

    @Query("""
            SELECT b.category AS category, COUNT(b) AS total
            FROM Book b
            WHERE b.status = :status
            GROUP BY b.category
            ORDER BY b.category
            """)
    List<CategoryCount> countByCategory(@Param("status") BookStatus status);

    @Query("""
            SELECT b.category AS category, COUNT(b) AS total
            FROM Book b
            WHERE b.status = :status AND b.seller.id = :sellerId
            GROUP BY b.category
            ORDER BY b.category
            """)
    List<CategoryCount> countByCategoryForSeller(@Param("status") BookStatus status,
                                                 @Param("sellerId") Long sellerId);

    interface CategoryCount {
        BookCategory getCategory();

        long getTotal();
    }
}
