package com.nexswap.dto.exchange;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ExchangeCreateRequest(
        @NotNull(message = "Book is required")
        Long bookId,

        Long offeredBookId,

        @Size(max = 1000, message = "Message must be at most 1000 characters")
        String message
) {
}
