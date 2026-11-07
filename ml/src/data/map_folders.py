"""Map inspected source labels conservatively; unknown folders remain excluded for review."""
from __future__ import annotations

import csv
from pathlib import Path
import re

ML = Path(__file__).resolve().parents[2]


def slug(value):
    return re.sub(r'[^a-z0-9]+', '_', value.lower()).strip('_')


CROPS = {
    'apple': 'apple', 'blueberry': 'blueberry', 'cherry_(including_sour)': 'cherry',
    'grape': 'grape', 'orange': 'orange', 'peach': 'peach', 'pepper,_bell': 'bell_pepper',
    'potato': 'potato', 'raspberry': 'raspberry', 'squash': 'squash', 'strawberry': 'strawberry',
    'tomato': 'tomato', 'bitter gourd': 'bitter_gourd', 'bottle gourd': 'bottle_gourd',
    'brinjal': 'eggplant', 'eggplant': 'eggplant', 'ladies finger': 'okra', 'okra': 'okra',
    'snake gourd': 'snake_gourd', 'yard long bean': 'yardlong_bean', 'cauliflower': 'cauliflower',
    'cucumber': 'cucumber', 'ridge gourd': 'ridge_gourd', 'pumpkin': 'pumpkin',
}

SINGLE_CROP = {'krishna_chilli_v3': 'chilli', 'mango_leaf_bd_v1': 'mango',
               'banana_lsd_v1': 'banana', 'papaya_leaf_v2': 'papaya',
               'lemon_v6': 'lemon', 'malabar_spinach': 'malabar_spinach'}

CONDITIONS = {
    'healthy': ('healthy', 'healthy'), 'healthy leaf': ('healthy', 'healthy'),
    'healty leaf': ('healthy', 'healthy'), 'fresh leaf': ('healthy', 'healthy'),
    'fresh leaves': ('healthy', 'healthy'),
    'bacterial spot': ('bacterial_spot', 'disease'),
    'cercospora leaf spot': ('cercospora_leaf_spot', 'disease'),
    'cerospora leaf spot': ('cercospora_leaf_spot', 'disease'),
    'curl virus': ('leaf_curl_virus_unspecified', 'disease'),
    'nutrition deficiency': ('nutrient_deficiency_unspecified', 'deficiency'),
    'nutritional deficiency': ('nutrient_deficiency_unspecified', 'deficiency'),
    'nutrient deficiency': ('nutrient_deficiency_unspecified', 'deficiency'),
    'deficiency': ('nutrient_deficiency_unspecified', 'deficiency'),
    'white spot': ('white_spot_symptoms', 'symptom'),
    'downy mildew': ('downy_mildew', 'disease'), 'downey mildew': ('downy_mildew', 'disease'),
    'early blight': ('early_blight', 'disease'), 'late blight': ('late_blight', 'disease'),
    'leaf curl': ('leaf_curl_symptoms', 'symptom'),
    'yellow vein mosaic virus (yvmv)': ('yellow_vein_mosaic_virus', 'disease'),
    'yellow mosaic virus': ('yellow_mosaic_virus_unspecified', 'disease'),
    'yelllow mosaic virus': ('yellow_mosaic_virus_unspecified', 'disease'),
    'anthracnose (colletotrichum spp.)': ('anthracnose', 'disease'),
    'anthracnose': ('anthracnose', 'disease'), 'anthracnose lesions': ('anthracnose', 'disease'),
    'eggplant begomovirus': ('begomovirus_unspecified', 'disease'),
    'eggplant cercopora leaf spot': ('cercospora_leaf_spot', 'disease'),
    'eggplant verticillium wilt': ('verticillium_wilt', 'disease'),
    'tomato leaf curl virus': ('leaf_curl_virus_unspecified', 'disease'),
    'tomato spotted wilt': ('spotted_wilt', 'disease'),
    'black rot': ('black_rot', 'disease'), 'fusarium wilt': ('fusarium_wilt', 'disease'),
    'mosaic virus': ('mosaic_virus_unspecified', 'disease'),
    'bacterial canker': ('bacterial_canker', 'disease'), 'cutting weevil': ('cutting_weevil', 'pest'),
    'die back': ('die_back', 'disease'), 'gall midge': ('gall_midge', 'pest'),
    'powdery mildew': ('powdery_mildew', 'disease'), 'sooty mould': ('sooty_mould', 'disease'),
    'cordana': ('cordana_leaf_spot', 'disease'), 'pestalotiopsis': ('pestalotiopsis_leaf_spot', 'disease'),
    'sigatoka': ('sigatoka_unspecified', 'disease'), 'curl': ('leaf_curl_symptoms', 'symptom'),
    'ring spot': ('ringspot', 'disease'), 'ringspot': ('ringspot', 'disease'),
    'bacterialspot': ('bacterial_spot', 'disease'),
    'pest damage': ('pest_damage_unspecified', 'pest'),
    'bacterial blight': ('bacterial_blight', 'disease'), 'black spot': ('black_spot', 'disease'),
    'citrus canker': ('canker', 'disease'), 'canker': ('canker', 'disease'),
    'citrus hindu mite': ('hindu_mite', 'pest'), 'citrus leafminer': ('leafminer', 'pest'),
    'curl leaf': ('leaf_curl_symptoms', 'symptom'), 'dry leaf': ('dry_leaf_symptoms', 'symptom'),
    'greening': ('greening', 'disease'), 'melanose': ('melanose', 'disease'),
    'spider mites': ('spider_mites', 'pest'),
}


