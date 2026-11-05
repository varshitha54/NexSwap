package com.nexswap.dto.book;

public record ContactSellerResponse(
        Long sellerId,
        String name,
        String email,
        String phone,
        String collegeName
) {
}
