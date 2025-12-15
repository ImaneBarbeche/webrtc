document.addEventListener('DOMContentLoaded', () => {
    const drawer = document.getElementById('bricks');
    const handle = drawer.querySelector('.handle');

    if (!handle) {
        console.error("Handle element not found within #bricks");
        return;
    }

    // --- Configuration ---
    const SNAP_MIN_REM = 3.2; 
    const SNAP_MAX_REM = 24.2; 
    const SNAP_THRESHOLD_REM = 10.0; 
    const MOMENTUM_MULTIPLIER = 50; 

    // --- State & Utilities ---
    let isDragging = false;
    let startY = 0;
    let initialTopOffsetPx = 0; 
    let lastMoveTime = 0;
    let lastMoveY = 0;
    let velocity = 0; 

    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const pxToRem = (pxValue) => pxValue / rootFontSize;
    const remToPx = (remValue) => remValue * rootFontSize;

    const setTopOffset = (offsetValueRem) => {
        drawer.style.setProperty('--top-offset', `${offsetValueRem}rem`);
    };

    // Helper function to handle the snap logic (used by pointerup and pointercancel)
    const handleSnap = (e) => {
        if (!isDragging) return;
        
        isDragging = false;
        
        // 1. Get the current position
        const style = getComputedStyle(drawer);
        const currentOffsetRem = parseFloat(style.getPropertyValue('--top-offset').trim().replace('rem', ''));

        // 2. Calculate projected position based on velocity (Momentum)
        const momentumTravelPx = velocity * MOMENTUM_MULTIPLIER;
        const momentumTravelRem = pxToRem(momentumTravelPx);
        const projectedOffsetRem = currentOffsetRem + momentumTravelRem;

        let finalSnapPoint;

        // 3. Decide the snap point based on projected position
        if (projectedOffsetRem < SNAP_THRESHOLD_REM) {
            finalSnapPoint = SNAP_MIN_REM; // Snap fully UP
        } else {
            finalSnapPoint = SNAP_MAX_REM; // Snap fully DOWN
        }

        // 4. Ensure snap point is within limits
        finalSnapPoint = Math.min(SNAP_MAX_REM, Math.max(SNAP_MIN_REM, finalSnapPoint));
        
        // ⭐️ FIX B: Use microtask (setTimeout 0) to ensure the transition starts successfully
        setTimeout(() => {
            // Apply the snap with a smooth transition
            drawer.style.transition = 'opacity 0.3s ease, transform 0.3s ease, top 0.3s ease, height 0.3s ease'; 
            setTopOffset(finalSnapPoint);
            
            // Clean up pointer capture
            try {
                handle.releasePointerCapture(e.pointerId);
            } catch (error) {
                // Ignore capture release errors
            }
        }, 0);
    };


    // --- 1. pointerdown: Start the Drag ---
    handle.addEventListener('pointerdown', (e) => {
        isDragging = true;
        startY = e.clientY; 
        
        const style = getComputedStyle(drawer);
        const currentOffsetRemString = style.getPropertyValue('--top-offset').trim().replace('rem', '');
        
        initialTopOffsetPx = remToPx(parseFloat(currentOffsetRemString)); 
        lastMoveY = e.clientY;
        lastMoveTime = Date.now();
        velocity = 0; 
        
        drawer.style.transition = 'none'; 
        handle.setPointerCapture(e.pointerId);
    });

    // --- 2. pointermove: Apply Movement & Track Velocity ---
    document.addEventListener('pointermove', (e) => {
        if (!isDragging) return;

        // ⭐️ IMPORTANT FIX: Prevent the browser from scrolling on mobile
        e.preventDefault(); 

        const currentTime = Date.now();
        const deltaY = e.clientY - startY; 
        const deltaMove = e.clientY - lastMoveY;
        const deltaTime = currentTime - lastMoveTime;

        // Calculate velocity (pixels per millisecond)
        if (deltaTime > 0) {
            // Apply a small smoothing factor (e.g., 80% current velocity, 20% new velocity)
            velocity = velocity * 0.8 + (deltaMove / deltaTime) * 0.2; 
        }

        const newTopOffsetPx = initialTopOffsetPx + deltaY;
        const newTopOffsetRem = pxToRem(newTopOffsetPx);
        
        const clampedNewTopOffsetRem = Math.min(SNAP_MAX_REM, Math.max(SNAP_MIN_REM, newTopOffsetRem));

        setTopOffset(clampedNewTopOffsetRem);

        lastMoveY = e.clientY;
        lastMoveTime = currentTime;
    });

    // --- 3. pointerup: End Drag & SNAP Logic ---
    document.addEventListener('pointerup', handleSnap);

    // ⭐️ FIX C: Handle pointercancel (for fast mobile flicks)
    document.addEventListener('pointercancel', handleSnap);
});