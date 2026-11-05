package com.nexswap.dto.exchange;

import com.nexswap.entity.ExchangeRequest;
import com.nexswap.entity.ExchangeStatus;

import java.time.LocalDateTime;

public record ExchangeResponse(
        Long id,
        BookSummary book,
        BookSummary offeredBook,
        ParticipantSummary requester,
        ParticipantSummary owner,
        String message,
        ExchangeStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime respondedAt,
        LocalDateTime completedAt
) {
    public static ExchangeResponse from(ExchangeRequest request) {
        return new ExchangeResponse(
                request.getId(),
                BookSummary.from(request.getBook()),
                BookSummary.from(request.getOfferedBook()),
                ParticipantSummary.from(request.getRequester()),
                ParticipantSummary.from(request.getOwner()),
                request.getMessage(),
                request.getStatus(),
                request.getCreatedAt(),
                request.getUpdatedAt(),
                request.getRespondedAt(),
                request.getCompletedAt()
        );
    }
}
