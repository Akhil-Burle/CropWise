"""Review flagged leaf images in a local browser and save proposed decisions without modifying data."""
from __future__ import annotations

import argparse
import csv
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
import io
import json
from pathlib import Path
import secrets
from urllib.parse import parse_qs, urlparse

from PIL import Image, ImageOps

ML = Path(__file__).resolve().parents[2]
DECISIONS = {"keep_label", "uncertain", "needs_expert", "propose_relabel", "exclude_candidate"}
FIELDS = ["image_id", "relative_path", "label", "predicted_class", "decision",
          "proposed_label", "reviewer", "review_notes", "reviewed_at"]

PAGE = r'''<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CropWise image review</title>
<style>
body{font:16px system-ui;margin:24px;background:#f5f7f5;color:#15251c;max-width:1250px}
h1{margin-bottom:6px}button,input,select,textarea{font:inherit;padding:9px;border:1px solid #aebdb3;border-radius:5px}
button{cursor:pointer;background:#20623c;color:white}button:disabled{opacity:.5;cursor:wait}
.bar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:18px 0}
.grid{display:grid;grid-template-columns:minmax(0,3fr) minmax(300px,2fr);gap:24px}
img{width:100%;height:65vh;object-fit:contain;background:#ddd;border-radius:8px}
label{display:block;margin:12px 0 5px}select,textarea{max-width:100%;box-sizing:border-box}textarea{width:100%}
.muted{color:#486051}.card{padding:18px;background:white;border-radius:8px}#status{white-space:pre-wrap}
@media(max-width:760px){.grid{grid-template-columns:1fr}img{height:45vh}}
</style>
<h1>Review leaf images and source labels</h1>
<p class="muted">Record what you can verify. A model mistake alone does not establish a wrong label. Decisions are proposals for a later dataset revision.</p>
<div class="bar"><label>Crop <select id="crop"><option value="">All crops</option></select></label>
<label><input id="pending" type="checkbox" checked> Unreviewed only</label>
<label><input id="reveal" type="checkbox"> Show model prediction</label>
<span id="count"></span></div>
<div class="grid"><div class="card"><img id="photo" alt="Leaf under review"><p id="file" class="muted"></p></div>
<div class="card"><h2 id="label"></h2><p id="source"></p><p id="prediction" hidden></p>
<p id="prior"></p><form id="form">
<label for="decision">Decision</label><select id="decision" required>
<option value="">Choose a decision</option><option value="keep_label">Source label appears correct</option>
<option value="uncertain">Cannot determine from image</option><option value="needs_expert">Needs expert label review</option>
<option value="propose_relabel">Propose a corrected label</option><option value="exclude_candidate">Propose exclusion: unusable/wrong organ</option></select>
<label for="proposed">Proposed label (required only for correction)</label><select id="proposed"><option value="">None</option></select>
<label for="reviewer">Reviewer name</label><input id="reviewer" required>
<label for="notes">Reason / evidence / image-quality issue</label><textarea id="notes" rows="4"></textarea>
<div class="bar"><button id="save" type="submit">Save &amp; next</button><button id="skip" type="button">Skip</button></div>
</form><p id="status" role="status"></p></div></div>
<p>Decisions save on this computer after each click. Original files and labels are unchanged. Stop the server with Ctrl+C.</p>
<script>
const $=id=>document.getElementById(id);let items=[],decisions={},labels=[],current=null,index=0;
const token=__TOKEN__;
function filtered(){return items.filter(x=>(!$('crop').value||x.crop_id===$('crop').value)&&(!$('pending').checked||!decisions[x.image_id]));}
function display(){
 const list=filtered();if(index>=list.length)index=0;current=list[index]||null;
 $('count').textContent=`${Object.keys(decisions).length}/${items.length} reviewed; ${list.length} in filter`;
 $('form').hidden=!current;$('photo').hidden=!current;
 if(!current){$('label').textContent='No images in this filter';$('source').textContent='Uncheck “Unreviewed only” to revisit saved decisions.';$('prediction').textContent='';$('file').textContent='';$('prior').textContent='';return;}
 const d=decisions[current.image_id]||{};
 $('photo').src='/image?id='+encodeURIComponent(current.image_id);
 $('label').textContent='Source label: '+current.label;
 $('source').textContent='Dataset: '+current.dataset_id+' | Source folder: '+current.source_label;
 $('file').textContent=current.image_id+' | '+current.relative_path;
 $('prediction').textContent='Model predicted: '+current.predicted_class+' | Review flags: '+current.review_flags;
 $('prediction').hidden=!$('reveal').checked;
 $('prior').textContent=d.reviewed_at?'Saved: '+d.reviewed_at:'';
 $('decision').value=d.decision||'';$('proposed').value=d.proposed_label||'';$('notes').value=d.review_notes||'';
 if(d.reviewer)$('reviewer').value=d.reviewer;
}
async function start(){const response=await fetch('/api/items');if(!response.ok)throw Error('Could not load review list');const data=await response.json();items=data.items;decisions=data.decisions;labels=data.labels;
 for(const crop of [...new Set(items.map(x=>x.crop_id))].sort())$('crop').add(new Option(crop,crop));
 for(const label of labels)$('proposed').add(new Option(label,label));
 display();$('status').textContent='Decisions file: '+data.output;
}
$('form').onsubmit=async event=>{event.preventDefault();if(!current)return;const id=current.image_id;
 $('save').disabled=true;
 try{const response=await fetch('/api/save',{method:'POST',headers:{'Content-Type':'application/json','X-Review-Token':token},body:JSON.stringify({image_id:id,decision:$('decision').value,proposed_label:$('proposed').value,reviewer:$('reviewer').value,review_notes:$('notes').value})});
 const result=await response.json();if(!response.ok)throw Error(result.error);decisions[id]=result;
 if(!$('pending').checked)index++;display();$('status').textContent='Saved decision for '+id;
 }catch(error){$('status').textContent=error.message;}finally{$('save').disabled=false;}
};
$('skip').onclick=()=>{index++;display();};
$('photo').onerror=()=>{$('status').textContent='Image could not be displayed. Check its path or record the file-quality issue.';};
for(const id of ['crop','pending'])$(id).onchange=()=>{index=0;display();};
$('reveal').onchange=()=>{$('prediction').hidden=!$('reveal').checked;};
start().catch(error=>$('status').textContent=error.message);
</script></html>'''


