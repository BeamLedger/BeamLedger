from typing import Dict, Any, Tuple
from ..models.fixture import Fixture
from ..models.rule import Rule


def evaluate_fixture(fixture: Fixture, rule: Rule) -> Tuple[str, Dict[str, Any]]:
    """
    Evaluate a fixture against an ordinance rule.
    Returns a status ("pass", "warn", "fail") and a dict of reasons.
    """
    reasons: Dict[str, Any] = {}
    status = "pass"

    # Check CCT
    if rule.max_cct is not None and fixture.cct is not None:
        if fixture.cct > rule.max_cct:
            reasons["cct"] = f"CCT {fixture.cct}K exceeds maximum {rule.max_cct}K"
            status = "fail"

    # Check lumens
    if rule.max_lumens is not None and fixture.lumens is not None:
        if fixture.lumens > rule.max_lumens:
            reasons["lumens"] = f"Lumens {fixture.lumens} exceeds maximum {rule.max_lumens}"
            status = "fail"

    # Check shielding
    if rule.require_full_cutoff:
        # Expect shielding field contains "full" (very naive)
        if not fixture.shielding or "full" not in fixture.shielding.lower():
            reasons["shielding"] = "Full cutoff shielding is required"
            status = "fail"

    # Check tilt
    if rule.max_tilt is not None and fixture.tilt is not None:
        if fixture.tilt > rule.max_tilt:
            reasons["tilt"] = f"Tilt {fixture.tilt}° exceeds maximum {rule.max_tilt}°"
            status = "fail"

    # If there are reasons but not critical, mark as warn (future extension)
    if reasons and status == "pass":
        status = "warn"

    return status, reasons