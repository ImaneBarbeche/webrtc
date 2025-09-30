// // Debug logging
// var debugLog = document.getElementById('debug-log');
// function log(message) {
//     var timestamp = new Date().toLocaleTimeString();
//     debugLog.innerHTML += `[${timestamp}] ${message}<br>`;
//     debugLog.scrollTop = debugLog.scrollHeight;
//     console.log(message);
// }

// var pc = null;
// var dc = null;
// var query = document.querySelector.bind(document);
// var queryAll = document.querySelectorAll.bind(document);
// var nought = query("#nought");
// var cross = query("#cross");
// var first = query("#first");
// var next = query("#next");
// var btn0 = query("#btn0");
// var btn1 = query("#btn1");
// var tarea0 = queryAll("textarea")[0];
// var tarea1 = queryAll("textarea")[1];
// var statusline = query("#status");
// var stringify = JSON.stringify;
// var state = "off";
// var isOfferor = null;
// var synId = null;
// var gameId = null;
// var seq = null;
// var prevState = null;
// var prevStatusText = null;
// var prevDisabled = {};
// var transferCallback = null;
// var turn = null;

// function makeId(){
//     var now = new Date;
//     return `${now.getFullYear()}:${now.getMonth()}:${now.getDate()}:${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}:${now.getMilliseconds()}:${Math.ceil(Math.random() * 0x100000000)}`;
// }

// var restoreState = () => {[statusline.innerText, prevStatusText, state, prevState] = [prevStatusText, null, prevState, null]};

// function cancelTransfer(doCall){
//     synId = null;
//     restoreState();
//     ({
//         btn0: btn0.disabled,
//         btn1: btn1.disabled,
//         nought: nought.disabled,
//         cross: cross.disabled,
//         first: first.disabled,
//         next: next.disabled
//     } = prevDisabled);
//     prevDisabled = {};
//     if(doCall)
//         transferCallback?.();
//     transferCallback = null;
// }

// var [settingsDisable, settingsEnable] = [true, false].map(b => () => [nought, cross, first, next].forEach(_ => _.disabled = b));

// function setStateAndStatus(newState, statusText){
//     log(`State change: ${state} -> ${newState}`);
//     state = newState;
//     if(statusText) {
//         statusline.innerText = statusText;
//         log(`Status: ${statusText}`);
//     }
// }

// var setPlaceholder = (el, pl, disabled) =>{[el.placeholder, el.value, el.disabled] = [pl, "", disabled ?? el.disabled]};

// function initialize(statusText){
//     log("=== INITIALIZE ===");
//     if(pc){
//         pc.removeEventListener("connectionstatechange", pcConnectionStateChange)
//         pc.close();
//     }
//     dc = null;
//     pc = new RTCPeerConnection({
//         iceServers: [
//             { urls: 'stun:stun.l.google.com:19302' }
//         ],
//         iceTransportPolicy: 'all',
//         iceCandidatePoolSize: 0
//     });
    
//     // Debug event listeners
//     pc.addEventListener("icecandidate", pcIceCandidate);
//     pc.addEventListener("connectionstatechange", pcConnectionStateChange);
//     pc.addEventListener("datachannel", pcDataChannel);
    
//     pc.addEventListener("iceconnectionstatechange", () => {
//         log(`ICE Connection State: ${pc.iceConnectionState}`);
//     });
    
//     pc.addEventListener("icegatheringstatechange", () => {
//         log(`ICE Gathering State: ${pc.iceGatheringState}`);
//     });
    
//     pc.addEventListener("signalingstatechange", () => {
//         log(`Signaling State: ${pc.signalingState}`);
//     });
    
//     setPlaceholder(tarea0, 'Click the below button "click to generates an offer" to generate an offer to join this game, then give opponent the offer.');
//     settingsEnable();
//     btn0.innerText = "click to generate an offer";
//     btn0.disabled = false;
//     setPlaceholder(tarea1, 'Or paste the offer you received to here, then click the below button "click to confirm the offer".', false);
//     btn1.innerText = "click to confirm the offer";
//     btn1.disabled = true;
//     setStateAndStatus("off", statusText);
// }

// var tempState = (newState, statusText) => {[prevState, state, prevStatusText, statusline.innerText] = [state, newState, statusline.innerText, statusText]};

// function transfer(cmd, data, callback){
//     log(`Transfer command: ${cmd}`);
//     ({...prevDisabled} = {
//         btn0: btn0.disabled,
//         btn1: btn1.disabled,
//         nought: nought.disabled,
//         cross: cross.disabled,
//         first: first.disabled,
//         next: next.disabled
//     });
//     btn0.disabled = true;
//     btn1.disabled = true;
//     settingsDisable();
//     tempState("transfering", "data transfering...");
//     if(callback)
//         transferCallback = callback;
//     dc.send(`${cmd},${gameId},${isOfferor},${seq},${synId = makeId()}${data ? `,${data}` : ""}`);
// }

