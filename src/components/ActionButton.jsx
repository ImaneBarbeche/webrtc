import React from 'react';
import { Plus } from 'lucide-react';

function ActionButton({onClick}) {

    return (
        <button className='secondary-button button-with-icon' onClick={onClick}>
            <Plus strokeWidth={1.5}/>
        </button>
    );
}

export default ActionButton;