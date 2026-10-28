package com.college.digitalforensics.security;

import com.college.digitalforensics.service.FileStorageService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class FileUploadSecurityTest {

    @Autowired
    private FileStorageService fileStorageService;

    @Test
    @DisplayName("Upload of executable file (.exe) must be rejected with SecurityException")
    public void testRejectExecutableExe() {
        MockMultipartFile exeFile = new MockMultipartFile("file", "trojan_payload.exe", "application/x-msdownload", "MALICIOUS".getBytes(StandardCharsets.UTF_8));

        SecurityException ex = assertThrows(SecurityException.class, () -> fileStorageService.validateFile(exeFile));
        assertTrue(ex.getMessage().contains("Executable or script files are strictly prohibited"));
    }

    @Test
    @DisplayName("Upload of script file (.sh) must be rejected with SecurityException")
    public void testRejectScriptSh() {
        MockMultipartFile scriptFile = new MockMultipartFile("file", "dropper.sh", "text/x-shellscript", "#!/bin/bash\nrm -rf /".getBytes(StandardCharsets.UTF_8));

        SecurityException ex = assertThrows(SecurityException.class, () -> fileStorageService.validateFile(scriptFile));
        assertTrue(ex.getMessage().contains("Executable or script files are strictly prohibited"));
    }

    @Test
    @DisplayName("Filename with path traversal (../../etc/passwd) must be rejected with SecurityException")
    public void testRejectPathTraversal() {
        MockMultipartFile traversalFile = new MockMultipartFile("file", "../../etc/passwd", "application/octet-stream", "root:x:0:0".getBytes(StandardCharsets.UTF_8));

        SecurityException ex = assertThrows(SecurityException.class, () -> fileStorageService.validateFile(traversalFile));
        assertTrue(ex.getMessage().contains("Path Traversal"));
    }

    @Test
    @DisplayName("Valid forensic raw dump is accepted, stored with randomized safe UUID filename outside web root")
    public void testValidForensicFileStoredSafely() {
        MockMultipartFile validFile = new MockMultipartFile("file", "seized_phone_dump.raw", "application/octet-stream", "SEIZED PHONE BITSTREAM DATA".getBytes(StandardCharsets.UTF_8));

        FileStorageService.StoredFileResult result = fileStorageService.storeFile(validFile);

        assertNotNull(result);
        assertNotNull(result.getStoredPath());
        assertNotNull(result.getSafeFilename());
        assertTrue(result.getSafeFilename().endsWith(".raw"));
        assertNotEquals("seized_phone_dump.raw", result.getSafeFilename()); // Must be randomized UUID
        assertEquals(64, result.getSha256Hash().length()); // Valid SHA-256 hex string
    }
}
