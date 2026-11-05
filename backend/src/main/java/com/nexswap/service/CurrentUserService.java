package com.nexswap.service;

import com.nexswap.entity.User;
import com.nexswap.exception.BusinessException;
import com.nexswap.repository.UserRepository;
import com.nexswap.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    public User requireUser() {
        return getOptionalUser()
                .orElseThrow(() -> BusinessException.unauthorized("Please sign in to continue."));
    }

    public Long requireUserId() {
        return requireUser().getId();
    }

    public Optional<User> getOptionalUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return Optional.empty();
        }
        return userRepository.findById(principal.getId());
    }

    public boolean isAdmin(User user) {
        return user.getRole() == com.nexswap.entity.Role.ADMIN;
    }
}
