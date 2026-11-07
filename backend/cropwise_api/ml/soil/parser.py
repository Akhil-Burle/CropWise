"""Layout-independent extraction of soil test values from OCR text boxes.

It does not assume a template. It finds *parameter names* (pH, EC, organic carbon, N, P, K, in English
and a few regional spellings), then the value that belongs to each one: inline ("pH : 6.8"), in the same
table row, under the name (column-style tables), or in the column headed "Test value / Result". Normal
ranges, ratings, serial numbers, dates, fertiliser advice and method codes (P2O5, 1:2.5) are ignored.

Anything doubtful is left blank with a reason, so the review form can ask the farmer instead of guessing.
"""

from __future__ import annotations

import re
import statistics
from dataclasses import dataclass
from datetime import date

from ...soil import LIMITS
from . import lexicon as lx
from .engine import OcrWord

# --------------------------------------------------------------------------------------- results

#: reasons that mean "the number cannot be trusted": the field is left blank
BLOCKING = ("unreadable", "unit_unclear", "out_of_range")
_REASON_PRIORITY = (
    "unreadable",
    "unit_unclear",
    "out_of_range",
    "ambiguous",
    "decimal_repaired",
    "digits_repaired",
    "from_organic_matter",
    "unit_converted",
    "unit_assumed",
    "unusual_value",
    "low_confidence",
)


@dataclass
class ParsedReading:
    key: str
    value: float | None
    conf: float
    #: x0, y0, x1, y1 in pixels of the image that was read
    box: tuple[float, float, float, float] | None
    reason: str | None


@dataclass
class ParsedReport:
    readings: dict[str, ParsedReading]
    lab_name: str | None
    sample_date: str | None
    #: parameters whose *name* was found (even if the value could not be read)
    labels_found: int
    values_found: int
    soil_like: bool


# --------------------------------------------------------------------------------------- cells


@dataclass
class Cell:
    raw: str
    text: str  # folded
    conf: float
    x0: float
    y0: float
    x1: float
    y1: float
    th: float

    @property
    def cx(self) -> float:
        return (self.x0 + self.x1) / 2

    @property
    def cy(self) -> float:
        return (self.y0 + self.y1) / 2

    @property
    def w(self) -> float:
        return self.x1 - self.x0

    def sx(self, index: int) -> float:
        """x position of a character index, assuming evenly spaced characters."""
        n = max(len(self.text), 1)
        return self.x0 + self.w * min(max(index, 0), n) / n


@dataclass
class Hit:
    key: str
    cell: Cell
    start: int
    end: int
    quality: float
    segment: str  # folded text after the name, up to the next name in the same cell
    seg_offset: int

    @property
    def x0(self) -> float:
        return self.cell.sx(self.start)

    @property
    def x1(self) -> float:
        return self.cell.sx(self.end)


@dataclass
class NumHit:
    value: float | None
    start: int
    end: int
    repaired: bool
    unreadable: bool
    had_point: bool


@dataclass
class Candidate:
    key: str
    value: float | None
    conf: float
    box: tuple[float, float, float, float] | None
    reasons: list[str]
    cost: float


# --------------------------------------------------------------------------------------- numbers

_NOISE = (
    re.compile(r"\(?\b1\s*:\s*\d(?:\.\d)?\b\)?"),  # soil:water ratio, "(1:2.5)"
    re.compile(r"p2o5|k2o|kmno4|nh4oac|nahco3|nh4"),  # method / oxide formulas
    re.compile(r"\b\d{1,2}\s*-\s*\d{1,2}\s*cm\b"),  # sampling depth "0-15 cm"
)
_TOKEN = re.compile(r"(?<![\w.])([<>≤≥~≈=]?)\s*([0-9oli|?*]+(?:[.,;][0-9oli?*]+)?|[.,][0-9]+)(?![0-9.,])")
_DIGIT_FIX = str.maketrans({"o": "0", "l": "1", "i": "1", "|": "1", ";": "."})
_DATE_LIKE = re.compile(r"^\s*\d{1,4}\s*[/.\-]\s*\d{1,2}\s*[/.\-]\s*\d{2,4}")


