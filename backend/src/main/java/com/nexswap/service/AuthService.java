package com.nexswap.service;

import com.nexswap.dto.auth.AuthResponse;
import com.nexswap.dto.auth.LoginRequest;
import com.nexswap.dto.auth.RegisterRequest;
import com.nexswap.dto.user.UserResponse;
import com.nexswap.entity.Role;
import com.nexswap.entity.User;
import com.nexswap.exception.BusinessException;
import com.nexswap.repository.UserRepository;
import com.nexswap.security.JwtService;
import com.nexswap.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw BusinessException.conflict("An account with this email already exists.");
        }

        User user = User.builder()
                .name(request.name().trim())
                .email(email)
                .password(passwordEncoder.encode(request.password()))
                .collegeName(request.collegeName().trim())
                .phone(normalizeOptional(request.phone()))
                .role(Role.STUDENT)
                .build();
        userRepository.save(user);
        return buildAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        normalizeEmail(request.email()),
                        request.password()));
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> BusinessException.unauthorized("Account no longer exists."));
        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, "Bearer", jwtService.getExpirationMs() / 1000,
                UserResponse.from(user));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeOptional(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
