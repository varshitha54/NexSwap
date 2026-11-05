package com.nexswap.dto.dashboard;

import com.nexswap.dto.book.BookResponse;
import com.nexswap.dto.exchange.ExchangeResponse;

import java.util.List;

public record DashboardStatsResponse(
        long totalBooksListed,
        long activeListings,
        long pendingIncomingRequests,
        long sentPendingRequests,
        long completedExchanges,
        long exchangedBooks,
        List<BookResponse> recentListings,
        List<ExchangeResponse> recentReceivedRequests,
        List<ExchangeResponse> recentSentRequests
) {
}