def _scrub(text: str) -> str:
    """Blank out method codes and ratios without moving anything (indices stay valid)."""
    for rx in _NOISE:
        text = rx.sub(lambda m: " " * len(m.group()), text)
    return text


def scan_number(text: str) -> NumHit | None:
    """First plain number in `text`. Skips ranges ("6.5-7.5"), thresholds ("<280") and ratios."""
    clean = _scrub(text)
    for m in _TOKEN.finditer(clean):
        comparator, token = m.group(1), m.group(2)
        if comparator in ("<", ">", "≤", "≥"):
            continue
        before, after = clean[: m.start()], clean[m.end() :]
        if re.search(r"\d\s*(?:-|to)\s*$", before) or re.match(r"\s*(?:-|to)\s*[0-9.]", after):
            continue  # part of a range
        unreadable = "?" in token or "*" in token
        digits = sum(c.isdigit() for c in token)
        if not unreadable and digits == 0:
            continue  # just letters like "l" or "o"
        if unreadable and digits == 0 and len(token) < 2:
            continue
        repaired = any(c in "oli|;" for c in token) and not unreadable
        value: float | None = None
        if not unreadable:
            number = token.translate(_DIGIT_FIX).replace(",", ".")
            if number.count(".") > 1 or len(number.replace(".", "")) > 6:
                continue
            try:
                value = float(number)
            except ValueError:
                continue
        return NumHit(value, m.start(2), m.end(2), repaired, unreadable, "." in token or "," in token)
    return None


def _numeric_cell(cell: Cell) -> NumHit | None:
    """The cell is a value (number first, maybe followed by a unit or rating), not prose."""
    if _DATE_LIKE.match(cell.text):
        return None
    hit = scan_number(cell.text)
    if hit is None or hit.start > 2 or len(cell.text) - hit.end > 24:
        return None
    if cell.conf < 0.45 and len(cell.text) <= 2:
        return None  # a stray digit from an unreadable word (e.g. regional script)
    if re.match(r"\s*/\s*\d", cell.text[hit.end :]):  # "47/1A" survey numbers
        return None
    return hit


# --------------------------------------------------------------------------------------- dates / lab

_MONTHS = {
    m: i + 1
    for i, names in enumerate(
        [
            ("jan", "january"),
            ("feb", "february"),
            ("mar", "march"),
            ("apr", "april"),
            ("may",),
            ("jun", "june"),
            ("jul", "july"),
            ("aug", "august"),
            ("sep", "sept", "september"),
            ("oct", "october"),
            ("nov", "november"),
            ("dec", "december"),
        ]
    )
    for m in names
}


def parse_date(text: str, today: date | None = None) -> str | None:
    """ISO date from "22/09/2026", "22-9-26", "2026-09-22" or "22 Sep 2026"; None if unreadable."""
    t = lx.fold(text)
    if "?" in t:
        return None
    today = today or date.today()
    day = month = year = None
    if m := re.search(r"(\d{4})\s*[/.\-]\s*(\d{1,2})\s*[/.\-]\s*(\d{1,2})", t):
        year, month, day = int(m[1]), int(m[2]), int(m[3])
    elif m := re.search(r"(\d{1,2})\s*[/.\-]\s*(\d{1,2})\s*[/.\-]\s*(\d{2,4})", t):
        a, b, year = int(m[1]), int(m[2]), int(m[3])
        if b > 12 >= a:
            month, day = a, b  # unambiguous month-first
        else:
            day, month = a, b  # Indian reports are dd/mm
    elif m := re.search(r"(\d{1,2})(?:st|nd|rd|th)?[\s\-]*([a-z]{3,9})\.?,?[\s\-]*(\d{2,4})", t):
        if m[2] in _MONTHS:
            day, month, year = int(m[1]), _MONTHS[m[2]], int(m[3])
    elif m := re.search(r"([a-z]{3,9})\.?\s*(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})", t):
        if m[1] in _MONTHS:
            month, day, year = _MONTHS[m[1]], int(m[2]), int(m[3])
    if day is None or month is None or year is None:
        return None
    if year < 100:
        year += 2000
    try:
        found = date(year, month, day)
    except ValueError:
        return None
    if not (2000 <= found.year <= today.year + 1):
        return None
    return found.isoformat()