def infer(source, folder):
    parts = folder.split('/')
    basename = re.sub(r'\(\d+\)', '', parts[-1]).strip()
    lowered = re.sub(r'[_-]+', ' ', basename.lower()).strip()
    crop, condition, kind = '', '', ''
    reason = 'unknown_folder_requires_review'
    if source == 'lemon_v6' and any('annotated' in p.lower() for p in parts):
        return '', '', '', 'annotation_rendering_excluded_use_raw_images_only'
    if source == 'plantvillage':
        host, raw_condition = basename.split('___', 1)
        crop = CROPS.get(host.lower(), '')
        condition = slug(raw_condition)
        kind = 'healthy' if condition == 'healthy' else ('pest' if 'mite' in condition else 'disease')
        if not crop:
            return '', '', '', 'outside_fruit_vegetable_scope'
        return crop, condition, kind, 'publisher_label_preserved'
    if source == 'guava_v1':
        # Five deterministic samples per class were inspected for organ type. This is an organ
        # spot-check only, not independent validation of the publisher's disease annotations.
        guava_leaf = {
            'guava powdery mildew': ('powdery_mildew', 'disease'),
            'guava red rust': ('red_rust', 'disease'),
            'guava sooty mold': ('sooty_mould', 'disease'),
            'guava white fly': ('whitefly', 'pest'),
            'healthy leaf': ('healthy', 'healthy'),
        }
        if lowered in guava_leaf:
            condition, kind = guava_leaf[lowered]
            return 'guava', condition, kind, 'publisher_label_preserved_organ_spotchecked'
        return '', '', '', 'fruit_or_unknown_organ_excluded'
    if source == 'watermelon_v1':
        # Five deterministic samples per class confirmed the anthracnose folder uses fruit,
        # while these three folders use leaves/foliage. Disease labels remain publisher labels.
        leaf_classes = {
            'healthy': ('healthy', 'healthy'),
            'downy mildew': ('downy_mildew', 'disease'),
            'mosaic virus': ('mosaic_virus_unspecified', 'disease'),
        }
        if lowered in leaf_classes:
            condition, kind = leaf_classes[lowered]
            return 'watermelon', condition, kind, 'publisher_label_preserved_organ_spotchecked'
        return '', '', '', 'fruit_or_unknown_organ_excluded'
    if source == 'citrus_v2':
        # The source identifies a genus, while another source explicitly identifies lemon.
        # Do not create overlapping host classes or silently guess orange/lemon identities.
        return '', '', '', 'unspecified_citrus_host_requires_taxonomy_review'
    else:
        crop = SINGLE_CROP.get(source, '')
    if not crop:
        for part in parts:
            clean = re.sub(r'\(\d+\)', '', part).strip().lower()
            if clean in CROPS:
                crop = CROPS[clean]
    if source == 'vegetables_bd_v3':
        if lowered == 'eggplant fresh leaf' or lowered == 'tomato fresh leaf':
            lowered = 'fresh leaf'
        if lowered == 'tomato bacterial spot':
            lowered = 'bacterial spot'
    if source == 'gourds_okra_v2' and any('augment' in p.lower() for p in parts):
        return '', '', '', 'publisher_augmentation_excluded'
    if source == 'vegetables_seven_v1' and not crop:
        return '', '', '', 'outside_selected_vegetable_scope_or_unknown_crop'
    mapped = CONDITIONS.get(lowered)
    if mapped and crop:
        condition, kind = mapped
        reason = 'publisher_label_preserved_spelling_normalized'
    if source == 'mango_leaf_bd_v1':
        # No parent-image lineage is supplied for zoomed/rotated derivatives. Keep the complete
        # source separate from train/validation until lineage can be established.
        return crop, condition, kind, 'hold_derivative_lineage_unresolved'
    return crop, condition, kind, reason


def main():
    inventory = list(csv.DictReader((ML / 'data/processed/folder_inventory.csv').open()))
    out = ML / 'configs/label_mapping.csv'
    existing = {}
    if out.exists():
        existing = {(r['dataset_id'], r['relative_folder']): r for r in csv.DictReader(out.open())}
    rows = []
    for item in inventory:
        key = item['dataset_id'], item['relative_folder']
        if key in existing:
            rows.append(existing[key])
            continue
        crop, condition, kind, reason = infer(*key)
        admitted = bool(crop and condition and reason.startswith('publisher_label_preserved'))
        rows.append({'dataset_id': key[0], 'relative_folder': key[1], 'crop_id': crop,
                     'label': f'{crop}__leaf__{condition}' if crop and condition else '',
                     'organ': 'leaf' if crop else '', 'condition_type': kind,
                     'admit': 'yes' if admitted else 'no', 'reason': reason})
    with out.open('w', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=['dataset_id','relative_folder','crop_id','label',
                                                   'organ','condition_type','admit','reason'])
        writer.writeheader()
        writer.writerows(rows)
    print(f'MAPPING {sum(r["admit"] == "yes" for r in rows)} admitted folders; '
          f'{sum(r["admit"] != "yes" for r in rows)} require review/exclusion')


if __name__ == '__main__':
    main()
