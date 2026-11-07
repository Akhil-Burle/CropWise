# Dataset shortlist for the CNN and ViT study

Research date: 2026-11-07. This records the initial source shortlist; its counts are publisher-reported.
Acquisition and preparation now use the expanded [combination plan](FRUIT_VEGETABLE_DATASETS.md),
with actual local admission counts recorded separately from this research note. Source selection
does not establish model performance.

## Recommended starting plan

Start with PlantVillage RGB tomato/potato classes to establish both pipelines. Add an audited chilli
source and evaluate separate external images on overlapping labels. Preserve dataset provenance in
every manifest; report crop/source results separately to expose background and source shortcuts.

| Source | Intended role | Key qualification |
| --- | --- | --- |
| [PlantVillage author repository](https://github.com/spMohanty/PlantVillage-Dataset) | Initial tomato/potato benchmark | About 54k images overall; controlled backgrounds. Use RGB only and preserve leaf grouping. |
| [Krishna River Basin chilli v3](https://data.mendeley.com/datasets/ymt8k9bjkn/3) | First regional chilli candidate | Reports 1,856 originals plus augmented derivatives; includes Karnataka/AP capture locations. Audit originals and labels before selection. |
| [Bangladesh smartphone chilli v3](https://data.mendeley.com/datasets/wzc6r6w5w5/3) | Candidate covering current chilli labels | Reports 1,515 images with healthy, leaf curl, anthracnose and Cercospora labels. Expert review is needed before mapping symptoms to exact diseases. |
| [PlantDoc author repository](https://github.com/pratikkayal/PlantDoc-Dataset) | External non-lab evaluation | Classification repository is Cropped-PlantDoc; paper reports 2,598 data points. Audit actual crops/counts and overlapping classes. |
| [PlantWild author page](https://tqwei05.github.io/PlantWild/) | Optional broader field benchmark | v2 reports 115 classes; less focused initial scope. Publisher lists BY-NC-ND 4.0. |
| [Larger Bangladesh chilli v1](https://data.mendeley.com/datasets/tm3v4zmh7c/1) | Alternative chilli training source | Reports 8,814 images across six labels. Count alone does not establish label quality or independence. |

## Scope and audit decisions

- PlantVillage has ten tomato and three potato classes in the author's label map. Its bell-pepper
  classes must not be silently relabeled as chilli. Source: [author dataset card](https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/README_HF.md).
- The existing app's chilli anthracnose label is absent from the regional candidate's listed classes.
  Either obtain appropriate data or explicitly revise supported labels; do not invent a mapping.
- Audit image corruption, exact/perceptual duplicates, original/augmented lineage, class counts and
  plant/session grouping. Split originals/groups first, then augment training images only.
- Use identical manifests for CNN and ViT. Keep external evaluation images out of training/tuning,
  deduplicate across sources, and report unsupported external labels separately.
- For PlantVillage, prefer retaining the author's grouped test split and derive validation from its
  training partition with grouping preserved. This is a justified alternative to the generic 70/15/15
  target in the experiment specification; freeze actual manifest IDs before training.
- Publisher license labels: PlantVillage author card lists BY-SA 3.0; PlantDoc and the three Mendeley
  chilli entries list BY 4.0. Retain the actual downloaded release's terms and citations. The smaller
  Bangladesh entry also mentions non-commercial use in prose, so clarify that inconsistency before redistribution.

No combined image count or final number of classes is claimed before archive inspection. These leaf
datasets do not supply soil-card OCR training examples or validated pesticide treatment rules.
