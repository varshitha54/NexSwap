package com.nexswap.service;

import com.nexswap.dto.exchange.ExchangeCreateRequest;
import com.nexswap.dto.exchange.ExchangeResponse;
import com.nexswap.entity.Book;
import com.nexswap.entity.BookStatus;
import com.nexswap.entity.ExchangeRequest;
import com.nexswap.entity.ExchangeStatus;
import com.nexswap.entity.ListingType;
import com.nexswap.entity.Role;
import com.nexswap.entity.User;
import com.nexswap.exception.BusinessException;
import com.nexswap.exception.ResourceNotFoundException;
import com.nexswap.repository.BookRepository;
import com.nexswap.repository.ExchangeRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExchangeService {

    private final ExchangeRequestRepository exchangeRequestRepository;
    private final BookRepository bookRepository;
    private final CurrentUserService currentUserService;

    @Transactional
    public ExchangeResponse create(ExchangeCreateRequest payload) {
        User requester = currentUserService.requireUser();
        Book book = bookRepository.findById(payload.bookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found."));
        if (book.getStatus() == BookStatus.DELETED) {
            throw new ResourceNotFoundException("Book not found.");
        }
        if (book.getSeller().getId().equals(requester.getId())) {
            throw BusinessException.badRequest("You cannot request your own listing.");
        }
        if (book.getStatus() != BookStatus.AVAILABLE) {
            throw BusinessException.conflict("This book is no longer available for requests.");
        }
        boolean isExchange = book.getListingType() == ListingType.EXCHANGE;
        if (isExchange && payload.offeredBookId() == null) {
            throw BusinessException.badRequest("Choose one of your books to offer in exchange.");
        }
        if (!isExchange && payload.offeredBookId() != null) {
            throw BusinessException.badRequest("An offered book can only be attached to an exchange listing.");
        }
        if (exchangeRequestRepository.existsByBookIdAndRequesterIdAndStatus(
                book.getId(), requester.getId(), ExchangeStatus.PENDING)) {
            throw BusinessException.conflict("You already have a pending request for this book.");
        }

        Book offeredBook = isExchange
                ? requireOffer(requester, payload.offeredBookId(), book.getId())
                : null;

        ExchangeRequest request = ExchangeRequest.builder()
                .book(book)
                .requester(requester)
                .owner(book.getSeller())
                .offeredBook(offeredBook)
                .message(normalizeMessage(payload.message()))
                .status(ExchangeStatus.PENDING)
                .build();
        return ExchangeResponse.from(exchangeRequestRepository.save(request));
    }

    @Transactional(readOnly = true)
    public List<ExchangeResponse> received() {
        Long userId = currentUserService.requireUserId();
        return exchangeRequestRepository.findByOwnerIdOrderByCreatedAtDesc(userId)
                .stream().map(ExchangeResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ExchangeResponse> sent() {
        Long userId = currentUserService.requireUserId();
        return exchangeRequestRepository.findByRequesterIdOrderByCreatedAtDesc(userId)
                .stream().map(ExchangeResponse::from).toList();
    }

    @Transactional
    public ExchangeResponse accept(Long id) {
        User current = currentUserService.requireUser();
        ExchangeRequest request = findRequestForUpdate(id);
        requireOwner(request, current);
        if (request.getStatus() != ExchangeStatus.PENDING) {
            throw BusinessException.conflict("Only pending requests can be accepted.");
        }

        Book book = bookRepository.findByIdForUpdate(request.getBook().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found."));
        if (book.getStatus() != BookStatus.AVAILABLE) {
            throw BusinessException.conflict("This book is no longer available.");
        }

        Book offeredBook = null;
        if (request.getOfferedBook() != null) {
            offeredBook = bookRepository.findByIdForUpdate(request.getOfferedBook().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Offered book not found."));
            if (offeredBook.getStatus() != BookStatus.AVAILABLE) {
                throw BusinessException.conflict("The offered book is no longer available.");
            }
        }

        LocalDateTime now = LocalDateTime.now();
        request.setStatus(ExchangeStatus.ACCEPTED);
        request.setRespondedAt(now);
        exchangeRequestRepository.save(request);

        book.setStatus(BookStatus.RESERVED);
        bookRepository.save(book);
        rejectOtherPendingForBook(book.getId(), request.getId(), now);

        if (offeredBook != null) {
            offeredBook.setStatus(BookStatus.RESERVED);
            bookRepository.save(offeredBook);
            rejectOtherPendingForBook(offeredBook.getId(), request.getId(), now);
        }

        return ExchangeResponse.from(request);
    }

    @Transactional
    public ExchangeResponse reject(Long id) {
        User current = currentUserService.requireUser();
        ExchangeRequest request = findRequestForUpdate(id);
        requireOwner(request, current);
        if (request.getStatus() != ExchangeStatus.PENDING) {
            throw BusinessException.conflict("Only pending requests can be rejected.");
        }
        request.setStatus(ExchangeStatus.REJECTED);
        request.setRespondedAt(LocalDateTime.now());
        exchangeRequestRepository.save(request);
        return ExchangeResponse.from(request);
    }

    @Transactional
    public ExchangeResponse cancel(Long id) {
        User current = currentUserService.requireUser();
        ExchangeRequest request = findRequestForUpdate(id);
        if (!request.getRequester().getId().equals(current.getId())) {
            throw BusinessException.forbidden("Only the requester can cancel this request.");
        }
        if (request.getStatus() != ExchangeStatus.PENDING) {
            throw BusinessException.conflict("Only pending requests can be cancelled.");
        }
        request.setStatus(ExchangeStatus.CANCELLED);
        request.setRespondedAt(LocalDateTime.now());
        exchangeRequestRepository.save(request);
        return ExchangeResponse.from(request);
    }

    @Transactional
    public ExchangeResponse complete(Long id) {
        User current = currentUserService.requireUser();
        ExchangeRequest request = findRequestForUpdate(id);
        boolean participant = request.getOwner().getId().equals(current.getId())
                || request.getRequester().getId().equals(current.getId());
        if (!participant && current.getRole() != Role.ADMIN) {
            throw BusinessException.forbidden("Only exchange participants can complete this exchange.");
        }
        if (request.getStatus() != ExchangeStatus.ACCEPTED) {
            throw BusinessException.conflict("Only accepted exchanges can be completed.");
        }

        Book book = bookRepository.findByIdForUpdate(request.getBook().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found."));
        book.setStatus(BookStatus.EXCHANGED);
        bookRepository.save(book);

        if (request.getOfferedBook() != null) {
            Book offeredBook = bookRepository.findByIdForUpdate(request.getOfferedBook().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Offered book not found."));
            offeredBook.setStatus(BookStatus.EXCHANGED);
            bookRepository.save(offeredBook);
        }

        request.setStatus(ExchangeStatus.COMPLETED);
        request.setCompletedAt(LocalDateTime.now());
        exchangeRequestRepository.save(request);
        return ExchangeResponse.from(request);
    }

    private ExchangeRequest findRequestForUpdate(Long id) {
        return exchangeRequestRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exchange request not found."));
    }

    private void requireOwner(ExchangeRequest request, User current) {
        if (!request.getOwner().getId().equals(current.getId())) {
            throw BusinessException.forbidden("Only the listing owner can respond to this request.");
        }
    }

    private Book requireOffer(User requester, Long offeredBookId, Long requestedBookId) {
        if (offeredBookId.equals(requestedBookId)) {
            throw BusinessException.badRequest("You cannot offer the same book you are requesting.");
        }
        Book offered = bookRepository.findById(offeredBookId)
                .orElseThrow(() -> new ResourceNotFoundException("Offered book not found."));
        if (!offered.getSeller().getId().equals(requester.getId())) {
            throw BusinessException.forbidden("You can only offer one of your own books.");
        }
        if (offered.getStatus() != BookStatus.AVAILABLE) {
            throw BusinessException.conflict("The book you are offering is not available.");
        }
        return offered;
    }

    private String normalizeMessage(String message) {
        return message == null || message.isBlank() ? null : message.trim();
    }

    private void rejectOtherPendingForBook(Long bookId, Long acceptedRequestId, LocalDateTime now) {
        List<ExchangeRequest> pending = new ArrayList<>(
                exchangeRequestRepository.findByBookIdAndStatus(bookId, ExchangeStatus.PENDING));
        pending.addAll(exchangeRequestRepository.findByOfferedBookIdAndStatus(
                bookId, ExchangeStatus.PENDING));
        List<ExchangeRequest> toReject = pending.stream()
                .filter(request -> !request.getId().equals(acceptedRequestId))
                .filter(request -> request.getStatus() == ExchangeStatus.PENDING)
                .peek(request -> {
                    request.setStatus(ExchangeStatus.REJECTED);
                    request.setRespondedAt(now);
                })
                .toList();
        exchangeRequestRepository.saveAll(toReject);
    }
}
