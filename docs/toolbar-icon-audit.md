# Toolbar icon audit

Ημερομηνία: 14 Ιουλίου 2026

## Στόχος

Να αξιολογηθεί αν τα σημερινά Lucide icons της toolbar περιγράφουν καθαρά τη γεωμετρική λειτουργία κάθε εργαλείου και να οριστεί προτεραιότητα για custom icon set με ενιαίο στυλ.

## Συμπέρασμα

Η toolbar χρειάζεται custom geometry icon system για τα περισσότερα εξειδικευμένα tkz-euclide tools. Τα γενικά app icons και κάποια απλά σχήματα μπορούν να παραμείνουν Lucide, αλλά τα εργαλεία γεωμετρικών κατασκευών, μετασχηματισμών, τομών, μετρήσεων και labels συχνά χρησιμοποιούν generic σύμβολα που δεν εξηγούν τη λειτουργία.

Προτεινόμενη προσέγγιση: υβριδική.

- Lucide για γενικές ενέργειες εφαρμογής και απλά, αναγνωρίσιμα σχήματα.
- Custom SVG icons για όλα τα geometry-specific toolbar tools.
- Ενιαίο visual language: `24x24` viewBox, stroke-based, δύο ή τρία σημεία-κόμβοι, λεπτές helper/dashed γραμμές, ένα accent ανά tool family.

## Προτεραιότητες

### A — Να αντικατασταθούν πρώτα

Αυτά είναι τα εργαλεία όπου το τωρινό icon είναι παραπλανητικό, υπερβολικά γενικό ή χρησιμοποιείται ξανά για πολλά διαφορετικά νοήματα.

| Tool | Current icon | Πρόβλημα | Custom concept |
| --- | --- | --- | --- |
| `add_point_transformation` | `RefreshCw` | Δείχνει refresh, όχι γεωμετρικό image point. | Σημείο A, βέλος μετασχηματισμού, σημείο A'. |
| `add_points_transformation` | `CopyPlus` | Μοιάζει με duplicate UI action. | Δύο/τρία σημεία με κοινό βέλος προς images. |
| `add_circle_transformation` | `CircleDot` | Δεν δείχνει μετασχηματισμό κύκλου. | Κύκλος C με βέλος προς κύκλο C'. |
| `show_transformation` | `RefreshCw` | Ίδιο με transform point, δεν δείχνει construction trace. | Original/image points με dashed construction traces. |
| `get_vector_coordinates` | `Braces` | Πολύ γενικό macro icon. | Διάνυσμα AB με μικρό `(x,y)`. |
| `add_radical_axis` | `CircleDot` | Δεν δείχνει δύο κύκλους ή radical axis. | Δύο τεμνόμενοι/μη τεμνόμενοι κύκλοι και κάθετη radical line. |
| `add_line_circle_intersection` | `Crosshair` | Δεν δείχνει line-circle relation. | Γραμμή που τέμνει κύκλο με δύο highlighted points. |
| `add_circle_circle_intersection` | `CircleDot` | Δεν δείχνει δύο κύκλους. | Δύο κύκλοι με δύο highlighted intersections. |
| `test_line_circle_intersection` | `CircleDot` | Μοιάζει με circle construction. | Line-circle με check/question mark badge. |
| `test_circle_circle_intersection` | `FlaskConical` | Test icon είναι χημικό, όχι geometry. | Δύο κύκλοι με small boolean/check badge. |
| `is_linear` | `FlaskConical` | Δεν δείχνει collinearity. | Τρία σημεία πάνω σε ίδια γραμμή με check. |
| `is_ortho` | `FlaskConical` | Δεν δείχνει ορθογωνιότητα. | Δύο κάθετες γραμμές με right-angle marker/check. |
| `add_projection` | `MoveDown` | Δείχνει απλό down move. | Σημείο P, βάση AB, κάθετη dashed προς foot H. |
| `add_perpendicular` | `BetweenHorizontalStart` | Δεν είναι προφανές ότι είναι line through point. | Γραμμή AB και κάθετη από σημείο P. |
| `add_perpendicular_bisector` | `BetweenVerticalEnd` | Generic alignment icon. | Segment AB, midpoint, perpendicular bisector. |
| `add_angle_bisector` | `GitFork` | Μοιάζει με git branch. | Γωνία με εσωτερική διχοτόμο. |
| `show_line_construction` | `Construction` | Πολύ γενικό εργοτάξιο/construction. | Base line με compass/dashed construction arcs. |
| `add_duplicate_segment` | `CopyPlus` | Μοιάζει με duplicate object, όχι copy length onto ray. | Segment AB και ray CD με ίσο copied length. |
| `add_protractor` | `Ruler` | Ruler αντί για μοιρογνωμόνιο. | Ημικύκλιο protractor με ray. |
| `add_defined_line` | `Ruler` | Δεν διακρίνει mediator/parallel/tangent etc. | Abstract line definition: base points + constructed line. |
| `add_defined_circle` | `CircleDot` | Δεν διακρίνει defined circle families. | Triangle/circle relation or circle with construction points. |
| `add_projected_excenters` | `ScanLine` | Δεν δείχνει τρίγωνο/excenters/projections. | Triangle with excenter dots and projection feet. |
| `add_all_altitudes` | `Asterisk` | Αφηρημένο και παραπλανητικό. | Triangle with three dashed altitudes and orthocenter. |
| `add_triangle_center` | `LocateFixed` | Generic target, όχι triangle center. | Triangle with highlighted center point. |
| `add_associated_triangle` | `Network` | Generic graph, όχι related triangle. | Outer triangle and smaller/related inner triangle. |
| `add_permute` | `Repeat2` | Generic swap/repeat, όχι triangle permutation. | Triangle ABC with B/C swap arrows. |
| `calc_length` | `Ruler` | Αποδεκτό αλλά όχι tkzCalcLength/macro result. | Segment AB with dimension bracket and `d`. |
| `dot_product` | `Divide` | Λάθος μαθηματικό σύμβολο. | Two vectors from A with dot operator. |
| `power_circle` | `CircleDot` | Δεν δείχνει point power. | Point P outside circle with secant/tangent relation. |
| `pt_to_cm` | `Braces` | Macro-only, όχι unit conversion. | `pt → cm` mini conversion mark. |
| `cm_to_pt` | `Braces` | Macro-only, όχι unit conversion. | `cm → pt` mini conversion mark. |
| `get_point_coordinates` | `Braces` | Δεν δείχνει point coordinate extraction. | Point P with `(x,y)` callout. |
| `swap_points` | `Repeat2` | Generic repeat. | Two labeled points A/B with crossing arrows. |

