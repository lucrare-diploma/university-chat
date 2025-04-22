/**
 * Utilitar pentru gestionarea controlului de acces bazat pe domenii de email
 */

/**
 * Verifică dacă un email aparține domeniilor permise (usv.ro sau usm.ro)
 * @param {string} email - Adresa de email de verificat
 * @returns {boolean} - true dacă emailul este permis, false în caz contrar
 */
export const isAllowedEmail = (email) => {
  if (!email) return false;
  
  const emailLower = email.toLowerCase();
  const allowedDomains = ["usv.ro", "usm.ro"];
  
  // Verificare pentru @domain.ro sau @student.domain.ro
  return allowedDomains.some(domain => 
    emailLower.endsWith(`@${domain}`) || 
    emailLower.includes(`@student.${domain}`)
  );
};

/**
 * Lista de domenii permise pentru afișare în mesaje de eroare
 */
export const ALLOWED_DOMAINS_TEXT = "usv.ro și usm.ro";

/**
 * Returnează un mesaj de eroare formatat pentru acces neautorizat
 */
export const getUnauthorizedMessage = () => {
  return `Acces permis doar pentru adrese de email din domeniile ${ALLOWED_DOMAINS_TEXT}.`;
};