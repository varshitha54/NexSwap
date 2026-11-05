package com.nexswap.service;

import com.nexswap.exception.BusinessException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif");
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif");
    private static final long MAX_BYTES = 5L * 1024 * 1024;

    private final Path root;

    public FileStorageService(@Value("${app.upload-dir}") String uploadDir) {
        this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void initialize() {
        try {
            Files.createDirectories(root.resolve("books"));
        } catch (IOException exception) {
            throw new IllegalStateException("Could not create upload directory: " + root, exception);
        }
    }

    public String storeBookImage(Long bookId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw BusinessException.badRequest("Please choose an image to upload.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw BusinessException.badRequest("The image must be 5 MB or smaller.");
        }
        String contentType = file.getContentType() == null
                ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw BusinessException.badRequest("Only JPG, PNG, WEBP or GIF images are allowed.");
        }

        String original = StringUtils.cleanPath(
                file.getOriginalFilename() == null ? "cover" : file.getOriginalFilename());
        String extension = extensionOf(original);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw BusinessException.badRequest("Only JPG, PNG, WEBP or GIF images are allowed.");
        }

        String filename = "book-" + bookId + "-" + UUID.randomUUID() + "." + extension;
        Path destination = root.resolve("books").resolve(filename).normalize();
        if (!destination.startsWith(root)) {
            throw BusinessException.badRequest("Invalid file name.");
        }
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not store the uploaded image.", exception);
        }
        return "/uploads/books/" + filename;
    }

    public void deleteByUrl(String imageUrl) {
        if (imageUrl == null || !imageUrl.startsWith("/uploads/")) {
            return;
        }
        Path path = root.resolve(imageUrl.substring("/uploads/".length())).normalize();
        if (!path.startsWith(root)) {
            return;
        }
        try {
            Files.deleteIfExists(path);
        } catch (IOException ignored) {
            // A stale file should not prevent listing updates.
        }
    }

    private String extensionOf(String filename) {
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) {
            return "";
        }
        return filename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }
}
