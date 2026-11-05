package com.nexswap.service;

import com.nexswap.dto.publicapi.PublicStatsResponse;
import com.nexswap.entity.BookStatus;
import com.nexswap.entity.ExchangeStatus;
import com.nexswap.entity.Role;
import com.nexswap.repository.BookRepository;
import com.nexswap.repository.ExchangeRequestRepository;
import com.nexswap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PublicService {

    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final ExchangeRequestRepository exchangeRequestRepository;

    @Transactional(readOnly = true)
    public PublicStatsResponse stats() {
        return new PublicStatsResponse(
                bookRepository.countByStatus(BookStatus.AVAILABLE),
                userRepository.countByRole(Role.STUDENT),
                exchangeRequestRepository.countByStatus(ExchangeStatus.COMPLETED)
        );
    }
}