### B — Να αντικατασταθούν στη δεύτερη φάση

Αυτά δουλεύουν ως γενική ιδέα, αλλά δεν ξεχωρίζουν καλά μεταξύ συγγενικών εργαλείων ή δεν δείχνουν το ακριβές input pattern.

| Tool | Current icon | Πρόβλημα | Custom concept |
| --- | --- | --- | --- |
| `add_midpoint` | `BetweenHorizontalEnd` | Alignment icon αντί για midpoint geometry. | Segment AB με κεντρικό point M. |
| `add_golden_ratio` | `Sparkles` | Δείχνει “special”, όχι division by φ. | Segment AB με point P και μικρό φ. |
| `add_barycentric` | `Scale` | Κοντά σαν έννοια, όχι point weights. | Triangle/points with weighted center. |
| `add_harmonic` | `Divide` | Πολύ γενικό. | Line with four collinear harmonic points. |
| `add_equi_points` | `MoveHorizontal` | Δεν δείχνει δύο equidistant points. | Reference point and symmetric/equidistant pair. |
| `add_mid_arc` | `CircleDashed` | Δεν ξεχωρίζει από arc/semicircle. | Arc with midpoint highlighted. |
| `add_point_on_line` | `Slash` | Μοιάζει με generic line. | Line with constrained point P(t). |
| `add_point_on_circle` | `Circle` | Δεν δείχνει constrained point/angle. | Circle with highlighted point on circumference. |
| `add_similitude_center` | `Crosshair` | Target icon δεν δείχνει two-circle center. | Two circles and external/internal center point. |
| `add_vector_point` | `MoveUpRight` | Generic arrow, όχι vector construction. | Vector AB copied/combined to point P. |
| `add_segment` | `Slash` | Ίδιο με line, δεν δείχνει endpoints. | Segment with two endpoints. |
| `add_line` | `Slash` | Ίδιο με segment. | Infinite line through two points. |
| `add_segments` | `Network` | Generic network. | Two disjoint segments/pairs. |
| `add_lines` | `Network` | Ίδιο με multiple segments. | Multiple infinite lines through point pairs. |
| `add_polyseg` | `MoveUpRight` | Δεν δείχνει chain. | Open polyline A-B-C-D. |
| `add_semicircle` | `CircleDashed` | Ίδιο με arc/ellipse. | Half circle with diameter/radius points. |
| `add_semicircles` | `Network` | Generic. | Two small semicircles. |
| `add_ellipse` | `CircleDashed` | Ίδιο με arc/semicircle. | Ellipse with center and axes. |
| `add_arc` | `CircleDashed` | Καλό περίπου, αλλά same as other curves. | Arc with center/start/end direction points. |
| `add_sector` | `CircleDot` | Δεν δείχνει filled wedge/sector. | Wedge sector from center. |
| `fill_sector` | `Palette` | Generic fill, όχι sector. | Filled wedge sector. |
| `fill_angle` | `CornerUpRight` | Δεν δείχνει filled angle. | Angle wedge filled. |
| `fill_angles` | `Network` | Generic. | Two/three small filled angle wedges. |
| `mark_right_angle` | `Asterisk` | Λάθος, δεν δείχνει right-angle mark. | Right-angle square marker. |
| `mark_right_angles` | `BetweenVerticalEnd` | Generic alignment. | Multiple right-angle square markers. |
| `pic_angle` | `Compass` | Δεν δείχνει TikZ angle pic. | Angle arc with label/radius. |
| `label_point` | `Braces` | Macro-like, όχι label position. | Point with text tag. |
| `label_points` | `CopyPlus` | Copy icon, όχι multi-label. | Several points with tiny tags. |
| `auto_label_points` | `LocateFixed` | Δεν δείχνει radial labeling. | Center point with radial labels around it. |
| `label_segment` | `Minus` | Segment icon but no label. | Segment with label above/below. |
| `label_segments` | `Layers3` | Generic layers. | Multiple segments with shared label marks. |
| `label_line` | `Ruler` | Ruler, not line label. | Infinite line with label. |
| `label_angle` | `CornerUpRight` | Angle shape only, no label. | Angle arc with text tag. |
| `label_angles` | `Layers3` | Generic. | Multiple angle arcs with tags. |
| `label_circle` | `CircleDot` | Circle only. | Circle with label on circumference/path. |
| `label_arc` | `CircleDashed` | Arc only. | Arc with label on arc path. |
| `find_angle` | `RotateCcw` | Suggests rotate action. | Directed angle arc with arrow and value. |
| `find_slope_angle` | `Ruler` | Does not show slope/horizontal reference. | Line with horizontal axis and theta. |
| `get_angle` | `Braces` | Macro-only. | Angle result with macro callout. |

