export const test_items=[
        // ========================================
        // TRAJECTOIRE MIGRATOIRE
        // ========================================
        
        // Communes (groupe 13 - LANDMARK)
        {
          "id": "mig_commune_1",
          "type": "range",
          "content": "Saint-Denis",
          "start": "2001-01-01T00:00:00.000Z",
          "end": "2017-01-01T00:00:00.000Z",
          "group": 13,
          "className": "green"
        },
        {
          "id": "mig_commune_2",
          "type": "range",
          "content": "Pau",
          "start": "2017-01-01T00:00:00.000Z",
          "end": "2024-01-01T00:00:00.000Z",
          "group": 13,
          "className": "green"
        },
        {
          "id": "mig_commune_3",
          "type": "range",
          "content": "Grenoble",
          "start": "2024-01-01T00:00:00.000Z",
          "end": "2025-12-31T00:00:00.000Z",
          "group": 13,
          "className": "green"
        },
        
        // Logements (groupe 12)
        {
          "id": "mig_logement_1",
          "type": "range",
          "content": "Appartement familial",
          "start": "2001-01-01T00:00:00.000Z",
          "end": "2011-01-01T00:00:00.000Z",
          "group": 12,
          "className": "green"
        },
        {
          "id": "mig_logement_2",
          "type": "range",
          "content": "Pavillon",
          "start": "2011-01-01T00:00:00.000Z",
          "end": "2017-01-01T00:00:00.000Z",
          "group": 12,
          "className": "green"
        },
        {
          "id": "mig_logement_3",
          "type": "range",
          "content": "Résidence étudiante",
          "start": "2017-01-01T00:00:00.000Z",
          "end": "2021-01-01T00:00:00.000Z",
          "group": 12,
          "className": "green"
        },
        {
          "id": "mig_logement_4",
          "type": "range",
          "content": "Colocation",
          "start": "2021-01-01T00:00:00.000Z",
          "end": "2024-01-01T00:00:00.000Z",
          "group": 12,
          "className": "green"
        },
        {
          "id": "mig_logement_5",
          "type": "range",
          "content": "Studio",
          "start": "2024-01-01T00:00:00.000Z",
          "end": "2025-12-31T00:00:00.000Z",
          "group": 12,
          "className": "green"
        },
        
        // Statut résidentiel (groupe 11)
        {
          "id": "mig_statut_1",
          "type": "range",
          "content": "Chez parents (locataires)",
          "start": "2001-01-01T00:00:00.000Z",
          "end": "2011-01-01T00:00:00.000Z",
          "group": 11,
          "className": "green"
        },
        {
          "id": "mig_statut_2",
          "type": "range",
          "content": "Chez parents (propriétaires)",
          "start": "2011-01-01T00:00:00.000Z",
          "end": "2017-01-01T00:00:00.000Z",
          "group": 11,
          "className": "green"
        },
        {
          "id": "mig_statut_3",
          "type": "range",
          "content": "Locataire (logement étudiant)",
          "start": "2017-01-01T00:00:00.000Z",
          "end": "2021-01-01T00:00:00.000Z",
          "group": 11,
          "className": "green"
        },
        {
          "id": "mig_statut_4",
          "type": "range",
          "content": "Locataire (colocation)",
          "start": "2021-01-01T00:00:00.000Z",
          "end": "2024-01-01T00:00:00.000Z",
          "group": 11,
          "className": "green"
        },
        {
          "id": "mig_statut_5",
          "type": "range",
          "content": "Locataire (seul)",
          "start": "2024-01-01T00:00:00.000Z",
          "end": "2025-12-31T00:00:00.000Z",
          "group": 11,
          "className": "green"
        },
        
        // ========================================
        // TRAJECTOIRE SCOLAIRE
        // ========================================
        
        // Diplômes (groupe 23 - LANDMARK)
        {
          "id": "scol_diplome_1",
          "type": "box",
          "content": "Brevet des collèges",
          "category": "degree",
          "start": "2015-06-25T00:00:00.000Z",
          "end": "2025-12-31T00:00:00.000Z",


          "group": 23,
          "className": "blue"
        },
        {
          "id": "scol_diplome_2",
          "type": "box",
          "content": "Baccalauréat S",
          "category": "degree",
          "start": "2018-06-20T00:00:00.000Z",
          "group": 23,
          "className": "blue"
        },
        {
          "id": "scol_diplome_3",
          "type": "box",
          "content": "Licence Informatique",
          "category": "degree",
          "start": "2021-06-15T00:00:00.000Z",
          "group": 23,
          "className": "blue"
        },
        {
          "id": "scol_diplome_4",
          "type": "box",
          "content": "Master Data Science",
          "category": "degree",
          "start": "2023-09-30T00:00:00.000Z",
          "group": 23,
          "className": "blue"
        },
        
        // Établissements (groupe 21)
        {
          "id": "scol_etab_1",
          "type": "range",
          "content": "École primaire Jules Ferry",
          "start": "2007-09-01T00:00:00.000Z",
          "end": "2012-06-30T00:00:00.000Z",
          "group": 21,
          "className": "blue"
        },
        {
          "id": "scol_etab_2",
          "type": "range",
          "content": "Collège Victor Hugo",
          "start": "2012-09-01T00:00:00.000Z",
          "end": "2016-06-30T00:00:00.000Z",
          "group": 21,
          "className": "blue"
        },
        {
          "id": "scol_etab_3",
          "type": "range",
          "content": "Lycée Louis le Grand",
          "start": "2016-09-01T00:00:00.000Z",
          "end": "2019-06-30T00:00:00.000Z",
          "group": 21,
          "className": "blue"
        },
        {
          "id": "scol_etab_4",
          "type": "range",
          "content": "Université de Pau - Licence Info",
          "start": "2019-09-01T00:00:00.000Z",
          "end": "2022-06-30T00:00:00.000Z",
          "group": 21,
          "className": "blue"
        },
        {
          "id": "scol_etab_5",
          "type": "range",
          "content": "Université Grenoble Alpes - Master",
          "start": "2022-09-01T00:00:00.000Z",
          "end": "2024-06-30T00:00:00.000Z",
          "group": 21,
          "className": "blue"
        },
        
        // Formations (groupe 22)
        {
          "id": "scol_form_1",
          "type": "range",
          "content": "Option Sciences (4ème-3ème)",
          "start": "2014-09-01T00:00:00.000Z",
          "end": "2016-06-30T00:00:00.000Z",
          "group": 22,
          "className": "blue"
        },
        {
          "id": "scol_form_2",
          "type": "range",
          "content": "Spécialité Maths/Physique (Terminale)",
          "start": "2018-09-01T00:00:00.000Z",
          "end": "2019-06-30T00:00:00.000Z",
          "group": 22,
          "className": "blue"
        },
        {
          "id": "scol_form_3",
          "type": "range",
          "content": "Formation Python/SQL",
          "start": "2020-01-01T00:00:00.000Z",
          "end": "2020-06-30T00:00:00.000Z",
          "group": 22,
          "className": "blue"
        },
        {
          "id": "scol_form_4",
          "type": "range",
          "content": "Certification Machine Learning",
          "start": "2022-09-01T00:00:00.000Z",
          "end": "2023-01-31T00:00:00.000Z",
          "group": 22,
          "className": "blue"
        },
        
        // ========================================
        // TRAJECTOIRE PROFESSIONNELLE
        // ========================================
        
        // Postes (groupe 31 - LANDMARK)
        {
          "id": "pro_poste_1",
          "type": "range",
          "content": "Job étudiant - Caissier",
          "start": "2019-07-01T00:00:00.000Z",
          "end": "2019-08-31T00:00:00.000Z",
          "group": 41,
          "className": "red"
        },
        {
          "id": "pro_poste_2",
          "type": "range",
          "content": "Stage développement web",
          "start": "2021-02-01T00:00:00.000Z",
          "end": "2021-07-31T00:00:00.000Z",
          "group": 41,
          "className": "red"
        },
        {
          "id": "pro_poste_3",
          "type": "range",
          "content": "Alternance Data Analyst",
          "start": "2022-09-01T00:00:00.000Z",
          "end": "2024-08-31T00:00:00.000Z",
          "group": 41,
          "className": "red"
        },
        {
          "id": "pro_poste_4",
          "type": "range",
          "content": "CDI Data Scientist",
          "start": "2024-09-01T00:00:00.000Z",
          "end": "2025-12-31T00:00:00.000Z",
          "group": 41,
          "className": "red"
        },
        
        // Contrats (groupe 32)
        {
          "id": "pro_contrat_1",
          "type": "range",
          "content": "CDD saisonnier",
          "start": "2019-07-01T00:00:00.000Z",
          "end": "2019-08-31T00:00:00.000Z",
          "group": 42,
          "className": "red"
        },
        {
          "id": "pro_contrat_2",
          "type": "range",
          "content": "Convention de stage",
          "start": "2021-02-01T00:00:00.000Z",
          "end": "2021-07-31T00:00:00.000Z",
          "group": 42,
          "className": "red"
        },
        {
          "id": "pro_contrat_3",
          "type": "range",
          "content": "Contrat d'alternance",
          "start": "2022-09-01T00:00:00.000Z",
          "end": "2024-08-31T00:00:00.000Z",
          "group": 42,
          "className": "red"
        },
        {
          "id": "pro_contrat_4",
          "type": "range",
          "content": "CDI temps plein",
          "start": "2024-09-01T00:00:00.000Z",
          "end": "2025-12-31T00:00:00.000Z",
          "group": 42,
          "className": "red"
        }
      ]
