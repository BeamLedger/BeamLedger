"""
Unit tests for the compliance engine.

Covers: pass, fail, boundary value, missing field, and exempt-space scenarios
for ASHRAE 90.1-2022 LPD, Title 24, IECC, IES illuminance, and DLC efficacy.
"""

import pytest
from app.services.compliance_engine import (
    FixtureData,
    evaluate_lpd,
    evaluate_ies,
    evaluate_dlc,
    evaluate_fixture_full,
    compute_overall_status,
    compute_compliance_score,
    LPD_TOLERANCE,
)


def _make_fixture(**overrides) -> FixtureData:
    defaults = dict(
        id="TEST-001",
        fixture_name="Test Fixture",
        fixture_type="LED Troffer",
        manufacturer="TestCo",
        wattage=40.0,
        lumen_output=4400.0,
        cct=4000.0,
        cri=82.0,
        quantity=10,
        space_type="Office - Open Plan",
        space_area=800.0,
        applicable_standards=["ASHRAE_90_1_2022"],
        import_source="manual",
    )
    defaults.update(overrides)
    return FixtureData(**defaults)


# ══════════════════════════════════════════════════════════════════════════════
#  ASHRAE 90.1-2022  LPD Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestAshraeLpd:
    """Office - Open Plan has an allowance of 0.61 W/ft²."""

    def test_pass_under_allowance(self):
        """10 fixtures × 40W / 800 ft² = 0.5 W/ft² → PASS (under 0.61)."""
        fx = _make_fixture(wattage=40.0, quantity=10, space_area=800.0)
        result = evaluate_lpd(fx, "ASHRAE_90_1_2022")
        assert result.status == "pass"
        assert result.calculated_lpd is not None
        assert abs(result.calculated_lpd - 0.5) < 1e-6
        assert result.allowed_lpd == 0.61

    def test_fail_over_allowance(self):
        """10 fixtures × 60W / 800 ft² = 0.75 W/ft² → FAIL (over 0.61)."""
        fx = _make_fixture(wattage=60.0, quantity=10, space_area=800.0)
        result = evaluate_lpd(fx, "ASHRAE_90_1_2022")
        assert result.status == "fail"
        assert result.calculated_lpd is not None
        assert abs(result.calculated_lpd - 0.75) < 1e-6
        assert result.delta is not None
        assert result.delta > 0
        assert "EXCEEDS" in result.notes

    def test_boundary_exactly_at_limit(self):
        """Exactly at allowance → PASS (within tolerance)."""
        # 0.61 W/ft² × 800 ft² = 488W total / 10 fixtures = 48.8W each
        fx = _make_fixture(wattage=48.8, quantity=10, space_area=800.0)
        result = evaluate_lpd(fx, "ASHRAE_90_1_2022")
        assert result.status == "pass"
        expected_lpd = (48.8 * 10) / 800.0
        assert abs(result.calculated_lpd - expected_lpd) < 1e-6

    def test_boundary_just_over_tolerance(self):
        """LPD exceeds allowance by more than tolerance → FAIL."""
        # 0.61 + 0.002 = 0.612 W/ft² → 0.612 × 800 = 489.6W / 10 = 48.96W
        fx = _make_fixture(wattage=48.96, quantity=10, space_area=800.0)
        result = evaluate_lpd(fx, "ASHRAE_90_1_2022")
        calculated = (48.96 * 10) / 800.0  # 0.612
        assert calculated > 0.61 + LPD_TOLERANCE
        assert result.status == "fail"

    def test_boundary_within_tolerance(self):
        """LPD exceeds allowance by less than tolerance → PASS."""
        # 0.61 + 0.0005 = 0.6105 → 0.6105 × 800 = 488.4W / 10 = 48.84W
        fx = _make_fixture(wattage=48.84, quantity=10, space_area=800.0)
        result = evaluate_lpd(fx, "ASHRAE_90_1_2022")
        calculated = (48.84 * 10) / 800.0  # 0.6105
        assert calculated <= 0.61 + LPD_TOLERANCE
        assert result.status == "pass"


