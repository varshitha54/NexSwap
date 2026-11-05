package com.nexswap.dto.book;

import org.springframework.data.domain.Page;

import java.util.List;

public record BookPageResponse(
        List<BookResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last,
        boolean first
) {
    public static BookPageResponse from(Page<BookResponse> page) {
        return new BookPageResponse(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast(),
                page.isFirst()
        );
    }
}
