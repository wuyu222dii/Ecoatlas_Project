package com.example.demo.utils;

import com.example.demo.common.AuthConstants;

import java.security.SecureRandom;

public final class VerificationCodeUtil {

    private static final SecureRandom RANDOM = new SecureRandom();

    private VerificationCodeUtil() {
    }

    /**
     * Generate a numeric verification code of the given length.
     */
    public static String generate(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(RANDOM.nextInt(10));
        }
        return sb.toString();
    }

    /**
     * Generate the default 6-digit verification code.
     */
    public static String generate() {
        return generate(AuthConstants.CODE_LENGTH);
    }
}
