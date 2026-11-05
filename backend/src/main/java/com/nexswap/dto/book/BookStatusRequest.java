package com.nexswap.dto.book;

import com.nexswap.entity.BookStatus;
import jakarta.validation.constraints.NotNull;

public record BookStatusRequest(
        @NotNull(message = "Status is required")
        BookStatus status
) {
}
