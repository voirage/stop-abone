import React, { createContext, useState, ReactNode, useEffect, useContext, useCallback } from 'react';
import { Abonnement, StatutAbonnement } from '../models/types';
import api from '../services/api';
import { AuthContext } from './AuthContext';

interface SubscriptionContextType {
  abonnements: Abonnement[];
  chargerAbonnements: () => Promise<void>;
  ajouterAbonnement: (abonnement: Omit<Abonnement, 'id'>) => Promise<boolean>;
  modifierStatut: (id: string | number, statut: StatutAbonnement) => Promise<boolean>;
}

export const SubscriptionContext = createContext<SubscriptionContextType>({
  abonnements: [],
  chargerAbonnements: async () => { },
  ajouterAbonnement: async () => false,
  modifierStatut: async () => false,
});

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [abonnements, setAbonnements] = useState<Abonnement[]>([]);
  const { token } = useContext(AuthContext);

  const chargerAbonnements = useCallback(async () => {
    if (!token) {
      setAbonnements([]);
      return;
    }
    try {
      const res = await api.get('/abonnements');
      setAbonnements(res.data);
    } catch (e) {
      console.error("Erreur chargement abonnements", e);
    }
  }, [token]);

  useEffect(() => {
    chargerAbonnements();
  }, [chargerAbonnements]);

  const ajouterAbonnement = async (abonnement: Omit<Abonnement, 'id'>) => {
    try {
      await api.post('/abonnements', abonnement);
      await chargerAbonnements();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const modifierStatut = async (id: string | number, statut: StatutAbonnement) => {
    try {
      await api.put(`/abonnements/${id}`, { statut });
      await chargerAbonnements();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return (
    <SubscriptionContext.Provider value={{ abonnements, chargerAbonnements, ajouterAbonnement, modifierStatut }}>
      {children}
    </SubscriptionContext.Provider>
  );
};
