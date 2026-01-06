# WebRTC Life Stories Application

A hybrid mobile application for collecting life history data with real-time synchronization between interviewer and interviewee using WebRTC.

## JavaScript Files Structure

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