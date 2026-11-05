package com.nexswap.dto.book;

import com.nexswap.entity.User;

public record SellerSummary(
        Long id,
        String name,
        String collegeName
) {
    public static SellerSummary from(User user) {
        return new SellerSummary(user.getId(), user.getName(), user.getCollegeName());
    }
}
