package com.nexswap.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 80, message = "Name must be between 2 and 80 characters")
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email address")
        @Size(max = 160, message = "Email is too long")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
        String password,

        @NotBlank(message = "College name is required")
        @Size(min = 2, max = 160, message = "College name must be between 2 and 160 characters")
        String collegeName,

        @Pattern(regexp = "^$|^[0-9+()\\-\\s]{7,30}$", message = "Enter a valid phone number")
        String phone
) {
}
