export type StatutAbonnement = 'actif' | 'a_resilier' | 'resilie';
export type FrequenceAbonnement = 'mensuel' | 'annuel';

export interface Abonnement {
  id: string;
  nom: string;
  categorie: string;
  prix: number;
  frequence: FrequenceAbonnement;
  prochaine_date_renouvellement?: string;
  numero_contrat?: string;
  statut: StatutAbonnement;
  renouvellement_auto?: boolean;
}