class ReviewState:
    def __init__(self, input_csv: Path, ml_root: Path, output: Path, labels: set[str]):
        self.ml_root, self.output, self.labels = ml_root.resolve(), output, labels
        with input_csv.open(newline="") as stream:
            reader = csv.DictReader(stream)
            columns = set(reader.fieldnames or [])
            self.rows = list(reader)
        required = {"image_id", "relative_path", "label", "predicted_class", "crop_id", "dataset_id", "source_label"}
        if not required.issubset(columns):
            raise ValueError("CSV must be a misclassified_validation.csv from review_dataset.py")
        self.rows.sort(key=lambda row: (row.get("disease_predicted_healthy") != "True", row["crop_id"], row["image_id"]))
        self.by_id = {row["image_id"]: row for row in self.rows}
        if len(self.by_id) != len(self.rows):
            raise ValueError("Duplicate image IDs in review input")
        self.decisions = {}
        if output.exists():
            with output.open(newline="") as stream:
                for row in csv.DictReader(stream):
                    self.decisions[row["image_id"]] = row
        self.token = secrets.token_urlsafe(24)

    def image_path(self, image_id):
        path = (self.ml_root / self.by_id[image_id]["relative_path"]).resolve()
        if not path.is_relative_to(self.ml_root):
            raise ValueError("Image path escapes the ML data directory")
        return path

    def save(self, data):
        image_id = data.get("image_id")
        if image_id not in self.by_id:
            raise ValueError("Unknown image ID")
        decision = data.get("decision")
        if decision not in DECISIONS:
            raise ValueError("Choose a valid review decision")
        reviewer = str(data.get("reviewer", "")).strip()
        notes = str(data.get("review_notes", "")).strip()
        proposed = str(data.get("proposed_label", "")).strip() if decision == "propose_relabel" else ""
        if not reviewer:
            raise ValueError("Enter a reviewer name")
        if decision == "propose_relabel" and proposed not in self.labels:
            raise ValueError("Choose a proposed label from this release's class list")
        if decision in {"propose_relabel", "exclude_candidate"} and not notes:
            raise ValueError("Record a reason/evidence before proposing a correction or exclusion")
        original = self.by_id[image_id]
        row = {key: original[key] for key in ["image_id", "relative_path", "label", "predicted_class"]}
        row.update(decision=decision, proposed_label=proposed, reviewer=reviewer, review_notes=notes,
                   reviewed_at=datetime.now(timezone.utc).isoformat())
        updated = dict(self.decisions)
        updated[image_id] = row
        self.output.parent.mkdir(parents=True, exist_ok=True)
        temporary = self.output.with_suffix(self.output.suffix + ".tmp")
        with temporary.open("w", newline="") as stream:
            writer = csv.DictWriter(stream, fieldnames=FIELDS)
            writer.writeheader()
            writer.writerows(updated.values())
        temporary.replace(self.output)
        self.decisions = updated
        return row


