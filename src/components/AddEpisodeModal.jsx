import React from 'react';
import { X } from 'lucide-react';
import { useState } from 'react';

import { groupsData } from '../js/timeline/timelineData.js';
import { ajouterEpisode } from '../js/episodes/episodes.js';

  // Fonctions pour récupérer les données
const getTrajectories = () => {
    return groupsData.filter(group => group.nestedGroups);
};

const getAttributes = (trajectoryId) => {
    const trajectory = groupsData.find(group => group.id === trajectoryId);
    if (!trajectory) return [];
    return groupsData.filter(group => trajectory.nestedGroups.includes(group.id));
}

const formatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return '';
    return date.toISOString().split('T')[0];
};

const handleDateChange = (setter) => (e) => {
    // We parse the string value from the input and set the Date object in state
    setter(new Date(e.target.value)); 
};
  
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


    const [contentText, setContentText] = useState('')

    const [selectedStartDate, setSelectedStartDate] = useState(new Date())
    const [selectedEndDate, setSelectedEndDate] = useState(new Date())
    const [selectedEventDate, setSelectedEventDate] = useState(new Date())

    const handleFormSubmit = ((e) => {
        e.preventDefault()
        if(selectedType == 'episode') {
            console.log("test")
            // ajouterEpisode(text, start, end, group)
            ajouterEpisode(contentText,selectedStartDate, selectedEndDate, selectedAttributeId)
        }
        document.getElementById('episode_modal').close();


    })


    return (
        <dialog  id="episode_modal">{selectedTrajectoryId}
        {selectedAttributeId} {selectedType} {contentText}
            <div className='title-row'>
                <header>
                    <h3>Ajouter un element</h3>
                </header>
                <button className='invisible-button' onClick={() => document.getElementById('episode_modal').close()}>
                    <X />
                </button>
            </div>
            <form onSubmit={handleFormSubmit}>
                <label>
                    <span>Content</span>
                    <input type="text" name="" id="" onChange={(e) => setContentText(e.target.value)}/>
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
                            <input 
                                type="date" 
                                name="dateFrom" 
                                value={formatDate(selectedStartDate)}
                                onChange={handleDateChange(setSelectedStartDate)}
                            />
                        </label>
                        <label>
                            <span>To</span>
                            <input 
                                type="date" 
                                name="dateTo" 
                                value={formatDate(selectedEndDate)}
                                onChange={handleDateChange(setSelectedEndDate)}
                            />
                        </label>
                    </div>

                ) : (
                    <div>
                        <label>
                            <span>Date</span>
                            <input 
                                type="date" 
                                name="eventDate" 
                                value={formatDate(selectedEventDate)}
                                onChange={handleDateChange(setSelectedEventDate)}
                            />
                        </label>
                    </div>
                )}
                <button onClick={() => document.getElementById('episode_modal').close()}>
                    Cancel
                </button>
                <button type='submit'>
                    Ajouter
                </button>
            </form>
        </dialog>

    );
}

export default AddEpisodeModal;