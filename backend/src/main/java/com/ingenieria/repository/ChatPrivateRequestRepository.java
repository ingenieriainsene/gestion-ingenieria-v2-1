package com.ingenieria.repository;

import com.ingenieria.model.ChatPrivateRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatPrivateRequestRepository extends JpaRepository<ChatPrivateRequest, Long> {
    List<ChatPrivateRequest> findByToUserIdAndStatusOrderByCreatedAtDesc(
            UUID toUserId,
            ChatPrivateRequest.Status status);

    @Query("""
            SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END
            FROM ChatPrivateRequest r
            WHERE r.status = 'PENDING'
              AND (
                    (r.fromUserId = :userA AND r.toUserId = :userB)
                 OR (r.fromUserId = :userB AND r.toUserId = :userA)
              )
            """)
    boolean existsPendingBetween(@Param("userA") UUID userA, @Param("userB") UUID userB);
}
