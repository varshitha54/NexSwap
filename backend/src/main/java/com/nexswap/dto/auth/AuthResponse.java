package com.nexswap.dto.auth;

import com.nexswap.dto.user.UserResponse;

public record AuthResponse(
        String token,
        String tokenType,
        long expiresIn,
        UserResponse user
) {
}
