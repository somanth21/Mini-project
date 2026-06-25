package com.feedlink.backend.service;

import com.feedlink.backend.entity.Notification;
import com.feedlink.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository repository;
    private final SimpMessagingTemplate messagingTemplate;

    public Notification sendNotification(Long userId, String title, String message) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .isRead(false)
                .build();
        Notification saved = repository.save(notification);
        
        // Broadcast via WebSocket
        try {
            messagingTemplate.convertAndSend("/topic/notifications", saved);
            messagingTemplate.convertAndSend("/topic/user/" + userId + "/notifications", saved);
        } catch (Exception e) {
            System.err.println("Failed to broadcast WebSocket notification: " + e.getMessage());
        }
        
        return saved;
    }

    public List<Notification> getNotificationsForUser(Long userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Notification markAsRead(Long id) {
        Notification n = repository.findById(id).orElseThrow();
        n.setRead(true);
        return repository.save(n);
    }
}
