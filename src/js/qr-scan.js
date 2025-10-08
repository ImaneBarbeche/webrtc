async function startScanner() {
    console.log('QR Scanner: Starting...');
    
    const overlay = document.createElement('div');
    overlay.id = 'qrOverlay';
    Object.assign(overlay.style, {
        position: 'fixed', 
        top: '0', 
        left: '0', 
        right: '0', 
        bottom: '0',
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        zIndex: '10000', 
        flexDirection: 'column', 
        color: '#fff',
        fontFamily: 'Arial, sans-serif'
    });
    
    const video = document.createElement('video');
    video.setAttribute('playsinline', '');
    Object.assign(video.style, {
        maxWidth: '90%', 
        maxHeight: '60%',
        border: '3px solid #fff',
        borderRadius: '15px'
    });
    overlay.appendChild(video);
    
    const info = document.createElement('div');
    info.textContent = '📱 Alignez le QR code dans le cadre';
    Object.assign(info.style, {
        marginTop: '20px',
        fontSize: '18px',
        textAlign: 'center'
    });
    overlay.appendChild(info);
    
    const cancel = document.createElement('button');
    cancel.textContent = '❌ Annuler';
    Object.assign(cancel.style, {
        marginTop: '20px',
        padding: '12px 24px',
        fontSize: '16px',
        background: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer'
    });
    overlay.appendChild(cancel);
    
    document.body.appendChild(overlay);

    let stream = null, detector = null, rafId = null;
    cancel.addEventListener('click', stopScanner);

    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }, 
            audio: false 
        });
        video.srcObject = stream;
        await video.play();
    } catch (err) {
        console.error('getUserMedia failed', err);
        alert('Impossible d\'accéder à la caméra: ' + (err.message || err));
        stopScanner();
        return;
    }

    if ('BarcodeDetector' in window) {
        try {
            const supported = await BarcodeDetector.getSupportedFormats();
            if (supported.includes('qr_code')) detector = new BarcodeDetector({ formats: ['qr_code'] });
        } catch (e) { console.warn(e); }
    }

    if (detector) {
        const loop = async () => {
            try {
                const barcodes = await detector.detect(video);
                if (barcodes && barcodes.length) {
                    applyScannedValue(barcodes[0].rawValue);
                    stopScanner();
                    return;
                }
            } catch (e) { console.warn('detect error', e); }
            rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
    } else {
        info.textContent = 'Scan non supporté par ce WebView. Ajoute jsQR si besoin.';
        console.warn('BarcodeDetector absent');
    }

    function stopScanner() {
        if (rafId) cancelAnimationFrame(rafId);
        if (stream) stream.getTracks().forEach(t => t.stop());
        const el = document.getElementById('qrOverlay'); if (el) el.remove();
        console.log('startScanner: arrêté');
    }
}
function applyScannedValue(value) {
    console.log('QR scanné:', value);
    // Use the handleScannedData function from webrtc-simple.js if available
    if (typeof window.handleScannedData === 'function') {
        window.handleScannedData(value);
    } else {
        // Fallback to direct textarea assignment
        const ta = document.querySelectorAll('textarea')[1]; // Second textarea
        if (ta) { 
            ta.value = value; 
            ta.focus();
            // Trigger input event to activate button
            ta.dispatchEvent(new Event('input'));
        }
    }
}
// attache automatiquement le bouton au chargement (évite duplication dans webrtc-simple.js)
document.addEventListener('DOMContentLoaded', () => {
    const scanBtn = document.getElementById('scanBtn');
    if (scanBtn) scanBtn.addEventListener('click', startScanner);
});