### C — Μπορούν να μείνουν προσωρινά ή ως fallback

Αυτά είναι αρκετά κατανοητά ή απλά, αν και μπορούν αργότερα να ενοποιηθούν για πιο branded geometry look.

| Tool | Current icon | Εκτίμηση |
| --- | --- | --- |
| `add_point` | `MapPin` | Αποδεκτό, αλλά ένα καθαρό dot θα ήταν πιο γεωμετρικό. |
| `add_point_polar` | `Compass` | Κοντά στην ιδέα polar/angle-distance. |
| `add_random_point` | `Dice5` | Κατανοητό για random. |
| `add_circle` | `Circle` | Καθαρό. |
| `add_circles` | `CircleDot` | Προσωρινά αποδεκτό, αλλά θα ήταν καλύτερο multi-circle. |
| `add_polygon` | `Hexagon` | Καθαρό γενικό polygon. |
| `add_square` | `Square` | Καθαρό. |
| `add_rectangle` | `RectangleHorizontal` | Καθαρό. |
| `add_regular_polygon` | `Pentagon` | Καθαρό γενικό regular polygon. |
| `add_defined_triangle` | `Triangle` | Καθαρό ως γενική οικογένεια triangle. |
| `add_altitude` | `TriangleRight` | Μέτριο αλλά σχετικό με triangle/right geometry. |
| `fill_circle` | `CircleDot` | Αποδεκτό προσωρινά, μελλοντικά χρειάζεται filled disk. |
| `fill_polygon` | `Hexagon` | Αποδεκτό προσωρινά, μελλοντικά filled polygon. |
| `mark_segment` | `Minus` | Αποδεκτό ως base segment, αλλά custom equality mark θα ήταν καλύτερο. |
| `mark_arc` | `CircleDashed` | Αποδεκτό προσωρινά. |
| `add_angle` | `CornerUpRight` | Κατανοητό ως angle. |
| `mark_angles` | `Layers3` | Μέτριο, αλλά όχι κρίσιμο για πρώτο set. |
| `show_bounding_box` | `Square` | Αποδεκτό. |
| `canvas_init` | `Ruler` | Αποδεκτό προσωρινά. |
| `canvas_clip` | `ScanLine` | Μέτριο αλλά λειτουργικό. |
| `clip_bounding_box` | `Crosshair` | Μέτριο αλλά λειτουργικό. |

