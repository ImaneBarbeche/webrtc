export const test_items = [
  // ========================================
  // TRAJECTOIRE MIGRATOIRE (Groupes 11-13)
  // ========================================
  
  // Communes (groupe 13 - LANDMARK)
  {
    id: "mig_commune_1",
    type: "range",
    content: "Lyon",
    start: "1980-01-01T00:00:00.000Z",
    end: "1998-09-01T00:00:00.000Z",
    group: 13,
    className: "vert"
  },
  {
    id: "mig_commune_2",
    type: "range",
    content: "Toulouse",
    start: "1998-09-01T00:00:00.000Z",
    end: "2003-06-30T00:00:00.000Z",
    group: 13,
    className: "vert"
  },
  {
    id: "mig_commune_3",
    type: "range",
    content: "Paris",
    start: "2003-06-30T00:00:00.000Z",
    end: "2010-01-01T00:00:00.000Z",
    group: 13,
    className: "vert"
  },
  {
    id: "mig_commune_4",
    type: "range",
    content: "Nantes",
    start: "2010-01-01T00:00:00.000Z",
    end: "2018-08-01T00:00:00.000Z",
    group: 13,
    className: "vert"
  },
  {
    id: "mig_commune_5",
    type: "range",
    content: "Bordeaux",
    start: "2018-08-01T00:00:00.000Z",
    end: "2026-01-09T00:00:00.000Z",
    group: 13,
    className: "vert"
  },
  
  // Logements (groupe 12)
  {
    id: "mig_logement_1",
    type: "range",
    content: "Appartement familial",
    start: "1980-01-01T00:00:00.000Z",
    end: "1998-09-01T00:00:00.000Z",
    group: 12,
    className: "vert"
  },
  {
    id: "mig_logement_2",
    type: "range",
    content: "Résidence universitaire",
    start: "1998-09-01T00:00:00.000Z",
    end: "2000-09-01T00:00:00.000Z",
    group: 12,
    className: "vert"
  },
  {
    id: "mig_logement_3",
    type: "range",
    content: "Appartement T2",
    start: "2000-09-01T00:00:00.000Z",
    end: "2003-06-30T00:00:00.000Z",
    group: 12,
    className: "vert"
  },
  {
    id: "mig_logement_4",
    type: "range",
    content: "Studio Paris",
    start: "2003-06-30T00:00:00.000Z",
    end: "2006-05-01T00:00:00.000Z",
    group: 12,
    className: "vert"
  },
  {
    id: "mig_logement_5",
    type: "range",
    content: "Appartement T3",
    start: "2006-05-01T00:00:00.000Z",
    end: "2010-01-01T00:00:00.000Z",
    group: 12,
    className: "vert"
  },
  {
    id: "mig_logement_6",
    type: "range",
    content: "Maison",
    start: "2010-01-01T00:00:00.000Z",
    end: "2018-08-01T00:00:00.000Z",
    group: 12,
    className: "vert"
  },
  {
    id: "mig_logement_7",
    type: "range",
    content: "Appartement T4",
    start: "2018-08-01T00:00:00.000Z",
    end: "2026-01-09T00:00:00.000Z",
    group: 12,
    className: "vert"
  },
  
  // Statut résidentiel (groupe 11)
  {
    id: "mig_statut_1",
    type: "range",
    content: "Chez parents",
    start: "1980-01-01T00:00:00.000Z",
    end: "1998-09-01T00:00:00.000Z",
    group: 11,
    className: "vert"
  },
  {
    id: "mig_statut_2",
    type: "range",
    content: "Logement universitaire",
    start: "1998-09-01T00:00:00.000Z",
    end: "2000-09-01T00:00:00.000Z",
    group: 11,
    className: "vert"
  },
  {
    id: "mig_statut_3",
    type: "range",
    content: "Locataire",
    start: "2000-09-01T00:00:00.000Z",
    end: "2010-01-01T00:00:00.000Z",
    group: 11,
    className: "vert"
  },
  {
    id: "mig_statut_4",
    type: "range",
    content: "Propriétaire",
    start: "2010-01-01T00:00:00.000Z",
    end: "2018-08-01T00:00:00.000Z",
    group: 11,
    className: "vert"
  },
  {
    id: "mig_statut_5",
    type: "range",
    content: "Locataire",
    start: "2018-08-01T00:00:00.000Z",
    end: "2026-01-09T00:00:00.000Z",
    group: 11,
    className: "vert"
  },

  // ========================================
  // TRAJECTOIRE FAMILIALE (Groupes 21-23)
  // ========================================
  
  // Statut matrimonial (groupe 23 - landmark)
  {
    id: "fam_statut_1",
    type: "range",
    content: "Célibataire",
    start: "1980-01-01T00:00:00.000Z",
    end: "2004-03-15T00:00:00.000Z",
    group: 23,
    className: "bleu"
  },
  {
    id: "fam_statut_2",
    type: "range",
    content: "Marié(e)",
    start: "2004-03-15T00:00:00.000Z",
    end: "2015-11-20T00:00:00.000Z",
    group: 23,
    className: "bleu"
  },
  {
    id: "fam_statut_3",
    type: "range",
    content: "Divorcé(e)",
    start: "2015-11-20T00:00:00.000Z",
    end: "2019-06-10T00:00:00.000Z",
    group: 23,
    className: "bleu"
  },
  {
    id: "fam_statut_4",
    type: "range",
    content: "En couple (union libre)",
    start: "2019-06-10T00:00:00.000Z",
    end: "2026-01-09T00:00:00.000Z",
    group: 23,
    className: "bleu"
  },
  
  // Enfants (groupe 22) - EVENTS (type box)
  {
    id: "fam_enfant_1",
    type: "box",
    content: "baby",
    start: "2006-08-12T00:00:00.000Z",
    group: 22,
    className: "bleu"
  },
  {
    id: "fam_enfant_2",
    type: "box",
    content: "baby",
    start: "2009-04-23T00:00:00.000Z",
    group: 22,
    className: "bleu"
  },
  
  // Composition ménage (groupe 21)
  {
    id: "fam_menage_1",
    type: "range",
    content: "Avec parents",
    start: "1980-01-01T00:00:00.000Z",
    end: "1998-09-01T00:00:00.000Z",
    group: 21,
    className: "bleu"
  },
  {
    id: "fam_menage_2",
    type: "range",
    content: "Seul(e)",
    start: "1998-09-01T00:00:00.000Z",
    end: "2004-03-15T00:00:00.000Z",
    group: 21,
    className: "bleu"
  },
  {
    id: "fam_menage_3",
    type: "range",
    content: "Couple",
    start: "2004-03-15T00:00:00.000Z",
    end: "2006-08-12T00:00:00.000Z",
    group: 21,
    className: "bleu"
  },
  {
    id: "fam_menage_4",
    type: "range",
    content: "Couple + 1 enfant",
    start: "2006-08-12T00:00:00.000Z",
    end: "2009-04-23T00:00:00.000Z",
    group: 21,
    className: "bleu"
  },
  {
    id: "fam_menage_5",
    type: "range",
    content: "Couple + 2 enfants",
    start: "2009-04-23T00:00:00.000Z",
    end: "2015-11-20T00:00:00.000Z",
    group: 21,
    className: "bleu"
  },
  {
    id: "fam_menage_6",
    type: "range",
    content: "Parent seul + 2 enfants",
    start: "2015-11-20T00:00:00.000Z",
    end: "2019-06-10T00:00:00.000Z",
    group: 21,
    className: "bleu"
  },
  {
    id: "fam_menage_7",
    type: "range",
    content: "Famille recomposée (4 pers.)",
    start: "2019-06-10T00:00:00.000Z",
    end: "2026-01-09T00:00:00.000Z",
    group: 21,
    className: "bleu"
  },

  // ========================================
  // TRAJECTOIRE SCOLAIRE (Groupes 31-32)
  // ========================================
  
  // Niveau (groupe 32 - landmark)
  {
    id: "scol_niveau_1",
    type: "range",
    content: "Primaire",
    start: "1986-09-01T00:00:00.000Z",
    end: "1991-06-30T00:00:00.000Z",
    group: 32,
    className: "jaune"
  },
  {
    id: "scol_niveau_2",
    type: "range",
    content: "Collège",
    start: "1991-09-01T00:00:00.000Z",
    end: "1995-06-30T00:00:00.000Z",
    group: 32,
    className: "jaune"
  },
  {
    id: "scol_niveau_3",
    type: "range",
    content: "Lycée",
    start: "1995-09-01T00:00:00.000Z",
    end: "1998-06-30T00:00:00.000Z",
    group: 32,
    className: "jaune"
  },
  {
    id: "scol_niveau_4",
    type: "range",
    content: "Licence",
    start: "1998-09-01T00:00:00.000Z",
    end: "2001-06-30T00:00:00.000Z",
    group: 32,
    className: "jaune"
  },
  {
    id: "scol_niveau_5",
    type: "range",
    content: "Master",
    start: "2001-09-01T00:00:00.000Z",
    end: "2003-06-30T00:00:00.000Z",
    group: 32,
    className: "jaune"
  },
  {
    id: "scol_niveau_6",
    type: "range",
    content: "MBA",
    start: "2016-09-01T00:00:00.000Z",
    end: "2018-06-30T00:00:00.000Z",
    group: 32,
    className: "jaune"
  },
  
  // Type (groupe 31) - ONLY Public or Private
  {
    id: "scol_type_1",
    type: "range",
    content: "Public",
    start: "1986-09-01T00:00:00.000Z",
    end: "1998-06-30T00:00:00.000Z",
    group: 31,
    className: "jaune"
  },
  {
    id: "scol_type_2",
    type: "range",
    content: "Public",
    start: "1998-09-01T00:00:00.000Z",
    end: "2001-06-30T00:00:00.000Z",
    group: 31,
    className: "jaune"
  },
  {
    id: "scol_type_3",
    type: "range",
    content: "Privé",
    start: "2001-09-01T00:00:00.000Z",
    end: "2003-06-30T00:00:00.000Z",
    group: 31,
    className: "jaune"
  },
  {
    id: "scol_type_4",
    type: "range",
    content: "Privé",
    start: "2016-09-01T00:00:00.000Z",
    end: "2018-06-30T00:00:00.000Z",
    group: 31,
    className: "jaune"
  },

  // ========================================
  // TRAJECTOIRE PROFESSIONNELLE (Groupes 41-44)
  // ========================================
  
  // Lieu de travail (groupe 44 - landmark)
  {
    id: "pro_lieu_1",
    type: "range",
    content: "Lyon",
    start: "1996-07-01T00:00:00.000Z",
    end: "1998-09-01T00:00:00.000Z",
    group: 44,
    className: "rouge"
  },
  {
    id: "pro_lieu_2",
    type: "range",
    content: "Toulouse",
    start: "2002-02-01T00:00:00.000Z",
    end: "2003-08-31T00:00:00.000Z",
    group: 44,
    className: "rouge"
  },
  {
    id: "pro_lieu_3",
    type: "range",
    content: "Paris",
    start: "2003-09-01T00:00:00.000Z",
    end: "2010-01-01T00:00:00.000Z",
    group: 44,
    className: "rouge"
  },
  {
    id: "pro_lieu_4",
    type: "range",
    content: "Nantes",
    start: "2010-01-01T00:00:00.000Z",
    end: "2018-08-01T00:00:00.000Z",
    group: 44,
    className: "rouge"
  },
  {
    id: "pro_lieu_5",
    type: "range",
    content: "Bordeaux",
    start: "2018-08-01T00:00:00.000Z",
    end: "2026-01-09T00:00:00.000Z",
    group: 44,
    className: "rouge"
  },
  
  // Statut d'activité (groupe 43)
  {
    id: "pro_statut_1",
    type: "range",
    content: "Job étudiant",
    start: "1996-07-01T00:00:00.000Z",
    end: "1998-08-31T00:00:00.000Z",
    group: 43,
    className: "rouge"
  },
  {
    id: "pro_statut_2",
    type: "range",
    content: "Étudiant",
    start: "1998-09-01T00:00:00.000Z",
    end: "2003-06-30T00:00:00.000Z",
    group: 43,
    className: "rouge"
  },
  {
    id: "pro_statut_3",
    type: "range",
    content: "Stagiaire",
    start: "2002-02-01T00:00:00.000Z",
    end: "2002-07-31T00:00:00.000Z",
    group: 43,
    className: "rouge"
  },
  {
    id: "pro_statut_4",
    type: "range",
    content: "Salarié CDI",
    start: "2003-09-01T00:00:00.000Z",
    end: "2007-12-31T00:00:00.000Z",
    group: 43,
    className: "rouge"
  },
  {
    id: "pro_statut_5",
    type: "range",
    content: "Congé parental (6 mois)",
    start: "2006-08-12T00:00:00.000Z",
    end: "2007-02-12T00:00:00.000Z",
    group: 43,
    className: "rouge"
  },
  {
    id: "pro_statut_6",
    type: "range",
    content: "Salarié CDI",
    start: "2008-01-01T00:00:00.000Z",
    end: "2015-09-30T00:00:00.000Z",
    group: 43,
    className: "rouge"
  },
  {
    id: "pro_statut_7",
    type: "range",
    content: "Chômage",
    start: "2015-10-01T00:00:00.000Z",
    end: "2016-03-15T00:00:00.000Z",
    group: 43,
    className: "rouge"
  },
  {
    id: "pro_statut_8",
    type: "range",
    content: "Salarié CDI",
    start: "2016-03-15T00:00:00.000Z",
    end: "2026-01-09T00:00:00.000Z",
    group: 43,
    className: "rouge"
  },
  
  // Profession (groupe 42)
  {
    id: "pro_profession_1",
    type: "range",
    content: "Vendeur",
    start: "1996-07-01T00:00:00.000Z",
    end: "1998-08-31T00:00:00.000Z",
    group: 42,
    className: "rouge"
  },
  {
    id: "pro_profession_2",
    type: "range",
    content: "Stagiaire Marketing",
    start: "2002-02-01T00:00:00.000Z",
    end: "2002-07-31T00:00:00.000Z",
    group: 42,
    className: "rouge"
  },
  {
    id: "pro_profession_3",
    type: "range",
    content: "Chargé d'études",
    start: "2003-09-01T00:00:00.000Z",
    end: "2007-12-31T00:00:00.000Z",
    group: 42,
    className: "rouge"
  },
  {
    id: "pro_profession_4",
    type: "range",
    content: "Responsable Marketing",
    start: "2008-01-01T00:00:00.000Z",
    end: "2012-12-31T00:00:00.000Z",
    group: 42,
    className: "rouge"
  },
  {
    id: "pro_profession_5",
    type: "range",
    content: "Directeur Marketing",
    start: "2013-01-01T00:00:00.000Z",
    end: "2015-09-30T00:00:00.000Z",
    group: 42,
    className: "rouge"
  },
  {
    id: "pro_profession_6",
    type: "range",
    content: "Directeur Commercial",
    start: "2016-03-15T00:00:00.000Z",
    end: "2026-01-09T00:00:00.000Z",
    group: 42,
    className: "rouge"
  },
  
  // Secteur (groupe 41)
  {
    id: "pro_secteur_1",
    type: "range",
    content: "Commerce",
    start: "1996-07-01T00:00:00.000Z",
    end: "1998-08-31T00:00:00.000Z",
    group: 41,
    className: "rouge"
  },
  {
    id: "pro_secteur_2",
    type: "range",
    content: "Industrie",
    start: "2002-02-01T00:00:00.000Z",
    end: "2002-07-31T00:00:00.000Z",
    group: 41,
    className: "rouge"
  },
  {
    id: "pro_secteur_3",
    type: "range",
    content: "Services",
    start: "2003-09-01T00:00:00.000Z",
    end: "2012-12-31T00:00:00.000Z",
    group: 41,
    className: "rouge"
  },
  {
    id: "pro_secteur_4",
    type: "range",
    content: "Industrie",
    start: "2013-01-01T00:00:00.000Z",
    end: "2015-09-30T00:00:00.000Z",
    group: 41,
    className: "rouge"
  },
  {
    id: "pro_secteur_5",
    type: "range",
    content: "Services",
    start: "2016-03-15T00:00:00.000Z",
    end: "2026-01-09T00:00:00.000Z",
    group: 41,
    className: "rouge"
  }
];