class TestTitle24Lpd:
    """Title 24 Corridor has allowance of 0.36 W/ft²."""

    def test_pass_corridor(self):
        fx = _make_fixture(
            space_type="Corridor",
            wattage=10.0,
            quantity=4,
            space_area=120.0,
            applicable_standards=["TITLE_24_2022"],
        )
        result = evaluate_lpd(fx, "TITLE_24_2022")
        # 40 / 120 = 0.333 W/ft²
        assert result.status == "pass"
        assert result.allowed_lpd == 0.36

    def test_fail_corridor(self):
        fx = _make_fixture(
            space_type="Corridor",
            wattage=20.0,
            quantity=4,
            space_area=120.0,
            applicable_standards=["TITLE_24_2022"],
        )
        result = evaluate_lpd(fx, "TITLE_24_2022")
        # 80 / 120 = 0.667 W/ft²
        assert result.status == "fail"


class TestIeccLpd:
    def test_pass_warehouse(self):
        fx = _make_fixture(
            space_type="Warehouse",
            wattage=50.0,
            quantity=5,
            space_area=3000.0,
            applicable_standards=["IECC_2021"],
        )
        result = evaluate_lpd(fx, "IECC_2021")
        # 250 / 3000 = 0.083 W/ft² → PASS (0.33 allowed)
        assert result.status == "pass"


# ══════════════════════════════════════════════════════════════════════════════
#  Missing / Invalid Field Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestMissingFields:
    def test_missing_wattage(self):
        fx = _make_fixture(wattage=None)
        result = evaluate_lpd(fx, "ASHRAE_90_1_2022")
        assert result.status == "data_error"
        assert "wattage" in result.notes

    def test_missing_lumen_output(self):
        fx = _make_fixture(lumen_output=None)
        result = evaluate_lpd(fx, "ASHRAE_90_1_2022")
        assert result.status == "data_error"
        assert "lumen_output" in result.notes

    def test_missing_space_type(self):
        fx = _make_fixture(space_type="")
        result = evaluate_lpd(fx, "ASHRAE_90_1_2022")
        assert result.status == "data_error"
        assert "space_type" in result.notes

    def test_missing_space_area(self):
        fx = _make_fixture(space_area=None)
        result = evaluate_lpd(fx, "ASHRAE_90_1_2022")
        assert result.status == "data_error"
        assert "space_area" in result.notes

    def test_zero_space_area(self):
        fx = _make_fixture(space_area=0)
        result = evaluate_lpd(fx, "ASHRAE_90_1_2022")
        assert result.status == "data_error"

    def test_negative_wattage(self):
        fx = _make_fixture(wattage=-10)
        result = evaluate_lpd(fx, "ASHRAE_90_1_2022")
        assert result.status == "data_error"

    def test_unknown_space_type(self):
        fx = _make_fixture(space_type="Underwater Cave")
        result = evaluate_lpd(fx, "ASHRAE_90_1_2022")
        assert result.status == "data_error"
        assert "not found" in result.notes

    def test_multiple_missing_fields(self):
        fx = _make_fixture(wattage=None, lumen_output=None, space_type="", space_area=None)
        result = evaluate_lpd(fx, "ASHRAE_90_1_2022")
        assert result.status == "data_error"
        assert "wattage" in result.notes
        assert "space_type" in result.notes


# ══════════════════════════════════════════════════════════════════════════════
#  Exempt Space Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestExemptSpaces:
    def test_dwelling_unit_exempt(self):
        fx = _make_fixture(space_type="dwelling unit")
        result = evaluate_lpd(fx, "ASHRAE_90_1_2022")
        assert result.status == "exempt"
        assert "exempt" in result.notes.lower()

    def test_theatrical_exempt(self):
        fx = _make_fixture(space_type="theatrical performance")
        result = evaluate_lpd(fx, "ASHRAE_90_1_2022")
        assert result.status == "exempt"

    def test_athletic_playing_area_exempt(self):
        fx = _make_fixture(space_type="athletic playing area")
        result = evaluate_lpd(fx, "TITLE_24_2022")
        assert result.status == "exempt"


