package com.nexswap.repository;

import com.nexswap.entity.Book;
import com.nexswap.entity.BookCategory;
import com.nexswap.entity.BookCondition;
import com.nexswap.entity.BookStatus;
import com.nexswap.entity.ListingType;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.criteria.Predicate;

public final class BookSpecifications {

    private BookSpecifications() {
    }

    public static Specification<Book> availableOnly() {
        return (root, query, builder) -> builder.equal(root.get("status"), BookStatus.AVAILABLE);
    }

    public static Specification<Book> withFilters(String search,
                                                   BookCategory category,
                                                   BigDecimal minPrice,
                                                   BigDecimal maxPrice,
                                                   BookCondition condition,
                                                   ListingType listingType) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.equal(root.get("status"), BookStatus.AVAILABLE));

            if (search != null && !search.isBlank()) {
                String term = "%" + search.trim().toLowerCase() + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("title")), term),
                        builder.like(builder.lower(root.get("author")), term),
                        builder.like(builder.lower(root.get("description")), term)
                ));
            }
            if (category != null) {
                predicates.add(builder.equal(root.get("category"), category));
            }
            if (minPrice != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(builder.lessThanOrEqualTo(root.get("price"), maxPrice));
            }
            if (condition != null) {
                predicates.add(builder.equal(root.get("condition"), condition));
            }
            if (listingType != null) {
                predicates.add(builder.equal(root.get("listingType"), listingType));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }
}
