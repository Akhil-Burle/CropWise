"""Vocabulary for reading soil test reports: parameter names, units and unit conversions.

Reports differ a lot (Soil Health Card, university labs, private labs, bilingual cards), so nothing
here depends on layout: it only recognises *words*.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from difflib import SequenceMatcher

KEYS = ("pH", "EC", "OC", "N", "P", "K")


def fold(text: str) -> str:
    """Casefold, unify dashes and turn any script's digits (Devanagari, Kannada, ...) into 0-9."""
    out: list[str] = []
    for ch in unicodedata.normalize("NFKC", text):
        if not ch.isascii() and ch.isdigit():
            try:
                out.append(str(unicodedata.decimal(ch)))
                continue
            except ValueError:
                pass
        out.append(ch)
    t = "".join(out).casefold()
    t = t.replace("\u2013", "-").replace("\u2014", "-").replace("\u2212", "-").replace("\u00a0", " ")
    return re.sub(r"\s+", " ", t).strip()


# ----------------------------------------------------------------------------- parameter names


@dataclass(frozen=True)
class LabelSpec:
    key: str
    #: regexes searched anywhere in the folded text
    words: tuple[str, ...]
    #: symbols accepted only when they are the *whole* label ("N", "Available P", "K2O")
    symbols: tuple[str, ...] = ()
    #: long words that are accepted with OCR typos ("nitr0gen")
    fuzzy: tuple[str, ...] = ()


LABELS: tuple[LabelSpec, ...] = (
    LabelSpec(
        "pH",
        words=(r"(?<![a-z])p\s?h(?![a-z])", r"soil\s+reaction", r"ರಸಸಾರ", r"पी\s?एच", r"अभिक्रिया"),
        symbols=("ph",),
    ),
    LabelSpec(
        "EC",
        words=(
            r"conductiv",
            r"elec(?:trical|\.)?\s*cond",
            r"soluble\s+salt",
            r"salinity",
            r"(?<![a-z])e\.?\s?c\.?(?![a-z])",
            r"विद्युत\s*चालकता",
            r"लवणता",
            r"ವಿದ್ಯುತ್\s*ವಾಹಕ",
            r"ಲವಣ",
        ),
        symbols=("ec", "e.c", "e.c."),
        fuzzy=("conductivity",),
    ),
    LabelSpec(
        "OC",
        words=(
            r"organic\s*carbon",
            r"org\.?\s*carbon",
            r"(?<![a-z])o\.?\s?c\.?(?![a-z])",
            r"जैविक\s*कार्बन",
            r"कार्बनिक\s*कार्बन",
            r"ಸಾವಯವ\s*ಇಂಗಾಲ",
        ),
        symbols=("oc", "o.c", "o.c."),
        fuzzy=("carbon",),
    ),
    LabelSpec(
        "OM",  # organic matter: converted to OC only when the report has no OC
        words=(r"organic\s*matter", r"humus"),
        symbols=("om", "o.m", "o.m."),
    ),
    LabelSpec(
        "N",
        words=(r"nitrogen", r"kmno4", r"alkaline\s*permanganate", r"नाइट्रोजन", r"नत्रजन", r"ಸಾರಜನಕ"),
        symbols=("n", "avail n", "av n"),
        fuzzy=("nitrogen",),
    ),
    LabelSpec(
        "P",
        words=(r"phosph[oa]r", r"p2o5", r"olsen", r"फॉस्फोरस", r"फास्फोरस", r"स्फुर", r"ರಂಜಕ"),
        symbols=("p", "p2o5"),
        fuzzy=("phosphorus", "phosphorous"),
    ),
    LabelSpec(
        "K",
        words=(r"potass", r"potash", r"k2o", r"पोटाश", r"पोटैशियम", r"ಪೊಟ್ಯಾಶ್", r"ಪೊಟ್ಯಾಷ್", r"ಪೊಟಾಷ್"),
        symbols=("k", "k2o"),
        fuzzy=("potassium",),
    ),
)

#: Text that turns a "label" into something else: fertiliser advice, ratios, other quantities.
NOT_A_RESULT = re.compile(
    r"\b(?:muriate|mop|urea|dap|ssp|tsp|superphosphate|fertili[sz]|recommend|apply|application|"
    r"dose|bags?|manure|compost|fym|vermi|gypsum|lime|npk|per\s+plant|total\s+nitrogen|total\s+n)\b"
    r"|nitrate|ammonium\s+nitrogen|exchangeable|water\s+soluble"
)

