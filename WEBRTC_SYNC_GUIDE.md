# 🚀 Synchronisation WebRTC - Guide d'utilisation

## 📋 Vue d'ensemble

Ton application LifeStories peut maintenant synchroniser le questionnaire en temps réel entre deux tablettes connectées via WebRTC !

## 🔄 Architecture

```
┌─────────────────────────┐         ┌─────────────────────────┐
│   Tablette 1 (Hôte)     │◄───────►│  Tablette 2 (Invité)    │
├─────────────────────────┤  WebRTC ├─────────────────────────┤
│ - QR Code Generator     │         │ - QR Code Scanner       │
│ - Data Channel (sender) │         │ - Data Channel (recv)   │
│ - questionnaire.js      │         │ - questionnaire.js      │
│ - XState machine        │         │ - XState machine        │
└─────────────────────────┘         └─────────────────────────┘
```

## 📂 Fichiers modifiés/créés

### Nouveaux fichiers
- ✅ `webrtc-sync.js` - Module de synchronisation

### Fichiers modifiés
- ✅ `webrtc-onboarding.js` - Export du data channel
- ✅ `questionnaire.js` - Envoi/réception d'événements
- ✅ `LifeStories.html` - Import du module + indicateur visuel

## 🎯 Flux de fonctionnement

### 1. Onboarding (index.html)
```
Hôte                              Invité
│                                 │
├─ Clic "Créer connexion"         │
├─ Génère QR Code                 │
│                                 ├─ Scan QR Code
│                                 ├─ Génère réponse
│                                 ├─ Affiche QR réponse
├─ Scan QR réponse                │
├─ Connexion établie ✅           ├─ Connexion établie ✅
│                                 │
├─ Clic "Démarrer"                ├─ Clic "Démarrer"
│                                 │
└─> LifeStories.html              └─> LifeStories.html
```

### 2. Synchronisation (LifeStories.html)
```
Tablette A                        Tablette B
│                                 │
├─ Répond "1990"                  │
├─ sendEvent({                    │
│    type: 'ANSWER_BIRTH_YEAR',   │
│    birthdate: '1990'            │
│  })                             │
│                                 │
├─ XState local ✅                │
├─ WebRTC send ──────────────────>├─ WebRTC receive
│                                 ├─ Applique événement
│                                 ├─ XState local ✅
│                                 ├─ Affiche question suivante
│                                 │
│                                 ├─ Répond "Lyon"
│                                 ├─ sendEvent({...})
│<─────────────────────────────── ├─ WebRTC send
├─ WebRTC receive                 │
├─ Applique événement             │
├─ Affiche question suivante      │
```

## 🛠️ Comment utiliser

### Mode standalone (1 tablette)
```bash
# Ouvrir directement LifeStories.html
# L'application détecte automatiquement l'absence de WebRTC
# Indicateur : "Mode standalone" (gris)
```

### Mode synchronisé (2 tablettes)
```bash
# 1. Sur tablette 1 (hôte) : index.html
#    - Cliquer "Créer une connexion"
#    - Scanner le QR code sur tablette 2

# 2. Sur tablette 2 (invité) : index.html
#    - Cliquer "Scanner pour se connecter"
#    - Scanner le QR code de tablette 1
#    - Montrer le QR de réponse à tablette 1

# 3. Sur tablette 1 : Scanner le QR réponse
#    - Connexion établie ✅

# 4. Les deux tablettes : Cliquer "Démarrer l'application"
#    - Indicateur : "Synchronisé (Hôte)" ou "Synchronisé (Invité)" (vert)
#    - Les réponses se synchronisent automatiquement !
```

## 🔍 Debugging

### Console logs
```javascript
// Vérifier la connexion WebRTC
window.webrtcSync.isActive()  // true si connecté

// Vérifier le rôle
window.webrtcSync.getRole()   // "host" ou "guest"

// Tester l'envoi manuel
window.webrtcSync.sendEvent({
    type: 'ANSWER_BIRTH_YEAR',
    birthdate: '1990'
})
```

### Indicateurs visuels
- 🟢 **Vert "Synchronisé"** : WebRTC actif, data channel ouvert
- ⚫ **Gris "Mode standalone"** : Pas de connexion WebRTC

