function generateQRCode(text, canvasId = 'qrCanvas') {
    console.log('Génération QR Code pour:', text.substring(0, 50) + '...');
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error('Canvas non trouvé:', canvasId);
        return;
    }
    
    try {
        const qr = qrcode(0, 'L');
        qr.addData(text);
        qr.make();
        
        const cellSize = 4;
        const size = qr.getModuleCount() * cellSize;
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        for (let row = 0; row < qr.getModuleCount(); row++) {
            for (let col = 0; col < qr.getModuleCount(); col++) {
                ctx.fillStyle = qr.isDark(row, col) ? '#000000' : '#FFFFFF';
                ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
            }
        }
        console.log('QR Code généré avec succès');
    } catch (error) {
        console.error('Erreur génération QR Code:', error);
    }
}