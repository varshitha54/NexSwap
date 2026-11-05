package com.nexswap.config;

import com.nexswap.entity.Role;
import com.nexswap.entity.User;
import com.nexswap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrap implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.name:}")
    private String adminName;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        if (adminEmail == null || adminEmail.isBlank()
                || adminPassword == null || adminPassword.isBlank()) {
            log.info("Admin bootstrap skipped: ADMIN_EMAIL and ADMIN_PASSWORD are not configured.");
            return;
        }
        if (userRepository.existsByEmailIgnoreCase(adminEmail)) {
            log.info("Admin bootstrap skipped: {} already exists.", adminEmail);
            return;
        }
        if (adminPassword.length() < 8) {
            log.warn("Admin bootstrap skipped: ADMIN_PASSWORD must be at least 8 characters.");
            return;
        }

        User admin = User.builder()
                .name((adminName == null || adminName.isBlank()) ? "NexSwap Administrator" : adminName)
                .email(adminEmail.trim().toLowerCase())
                .password(passwordEncoder.encode(adminPassword))
                .collegeName("NexSwap University")
                .role(Role.ADMIN)
                .build();
        userRepository.save(admin);
        log.info("Created bootstrap administrator account: {}", adminEmail);
    }
}
