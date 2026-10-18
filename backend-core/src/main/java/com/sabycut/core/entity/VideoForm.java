package com.sabycut.core.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "video_forms")
public class VideoForm {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; // null if system template

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(name = "target_aspect_ratio", nullable = false, length = 10)
    private String targetAspectRatio;

    @Column(name = "target_duration_seconds", nullable = false)
    private double targetDurationSeconds;

    @Column(name = "config_json", nullable = false, columnDefinition = "TEXT")
    private String configJson;

    @Column(name = "is_system", nullable = false)
    private boolean isSystem;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public VideoForm() {
        this.id = UUID.randomUUID().toString();
        this.isSystem = false;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getTargetAspectRatio() { return targetAspectRatio; }
    public void setTargetAspectRatio(String targetAspectRatio) { this.targetAspectRatio = targetAspectRatio; }

    public double getTargetDurationSeconds() { return targetDurationSeconds; }
    public void setTargetDurationSeconds(double targetDurationSeconds) { this.targetDurationSeconds = targetDurationSeconds; }

    public String getConfigJson() { return configJson; }
    public void setConfigJson(String configJson) { this.configJson = configJson; }

    public boolean isSystem() { return isSystem; }
    public void setSystem(boolean system) { isSystem = system; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
