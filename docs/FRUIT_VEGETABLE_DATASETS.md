# Expanded fruit and vegetable dataset plan

Research date: 2026-11-07. This records the initial source-documentation findings. Actual download and
preparation results are tracked separately in the dataset preparation report and versioned local releases.
The goal is broad fruit/vegetable coverage through a curated collection; no source establishes support
for every crop or disease. No combined image/class count or trained capability is claimed.

The machine-readable shortlist is [dataset_catalog.csv](../ml/data/dataset_catalog.csv). Every row
has a source, crop candidates, status, publisher counts and audit notes. All sources are candidates,
not approved training inputs. The earlier [selection note](DATASET_SELECTION.md) remains the initial
three-crop plan; this document expands the research scope.

## Recommended expansion

1. PlantVillage RGB plus original Krishna River Basin chilli images provide the starting collection.
   Expand PlantVillage beyond tomato/potato to its fruit and vegetable hosts, retaining limitations:
   blueberry and raspberry are healthy-only; orange and squash have no healthy class in its label map.
   Exclude corn and soybean if the experiment is scoped to fruit and vegetables.
2. Audit the six-vegetable Bangladesh source and the four-crop gourds/okra source. They add brinjal,
   cauliflower, cucumber, bottle gourd, bitter gourd, okra, pumpkin and ridge gourd. Generic freshness
   or disease labels may support screening but cannot be mapped to named diseases without evidence.
3. Add MangoLeafBD, BananaLSD and BDPapayaLeaf after original/derivative grouping and class review.
4. Add leaf-only subsets of citrus/lemon, guava and pear sources. Keep fruit, leaf, stem and whole-plant
   inputs distinguishable. Pest, deficiency, symptom and pathogen labels also remain distinguishable.
5. Audit onion, watermelon and Malabar spinach candidates and the seven-crop Bangladesh collection.
   Malabar spinach must not be relabeled as common spinach. Keep unknown cultivar/species explicit.
6. Use VegHealth14 as a discovery aid until its original sources and overlap are traced. Its publisher
   reports duplicates and images appearing under multiple labels. Adding it alongside its source data
   would inflate counts and risk leakage. Do not combine its 224/512 resolution versions as new samples.
7. Keep a deduplicated external test subset separate from training and tuning, using compatible labels.
   Supplement with local field images as available. Report crop/source results and unsupported labels.

## Proposed combined record format

Each image needs: image_id, dataset_id, source_version, source_path, source_label, crop_id,
scientific_name_if_known, organ, condition_type, canonical_condition_id, plant_group_id,
derivative_parent_id, sha256, perceptual_hash, license_reference, annotation_review_status and split.
Unknown fields stay unknown. Different crop species and different organs must not be silently merged.
Use labels such as apple__leaf__scab, potato__leaf__late_blight and chilli__leaf__healthy.
The exact label vocabulary is a proposal pending archive review, not a finalized class map.

Store images under ml/data/raw/<dataset_id>/ and keep provenance/license snapshots with the local
source. Define raw-source registries before generating shared immutable manifests. Keep original
files unchanged. Source-level licenses remain separate; this is not a claim that every image can be
redistributed under one common license.

## Admission checks before training

- Verify download access, archive integrity, actual counts, labels, crop identities and organ types.
- Preserve release URLs, attribution, license text and source fingerprints. MangoLeafBD lists BY-NC
  3.0; most listed Mendeley sources list BY 4.0; PlantVillage's author card lists BY-SA 3.0.
- Remove corrupt and exact duplicate images and inspect near-duplicates across datasets. Resolve
  conflicting labels. Keep all derived images with their parent across splitting.
- Split by plant/session/farm where possible. Existing grouped benchmark test splits take priority
  over a generic ratio. Prevent train/test overlap even when an image comes from different websites.
- Freeze identical manifests for CNN and ViT. Create augmentation only from training images.
- Measure class imbalance, evaluate per crop and per class, and document whether background or
  dataset identity offers shortcuts. A healthy-only host is not a validated disease detector.
- Expand the app's crop/disease/advisory catalog only after dataset labels and model outputs are
  mapped and corresponding advisory content is reviewed. The current UI still has three mock crops.

## Remaining gaps

This pass does not establish adequate named-disease data for every vegetable or fruit. Carrot,
beetroot, peas, garlic, broccoli, common spinach, pineapple, sapota and others remain unresolved.
Leaf photographs cannot automatically support root/bulb disease or fruit-rot diagnosis. Candidate
sources with symptom-only labels cannot establish a precise pathogen or pesticide recommendation.

## Primary sources

The catalog contains versioned dataset links. Additional supporting publisher documentation:

- [PlantVillage label map and leaf grouping](https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/README_HF.md)
- [MangoLeafBD source paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC9932726/)
- [COLD onion/chilli source paper](https://doi.org/10.1016/j.dib.2024.110524)
- [WM-DATASET source paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC10904151/)
- [IDDMSLD source paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC11787447/)
- [TFDS citrus filtering notes](https://www.tensorflow.org/datasets/catalog/citrus_leaves)
- [DiaMOS publisher description](https://zenodo.org/record/5557313/files/Description_DIaMOS_Plant_dataset.pdf)
