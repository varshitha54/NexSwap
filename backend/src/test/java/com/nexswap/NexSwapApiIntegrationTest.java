package com.nexswap;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexswap.entity.Role;
import com.nexswap.entity.User;
import com.nexswap.repository.BookRepository;
import com.nexswap.repository.ExchangeRequestRepository;
import com.nexswap.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "app.admin.name=Test Administrator",
        "app.admin.email=admin@test.local",
        "app.admin.password=admin-test-password"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NexSwapApiIntegrationTest {

    private static final String ADMIN_EMAIL = "admin@test.local";
    private static final String ADMIN_PASSWORD = "admin-test-password";
    private static final String PASSWORD = "student-pass-123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ExchangeRequestRepository exchangeRequestRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void resetDatabase() {
        exchangeRequestRepository.deleteAll();
        bookRepository.deleteAll();
        userRepository.deleteAll();
        userRepository.save(User.builder()
                .name("Test Administrator")
                .email(ADMIN_EMAIL)
                .password(passwordEncoder.encode(ADMIN_PASSWORD))
                .collegeName("NexSwap University")
                .role(Role.ADMIN)
                .build());
    }

    @Test
    void registrationLoginProfileAndPasswordFlow() throws Exception {
        JsonNode alice = register("Alice Reader", "alice@test.local");
        String aliceToken = alice.path("token").asText();
        assertThat(alice.path("user").path("role").asText()).isEqualTo("STUDENT");
        assertThat(aliceToken).isNotBlank();

        request(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                        "name", "Alice Again",
                        "email", "alice@test.local",
                        "password", PASSWORD,
                        "collegeName", "North Campus"))), 409);

        request(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                        "name", "Bad Password",
                        "email", "bad@test.local",
                        "password", "short",
                        "collegeName", "North Campus"))), 400);

        request(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("email", "alice@test.local", "password", "wrong-password"))), 401);

        request(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("email", "alice@test.local", "password", PASSWORD))), 200);

        request(get("/api/users/me"), 401);

        JsonNode profile = request(get("/api/users/me").header("Authorization", bearer(aliceToken)), 200);
        assertThat(profile.path("email").asText()).isEqualTo("alice@test.local");
        assertThat(profile.has("phone")).isFalse();

        JsonNode updated = request(put("/api/users/me")
                .header("Authorization", bearer(aliceToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                        "name", "Alice Reader",
                        "collegeName", "North Campus University",
                        "phone", "+91 90000 33333"))), 200);
        assertThat(updated.path("phone").asText()).isEqualTo("+91 90000 33333");

        request(put("/api/users/me/password")
                .header("Authorization", bearer(aliceToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                        "currentPassword", "not-the-password",
                        "newPassword", "alice-new-pass-456"))), 400);

        request(put("/api/users/me/password")
                .header("Authorization", bearer(aliceToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                        "currentPassword", PASSWORD,
                        "newPassword", "alice-new-pass-456"))), 200);

        request(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("email", "alice@test.local", "password", PASSWORD))), 401);

        JsonNode relogin = request(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("email", "alice@test.local", "password", "alice-new-pass-456"))), 200);
        assertThat(relogin.path("token").asText()).isNotBlank();

        request(post("/api/auth/logout")
                .header("Authorization", bearer(aliceToken)), 200);
    }

    @Test
    void publicCatalogueLifecycleAndValidation() throws Exception {
        String sellerToken = register("Catalogue Seller", "seller@test.local").path("token").asText();
        String viewerToken = register("Catalogue Viewer", "viewer@test.local").path("token").asText();

        request(post("/api/books")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(bookPayload("Clean Code", "Robert C. Martin",
                        "A handbook of agile software craftsmanship.", "COMPUTER_SCIENCE", 450, "GOOD", "SELL"))), 401);

        request(post("/api/books")
                .header("Authorization", bearer(sellerToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("title", ""))), 400);

        JsonNode sellBook = request(post("/api/books")
                .header("Authorization", bearer(sellerToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(bookPayload("Clean Code", "Robert C. Martin",
                        "A handbook of agile software craftsmanship.", "COMPUTER_SCIENCE", 450, "GOOD", "SELL"))), 201);
        long sellId = sellBook.path("id").asLong();
        assertThat(sellBook.path("status").asText()).isEqualTo("AVAILABLE");

        request(post("/api/books")
                .header("Authorization", bearer(sellerToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(bookPayload("Database System Concepts", "Silberschatz",
                        "Seventh edition with clean pages.", "COMPUTER_SCIENCE", 600, "LIKE_NEW", "EXCHANGE"))), 201);

        request(post("/api/books")
                .header("Authorization", bearer(sellerToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(bookPayload("Linear Algebra", "Sheldon Axler",
                        "An undergraduate mathematics text.", "MATHEMATICS", 280, "GOOD", "SELL"))), 201);

        JsonNode searchAll = request(get("/api/books?size=20"), 200);
        assertThat(searchAll.path("totalElements").asInt()).isEqualTo(3);

        JsonNode searchTitle = request(get("/api/books?q=database"), 200);
        assertThat(searchTitle.path("totalElements").asInt()).isEqualTo(1);
        assertThat(searchTitle.path("content").get(0).path("title").asText())
                .isEqualTo("Database System Concepts");

        JsonNode category = request(get("/api/books?category=COMPUTER_SCIENCE"), 200);
        assertThat(category.path("totalElements").asInt()).isEqualTo(2);

        JsonNode exchangeOnly = request(get("/api/books?listingType=EXCHANGE"), 200);
        assertThat(exchangeOnly.path("totalElements").asInt()).isEqualTo(1);

        JsonNode priceRange = request(get("/api/books?minPrice=400&maxPrice=650"), 200);
        assertThat(priceRange.path("totalElements").asInt()).isEqualTo(2);

        JsonNode sorted = request(get("/api/books?sort=price_asc&size=10"), 200);
        assertThat(sorted.path("content").get(0).path("price").asInt()).isEqualTo(280);

        JsonNode categories = request(get("/api/books/categories"), 200);
        assertThat(categories.size()).isEqualTo(9);

        JsonNode featured = request(get("/api/books/featured"), 200);
        assertThat(featured.size()).isEqualTo(3);

        JsonNode details = request(get("/api/books/" + sellId), 200);
        assertThat(details.path("seller").path("name").asText()).isEqualTo("Catalogue Seller");

        request(get("/api/books/" + sellId + "/contact"), 401);
        JsonNode contact = request(get("/api/books/" + sellId + "/contact")
                .header("Authorization", bearer(viewerToken)), 200);
        assertThat(contact.path("email").asText()).isEqualTo("seller@test.local");

        request(get("/api/books/not-a-number"), 401);

        JsonNode hidden = request(patch("/api/books/" + sellId + "/status")
                .header("Authorization", bearer(sellerToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("status", "HIDDEN"))), 200);
        assertThat(hidden.path("status").asText()).isEqualTo("HIDDEN");

        JsonNode hiddenSearch = request(get("/api/books?q=clean%20code"), 200);
        assertThat(hiddenSearch.path("totalElements").asInt()).isZero();

        request(get("/api/books/" + sellId), 404);
        request(get("/api/books/" + sellId)
                .header("Authorization", bearer(viewerToken)), 404);
        request(get("/api/books/" + sellId)
                .header("Authorization", bearer(sellerToken)), 200);
        request(get("/api/books/" + sellId + "/contact")
                .header("Authorization", bearer(viewerToken)), 404);

        request(patch("/api/books/" + sellId + "/status")
                .header("Authorization", bearer(sellerToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("status", "RESERVED"))), 400);

        request(patch("/api/books/" + sellId + "/status")
                .header("Authorization", bearer(sellerToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("status", "AVAILABLE"))), 200);

        JsonNode updated = request(put("/api/books/" + sellId)
                .header("Authorization", bearer(sellerToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(bookPayload("Clean Code, Second Edition", "Robert C. Martin",
                        "Updated listing description.", "COMPUTER_SCIENCE", 425, "GOOD", "SELL"))), 200);
        assertThat(updated.path("title").asText()).isEqualTo("Clean Code, Second Edition");
        assertThat(updated.path("price").asInt()).isEqualTo(425);

        MockMultipartFile cover = new MockMultipartFile("file", "cover.png", "image/png",
                pngBytes());
        JsonNode uploaded = request(multipart("/api/books/" + sellId + "/image")
                .file(cover)
                .header("Authorization", bearer(sellerToken)), 200);
        String imageUrl = uploaded.path("imageUrl").asText();
        assertThat(imageUrl).matches("^/uploads/books/book-" + sellId + "-[a-f0-9-]+\\.png$");

        MvcResult image = mockMvc.perform(get(imageUrl)).andExpect(status().isOk()).andReturn();
        assertThat(image.getResponse().getContentAsByteArray()).isEqualTo(pngBytes());

        JsonNode withImage = request(get("/api/books/" + sellId), 200);
        assertThat(withImage.path("imageUrl").asText()).isEqualTo(imageUrl);

        request(delete("/api/books/" + sellId), 401);
        request(delete("/api/books/" + sellId)
                .header("Authorization", bearer(viewerToken)), 403);
        request(delete("/api/books/" + sellId)
                .header("Authorization", bearer(sellerToken)), 204);
        request(get("/api/books/" + sellId), 404);

        JsonNode myListings = request(get("/api/books/my-listings")
                .header("Authorization", bearer(sellerToken)), 200);
        assertThat(myListings.size()).isEqualTo(2);
        assertThat(containsStatus(myListings, "DELETED")).isFalse();
    }

    @Test
    void exchangeRequestLifecycleAndDashboardCounts() throws Exception {
        JsonNode alice = register("Alice Owner", "alice.owner@test.local");
        JsonNode bob = register("Bob Requester", "bob.requester@test.local");
        String aliceToken = alice.path("token").asText();
        String bobToken = bob.path("token").asText();

        long aliceExchangeId = createBook(aliceToken, "Operating Systems", "Silberschatz",
                "Exchange copy in great shape.", "COMPUTER_SCIENCE", 500, "GOOD", "EXCHANGE");
        long aliceSellId = createBook(aliceToken, "Refactoring", "Martin Fowler",
                "Sell copy with a clean cover.", "COMPUTER_SCIENCE", 350, "GOOD", "SELL");
        long bobOfferId = createBook(bobToken, "Artificial Intelligence", "Russell and Norvig",
                "Offered as a swap.", "COMPUTER_SCIENCE", 550, "LIKE_NEW", "EXCHANGE");

        request(post("/api/exchanges")
                .header("Authorization", bearer(bobToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("bookId", aliceExchangeId))), 400);

        request(post("/api/exchanges")
                .header("Authorization", bearer(bobToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("bookId", aliceSellId, "offeredBookId", bobOfferId))), 400);

        request(post("/api/exchanges")
                .header("Authorization", bearer(aliceToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("bookId", aliceExchangeId, "offeredBookId", aliceSellId))), 400);

        JsonNode created = request(post("/api/exchanges")
                .header("Authorization", bearer(bobToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                        "bookId", aliceExchangeId,
                        "offeredBookId", bobOfferId,
                        "message", "Happy to swap my AI textbook."))), 201);
        long exchangeRequestId = created.path("id").asLong();
        assertThat(created.path("status").asText()).isEqualTo("PENDING");
        assertThat(created.path("offeredBook").path("id").asLong()).isEqualTo(bobOfferId);

        request(post("/api/exchanges")
                .header("Authorization", bearer(bobToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("bookId", aliceExchangeId, "offeredBookId", bobOfferId))), 409);

        request(post("/api/exchanges")
                .header("Authorization", bearer(aliceToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("bookId", aliceExchangeId, "offeredBookId", aliceSellId))), 400);

        JsonNode received = request(get("/api/exchanges/received")
                .header("Authorization", bearer(aliceToken)), 200);
        assertThat(received.size()).isEqualTo(1);

        JsonNode sent = request(get("/api/exchanges/sent")
                .header("Authorization", bearer(bobToken)), 200);
        assertThat(sent.size()).isEqualTo(1);

        JsonNode aliceDashboard = request(get("/api/dashboard/stats")
                .header("Authorization", bearer(aliceToken)), 200);
        assertThat(aliceDashboard.path("pendingIncomingRequests").asLong()).isEqualTo(1);
        assertThat(aliceDashboard.path("sentPendingRequests").asLong()).isZero();

        JsonNode bobDashboard = request(get("/api/dashboard/stats")
                .header("Authorization", bearer(bobToken)), 200);
        assertThat(bobDashboard.path("sentPendingRequests").asLong()).isEqualTo(1);

        request(patch("/api/exchanges/" + exchangeRequestId + "/accept")
                .header("Authorization", bearer(bobToken)), 403);

        JsonNode accepted = request(patch("/api/exchanges/" + exchangeRequestId + "/accept")
                .header("Authorization", bearer(aliceToken)), 200);
        assertThat(accepted.path("status").asText()).isEqualTo("ACCEPTED");

        assertThat(bookStatus(aliceExchangeId)).isEqualTo("RESERVED");
        assertThat(bookStatus(bobOfferId)).isEqualTo("RESERVED");

        request(patch("/api/books/" + aliceExchangeId + "/status")
                .header("Authorization", bearer(aliceToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("status", "HIDDEN"))), 409);

        request(put("/api/books/" + aliceExchangeId)
                .header("Authorization", bearer(aliceToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(bookPayload("Operating Systems", "Silberschatz",
                        "Attempted edit while reserved.", "COMPUTER_SCIENCE", 500, "GOOD", "EXCHANGE"))), 409);

        request(delete("/api/books/" + aliceExchangeId)
                .header("Authorization", bearer(aliceToken)), 409);

        JsonNode completed = request(patch("/api/exchanges/" + exchangeRequestId + "/complete")
                .header("Authorization", bearer(bobToken)), 200);
        assertThat(completed.path("status").asText()).isEqualTo("COMPLETED");
        assertThat(bookStatus(aliceExchangeId)).isEqualTo("EXCHANGED");
        assertThat(bookStatus(bobOfferId)).isEqualTo("EXCHANGED");

        request(patch("/api/exchanges/" + exchangeRequestId + "/complete")
                .header("Authorization", bearer(aliceToken)), 409);

        JsonNode sellRequest = request(post("/api/exchanges")
                .header("Authorization", bearer(bobToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("bookId", aliceSellId, "message", "Would like to buy this."))), 201);
        long sellRequestId = sellRequest.path("id").asLong();

        request(patch("/api/exchanges/" + sellRequestId + "/cancel")
                .header("Authorization", bearer(aliceToken)), 403);
        JsonNode cancelled = request(patch("/api/exchanges/" + sellRequestId + "/cancel")
                .header("Authorization", bearer(bobToken)), 200);
        assertThat(cancelled.path("status").asText()).isEqualTo("CANCELLED");

        JsonNode rejectTarget = request(post("/api/exchanges")
                .header("Authorization", bearer(bobToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("bookId", aliceSellId))), 201);
        long rejectId = rejectTarget.path("id").asLong();
        JsonNode rejected = request(patch("/api/exchanges/" + rejectId + "/reject")
                .header("Authorization", bearer(aliceToken)), 200);
        assertThat(rejected.path("status").asText()).isEqualTo("REJECTED");

        JsonNode buyRequest = request(post("/api/exchanges")
                .header("Authorization", bearer(bobToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("bookId", aliceSellId))), 201);
        long buyRequestId = buyRequest.path("id").asLong();
        request(patch("/api/exchanges/" + buyRequestId + "/accept")
                .header("Authorization", bearer(aliceToken)), 200);
        assertThat(bookStatus(aliceSellId)).isEqualTo("RESERVED");
        request(patch("/api/exchanges/" + buyRequestId + "/complete")
                .header("Authorization", bearer(bobToken)), 200);
        assertThat(bookStatus(aliceSellId)).isEqualTo("EXCHANGED");

        JsonNode finalDashboard = request(get("/api/dashboard/stats")
                .header("Authorization", bearer(aliceToken)), 200);
        assertThat(finalDashboard.path("completedExchanges").asLong()).isEqualTo(2);
        assertThat(finalDashboard.path("exchangedBooks").asLong()).isEqualTo(2);
        assertThat(finalDashboard.path("pendingIncomingRequests").asLong()).isZero();
    }

    @Test
    void adminEndpointsRequireAdminRole() throws Exception {
        JsonNode student = register("Regular Student", "student@test.local");
        String studentToken = student.path("token").asText();

        request(get("/api/admin/stats")
                .header("Authorization", bearer(studentToken)), 403);
        request(get("/api/admin/users")
                .header("Authorization", bearer(studentToken)), 403);

        JsonNode adminLogin = request(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("email", ADMIN_EMAIL, "password", ADMIN_PASSWORD))), 200);
        String adminToken = adminLogin.path("token").asText();
        assertThat(adminLogin.path("user").path("role").asText()).isEqualTo("ADMIN");

        JsonNode stats = request(get("/api/admin/stats")
                .header("Authorization", bearer(adminToken)), 200);
        assertThat(stats.path("totalStudents").asLong()).isEqualTo(1);
        assertThat(stats.path("totalBooks").asLong()).isZero();

        JsonNode users = request(get("/api/admin/users")
                .header("Authorization", bearer(adminToken)), 200);
        assertThat(users.size()).isEqualTo(2);

        JsonNode publicStats = request(get("/api/public/stats"), 200);
        assertThat(publicStats.path("availableBooks").asLong()).isZero();
        assertThat(publicStats.path("registeredStudents").asLong()).isEqualTo(1);
    }

    private JsonNode register(String name, String email) throws Exception {
        return request(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                        "name", name,
                        "email", email,
                        "password", PASSWORD,
                        "collegeName", "North Campus University"))), 201);
    }

    private long createBook(String token, String title, String author, String description,
                            String category, int price, String condition, String listingType)
            throws Exception {
        JsonNode created = request(post("/api/books")
                .header("Authorization", bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(bookPayload(title, author, description, category, price,
                        condition, listingType))), 201);
        return created.path("id").asLong();
    }

    private Map<String, Object> bookPayload(String title, String author, String description,
                                            String category, int price, String condition,
                                            String listingType) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("title", title);
        payload.put("author", author);
        payload.put("description", description);
        payload.put("category", category);
        payload.put("price", price);
        payload.put("condition", condition);
        payload.put("listingType", listingType);
        return payload;
    }

    private String bookStatus(long id) throws Exception {
        return request(get("/api/books/" + id), 200).path("status").asText();
    }

    private boolean containsStatus(JsonNode books, String status) {
        for (JsonNode book : books) {
            if (status.equals(book.path("status").asText())) {
                return true;
            }
        }
        return false;
    }

    private JsonNode request(MockHttpServletRequestBuilder builder, int expectedStatus)
            throws Exception {
        MvcResult result = mockMvc.perform(builder)
                .andExpect(status().is(expectedStatus))
                .andReturn();
        String body = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        return body.isBlank() ? objectMapper.createObjectNode() : objectMapper.readTree(body);
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private byte[] pngBytes() {
        return java.util.Base64.getDecoder().decode(
                "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==");
    }
}
