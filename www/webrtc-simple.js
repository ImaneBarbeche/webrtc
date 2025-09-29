let localConnection;
let remoteConnection;
let dataChannel;
let receiveChannel; // Canal pour recevoir les messages

// Fonction pour réinitialiser la connexion
function resetPeerConnection() {
    if (localConnection) {
        localConnection.close();
    }
    if (remoteConnection) {
        remoteConnection.close();
    }
    
    localConnection = new RTCPeerConnection({
        iceServers: [] // Pas de serveurs STUN/TURN pour mode LAN local
    });
    
    remoteConnection = new RTCPeerConnection({
        iceServers: [] // Pas de serveurs STUN/TURN pour mode LAN local
    });
    
    setupDataChannel();
}

// Configuration du dataChannel
function setupDataChannel() {
    dataChannel = localConnection.createDataChannel('chat', { ordered: true });
    
    dataChannel.onopen = () => {
        document.getElementById('chatLog').value += 'Connexion établie! Vous pouvez maintenant chatter.\n';
        document.getElementById('sendMsg').disabled = false;
        document.getElementById('chatMsg').placeholder = 'Tapez votre message...';
    };
    
    dataChannel.onmessage = (event) => {
        document.getElementById('chatLog').value += 'Reçu: ' + event.data + '\n';
    };
    
    dataChannel.onerror = (error) => {
        console.error('Erreur DataChannel LOCAL:', error);
    };
    
    dataChannel.onclose = () => {
        console.log('DataChannel fermé côté LOCAL');
    };
    
    // Configuration pour recevoir le dataChannel côté distant
    localConnection.ondatachannel = (event) => {
        const receiveChannelLocal = event.channel;
        receiveChannelLocal.onmessage = (event) => {
            document.getElementById('chatLog').value += 'Reçu: ' + event.data + '\n';
        };
        receiveChannelLocal.onopen = () => {
            document.getElementById('chatLog').value += 'Canal de réception connecté!\n';
            document.getElementById('sendMsg').disabled = false;
            document.getElementById('chatMsg').placeholder = 'Tapez votre message...';
        };
    };
    
    remoteConnection.ondatachannel = (event) => {
        receiveChannel = event.channel; // Stocke le canal reçu
        receiveChannel.onmessage = (event) => {
            document.getElementById('chatLog').value += 'Reçu: ' + event.data + '\n';
        };
        receiveChannel.onopen = () => {
            document.getElementById('chatLog').value += 'Canal de réception connecté!\n';
            document.getElementById('sendMsg').disabled = false;
            document.getElementById('chatMsg').placeholder = 'Tapez votre message...';
        };
    };
}

// Génération du QR code
function generateQRCode(text, canvasId) {
    const canvas = document.getElementById(canvasId);
    
    const qr = qrcode(0, 'L'); // Version 0 (auto), niveau L (bas)
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
    
    console.log('QR Code généré');
}

// Création de l'offre
async function createOffer() {
    resetPeerConnection();
    
    try {
        const offer = await localConnection.createOffer();
        await localConnection.setLocalDescription(offer);
        
        const offerText = JSON.stringify(offer);
        document.getElementById('textToShare').value = offerText;
        generateQRCode(offerText, 'qrCanvas');
        
        document.getElementById('chatLog').value += 'Offre créée - partagez le QR code ou le texte\n';
    } catch (error) {
        console.error('Erreur création offre:', error);
    }
}

// Traitement du SDP reçu
async function setRemoteSDP() {
    const receivedText = document.getElementById('textReceived').value.trim();
    
    if (!receivedText) {
        alert('Veuillez coller le SDP reçu');
        return;
    }
    
    try {
        const receivedData = JSON.parse(receivedText);
        
        if (receivedData.type === 'offer') {
            // Réception d'une offre -> créer une réponse
            if (!remoteConnection) {
                resetPeerConnection();
            }
            
            await remoteConnection.setRemoteDescription(receivedData);
            const answer = await remoteConnection.createAnswer();
            await remoteConnection.setLocalDescription(answer);
            
            const answerText = JSON.stringify(answer);
            document.getElementById('textToShare').value = answerText;
            generateQRCode(answerText, 'qrCanvas');
            
            document.getElementById('chatLog').value += 'Réponse créée - partagez le QR code\n';
            
        } else if (receivedData.type === 'answer') {
            // Réception d'une réponse -> utiliser la connexion qui a créé l'offre
            if (localConnection && localConnection.signalingState !== 'stable') {
                await localConnection.setRemoteDescription(receivedData);
                document.getElementById('chatLog').value += 'SDP échangé, connexion en cours...\n';
            } else {
                throw new Error('Aucune offre en cours ou connexion déjà stable');
            }
        }
        
        document.getElementById('textReceived').value = '';
        
    } catch (error) {
        console.error('Erreur traitement SDP:', error);
        alert('Erreur: ' + error.message);
    }
}

// Envoi de message via dataChannel
function sendMessage() {
    const message = document.getElementById('chatMsg').value.trim();
    
    if (!message) {
        alert('Veuillez saisir un message');
        return;
    }
    
    // Détermine quel canal utiliser pour envoyer
    let channelToUse = null;
    
    if (dataChannel && dataChannel.readyState === 'open') {
        channelToUse = dataChannel; // Canal créé (côté offre)
    } else if (receiveChannel && receiveChannel.readyState === 'open') {
        channelToUse = receiveChannel; // Canal reçu (côté réponse)
    }
    
    if (!channelToUse) {
        alert('Aucun canal de communication ouvert');
        return;
    }
    
    try {
        channelToUse.send(message);
        document.getElementById('chatLog').value += 'Envoyé: ' + message + '\n';
        document.getElementById('chatMsg').value = '';
    } catch (error) {
        console.error('Erreur envoi message:', error);
        alert('Erreur envoi: ' + error.message);
    }
}

// Événements des boutons
document.addEventListener('DOMContentLoaded', () => {
    // Désactive le bouton d'envoi au début
    document.getElementById('sendMsg').disabled = true;
    document.getElementById('chatMsg').placeholder = 'Connexion requise pour chatter';
    
    document.getElementById('createOffer').addEventListener('click', createOffer);
    document.getElementById('setRemoteSDP').addEventListener('click', setRemoteSDP);
    document.getElementById('sendMsg').addEventListener('click', sendMessage);
    
    // Entrée pour envoyer message
    document.getElementById('chatMsg').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
});