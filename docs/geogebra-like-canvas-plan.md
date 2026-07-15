# GeoGebra-like canvas roadmap

Στόχος: το canvas να γίνει πιο άμεσο και διαδραστικό, χωρίς να χαθεί η βασική φιλοσοφία της εφαρμογής: ο χρήστης δουλεύει οπτικά, αλλά το αποτέλεσμα παραμένει καθαρό `tkz-euclide`/LaTeX.

## 1. Επιλογή και αλληλεπίδραση αντικειμένων

- Κλικ σε σημείο, τμήμα, ευθεία, κύκλο, τόξο ή σχήμα επιλέγει το αντίστοιχο αντικείμενο.
- Η επιλογή είναι κοινή με το Object Tree και το Properties Panel.
- Hover στο canvas δείχνει το ίδιο highlight με το Object Tree.
- Κλικ σε κενό χώρο καθαρίζει την επιλογή.

## 2. Δυναμικό dragging με εξαρτήσεις

- Τα ελεύθερα σημεία μετακινούνται άμεσα.
- Τα εξαρτώμενα σημεία εμφανίζουν κλειδωμένη/παραγόμενη κατάσταση αντί να μετακινούνται λάθος.
- Κατά το drag ενημερώνεται προσωρινά το SVG πριν ξανατρέξει πλήρως το parsing/rendering.
- Shift/Alt modifiers κρατούν υπάρχουσες συμπεριφορές όπως axis-lock και προσωρινό no-snap.

## 3. Έξυπνο snapping

- Snap σε grid.
- Snap σε υπάρχοντα σημεία.
- Snap πάνω σε τμήματα, ευθείες και κύκλους.
- Προαιρετικό snap σε τομές, μέσα τμημάτων και χαρακτηριστικά σημεία.

## 4. Preview κατασκευής πριν από το κλικ

- Όταν ο χρήστης έχει ενεργό εργαλείο και κινεί το ποντίκι, εμφανίζεται προσωρινή γεωμετρία.
- Παράδειγμα: με εργαλείο segment και επιλεγμένο πρώτο σημείο, εμφανίζεται ghost segment μέχρι τον cursor.
- Τα previews πρέπει να έχουν ξεκάθαρο προσωρινό style και να μην αλλάζουν το source μέχρι το τελικό click.

## 5. Tool assistant και σύντομες οδηγίες

- Το canvas δείχνει τι περιμένει το ενεργό εργαλείο: πρώτο σημείο, δεύτερο σημείο, κέντρο, ακτίνα κλπ.
- Εμφανίζεται μικρό contextual hint κοντά στο canvas ή στο pointer.
- Τα μηνύματα είναι σύντομα και αλλάζουν με βάση την πρόοδο του εργαλείου.

## 6. Άξονες και βελτιωμένο grid

- Προαιρετική εμφάνιση αξόνων με labels και ticks.
- Διαφορετικό style για κύριες και δευτερεύουσες γραμμές grid.
- Το grid προσαρμόζεται στο zoom ώστε να μη γίνεται υπερβολικά πυκνό.
- Οι ρυθμίσεις μπαίνουν στα Settings/Canvas controls.

## 7. Algebra/Object panel εμπλουτισμένο

- Το Object Tree μπορεί να δείχνει coordinates, μήκη, ακτίνες και βασικές ιδιότητες.
- Επιλεγμένο αντικείμενο στο panel τονίζεται στο canvas και αντίστροφα.
- Δυνατότητα hide/show ανά αντικείμενο σε επόμενο στάδιο.

## 8. Μετρήσεις πάνω στο canvas

- Εμφάνιση μηκών, γωνιών, ακτίνων και coordinates ως overlay.
- Οι μετρήσεις μπορούν να ενεργοποιούνται προσωρινά ή να μετατρέπονται σε `tkz-euclide` labels.
- Χρειάζεται σαφής διάκριση ανάμεσα σε προσωρινή μέτρηση UI και εντολή που γράφεται στο source.

## 9. Sliders και παράμετροι