### Messages console attendus
```
✅ WebRTC connexion restaurée: {isOfferor: true, sessionId: "..."}
✅ Data channel récupéré après 200 ms
📡 WebRTCSync initialisé avec data channel
✅ Mode synchronisation WebRTC activé - Rôle: host
📤 Événement envoyé: {type: "ANSWER_BIRTH_YEAR", birthdate: "1990"}
📥 Message reçu: {type: "SURVEY_EVENT", event: {...}, sender: "guest"}
```

## 📊 Format des messages WebRTC

### Événement de questionnaire
```json
{
  "type": "SURVEY_EVENT",
  "event": {
    "type": "ANSWER_BIRTH_YEAR",
    "birthdate": "1990"
  },
  "timestamp": 1704067200000,
  "sender": "host"
}
```

### État complet (pour synchronisation initiale)
```json
{
  "type": "SURVEY_STATE",
  "state": {
    "value": "askBirthCommune",
    "context": {
      "birthdate": "1990",
      "communes": []
    }
  },
  "timestamp": 1704067200000,
  "sender": "host"
}
```

## 🐛 Résolution de problèmes

### "Data channel non trouvé après 5 secondes"
**Cause** : Le data channel n'a pas été exporté par webrtc-onboarding.js  
**Solution** : Vérifier que `dcOpen()` dans webrtc-onboarding.js exécute bien :
```javascript
window.webrtcDataChannel = this.dc;
```

### "Mode standalone" alors que WebRTC est connecté
**Cause** : sessionStorage vide  
**Solution** : S'assurer de passer par `startApplication()` dans l'onboarding, pas d'ouvrir LifeStories.html directement

### Les événements ne se synchronisent pas
**Cause** : Data channel pas ouvert ou handler pas enregistré  
**Solution** : Vérifier dans la console :
```javascript
window.webrtcSync.isActive()  // doit être true
window.webrtcDataChannel      // doit exister
```

### Questions en double
**Cause** : Les deux tablettes envoient le même événement  
**Solution** : C'est normal ! XState est idempotent, envoyer 2x le même événement ne change rien.

## 🎨 Personnalisation

### Changer les couleurs de l'indicateur
Dans `LifeStories.html` :
```css
#webrtc-status.connected {
    background-color: #28a745;  /* Vert par défaut */
}
```

### Ajouter un son à la réception
Dans `questionnaire.js`, fonction `handleRemoteMessage()` :
```javascript
function handleRemoteMessage(message) {
    // Jouer un son
    const audio = new Audio('assets/notification.mp3');
    audio.play();
    
    // ... reste du code
}
```

### Bloquer les réponses de l'invité
Si tu veux que seul l'hôte puisse répondre :
```javascript
function sendEvent(eventData) {
    // Bloquer si on est invité
    if (window.webrtcSync && window.webrtcSync.getRole() === 'guest') {
        return;
    }
    
    // ... reste du code
}
```

## 🚀 Améliorations possibles

- [ ] Ajouter un bouton "Forcer synchronisation complète"
- [ ] Afficher qui a répondu (hôte/invité)
- [ ] Historique des événements synchronisés
- [ ] Mode "observateur" (lecture seule)
- [ ] Reconnexion automatique si déconnexion
- [ ] Indicateur de latence réseau
- [ ] Toast notifications pour les événements reçus

## 📝 Notes techniques

### Pourquoi sessionStorage ?
- Persiste pendant la navigation (index.html → LifeStories.html)
- Ne persiste PAS après fermeture de l'onglet (sécurité)
- Alternative : localStorage (persiste après fermeture)

### Pourquoi window.webrtcDataChannel ?
- Plus simple que recréer une connexion WebRTC
- Réutilise le canal déjà établi lors de l'onboarding
- Évite de redemander les permissions/QR codes

### XState v5 et synchronisation
- XState v5 est déterministe : même événement → même état
- Pas besoin de verrouillage (locks) ou de résolution de conflits
- L'ordre des événements est préservé par le data channel (FIFO)

## ✅ Checklist de test

- [ ] Connexion WebRTC s'établit correctement
- [ ] Les deux tablettes affichent "Synchronisé"
- [ ] Répondre sur tablette A → question apparaît sur tablette B
- [ ] Répondre sur tablette B → question apparaît sur tablette A
- [ ] Mode standalone fonctionne (sans WebRTC)
- [ ] Indicateur change de couleur selon le mode
- [ ] Console logs montrent les événements envoyés/reçus
- [ ] Pas d'erreurs dans la console
- [ ] Timeline se met à jour des deux côtés

---

**Créé le** : 2024  
**Version** : 1.0  
**Auteur** : GitHub Copilot 🤖
