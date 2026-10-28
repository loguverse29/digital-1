package com.college.digitalforensics.service;

import com.college.digitalforensics.util.HashGenerator;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.*;
import java.util.*;

@Service
@Slf4j
public class FileStorageService {

    @Value("${app.forensics.storage.vault-dir:/var/forensics/vault/evidence}")
    private String configuredVaultDir;

    @Getter
    private Path vaultPath;

    // Allowed evidence file extensions
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "raw", "dd", "e01", "001", "img", "bin", "dat",
            "pcap", "pcapng", "cap",
            "log", "txt", "csv", "json", "xml",
            "pdf", "docx", "xlsx",
            "zip", "tar", "gz", "tgz", "7z", "enc", "iso", "vmdk", "aff"
    );

    // Disallowed executable / script extensions
    private static final Set<String> DANGEROUS_EXTENSIONS = Set.of(
            "exe", "dll", "so", "sh", "bat", "cmd", "ps1", "vbs", "msi",
            "php", "jsp", "asp", "aspx", "cgi", "py", "rb", "pl", "elf", "com", "scr"
    );

    // Known magic bytes
    private static final byte[] MAGIC_PDF = new byte[]{0x25, 0x50, 0x44, 0x46}; // %PDF
    private static final byte[] MAGIC_E01 = new byte[]{0x45, 0x56, 0x46, 0x09}; // EVF\t
    private static final byte[] MAGIC_PCAP_1 = new byte[]{(byte) 0xA1, (byte) 0xB2, (byte) 0xC3, (byte) 0xD4};
    private static final byte[] MAGIC_PCAP_2 = new byte[]{(byte) 0xD4, (byte) 0xC3, (byte) 0xB2, (byte) 0xA1};
    private static final byte[] MAGIC_PCAPNG = new byte[]{0x0A, 0x0D, 0x0D, 0x0A};
    private static final byte[] MAGIC_ZIP = new byte[]{0x50, 0x4B, 0x03, 0x04};
    private static final byte[] MAGIC_GZIP = new byte[]{0x1F, (byte) 0x8B};
    private static final byte[] MAGIC_WINDOWS_EXE = new byte[]{0x4D, 0x5A}; // MZ
    private static final byte[] MAGIC_ELF = new byte[]{0x7F, 0x45, 0x4C, 0x46}; // .ELF

    @PostConstruct
    public void init() {
        try {
            Path target = Paths.get(configuredVaultDir).toAbsolutePath().normalize();
            if (!Files.exists(target)) {
                try {
                    Files.createDirectories(target);
                } catch (AccessDeniedException e) {
                    // Fall back to local user-directory vault when running in non-root or unprivileged environments
                    target = Paths.get(System.getProperty("user.home"), ".forensics-vault", "evidence").toAbsolutePath().normalize();
                    Files.createDirectories(target);
                    log.warn("System vault dir inaccessible. Falling back to local secure storage: {}", target);
                }
            }
            this.vaultPath = target;
            log.info("Initialized Forensics Vault Directory: {}", this.vaultPath);
        } catch (IOException e) {
            log.error("Failed to initialize evidence vault directory", e);
            this.vaultPath = Paths.get("./data/vault").toAbsolutePath().normalize();
            try {
                Files.createDirectories(this.vaultPath);
            } catch (IOException ignored) {}
        }
    }

    public void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Evidence upload failed: File is empty or not provided.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("Evidence upload failed: Invalid filename.");
        }

        // Detect path traversal in filename
        if (originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            throw new SecurityException("Potential Path Traversal attack detected in filename: " + originalFilename);
        }

        String extension = getFileExtension(originalFilename).toLowerCase();
        if (DANGEROUS_EXTENSIONS.contains(extension)) {
            throw new SecurityException("Evidence upload rejected: Executable or script files are strictly prohibited (" + extension + ").");
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Evidence upload rejected: Unsupported evidence file format (" + extension + ").");
        }

        // Validate magic bytes / file signatures to prevent spoofing
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[8];
            int read = is.read(header);
            if (read >= 2) {
                // Reject masqueraded Windows PE executables
                if (header[0] == MAGIC_WINDOWS_EXE[0] && header[1] == MAGIC_WINDOWS_EXE[1] && !"bin".equals(extension) && !"raw".equals(extension) && !"dd".equals(extension)) {
                    throw new SecurityException("Evidence rejected: Executable PE binary detected disguised with extension ." + extension);
                }
                // Reject masqueraded Linux ELF binaries
                if (read >= 4 && header[0] == MAGIC_ELF[0] && header[1] == MAGIC_ELF[1] && header[2] == MAGIC_ELF[2] && header[3] == MAGIC_ELF[3]
                        && !"bin".equals(extension) && !"raw".equals(extension) && !"dd".equals(extension)) {
                    throw new SecurityException("Evidence rejected: ELF binary executable detected disguised with extension ." + extension);
                }

                // Verify specific formats if claimed
                if ("pdf".equals(extension) && read >= 4) {
                    if (header[0] != MAGIC_PDF[0] || header[1] != MAGIC_PDF[1] || header[2] != MAGIC_PDF[2] || header[3] != MAGIC_PDF[3]) {
                        throw new IllegalArgumentException("Evidence rejected: Corrupted or invalid PDF header signature.");
                    }
                }
                if ("e01".equals(extension) && read >= 4) {
                    if (header[0] != MAGIC_E01[0] || header[1] != MAGIC_E01[1] || header[2] != MAGIC_E01[2] || header[3] != MAGIC_E01[3]) {
                        log.warn("Non-standard E01 header signature encountered.");
                    }
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Error inspecting evidence file header signatures", e);
        }
    }

    public StoredFileResult storeFile(MultipartFile file) {
        validateFile(file);

        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String safeUniqueFilename = UUID.randomUUID().toString() + (extension.isEmpty() ? "" : "." + extension);

        Path destination = this.vaultPath.resolve(safeUniqueFilename).normalize();

        // Enforce boundary check to prevent escape from vault directory
        if (!destination.startsWith(this.vaultPath)) {
            throw new SecurityException("Security Violation: Target path is outside the designated forensics vault.");
        }

        try {
            // Save file and calculate SHA-256 simultaneously
            byte[] fileBytes = file.getBytes();
            Files.write(destination, fileBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

            String calculatedSha256 = HashGenerator.calculateSha256(fileBytes);

            return StoredFileResult.builder()
                    .storedPath(destination.toString())
                    .safeFilename(safeUniqueFilename)
                    .originalFilename(originalFilename)
                    .fileSizeBytes(file.getSize())
                    .fileMimeType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                    .sha256Hash(calculatedSha256)
                    .build();
        } catch (IOException e) {
            log.error("Failed to store evidence file to vault", e);
            throw new RuntimeException("Storage failure: Could not securely write evidence to forensics vault.", e);
        }
    }

    public byte[] loadStoredBytes(String fileStoragePath) {
        if (fileStoragePath == null || fileStoragePath.isBlank()) {
            throw new IllegalArgumentException("Storage path is empty.");
        }

        Path path = Paths.get(fileStoragePath).toAbsolutePath().normalize();
        if (!path.startsWith(this.vaultPath)) {
            log.warn("Attempt to read file outside vault path: {}", fileStoragePath);
            throw new SecurityException("Access Denied: Requested evidence path is outside the secure vault boundary.");
        }

        if (!Files.exists(path) || !Files.isReadable(path)) {
            throw new IllegalArgumentException("Evidence file does not exist on storage vault: " + path.getFileName());
        }

        try {
            return Files.readAllBytes(path);
        } catch (IOException e) {
            log.error("Failed to read evidence bytes from {}", path, e);
            throw new RuntimeException("Error reading evidence bytes from storage vault", e);
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null) return "";
        int dotIdx = filename.lastIndexOf('.');
        return dotIdx >= 0 && dotIdx < filename.length() - 1 ? filename.substring(dotIdx + 1) : "";
    }

    @lombok.Data
    @lombok.Builder
    public static class StoredFileResult {
        private String storedPath;
        private String safeFilename;
        private String originalFilename;
        private long fileSizeBytes;
        private String fileMimeType;
        private String sha256Hash;
    }
}
