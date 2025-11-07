# Guide d'implémentation des questions de trajectoire scolaire et professionnelle

Basé sur l'analyse de `questionnaire.js` et `stateMachine.js` existants.

## 📋 Architecture actuelle

### 1. **Fichiers principaux**
- **`stateMachine.js`** : Définit les états, transitions, actions et contexte
- **`questionnaire.js`** : Gère le rendu des questions et la capture des réponses
- **`episodes.js`** : Gère l'ajout/modification des épisodes sur la timeline
- **`timeline.js`** : Configuration de la timeline visuelle

---

## 🔧 Structure d'une question

Chaque question nécessite **3 composants** :

### A. État dans `stateMachine.js`
### B. Cas de rendu dans `questionnaire.js`
### C. Actions associées (facultatif)

---

## 📝 Étapes d'implémentation

### ÉTAPE 1 : Configurer les groupes dans `timeline.js`

Les groupes professionnels sont déjà définis dans vos données :

```javascript
// Dans timeline.js ou data_1.json
{
  id: 2,
  content: "Professionnel",
  nestedGroups: [21, 22, 23, 24],
},
{
  id: 21,
  content: "Poste"
},
{
  id: 22,
  content: "Etablissement/Entreprise"
},
{
  id: 23,
  content: "Lieu",
  type: "primary"
},
{
  id: 24,
  content: "Activité professionnelle",
  type: "primary"
}
```

✅ **Déjà fait** dans vos données !

---

### ÉTAPE 2 : Ajouter les états dans `stateMachine.js`

#### 2.1 Modifier le contexte initial

```javascript
export const surveyMachine = createMachine({
  id: 'survey',
  initial: 'askBirthYear',
  context: {
    birthYear: 0,
    communes: [],
    currentCommuneIndex: 0,
    
    // NOUVEAUX CONTEXTES POUR TRAJECTOIRE PROFESSIONNELLE
    hasStudied: false,              // A étudié après secondaire
    etablissements: [],              // Liste des établissements
    diplomes: [],                    // Liste des diplômes
    hasWorked: false,                // A travaillé
    hasInactivity: false,            // Périodes d'inactivité
    entreprises: [],                 // Liste des entreprises
    postes: [],                      // Liste des postes occupés
    lieuxTravail: [],                // Lieux de travail
    currentEntrepriseIndex: 0,       // Index entreprise courante
    currentPosteIndex: 0,            // Index poste courant
    
    group: 13,
    lastEpisode: null,
  },
  states: {
    // ... états existants ...
    
    // NOUVEAUX ÉTATS - À ajouter après askChangeHousingStatus
  }
});
```

#### 2.2 Ajouter les nouveaux états

Insérer après l'état `askChangeHousingStatus` et avant `surveyComplete` :

