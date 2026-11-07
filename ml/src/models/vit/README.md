# ViT pipeline — planned

Implement pretrained Vision Transformer fine-tuning and inference here, initially considering ViT-B/16. Use the same manifests and labels as the CNN. Record weights, image processor and hyperparameters. Export predictions for shared evaluation and save weights under `ml/checkpoints/`. No training code or trained model exists yet.

To serve the ViT in the website, implement the `LeafClassifier` protocol from `backend/cropwise_api/ml/base.py`
(`info`, `labels` in `<crop>__leaf__<disease>` form, and `predict(image) -> {label: probability}`), return it from
`_build_vit` in `backend/cropwise_api/ml/registry.py`, and start the API with `CROPWISE_LEAF_MODEL=vit`. No route or
website change is needed.
