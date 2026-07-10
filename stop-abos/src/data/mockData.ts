import { Abonnement } from '../models/types';

export const abonnementsMock: Abonnement[] = [
  {
    id: '1',
    nom: 'Netflix',
    categorie: 'Streaming',
    prix: 13.49,
    frequence: 'mensuel',
    prochaine_date_renouvellement: '2026-07-01',
    statut: 'actif',
  },
  {
    id: '2',
    nom: 'Spotify',
    categorie: 'Streaming',
    prix: 10.99,
    frequence: 'mensuel',
    prochaine_date_renouvellement: '2026-07-05',
    statut: 'actif',
  },
  {
    id: '3',
    nom: 'SFR Box',
    categorie: 'Télécom',
    prix: 29.99,
    frequence: 'mensuel',
    prochaine_date_renouvellement: '2026-07-15',
    statut: 'a_resilier',
  },
  {
    id: '4',
    nom: 'Amazon Prime',
    categorie: 'Streaming',
    prix: 69.90,
    frequence: 'annuel',
    prochaine_date_renouvellement: '2026-11-20',
    statut: 'actif',
  }
];