```javascript
askChangeHousingStatus: {
  on: {
    YES: {
      // Au lieu d'aller directement à surveyComplete
      actions: ['resetGroup'],
      target: 'askHasStudied'  // ← Commencer trajectoire professionnelle
    },
    NO: [
      {
        guard: 'moreCommunesToProcess',
        actions: ['previousGroup', 'nextCommune'],
        target: 'askSameHousing',
      },
      {
        actions: ['resetGroup'],
        target: 'askHasStudied'  // ← Commencer trajectoire professionnelle
      }
    ]
  }
},

// ============================================================
// SECTION SCOLAIRE
// ============================================================

askHasStudied: {
  on: {
    YES: {
      actions: ['setHasStudied'],
      target: 'askEtablissements'
    },
    NO: {
      target: 'askHasWorked'
    }
  }
},

askEtablissements: {
  on: {
    ANSWER_ETABLISSEMENTS: {
      actions: [
        'addEtablissements',
        'setGroupToEtablissement'  // group = 22
      ],
      target: 'askLieuxEtudes'
    }
  }
},

askLieuxEtudes: {
  on: {
    ANSWER_LIEUX_ETUDES: {
      actions: [
        'addLieuxEtudes',
        'setGroupToLieuEtudes',  // group = 23
        'resetEtablissementIndex'
      ],
      target: 'placeEtablissementOnTimeline'
    }
  }
},

placeEtablissementOnTimeline: {
  on: {
    ANSWER_ETUDES_START: {
      actions: [
        'addCalendarEpisode'
      ],
      target: 'askEtudesEndYear'
    }
  }
},

askEtudesEndYear: {
  on: {
    ANSWER_ETUDES_END: {
      actions: [
        'modifyCalendarEpisode',
        'nextEtablissement'
      ],
      target: [{
        guard: 'moreEtablissementsToProcess',
        target: 'placeEtablissementOnTimeline'
      }, {
        target: 'askHasWorked'
      }]
    }
  }
},

// ============================================================
// SECTION PROFESSIONNELLE
// ============================================================

askHasWorked: {
  on: {
    YES: {
      actions: ['setHasWorked'],
      target: 'askHasInactivity'
    },
    NO: 'surveyComplete'
  }
},

askHasInactivity: {
  on: {
    YES: {
      actions: ['setHasInactivity'],
      target: 'askInactivityPeriod'
    },
    NO: 'askEntreprises'
  }
},

askInactivityPeriod: {
  on: {
    ANSWER_INACTIVITY: {
      actions: [
        'setGroupToActivite',  // group = 24
        'addCalendarEpisode'
      ],
      target: 'askInactivityEndYear'
    }
  }
},

askInactivityEndYear: {
  on: {
    ANSWER_INACTIVITY_END: {
      actions: ['modifyCalendarEpisode'],
      target: 'askEntreprises'
    }
  }
},

askEntreprises: {
  on: {
    ANSWER_ENTREPRISES: {
      actions: [
        'addEntreprises',
        'setGroupToEntreprise',  // group = 22
        'resetEntrepriseIndex'
      ],
      target: 'askLieuxTravail'
    }
  }
},

askLieuxTravail: {
  on: {
    ANSWER_LIEUX_TRAVAIL: {
      actions: [
        'addLieuxTravail',
        'setGroupToLieuTravail'  // group = 23
      ],
      target: 'placeEntrepriseOnTimeline'
    }
  }
},

placeEntrepriseOnTimeline: {
  on: {
    ANSWER_ENTREPRISE_START: {
      actions: ['addCalendarEpisode'],
      target: 'askEntrepriseEndYear'
    }
  }
},

askEntrepriseEndYear: {
  on: {
    ANSWER_ENTREPRISE_END: {
      actions: [
        'modifyCalendarEpisode',
        'nextEntreprise'
      ],
      target: [{
        guard: 'moreEntreprisesToProcess',
        target: 'placeEntrepriseOnTimeline'
      }, {
        target: 'askPostes'
      }]
    }
  }
},

askPostes: {
  on: {
    ANSWER_POSTES: {
      actions: [
        'addPostes',
        'setGroupToPoste',  // group = 21
        'resetPosteIndex'
      ],
      target: 'placePosteOnTimeline'
    }
  }
},

placePosteOnTimeline: {
  on: {
    ANSWER_POSTE_START: {
      actions: ['addCalendarEpisode'],
      target: 'askPosteEndYear'
    }
  }
},

askPosteEndYear: {
  on: {
    ANSWER_POSTE_END: {
      actions: [
        'modifyCalendarEpisode',
        'nextPoste'
      ],
      target: [{
        guard: 'morePostesToProcess',
        target: 'placePosteOnTimeline'
      }, {
        target: 'surveyComplete'
      }]
    }
  }
},

surveyComplete: {
  type: 'final'
}
```

#### 2.3 Ajouter les actions

Dans la section `actions` de `stateMachine.js` :

