"""
Compliance evaluation engine with zero tolerance for rounding errors.

Evaluates fixtures against ASHRAE 90.1-2022, CA Title 24-2022, IECC 2021,
IES illuminance recommendations, and DLC QPL v5.1 efficacy requirements.

All LPD calculations use float64 precision. Comparison tolerance: ±0.001 W/ft².
"""

from dataclasses import dataclass, field
from typing import List, Optional
from .standards_tables import (
    find_lpd_allowance,
    find_illuminance,
    find_efficacy,
    EXEMPT_SPACE_TYPES,
    STANDARD_IDS,
)

LPD_TOLERANCE = 0.001  # W/ft²


@dataclass
class ComplianceResult:
    id: str
    fixture_id: str
    standard: str
    standard_name: str
    code_section: str
    status: str  # "pass" | "fail" | "exempt" | "data_error"
    allowed_lpd: Optional[float]
    calculated_lpd: Optional[float]
    delta: Optional[float]
    efficacy: Optional[float]
    min_efficacy: Optional[float]
    notes: str


@dataclass
class FixtureData:
    id: str
    fixture_name: str
    fixture_type: str
    manufacturer: str
    wattage: Optional[float]
    lumen_output: Optional[float]
    cct: Optional[float]
    cri: Optional[float]
    quantity: int
    space_type: str
    space_area: Optional[float]
    applicable_standards: List[str]
    import_source: str = "manual"


def _validate_required_fields(fixture: FixtureData, standard_id: str) -> Optional[ComplianceResult]:
    """Check for missing required fields. Returns a data_error result if any are missing."""
    missing = []

    if fixture.wattage is None or fixture.wattage < 0:
        missing.append("wattage")
    if fixture.lumen_output is None or fixture.lumen_output < 0:
        missing.append("lumen_output")

    if standard_id in ("ASHRAE_90_1_2022", "TITLE_24_2022", "IECC_2021"):
        if not fixture.space_type or fixture.space_type.strip() == "":
            missing.append("space_type")
        if fixture.space_area is None or fixture.space_area <= 0:
            missing.append("space_area")

    if missing:
        return ComplianceResult(
            id=f"{fixture.id}_{standard_id}",
            fixture_id=fixture.id,
            standard=standard_id,
            standard_name=STANDARD_IDS.get(standard_id, standard_id),
            code_section="N/A",
            status="data_error",
            allowed_lpd=None,
            calculated_lpd=None,
            delta=None,
            efficacy=None,
            min_efficacy=None,
            notes=f"Missing required fields: {', '.join(missing)}. Cannot evaluate.",
        )
    return None


def evaluate_lpd(fixture: FixtureData, standard_id: str) -> ComplianceResult:
    """Evaluate a fixture against an LPD standard (ASHRAE 90.1, Title 24, IECC)."""
    std_name = STANDARD_IDS.get(standard_id, standard_id)

    # Check exempt status first
    if fixture.space_type.strip().lower() in EXEMPT_SPACE_TYPES:
        return ComplianceResult(
            id=f"{fixture.id}_{standard_id}",
            fixture_id=fixture.id,
            standard=standard_id,
            standard_name=std_name,
            code_section="Exempt",
            status="exempt",
            allowed_lpd=None,
            calculated_lpd=None,
            delta=None,
            efficacy=None,
            min_efficacy=None,
            notes=f"Space type '{fixture.space_type}' is exempt from LPD requirements under {std_name}.",
        )

    # Validate required fields
    error = _validate_required_fields(fixture, standard_id)
    if error:
        return error

    # Look up allowance
    allowance = find_lpd_allowance(standard_id, fixture.space_type)
    if allowance is None:
        return ComplianceResult(
            id=f"{fixture.id}_{standard_id}",
            fixture_id=fixture.id,
            standard=standard_id,
            standard_name=std_name,
            code_section="N/A",
            status="data_error",
            allowed_lpd=None,
            calculated_lpd=None,
            delta=None,
            efficacy=None,
            min_efficacy=None,
            notes=f"Space type '{fixture.space_type}' not found in {std_name} tables. Cannot evaluate.",
        )

    # Calculate LPD with full float64 precision
    # LPD = (wattage × quantity) / space_area
    total_wattage = float(fixture.wattage) * float(fixture.quantity)
    space_area = float(fixture.space_area)
    calculated_lpd = total_wattage / space_area
    allowed = float(allowance.allowed_lpd)
    delta = calculated_lpd - allowed

    # Compare with ±0.001 W/ft² tolerance
    if calculated_lpd <= allowed + LPD_TOLERANCE:
        status = "pass"
        notes = (
            f"LPD {calculated_lpd:.6f} W/ft² is within allowance of {allowed:.3f} W/ft² "
            f"(delta: {delta:+.6f} W/ft²). Compliant with {allowance.code_section}."
        )
    else:
        status = "fail"
        notes = (
            f"LPD {calculated_lpd:.6f} W/ft² EXCEEDS allowance of {allowed:.3f} W/ft² "
            f"by {delta:.6f} W/ft². Reduce total wattage by at least "
            f"{(delta * space_area):.2f}W to comply with {allowance.code_section}."
        )

    return ComplianceResult(
        id=f"{fixture.id}_{standard_id}",
        fixture_id=fixture.id,
        standard=standard_id,
        standard_name=std_name,
        code_section=allowance.code_section,
        status=status,
        allowed_lpd=round(allowed, 6),
        calculated_lpd=round(calculated_lpd, 6),
        delta=round(delta, 6),
        efficacy=None,
        min_efficacy=None,
        notes=notes,
    )