def _right_cells(cells: list[Cell], anchor: Cell, after_x: float) -> list[Cell]:
    tol = 0.8 * max(anchor.th, 1.0)
    row = [c for c in cells if c is not anchor and c.x0 >= after_x - 0.5 * anchor.th and abs(c.cy - anchor.cy) <= tol]
    return sorted(row, key=lambda c: c.x0)


def _find_sample_date(cells: list[Cell]) -> str | None:
    best: tuple[int, str] | None = None
    for c in cells:
        if lx.OTHER_DATE_LABEL.search(c.text):
            continue
        if lx.SAMPLE_DATE_LABEL.search(c.text):
            rank = 2
        elif re.search(r"\bdate\b", c.text):
            rank = 1
        else:
            continue
        found = parse_date(c.text) if re.search(r"\d", c.text) else None
        if found is None:
            for neighbour in _right_cells(cells, c, c.x1)[:2]:
                if lx.OTHER_DATE_LABEL.search(neighbour.text) or lx.SAMPLE_DATE_LABEL.search(neighbour.text):
                    break  # that date belongs to its own label
                found = parse_date(neighbour.text)
                if found:
                    break
        if found and (best is None or rank > best[0]):
            best = (rank, found)
    return best[1] if best else None


def _find_lab_name(cells: list[Cell], page_h: float) -> str | None:
    for c in cells:
        if lx.LAB_LABEL.match(c.text):
            for neighbour in _right_cells(cells, c, c.x1)[:1]:
                if len(neighbour.raw) >= 4 and "?" not in neighbour.raw:
                    return neighbour.raw.strip()[:80]
    for c in cells:
        if c.cy > 0.6 * page_h or "?" in c.raw or not lx.LAB_WORDS.search(c.text):
            continue
        raw = c.raw.strip()
        if ":" in raw and lx.LAB_WORDS.search(raw.split(":", 1)[0].casefold()):
            raw = raw.split(":", 1)[1].strip()
        if 4 <= len(raw) <= 80:
            return raw
    return None


# --------------------------------------------------------------------------------------- core


def _hits_in(cell: Cell) -> list[Hit]:
    found = lx.find_labels(cell.text)
    hits: list[Hit] = []
    for i, (key, start, end, quality) in enumerate(found):
        stop = found[i + 1][1] if i + 1 < len(found) else len(cell.text)
        hits.append(Hit(key, cell, start, end, quality, cell.text[end:stop], end))
    return hits


def _inline_number(hit: Hit) -> NumHit | None:
    """Number written right after the name in the same box ("pH : 6.8", "Nitrogen (N) 250 kg/ha")."""
    number = scan_number(hit.segment)
    if number is None:
        return None
    gap = re.sub(r"\([^)]*\)", " ", hit.segment[: number.start])
    if re.sub(r"[\s:=\-./|,]", "", gap):
        return None  # other words in between: not this name's value
    return number


def _value_header_x(cells: list[Cell], hits: list[Hit]) -> float | None:
    """x of the 'Test value / Result' column header, if the table has one."""
    if len({h.key for h in hits}) < 2:
        return None
    top = min(h.cell.cy for h in hits)
    best: Cell | None = None
    for c in cells:
        if len(c.text) > 30 or lx.NOT_VALUE_HEADER.search(c.text) or not lx.VALUE_HEADER.search(c.text):
            continue
        if _hits_in(c) or c.cy > top + 0.5 * c.th:
            continue  # must sit above the first parameter row
        if best is None or c.cy > best.cy:  # the closest one above the table
            best = c
    return best.cx if best else None