```javascript
actions: {
  // ... actions existantes ...

  // ACTIONS SCOLAIRES
  setHasStudied: assign({
    hasStudied: () => true
  }),

  addEtablissements: assign({
    etablissements: ({context, event}) => {
      return [...context.etablissements, ...event.etablissements];
    }
  }),

  addLieuxEtudes: assign({
    lieuxEtudes: ({context, event}) => {
      return [...(context.lieuxEtudes || []), ...event.lieux];
    }
  }),

  resetEtablissementIndex: assign({
    currentEtablissementIndex: () => 0
  }),

  nextEtablissement: assign({
    currentEtablissementIndex: ({context}) => {
      return context.currentEtablissementIndex + 1;
    }
  }),

  // ACTIONS PROFESSIONNELLES
  setHasWorked: assign({
    hasWorked: () => true
  }),

  setHasInactivity: assign({
    hasInactivity: () => true
  }),

  addEntreprises: assign({
    entreprises: ({context, event}) => {
      return [...context.entreprises, ...event.entreprises];
    }
  }),

  addLieuxTravail: assign({
    lieuxTravail: ({context, event}) => {
      return [...context.lieuxTravail, ...event.lieux];
    }
  }),

  addPostes: assign({
    postes: ({context, event}) => {
      return [...context.postes, ...event.postes];
    }
  }),

  resetEntrepriseIndex: assign({
    currentEntrepriseIndex: () => 0
  }),

  nextEntreprise: assign({
    currentEntrepriseIndex: ({context}) => {
      return context.currentEntrepriseIndex + 1;
    }
  }),

  resetPosteIndex: assign({
    currentPosteIndex: () => 0
  }),

  nextPoste: assign({
    currentPosteIndex: ({context}) => {
      return context.currentPosteIndex + 1;
    }
  }),

  // ACTIONS DE GROUPE
  setGroupToEtablissement: assign({
    group: () => 22
  }),

  setGroupToLieuEtudes: assign({
    group: () => 23
  }),

  setGroupToActivite: assign({
    group: () => 24
  }),

  setGroupToEntreprise: assign({
    group: () => 22
  }),

  setGroupToLieuTravail: assign({
    group: () => 23
  }),

  setGroupToPoste: assign({
    group: () => 21
  }),

  resetGroup: assign({
    group: () => 24  // Commencer par activité professionnelle
  })
}
```

#### 2.4 Ajouter les guards

```javascript
guards: {
  moreCommunesToProcess: (context) => {
    return context.context.currentCommuneIndex < context.context.communes.length - 1
  },
  
  // NOUVEAUX GUARDS
  moreEtablissementsToProcess: (context) => {
    return context.context.currentEtablissementIndex < context.context.etablissements.length - 1
  },

  moreEntreprisesToProcess: (context) => {
    return context.context.currentEntrepriseIndex < context.context.entreprises.length - 1
  },

  morePostesToProcess: (context) => {
    return context.context.currentPosteIndex < context.context.postes.length - 1
  }
}
```

---

### ÉTAPE 3 : Ajouter les rendus dans `questionnaire.js`

Dans la fonction `renderQuestion()`, ajouter les cas après les états existants :

