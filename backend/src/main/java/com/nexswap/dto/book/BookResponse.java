package com.nexswap.dto.book;

import com.nexswap.entity.Book;
import com.nexswap.entity.BookCategory;
import com.nexswap.entity.BookCondition;
import com.nexswap.entity.BookStatus;
import com.nexswap.entity.ListingType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookResponse(
        Long id,
        String title,
        String author,
        String description,
        BookCategory category,
        BigDecimal price,
        BookCondition condition,
        ListingType listingType,
        BookStatus status,
        String imageUrl,
        SellerSummary seller,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static BookResponse from(Book book) {
        return new BookResponse(
                book.getId(),
                book.getTitle(),
                book.getAuthor(),
                book.getDescription(),
                book.getCategory(),
                book.getPrice(),
                book.getCondition(),
                book.getListingType(),
                book.getStatus(),
                book.getImageUrl(),
                SellerSummary.from(book.getSeller()),
                book.getCreatedAt(),
                book.getUpdatedAt()
        );
    }
}