def _unit_for(value_cell: Cell, number: NumHit | None, cells: list[Cell], label: Cell) -> str | None:
    if number is not None:
        unit = lx.find_unit(value_cell.text[number.end :])
        if unit:
            return unit
    for neighbour in _right_cells(cells, value_cell, value_cell.x1):
        if _hits_in(neighbour):
            continue
        kind = lx.parse_unit(neighbour.text)
        if kind:
            return kind
    return lx.find_unit(label.text)


def _build_candidate(
    hit: Hit,
    number: NumHit,
    *,
    unit: str | None,
    box: tuple[float, float, float, float],
    cost: float,
    conf: float,
) -> Candidate:
    reasons: list[str] = []
    value: float | None = number.value
    if number.unreadable or value is None:
        return Candidate(hit.key, None, conf, box, ["unreadable"], cost)
    if number.repaired:
        conf *= 0.85
        reasons.append("digits_repaired")
    if hit.key == "pH" and not number.had_point and 30 <= value <= 140:
        value /= 10  # "68" -> 6.8: the decimal point was lost
        conf *= 0.8
        reasons.append("decimal_repaired")
    converted, why = lx.convert(hit.key, value, unit)
    if why:
        reasons.append(why)
        if why == "unit_assumed":
            conf *= 0.9
    if converted is None:
        return Candidate(hit.key, None, conf, box, reasons, cost)
    value = converted
    if hit.key != "OM":
        low, high = LIMITS[hit.key]
        if not (low <= value <= high):
            return Candidate(hit.key, None, conf, box, [*reasons, "out_of_range"], cost)
        t_low, t_high = lx.TYPICAL[hit.key]
        if not (t_low <= value <= t_high):
            conf *= 0.85
            reasons.append("unusual_value")
    return Candidate(hit.key, round(value, 3), conf, box, reasons, cost)


def _pick_reason(reasons: list[str]) -> str | None:
    for reason in _REASON_PRIORITY:
        if reason in reasons:
            return reason
    return None