_FILLER = re.compile(r"\b(?:available|avail|av|extractable|olsen'?s?|bray)\b\.?")
_UNIT_PAREN = re.compile(r"\([^)]*(?:/|%|ppm|g\b|kg|mg|ds|ms)[^)]*\)")
_SERIAL = re.compile(r"^\s*\(?\d{1,2}[.)]?\s+")


def _symbol_core(text: str) -> str:
    t = _SERIAL.sub("", text)
    t = _UNIT_PAREN.sub(" ", t)
    t = _FILLER.sub(" ", t)
    t = re.sub(r"[^a-z0-9.]", "", t.replace("(", " ").replace(")", " "))
    return t.strip(".")


def find_labels(text: str) -> list[tuple[str, int, int, float]]:
    """Parameter names found in a folded cell text: (key, start, end, quality 0-1).

    Several matches for one key in the same cell are merged into one span.
    """
    if not text or NOT_A_RESULT.search(text):
        return []
    hits: dict[str, tuple[int, int, float]] = {}

    def add(key: str, start: int, end: int, quality: float) -> None:
        if key in hits:
            s, e, q = hits[key]
            hits[key] = (min(s, start), max(e, end), max(q, quality))
        else:
            hits[key] = (start, end, quality)

    for spec in LABELS:
        for pattern in spec.words:
            for m in re.finditer(pattern, text):
                end = m.end()
                while end < len(text) and text[end].isalpha():  # "phosphor" -> "phosphorus"
                    end += 1
                add(spec.key, m.start(), end, 1.0)
        if spec.key in hits:
            continue
        # Short symbols count only when they are the whole label (so "N" in a sentence does not).
        if _symbol_core(text) in spec.symbols:
            add(spec.key, 0, len(text), 0.95)
            continue
        for m in re.finditer(r"[^\W\d_]{6,}", text):  # long alphabetic words, tolerant to OCR typos
            for target in spec.fuzzy:
                if SequenceMatcher(None, m.group(), target).ratio() >= 0.84:
                    add(spec.key, m.start(), m.end(), 0.9)
    return sorted(((k, s, e, q) for k, (s, e, q) in hits.items()), key=lambda h: h[1])


# ----------------------------------------------------------------------------- headers


VALUE_HEADER = re.compile(r"test\s*value|result|observ|found|actual|your\s*soil|analy[sz]|reading|^value$|value\s*obtained")
NOT_VALUE_HEADER = re.compile(r"normal|standard|optim|range|ideal|critical|desired|rating|status|remark|method|unit|limit|class|level|category")

SAMPLE_DATE_LABEL = re.compile(
    r"date\s*of\s*(?:sampl|collect)|(?:sampl(?:e|ing)|collection)\s*(?:collection\s*)?date|(?:sampled|collected)\s*(?:on|date)|date\s*sampled"
)
OTHER_DATE_LABEL = re.compile(r"report|analy|test(?:ing)?\s*date|issue|print|receiv|receipt|dispatch|generated")
LAB_LABEL = re.compile(r"^(?:name\s*of\s*(?:the\s*)?)?(?:lab(?:oratory)?|testing\s*lab(?:oratory)?|tested\s*(?:at|by))(?:\s*name)?[:.\s]*$")
LAB_WORDS = re.compile(r"laborator|\blab\b|soil\s*testing|testing\s*(?:centre|center)|krishi\s*vigyan|\buniversity\b|\binstitute\b|agri(?:cultur)?\w*\s*(?:analy|research|services)")
SOIL_WORDS = re.compile(r"soil\s*(?:health|test|analysis|report|fertility)|health\s*card|ಮಣ್ಣು|मृदा|मिट्टी")


# ----------------------------------------------------------------------------- units

_UNIT_PATTERNS: tuple[tuple[str, str], ...] = (
    ("kg_ha", r"kg\.?/?(?:ha|hectare)s?(?:-1)?|kgha(?:-1)?|kg\.?ha-1|kg/ha\.?"),
    ("kg_acre", r"kg\.?/?(?:ac|acre)s?(?:-1)?"),
    ("lb_acre", r"(?:lb|lbs)\.?/?(?:ac|acre)s?(?:-1)?"),
    ("mg_100g", r"mg/?100g(?:m)?|mg/?100\s*g"),
    ("mg_kg", r"mg\.?/?kg(?:-1)?"),
    ("mg_l", r"mg\.?/?l(?:-1)?"),
    ("ppm", r"ppm|p\.p\.m\.?"),
    ("g_kg", r"g\.?/?kg(?:-1)?"),
    ("pct", r"%|percent|per\s?cent|pct"),
    ("us_cm", r"[uµμ]s\.?/?cm|[uµμ]mhos?\.?/?cm"),
    ("ms_m", r"ms\.?/?m(?:-1)?"),
    ("ms_cm", r"ms\.?/?cm(?:-1)?|mmhos?\.?/?cm|mho/?cm"),
    ("ds_m", r"d\.?s\.?/?m(?:-1)?|d\.?s\.?m-1"),
)
_UNIT_RES = tuple((kind, re.compile(f"^(?:{pat})$")) for kind, pat in _UNIT_PATTERNS)


