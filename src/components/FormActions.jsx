import React, { useState } from 'react';
import ActionButton from './ActionButton';
import styles from './form-actions.module.css'
import AddEpisodeModal from './AddEpisodeModal';

function FormActions() {
    const [showEpisodeModal, setShowEpisodeModal] = useState(false)



    return (
        <div className={styles.container }>
            <p>
                {String(showEpisodeModal)}
            </p>
            {/* <ActionButton onClick={() => setShowEpisodeModal(true)} /> */}
            <ActionButton onClick={() => document.getElementById('episode_modal').showModal()} />
            <AddEpisodeModal />
            
        </div>
    );
}

export default FormActions;