```javascript
function renderQuestion(state) {
  let questionText = "";
  let responseType = "input";
  let choices = [];
  let eventType = null;
  let eventKey = "commune";

  const questionDiv = document.createElement("div");

  switch (state.value) {
    // ... cas existants ...

    // ============================================================
    // SECTION SCOLAIRE
    // ============================================================
    
    case "askHasStudied":
      questionText = "Avez-vous suivi des études après le secondaire ?";
      responseType = "choice";
      choices = ["Yes", "No"];
      break;

    case "askEtablissements":
      questionText = "Pouvez-vous nous indiquer les différents établissements (université, école, IUT, etc.) où vous avez étudié ?";
      responseType = "inputlist";
      eventType = "ANSWER_ETABLISSEMENTS";
      eventKey = "etablissements";
      break;

    case "askLieuxEtudes":
      questionText = "Dans quelles communes/villes avez-vous effectué vos études ?";
      responseType = "inputlist";
      eventType = "ANSWER_LIEUX_ETUDES";
      eventKey = "lieux";
      break;

    case "placeEtablissementOnTimeline":
      questionText = `En quelle année avez-vous commencé à ${state.context.etablissements[state.context.currentEtablissementIndex]} ?`;
      responseType = "input";
      eventType = "ANSWER_ETUDES_START";
      eventKey = "start";
      break;

    case "askEtudesEndYear":
      questionText = `En quelle année avez-vous quitté ${state.context.etablissements[state.context.currentEtablissementIndex]} ?`;
      responseType = "input";
      eventType = "ANSWER_ETUDES_END";
      eventKey = "end";
      break;

    // ============================================================
    // SECTION PROFESSIONNELLE
    // ============================================================

    case "askHasWorked":
      questionText = "Avez-vous exercé une activité professionnelle ?";
      responseType = "choice";
      choices = ["Yes", "No"];
      break;

    case "askHasInactivity":
      questionText = "Avez-vous connu des périodes d'inactivité (chômage, congé parental, etc.) ?";
      responseType = "choice";
      choices = ["Yes", "No"];
      break;

    case "askInactivityPeriod":
      questionText = "Quelle était la nature de cette période d'inactivité ?";
      responseType = "input";
      eventType = "ANSWER_INACTIVITY";
      eventKey = "commune"; // réutilise commune pour le contenu
      break;

    case "askInactivityEndYear":
      questionText = "En quelle année cette période s'est-elle terminée ?";
      responseType = "input";
      eventType = "ANSWER_INACTIVITY_END";
      eventKey = "end";
      break;

    case "askEntreprises":
      questionText = "Pouvez-vous nous indiquer les différentes entreprises où vous avez travaillé ?";
      responseType = "inputlist";
      eventType = "ANSWER_ENTREPRISES";
      eventKey = "entreprises";
      break;

    case "askLieuxTravail":
      questionText = "Dans quelles communes/villes avez-vous travaillé ?";
      responseType = "inputlist";
      eventType = "ANSWER_LIEUX_TRAVAIL";
      eventKey = "lieux";
      break;

    case "placeEntrepriseOnTimeline":
      questionText = `En quelle année avez-vous commencé à travailler chez ${state.context.entreprises[state.context.currentEntrepriseIndex]} ?`;
      responseType = "input";
      eventType = "ANSWER_ENTREPRISE_START";
      eventKey = "start";
      break;

    case "askEntrepriseEndYear":
      questionText = `En quelle année avez-vous quitté ${state.context.entreprises[state.context.currentEntrepriseIndex]} ?`;
      responseType = "input";
      eventType = "ANSWER_ENTREPRISE_END";
      eventKey = "end";
      break;

    case "askPostes":
      questionText = "Pouvez-vous nous indiquer les différents postes que vous avez occupés ?";
      responseType = "inputlist";
      eventType = "ANSWER_POSTES";
      eventKey = "postes";
      break;

    case "placePosteOnTimeline":
      questionText = `En quelle année avez-vous commencé le poste de ${state.context.postes[state.context.currentPosteIndex]} ?`;
      responseType = "input";
      eventType = "ANSWER_POSTE_START";
      eventKey = "start";
      break;

    case "askPosteEndYear":
      questionText = `En quelle année avez-vous quitté le poste de ${state.context.postes[state.context.currentPosteIndex]} ?`;
      responseType = "input";
      eventType = "ANSWER_POSTE_END";
      eventKey = "end";
      break;

    case "surveyComplete":
      questionText = "Merci, vous avez terminé l'enquête !";
      responseType = "none";
      break;
  }

  // ... reste du code de rendu (gestion input, choice, inputlist) ...
}
```

---

## 🎯 Logique de flux

