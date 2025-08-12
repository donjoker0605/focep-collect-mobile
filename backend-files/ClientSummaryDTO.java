// src/main/java/org/example/collectfocep/dto/ClientSummaryDTO.java
package org.example.collectfocep.dto;

import org.example.collectfocep.entities.Client;
import org.example.collectfocep.entities.CompteClient;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO enrichi pour les clients avec soldes, transactions et totaux
 * Utilisé pour l'affichage dans l'application mobile avec système de double solde
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ClientSummaryDTO {
    
    private Long id;
    private String nom;
    private String prenom;
    private String numeroCompte;
    private String telephone;
    private Boolean valide;
    private String quartier;
    private String ville;
    private LocalDateTime dateCreation;
    
    // 🔥 COMPTE CLIENT AVEC SOLDE
    private CompteClientDTO compteClient;
    
    // 🔥 TRANSACTIONS RÉCENTES
    private List<MouvementDTO> transactions;
    
    // 🔥 TOTAUX CALCULÉS
    private Double totalEpargne;
    private Double totalRetraits;
    private Double soldeNet; // totalEpargne - totalRetraits
    
    // 🔥 PARAMÈTRES DE COMMISSION (pour calcul solde disponible)
    private CommissionParameterDTO commissionParameter;
    
    // 🔥 STATISTIQUES
    private Integer nombreTransactions;
    private LocalDateTime derniereTransaction;
    
    // Constructeurs
    public ClientSummaryDTO() {}
    
    public ClientSummaryDTO(Client client) {
        this.id = client.getId();
        this.nom = client.getNom();
        this.prenom = client.getPrenom();
        this.numeroCompte = client.getNumeroCompte();
        this.telephone = client.getTelephone();
        this.valide = client.getValide();
        this.quartier = client.getQuartier();
        this.ville = client.getVille();
        this.dateCreation = client.getDateCreation();
        
        // Convertir le compte client
        if (client.getCompteClient() != null) {
            this.compteClient = new CompteClientDTO(client.getCompteClient());
        }
    }
    
    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    
    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }
    
    public String getNumeroCompte() { return numeroCompte; }
    public void setNumeroCompte(String numeroCompte) { this.numeroCompte = numeroCompte; }
    
    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }
    
    public Boolean getValide() { return valide; }
    public void setValide(Boolean valide) { this.valide = valide; }
    
    public String getQuartier() { return quartier; }
    public void setQuartier(String quartier) { this.quartier = quartier; }
    
    public String getVille() { return ville; }
    public void setVille(String ville) { this.ville = ville; }
    
    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }
    
    public CompteClientDTO getCompteClient() { return compteClient; }
    public void setCompteClient(CompteClientDTO compteClient) { this.compteClient = compteClient; }
    
    public List<MouvementDTO> getTransactions() { return transactions; }
    public void setTransactions(List<MouvementDTO> transactions) { 
        this.transactions = transactions;
        // Calculer stats automatiquement
        if (transactions != null) {
            this.nombreTransactions = transactions.size();
            this.derniereTransaction = transactions.stream()
                .map(MouvementDTO::getDateOperation)
                .max(LocalDateTime::compareTo)
                .orElse(null);
        }
    }
    
    public Double getTotalEpargne() { return totalEpargne; }
    public void setTotalEpargne(Double totalEpargne) { 
        this.totalEpargne = totalEpargne; 
        calculerSoldeNet();
    }
    
    public Double getTotalRetraits() { return totalRetraits; }
    public void setTotalRetraits(Double totalRetraits) { 
        this.totalRetraits = totalRetraits; 
        calculerSoldeNet();
    }
    
    public Double getSoldeNet() { return soldeNet; }
    public void setSoldeNet(Double soldeNet) { this.soldeNet = soldeNet; }
    
    public CommissionParameterDTO getCommissionParameter() { return commissionParameter; }
    public void setCommissionParameter(CommissionParameterDTO commissionParameter) { 
        this.commissionParameter = commissionParameter; 
    }
    
    public Integer getNombreTransactions() { return nombreTransactions; }
    public void setNombreTransactions(Integer nombreTransactions) { this.nombreTransactions = nombreTransactions; }
    
    public LocalDateTime getDerniereTransaction() { return derniereTransaction; }
    public void setDerniereTransaction(LocalDateTime derniereTransaction) { this.derniereTransaction = derniereTransaction; }
    
    // Méthode utilitaire
    private void calculerSoldeNet() {
        if (totalEpargne != null && totalRetraits != null) {
            this.soldeNet = totalEpargne - totalRetraits;
        }
    }
    
    /**
     * DTO pour le compte client
     */
    public static class CompteClientDTO {
        private Long id;
        private String numeroCompte;
        private Double solde;
        private String typeCompte;
        
        public CompteClientDTO() {}
        
        public CompteClientDTO(CompteClient compte) {
            this.id = compte.getId();
            this.numeroCompte = compte.getNumeroCompte();
            this.solde = compte.getSolde();
            this.typeCompte = compte.getTypeCompte();
        }
        
        // Getters et Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public String getNumeroCompte() { return numeroCompte; }
        public void setNumeroCompte(String numeroCompte) { this.numeroCompte = numeroCompte; }
        
        public Double getSolde() { return solde; }
        public void setSolde(Double solde) { this.solde = solde; }
        
        public String getTypeCompte() { return typeCompte; }
        public void setTypeCompte(String typeCompte) { this.typeCompte = typeCompte; }
    }
    
    /**
     * DTO pour les paramètres de commission
     */
    public static class CommissionParameterDTO {
        private String typeCommission; // POURCENTAGE, FIXE, PALIER
        private Double pourcentage;
        private Double montantFixe;
        private List<PalierCommissionDTO> paliers;
        
        // Constructeurs et getters/setters
        public CommissionParameterDTO() {}
        
        public String getTypeCommission() { return typeCommission; }
        public void setTypeCommission(String typeCommission) { this.typeCommission = typeCommission; }
        
        public Double getPourcentage() { return pourcentage; }
        public void setPourcentage(Double pourcentage) { this.pourcentage = pourcentage; }
        
        public Double getMontantFixe() { return montantFixe; }
        public void setMontantFixe(Double montantFixe) { this.montantFixe = montantFixe; }
        
        public List<PalierCommissionDTO> getPaliers() { return paliers; }
        public void setPaliers(List<PalierCommissionDTO> paliers) { this.paliers = paliers; }
        
        public static class PalierCommissionDTO {
            private Double montantMin;
            private Double montantMax;
            private Double pourcentage;
            
            public PalierCommissionDTO() {}
            
            public PalierCommissionDTO(Double montantMin, Double montantMax, Double pourcentage) {
                this.montantMin = montantMin;
                this.montantMax = montantMax;
                this.pourcentage = pourcentage;
            }
            
            public Double getMontantMin() { return montantMin; }
            public void setMontantMin(Double montantMin) { this.montantMin = montantMin; }
            
            public Double getMontantMax() { return montantMax; }
            public void setMontantMax(Double montantMax) { this.montantMax = montantMax; }
            
            public Double getPourcentage() { return pourcentage; }
            public void setPourcentage(Double pourcentage) { this.pourcentage = pourcentage; }
        }
    }
}