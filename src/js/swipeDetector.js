document.addEventListener('DOMContentLoaded', () => {
    const drawer = document.getElementById('bricks');
    const handle = drawer.querySelector('.handle');

    if (!handle) {
        console.error("Handle element not found within #bricks");
        return;
    }

    // --- SNAP POINTS (in REM) ---
    // These define the discrete states the drawer can occupy
    const SNAP_MIN_REM = 4.2; 
    const SNAP_MAX_REM = 20.0; 
    
    // The point at which a drag must stop to snap down (e.g., 10rem from the top)
    // If current position is less than this, snap UP. If more, snap DOWN.
    const SNAP_THRESHOLD_REM = 10.0; 

    // State variables
    let isDragging = false;
    let startY = 0;
    let initialTopOffsetPx = 0; 
    let initialTopOffsetRem = 0; // Store the initial REM value

    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);

    const pxToRem = (pxValue) => pxValue / rootFontSize;
    const remToPx = (remValue) => remValue * rootFontSize;

    // ⭐️ New utility function to set the final snapped position
    const setTopOffset = (offsetValueRem) => {
        // We no longer need to clamp here, as the snap points are the clamps
        drawer.style.setProperty('--top-offset', `${offsetValueRem}rem`);
    };

    // --- 1. pointerdown: Start the Drag ---
    handle.addEventListener('pointerdown', (e) => {
        isDragging = true;
        startY = e.clientY; 
        
        const style = getComputedStyle(drawer);
        const currentOffsetRemString = style.getPropertyValue('--top-offset').trim().replace('rem', '');
        
        initialTopOffsetRem = parseFloat(currentOffsetRemString);
        initialTopOffsetPx = remToPx(initialTopOffsetRem); 

        // ⭐️ IMPORTANT: Enable transitions AFTER drag ends, disable during drag
        // drawer.style.transition = 'none'; 
        
        handle.setPointerCapture(e.pointerId);
    });

    // --- 2. pointermove: Apply Movement (Smooth Drag) ---
    document.addEventListener('pointermove', (e) => {
        if (!isDragging) return;

        const deltaY = e.clientY - startY; 
        
        // Swiping Down (deltaY is positive) increases the offset (moves the top edge down)
        const newTopOffsetPx = initialTopOffsetPx + deltaY;
        const newTopOffsetRem = pxToRem(newTopOffsetPx);
        
        // Clamp the drag movement so the user can't drag it infinitely
        const clampedNewTopOffsetRem = Math.min(SNAP_MAX_REM, Math.max(SNAP_MIN_REM, newTopOffsetRem));

        drawer.style.setProperty('--top-offset', `${clampedNewTopOffsetRem}rem`);
    });

    // --- 3. pointerup: End Drag & SNAP Logic ---
    document.addEventListener('pointerup', (e) => {
        if (!isDragging) return;
        
        isDragging = false;
        
        // 1. Get the final position the user left the drawer at
        const style = getComputedStyle(drawer);
        const currentOffsetRemString = style.getPropertyValue('--top-offset').trim().replace('rem', '');
        const currentOffsetRem = parseFloat(currentOffsetRemString);

        let finalSnapPoint;

        // 2. Decide the snap point based on the threshold
        if (currentOffsetRem < SNAP_THRESHOLD_REM) {
            // If the user stopped dragging high enough, snap to the fully open position (MIN offset)
            finalSnapPoint = SNAP_MIN_REM;
        } else {
            // If the user stopped dragging low enough, snap to the fully closed/default position (MAX offset)
            finalSnapPoint = SNAP_MAX_REM;
        }
        
        // 3. Apply the snap with a transition for smooth animation
        // ⭐️ Restore the CSS transition for the snap animation
        drawer.style.transition = 'opacity 0.3s ease, transform 0.3s ease, top 0.3s ease, height 0.3s ease'; 

        setTopOffset(finalSnapPoint);
        
        // Release the pointer capture
        try {
            handle.releasePointerCapture(e.pointerId);
        } catch (error) {
            // Ignore capture release errors
        }
    });
});