## Διπλές/ασαφείς χρήσεις σημερινών icons

Τα πιο προβληματικά icons είναι αυτά που εμφανίζονται σε πολλά διαφορετικά εργαλεία:

- `CircleDot`: circle transform, multiple circles, sector, defined circle, circle-circle intersection, radical axis, fill circle, label circle, power circle.
- `Braces`: vector coordinates, labels/macros, angle result, unit conversions, point coordinates.
- `Network`: multiple segments, multiple lines, semicircles, compasses, associated triangle, fill angles.
- `Ruler`: defined line, protractor, slope angle, calculate length, canvas init.
- `RefreshCw`: point transformation και show transformation.
- `FlaskConical`: όλα τα boolean tests, χωρίς γεωμετρική πληροφορία.

Αυτές οι επαναχρήσεις κάνουν το menu πιο δύσκολο στο scan, γιατί ο χρήστης δεν μπορεί να μαντέψει το εργαλείο από το εικονίδιο.

## Πρόταση πρώτου custom icon batch

Πρώτο batch 24 icons, με μεγάλο κέρδος καθαρότητας:

1. `add_segment`
2. `add_line`
3. `add_midpoint`
4. `add_projection`
5. `add_perpendicular`
6. `add_perpendicular_bisector`
7. `add_angle_bisector`
8. `add_line_circle_intersection`
9. `add_circle_circle_intersection`
10. `add_radical_axis`
11. `add_point_transformation`
12. `add_points_transformation`
13. `add_circle_transformation`
14. `show_transformation`
15. `add_duplicate_segment`
16. `add_protractor`
17. `add_all_altitudes`
18. `add_triangle_center`
19. `add_projected_excenters`
20. `is_linear`
21. `is_ortho`
22. `dot_product`
23. `power_circle`
24. `get_point_coordinates`

Αυτό το batch καλύπτει τα σημεία όπου η τρέχουσα icon library μπερδεύει περισσότερο.

Status: το πρώτο batch δημιουργήθηκε ως React/SVG icon module στον φάκελο `src/icons/geometry` και συνδέθηκε στην toolbar μέσω registry lookup με fallback στα υπάρχοντα Lucide icons.

## Δεύτερο custom icon batch

Δεύτερο batch 12 icons, για να κλείσουν τα υπόλοιπα A-priority εργαλεία που είχαν πολύ γενικά ή επαναχρησιμοποιημένα icons:

1. `get_vector_coordinates`
2. `test_line_circle_intersection`
3. `test_circle_circle_intersection`
4. `show_line_construction`
5. `add_defined_line`
6. `add_defined_circle`
7. `add_associated_triangle`
8. `add_permute`
9. `calc_length`
10. `pt_to_cm`
11. `cm_to_pt`
12. `swap_points`

Status: το δεύτερο batch προστέθηκε στο ίδιο React/SVG icon module και δηλώθηκε στο `geometryToolIcons` registry.

## Τρίτο custom icon batch

Τρίτο batch 9 icons, για να αποκτήσουν ενιαία γλώσσα τα περισσότερα point/vector construction εργαλεία της δεύτερης φάσης:

1. `add_golden_ratio`
2. `add_barycentric`
3. `add_harmonic`
4. `add_equi_points`
5. `add_mid_arc`
6. `add_point_on_line`
7. `add_point_on_circle`
8. `add_similitude_center`
9. `add_vector_point`

Status: το τρίτο batch προστέθηκε στο `src/icons/geometry/icons.tsx` και δηλώθηκε στο `geometryToolIcons` registry.

## Τέταρτο custom icon batch

Τέταρτο batch 8 icons, για να ξεχωρίζουν καθαρά τα line/curve εργαλεία που πριν μοιράζονταν generic icons:

1. `add_segments`
2. `add_lines`
3. `add_polyseg`
4. `add_semicircle`
5. `add_semicircles`
6. `add_ellipse`
7. `add_arc`
8. `add_sector`

Status: το τέταρτο batch προστέθηκε στο `src/icons/geometry/icons.tsx` και δηλώθηκε στο `geometryToolIcons` registry.

## Πέμπτο custom icon batch

Πέμπτο batch 6 icons, για να ξεχωρίζουν τα fill/angle mark εργαλεία που πριν έδειχναν γενικά UI ή abstract σύμβολα:

1. `fill_sector`
2. `fill_angle`
3. `fill_angles`
4. `mark_right_angle`
5. `mark_right_angles`
6. `pic_angle`

