package com.nexswap.dto.admin;

import com.nexswap.entity.Role;
import com.nexswap.entity.User;

import java.time.LocalDateTime;

public record AdminUserResponse(
        Long id,
        String name,
        String email,
        String collegeName,
        String phone,
        Role role,
        LocalDateTime createdAt
) {
    public static AdminUserResponse from(User user) {
        return new AdminUserResponse(
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
