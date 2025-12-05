import { useState } from 'react';
import { groupsData } from '../js/timeline/timelineData.js';
import { surveyService } from '../js/stateMachine/stateMachine.js';

export function ManualEpisodeModal({ isOpen, onClose }) {
  // États du formulaire
  const [selectedTrajectory, setSelectedTrajectory] = useState(null);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [content, setContent] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');

  // Fonctions pour récupérer les données
  const getTrajectories = () => {
    return groupsData.filter(group => group.nestedGroups);
  };

  const getAttributes = (trajectoryId) => {
    const trajectory = groupsData.find(group => group.id === trajectoryId);
    if (!trajectory) return [];
    return groupsData.filter(group => trajectory.nestedGroups.includes(group.id));
  }

  // Soumission du formulaire
  const handleSubmit = () => {
    // À compléter - envoyer ADD_MANUAL_EPISODE
  };

  // Si le modal n'est pas ouvert, ne rien afficher
  if (!isOpen) return null;

  console.log("Trajectoires:", getTrajectories());
  console.log("Attributs de Migratoire (1):", getAttributes(1));
  console.log("Attributs de Scolaire (2):", getAttributes(2));
  return (
    <div className="modal">
      <div className='modal-content'>
        <h2>Ajouter un épisode</h2>

        <label>Trajectoire :</label>
        <select>
          <option>

          </option>
        </select>

        {selectedTrajectory && (
          <>
            <label>Attribut :</label>
            <select>
              <option>

              </option>
            </select>
          </>
        )}

        {selectedAttribute && (
          <>
            <input
              placeholder='Année de début'
              value={startYear}

            />
            <input
              placeholder='Année de fin'
              value={endYear}

            />
            <button onClick={handleSubmit}>Ajouter</button>

          </>
        )}
        <button onClick={onClose}>Fermer</button>

      </div>
    </div>
  )

}

