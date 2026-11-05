package com.nexswap.service;

import com.nexswap.dto.user.ChangePasswordRequest;
import com.nexswap.dto.user.UpdateProfileRequest;
import com.nexswap.dto.user.UserResponse;
import com.nexswap.entity.User;
import com.nexswap.exception.BusinessException;
import com.nexswap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserResponse getProfile() {
        return UserResponse.from(currentUserService.requireUser());
    }

    @Transactional
    public UserResponse updateProfile(UpdateProfileRequest request) {
        User user = currentUserService.requireUser();
        user.setName(request.name().trim());
        user.setCollegeName(request.collegeName().trim());
        user.setPhone(request.phone() == null || request.phone().isBlank()
                ? null : request.phone().trim());
        userRepository.save(user);
        return UserResponse.from(user);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = currentUserService.requireUser();
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw BusinessException.badRequest("Your current password is incorrect.");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw BusinessException.badRequest("Your new password must be different.");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }
}
