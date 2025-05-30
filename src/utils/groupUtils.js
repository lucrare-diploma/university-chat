// src/utils/groupUtils.js
import { 
    collection, 
    doc, 
    addDoc, 
    getDocs, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc,
    query, 
    where, 
    arrayUnion, 
    arrayRemove,
    serverTimestamp 
  } from "firebase/firestore";
  import { db } from "../firebase/config";
  import CryptoJS from 'crypto-js';
  
  /**
   * Generează un cod unic pentru grup (6 caractere alfanumerice)
   * Folosește caractere care sunt ușor de citit și de introdus
   */
  export const generateGroupCode = () => {
    // Excludem caracterele care se pot confunda (0, O, I, 1, etc.)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  /**
   * Generează o cheie de criptare pentru grup
   * Această cheie va fi folosită pentru criptarea tuturor mesajelor din grup
   */
  export const generateGroupEncryptionKey = () => {
    return CryptoJS.lib.WordArray.random(256/8).toString();
  };
  
  /**
   * Caută un grup după codul său unic
   * @param {string} code - Codul grupului de căutat (6 caractere)
   * @returns {Object|null} - Grupul găsit sau null dacă nu există
   */
  export const getGroupByCode = async (code) => {
    try {
      // Normalizăm codul (uppercase și fără spații)
      const normalizedCode = code.trim().toUpperCase();
      
      // Creăm o interogare pentru a căuta grupul cu codul specificat
      const groupsRef = collection(db, "groups");
      const q = query(groupsRef, where("code", "==", normalizedCode));
      
      // Executăm interogarea
      const querySnapshot = await getDocs(q);
      
      // Verificăm dacă am găsit vreun grup
      if (querySnapshot.empty) {
        console.log("Nu s-a găsit niciun grup cu codul:", normalizedCode);
        return null;
      }
      
      // Ar trebui să existe un singur grup cu acest cod (deoarece codurile sunt unice)
      const groupDoc = querySnapshot.docs[0];
      const groupData = {
        id: groupDoc.id,
        ...groupDoc.data()
      };
      
      console.log("Grup găsit cu codul:", normalizedCode, groupData);
      return groupData;
      
    } catch (error) {
      console.error("Eroare la căutarea grupului după cod:", error);
      throw error;
    }
  };
  
  /**
   * Creează un grup nou cu un cod unic
   * @param {Object} groupData - Datele grupului (name, description, etc.)
   * @param {string} creatorId - ID-ul utilizatorului care creează grupul
   * @returns {Object} - Grupul creat cu toate datele
   */
  export const createGroup = async (groupData, creatorId) => {
    try {
      // Validăm datele de intrare
      if (!groupData.name || !groupData.name.trim()) {
        throw new Error("Numele grupului este obligatoriu");
      }
      
      if (!creatorId) {
        throw new Error("ID-ul creatorului este obligatoriu");
      }
      
      // Generăm un cod unic pentru grup
      let groupCode;
      let codeExists = true;
      let attempts = 0;
      const maxAttempts = 10; // Limitez tentativele pentru a evita loop-uri infinite
      
      // Verificăm că codul generat este unic
      while (codeExists && attempts < maxAttempts) {
        groupCode = generateGroupCode();
        const existingGroup = await getGroupByCode(groupCode);
        codeExists = existingGroup !== null;
        attempts++;
      }
      
      if (codeExists) {
        throw new Error("Nu s-a putut genera un cod unic pentru grup după mai multe încercări");
      }
      
      // Generăm cheia de criptare pentru grup
      const encryptionKey = generateGroupEncryptionKey();
      
      // Creăm obiectul grupului
      const group = {
        name: groupData.name.trim(),
        description: groupData.description?.trim() || '',
        code: groupCode,
        encryptionKey: encryptionKey, // În producție, aceasta ar trebui criptată
        createdBy: creatorId,
        createdAt: serverTimestamp(),
        members: [creatorId], // Creatorul este primul membru
        admins: [creatorId], // Creatorul este primul admin
        maxMembers: groupData.maxMembers || 50,
        isPrivate: groupData.isPrivate || false,
        avatar: groupData.avatar || '',
        lastActivity: serverTimestamp(),
        messageCount: 0 // Contor pentru mesaje
      };
      
      // Salvăm grupul în Firestore
      const docRef = await addDoc(collection(db, "groups"), group);
      
      // Actualizăm documentul cu ID-ul său pentru referențe ușoare
      await updateDoc(docRef, { id: docRef.id });
      
      console.log("Grup creat cu succes:", docRef.id, "cu codul:", groupCode);
      return { ...group, id: docRef.id };
      
    } catch (error) {
      console.error("Eroare la crearea grupului:", error);
      throw error;
    }
  };
  
  /**
   * Permite unui utilizator să se alăture la un grup folosind un cod
   * @param {string} code - Codul grupului
   * @param {string} userId - ID-ul utilizatorului care vrea să se alăture
   * @returns {Object} - Grupul la care s-a alăturat utilizatorul
   */
  export const joinGroupByCode = async (code, userId) => {
    try {
      // Validăm parametrii
      if (!code || !code.trim()) {
        throw new Error("Codul de grup este obligatoriu");
      }
      
      if (!userId) {
        throw new Error("ID-ul utilizatorului este obligatoriu");
      }
      
      // Căutăm grupul după cod
      const group = await getGroupByCode(code);
      
      if (!group) {
        throw new Error("Codul de grup introdus nu este valid. Verifică că ai introdus codul corect.");
      }
      
      // Verificăm dacă utilizatorul nu este deja membru
      if (group.members && group.members.includes(userId)) {
        throw new Error("Ești deja membru al acestui grup");
      }
      
      // Verificăm dacă grupul nu a atins limita de membri
      const currentMemberCount = group.members ? group.members.length : 0;
      if (currentMemberCount >= group.maxMembers) {
        throw new Error(`Grupul a atins numărul maxim de membri (${group.maxMembers})`);
      }
      
      // Adăugăm utilizatorul la grup
      const groupRef = doc(db, "groups", group.id);
      await updateDoc(groupRef, {
        members: arrayUnion(userId),
        lastActivity: serverTimestamp()
      });
      
      console.log("Utilizator adăugat cu succes în grupul:", group.name, "cu ID-ul:", userId);
      
      // Returnăm grupul actualizat
      const updatedGroup = {
        ...group,
        members: [...(group.members || []), userId]
      };
      
      return updatedGroup;
      
    } catch (error) {
      console.error("Eroare la alăturarea în grup:", error);
      throw error;
    }
  };
  
  /**
   * Obține toate grupurile în care este membru un utilizator
   * @param {string} userId - ID-ul utilizatorului
   * @returns {Array} - Lista grupurilor utilizatorului
   */
  export const getUserGroups = async (userId) => {
    try {
      const groupsRef = collection(db, "groups");
      const q = query(groupsRef, where("members", "array-contains", userId));
      
      const querySnapshot = await getDocs(q);
      const groups = [];
      
      querySnapshot.forEach((doc) => {
        groups.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sortează grupurile după ultima activitate
      groups.sort((a, b) => {
        const aTime = a.lastActivity?.toDate() || new Date(0);
        const bTime = b.lastActivity?.toDate() || new Date(0);
        return bTime - aTime;
      });
      
      return groups;
      
    } catch (error) {
      console.error("Eroare la obținerea grupurilor utilizatorului:", error);
      throw error;
    }
  };
  
  /**
   * Părăsește un grup (sau elimină un membru dacă ești admin)
   * @param {string} groupId - ID-ul grupului
   * @param {string} userId - ID-ul utilizatorului care părăsește grupul
   * @param {string} removedBy - ID-ul utilizatorului care elimină (opțional, pentru admini)
   */
  export const leaveGroup = async (groupId, userId, removedBy = null) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error("Grupul nu există");
      }
      
      const groupData = groupDoc.data();
      
      // Verificăm că utilizatorul este membru
      if (!groupData.members.includes(userId)) {
        throw new Error("Utilizatorul nu este membru al grupului");
      }
      
      // Dacă cineva altcineva elimină utilizatorul, verificăm permisiunile
      if (removedBy && removedBy !== userId) {
        if (!groupData.admins.includes(removedBy)) {
          throw new Error("Doar administratorii pot elimina membri");
        }
      }
      
      // Eliminăm utilizatorul din membri și din admini (dacă era admin)
      await updateDoc(groupRef, {
        members: arrayRemove(userId),
        admins: arrayRemove(userId),
        lastActivity: serverTimestamp()
      });
      
      // Dacă nu mai sunt membri, ștergem grupul
      const remainingMembers = groupData.members.filter(id => id !== userId);
      if (remainingMembers.length === 0) {
        await deleteDoc(groupRef);
        console.log("Grupul a fost șters deoarece nu mai are membri");
      }
      
      console.log("Utilizatorul a părăsit grupul cu succes");
      
    } catch (error) {
      console.error("Eroare la părăsirea grupului:", error);
      throw error;
    }
  };
  
  /**
   * Actualizează informațiile unui grup (doar pentru admini)
   * @param {string} groupId - ID-ul grupului
   * @param {string} userId - ID-ul utilizatorului care face modificarea
   * @param {Object} updates - Obiect cu modificările de făcut
   */
  export const updateGroup = async (groupId, userId, updates) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error("Grupul nu există");
      }
      
      const groupData = groupDoc.data();
      
      // Verificăm că utilizatorul este admin
      if (!groupData.admins.includes(userId)) {
        throw new Error("Doar administratorii pot modifica grupul");
      }
      
      // Filtrăm modificările permise
      const allowedUpdates = {};
      if (updates.name) allowedUpdates.name = updates.name.trim();
      if (updates.description !== undefined) allowedUpdates.description = updates.description.trim();
      if (updates.avatar !== undefined) allowedUpdates.avatar = updates.avatar;
      if (updates.maxMembers) allowedUpdates.maxMembers = updates.maxMembers;
      if (updates.isPrivate !== undefined) allowedUpdates.isPrivate = updates.isPrivate;
      
      // Adăugăm timestamp-ul de modificare
      allowedUpdates.lastActivity = serverTimestamp();
      
      await updateDoc(groupRef, allowedUpdates);
      
      console.log("Grupul a fost actualizat cu succes");
      
    } catch (error) {
      console.error("Eroare la actualizarea grupului:", error);
      throw error;
    }
  };