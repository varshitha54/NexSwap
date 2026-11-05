package com.nexswap.dto.publicapi;

public record PublicStatsResponse(
        long availableBooks,
        long registeredStudents,
        long completedExchanges
) {
}