Status: το πέμπτο batch προστέθηκε στο `src/icons/geometry/icons.tsx` και δηλώθηκε στο `geometryToolIcons` registry.

## Έκτο custom icon batch

Έκτο batch 10 icons, για να ξεχωρίζουν καθαρά τα εργαλεία labels ανά είδος αντικειμένου:

1. `label_point`
2. `label_points`
3. `auto_label_points`
4. `label_segment`
5. `label_segments`
6. `label_line`
7. `label_angle`
8. `label_angles`
9. `label_circle`
10. `label_arc`

Status: το έκτο batch προστέθηκε στο `src/icons/geometry/icons.tsx` και δηλώθηκε στο `geometryToolIcons` registry.

## Έβδομο custom icon batch

Έβδομο batch 3 icons, για να ξεχωρίζουν τα εργαλεία μέτρησης γωνιών από generic rotate/ruler/macro icons:

1. `find_angle`
2. `find_slope_angle`
3. `get_angle`

Status: το έβδομο batch προστέθηκε στο `src/icons/geometry/icons.tsx` και δηλώθηκε στο `geometryToolIcons` registry.

Με αυτό το batch έχουν καλυφθεί όλα τα A-priority και B-priority εργαλεία του audit. Το υπόλοιπο ανήκει πλέον στο C/fallback κύμα, δηλαδή εργαλεία που ήταν ήδη σχετικά κατανοητά αλλά μπορούν να γίνουν πιο συνεπή με το Stoicheia icon language.

## Όγδοο custom icon batch

Όγδοο batch 13 icons, πρώτο C/fallback κύμα για να αποκτήσουν ενιαίο Stoicheia geometry look τα βασικά primitives και polygon/triangle constructions:

1. `add_point`
2. `add_point_polar`
3. `add_random_point`
4. `add_circle`
5. `add_circles`
6. `add_polygon`
7. `add_square`
8. `add_rectangle`
9. `add_parallelogram`
10. `add_golden_rectangle`
11. `add_regular_polygon`
12. `add_defined_triangle`
13. `add_altitude`

Status: το όγδοο batch προστέθηκε στο `src/icons/geometry/icons.tsx` και δηλώθηκε στο `geometryToolIcons` registry.

## Ένατο custom icon batch

Ένατο και τελικό batch 15 icons, για να καλυφθούν όλα τα υπόλοιπα fallback εργαλεία και να έχει κάθε toolbar tool custom Stoicheia geometry icon:

1. `add_compass`
2. `add_compasses`
3. `add_intersection`
4. `fill_circle`
5. `fill_polygon`
6. `mark_segment`
7. `mark_segments`
8. `mark_arc`
9. `add_angle`
10. `mark_angles`
11. `pic_right_angle`
12. `canvas_init`
13. `canvas_clip`
14. `show_bounding_box`
15. `clip_bounding_box`

Status: το ένατο batch προστέθηκε στο `src/icons/geometry/icons.tsx` και δηλώθηκε στο `geometryToolIcons` registry. Πλέον όλα τα εργαλεία της toolbar έχουν custom geometry icon και υπάρχει test που το ελέγχει.

## Προτεινόμενη τεχνική δομή

```text
src/icons/geometry/
  GeometryIcon.tsx
  GeometryIconPreview.tsx
  primitives.tsx
  icons.tsx
  registry.tsx
```

- `GeometryIcon.tsx`: κοινό wrapper για `size`, `className`, `title`, `strokeWidth`.
- `GeometryIconPreview.tsx`: dev/preview sheet με light, dark και accent samples για κάθε registered icon.
- `primitives.tsx`: reusable point, segment, line, circle, arc, arrow, right-angle mark.
- `icons.tsx`: συγκεκριμένα custom icons.
- `registry.tsx`: mapping `ToolType -> icon`.

Το `Toolbar.tsx` πλέον περνά από registry lookup για όσα geometry icons υπάρχουν, ώστε αργότερα να αλλάζουμε ή να προσθέτουμε icons χωρίς να ανοίγουμε το μεγάλο toolbar config.

## Acceptance criteria

- Όλα τα custom icons να φαίνονται καθαρά σε `18px`.
- Να δουλεύουν σε light/dark theme με `currentColor` και περιορισμένα accent classes.
- Κάθε icon να αναγνωρίζεται χωρίς να διαβάσεις το label, ειδικά σε active toolbar button.
- Να μην αυξηθεί αισθητά το bundle: SVG components μικρά, χωρίς external assets.
- Να υπάρχει icon preview grid/dev sheet ή Story-like component πριν αντικατασταθούν μαζικά.
