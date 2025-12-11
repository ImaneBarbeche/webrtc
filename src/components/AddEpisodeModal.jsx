import React from 'react';
import { X } from 'lucide-react';
import { useState } from 'react';

import { groupsData } from '../js/timeline/timelineData.js';

  // Fonctions pour récupérer les données
const getTrajectories = () => {
    return groupsData.filter(group => group.nestedGroups);
};

const getAttributes = (trajectoryId) => {
    const trajectory = groupsData.find(group => group.id === trajectoryId);
    if (!trajectory) return [];
    return groupsData.filter(group => trajectory.nestedGroups.includes(group.id));
}
  
function AddEpisodeModal({onClose}) {

    const [trajectories, setTrajectories] = useState(getTrajectories())
    const [selectedTrajectoryId, setSelectedTrajectoryId] = useState(trajectories[0]?.id || '')

    const [attributes, setAttributes] = useState(getAttributes(selectedTrajectoryId))
    const [selectedAttributeId, setSelectedAttributeId] = useState(attributes[0]?.id || '')


    const handleTrajectoryChange = (e) => {
        const newId = parseInt(e.target.value)
        setSelectedTrajectoryId(newId);
        // Getting the attributes for the selected trajectory
        const newAttributes = getAttributes(newId);
        
        setAttributes(newAttributes);
        
        // updating the attribute to be the first one from the list by default
        setSelectedAttributeId(newAttributes[0]?.id || '');
    };

    const handleAttributeChange = (e) => {
        const newId = parseInt(e.target.value)
        setSelectedAttributeId(newId);
    };

    const [selectedType, setSelectedType] = useState('episode')


    return (
        <dialog  id="episode_modal">{selectedTrajectoryId}
        {selectedAttributeId} {selectedType}
            <div className='title-row'>
                <header>
                    <h3>Ajouter un element</h3>
                </header>
                <button className='invisible-button' onClick={() => document.getElementById('episode_modal').close()}>
                    <X />
                </button>
            </div>
            <form action="">
                <label>
                    <span>Content</span>
                    <input type="text" name="" id="" />
                </label>
                <label>
                    <span>Episode</span>
                    <input type="radio" name='type' id='episode'
                     checked={selectedType === 'episode'}
                     onChange={() => setSelectedType('episode')} />
                </label>
                <label>
                    <span>Evenement</span>
                    <input type="radio" name='type' id='event' 
                    checked={selectedType === 'event'}
                    onChange={() => setSelectedType('event')}/>
                </label>
                <label>
                    <span>
                        Trajectoire
                    </span>
                    <select
                        value={selectedTrajectoryId} 
                        onChange={handleTrajectoryChange}
                    >
                        {trajectories.map(trajectory =>
                            <option 
                                value={trajectory.id} 
                                key={trajectory.id}
                            >
                                {trajectory.contentText}
                            </option>
                        ) }
                    </select>
                </label>
                <label>
                    <span>
                        Attribut
                    </span>
                    <select
                        value={selectedAttributeId} 
                        onChange={handleAttributeChange}
                    >
                        {attributes.map(attribute =>
                            <option 
                                value={attribute.id} 
                                key={attribute.id}
                            >
                                {attribute.contentText}
                            </option>
                        ) }
                    </select>
                </label>
                {selectedType === 'episode' ? (
                    <div>
                        <label>
                            <span>From</span>
                            <input type="date" name="" id="" />
                        </label>
                        <label>
                            <span>To</span>
                            <input type="date" name="" id="" />
                        </label>
                    </div>

                ) : (
                    <div>
                        <label>
                            <span>Date</span>
                            <input type="date" name="" id="" />
                        </label>
                    </div>
                )}
            </form>
        </dialog>

    );
}

export default AddEpisodeModal;