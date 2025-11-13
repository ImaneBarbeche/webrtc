# Documentation LocalStorage - LifeStories

## 📦 Vue d'ensemble

L'application LifeStories utilise le **localStorage** du navigateur pour persister les données de l'utilisateur entre les sessions. Cela permet de reprendre l'enquête où elle a été laissée après une fermeture du navigateur ou un rafraîchissement de la page.

---

## 🗂️ Clés localStorage utilisées

### 1. `lifestories_items`
**Fichier:** `src/js/timeline.js`

**Contenu:** Liste complète des items (événements/périodes) affichés sur la timeline.

**Format JSON:**
```json
[
  {
    "id": "2024-01-15T10:30:00.000Z",
    "type": "range",
    "content": "Paris",
    "start": "1990-01-01T00:00:00.000Z",
    "end": "2000-01-01T00:00:00.000Z",
    "group": 13,
    "className": "green"
  }
]
```

**Sauvegarde:** Automatique à chaque modification de la timeline via l'événement `timeline.on('changed')`.

**Restauration:** Au chargement de `timeline.js`, avant la création de la timeline.

---

### 2. `lifestories_groups`
**Fichier:** `src/js/timeline.js`

**Contenu:** État dynamique des groupes de la timeline (ouvert/fermé, landmarks).

**Format JSON:**
```json
[
  {
    "id": 1,
    "showNested": true,
    "landmark": false
  }
]
```

**Sauvegarde:** Automatique à chaque modification de la timeline via l'événement `timeline.on('changed')`.

**Restauration:** Au chargement, mise à jour des groupes existants avec l'état sauvegardé.

---

### 3. `lifestories_options`
**Fichier:** `src/js/timeline.js`

**Contenu:** Options de configuration de la timeline (dates min/max, start/end).

**Format JSON:**
```json
{
  "min": "1990-01-01T00:00:00.000Z",
  "max": "2090-01-01T00:00:00.000Z",
  "start": "1990-01-01T00:00:00.000Z",
  "end": "2090-01-01T00:00:00.000Z"
}
```

**Sauvegarde:** Automatique à chaque modification de la timeline.

**Restauration:** Au chargement, les dates sont converties en objets `Date` et appliquées aux options de la timeline.

---

### 4. `lifestories_context`
**Fichier:** `src/js/stateMachine.js`

