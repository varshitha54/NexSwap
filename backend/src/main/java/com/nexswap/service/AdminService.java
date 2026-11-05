package com.nexswap.service;

import com.nexswap.dto.admin.AdminStatsResponse;
import com.nexswap.dto.admin.AdminUserResponse;
import com.nexswap.entity.BookStatus;
import com.nexswap.entity.ExchangeStatus;
import com.nexswap.entity.Role;
import com.nexswap.repository.BookRepository;
import com.nexswap.repository.ExchangeRequestRepository;
import com.nexswap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final ExchangeRequestRepository exchangeRequestRepository;

    @Transactional(readOnly = true)
    public AdminStatsResponse stats() {
        return new AdminStatsResponse(
                userRepository.countByRole(Role.STUDENT),
                bookRepository.countByStatusNot(BookStatus.DELETED),
                bookRepository.countByStatus(BookStatus.AVAILABLE),
                exchangeRequestRepository.countByStatus(ExchangeStatus.COMPLETED),
                exchangeRequestRepository.countByStatus(ExchangeStatus.PENDING)
        );
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> students() {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(AdminUserResponse::from)
                .toList();
    }
}