def handler_for(state):
    class Handler(BaseHTTPRequestHandler):
        def send(self, status, payload, content_type="application/json"):
            body = json.dumps(payload).encode() if content_type == "application/json" else payload
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            parsed = urlparse(self.path)
            if parsed.path == "/":
                self.send(200, PAGE.replace("__TOKEN__", json.dumps(state.token)).encode(), "text/html; charset=utf-8")
            elif parsed.path == "/api/items":
                visible = {key: row for key, row in state.decisions.items() if key in state.by_id}
                self.send(200, {"items": state.rows, "decisions": visible, "labels": sorted(state.labels), "output": str(state.output)})
            elif parsed.path == "/image":
                try:
                    image_id = parse_qs(parsed.query).get("id", [""])[0]
                    with Image.open(state.image_path(image_id)) as image:
                        image = ImageOps.exif_transpose(image).convert("RGB")
                        image.thumbnail((1600, 1600))
                        buffer = io.BytesIO()
                        image.save(buffer, format="JPEG", quality=90)
                    self.send(200, buffer.getvalue(), "image/jpeg")
                except (KeyError, ValueError, OSError) as error:
                    self.send(404, {"error": f"Cannot display image: {error}"})
            else:
                self.send(404, {"error": "Unknown endpoint"})

        def do_POST(self):
            if self.path != "/api/save" or self.headers.get("X-Review-Token") != state.token:
                self.send(403, {"error": "Invalid review request"})
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if not 0 < length <= 32768:
                    raise ValueError("Invalid request size")
                data = json.loads(self.rfile.read(length))
                if not isinstance(data, dict):
                    raise ValueError("Expected a review object")
                self.send(200, state.save(data))
            except (ValueError, TypeError) as error:
                self.send(400, {"error": str(error)})
            except OSError as error:
                self.send(500, {"error": f"Could not save decision: {error}"})

    return Handler


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path, help="Error CSV; defaults beside latest release's CNN checkpoint")
    parser.add_argument("--release", type=Path, help="Prepared release directory; defaults to latest.json")
    parser.add_argument("--output", type=Path, help="Decision CSV; defaults to manual_review_decisions.csv beside input")
    parser.add_argument("--ml-root", type=Path, default=ML, help="Root used by image relative paths")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    release = args.release or ML / json.loads((ML / "data/processed/latest.json").read_text())["relative_path"]
    release_id = json.loads((release / "summary.json").read_text())["release_id"]
    input_csv = args.csv or ML / "checkpoints" / "cnn" / release_id / "misclassified_validation.csv"
    output = args.output or input_csv.parent / "manual_review_decisions.csv"
    if output.resolve() == input_csv.resolve():
        raise SystemExit("Choose a separate decision output file")
    labels = set(json.loads((release / "class_to_idx.json").read_text()))
    state = ReviewState(input_csv, args.ml_root, output, labels)
    server = HTTPServer(("127.0.0.1", args.port), handler_for(state))
    print(f"Review {len(state.rows)} images at http://127.0.0.1:{args.port}", flush=True)
    print(f"Decisions save to {output}; stop with Ctrl+C. Images and labels remain unchanged.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