// var setTurn = _ => (turn = _, statusline.innerText = turn + " turn");

// function gaming(){
//     log("=== GAMING START ===");
//     queryAll("#board td").forEach(_=>_.classList.remove("nought", "cross"));
//     tarea0.placeholder = 'Click the below button "click to end game" to end the game.';
//     btn0.innerText = "click to end game";
//     settingsDisable();
//     state = "gaming";
//     setTurn(first.checked ? "your" : "opponent's");
// }

// async function btn0Click(e){
//     log(`Button 0 clicked - state: ${state}`);
//     switch(state){
//         case "off":
//             setPlaceholder(tarea0, "An offer is being created.");
//             btn0.disabled = true;
//             tarea1.disabled = true;
//             btn1.disabled = true;
//             dc = pc.createDataChannel("data");
//             dc.addEventListener("open", dcOpen);
//             dc.addEventListener("message", dcMessage);
//             log("Creating offer...");
//             log(`ICE Gathering State before offer: ${pc.iceGatheringState}`);
//             const offer = await pc.createOffer();
//             log(`Offer created: ${JSON.stringify(offer).substring(0, 100)}`);
//             await pc.setLocalDescription(offer);
//             log(`Local description set. ICE Gathering State: ${pc.iceGatheringState}`);
//             log("Waiting for ICE candidates...");
//             state = "offerCreating";
//             break;
//         case "waitAnswer":
//         case "waitConnect":
//             try{
//                 let result = await navigator.permissions.query({ name: "clipboard-write" });
//                 switch(result.state){
//                     case "granted":
//                     case "prompt":
//                         await navigator.clipboard.writeText(tarea0.value);
//                         log("Copied to clipboard");
//                         break;
//                 }
//             }catch(err){
//                 log(`Clipboard error: ${err.message}`);
//                 let disabled = tarea0.disabled;
//                 tarea0.disabled = false;
//                 try{
//                     tarea0.select();
//                 }catch(err2){
//                     tarea0.setSelectionRange(0, tarea0.value.length);
//                 }
//                 document.execCommand("copy");
//                 tarea0.disabled = disabled;
//             }
//             break;
//         case "waitStartGame":
//             log("Starting game...");
//             transfer("start", null, gaming);
//             break;
//         case "gaming":
//             log("Ending game...");
//             transfer("end", null, waitStartGame);
//             break;
//     }
// }

// function waitClosed(placeholder){
//     log("Wait closed");
//     state = "waitClosed";
//     setPlaceholder(tarea0, "");
//     btn0.disabled = true;
//     setPlaceholder(tarea1, placeholder);
//     btn1.disabled = true;
//     settingsDisable();
// }

// async function btn1Click(e){
//     log(`Button 1 clicked - state: ${state}`);
//     switch(state){
//         case "off":
//             try {
//                 log("Parsing offer JSON...");
//                 let desc = JSON.parse(tarea1.value);
//                 log(`Offer parsed: ${JSON.stringify(desc).substring(0, 100)}...`);
//                 if(!("gameId" in desc)){
//                     setStateAndStatus("error", "Error: The offer has no gameId.");
//                     log("ERROR: No gameId in offer");
//                     break;
//                 }
//                 ({gameId} = desc);
//                 log(`Game ID: ${gameId}`);
//                 delete desc.gameId;
//                 log("Setting remote description (offer)...");
//                 await pc.setRemoteDescription(desc);
//                 log("Remote description set, creating answer...");
//                 await pc.setLocalDescription(await pc.createAnswer());
//                 log("Answer created, waiting for ICE candidates...");
//                 setPlaceholder(tarea0, "An answer is being created.");
//                 btn0.disabled = true;
//                 tarea1.disabled = true;
//                 btn1.disabled = true;
//                 isOfferor = false;
//                 state = "answerCreating";
//             } catch(err) {
//                 log(`ERROR in btn1Click (off state): ${err.message}`);
//                 log(`Stack: ${err.stack}`);
//             }
//             break;
//         case "waitConfirmAnswer":
//             try{
//                 log("Parsing answer JSON...");
//                 let answerDesc = JSON.parse(tarea1.value);
//                 log(`Answer parsed: ${JSON.stringify(answerDesc).substring(0, 100)}...`);
//                 log("Setting remote description (answer)...");
//                 await pc.setRemoteDescription(answerDesc);
//                 log("Remote description (answer) set successfully");
//                 state = "connectionCompleting";
//             }catch(err){
//                 log(`ERROR in btn1Click (waitConfirmAnswer): ${err.message}`);
//                 log(`Stack: ${err.stack}`);
//             }
//             break;
//         case "waitAnswer":
//         case "waitConnect":
//         case "waitStartGame":
//         case "gaming":
//             log("Quitting game...");
//             waitClosed("The game is being quited.");
//             if(dc?.readyState === "open")
//                 dc.send(`close,${gameId},${isOfferor},${seq}`);
//             setTimeout(initialize, 0);
//             break;
//     }
// }

