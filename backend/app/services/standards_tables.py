"""
Hard-coded compliance standard lookup tables.

All LPD allowances are sourced from:
  - ASHRAE 90.1-2022  Table 9.6.1  (Building Area Method) & Table 9.5.1 (Space-by-Space)
  - CA Title 24-2022   Table 140.6-C
  - IECC 2021          Table C405.3.2(2)

Illuminance targets from IES Lighting Handbook (10th ed.) / RP series.
Efficacy minimums from DLC QPL Technical Requirements v5.1.
"""

from typing import Dict, List, Optional
from dataclasses import dataclass, field


@dataclass(frozen=True)
class LpdAllowance:
    space_type: str
    allowed_lpd: float  # W/ft²
    code_section: str
    notes: str = ""


@dataclass(frozen=True)
class IlluminanceRequirement:
    space_type: str
    target_fc: float  # foot-candles
    min_fc: float
    max_fc: float
    code_section: str


@dataclass(frozen=True)
class EfficacyRequirement:
    fixture_category: str
    min_efficacy: float  # lm/W
    code_section: str


# ── ASHRAE 90.1-2022 Table 9.6.1 (Space-by-Space Method) ─────────────────────

ASHRAE_90_1_2022_LPD: Dict[str, LpdAllowance] = {}

_ashrae_raw: List[tuple] = [
    ("Atrium - First 40 ft",            0.03, "Table 9.6.1"),
    ("Atrium - Above 40 ft",            0.02, "Table 9.6.1"),
    ("Audience Seating Area - Convention", 0.56, "Table 9.6.1"),
    ("Audience Seating Area - Gymnasium", 0.23, "Table 9.6.1"),
    ("Audience Seating Area - Motion Picture", 0.27, "Table 9.6.1"),
    ("Audience Seating Area - Perf. Arts", 1.16, "Table 9.6.1"),
    ("Audience Seating Area - Religious", 0.72, "Table 9.6.1"),
    ("Audience Seating Area - Sports Arena", 0.33, "Table 9.6.1"),
    ("Audience Seating Area - All Other", 0.43, "Table 9.6.1"),
    ("Banking Activity Area",            0.61, "Table 9.6.1"),
    ("Breakroom",                        0.46, "Table 9.6.1"),
    ("Classroom/Lecture/Training - Lect.", 0.71, "Table 9.6.1"),
    ("Classroom/Lecture/Training - All Other", 0.65, "Table 9.6.1"),
    ("Computer Room",                    0.71, "Table 9.6.1"),
    ("Conference/Meeting/Multipurpose",  0.74, "Table 9.6.1"),
    ("Copy/Print Room",                  0.31, "Table 9.6.1"),
    ("Corridor",                         0.41, "Table 9.6.1"),
    ("Courtroom",                        0.74, "Table 9.6.1"),
    ("Dining Area - Bar/Lounge",         0.56, "Table 9.6.1"),
    ("Dining Area - Cafeteria/Fast Food", 0.40, "Table 9.6.1"),
    ("Dining Area - Family",             0.60, "Table 9.6.1"),
    ("Dining Area - Leisure",            0.55, "Table 9.6.1"),
    ("Dining Area - All Other",          0.43, "Table 9.6.1"),
    ("Electrical/Mechanical Room",       0.42, "Table 9.6.1"),
    ("Emergency Vehicle Garage",         0.52, "Table 9.6.1"),
    ("Exam/Treatment Room",              0.90, "Table 9.6.1"),
    ("Exercise Area - Gymnasium",        0.72, "Table 9.6.1"),
    ("Exercise Area - Fitness Center",   0.72, "Table 9.6.1"),
    ("Fire Station Engine Room",         0.56, "Table 9.6.1"),
    ("Food Preparation Area",            0.72, "Table 9.6.1"),
    ("Guest Room",                       0.41, "Table 9.6.1"),
    ("Healthcare Facility Exam",         1.66, "Table 9.6.1"),
    ("Healthcare Facility Imaging",      0.94, "Table 9.6.1"),
    ("Healthcare Facility Laundry",      0.53, "Table 9.6.1"),
    ("Healthcare Facility Nurse Station", 0.71, "Table 9.6.1"),
    ("Healthcare Facility Operating Room", 1.89, "Table 9.6.1"),
    ("Healthcare Facility Patient Room",  0.62, "Table 9.6.1"),
    ("Healthcare Facility Physical Therapy", 0.91, "Table 9.6.1"),
    ("Healthcare Facility Recovery",     0.82, "Table 9.6.1"),
    ("Laboratory - Classroom",           1.11, "Table 9.6.1"),
    ("Laboratory - Medical/Industrial/Research", 1.33, "Table 9.6.1"),
    ("Laundry/Washing Area",             0.53, "Table 9.6.1"),
    ("Library - Reading Area",           0.96, "Table 9.6.1"),
    ("Library - Stacks",                 1.17, "Table 9.6.1"),
    ("Loading Dock Interior",            0.47, "Table 9.6.1"),
    ("Lobby - Elevator",                 0.64, "Table 9.6.1"),
    ("Lobby - Hotel",                    0.51, "Table 9.6.1"),
    ("Lobby - Motion Picture Theater",   0.23, "Table 9.6.1"),
    ("Lobby - Performing Arts Theater",  0.25, "Table 9.6.1"),
    ("Lobby - All Other",                0.84, "Table 9.6.1"),
    ("Locker Room",                      0.52, "Table 9.6.1"),
    ("Lounge/Leisure",                   0.55, "Table 9.6.1"),
    ("Manufacturing - Detailed",         0.69, "Table 9.6.1"),
    ("Manufacturing - Equipment Room",   0.74, "Table 9.6.1"),
    ("Manufacturing - Extra High Bay",   0.58, "Table 9.6.1"),
    ("Manufacturing - High Bay",         0.56, "Table 9.6.1"),
    ("Manufacturing - Low Bay",          0.53, "Table 9.6.1"),
    ("Museum - General Exhibition",      0.31, "Table 9.6.1"),
    ("Museum - Restoration",             1.10, "Table 9.6.1"),
    ("Nurse Station",                    0.71, "Table 9.6.1"),
    ("Office - Enclosed ≤ 250 sf",       0.74, "Table 9.6.1"),
    ("Office - Enclosed > 250 sf",       0.66, "Table 9.6.1"),
    ("Office - Open Plan",               0.61, "Table 9.6.1"),
    ("Parking Area Interior",            0.15, "Table 9.6.1"),
    ("Pharmacy Area",                    0.91, "Table 9.6.1"),
    ("Restroom",                         0.63, "Table 9.6.1"),
    ("Retail Sales Area",                0.84, "Table 9.6.1"),
    ("Stairwell",                        0.49, "Table 9.6.1"),
    ("Storage Room ≤ 50 sf",             0.51, "Table 9.6.1"),
    ("Storage Room > 50 sf",             0.38, "Table 9.6.1"),
    ("Vehicular Maintenance Area",       0.60, "Table 9.6.1"),
    ("Warehouse - Fine",                 0.69, "Table 9.6.1"),
    ("Warehouse - Medium/Bulky",         0.33, "Table 9.6.1"),
    ("Workshop",                         0.92, "Table 9.6.1"),
]