def parse(words: list[OcrWord], page_w: float, page_h: float, fill_min: float = 0.5) -> ParsedReport:
    cells = [
        Cell(w.text, lx.fold(w.text), w.conf, w.x0, w.y0, w.x1, w.y1, w.th if w.th > 0 else w.h)
        for w in words
        if lx.fold(w.text)
    ]
    soil_like = any(lx.SOIL_WORDS.search(c.text) for c in cells)
    sample_date = _find_sample_date(cells)
    lab_name = _find_lab_name(cells, page_h)

    hits = [h for c in cells for h in _hits_in(c)]
    labelled = {id(h.cell) for h in hits}
    labels_found = len({h.key for h in hits if h.key != "OM"})
    candidates: list[Candidate] = []

    # 1) value written in the same box as the name
    pending: list[Hit] = []
    for h in hits:
        number = _inline_number(h)
        if number is None:
            pending.append(h)
            continue
        c = h.cell
        box = (c.sx(h.seg_offset + number.start), c.y0, c.sx(h.seg_offset + number.end), c.y1)
        unit = lx.find_unit(h.segment[number.end :]) or lx.find_unit(h.cell.text[: h.end])
        candidates.append(_build_candidate(h, number, unit=unit, box=box, cost=-10.0, conf=c.conf * h.quality))

    # 2) value in another box: same row first, then under the name (column-style tables)
    numeric: dict[int, NumHit] = {}
    for index, c in enumerate(cells):
        if id(c) not in labelled:
            number = _numeric_cell(c)
            if number is not None:
                numeric[index] = number
    header_x = _value_header_x(cells, hits)

    pairs: list[tuple[float, int, int]] = []
    for hi, h in enumerate(pending):
        for ci, number in numeric.items():
            v = cells[ci]
            th = max(h.cell.th, v.th, 1.0)
            dy = abs(v.cy - h.cell.cy)
            if v.x0 >= h.x1 - 0.5 * h.cell.th and dy <= 0.8 * th:
                dx = max(0.0, v.x0 - h.x1)
                cost = dy / th + (4 * abs(v.cx - header_x) / page_w if header_x is not None else 0.8 * dx / page_w)
                cost += 3 * (1 - v.conf)  # a shaky read loses to a clear one
                pairs.append((cost, hi, ci))
    used_hits: set[int] = set()
    used_cells: set[int] = set()
    chosen: list[tuple[int, int, float]] = []
    for cost, hi, ci in sorted(pairs):
        if hi in used_hits or ci in used_cells:
            continue
        used_hits.add(hi)
        used_cells.add(ci)
        chosen.append((hi, ci, cost))

    # column-style: only for names with nothing but other names to their right
    below: list[tuple[float, int, int]] = []
    for hi, h in enumerate(pending):
        if hi in used_hits:
            continue
        row_tol = 0.8 * max(h.cell.th, 1.0)
        has_right = any(
            c is not h.cell and id(c) not in labelled and c.x0 >= h.x1 and abs(c.cy - h.cell.cy) <= row_tol for c in cells
        )
        if has_right:
            continue
        for ci, number in numeric.items():
            if ci in used_cells:
                continue
            v = cells[ci]
            dy = v.cy - h.cell.cy
            reach = max(h.cell.w, v.w) * 0.75 + 0.5 * h.cell.th
            if 0.6 * h.cell.th <= dy <= 4.5 * h.cell.th and abs(v.cx - h.cell.cx) <= reach:
                below.append((2 + 0.3 * dy / max(h.cell.th, 1.0) + 4 * abs(v.cx - h.cell.cx) / page_w, hi, ci))
    for cost, hi, ci in sorted(below):
        if hi in used_hits or ci in used_cells:
            continue
        used_hits.add(hi)
        used_cells.add(ci)
        chosen.append((hi, ci, cost))

    for hi, ci, cost in chosen:
        h, v, number = pending[hi], cells[ci], numeric[ci]
        unit = _unit_for(v, number, cells, h.cell)
        box = (v.x0, v.y0, v.x1, v.y1)  # highlight the whole value cell: easier to see than a few characters
        candidates.append(
            _build_candidate(h, number, unit=unit, box=box, cost=cost, conf=min(v.conf, h.cell.conf) * h.quality)
        )

    readings = _select(candidates, fill_min)
    return ParsedReport(
        readings=readings,
        lab_name=lab_name,
        sample_date=sample_date,
        labels_found=labels_found,
        values_found=sum(1 for r in readings.values() if r.value is not None),
        soil_like=soil_like or labels_found > 0,
    )


def _select(candidates: list[Candidate], fill_min: float) -> dict[str, ParsedReading]:
    by_key: dict[str, list[Candidate]] = {}
    for cand in candidates:
        by_key.setdefault(cand.key, []).append(cand)

    winners: dict[str, Candidate] = {}
    for key, group in by_key.items():
        group.sort(key=lambda c: (c.value is None, -(c.conf), c.cost))
        top = group[0]
        rivals = [
            c for c in group[1:] if c.value is not None and top.value is not None and abs(c.value - top.value) > 1e-6
        ]
        if rivals and rivals[0].conf >= 0.6 * top.conf:
            top.conf *= 0.8
            top.reasons.append("ambiguous")
        winners[key] = top

    # Some labs report organic matter instead of organic carbon.
    om = winners.pop("OM", None)
    if om and om.value is not None and (winners.get("OC") is None or winners["OC"].value is None):
        winners["OC"] = Candidate(
            "OC", round(om.value * lx.OM_TO_OC, 3), om.conf * 0.8, om.box, [*om.reasons, "from_organic_matter"], om.cost
        )

    readings: dict[str, ParsedReading] = {}
    for key, cand in winners.items():
        reason = _pick_reason(cand.reasons)
        value = cand.value
        if value is not None and cand.conf < fill_min:
            value, reason = None, reason or "low_confidence"
        if value is None and reason is None:
            reason = "low_confidence"
        readings[key] = ParsedReading(key, value, min(cand.conf, 1.0), cand.box, reason)
    return readings


def mean_confidence(words: list[OcrWord]) -> float:
    return statistics.fmean(w.conf for w in words) if words else 0.0