**Contenu:** Contexte de la machine à états du questionnaire (données de l'enquête).

**Format JSON:**
```json
{
  "birthYear": 1990,
  "birthPlace": "Paris",
  "communes": ["Paris", "Lyon", "Marseille"],
  "departements": ["Île-de-France", "Rhône", "Bouches-du-Rhône"],
  "currentCommuneIndex": 0,
  "logements": ["Appartement", "Maison"],
  "currentLogementIndex": 0,
  "group": 13
}
```

**Sauvegarde:** Après chaque transition d'état via `surveyService.subscribe()`.

**Restauration:** Au démarrage de l'application, avant l'initialisation de la machine à états.

**Note:** `lastEpisode` n'est **pas sauvegardé** car il contient des références circulaires.

---

### 5. `lifestories_current_state`
**Fichier:** `src/js/stateMachine.js`

**Contenu:** État actuel de la machine à états (quelle question est affichée).

**Format JSON:**
```json
{
  "value": "askCurrentCommune",
  "context": { ... }
}
```

**Sauvegarde:** Après chaque transition d'état.

**Restauration:** Permet de reprendre le questionnaire à l'état exact où il a été laissé.

---

## 🔄 Cycle de vie des données

### Au chargement de l'application

1. **`timeline.js`** charge `lifestories_items`, `lifestories_groups`, `lifestories_options`
2. La timeline est créée avec les données restaurées
3. **`stateMachine.js`** charge `lifestories_context` et `lifestories_current_state`
4. **`questionnaire.js`** initialise le service avec l'état restauré
5. L'utilisateur reprend exactement où il s'était arrêté

### Pendant l'utilisation

- **Timeline modifiée** → Sauvegarde automatique de `items`, `groups`, `options`
- **Réponse au questionnaire** → Sauvegarde de `context` et `current_state`
- **Ajout d'épisode** → Mise à jour de `items` via l'événement `changed`

### Réinitialisation

**Fonction:** `resetAllData()` dans `stateMachine.js`

**Action:** 
- Supprime **toutes** les clés localStorage
- Recharge la page

**Déclenchement:** 
- Bouton "🗑️ Réinitialiser" dans l'interface
- Message WebRTC `RESET_ALL_DATA` reçu de l'autre appareil

```javascript
export function resetAllData() {
  localStorage.removeItem('lifestories_context');
  localStorage.removeItem('lifestories_current_state');
  localStorage.removeItem('lifestories_items');
  localStorage.removeItem('lifestories_groups');
  localStorage.removeItem('lifestories_options');
  window.location.reload();
}
```

---

## 🛡️ Gestion des erreurs

Tous les accès au localStorage sont protégés par des `try/catch` pour gérer :
- **QuotaExceededError** : Stockage plein
- **Données corrompues** : JSON invalide
- **Permissions refusées** : Mode privé du navigateur

Exemple :
```javascript
try {
  const savedItems = localStorage.getItem('lifestories_items');
  if (savedItems) {
    const parsedItems = JSON.parse(savedItems);
    items.add(parsedItems);
  }
} catch (e) {
  console.error('❌ Erreur lors du chargement des items:', e);
}
```

---

## 📊 Taille des données

**Limite du localStorage :** ~5-10 MB selon le navigateur

**Estimation pour LifeStories :**
- `lifestories_items` : ~10-50 KB (selon le nombre d'événements)
- `lifestories_groups` : ~1-5 KB
- `lifestories_options` : ~500 bytes
- `lifestories_context` : ~2-10 KB
- `lifestories_current_state` : ~1-5 KB

**Total estimé :** < 100 KB pour une enquête complète ✅

---

## 🔍 Débogage

### Inspecter le localStorage

**Dans la console du navigateur :**
```javascript
// Voir toutes les clés
Object.keys(localStorage).filter(k => k.startsWith('lifestories_'))

// Voir le contenu d'une clé
JSON.parse(localStorage.getItem('lifestories_items'))

// Vider tout LifeStories
Object.keys(localStorage)
  .filter(k => k.startsWith('lifestories_'))
  .forEach(k => localStorage.removeItem(k))
```

**Dans l'onglet Application de DevTools :**
1. Ouvrir DevTools (`F12`)
2. Aller dans **Application** > **Local Storage**
3. Sélectionner votre domaine
4. Voir toutes les clés `lifestories_*`

---

## ⚠️ Limitations connues

1. **Références circulaires :** `lastEpisode` n'est pas sauvegardé dans le contexte
2. **Pas de synchronisation multi-onglets :** Les données ne se synchronisent pas entre onglets
3. **Sensible au domaine :** Les données sont liées au domaine (localhost, production, etc.)
4. **Pas de versioning :** Pas de migration automatique si la structure change

---

## 🚀 Améliorations possibles

- [ ] Ajout de **versioning** des données pour gérer les migrations
- [ ] **Compression** des données (gzip) pour économiser de l'espace
- [ ] **Synchronisation** avec un backend (IndexedDB, serveur)
- [ ] **Export/Import** JSON pour sauvegarder/restaurer manuellement
- [ ] **Nettoyage automatique** des données anciennes

---

## 📝 Résumé

| Clé | Contenu | Taille | Fichier |
|-----|---------|--------|---------|
| `lifestories_items` | Événements timeline | ~10-50 KB | `timeline.js` |
| `lifestories_groups` | État des groupes | ~1-5 KB | `timeline.js` |
| `lifestories_options` | Config timeline | ~500 B | `timeline.js` |
| `lifestories_context` | Données enquête | ~2-10 KB | `stateMachine.js` |
| `lifestories_current_state` | État questionnaire | ~1-5 KB | `stateMachine.js` |

**Total :** < 100 KB ✅
