package com.example.demo.service;

import com.example.demo.common.AuthConstants;
import com.example.demo.common.exception.BusinessException;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(404, "User not found"));
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "User not found"));
    }

    @Transactional
    public User save(User user) {
        return userRepository.save(user);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public User findByEmailOrNull(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public User findByGoogleIdOrNull(String googleId) {
        return userRepository.findByGoogleId(googleId).orElse(null);
    }

    public void checkUserStatus(User user) {
        if (!AuthConstants.USER_STATUS_ACTIVE.equals(user.getStatus())) {
            throw new BusinessException(403, "Account is disabled");
        }
    }
}