# ══════════════════════════════════════════════════════════════════════════════
#  DLC Efficacy Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestDlcEfficacy:
    def test_pass_led_troffer(self):
        """4400 lm / 40W = 110 lm/W → meets 110 lm/W minimum."""
        fx = _make_fixture(wattage=40.0, lumen_output=4400.0, fixture_type="LED Troffer")
        result = evaluate_dlc(fx)
        assert result.status == "pass"
        assert result.efficacy is not None
        assert abs(result.efficacy - 110.0) < 0.01
        assert result.min_efficacy == 110

    def test_fail_led_troffer_low_efficacy(self):
        """3000 lm / 40W = 75 lm/W → below 110 lm/W minimum."""
        fx = _make_fixture(wattage=40.0, lumen_output=3000.0, fixture_type="LED Troffer")
        result = evaluate_dlc(fx)
        assert result.status == "fail"
        assert "below minimum" in result.notes

    def test_pass_led_downlight(self):
        """1000 lm / 10W = 100 lm/W → meets 70 lm/W minimum."""
        fx = _make_fixture(wattage=10.0, lumen_output=1000.0, fixture_type="LED Downlight")
        result = evaluate_dlc(fx)
        assert result.status == "pass"
        assert result.min_efficacy == 70

    def test_missing_wattage_dlc(self):
        fx = _make_fixture(wattage=None)
        result = evaluate_dlc(fx)
        assert result.status == "data_error"

    def test_zero_wattage_dlc(self):
        fx = _make_fixture(wattage=0)
        result = evaluate_dlc(fx)
        assert result.status == "data_error"

    def test_unknown_fixture_type_dlc(self):
        fx = _make_fixture(fixture_type="Magic Lantern")
        result = evaluate_dlc(fx)
        assert result.status == "data_error"
        assert "not found" in result.notes


# ══════════════════════════════════════════════════════════════════════════════
#  IES Illuminance Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestIesIlluminance:
    def test_pass_office(self):
        """10 fixtures × 4400 lm × 0.6 CU / 800 ft² = 33 fc → in range (20–50)."""
        fx = _make_fixture(
            space_type="Office - Open Plan",
            lumen_output=4400.0,
            quantity=10,
            space_area=800.0,
            applicable_standards=["IES_ILLUMINANCE"],
        )
        result = evaluate_ies(fx)
        assert result.status == "pass"
        expected_fc = (4400 * 10 * 0.6) / 800
        assert f"{expected_fc:.1f}" in result.notes

    def test_fail_below_minimum(self):
        """1 fixture × 500 lm × 0.6 / 800 ft² = 0.375 fc → below min 20 fc."""
        fx = _make_fixture(
            space_type="Office - Open Plan",
            lumen_output=500.0,
            quantity=1,
            space_area=800.0,
        )
        result = evaluate_ies(fx)
        assert result.status == "fail"
        assert "below minimum" in result.notes

    def test_fail_above_maximum(self):
        """50 fixtures × 10000 lm × 0.6 / 800 ft² = 375 fc → above max 50 fc."""
        fx = _make_fixture(
            space_type="Office - Open Plan",
            lumen_output=10000.0,
            quantity=50,
            space_area=800.0,
        )
        result = evaluate_ies(fx)
        assert result.status == "fail"
        assert "exceeds maximum" in result.notes

    def test_missing_space_type_ies(self):
        fx = _make_fixture(space_type="")
        result = evaluate_ies(fx)
        assert result.status == "data_error"

    def test_missing_lumens_ies(self):
        fx = _make_fixture(lumen_output=None)
        result = evaluate_ies(fx)
        assert result.status == "data_error"

    def test_missing_area_ies(self):
        fx = _make_fixture(space_area=None)
        result = evaluate_ies(fx)
        assert result.status == "data_error"
        assert "spaceArea" in result.notes or "space_area" in result.notes.lower() or "Missing" in result.notes