for _st, _lpd, _cs in _ashrae_raw:
    ASHRAE_90_1_2022_LPD[_st.lower()] = LpdAllowance(
        space_type=_st, allowed_lpd=_lpd, code_section=f"ASHRAE 90.1-2022 {_cs}"
    )


# ── CA Title 24-2022  Table 140.6-C ──────────────────────────────────────────

TITLE_24_2022_LPD: Dict[str, LpdAllowance] = {}

_t24_raw: List[tuple] = [
    ("Auditorium",                0.60, "Table 140.6-C"),
    ("Auto Repair Workshop",     0.67, "Table 140.6-C"),
    ("Classroom",                0.58, "Table 140.6-C"),
    ("Computer Room",            0.58, "Table 140.6-C"),
    ("Conference Room",          0.67, "Table 140.6-C"),
    ("Copy Room",                0.31, "Table 140.6-C"),
    ("Corridor",                 0.36, "Table 140.6-C"),
    ("Dining Area",              0.43, "Table 140.6-C"),
    ("Electrical/Mechanical",    0.36, "Table 140.6-C"),
    ("Exercise/Fitness",         0.58, "Table 140.6-C"),
    ("Exam/Treatment Room",      0.82, "Table 140.6-C"),
    ("Food Preparation",         0.72, "Table 140.6-C"),
    ("Guest Room",               0.41, "Table 140.6-C"),
    ("Kitchen",                  0.72, "Table 140.6-C"),
    ("Laboratory",               1.11, "Table 140.6-C"),
    ("Library Reading",          0.87, "Table 140.6-C"),
    ("Library Stacks",           1.10, "Table 140.6-C"),
    ("Lobby",                    0.67, "Table 140.6-C"),
    ("Locker Room",              0.41, "Table 140.6-C"),
    ("Lounge",                   0.43, "Table 140.6-C"),
    ("Manufacturing Low Bay",    0.45, "Table 140.6-C"),
    ("Manufacturing High Bay",   0.48, "Table 140.6-C"),
    ("Office ≤ 250 sf",          0.63, "Table 140.6-C"),
    ("Office > 250 sf",          0.55, "Table 140.6-C"),
    ("Open Office",              0.55, "Table 140.6-C"),
    ("Parking Garage",           0.14, "Table 140.6-C"),
    ("Pharmacy",                 0.82, "Table 140.6-C"),
    ("Restroom",                 0.48, "Table 140.6-C"),
    ("Retail",                   0.84, "Table 140.6-C"),
    ("Stairwell",                0.41, "Table 140.6-C"),
    ("Storage ≤ 50 sf",          0.41, "Table 140.6-C"),
    ("Storage > 50 sf",          0.36, "Table 140.6-C"),
    ("Warehouse",                0.33, "Table 140.6-C"),
    ("Workshop",                 0.82, "Table 140.6-C"),
]

