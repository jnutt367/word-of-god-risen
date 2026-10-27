TEDDY'S VOICE — DROP-IN FOLDER for Gather the Flock
====================================================

Every card in the game is one of Teddy's lines. When his recorded
voice is ready, it lands HERE — no other file in the game changes.

Line ids (the game's LINES manifest names the same ids):
  greeting.mp3   "Well hey, Will —" (the template's greeting slot:
                 a future sheep's skin records their own name here)
  well.mp3       The Well — living water (John 4:14)
  barn.mp3       The Barn — the stories (Romans 10:17)
  board.mp3      The Field Board — the counting (Luke 15:5)
  gate.mp3       The Gate — the way in (John 10:9)
  porch.mp3      The Porch — the family's wall (John 10:16)
  closing.mp3    The Fold — every one home (John 10:11);
                 must carry the settled closing line word for word:
                 "You gathered your flock — now hear the Shepherd read."

HOW TO SWITCH THE VOICE ON
1. Put the .mp3 files in this folder, named exactly as above.
   House standard: -16 LUFS, the same gated Teddy chain as the app.
2. List them in manifest.json in this folder, like:
     { "lines": { "greeting": "audio/greeting.mp3",
                  "well": "audio/well.mp3" } }
   (Only the lines you list will play; the rest stay text-only.)
3. Done. showCard() picks the file up and plays it when its card
   opens. Until a line is listed, its words stand on screen alone —
   no robot voice, no placeholder sound, ever.
