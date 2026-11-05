package com.nexswap.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 80, message = "Name must be between 2 and 80 characters")
        String name,

        @NotBlank(message = "College name is required")
        @Size(min = 2, max = 160, message = "College name must be between 2 and 160 characters")
        String collegeName,

        @Pattern(regexp = "^$|^[0-9+()\\-\\s]{7,30}$", message = "Enter a valid phone number")
        String phone
) {
}