for _st, _lpd, _cs in _t24_raw:
    TITLE_24_2022_LPD[_st.lower()] = LpdAllowance(
        space_type=_st, allowed_lpd=_lpd, code_section=f"Title 24-2022 {_cs}"
    )


# ── IECC 2021  Table C405.3.2(2) ─────────────────────────────────────────────

IECC_2021_LPD: Dict[str, LpdAllowance] = {}

_iecc_raw: List[tuple] = [
    ("Atrium - First 40 ft",            0.03, "Table C405.3.2(2)"),
    ("Audience Seating",                 0.43, "Table C405.3.2(2)"),
    ("Banking Activity Area",            0.61, "Table C405.3.2(2)"),
    ("Breakroom",                        0.46, "Table C405.3.2(2)"),
    ("Classroom",                        0.65, "Table C405.3.2(2)"),
    ("Computer Room",                    0.71, "Table C405.3.2(2)"),
    ("Conference Room",                  0.74, "Table C405.3.2(2)"),
    ("Copy Room",                        0.31, "Table C405.3.2(2)"),
    ("Corridor",                         0.41, "Table C405.3.2(2)"),
    ("Courtroom",                        0.74, "Table C405.3.2(2)"),
    ("Dining Area",                      0.43, "Table C405.3.2(2)"),
    ("Electrical/Mechanical",            0.42, "Table C405.3.2(2)"),
    ("Exam/Treatment Room",              0.90, "Table C405.3.2(2)"),
    ("Exercise Area",                    0.72, "Table C405.3.2(2)"),
    ("Food Preparation",                 0.72, "Table C405.3.2(2)"),
    ("Guest Room",                       0.41, "Table C405.3.2(2)"),
    ("Healthcare Exam",                  1.66, "Table C405.3.2(2)"),
    ("Healthcare Operating Room",        1.89, "Table C405.3.2(2)"),
    ("Healthcare Patient Room",          0.62, "Table C405.3.2(2)"),
    ("Laboratory",                       1.33, "Table C405.3.2(2)"),
    ("Laundry",                          0.53, "Table C405.3.2(2)"),
    ("Library Reading",                  0.96, "Table C405.3.2(2)"),
    ("Library Stacks",                   1.17, "Table C405.3.2(2)"),
    ("Lobby",                            0.84, "Table C405.3.2(2)"),
    ("Locker Room",                      0.52, "Table C405.3.2(2)"),
    ("Manufacturing High Bay",           0.56, "Table C405.3.2(2)"),
    ("Manufacturing Low Bay",            0.53, "Table C405.3.2(2)"),
    ("Office Enclosed",                  0.74, "Table C405.3.2(2)"),
    ("Office Open Plan",                 0.61, "Table C405.3.2(2)"),
    ("Parking Garage",                   0.15, "Table C405.3.2(2)"),
    ("Pharmacy",                         0.91, "Table C405.3.2(2)"),
    ("Restroom",                         0.63, "Table C405.3.2(2)"),
    ("Retail",                           0.84, "Table C405.3.2(2)"),
    ("Stairwell",                        0.49, "Table C405.3.2(2)"),
    ("Storage ≤ 50 sf",                  0.51, "Table C405.3.2(2)"),
    ("Storage > 50 sf",                  0.38, "Table C405.3.2(2)"),
    ("Warehouse",                        0.33, "Table C405.3.2(2)"),
    ("Workshop",                         0.92, "Table C405.3.2(2)"),
]

