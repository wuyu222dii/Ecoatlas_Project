package com.example.demo.common;

public final class AuthConstants {

    private AuthConstants() {
    }

    /** Verification code lifetime in minutes. */
    public static final int CODE_EXPIRE_MINUTES = 5;

    /** Verification code length. */
    public static final int CODE_LENGTH = 6;

    /** Min seconds between code sends to the same email. */
    public static final int CODE_SEND_INTERVAL_SECONDS = 60;

    /** Verification code type constants. */
    public static final String CODE_TYPE_REGISTER = "REGISTER";
    public static final String CODE_TYPE_FORGOT_PASSWORD = "FORGOT_PASSWORD";
    public static final String CODE_TYPE_CHANGE_PASSWORD = "CHANGE_PASSWORD";

    /** User status constants. */
    public static final String USER_STATUS_ACTIVE = "ACTIVE";
    public static final String USER_STATUS_INACTIVE = "INACTIVE";

    /** JWT request header. */
    public static final String HEADER_AUTHORIZATION = "Authorization";
    public static final String TOKEN_PREFIX = "Bearer ";
}
