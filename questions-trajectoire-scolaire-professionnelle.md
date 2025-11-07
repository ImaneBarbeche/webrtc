# Questions pour la trajectoire scolaire et professionnelle

Basé sur le modèle de questionnaire existant et les données de trajectoire observées dans le projet.

## Structure des groupes

```json
{
  "id": 2,
  "content": "Professionnel",
  "nestedGroups": [21, 22, 23, 24]
}
```

### Sous-groupes :
- **Groupe 21** : Poste
- **Groupe 22** : Établissement/Entreprise
- **Groupe 23** : Lieu
- **Groupe 24** : Activité professionnelle (type primaire)

---

## Questions proposées

### 1. Formation initiale

**Question 1.1 - Parcours scolaire**
```json
{
  "id": 101,
  "text": "Avez-vous suivi des études après le secondaire ?",
  "response": {
    "type": "choice",
    "choices": ["Oui", "Non"]
  }
}
```

**Question 1.2 - Établissements de formation**
```json
{
  "id": 102,
  "text": "Pouvez-vous nous indiquer les différents établissements (université, école, IUT, etc.) où vous avez étudié ?",
  "response": {
    "type": "input_list",
    "text": "Nom de l'établissement"
  }
}
```

**Question 1.3 - Lieux d'études**
```json
{
  "id": 103,
  "text": "Dans quelles communes/villes avez-vous effectué vos études ?",
  "response": {
    "type": "input_list",
    "text": "Commune/Ville"
  }
}
```

**Question 1.4 - Diplômes obtenus**
```json
{
  "id": 104,
  "text": "Quel(s) diplôme(s) avez-vous obtenu(s) ?",
  "response": {
    "type": "input_list",
    "text": "Intitulé du diplôme"
  }
}
```

---

### 2. Activité professionnelle générale

**Question 2.1 - Première activité professionnelle**
```json
{
  "id": 201,
  "text": "Avez-vous exercé une activité professionnelle après vos études ?",
  "response": {
    "type": "choice",
    "choices": ["Oui", "Non", "Toujours en études"]
  }
}
```

**Question 2.2 - Période d'inactivité**
```json
{
  "id": 202,
  "text": "Avez-vous connu des périodes d'inactivité (chômage, congé parental, etc.) ?",
  "response": {
    "type": "choice",
    "choices": ["Oui", "Non"]
  }
}
```

**Question 2.3 - Détail des périodes d'inactivité**
```json
{
  "id": 203,
  "text": "Pouvez-vous préciser la nature et les dates de ces périodes d'inactivité ?",
  "response": {
    "type": "input_list",
    "text": "Type d'inactivité (chômage, congé, etc.)"
  }
}
```

**Question 2.4 - Continuité de l'emploi**
```json
{
  "id": 204,
  "text": "Avez-vous toujours travaillé dans la même entreprise/le même établissement ?",
  "response": {
    "type": "choice",
    "choices": ["Oui", "Non"]
  }
}
```

---

### 3. Entreprises et établissements

**Question 3.1 - Liste des employeurs**
```json
{
  "id": 301,
  "text": "Pouvez-vous nous indiquer les différentes entreprises ou établissements où vous avez travaillé ?",
  "response": {
    "type": "input_list",
    "text": "Nom de l'entreprise/établissement"
  }
}
```

**Question 3.2 - Secteur d'activité**
```json
{
  "id": 302,
  "text": "Dans quel(s) secteur(s) d'activité avez-vous principalement travaillé ?",
  "response": {
    "type": "input_list",
    "text": "Secteur d'activité"
  }
}
```

**Question 3.3 - Type de contrat**
```json
{
  "id": 303,
  "text": "Quel type de contrat aviez-vous dans cette entreprise ?",
  "response": {
    "type": "choice",
    "choices": ["CDI", "CDD", "Intérim", "Indépendant/Freelance", "Autre"]
  }
}
```

---

### 4. Postes occupés

**Question 4.1 - Évolution de poste**
```json
{
  "id": 401,
  "text": "Avez-vous occupé plusieurs postes au cours de votre carrière ?",
  "response": {
    "type": "choice",
    "choices": ["Oui", "Non"]
  }
}
```

**Question 4.2 - Intitulés des postes**
```json
{
  "id": 402,
  "text": "Pouvez-vous nous indiquer les différents postes/métiers que vous avez exercés ?",
  "response": {
    "type": "input_list",
    "text": "Intitulé du poste"
  }
}
```

**Question 4.3 - Niveau de responsabilité**
```json
{
  "id": 403,
  "text": "Avez-vous connu une évolution vers des postes à responsabilité ?",
  "response": {
    "type": "choice",
    "choices": ["Oui", "Non"]
  }
}
```

**Question 4.4 - Changement de domaine**
```json
{
  "id": 404,
  "text": "Avez-vous changé de domaine professionnel au cours de votre carrière ?",
  "response": {
    "type": "choice",
    "choices": ["Oui", "Non"]
  }
}
```

---

### 5. Lieux de travail

**Question 5.1 - Mobilité géographique professionnelle**
```json
{
  "id": 501,
  "text": "Avez-vous toujours travaillé dans la même commune/ville ?",
  "response": {
    "type": "choice",
    "choices": ["Oui", "Non"]
  }
}
```

