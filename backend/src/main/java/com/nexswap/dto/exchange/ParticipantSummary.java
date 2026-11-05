package com.nexswap.dto.exchange;

import com.nexswap.entity.User;

public record ParticipantSummary(
        Long id,
        String name,
        String email,
        String phone,
        String collegeName
) {
    public static ParticipantSummary from(User user) {
        return new ParticipantSummary(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getCollegeName()
        );
    }
}
