# Guide des Landmarks Dynamiques

## Vue d'ensemble

Les **landmarks** (repères temporels) sont des sous-groupes spéciaux dont les événements restent visibles sur la ligne du groupe parent même lorsque celui-ci est fermé. Cette fonctionnalité permet de garder les informations importantes toujours visibles.

## Utilisation

### Activer/Désactiver un landmark

**📱 Sur tablette/mobile :**
1. **Maintenez appuyé** (appui long de 500ms) sur le label d'un sous-groupe
2. Un toast de confirmation apparaît
3. Le sous-groupe devient un landmark (icône 📍 ajoutée) ou cesse de l'être

**🖥️ Sur desktop :**
1. **Maintenez le clic** (500ms) sur le label d'un sous-groupe
2. Un toast de confirmation apparaît
3. Le sous-groupe devient un landmark (icône 📍 ajoutée) ou cesse de l'être

### Comportement

- **Groupe parent ouvert** : tous les sous-groupes sont visibles normalement
- **Groupe parent fermé** : seuls les items des sous-groupes définis comme landmarks restent visibles sur la ligne du parent
- **Feedback visuel** : Un toast apparaît en haut à droite pour confirmer l'action
- **Animation** : Le background du groupe s'anime pendant l'appui long

### Exemple

```javascript
Groupe Migratoire (parent)
├── Statut résidentiel (sous-groupe)
├── Logement (sous-groupe)
└── 📍 Commune (sous-groupe landmark)
```

Quand vous fermez "Migratoire" :
- Les items de "Statut résidentiel" et "Logement" sont cachés
- Les items de "📍 Commune" restent visibles sur la ligne "Migratoire"

## Configuration initiale

Par défaut, aucun landmark n'est défini. Les utilisateurs peuvent configurer les landmarks en utilisant l'appui long sur n'importe quel sous-groupe.

Les groupes sont définis dans `groupsData` sans configuration de landmark :

```javascript
const groupsData = [
    { 
        id: 1, 
        content: "Migratoire", 
        nestedGroups: [11,12,13]
    },
    { 
        id: 13, 
        content: "Commune"  // Deviendra "📍 Commune" si défini comme landmark
    }
];
```

## Caractéristiques techniques

### Compatibilité tactile
- ✅ Fonctionne sur iOS et Android
- ✅ Taille des zones tactiles optimisée (min 44px)
- ✅ Feedback visuel pendant l'appui
- ✅ Timer de 500ms adapté pour éviter les déclenchements accidentels

### Événements supportés
- `mouseDown` / `touchstart` : démarrage du timer
- `mouseUp` / `touchend` : annulation si relâché trop tôt
- Animation CSS pendant l'appui pour feedback visuel

## API

### `toggleLandmark(groupId)`

Bascule le statut landmark d'un sous-groupe.

**Paramètres :**
- `groupId` (number) : L'ID du sous-groupe

**Exemple :**
```javascript
import { toggleLandmark } from './js/timeline.js';

// Activer/désactiver le landmark pour le groupe 23
toggleLandmark(23);
```

## Notes techniques

- Les items des landmarks utilisent une propriété interne `_originalGroup` pour mémoriser leur groupe d'origine
- Le basculement est persisté dans les objets `groups` via `groups.update()`
- L'icône 📍 est automatiquement ajoutée/retirée du nom du groupe

## Améliorations futures possibles

- [ ] Ajouter un menu contextuel (clic droit desktop / appui long alternatif mobile)
- [ ] Persister les préférences de landmarks dans le localStorage
- [ ] Ajouter un panneau de configuration des landmarks
- [ ] Permettre la configuration en masse de plusieurs landmarks
- [ ] Ajouter un tutoriel interactif au premier usage
- [ ] Badge visuel sur les groupes parents indiquant le nombre de landmarks actifs
