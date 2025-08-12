// AJOUTS À FAIRE dans MouvementRepository.java
// src/main/java/org/example/collectfocep/repositories/MouvementRepository.java

// 🔥 NOUVELLES MÉTHODES À AJOUTER dans l'interface MouvementRepository

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Récupère les mouvements récents d'un client
 */
@Query("SELECT m FROM Mouvement m WHERE m.client.id = :clientId ORDER BY m.dateOperation DESC")
List<Mouvement> findByClientIdOrderByDateOperationDesc(@Param("clientId") Long clientId, Pageable pageable);

/**
 * Calcule le total des montants par sens (EPARGNE ou RETRAIT)
 */
@Query("SELECT COALESCE(SUM(m.montant), 0) FROM Mouvement m WHERE m.client.id = :clientId AND UPPER(m.sens) = UPPER(:sens)")
Double sumMontantByClientIdAndSens(@Param("clientId") Long clientId, @Param("sens") String sens);

/**
 * 🔥 REQUÊTE OPTIMISÉE : Calcule tous les totaux en une seule requête
 */
@Query("SELECT " +
       "COALESCE(SUM(CASE WHEN UPPER(m.sens) = 'EPARGNE' THEN m.montant ELSE 0 END), 0) as totalEpargne, " +
       "COALESCE(SUM(CASE WHEN UPPER(m.sens) = 'RETRAIT' THEN m.montant ELSE 0 END), 0) as totalRetraits " +
       "FROM Mouvement m WHERE m.client.id = :clientId")
Object[] calculateTotalsForClient(@Param("clientId") Long clientId);

/**
 * Compte le nombre total de transactions d'un client
 */
@Query("SELECT COUNT(m) FROM Mouvement m WHERE m.client.id = :clientId")
Long countTransactionsByClientId(@Param("clientId") Long clientId);

/**
 * Récupère la date de la dernière transaction d'un client
 */
@Query("SELECT MAX(m.dateOperation) FROM Mouvement m WHERE m.client.id = :clientId")
LocalDateTime getLastTransactionDate(@Param("clientId") Long clientId);

/**
 * 🔥 REQUÊTE AVANCÉE : Stats complètes client en une seule requête
 */
@Query("SELECT " +
       "COUNT(m) as nombreTransactions, " +
       "COALESCE(SUM(CASE WHEN UPPER(m.sens) = 'EPARGNE' THEN m.montant ELSE 0 END), 0) as totalEpargne, " +
       "COALESCE(SUM(CASE WHEN UPPER(m.sens) = 'RETRAIT' THEN m.montant ELSE 0 END), 0) as totalRetraits, " +
       "MAX(m.dateOperation) as derniereTransaction " +
       "FROM Mouvement m WHERE m.client.id = :clientId")
Object[] getCompleteStatsForClient(@Param("clientId") Long clientId);