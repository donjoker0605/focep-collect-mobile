// MODIFICATIONS À APPORTER dans ClientController.java
// src/main/java/org/example/collectfocep/web/controllers/ClientController.java

import org.example.collectfocep.dto.ClientSummaryDTO;
import org.example.collectfocep.services.ClientStatsService;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * 🔥 VERSION ENRICHIE de la méthode getClientsCollecteur
 * Remplace la méthode existante dans ClientController.java
 */
@GetMapping("/collecteur/{collecteurId}")
public ResponseEntity<?> getClientsCollecteur(@PathVariable Long collecteurId, Authentication authentication) {
    try {
        logger.info("📋 Récupération des clients ENRICHIS pour le collecteur: {} par {}", 
                   collecteurId, authentication.getName());

        // Vérification des permissions (code existant inchangé)
        if (!securityService.canAccessCollecteurData(collecteurId, authentication)) {
            logger.warn("🚫 Accès refusé au collecteur {} pour {}", collecteurId, authentication.getName());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("Accès non autorisé", null));
        }
        
        logger.info("🎯 Permissions vérifiées: canAccess=true pour collecteur={}", collecteurId);

        // Vérifier que le collecteur existe
        if (!collecteurRepository.existsById(collecteurId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Collecteur non trouvé", null));
        }

        // 🔥 RÉCUPÉRATION CLASSIQUE DES CLIENTS
        List<Client> clients = clientRepository.findByCollecteurId(collecteurId);
        
        // 🔥 ENRICHISSEMENT AVEC STATS, TRANSACTIONS ET TOTAUX
        List<ClientSummaryDTO> enrichedClients = clients.parallelStream() // Parallélisation pour les perfs
            .map(clientStatsService::enrichClientWithStats)
            .collect(Collectors.toList());

        logger.info("✅ Récupéré {} clients ENRICHIS pour le collecteur {}", clients.size(), collecteurId);
        
        // 🔥 RÉPONSE ENRICHIE
        return ResponseEntity.ok(ApiResponse.success(
            "Récupéré " + clients.size() + " clients avec statistiques complètes", 
            enrichedClients));

    } catch (Exception e) {
        logger.error("❌ Erreur lors de la récupération des clients enrichis pour collecteur {}: {}", 
                    collecteurId, e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("Erreur lors de la récupération des clients", null));
    }
}

// 🔥 NOUVELLE MÉTHODE : Endpoint dédié pour un client avec détails complets
@GetMapping("/{clientId}/summary")
public ResponseEntity<?> getClientSummary(@PathVariable Long clientId, Authentication authentication) {
    try {
        logger.info("📊 Récupération du résumé complet pour le client: {} par {}", clientId, authentication.getName());

        // Récupérer le client
        Optional<Client> clientOpt = clientRepository.findById(clientId);
        if (!clientOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Client non trouvé", null));
        }

        Client client = clientOpt.get();

        // Vérification des permissions
        if (!securityService.canAccessCollecteurData(client.getCollecteur().getId(), authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("Accès non autorisé", null));
        }

        // 🔥 ENRICHISSEMENT COMPLET
        ClientSummaryDTO enrichedClient = clientStatsService.enrichClientWithStats(client);

        return ResponseEntity.ok(ApiResponse.success("Résumé client récupéré", enrichedClient));

    } catch (Exception e) {
        logger.error("❌ Erreur lors de la récupération du résumé client {}: {}", clientId, e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("Erreur lors de la récupération du résumé", null));
    }
}

// 🔥 INJECTION DU NOUVEAU SERVICE
@Autowired
private ClientStatsService clientStatsService;