# ══════════════════════════════════════════════════════════════════════════════
#  Full Evaluation + Score Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestFullEvaluation:
    def test_multi_standard_all_pass(self):
        fx = _make_fixture(
            wattage=40.0,
            lumen_output=4400.0,
            quantity=10,
            space_area=800.0,
            fixture_type="LED Troffer",
            applicable_standards=["ASHRAE_90_1_2022", "DLC_QPL_5_1"],
        )
        results = evaluate_fixture_full(fx)
        assert len(results) == 2
        assert all(r.status == "pass" for r in results)
        assert compute_overall_status(results) == "pass"
        assert compute_compliance_score(results) == 100

    def test_multi_standard_mixed(self):
        """ASHRAE pass but DLC fail due to low efficacy."""
        fx = _make_fixture(
            wattage=40.0,
            lumen_output=3000.0,  # 75 lm/W → below 110 for troffer
            quantity=10,
            space_area=800.0,
            fixture_type="LED Troffer",
            applicable_standards=["ASHRAE_90_1_2022", "DLC_QPL_5_1"],
        )
        results = evaluate_fixture_full(fx)
        assert len(results) == 2
        statuses = {r.standard: r.status for r in results}
        assert statuses["ASHRAE_90_1_2022"] == "pass"
        assert statuses["DLC_QPL_5_1"] == "fail"
        assert compute_overall_status(results) == "fail"
        assert compute_compliance_score(results) == 50

    def test_all_exempt(self):
        fx = _make_fixture(
            space_type="dwelling unit",
            applicable_standards=["ASHRAE_90_1_2022", "TITLE_24_2022"],
        )
        results = evaluate_fixture_full(fx)
        assert all(r.status == "exempt" for r in results)
        assert compute_overall_status(results) == "exempt"
        assert compute_compliance_score(results) == 100

    def test_no_standards(self):
        fx = _make_fixture(applicable_standards=[])
        results = evaluate_fixture_full(fx)
        assert len(results) == 0
        assert compute_overall_status(results) == "data_error"
        assert compute_compliance_score(results) == 0

    def test_unknown_standard(self):
        fx = _make_fixture(applicable_standards=["UNKNOWN_STD"])
        results = evaluate_fixture_full(fx)
        assert len(results) == 1
        assert results[0].status == "data_error"
        assert "Unknown standard" in results[0].notes

    def test_data_error_in_mix(self):
        """If one standard produces data_error, overall is data_error (not fail)."""
        fx = _make_fixture(
            wattage=40.0,
            lumen_output=4400.0,
            quantity=10,
            space_area=800.0,
            fixture_type="LED Troffer",
            applicable_standards=["ASHRAE_90_1_2022", "UNKNOWN_STD"],
        )
        results = evaluate_fixture_full(fx)
        assert compute_overall_status(results) == "data_error"


# ══════════════════════════════════════════════════════════════════════════════
#  Float Precision Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestFloatPrecision:
    def test_no_floating_point_drift(self):
        """Verify that LPD calculations maintain float64 precision."""
        # 33W × 3 / 100 ft² = 0.99 W/ft² exactly
        fx = _make_fixture(
            wattage=33.0,
            quantity=3,
            space_area=100.0,
            space_type="Laboratory - Medical/Industrial/Research",  # 1.33 W/ft² allowed
        )
        result = evaluate_lpd(fx, "ASHRAE_90_1_2022")
        assert result.status == "pass"
        assert result.calculated_lpd == 0.99

    def test_precision_at_six_decimals(self):
        """LPD should be computed to at least 6 decimal places."""
        fx = _make_fixture(
            wattage=7.0,
            quantity=7,
            space_area=113.0,
            space_type="Office - Open Plan",
        )
        result = evaluate_lpd(fx, "ASHRAE_90_1_2022")
        assert result.calculated_lpd is not None
        # 49 / 113 = 0.433628...
        expected = round(49.0 / 113.0, 6)
        assert result.calculated_lpd == expected