def evaluate_ies(fixture: FixtureData) -> ComplianceResult:
    """Evaluate against IES illuminance recommendations."""
    standard_id = "IES_ILLUMINANCE"
    std_name = "IES Illuminance"

    if not fixture.space_type or fixture.space_type.strip() == "":
        return ComplianceResult(
            id=f"{fixture.id}_{standard_id}",
            fixture_id=fixture.id,
            standard=standard_id,
            standard_name=std_name,
            code_section="N/A",
            status="data_error",
            allowed_lpd=None,
            calculated_lpd=None,
            delta=None,
            efficacy=None,
            min_efficacy=None,
            notes="Missing required field: space_type. Cannot evaluate IES illuminance.",
        )

    if fixture.lumen_output is None or fixture.lumen_output < 0:
        return ComplianceResult(
            id=f"{fixture.id}_{standard_id}",
            fixture_id=fixture.id,
            standard=standard_id,
            standard_name=std_name,
            code_section="N/A",
            status="data_error",
            allowed_lpd=None,
            calculated_lpd=None,
            delta=None,
            efficacy=None,
            min_efficacy=None,
            notes="Missing required field: lumen_output. Cannot evaluate IES illuminance.",
        )

    req = find_illuminance(fixture.space_type)
    if req is None:
        return ComplianceResult(
            id=f"{fixture.id}_{standard_id}",
            fixture_id=fixture.id,
            standard=standard_id,
            standard_name=std_name,
            code_section="N/A",
            status="data_error",
            allowed_lpd=None,
            calculated_lpd=None,
            delta=None,
            efficacy=None,
            min_efficacy=None,
            notes=f"Space type '{fixture.space_type}' not found in IES illuminance tables.",
        )

    # IES check is informational — we report the target and whether
    # the fixture's lumen output is reasonable for the space.
    # Approximate foot-candles: (lumens × CU × quantity) / area
    # Using a typical CU of 0.6 for general estimation
    cu = 0.6
    if fixture.space_area and fixture.space_area > 0:
        total_lumens = float(fixture.lumen_output) * float(fixture.quantity)
        estimated_fc = (total_lumens * cu) / float(fixture.space_area)

        if estimated_fc < req.min_fc:
            status = "fail"
            notes = (
                f"Estimated illuminance {estimated_fc:.1f} fc is below minimum "
                f"{req.min_fc} fc for '{req.space_type}'. "
                f"Target: {req.target_fc} fc ({req.code_section})."
            )
        elif estimated_fc > req.max_fc:
            status = "fail"
            notes = (
                f"Estimated illuminance {estimated_fc:.1f} fc exceeds maximum "
                f"{req.max_fc} fc for '{req.space_type}'. Consider reducing fixture count or lumens. "
                f"Target: {req.target_fc} fc ({req.code_section})."
            )
        else:
            status = "pass"
            notes = (
                f"Estimated illuminance {estimated_fc:.1f} fc is within recommended range "
                f"({req.min_fc}–{req.max_fc} fc) for '{req.space_type}'. "
                f"Target: {req.target_fc} fc ({req.code_section})."
            )
    else:
        status = "data_error"
        notes = f"Missing space_area — cannot estimate illuminance. Target for '{req.space_type}': {req.target_fc} fc."

    return ComplianceResult(
        id=f"{fixture.id}_{standard_id}",
        fixture_id=fixture.id,
        standard=standard_id,
        standard_name=std_name,
        code_section=req.code_section,
        status=status,
        allowed_lpd=None,
        calculated_lpd=None,
        delta=None,
        efficacy=None,
        min_efficacy=None,
        notes=notes,
    )