for _st, _lpd, _cs in _iecc_raw:
    IECC_2021_LPD[_st.lower()] = LpdAllowance(
        space_type=_st, allowed_lpd=_lpd, code_section=f"IECC 2021 {_cs}"
    )


# ── IES Illuminance Recommendations (RP-series / Handbook 10th ed.) ──────────

IES_ILLUMINANCE: Dict[str, IlluminanceRequirement] = {}

_ies_raw: List[tuple] = [
    ("Office - Open Plan",       30, 20, 50, "IES RP-1-12 Table 4.1"),
    ("Office - Private",         30, 20, 50, "IES RP-1-12 Table 4.1"),
    ("Corridor",                 10,  5, 20, "IES RP-1-12 Table 4.1"),
    ("Conference Room",          30, 20, 50, "IES RP-1-12 Table 4.1"),
    ("Classroom",                30, 20, 50, "IES RP-1-12 Table 4.1"),
    ("Laboratory",               50, 30, 75, "IES RP-1-12 Table 4.1"),
    ("Retail Sales Area",        30, 15, 50, "IES RP-1-12 Table 4.1"),
    ("Warehouse - General",      10,  5, 30, "IES RP-1-12 Table 4.1"),
    ("Warehouse - Fine",         30, 20, 50, "IES RP-1-12 Table 4.1"),
    ("Parking Area Interior",     5,  2, 10, "IES RP-20-14 Table 1"),
    ("Stairwell",                10,  5, 20, "IES RP-1-12 Table 4.1"),
    ("Restroom",                 15, 10, 30, "IES RP-1-12 Table 4.1"),
    ("Dining Area",              15, 10, 30, "IES RP-1-12 Table 4.1"),
    ("Healthcare Patient Room",  10,  5, 30, "IES RP-29-16 Table 1"),
    ("Healthcare Exam Room",     50, 30, 75, "IES RP-29-16 Table 1"),
    ("Healthcare Operating Room", 75, 50, 150, "IES RP-29-16 Table 1"),
    ("Manufacturing",            30, 20, 50, "IES RP-7-17 Table 1"),
    ("Kitchen/Food Prep",        50, 30, 75, "IES RP-1-12 Table 4.1"),
    ("Library Reading",          30, 20, 50, "IES RP-1-12 Table 4.1"),
    ("Library Stacks",           20, 10, 30, "IES RP-1-12 Table 4.1"),
    ("Lobby",                    20, 10, 30, "IES RP-1-12 Table 4.1"),
    ("Exercise Area",            30, 20, 50, "IES RP-1-12 Table 4.1"),
    ("Locker Room",              15, 10, 30, "IES RP-1-12 Table 4.1"),
    ("Guest Room",               15, 10, 30, "IES RP-28-16 Table 2"),
]

for _st, _tgt, _mn, _mx, _cs in _ies_raw:
    IES_ILLUMINANCE[_st.lower()] = IlluminanceRequirement(
        space_type=_st, target_fc=_tgt, min_fc=_mn, max_fc=_mx, code_section=_cs
    )


# ── DLC QPL v5.1  Efficacy Requirements ──────────────────────────────────────

DLC_QPL_5_1_EFFICACY: Dict[str, EfficacyRequirement] = {}

