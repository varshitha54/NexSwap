package com.nexswap.dto.admin;

public record AdminStatsResponse(
        long totalStudents,
        long totalBooks,
        long availableBooks,
        long completedExchanges,
        long pendingRequests
) {
}