def evaluate_dlc(fixture: FixtureData) -> ComplianceResult:
    """Evaluate against DLC QPL v5.1 efficacy requirements."""
    standard_id = "DLC_QPL_5_1"
    std_name = "DLC QPL v5.1"

    if fixture.wattage is None or fixture.wattage <= 0:
        return ComplianceResult(
            id=f"{fixture.id}_{standard_id}",
            fixture_id=fixture.id,
            standard=standard_id,
            standard_name=std_name,
            code_section="N/A",
            status="data_error",
            allowed_lpd=None,
            calculated_lpd=None,
            delta=None,
            efficacy=None,
            min_efficacy=None,
            notes="Missing or zero wattage. Cannot calculate efficacy.",
        )

    if fixture.lumen_output is None or fixture.lumen_output < 0:
        return ComplianceResult(
            id=f"{fixture.id}_{standard_id}",
            fixture_id=fixture.id,
            standard=standard_id,
            standard_name=std_name,
            code_section="N/A",
            status="data_error",
            allowed_lpd=None,
            calculated_lpd=None,
            delta=None,
            efficacy=None,
            min_efficacy=None,
            notes="Missing lumen_output. Cannot calculate efficacy.",
        )

    req = find_efficacy(fixture.fixture_type)
    if req is None:
        return ComplianceResult(
            id=f"{fixture.id}_{standard_id}",
            fixture_id=fixture.id,
            standard=standard_id,
            standard_name=std_name,
            code_section="N/A",
            status="data_error",
            allowed_lpd=None,
            calculated_lpd=None,
            delta=None,
            efficacy=None,
            min_efficacy=None,
            notes=f"Fixture type '{fixture.fixture_type}' not found in DLC QPL v5.1 categories.",
        )

    efficacy = float(fixture.lumen_output) / float(fixture.wattage)
    min_eff = float(req.min_efficacy)

    if efficacy >= min_eff:
        status = "pass"
        notes = (
            f"Efficacy {efficacy:.2f} lm/W meets minimum {min_eff:.0f} lm/W "
            f"for {req.fixture_category} ({req.code_section})."
        )
    else:
        status = "fail"
        notes = (
            f"Efficacy {efficacy:.2f} lm/W is below minimum {min_eff:.0f} lm/W "
            f"for {req.fixture_category}. Shortfall: {(min_eff - efficacy):.2f} lm/W "
            f"({req.code_section})."
        )

    return ComplianceResult(
        id=f"{fixture.id}_{standard_id}",
        fixture_id=fixture.id,
        standard=standard_id,
        standard_name=std_name,
        code_section=req.code_section,
        status=status,
        allowed_lpd=None,
        calculated_lpd=None,
        delta=None,
        efficacy=round(efficacy, 6),
        min_efficacy=min_eff,
        notes=notes,
    )


def evaluate_fixture_full(fixture: FixtureData) -> List[ComplianceResult]:
    """
    Evaluate a fixture against all its applicable standards.
    Returns a list of ComplianceResult — one per standard.
    Never returns generic "non-compliant"; every failure includes cause.
    """
    results: List[ComplianceResult] = []

    for std_id in fixture.applicable_standards:
        if std_id in ("ASHRAE_90_1_2022", "TITLE_24_2022", "IECC_2021"):
            results.append(evaluate_lpd(fixture, std_id))
        elif std_id == "IES_ILLUMINANCE":
            results.append(evaluate_ies(fixture))
        elif std_id == "DLC_QPL_5_1":
            results.append(evaluate_dlc(fixture))
        else:
            results.append(ComplianceResult(
                id=f"{fixture.id}_{std_id}",
                fixture_id=fixture.id,
                standard=std_id,
                standard_name=std_id,
                code_section="N/A",
                status="data_error",
                allowed_lpd=None,
                calculated_lpd=None,
                delta=None,
                efficacy=None,
                min_efficacy=None,
                notes=f"Unknown standard '{std_id}'. Cannot evaluate.",
            ))

    return results


def compute_overall_status(results: List[ComplianceResult]) -> str:
    """Derive an overall status from individual results."""
    if not results:
        return "data_error"
    statuses = {r.status for r in results}
    if "fail" in statuses:
        return "fail"
    if "data_error" in statuses:
        return "data_error"
    if statuses == {"exempt"}:
        return "exempt"
    return "pass"


def compute_compliance_score(results: List[ComplianceResult]) -> int:
    """
    Compute a 0-100 compliance score.
    Each result contributes equally. pass=100, exempt=100, fail=0, data_error=0.
    """
    if not results:
        return 0
    score_map = {"pass": 100, "exempt": 100, "fail": 0, "data_error": 0}
    total = sum(score_map.get(r.status, 0) for r in results)
    return round(total / len(results))