_dlc_raw: List[tuple] = [
    ("LED Troffer",         110, "DLC QPL v5.1 §3.1"),
    ("LED Panel",           110, "DLC QPL v5.1 §3.1"),
    ("LED High Bay",        120, "DLC QPL v5.1 §3.2"),
    ("LED Low Bay",         105, "DLC QPL v5.1 §3.2"),
    ("LED Downlight",       70,  "DLC QPL v5.1 §3.3"),
    ("LED Strip",           105, "DLC QPL v5.1 §3.4"),
    ("LED Wall Pack",       80,  "DLC QPL v5.1 §3.5"),
    ("LED Flood Light",     85,  "DLC QPL v5.1 §3.6"),
    ("LED Area Light",      100, "DLC QPL v5.1 §3.7"),
    ("LED Bollard",         65,  "DLC QPL v5.1 §3.8"),
    ("LED Canopy",          85,  "DLC QPL v5.1 §3.9"),
    ("LED Parking Garage",  90,  "DLC QPL v5.1 §3.10"),
    ("LED Stairwell",       80,  "DLC QPL v5.1 §3.11"),
    ("LED Vapor Tight",     95,  "DLC QPL v5.1 §3.12"),
    ("LED Track Light",     70,  "DLC QPL v5.1 §3.13"),
    ("LED Pendant",         90,  "DLC QPL v5.1 §3.14"),
    ("LED Sconce",          65,  "DLC QPL v5.1 §3.15"),
    ("LED Emergency",       45,  "DLC QPL v5.1 §3.16"),
    ("LED Exit Sign",       40,  "DLC QPL v5.1 §3.17"),
]

for _cat, _eff, _cs in _dlc_raw:
    DLC_QPL_5_1_EFFICACY[_cat.lower()] = EfficacyRequirement(
        fixture_category=_cat, min_efficacy=_eff, code_section=_cs
    )


# ── Exempt space types (no LPD limit applies) ────────────────────────────────

EXEMPT_SPACE_TYPES = frozenset({
    "dwelling unit",
    "sleeping quarters",
    "patient sleeping (acute care)",
    "theatrical performance",
    "athletic playing area",
    "display/accent (museum/gallery)",
})


# ── Standard ID constants ────────────────────────────────────────────────────

STANDARD_IDS = {
    "ASHRAE_90_1_2022": "ASHRAE 90.1-2022",
    "TITLE_24_2022": "CA Title 24-2022",
    "IES_ILLUMINANCE": "IES Illuminance",
    "DLC_QPL_5_1": "DLC QPL v5.1",
    "IECC_2021": "IECC 2021",
}


def get_lpd_table(standard_id: str) -> Optional[Dict[str, LpdAllowance]]:
    tables = {
        "ASHRAE_90_1_2022": ASHRAE_90_1_2022_LPD,
        "TITLE_24_2022": TITLE_24_2022_LPD,
        "IECC_2021": IECC_2021_LPD,
    }
    return tables.get(standard_id)


def find_lpd_allowance(standard_id: str, space_type: str) -> Optional[LpdAllowance]:
    table = get_lpd_table(standard_id)
    if table is None:
        return None
    key = space_type.strip().lower()
    if key in table:
        return table[key]
    for tkey, allowance in table.items():
        if key in tkey or tkey in key:
            return allowance
    return None


def find_illuminance(space_type: str) -> Optional[IlluminanceRequirement]:
    key = space_type.strip().lower()
    if key in IES_ILLUMINANCE:
        return IES_ILLUMINANCE[key]
    for tkey, req in IES_ILLUMINANCE.items():
        if key in tkey or tkey in key:
            return req
    return None


def find_efficacy(fixture_type: str) -> Optional[EfficacyRequirement]:
    key = fixture_type.strip().lower()
    if key in DLC_QPL_5_1_EFFICACY:
        return DLC_QPL_5_1_EFFICACY[key]
    for tkey, req in DLC_QPL_5_1_EFFICACY.items():
        if key in tkey or tkey in key:
            return req
    return None


def get_all_space_types() -> List[str]:
    space_types = set()
    for table in [ASHRAE_90_1_2022_LPD, TITLE_24_2022_LPD, IECC_2021_LPD]:
        for allowance in table.values():
            space_types.add(allowance.space_type)
    return sorted(space_types)
