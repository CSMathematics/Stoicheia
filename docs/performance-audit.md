1. Rust CompileManager cancellation/single-flight
Να μπορεί να ακυρώνει πραγματικά παλιό LaTeX process, όχι μόνο να αγνοεί stale result.

2. Πλήρες Rust normalized scene
Να μεταφερθούν ακόμη περισσότερα styles/options/labels/source spans στη Rust πλευρά, ώστε το frontend να κάνει όσο γίνεται λιγότερο parsing.

3. Recovery storage σε Rust app data
Autosave/recent files να φύγουν μελλοντικά από localStorage.

4. Store slices
Να μικρύνει το Zustand store σε document, interaction, viewport, compiler slices.

5. Runtime benchmark μέσα στην Tauri εφαρμογή
Πραγματικό keypress-to-preview latency, React commit duration, drag FPS, IPC timing.

6. Πρόσθετα tests
Cancellation tests για compiler, render count tests, και tests για ένα undo/source commit ανά drag.

## Canvas zoom audit

Η καθυστέρηση μετά την προσθήκη axes/labels προερχόταν από το frontend SVG layer:

- Το grid δημιουργούσε nodes για ολόκληρο το εύρος συντεταγμένων, ακόμη και εκτός viewport.
- Σε μικρό grid step μπορούσαν να ενημερώνονται πάνω από 2.000 SVG nodes σε κάθε wheel event.
- `pan` και `zoom` ενημερώνονταν με δύο ξεχωριστές store μεταβολές.
- Τα wheel/trackpad events δεν συγχωνεύονταν ανά animation frame.

Διορθώθηκε με viewport culling, adaptive grid density, atomic viewport updates και `requestAnimationFrame` batching. Προστέθηκαν regression tests για το όριο των ορατών grid nodes και το wheel-event coalescing.

### Απόφαση για Rust

Το zoom, το pan, η επιλογή visible SVG nodes και το browser paint πρέπει να παραμείνουν στο frontend. Η μεταφορά τους σε Rust θα πρόσθετε IPC/serialization κόστος χωρίς να μειώσει το React reconciliation ή το SVG paint, που ήταν το πραγματικό bottleneck.

Rust έχει νόημα για βαρύτερη ανάλυση γεωμετρίας: επίλυση εξαρτήσεων, μαζικούς υπολογισμούς intersections/projections, spatial index για πολύ μεγάλα σχέδια και παραγωγή ενός normalized scene. Το frontend πρέπει να κρατά το viewport interaction τοπικό και να αποδίδει μόνο το ορατό τμήμα αυτού του scene.
