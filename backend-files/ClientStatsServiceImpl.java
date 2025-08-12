// src/main/java/org/example/collectfocep/services/impl/ClientStatsServiceImpl.java
package org.example.collectfocep.services.impl;

import org.example.collectfocep.dto.ClientSummaryDTO;
import org.example.collectfocep.dto.MouvementDTO;
import org.example.collectfocep.entities.Client;
import org.example.collectfocep.entities.Mouvement;
import org.example.collectfocep.repositories.MouvementRepository;
import org.example.collectfocep.services.ClientStatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implémentation du service de statistiques client
 * 🔥 OPTIMISÉ pour les performances avec des requêtes ciblées
 */
@Service
public class ClientStatsServiceImpl implements ClientStatsService {

    @Autowired
    private MouvementRepository mouvementRepository;

    @Override
    public ClientSummaryDTO enrichClientWithStats(Client client) {
        ClientSummaryDTO dto = new ClientSummaryDTO(client);
        
        // 🔥 OPTIMISATION : Une seule requête pour toutes les stats
        enrichWithAllStats(dto, client.getId());
        
        return dto;
    }

    @Override
    public List<MouvementDTO> getRecentTransactions(Long clientId, int limit) {
        PageRequest pageRequest = PageRequest.of(0, limit, 
            Sort.by(Sort.Direction.DESC, "dateOperation"));
        
        List<Mouvement> mouvements = mouvementRepository.findByClientIdOrderByDateOperationDesc(
            clientId, pageRequest);
            
        return mouvements.stream()
            .map(MouvementDTO::new)
            .collect(Collectors.toList());
    }

    @Override
    public Double getTotalEpargne(Long clientId) {
        Double total = mouvementRepository.sumMontantByClientIdAndSens(clientId, "EPARGNE");
        return total != null ? total : 0.0;
    }

    @Override
    public Double getTotalRetraits(Long clientId) {
        Double total = mouvementRepository.sumMontantByClientIdAndSens(clientId, "RETRAIT");
        return total != null ? total : 0.0;
    }

    @Override
    public ClientSummaryDTO.CommissionParameterDTO getCommissionParameters(Long clientId) {
        // 🔥 TODO: Implémenter quand la table commission_parameters sera créée
        // Pour l'instant, retourner des paramètres par défaut selon le profil client
        
        // Exemple de logique simple basée sur le solde actuel
        return createDefaultCommissionParameters(clientId);
    }

    /**
     * 🔥 MÉTHODE OPTIMISÉE : Enrichit toutes les stats en une seule fois
     */
    private void enrichWithAllStats(ClientSummaryDTO dto, Long clientId) {
        // Récupérer les transactions récentes
        dto.setTransactions(getRecentTransactions(clientId, 20));
        
        // 🔥 OPTIMISATION : Calcul direct via requête groupée
        Object[] totals = mouvementRepository.calculateTotalsForClient(clientId);
        if (totals != null && totals.length >= 2) {
            Double totalEpargne = (Double) totals[0];
            Double totalRetraits = (Double) totals[1];
            
            dto.setTotalEpargne(totalEpargne != null ? totalEpargne : 0.0);
            dto.setTotalRetraits(totalRetraits != null ? totalRetraits : 0.0);
        } else {
            // Fallback si la méthode groupée échoue
            dto.setTotalEpargne(getTotalEpargne(clientId));
            dto.setTotalRetraits(getTotalRetraits(clientId));
        }
        
        // Paramètres de commission
        dto.setCommissionParameter(getCommissionParameters(clientId));
    }
    
    /**
     * Crée des paramètres de commission par défaut
     * 🔥 TODO: Remplacer par la vraie logique métier
     */
    private ClientSummaryDTO.CommissionParameterDTO createDefaultCommissionParameters(Long clientId) {
        ClientSummaryDTO.CommissionParameterDTO params = 
            new ClientSummaryDTO.CommissionParameterDTO();
        
        // Exemple de logique simple : commission par pourcentage
        params.setTypeCommission("POURCENTAGE");
        params.setPourcentage(2.0); // 2% par défaut
        
        // TODO: Implémenter la vraie logique selon les règles métier
        // - Lire depuis une table commission_parameters
        // - Appliquer les règles selon le profil client, ancienneté, etc.
        
        return params;
    }
}