### Flux scolaire :
```
askHasStudied 
  → YES → askEtablissements 
       → askLieuxEtudes 
       → placeEtablissementOnTimeline (pour chaque établissement)
       → askEtudesEndYear
       → askHasWorked
  → NO  → askHasWorked
```

### Flux professionnel :
```
askHasWorked
  → YES → askHasInactivity
       → YES → askInactivityPeriod → askInactivityEndYear
       → NO  → askEntreprises
  → NO  → surveyComplete

askEntreprises 
  → askLieuxTravail
  → placeEntrepriseOnTimeline (pour chaque entreprise)
  → askEntrepriseEndYear
  → askPostes
  → placePosteOnTimeline (pour chaque poste)
  → askPosteEndYear
  → surveyComplete
```

---

## 🔍 Points d'attention

### 1. **Groupes et dépendances**
Les groupes 21, 22, 23 sont imbriqués dans le groupe 2 (Professionnel), comme les groupes 11-14 sont dans le groupe 1 (Migratoire).

### 2. **Gestion des listes**
Le type `inputlist` permet d'ajouter plusieurs éléments (établissements, entreprises, postes) puis de les placer un par un sur la timeline.

### 3. **Réutilisation du code**
Les fonctions `ajouterEpisode()` et `modifierEpisode()` dans `episodes.js` fonctionnent déjà avec n'importe quel groupe, pas besoin de les modifier.

### 4. **WebRTC Sync**
La synchronisation WebRTC fonctionne automatiquement pour tous les nouveaux états car elle intercepte tous les `sendEvent()`.

### 5. **Index multiples**
Contrairement aux communes (un seul index), ici on a :
- `currentEtablissementIndex`
- `currentEntrepriseIndex`
- `currentPosteIndex`

Car on peut avoir des établissements, des entreprises ET des postes indépendants.

---

## ✅ Checklist d'implémentation

- [ ] Ajouter les nouveaux champs au contexte initial
- [ ] Ajouter tous les nouveaux états
- [ ] Ajouter toutes les actions (set, add, next, reset)
- [ ] Ajouter les guards (moreXToProcess)
- [ ] Ajouter tous les cas dans le switch de `renderQuestion()`
- [ ] Tester le flux scolaire seul
- [ ] Tester le flux professionnel seul
- [ ] Tester le flux complet (migratoire → scolaire → professionnel)
- [ ] Vérifier la synchronisation WebRTC
- [ ] Tester avec plusieurs établissements/entreprises/postes

---

## 🚀 Pour aller plus loin

### Améliorations possibles :

1. **Validation des dates** : S'assurer que end > start
2. **Diplômes** : Ajouter une question sur les diplômes obtenus
3. **Type de contrat** : CDI/CDD/Freelance
4. **Secteur d'activité** : Catégorisation des entreprises
5. **Formations continues** : Ajouter un flux pour les certifications
6. **Télétravail** : Gérer les lieux de travail multiples ou remote

---

## 📚 Exemple complet d'ajout simplifié

Si vous voulez commencer simple, voici un exemple minimaliste pour juste demander les entreprises :

### Dans `stateMachine.js` :

```javascript
// Après askChangeHousingStatus
askEntreprises: {
  on: {
    ANSWER_ENTREPRISES: {
      actions: ['addEntreprises'],
      target: 'surveyComplete'
    }
  }
}

// Dans actions:
addEntreprises: assign({
  entreprises: ({context, event}) => [...context.entreprises, ...event.entreprises]
})
```

### Dans `questionnaire.js` :

```javascript
case "askEntreprises":
  questionText = "Où avez-vous travaillé ?";
  responseType = "inputlist";
  eventType = "ANSWER_ENTREPRISES";
  eventKey = "entreprises";
  break;
```

Et voilà ! Vous avez ajouté votre première question professionnelle. 🎉

Ensuite, vous pouvez progressivement complexifier en ajoutant les dates, les lieux, les postes, etc.
