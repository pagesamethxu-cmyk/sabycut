package com.sabycut.core.repository;

import com.sabycut.core.entity.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AssetRepository extends JpaRepository<Asset, String> {
    List<Asset> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Asset> findByProjectId(String projectId);
}
