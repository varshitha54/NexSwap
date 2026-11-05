package com.nexswap.service;

import com.nexswap.dto.book.BookResponse;
import com.nexswap.dto.dashboard.DashboardStatsResponse;
import com.nexswap.dto.exchange.ExchangeResponse;
import com.nexswap.entity.BookStatus;
import com.nexswap.entity.ExchangeStatus;
import com.nexswap.entity.User;
import com.nexswap.repository.BookRepository;
import com.nexswap.repository.ExchangeRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final BookRepository bookRepository;
    private final ExchangeRequestRepository exchangeRequestRepository;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public DashboardStatsResponse stats() {
        User user = currentUserService.requireUser();
        Long userId = user.getId();

        long totalBooks = bookRepository.countBySellerIdAndStatusNot(userId, BookStatus.DELETED);
        long activeListings = bookRepository.countBySellerIdAndStatus(userId, BookStatus.AVAILABLE);
        long pendingIncoming = exchangeRequestRepository.countByOwnerIdAndStatus(
                userId, ExchangeStatus.PENDING);
        long sentPending = exchangeRequestRepository.countByRequesterIdAndStatus(
                userId, ExchangeStatus.PENDING);
        long completed = exchangeRequestRepository.countCompletedForUser(
                ExchangeStatus.COMPLETED, userId);
        long exchangedBooks = bookRepository.countBySellerIdAndStatus(userId, BookStatus.EXCHANGED);

        List<BookResponse> recentListings = bookRepository
                .findTop5BySellerIdAndStatusNotOrderByCreatedAtDesc(userId, BookStatus.DELETED)
                .stream().map(BookResponse::from).toList();
        List<ExchangeResponse> recentReceived = exchangeRequestRepository
                .findTop5ByOwnerIdOrderByCreatedAtDesc(userId)
                .stream().map(ExchangeResponse::from).toList();
        List<ExchangeResponse> recentSent = exchangeRequestRepository
                .findTop5ByRequesterIdOrderByCreatedAtDesc(userId)
                .stream().map(ExchangeResponse::from).toList();

        return new DashboardStatsResponse(totalBooks, activeListings, pendingIncoming, sentPending,
                completed, exchangedBooks, recentListings, recentReceived, recentSent);
    }
}
