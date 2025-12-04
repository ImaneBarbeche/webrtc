// Données des groupes

export const groupsData = [
  // MIGRATOIRE
  {
    id: 1,
    contentText: "Migratoire",
    nestedGroups: [11, 12, 13],
    showNested: true,
    className: "vert",
  },
  {
    id: 11,
    contentText: "Statut résidentiel",
    dependsOn: 12,
    className: "line_11",
  },
  { id: 12, contentText: "Logement", dependsOn: 13, className: "line_12" },
  { id: 13, contentText: "Commune", nestedInGroup: 1, className: "line_13" },

  // SCOLAIRE
  {
    id: 2,
    contentText: "Scolaire",
    nestedGroups: [21, 22, 23],
    showNested: false,
    className: "bleu",
  },
  {
    id: 21,
    contentText: "Établissements",
    dependsOn: 23,
    className: "line_21",
  },
  { id: 22, contentText: "Formations", dependsOn: 23, className: "line_22" },
  { id: 23, contentText: "Diplômes", nestedInGroup: 2, className: "line_23" },

  // PROFESSIONNELLE
  {
    id: 3,
    contentText: "Professionnelle",
    nestedGroups: [31, 32],
    showNested: false,
    className: "rouge",
  },
  { id: 31, contentText: "Postes", nestedInGroup: 3, className: "line_31" },
  { id: 32, contentText: "Contrats", dependsOn: 31, className: "line_32" },
];