**Question 5.2 - Liste des lieux de travail**
```json
{
  "id": 502,
  "text": "Pouvez-vous nous indiquer les différentes communes/villes où vous avez travaillé ?",
  "response": {
    "type": "input_list",
    "text": "Commune/Ville"
  }
}
```

**Question 5.3 - Travail à l'étranger**
```json
{
  "id": 503,
  "text": "Avez-vous travaillé à l'étranger ?",
  "response": {
    "type": "choice",
    "choices": ["Oui", "Non"]
  }
}
```

**Question 5.4 - Pays de travail**
```json
{
  "id": 504,
  "text": "Dans quel(s) pays avez-vous travaillé ?",
  "response": {
    "type": "input_list",
    "text": "Pays"
  }
}
```

**Question 5.5 - Télétravail**
```json
{
  "id": 505,
  "text": "Avez-vous pratiqué le télétravail de manière régulière ?",
  "response": {
    "type": "choice",
    "choices": ["Oui", "Non"]
  }
}
```

---

### 6. Formations continues

**Question 6.1 - Formation professionnelle**
```json
{
  "id": 601,
  "text": "Avez-vous suivi des formations professionnelles au cours de votre carrière ?",
  "response": {
    "type": "choice",
    "choices": ["Oui", "Non"]
  }
}
```

**Question 6.2 - Types de formations**
```json
{
  "id": 602,
  "text": "Pouvez-vous nous indiquer les formations professionnelles que vous avez suivies ?",
  "response": {
    "type": "input_list",
    "text": "Intitulé de la formation"
  }
}
```

**Question 6.3 - Certifications obtenues**
```json
{
  "id": 603,
  "text": "Avez-vous obtenu des certifications professionnelles ?",
  "response": {
    "type": "choice",
    "choices": ["Oui", "Non"]
  }
}
```

---

### 7. Situation actuelle

**Question 7.1 - Statut actuel**
```json
{
  "id": 701,
  "text": "Quelle est votre situation professionnelle actuelle ?",
  "response": {
    "type": "choice",
    "choices": ["En activité", "Retraité(e)", "Sans emploi", "Autre"]
  }
}
```

**Question 7.2 - Retraite**
```json
{
  "id": 702,
  "text": "Si vous êtes à la retraite, à quelle date avez-vous cessé votre activité professionnelle ?",
  "response": {
    "type": "input",
    "text": "Date (mois/année)"
  }
}
```

---

## Structure de navigation suggérée

### Flux pour la trajectoire scolaire :

1. **Q101** → Si "Oui" → **Q102**
2. **Q102** → **Q103**
3. **Q103** → **Q104**
4. **Q104** → Passage à la trajectoire professionnelle (**Q201**)

Si "Non" à Q101 → directement à **Q201**

---

### Flux pour la trajectoire professionnelle :

1. **Q201** → Si "Oui" → **Q202**
2. **Q202** → Si "Oui" → **Q203**, sinon → **Q204**
3. **Q203** → **Q204**
4. **Q204** → Si "Non" → **Q301**
5. **Q301** → Pour chaque entreprise → **Q302**, **Q303**
6. **Q401** → Si "Oui" → **Q402**
7. **Q402** → **Q403**, **Q404**
8. **Q501** → Si "Non" → **Q502**
9. **Q502** → **Q503**
10. **Q503** → Si "Oui" → **Q504**
11. **Q504** → **Q505**
12. **Q601** → Si "Oui" → **Q602**
13. **Q602** → **Q603**
14. **Q701** → Si "Retraité(e)" → **Q702**

---

## Exemple de données générées

Basé sur les données de `data_1.json`, voici un exemple de ce qui pourrait être collecté :

### Parcours scolaire :
- **Établissements** : Université Bordeaux (1960-1970), IUT Pessac (1970-1980)
- **Lieux** : Bordeaux, Pessac
- **Type d'activité** : Études

### Parcours professionnel :
- **Période d'inactivité** : 1980-1983
- **Activité** : Emploi (1983-2020)
- **Entreprises** : Entreprise 1 (1983-1998), Entreprise 2 (1998-2020)
- **Postes** : Graphiste (1983-1991), Modélisateur 3D (1991-2000), Directeur artistique (2000-2020)
- **Lieux de travail** : Bordeaux (1983-1998), Paris (1998-2005), Montpellier (2005-2020)

---

## Notes d'implémentation

1. **Types de réponses** :
   - `choice` : Questions à choix multiples (Oui/Non ou options prédéfinies)
   - `input` : Réponse textuelle simple
   - `input_list` : Liste de réponses textuelles (pour les multiples établissements, postes, etc.)

2. **Groupes de timeline** :
   - Les réponses alimentent les groupes 21 (Poste), 22 (Établissement), 23 (Lieu), 24 (Activité professionnelle)
   - Les groupes 23 et 24 sont de type "primary" dans la visualisation

3. **Effets possibles** :
   - `ajouterEpisode` : Ajouter un nouvel épisode sur la timeline
   - `modifierFinEpisode` : Modifier la date de fin d'un épisode existant
   - `change_component_state` : Changer l'état du composant pour passer à la section suivante

4. **Cohérence avec les données résidentielles** :
   - Les dates et lieux de travail peuvent être croisés avec les données de résidence pour analyser les mobilités
   - La structure suit le même modèle que les questions migratoires existantes
