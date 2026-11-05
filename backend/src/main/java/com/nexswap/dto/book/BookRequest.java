package com.nexswap.dto.book;

import com.nexswap.entity.BookCategory;
import com.nexswap.entity.BookCondition;
import com.nexswap.entity.ListingType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record BookRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 160, message = "Title must be at most 160 characters")
        String title,

        @NotBlank(message = "Author is required")
        @Size(max = 120, message = "Author must be at most 120 characters")
        String author,

        @NotBlank(message = "Description is required")
        @Size(max = 5000, message = "Description must be at most 5000 characters")
        String description,

        @NotNull(message = "Category is required")
        BookCategory category,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.00", message = "Price cannot be negative")
        @Digits(integer = 8, fraction = 2, message = "Price must have at most 2 decimal places")
        BigDecimal price,

        @NotNull(message = "Book condition is required")
        BookCondition condition,

        @NotNull(message = "Listing type is required")
        ListingType listingType
) {
}
