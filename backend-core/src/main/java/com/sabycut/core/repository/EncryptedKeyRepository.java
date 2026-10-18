package com.sabycut.core.repository;

import com.sabycut.core.entity.EncryptedKey;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EncryptedKeyRepository extends JpaRepository<EncryptedKey, String> {
    Optional<EncryptedKey> findByUserIdAndProvider(String userId, String provider);
}
