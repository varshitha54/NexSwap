package com.nexswap.dto.exchange;

import com.nexswap.entity.Book;
import com.nexswap.entity.BookCategory;
import com.nexswap.entity.BookCondition;
import com.nexswap.entity.BookStatus;
import com.nexswap.entity.ListingType;

import java.math.BigDecimal;

public record BookSummary(
        Long id,
        String title,
        String author,
        String imageUrl,
        BigDecimal price,
        BookCategory category,
        BookCondition condition,
        ListingType listingType,
        BookStatus status
) {
    public static BookSummary from(Book book) {
        if (book == null) {
            return null;
        }
        return new BookSummary(
                book.getId(),
                book.getTitle(),
                book.getAuthor(),
                book.getImageUrl(),
                book.getPrice(),
                book.getCategory(),
                book.getCondition(),
                book.getListingType(),
                book.getStatus()
        );
    }
}
