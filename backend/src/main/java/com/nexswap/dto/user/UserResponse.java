package com.nexswap.dto.user;

import com.nexswap.entity.Role;
import com.nexswap.entity.User;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String name,
        String email,
        String collegeName,
        String phone,
        Role role,
        LocalDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCollegeName(),
                user.getPhone(),
                user.getRole(),
                user.getCreatedAt()
        );
    }
}
