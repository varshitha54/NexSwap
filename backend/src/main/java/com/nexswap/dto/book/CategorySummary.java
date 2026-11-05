package com.nexswap.dto.book;

import com.nexswap.entity.BookCategory;

public record CategorySummary(
        BookCategory category,
        long count
) {
}
