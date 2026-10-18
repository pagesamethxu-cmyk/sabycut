package com.sabycut.core.repository;

import com.sabycut.core.entity.VideoForm;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VideoFormRepository extends JpaRepository<VideoForm, String> {
    List<VideoForm> findByIsSystemTrue();
    List<VideoForm> findByUserIdOrIsSystemTrue(String userId);
}
