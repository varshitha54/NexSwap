package com.nexswap.controller;

import com.nexswap.dto.book.BookPageResponse;
import com.nexswap.dto.book.BookRequest;
import com.nexswap.dto.book.BookResponse;
import com.nexswap.dto.book.BookStatusRequest;
import com.nexswap.dto.book.CategorySummary;
import com.nexswap.dto.book.ContactSellerResponse;
import com.nexswap.entity.BookCategory;
import com.nexswap.entity.BookCondition;
import com.nexswap.entity.ListingType;
import com.nexswap.service.BookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    @GetMapping
    public ResponseEntity<BookPageResponse> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) BookCategory category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) BookCondition condition,
            @RequestParam(required = false) ListingType listingType,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(bookService.search(q, category, minPrice, maxPrice,
                condition, listingType, sort, page, size));
    }

    @GetMapping("/featured")
    public ResponseEntity<List<BookResponse>> featured(
            @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(bookService.featured(limit));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategorySummary>> categories() {
        return ResponseEntity.ok(bookService.categories());
    }

    @GetMapping("/my-listings")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BookResponse>> myListings() {
        return ResponseEntity.ok(bookService.myListings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookResponse> details(@PathVariable Long id) {
        return ResponseEntity.ok(bookService.getById(id));
    }

    @GetMapping("/{id}/contact")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ContactSellerResponse> contact(@PathVariable Long id) {
        return ResponseEntity.ok(bookService.contactSeller(id));
    }

    @PostMapping
    public ResponseEntity<BookResponse> create(@Valid @RequestBody BookRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookResponse> update(@PathVariable Long id,
                                               @Valid @RequestBody BookRequest request) {
        return ResponseEntity.ok(bookService.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<BookResponse> updateStatus(@PathVariable Long id,
                                                     @Valid @RequestBody BookStatusRequest request) {
        return ResponseEntity.ok(bookService.updateStatus(id, request.status()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        bookService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BookResponse> uploadImage(@PathVariable Long id,
                                                    @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(bookService.uploadImage(id, file));
    }
}
