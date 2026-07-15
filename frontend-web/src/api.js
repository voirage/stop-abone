import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Création d'une instance axios configurée
const api = axios.create({
  baseURL: API_URL,
});

// Intercepteur pour ajouter le token JWT à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    console.log(`[API REQUEST] URL appelée : ${config.baseURL || ''}${config.url}`);
    if (token) {
      console.log(`[API REQUEST] Token JWT envoyé : Bearer ${token.substring(0, 10)}...`);
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log(`[API REQUEST] Aucun token JWT trouvé dans localStorage.`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.log(`[API RESPONSE] Succès ${response.config.url} - Code HTTP : ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`[API ERROR] URL : ${error.config?.url} - Code HTTP : ${error.response?.status}`);
    console.error(`[API ERROR] Corps de l'erreur :`, error.response?.data || error.message);
    
    // Déconnexion complète forcée si le token est invalide/expiré (401)
    if (error.response && error.response.status === 401) {

      console.warn("[API ERROR] Erreur 401: Déconnexion forcée et suppression du token.");
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token');
      // On recharge la page pour vider tout l'état de l'application
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'; // ou window.location.reload()
      }
    }
    
    return Promise.reject(error);
  }
);

export const login = async (email, password) => {
  // POST /token attend des données au format application/x-www-form-urlencoded
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);
  
  const response = await api.post('/token', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return response.data;
};

export const register = async (email, password) => {
  const response = await api.post('/inscription', { email, password });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, new_password, confirm_password) => {
  const response = await api.post('/auth/reset-password', { token, new_password, confirm_password });
  return response.data;
};

export const getResume = async () => {
  const response = await api.get('/abonnements/resume');
  return response.data;
};

export const getAbonnements = async () => {
  const response = await api.get('/abonnements');
  console.log("[TRACE 1] Valeur renvoyée par l'API (/abonnements):", response.data);
  return response.data;
};

export const createAbonnement = async (data) => {
  const response = await api.post('/abonnements', data);
  return response.data;
};

export const deleteAbonnement = async (id) => {
  const response = await api.delete(`/abonnements/${id}`);
  return response.data;
};

export const downloadLettreResiliation = async (id, nom) => {
  const response = await api.get(`/abonnements/${id}/lettre-resiliation`, {
    responseType: 'blob', // Important pour télécharger un fichier
  });
  
  // Créer un lien pour force le téléchargement
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `resiliation_${nom}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const analyserCSV = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const token = localStorage.getItem('access_token');
  const urlComplete = `${api.defaults.baseURL || ''}/imports/csv/analyser`;
  
  console.log("=== DEBUG AXIOS analyserCSV ===");
  console.log("- URL complète appelée:", urlComplete);
  console.log("- Méthode HTTP: POST");
  console.log("- Headers Axios (defaults):", api.defaults.headers);
  console.log("- Présence du Bearer Token:", token ? `Oui (Bearer ${token.substring(0, 10)}...)` : "Non");
  console.log("- Contenu du FormData:");
  for (let [key, value] of formData.entries()) {
    console.log(`  ${key}:`, value);
  }
  
  try {
    const response = await api.post('/imports/csv/analyser', formData);
    console.log("=== SUCCES AXIOS analyserCSV ===", response.data);
    return response.data;
  } catch (error) {
    console.error("=== ERREUR AXIOS analyserCSV ===");
    console.error("- Message d'erreur:", error.message);
    if (error.response) {
      console.error("- Réponse d'erreur complète:", error.response);
      console.error("- Statut:", error.response.status);
      console.error("- Données (data):", error.response.data);
    } else {
      console.error("- Aucune réponse reçue du serveur.");
    }
    throw error;
  }
};

export default api;
