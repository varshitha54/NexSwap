package com.nexswap.service;

import com.nexswap.dto.book.BookPageResponse;
import com.nexswap.dto.book.BookRequest;
import com.nexswap.dto.book.BookResponse;
import com.nexswap.dto.book.CategorySummary;
import com.nexswap.dto.book.ContactSellerResponse;
import com.nexswap.entity.Book;
import com.nexswap.entity.BookCategory;
import com.nexswap.entity.BookCondition;
import com.nexswap.entity.BookStatus;
import com.nexswap.entity.ExchangeRequest;
import com.nexswap.entity.ExchangeStatus;
import com.nexswap.entity.ListingType;
import com.nexswap.entity.Role;
import com.nexswap.entity.User;
import com.nexswap.exception.BusinessException;
import com.nexswap.exception.ResourceNotFoundException;
import com.nexswap.repository.BookRepository;
import com.nexswap.repository.BookSpecifications;
import com.nexswap.repository.ExchangeRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;
    private final ExchangeRequestRepository exchangeRequestRepository;
    private final CurrentUserService currentUserService;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public BookPageResponse search(String query,
                                   BookCategory category,
                                   BigDecimal minPrice,
                                   BigDecimal maxPrice,
                                   BookCondition condition,
                                   ListingType listingType,
                                   String sort,
                                   int page,
                                   int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        Pageable pageable = PageRequest.of(safePage, safeSize, resolveSort(sort));
        Page<Book> result = bookRepository.findAll(
                BookSpecifications.withFilters(query, category, minPrice, maxPrice, condition, listingType),
                pageable);
        return BookPageResponse.from(result.map(BookResponse::from));
    }

    @Transactional(readOnly = true)
    public List<BookResponse> featured(int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 12);
        Pageable pageable = PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.DESC, "createdAt"));
        return bookRepository.findAll(BookSpecifications.availableOnly(), pageable)
                .map(BookResponse::from)
                .getContent();
    }

    @Transactional(readOnly = true)
    public List<CategorySummary> categories() {
        Map<BookCategory, Long> counts = new EnumMap<>(BookCategory.class);
        bookRepository.countByCategory(BookStatus.AVAILABLE)
                .forEach(row -> counts.put(row.getCategory(), row.getTotal()));
        List<CategorySummary> result = new ArrayList<>();
        for (BookCategory category : BookCategory.values()) {
            result.add(new CategorySummary(category, counts.getOrDefault(category, 0L)));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public BookResponse getById(Long id) {
        Book book = findBook(id);
        User viewer = currentUserService.getOptionalUser().orElse(null);
        boolean privileged = viewer != null
                && (viewer.getId().equals(book.getSeller().getId()) || viewer.getRole() == Role.ADMIN);
        if (book.getStatus() == BookStatus.HIDDEN && !privileged) {
            throw new ResourceNotFoundException("Book not found.");
        }
        return BookResponse.from(book);
    }

    @Transactional(readOnly = true)
    public ContactSellerResponse contactSeller(Long id) {
        User current = currentUserService.requireUser();
        Book book = findBook(id);
        if (book.getStatus() == BookStatus.HIDDEN
                && !book.getSeller().getId().equals(current.getId())
                && current.getRole() != Role.ADMIN) {
            throw new ResourceNotFoundException("Book not found.");
        }
        User seller = book.getSeller();
        return new ContactSellerResponse(seller.getId(), seller.getName(), seller.getEmail(),
                seller.getPhone(), seller.getCollegeName());
    }

    @Transactional(readOnly = true)
    public List<BookResponse> myListings() {
        Long userId = currentUserService.requireUserId();
        return bookRepository.findBySellerIdAndStatusNotOrderByCreatedAtDesc(userId, BookStatus.DELETED)
                .stream()
                .map(BookResponse::from)
                .toList();
    }

    @Transactional
    public BookResponse create(BookRequest request) {
        User seller = currentUserService.requireUser();
        Book book = Book.builder()
                .title(request.title().trim())
                .author(request.author().trim())
                .description(request.description().trim())
                .category(request.category())
                .price(request.price())
                .condition(request.condition())
                .listingType(request.listingType())
                .status(BookStatus.AVAILABLE)
                .seller(seller)
                .build();
        return BookResponse.from(bookRepository.save(book));
    }

    @Transactional
    public BookResponse update(Long id, BookRequest request) {
        User current = currentUserService.requireUser();
        Book book = findBook(id);
        requireOwnerOrAdmin(book, current);
        if (book.getStatus() == BookStatus.RESERVED || book.getStatus() == BookStatus.EXCHANGED) {
            throw BusinessException.conflict("This listing cannot be edited while an exchange is active.");
        }
        book.setTitle(request.title().trim());
        book.setAuthor(request.author().trim());
        book.setDescription(request.description().trim());
        book.setCategory(request.category());
        book.setPrice(request.price());
        book.setCondition(request.condition());
        book.setListingType(request.listingType());
        bookRepository.save(book);
        return BookResponse.from(book);
    }

    @Transactional
    public void delete(Long id) {
        User current = currentUserService.requireUser();
        Book book = findBook(id);
        requireOwnerOrAdmin(book, current);
        if (exchangeRequestRepository.existsByBookIdAndStatus(id, ExchangeStatus.ACCEPTED)) {
            throw BusinessException.conflict("Complete the active exchange before deleting this listing.");
        }
        rejectPendingRequests(book);
        book.setStatus(BookStatus.DELETED);
        bookRepository.save(book);
    }

    @Transactional
    public BookResponse updateStatus(Long id, BookStatus requestedStatus) {
        User current = currentUserService.requireUser();
        Book book = findBook(id);
        requireOwnerOrAdmin(book, current);
        if (requestedStatus != BookStatus.AVAILABLE && requestedStatus != BookStatus.HIDDEN) {
            throw BusinessException.badRequest("Listings can only be shown or hidden.");
        }
        if (book.getStatus() == BookStatus.RESERVED || book.getStatus() == BookStatus.EXCHANGED) {
            throw BusinessException.conflict("A reserved or exchanged listing cannot be hidden.");
        }
        book.setStatus(requestedStatus);
        bookRepository.save(book);
        return BookResponse.from(book);
    }

    @Transactional
    public BookResponse uploadImage(Long id, MultipartFile file) {
        User current = currentUserService.requireUser();
        Book book = findBook(id);
        requireOwnerOrAdmin(book, current);
        String oldImage = book.getImageUrl();
        String newImage = fileStorageService.storeBookImage(book.getId(), file);
        book.setImageUrl(newImage);
        bookRepository.save(book);
        if (oldImage != null) {
            fileStorageService.deleteByUrl(oldImage);
        }
        return BookResponse.from(book);
    }

    public Book findBook(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found."));
        if (book.getStatus() == BookStatus.DELETED) {
            throw new ResourceNotFoundException("Book not found.");
        }
        return book;
    }

    private void requireOwnerOrAdmin(Book book, User current) {
        if (!book.getSeller().getId().equals(current.getId()) && current.getRole() != Role.ADMIN) {
            throw BusinessException.forbidden("You can only manage your own listings.");
        }
    }

    private void rejectPendingRequests(Book book) {
        List<ExchangeRequest> pending = new ArrayList<>(
                exchangeRequestRepository.findByBookIdAndStatus(book.getId(), ExchangeStatus.PENDING));
        pending.addAll(exchangeRequestRepository.findByOfferedBookIdAndStatus(
                book.getId(), ExchangeStatus.PENDING));
        LocalDateTime now = LocalDateTime.now();
        for (ExchangeRequest request : pending) {
            if (request.getStatus() == ExchangeStatus.PENDING) {
                request.setStatus(ExchangeStatus.REJECTED);
                request.setRespondedAt(now);
            }
        }
        exchangeRequestRepository.saveAll(pending);
    }

    private Sort resolveSort(String sort) {
        if (sort == null) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        return switch (sort.toLowerCase()) {
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "price");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price");
            case "title_asc" -> Sort.by(Sort.Direction.ASC, "title");
            case "oldest" -> Sort.by(Sort.Direction.ASC, "createdAt");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }
}
