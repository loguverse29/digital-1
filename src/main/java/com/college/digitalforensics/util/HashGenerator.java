package com.college.digitalforensics.util;

import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Utility for computing NIST-compliant cryptographic SHA-256 hashes
 * as mandated in ISO/IEC 27037 standards for digital evidence handling.
 */
public final class HashGenerator {

    private static final String ALGORITHM = "SHA-256";

    private HashGenerator() {}

    /**
     * Compute SHA-256 hex string from byte array
     */
    public static String calculateSha256(byte[] data) {
        if (data == null) {
            throw new IllegalArgumentException("Byte data cannot be null");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance(ALGORITHM);
            byte[] hashBytes = digest.digest(data);
            return bytesToHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available in Java runtime", e);
        }
    }

    /**
     * Compute SHA-256 hex string from an InputStream (streamed in 8KB chunks)
     */
    public static String calculateSha256(InputStream inputStream) throws IOException {
        if (inputStream == null) {
            throw new IllegalArgumentException("InputStream cannot be null");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance(ALGORITHM);
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                digest.update(buffer, 0, bytesRead);
            }
            byte[] hashBytes = digest.digest();
            return bytesToHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available in Java runtime", e);
        }
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
