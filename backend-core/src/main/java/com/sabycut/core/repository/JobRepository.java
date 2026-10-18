package com.sabycut.core.repository;

import com.sabycut.core.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface JobRepository extends JpaRepository<Job, String> {
    List<Job> findByUserIdOrderByCreatedAtDesc(String userId);
}
