import React, { useState } from 'react';
import ActionButton from './ActionButton';
import styles from './form-actions.module.css'
import AddEpisodeModal from './AddEpisodeModal';

function FormActions() {



    return (
        <div className={styles.container }>
            {/* <ActionButton onClick={() => setShowEpisodeModal(true)} /> */}
            <ActionButton onClick={() => document.getElementById('episode_modal').showModal()} />
            <AddEpisodeModal />
            
        </div>
    );
}

export default FormActions;