// async function tarea1Input(e){
//     switch(state){
//         case "off":
//             btn1.disabled = !tarea1.value;
//             break;
//         case "waitAnswer":
//             if(tarea1.value){
//                 btn1.innerText = "click to confirm the answer and connect";
//                 state = "waitConfirmAnswer";
//                 log("Answer pasted, ready to confirm");
//             }
//             break;
//         case "waitConfirmAnswer":
//             if(!tarea1.value){
//                 btn1.innerText = "click to give up";
//                 state = "waitAnswer";
//             }
//             break;
//     }
// }

// async function pcIceCandidate(e){
//     if(e.candidate) {
//         log(`ICE Candidate: ${e.candidate.candidate.substring(0, 50)}...`);
//     } else {
//         log("ICE Candidate: null (gathering complete)");
//     }
    
//     switch(state){
//         case "offerCreating":
//             if(!e.candidate){
//                 gameId = makeId();
//                 const offerData = {
//                     ...pc.localDescription.toJSON(),
//                     gameId
//                 };
//                 tarea0.value = stringify(offerData);
                
//                 // Generate QR Code for the offer
//                 log(`Tentative génération QR code...`);
//                 if (typeof generateQRCode === 'function' && document.getElementById('qrCanvas')) {
//                     log(`Génération QR code pour l'offre`);
//                     generateQRCode(stringify(offerData), 'qrCanvas');
//                 } else {
//                     log(`Erreur: generateQRCode=${typeof generateQRCode}, canvas=${!!document.getElementById('qrCanvas')}`);
//                 }
                
//                 log(`Offer complete with gameId: ${gameId}`);
//                 log(`Offer length: ${tarea0.value.length} chars`);
//                 btn0.innerText = "click to copy the offer to clipboard";
//                 btn0.disabled = false;
//                 setPlaceholder(tarea1, 'Paste the answer you received to here, then click the below button "click to confirm and connect" to establish the connection of the game.\n\nOr click the below button "click to give up".', false);
//                 btn1.innerText = "click to give up";
//                 btn1.disabled = false;
//                 isOfferor = true;
//                 state = "waitAnswer";
//             }
//             break;
//         case "answerCreating":
//             if(!e.candidate){
//                 tarea0.value = stringify(pc.localDescription);
                
//                 // Generate QR Code for the answer
//                 log(`Tentative génération QR code pour réponse...`);
//                 if (typeof generateQRCode === 'function' && document.getElementById('qrCanvas')) {
//                     log(`Génération QR code pour la réponse`);
//                     generateQRCode(stringify(pc.localDescription), 'qrCanvas');
//                 } else {
//                     log(`Erreur: generateQRCode=${typeof generateQRCode}, canvas=${!!document.getElementById('qrCanvas')}`);
//                 }
                
//                 log(`Answer complete`);
//                 log(`Answer length: ${tarea0.value.length} chars`);
//                 btn0.innerText = "click to copy the answer to clipboard";
//                 btn0.disabled = false;
//                 setPlaceholder(tarea1, 'Click the button "click to copy the answer to clipboard", then give opponent the answer.\n\nOr click the below button "click to give up" to give up the connection of the game.', true);
//                 btn1.innerText = "click to give up";
//                 btn1.disabled = false;
//                 state = "waitConnect";
//             }
//             break;
//     }
// }

// function waitStartGame(statusText){
//     log("=== WAIT START GAME ===");
//     settingsEnable();
//     setPlaceholder(tarea0, 'Click the below button "click to start game" to start the game.\n\nAfter starting, the settings of the game will be unable to be changed.');
//     btn0.innerText = "click to start game";
//     setPlaceholder(tarea1, 'Or click the below button "click to quit" to quit the game and break the connection between you and opponent.', true);
//     btn1.innerText = "click to quit";
//     setStateAndStatus("waitStartGame", statusText);
// }

// async function pcConnectionStateChange(e){
//     log(`Connection state changed: ${pc.connectionState}`);
//     switch(pc.connectionState){
//         case "connected":
//             log("=== CONNECTION ESTABLISHED ===");
//             switch(state){
//                 case "connectionCompleting":
//                 case "waitConnect":
//                     seq = 0;
//                     waitStartGame();
//                     break;
//                 case "disconnected":
//                     restoreState();
//                     break;
//             }
//             break;
//         case "closed":
//             log("Connection closed");
//             setTimeout(initialize.bind(null, "connection closed!"), 0);
//             break;
//         case "disconnected":
//             log("Connection disconnected");
//             tempState("disconnected", "disconnected temporarily!");
//             break;
//         case "failed":
//             log("Connection failed");
//             setTimeout(initialize.bind(null, "connection failed!"), 0);
//             break;
//     }
// }

