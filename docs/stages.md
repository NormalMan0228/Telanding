# Stage structure

One current stage and its matching external control panel are visible. There is no stage selector.

- `/` is the title landing with a click-to-open hospital curtain. `/chamber` contains the entrance device puzzles. `/play` contains the current stage and its external panel.
- `static/js/stages/config.js`: stage 01 combines three equations with linked dials (each click advances its own and the next dial; solution 2,1,3). Stage 02 combines five weighted circuit switches to total 12, with two logical constraints. Stage 03 decodes six symbols and reverses their order using separate data, legend and direction clues. All three clues must be discovered before a matching input clears a stage.
- `static/js/stages/index.js`: stage switching, completion evaluation, video dialog, and intro integration.
- `static/js/stages/curtain.js`: low-resolution polygon hospital curtain and opening animation. Its transparent full-screen button is keyboard accessible and has no visible arrow. Reduced motion opens immediately after interaction.
- Video sources are intentionally null at the user's request. A configured source uses the native HTML video player and a local absolute URL or HTTPS direct media URL. Clearing the panel attempts playback from the same user interaction; the replay button and native controls remain available. With no source, the UI displays only the functional status “영상 미등록” and does not simulate playback or allow progression.
- Rooms 01–03 contain different clue objects and irregular clusters of carts, screens, storage and seating. Room 04 remains in the legacy layout file but is not used by the stage interface. Corridor exits are disabled in stage mode.
- Only the video's `ended` event opens the transfer dialog. Closing the video early does not advance. Moving the connection lever to its endpoint advances exactly one stage; the final stage completes without wrapping back to the first.
- Panel controls, collected clues, completion and video completion are scoped by stage. The transition dialog pauses player movement and supports keyboard slider input.
