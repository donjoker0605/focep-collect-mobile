// src/main/java/org/example/collectfocep/dto/MouvementDTO.java
package org.example.collectfocep.dto;

import org.example.collectfocep.entities.Mouvement;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;

/**
 * DTO pour les mouvements/transactions client
 * Version allégée pour l'affichage dans l'historique mobile
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MouvementDTO {
    
    private Long id;
    private Double montant;
    private String sens; // EPARGNE, RETRAIT
    private String libelle;
    private LocalDateTime dateOperation;
    private String typeMouvement;
    
    // Infos collecteur (pour traçabilité)
    private Long collecteurId;
    private String collecteurNom;
    
    // Constructeurs
    public MouvementDTO() {}
    
    public MouvementDTO(Mouvement mouvement) {
        this.id = mouvement.getId();
        this.montant = mouvement.getMontant();
        this.sens = mouvement.getSens();
        this.libelle = mouvement.getLibelle();
        this.dateOperation = mouvement.getDateOperation();
        this.typeMouvement = mouvement.getTypeMouvement();
        
        // Infos collecteur si disponibles
        if (mouvement.getCollecteur() != null) {
            this.collecteurId = mouvement.getCollecteur().getId();
            this.collecteurNom = mouvement.getCollecteur().getPrenom() + " " + 
                               mouvement.getCollecteur().getNom();
        }
    }
    
    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Double getMontant() { return montant; }
    public void setMontant(Double montant) { this.montant = montant; }
    
    public String getSens() { return sens; }
    public void setSens(String sens) { this.sens = sens; }
    
    public String getLibelle() { return libelle; }
    public void setLibelle(String libelle) { this.libelle = libelle; }
    
    public LocalDateTime getDateOperation() { return dateOperation; }
    public void setDateOperation(LocalDateTime dateOperation) { this.dateOperation = dateOperation; }
    
    public String getTypeMouvement() { return typeMouvement; }
    public void setTypeMouvement(String typeMouvement) { this.typeMouvement = typeMouvement; }
    
    public Long getCollecteurId() { return collecteurId; }
    public void setCollecteurId(Long collecteurId) { this.collecteurId = collecteurId; }
    
    public String getCollecteurNom() { return collecteurNom; }
    public void setCollecteurNom(String collecteurNom) { this.collecteurNom = collecteurNom; }
    
    // Méthodes utilitaires
    public boolean isEpargne() {
        return "EPARGNE".equalsIgnoreCase(this.sens);
    }
    
    public boolean isRetrait() {
        return "RETRAIT".equalsIgnoreCase(this.sens);
    }
}