// function dcOpen(e){
//     log("=== DATA CHANNEL OPEN ===");
//     ++seq;
//     if(!isOfferor)
//         return;
//     transfer("config", `${nought.checked},${first.checked}`);
// }

// function dcMessage(e){
//     log(`Message received: ${e.data.substring(0, 50)}...`);
//     var datum = null;
//     function branch(cmd, mayCancelTransfer){
//         if(e.data.startsWith(`${cmd},${gameId},${!isOfferor},${seq},`)){
//             if(mayCancelTransfer && state === "transfering"){
//                 if(isOfferor)
//                     return false;
//                 cancelTransfer();
//             }
//             datum = e.data.slice(`${cmd},${gameId},${!isOfferor},${seq},`.length).split(",");
//             dc.send(`ack,${gameId},${isOfferor},${seq},${datum[0]}`);
//             ++seq;
//             return true;
//         } else
//             return false;
//     }
//     if(e.data === `close,${gameId},${!isOfferor},${seq}`){
//         waitClosed("The game is being quited by opponent.");
//         setTimeout(initialize.bind(null, "Game is quited by opponent."), 0);
//     }else if(branch("config")){
//         nought.checked = datum[1] === "false";
//         cross.checked = datum[1] === "true";
//         first.checked = datum[2] === "false";
//         next.checked = datum[2] === "true";
//     }else if(branch("playAt")){
//         queryAll("#board td")[datum[1]].classList.add(!nought.checked ? "nought" : "cross");
//         setTurn("your");
//         check();
//     }else if(e.data === `ack,${gameId},${!isOfferor},${seq},${synId}`){
//         if(state !== "transfering")
//             return;
//         ++seq;
//         cancelTransfer(true);
//     }else if(branch("set", true))
//         [nought, cross, first, next].find(_=>_.id === datum[1]).checked = true;
//     else if(branch("start", true))
//         gaming();
//     else if(branch("end", true))
//         waitStartGame("Game is ended by opponent.");
// }

// function pcDataChannel(e){
//     log("=== DATA CHANNEL RECEIVED ===");
//     if(!dc){
//         dc = e.channel;
//         dc.addEventListener("open", dcOpen);
//         dc.addEventListener("message", dcMessage);
//     }
// }

// function isWinner(squares, shape){
//     var total = squares.reduce((acc, cur) => acc * 2 + cur.classList.contains(shape), 0);
//     return [0o700, 0o70, 7, 0o444, 0o222, 0o111, 0o421, 0o124].some(bits => (total & bits) === bits);
// }

// function check(){
//     var squares = [...queryAll("#board td")];
//     var [yourShape, opponentShape] = nought.checked ? ["nought", "cross"] : ["cross", "nought"];
//     if(isWinner(squares, yourShape))
//         waitStartGame("you win!");
//     else if(isWinner(squares, opponentShape))
//         waitStartGame("you lost!");
//     else if(!query("#board td:not(.nought, .cross)"))
//         waitStartGame("draw!");
// }

// queryAll("#board td").forEach((_, i)=>{
//     _.addEventListener("click", e=>{
//         if(state === "gaming" && turn === "your" && !_.classList.contains("nought") && !_.classList.contains("cross")){
//             transfer("playAt", `${i}`, ()=>{
//                 _.classList.add(nought.checked ? "nought" : "cross");
//                 setTurn("opponent's");
//                 check();
//             });
//         }
//     });
// });

// btn0.addEventListener("click", btn0Click);
// tarea1.addEventListener("input", tarea1Input);
// btn1.addEventListener("click", btn1Click);

// [
//     [nought, cross],
//     [cross, nought],
//     [first, next],
//     [next, first]
// ].forEach(([me, it])=>{
//     me.addEventListener("change", e=>{
//         if(state === "transfering")
//             return;
//         it.checked = true;
//         transfer("set", it.id, () => me.checked = true);
//     });
// });

// // QR Code integration
// function handleScannedData(data) {
//     log(`QR Code scanned: ${data.substring(0, 50)}...`);
//     tarea1.value = data;
    
//     // Trigger input event to update button state
//     tarea1.dispatchEvent(new Event('input'));
    
//     // Verify if it's valid JSON and log it
//     try {
//         JSON.parse(data);
//         log('✅ QR code scanné avec succès - Vous pouvez maintenant cliquer sur le bouton pour traiter');
//     } catch (e) {
//         log('⚠️ QR code scanné mais ne contient pas de JSON valide');
//     }
// }

// // Export for qr-scan.js
// if (typeof window !== 'undefined') {
//     window.handleScannedData = handleScannedData;
// }

// log("Application started");
// initialize();