- Υποστήριξη παραμέτρων για δυναμικά σχήματα.
- Ο χρήστης μπορεί να αλλάζει τιμές από slider και να βλέπει live update.
- Μελλοντικά μπορεί να συνδέεται με macros ή αριθμητικές εντολές του `tkz-euclide`.

## 10. Construction history

- Timeline με τα βήματα κατασκευής.
- Δυνατότητα επιλογής βήματος και highlight στο canvas.
- Μελλοντική δυνατότητα προσωρινής απόκρυψης επόμενων βημάτων για παρουσίαση ή debugging.

## Προτεινόμενη σειρά υλοποίησης

1. Κοινό selection model για canvas, Object Tree και Properties Panel.
2. Hover/highlight από canvas προς Object Tree.
3. Γενικό hit-testing layer για όλα τα βασικά shapes.
4. Dragging με σαφή διάκριση ελεύθερων και παραγόμενων σημείων.
5. Construction previews για τα πιο συχνά εργαλεία.
6. Smart snapping σε σημεία και grid.
7. Snap σε σχήματα και υπολογιζόμενες τομές.
8. Καλύτερο grid/axes UI.
9. Inline measurements.
10. Construction history.

## Κατάσταση υλοποίησης

- Ολοκληρώθηκε: κοινό selection για σημεία και τμήματα από το canvas.
- Ολοκληρώθηκε: hover sync από canvas προς το κοινό `hoveredNode`.
- Ολοκληρώθηκε: γενικό SVG hit-testing layer για segments, segment collections, lines, line collections, polyseg, polygons, circles, circle collections, semicircles και basic arcs.
- Ολοκληρώθηκε: σαφής διάκριση free/generated point handles στο cursor mode. Τα free points συνεχίζουν να κάνουν drag, ενώ τα generated points επιλέγουν το construction node τους χωρίς να ξεκινούν drag ή προσωρινή επιλογή σημείων.
- Ολοκληρώθηκε: construction preview layer για pending segment, line, circle, semicircle, arc, polygon και polyseg εργαλεία. Το preview ακολουθεί το ίδιο snap/rounding με το click-to-create και καθαρίζει όταν ο cursor βγει από το canvas.
- Ολοκληρώθηκε: smart snapping σε υπάρχοντα σημεία για construction previews, click-to-create και drag ελεύθερων σημείων. Το `Alt` εξακολουθεί να απενεργοποιεί προσωρινά το snapping.
- Ολοκληρώθηκε: snapping πάνω σε segment/line/polyline/polygon/circle geometry και σε υπολογιζόμενες τομές line-line, line-circle και circle-circle. Η προτεραιότητα είναι existing point, computed intersection, shape projection και μετά grid.
- Ολοκληρώθηκε: ξεχωριστό axes toggle, theme-aware grid/axis colors, major/minor grid lines, ticks και αριθμητικά axis labels. Τα πάχη, τα ticks και τα labels διατηρούν σταθερό screen-space μέγεθος σε κάθε zoom, η πυκνότητα των τιμών προσαρμόζεται αυτόματα με βήματα 1–2–5 και τα Settings παρέχουν ανεξάρτητη εμφάνιση, πάχος, μέγεθος και ελάχιστη απόσταση labels.
- Βελτιστοποιήθηκε: το grid/axes layer κάνει viewport culling και adaptive density, ενώ τα wheel events συγχωνεύονται ανά animation frame και ενημερώνουν `pan`/`zoom` ατομικά.
- Ολοκληρώθηκε: inline measurements overlay με ξεχωριστό Measure toggle. Δείχνει coordinates για selected/hovered points, μήκη για segments/lines, ακτίνες για circles/semicircles και perimeter/length για polygons/polyseg χωρίς να γράφει εντολές στο source.
- Ολοκληρώθηκε: construction history timeline στο inspector. Δείχνει τα parsed commands σε σειρά κατασκευής, συγχρονίζει hover/selection με το canvas, το Object Tree και το Properties Panel.
