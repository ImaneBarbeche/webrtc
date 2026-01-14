# Life Stories

A hybrid mobile application for collecting life history data with real-time synchronization between interviewer and interviewee using WebRTC.

## Installation and Setup

1. Clone the repository:
   ```bash
   git clone
   ```
2. Use npm to install packages
   ```bash
   npm install
   ```
3. Start a local development server:
   ```bash
   npm start
   ```
4. Build the app through Capacitor for your target platform (iOS/Android).
    ```bash
   npm run build
   npx cap sync
   npx cap open android # or ios 
    ```
5. See CSS changes without reloading
    Use the GO Live extension in VS Code. (Warning: only shows dev mode container (not the onboarding process, to be used only for CSS changes))

6. See changes on tablet
    https://capacitorjs.com/docs/guides/live-reload : should work but the uga wifi does not allow it. 
    To work around it you could use your phone as a hotspot and connect the computer to it. Then you can change the server url to the phone's ip address. ("server": {
  "url": "http://192.168.1.68:8100",
  "cleartext": true
},)

7. To debug on android device
    You can plug in the device and use chrome://inspect to see console logs and debug.


## Project Structure

This project is mainly coded using pure JavaScript but some components where created using React as a mean to clean up and simplify the project. To allow React and Javascript to run, we created files called "bridges" that connect the components to the html file. 

Since this is a project that runs offline, libraries and fonts should be downloaded as has been the case here.

### Core Files (src/js)

- **`dataset.js`** - Sample test data and fixtures for development
- **`state.js`** - Centralized application state management
- **`utils.js`** - Utility functions (alerts, formatting, helpers)
- **`swipeDetector.js`** - Touch gesture detection for swipe actions

### QR Code Module (src/js/qrcode)

- **`qr-scan.js`** - Camera access and QR code detection for device pairing
- **`qr-gen.js`** - QR code generation for sharing connection info
- **`qrcode.min.js`** - Third-party QR code library (minified)

### Episodes Module (src/js/episodes)

- **`episodes.js`** - Episode list management and retrieval
- **`episodeEdit.js`** - Episode editing and CRUD operations

### Questionnaire Module (src/js/questionnaire)

- **`questionnaire.js`** - Main questionnaire flow and rendering
- **`eventHandlers.js`** - User interaction handlers for form inputs
- **`questionConfig.js`** - Question definitions and configuration
- **`choicesQuestions.js`** - Multiple choice and dropdown questions
- **`inputQuestion.js`** - Text/number input questions
- **`inputListQuestion.js`** - Questions with list inputs
- **`renderPairedStatusDropdowns.js`** - UI for paired status selection
- **`renderPairedYearAgeInputs.js`** - UI for year/age input pairs
- **`historyDisplay.js`** - Display of survey response history
- **`resetHandler.js`** - Reset questionnaire state
- **`webrtcSync.js`** - Sync questionnaire responses via WebRTC

### State Machine Module (src/js/stateMachine)

- **`stateMachine.js`** - XState state machine definition and flow
- **`context.js`** - State machine context (data store)
- **`actions.js`** - State transition actions
- **`guards.js`** - Conditional guards for state transitions
- **`stateToQuestionMap.js`** - Maps state to corresponding question
- **`persistence.js`** - Save/restore state machine state

### WebRTC Module (src/js/webrtc)

- **`webrtc-onboarding.js`** - Peer connection setup and device pairing flow
- **`webrtc-sync.js`** - Real-time data synchronization between devices

### Timeline Module (src/js/timeline)

- **`timeline.js`** - Main timeline initialization and event coordination
- **`timelineInit.js`** - Timeline setup and initialization
- **`timelineData.js`** - Groups and data definitions for timeline
- **`timelineConfig.js`** - Timeline configuration options
- **`timelineEvents.js`** - Timeline event handlers (add, edit, delete items)
- **`timelineInteractions.js`** - User interactions (clicks, long-press, gestures)
- **`timelineUtils.js`** - Helper functions for timeline operations
- **`timelineStorage.js`** - localStorage persistence for timeline data
- **`timelinePersistence.js`** - Auto-save listeners and debouncing
- **`timelineState.js`** - Timeline state tracking
- **`birthYear.js`** - Birth year calculation and reference bar
- **`verticalBar.js`** - Custom vertical reference bar visualization
- **`dragHandlers.js`** - Drag and drop functionality
- **`zoomNavigation.js`** - Zoom and pan navigation controls
- **`summaryUtils.js`** - Summary/stats display for timeline
- **`chapterToggle.js`** - Show/hide chapter titles toggle
- **`landmarkUtils.js`** - Long-press landmarks (key events) on timeline
- **`gapDetection.js`** - Detect and visualize missing periods
- **`overlapDetection.js`** - Detect and mark overlapping episodes
- **`importExportUtils.js`** - Export/import timeline data

## Functionnalities 

### Dev tools 
The app has buttons for dev purposes such as hidding the onboarding phase, hidding the offer and answer text (as to not have to manually comment css files before building on tablet after each change), deleting localStorage and reloading the app for both users (interviewer and interviewee) and loading a dataset (test_items) to fill the timeline with episodes and events.
### Gaps and Overlaps
Detects gaps or overlaps between episodes, shows an alert (color coded) and store them in a button available only for the interviewer. It allows him to go over the alerts and act on it.
### Export
Downloads the interview's data as a JSON file. Avalailable only on the interviewer's side.
### Navigation buttons and summary
Buttons for accessibility purposes that allows the user to navigate left and right and to zoom in and out.
A button that shows the "synthèse" which is a snapshot of everything that happened the year selected.
This is possible by dragging the vertical bar on top of episodes or events or by clicking on a specific date.
### Birthyear button
Shows the birthyear and allows you to zoom out and move towards the start of the timeline.
### Chapters
They can be closed vertically or horizontally which saves space. By long holding an attribute, you can pin it which allows you, when you close a chapter, to only see the elements regarding that attribute.



## Views
### Onboarding
Users can select their role (interviewer or interviewee) and then begin the connection process. 
After scanning each other's QR code, the users are redirected to their respective pages (dashboard and timeline). This is possible thanks to the WEBRTC phase, where we can save the respective role in localStorage. 

### Interviewer's pages
#### Sidebar 
Navigate between different pages : dashboard (empty for now - see figma for design ideas), questionnaire (a view that only includes the questions), calendrier (a view that only includes the timeline) and splitview (a view that combines both questions and timeline). Be mindful that those views are created by hidding one another.
#### Questionnaire
View and answer questions, history of questions if disconnected, edit answers, export interview's data, see gaps and overlaps and manually add episodes or events. 
#### Calendrier
As an interviewer (role) you can see the timeline but also edit the episodes or events by long holding them.
#### SplitView
You can see both the questions and the timeline.

### Interviewee's pages
This user can only see the timeline - all functionnalities related to editing the timeline are disabled for him.
