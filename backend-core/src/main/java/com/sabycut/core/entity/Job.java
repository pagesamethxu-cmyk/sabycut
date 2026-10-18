package com.sabycut.core.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "jobs")
public class Job {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(nullable = false, length = 30)
    private String type; // 'AUTOCUT', 'EXPORT', 'ANALYSIS'

    @Column(nullable = false, length = 30)
    private String status; // 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'

    @Column(name = "current_step", length = 50)
    private String currentStep;

    @Column(name = "progress_percentage", nullable = false)
    private int progressPercentage;

    @Column(name = "input_params_json", columnDefinition = "TEXT")
    private String inputParamsJson;

    @Column(name = "result_payload_json", columnDefinition = "TEXT")
    private String resultPayloadJson;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Job() {
        this.id = UUID.randomUUID().toString();
        this.status = "PENDING";
        this.progressPercentage = 0;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public Job(User user, String type) {
        this();
        this.user = user;
        this.type = type;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCurrentStep() { return currentStep; }
    public void setCurrentStep(String currentStep) { this.currentStep = currentStep; }

    public int getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(int progressPercentage) { this.progressPercentage = progressPercentage; }

    public String getInputParamsJson() { return inputParamsJson; }
    public void setInputParamsJson(String inputParamsJson) { this.inputParamsJson = inputParamsJson; }

    public String getResultPayloadJson() { return resultPayloadJson; }
    public void setResultPayloadJson(String resultPayloadJson) { this.resultPayloadJson = resultPayloadJson; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
