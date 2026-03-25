"""Tests for cost estimator and ROI calculator."""

import pytest
from app.services.cost_estimator import (
    estimate_fixture_cost,
    calculate_site_roi,
    get_pricing_for_type,
    get_all_pricing,
    FIXTURE_PRICING_DB,
    DEFAULT_UTILITY_RATE,
    DEFAULT_ANNUAL_HOURS,
)


class TestFixturePricingDatabase:
    def test_has_20_plus_entries(self):
        assert len(FIXTURE_PRICING_DB) >= 20

    def test_all_prices_positive(self):
        for p in FIXTURE_PRICING_DB.values():
            assert p.min_price > 0
            assert p.max_price > 0
            assert p.avg_price > 0
            assert p.min_price <= p.max_price

    def test_avg_is_midpoint(self):
        for p in FIXTURE_PRICING_DB.values():
            expected = round((p.min_price + p.max_price) / 2, 2)
            assert p.avg_price == expected

    def test_typical_wattage_positive(self):
        for p in FIXTURE_PRICING_DB.values():
            assert p.typical_wattage > 0

    def test_lookup_known_type(self):
        p = get_pricing_for_type("LED Troffer")
        assert p.fixture_type == "LED Troffer"
        assert p.min_price == 45
        assert p.max_price == 120
        assert p.dlc_listed is True

    def test_lookup_unknown_falls_back_to_other(self):
        p = get_pricing_for_type("Alien Glow Tube")
        assert p.fixture_type == "Other"

    def test_get_all_pricing(self):
        all_p = get_all_pricing()
        assert len(all_p) == len(FIXTURE_PRICING_DB)


class TestEstimateFixtureCost:
    def test_basic_estimate(self):
        est = estimate_fixture_cost(
            fixture_id="FX-1",
            fixture_type="LED Troffer",
            fixture_name="Test Troffer",
            current_wattage=60,
            quantity=1,
        )
        assert est.fixture_id == "FX-1"
        assert est.current_wattage == 60
        assert est.replacement_wattage == 30  # from pricing DB
        assert est.replacement_cost_min == 45
        assert est.replacement_cost_max == 120
        assert est.annual_energy_savings_kwh > 0
        assert est.annual_savings > 0
        assert est.payback_years is not None
        assert est.payback_years > 0
        assert est.dlc_listed is True
        assert est.rebate_eligible is True

    def test_quantity_multiplies(self):
        est1 = estimate_fixture_cost("FX-1", "LED Troffer", "T", 60, quantity=1)
        est5 = estimate_fixture_cost("FX-1", "LED Troffer", "T", 60, quantity=5)
        assert est5.replacement_cost_avg == est1.replacement_cost_avg * 5
        assert est5.annual_savings == pytest.approx(est1.annual_savings * 5, abs=0.02)

    def test_energy_calculation(self):
        est = estimate_fixture_cost(
            "FX-1", "LED Troffer", "T",
            current_wattage=100,
            quantity=1,
            utility_rate=0.10,
            annual_hours=1000,
        )
        # Current: 100W * 1000hr / 1000 = 100 kWh
        assert est.annual_energy_current_kwh == 100.0
        # Replacement: 30W * 1000hr / 1000 = 30 kWh
        assert est.annual_energy_replacement_kwh == 30.0
        # Savings: 70 kWh * $0.10 = $7.00
        assert est.annual_savings == 7.0

    def test_payback_calculation(self):
        est = estimate_fixture_cost(
            "FX-1", "LED Troffer", "T",
            current_wattage=100,
            quantity=1,
            utility_rate=0.10,
            annual_hours=1000,
        )
        # avg cost = (45+120)/2 = 82.5, savings = $7.0
        # payback = 82.5 / 7.0 = 11.79
        assert est.payback_years == round(82.5 / 7.0, 2)

    def test_no_savings_no_payback(self):
        # If replacement wattage >= current wattage, savings <= 0
        est = estimate_fixture_cost(
            "FX-1", "LED Troffer", "T",
            current_wattage=10,  # less than typical 30W replacement
            quantity=1,
        )
        assert est.annual_energy_savings_kwh < 0
        assert est.payback_years is None

    def test_non_dlc_no_rebate(self):
        est = estimate_fixture_cost("FX-1", "LED Strip", "S", 20, 1)
        assert est.dlc_listed is False
        assert est.rebate_eligible is False
        assert est.estimated_rebate_min == 0
        assert est.estimated_rebate_max == 0

    def test_dlc_rebate_with_quantity(self):
        est = estimate_fixture_cost("FX-1", "LED High Bay", "HB", 400, 10)
        assert est.dlc_listed is True
        assert est.estimated_rebate_min == 20.0 * 10
        assert est.estimated_rebate_max == 50.0 * 10

    def test_custom_utility_rate(self):
        est_low = estimate_fixture_cost("FX-1", "LED Troffer", "T", 60, 1, utility_rate=0.05)
        est_high = estimate_fixture_cost("FX-1", "LED Troffer", "T", 60, 1, utility_rate=0.20)
        assert est_high.annual_savings > est_low.annual_savings


class TestSiteROI:
    def test_empty_failing_list(self):
        roi = calculate_site_roi([], total_fixture_count=10)
        assert roi.total_fixtures == 10
        assert roi.failing_fixtures == 0
        assert roi.total_replacement_cost_avg == 0
        assert roi.total_annual_savings == 0
        assert roi.avg_payback_years is None

    def test_single_failing(self):
        roi = calculate_site_roi(
            [{"fixture_id": "1", "fixture_type": "LED Troffer", "fixture_name": "T1", "wattage": 60, "quantity": 1}],
            total_fixture_count=5,
        )
        assert roi.total_fixtures == 5
        assert roi.failing_fixtures == 1
        assert roi.total_replacement_cost_avg > 0
        assert roi.total_annual_savings > 0
        assert len(roi.fixture_estimates) == 1

    def test_multiple_failing(self):
        fixtures = [
            {"fixture_id": "1", "fixture_type": "LED Troffer", "wattage": 60, "quantity": 2},
            {"fixture_id": "2", "fixture_type": "LED High Bay", "wattage": 400, "quantity": 1},
            {"fixture_id": "3", "fixture_type": "LED Downlight", "wattage": 30, "quantity": 10},
        ]
        roi = calculate_site_roi(fixtures, total_fixture_count=20)
        assert roi.failing_fixtures == 3
        assert len(roi.fixture_estimates) == 3
        # Total cost should be sum of individual estimates
        individual_sum = sum(e.replacement_cost_avg for e in roi.fixture_estimates)
        assert roi.total_replacement_cost_avg == round(individual_sum, 2)

    def test_rebate_eligible_count(self):
        fixtures = [
            {"fixture_id": "1", "fixture_type": "LED Troffer", "wattage": 60, "quantity": 1},    # DLC
            {"fixture_id": "2", "fixture_type": "LED Strip", "wattage": 20, "quantity": 1},       # not DLC
            {"fixture_id": "3", "fixture_type": "LED High Bay", "wattage": 400, "quantity": 1},   # DLC
        ]
        roi = calculate_site_roi(fixtures, total_fixture_count=10)
        assert roi.rebate_eligible_count == 2

    def test_custom_rates(self):
        fixtures = [
            {"fixture_id": "1", "fixture_type": "LED Troffer", "wattage": 60, "quantity": 1},
        ]
        roi_cheap = calculate_site_roi(fixtures, 5, utility_rate=0.05)
        roi_expensive = calculate_site_roi(fixtures, 5, utility_rate=0.25)
        assert roi_expensive.total_annual_savings > roi_cheap.total_annual_savings
