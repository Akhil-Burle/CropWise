# CropWise dataset preparation report

Release: `d053c9012200c857`. Status: **prepared for CNN and ViT experiments; no models trained**.

- Downloaded **13 selected sources**, totaling **8,473,512,370 archive bytes**.
- Each downloaded archive passed its publisher-provided SHA-256 check. Source metadata, versions, licenses and receipts remain under `ml/data/raw/`.
- Extracted **88,275 candidate image files** after archive-level exclusions. These include files subsequently held from training; this is not a count of independent leaves.
- Admitted **65,978 images**, **105 crop/condition classes** and **25 crop categories**.
- Removed **275 exact decoded-pixel duplicates** from mapped candidates; kept their provenance in the duplicate report.
- Held/excluded **22,022 image records** for the reasons below. Originals remain available for review.

## Shared partitions

| Partition | Images |
| --- | ---: |
| train | 45,279 |
| validation | 9,083 |
| test | 11,616 |

Both models must use this exact release, the same image IDs and `class_to_idx.json`. Known PlantVillage test membership takes precedence over nominal split ratios. Related leaf/capture/perceptual groups stay in one partition.

## Crop coverage

| Crop category | Images | Classes |
| --- | ---: | ---: |
| apple | 3,164 | 4 |
| banana | 897 | 4 |
| bell_pepper | 2,475 | 2 |
| bitter_gourd | 3,274 | 5 |
| bottle_gourd | 1,278 | 3 |
| cauliflower | 1,598 | 3 |
| cherry | 1,906 | 2 |
| chilli | 1,842 | 6 |
| cucumber | 1,541 | 3 |
| eggplant | 3,192 | 6 |
| grape | 4,062 | 4 |
| guava | 2,495 | 5 |
| lemon | 3,123 | 13 |
| malabar_spinach | 2,988 | 5 |
| okra | 1,334 | 4 |
| papaya | 1,633 | 5 |
| peach | 2,657 | 2 |
| potato | 2,152 | 3 |
| pumpkin | 1,045 | 2 |
| ridge_gourd | 1,053 | 2 |
| snake_gourd | 87 | 2 |
| strawberry | 1,565 | 2 |
| tomato | 19,435 | 11 |
| watermelon | 1,000 | 3 |
| yardlong_bean | 182 | 4 |

Every retained crop has examples labeled healthy and affected after filtering. This does not establish coverage of every disease for that crop.

## Source admission

| Source | Extracted candidates | Admitted images |
| --- | ---: | ---: |
| banana_lsd_v1 | 937 | 897 |
| citrus_v2 | 759 | 0 |
| gourds_okra_v2 | 4,568 | 4,563 |
| guava_v1 | 3,500 | 2,495 |
| krishna_chilli_v3 | 1,856 | 1,842 |
| lemon_v6 | 6,641 | 3,123 |
| malabar_spinach | 3,006 | 2,988 |
| mango_leaf_bd_v1 | 4,000 | 0 |
| papaya_leaf_v2 | 2,159 | 1,633 |
| plantvillage | 45,363 | 36,127 |
| vegetables_bd_v3 | 12,786 | 10,332 |
| vegetables_seven_v1 | 1,545 | 978 |
| watermelon_v1 | 1,155 | 1,000 |

## Exclusions and decisions

- MangoLeafBD: held because parent-image lineage for zoomed/rotated derivatives is unresolved.
- Generic citrus source: held to avoid overlapping genus-level and lemon-specific host labels without species metadata.
- Guava scab/healthy-fruit folders and watermelon anthracnose fruit images: excluded from the leaf task. Five deterministic samples per mixed-source class were inspected for organ type; this was not disease-label validation.
- Lemon annotation renderings: excluded; only raw images were admitted.
- Blueberry, raspberry, orange and squash from the selected sources: held where healthy/affected coverage is incomplete.
- Publisher augmentation folders, PlantVillage grayscale/segmented variants, corn/soybean, and out-of-scope pulse/oilseed folders were excluded. Ambiguous labels and inadequate class/group counts were held.
- VegHealth14 was not added because it recompiles other sources with reported duplicates/conflicts. The separate cucumber source overlaps existing coverage and mixes organs; onion needs identifier/metadata resolution; pear needs further symptom/imbalance review. PlantDoc and PlantWild remain candidates for a separate external benchmark.

| Quarantine/exclusion reason | Records |
| --- | ---: |
| crop_requires_healthy_and_affected_examples | 9,202 |
| hold_derivative_lineage_unresolved | 4,000 |
| annotation_rendering_excluded_use_raw_images_only | 3,210 |
| visual_similarity_label_conflict | 3,139 |
| fruit_or_unknown_organ_excluded | 1,155 |
| unspecified_citrus_host_requires_taxonomy_review | 759 |
| outside_selected_vegetable_scope_or_unknown_crop | 357 |
| unknown_folder_requires_review | 144 |
| insufficient_independent_examples | 56 |

## Integrity and limitations

- Preparation fully decoded admitted inputs, applied EXIF-aware RGB conversion for pixel hashing, and recorded byte/pixel hashes. Original image files remain unchanged.
- Rotation/flip-aware pHash (Hamming radius 2), known leaf IDs and available capture-minute groups were used for conservative grouping. Similarity is not proof of shared leaf identity or a label error; unknown relationships can remain.
- Final validation checked all manifest partitions, file/link presence, class coverage and known test boundaries; byte/decode samples were rechecked. Export additionally checked the SHA-256 of every included source image.
- The standalone exporter and loader passed an end-to-end fixture check. Pipeline regression tests cover duplicates, group leakage, conflicting labels, organ/taxonomy exclusions and archive traversal.
- Labels include diseases, pests, deficiencies and symptoms. Their counts are deficiency: 798, disease: 44,811, healthy: 15,749, pest: 3,428, symptom: 1,192. Publisher labels have not been independently verified by an agronomist; a symptom class does not establish a pathogen.
- Internal holdout performance will not establish accuracy on local farmer field photos. The separate external field test is still pending.
- No CNN/ViT accuracy, F1 or inference results have been produced. Model result CSVs remain empty templates.

## Training artifacts

- Standalone bundle: `ml/data/processed/cropwise-d053c9012200c857.tar.gz` (5,517,452,986 bytes). Contains actual image bytes, portable CSV paths, shared class IDs, source metadata and a PIL loader.
- Bundle SHA-256: `9d5d535aa6482c7c3522dc7bc77f0ea885429244da261a959fa75ace73d7a106`.
- Local release: `ml/data/processed/releases/d053c9012200c857/`.
- Frozen paths and manifest hashes: `ml/configs/prepared_dataset.json`.
- Data and export commands: `ml/data/README.md`. Downloaded images/archives are intentionally ignored by Git.
- Source-specific license terms remain separate; no unified redistribution license is asserted.