def parse_unit(text: str) -> str | None:
    """Canonical unit kind for a unit string ("Kg/ha", "dS/m", "mg kg-1", "%"), else None."""
    t = fold(text).replace(" ", "").replace("^", "").replace("⁻¹", "-1").replace("per", "/") if text else ""
    t = t.strip(".,;:()[]")
    if not t or len(t) > 14:
        return None
    for kind, rx in _UNIT_RES:
        if rx.match(t):
            return kind
    return None


def find_unit(text: str) -> str | None:
    """First unit mentioned anywhere in a longer text such as "250 kg/ha (medium)"."""
    folded = fold(text)
    compact = re.sub(r"\s*/\s*", "/", folded)
    for token in re.findall(r"[a-zµμ%][a-zµμ%./\-0-9^]{0,13}", compact):
        kind = parse_unit(token)
        if kind:
            return kind
    # "mg kg-1", "kg ha-1": two tokens
    for pair in re.findall(r"([a-zµμ]{1,5})\s+([a-z]{1,4}-?1?)", compact):
        kind = parse_unit("".join(pair))
        if kind:
            return kind
    return None


# ----------------------------------------------------------------------------- conversions

#: 1 ppm (mg/kg) of available nutrient in the 15 cm furrow slice ≈ 2.24 kg/ha (standard Indian soil-testing factor).
PPM_TO_KG_HA = 2.24
ACRE_TO_HA = 2.471
LB_PER_ACRE_TO_KG_HA = 1.121
OM_TO_OC = 1 / 1.724  # Van Bemmelen factor

#: normal ranges used only to flag "unusual, please check" (hard limits live in soil.LIMITS)
TYPICAL: dict[str, tuple[float, float]] = {
    "pH": (3.5, 9.5),
    "EC": (0.0, 6.0),
    "OC": (0.05, 3.5),
    "N": (20.0, 1200.0),
    "P": (0.5, 150.0),
    "K": (20.0, 1500.0),
}


def convert(key: str, value: float, unit: str | None) -> tuple[float | None, str | None]:
    """Value in the unit the app uses (N,P,K kg/ha · EC dS/m · OC % · pH none) and a reason code.

    A reason of 'unit_unclear' means the printed unit cannot be turned into the app's unit, so the
    number is not trustworthy and the field is left blank.
    """
    if key == "pH":
        return value, None
    if key in ("N", "P", "K"):
        if unit is None:
            return value, "unit_assumed"
        if unit == "kg_ha":
            return value, None
        if unit == "kg_acre":
            return value * ACRE_TO_HA, "unit_converted"
        if unit == "lb_acre":
            return value * LB_PER_ACRE_TO_KG_HA, "unit_converted"
        if unit in ("ppm", "mg_kg", "mg_l"):
            return value * PPM_TO_KG_HA, "unit_converted"
        if unit == "mg_100g":
            return value * 10 * PPM_TO_KG_HA, "unit_converted"
        return None, "unit_unclear"
    if key == "EC":
        if unit in ("ds_m", "ms_cm"):
            return value, None
        if unit == "us_cm":
            return value / 1000, None
        if unit == "ms_m":
            return value / 100, None
        if unit is None:
            # a bare 350 can only be µS/cm; a bare 0.35 is dS/m
            return (value / 1000, "unit_assumed") if value > 20 else (value, "unit_assumed")
        return None, "unit_unclear"
    if key in ("OC", "OM"):
        if unit is None and 5 < value <= 50:
            return value / 10, "unit_assumed"  # a bare 6.2 cannot be %, it is g/kg
        if unit in (None, "pct"):
            return value, None if unit else "unit_assumed"
        if unit == "g_kg":
            return value / 10, None
        return None, "unit_unclear"
    return value, None
