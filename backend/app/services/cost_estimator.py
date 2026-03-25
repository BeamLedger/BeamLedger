"""
Cost-to-Comply Estimator & ROI Calculator

Hard-coded fixture pricing database and energy savings calculations.
No external API calls — all data is embedded.
"""

from dataclasses import dataclass, field
from typing import List, Optional

# ── Fixture Pricing Database ─────────────────────────────────────────────────
# Realistic 2024-2025 pricing for common commercial LED fixtures.
# Each entry: (fixture_type, min_price, max_price, typical_replacement_wattage)

@dataclass
class FixturePricing:
    fixture_type: str
    min_price: float
    max_price: float
    avg_price: float
    typical_wattage: float  # typical compliant replacement wattage
    dlc_listed: bool        # whether DLC QPL listed (rebate eligible)


FIXTURE_PRICING_DB: dict[str, FixturePricing] = {}

_RAW_PRICING = [
    # (type, min, max, typical_replacement_W, dlc_listed)
    ("LED Troffer",         45,   120,   30,  True),
    ("LED Panel",           40,   110,   32,  True),
    ("LED High Bay",        80,   250,  150,  True),
    ("LED Low Bay",         55,   150,   75,  True),
    ("LED Downlight",       15,    65,   12,  True),
    ("LED Strip",           10,    45,   14,  False),
    ("LED Wall Pack",       50,   180,   30,  True),
    ("LED Flood Light",     60,   220,   80,  True),
    ("LED Area Light",      90,   350,  100,  True),
    ("LED Bollard",         80,   250,   15,  True),
    ("LED Canopy",          65,   200,   45,  True),
    ("LED Parking Garage",  70,   220,   40,  True),
    ("LED Stairwell",       35,   100,   20,  True),
    ("LED Vapor Tight",     45,   130,   35,  True),
    ("LED Track Light",     20,    80,   10,  False),
    ("LED Pendant",         55,   250,   25,  True),
    ("LED Sconce",          25,    90,   10,  False),
    ("LED Emergency",       30,    85,    5,  False),
    ("LED Exit Sign",       20,    60,    2,  False),
    ("Other",               40,   150,   30,  False),
]

for _type, _min, _max, _watt, _dlc in _RAW_PRICING:
    FIXTURE_PRICING_DB[_type] = FixturePricing(
        fixture_type=_type,
        min_price=_min,
        max_price=_max,
        avg_price=round((_min + _max) / 2, 2),
        typical_wattage=_watt,
        dlc_listed=_dlc,
    )

# ── Energy defaults ──────────────────────────────────────────────────────────

DEFAULT_UTILITY_RATE = 0.12       # $/kWh
DEFAULT_ANNUAL_HOURS = 4380       # hours/year (commercial standard)
TYPICAL_REBATE_MIN = 20.0         # $/fixture
TYPICAL_REBATE_MAX = 50.0         # $/fixture


# ── Data classes ─────────────────────────────────────────────────────────────

@dataclass
class FixtureCostEstimate:
    fixture_id: str
    fixture_type: str
    fixture_name: str
    current_wattage: float
    replacement_wattage: float
    quantity: int
    replacement_cost_min: float
    replacement_cost_max: float
    replacement_cost_avg: float
    annual_energy_current_kwh: float
    annual_energy_replacement_kwh: float
    annual_energy_savings_kwh: float
    annual_cost_current: float
    annual_cost_replacement: float
    annual_savings: float
    payback_years: Optional[float]
    dlc_listed: bool
    rebate_eligible: bool
    estimated_rebate_min: float
    estimated_rebate_max: float


@dataclass
class SiteROISummary:
    total_fixtures: int
    failing_fixtures: int
    total_replacement_cost_min: float
    total_replacement_cost_max: float
    total_replacement_cost_avg: float
    total_annual_energy_current_kwh: float
    total_annual_energy_replacement_kwh: float
    total_annual_energy_savings_kwh: float
    total_annual_cost_current: float
    total_annual_cost_replacement: float
    total_annual_savings: float
    avg_payback_years: Optional[float]
    rebate_eligible_count: int
    estimated_total_rebate_min: float
    estimated_total_rebate_max: float
    fixture_estimates: List[FixtureCostEstimate]


# ── Calculator functions ─────────────────────────────────────────────────────

def estimate_fixture_cost(
    fixture_id: str,
    fixture_type: str,
    fixture_name: str,
    current_wattage: float,
    quantity: int,
    utility_rate: float = DEFAULT_UTILITY_RATE,
    annual_hours: float = DEFAULT_ANNUAL_HOURS,
) -> FixtureCostEstimate:
    """Estimate replacement cost and ROI for a single failing fixture."""
    pricing = FIXTURE_PRICING_DB.get(fixture_type, FIXTURE_PRICING_DB["Other"])

    replacement_wattage = pricing.typical_wattage
    qty = max(quantity, 1)

    # Costs
    cost_min = pricing.min_price * qty
    cost_max = pricing.max_price * qty
    cost_avg = pricing.avg_price * qty

    # Energy (kWh/yr)
    current_kwh = (current_wattage * qty * annual_hours) / 1000.0
    replacement_kwh = (replacement_wattage * qty * annual_hours) / 1000.0
    savings_kwh = current_kwh - replacement_kwh

    # Dollar amounts
    annual_cost_current = current_kwh * utility_rate
    annual_cost_replacement = replacement_kwh * utility_rate
    annual_savings = savings_kwh * utility_rate

    # Payback
    payback = None
    if annual_savings > 0:
        payback = round(cost_avg / annual_savings, 2)

    # Rebate
    dlc = pricing.dlc_listed
    rebate_min = TYPICAL_REBATE_MIN * qty if dlc else 0.0
    rebate_max = TYPICAL_REBATE_MAX * qty if dlc else 0.0

    return FixtureCostEstimate(
        fixture_id=fixture_id,
        fixture_type=fixture_type,
        fixture_name=fixture_name or fixture_type,
        current_wattage=current_wattage,
        replacement_wattage=replacement_wattage,
        quantity=qty,
        replacement_cost_min=round(cost_min, 2),
        replacement_cost_max=round(cost_max, 2),
        replacement_cost_avg=round(cost_avg, 2),
        annual_energy_current_kwh=round(current_kwh, 2),
        annual_energy_replacement_kwh=round(replacement_kwh, 2),
        annual_energy_savings_kwh=round(savings_kwh, 2),
        annual_cost_current=round(annual_cost_current, 2),
        annual_cost_replacement=round(annual_cost_replacement, 2),
        annual_savings=round(annual_savings, 2),
        payback_years=payback,
        dlc_listed=dlc,
        rebate_eligible=dlc,
        estimated_rebate_min=round(rebate_min, 2),
        estimated_rebate_max=round(rebate_max, 2),
    )


def calculate_site_roi(
    failing_fixtures: List[dict],
    total_fixture_count: int,
    utility_rate: float = DEFAULT_UTILITY_RATE,
    annual_hours: float = DEFAULT_ANNUAL_HOURS,
) -> SiteROISummary:
    """
    Calculate ROI summary for all failing fixtures at a site.

    failing_fixtures: list of dicts with keys:
        fixture_id, fixture_type, fixture_name, wattage, quantity
    """
    estimates: List[FixtureCostEstimate] = []
    for fx in failing_fixtures:
        est = estimate_fixture_cost(
            fixture_id=fx["fixture_id"],
            fixture_type=fx["fixture_type"],
            fixture_name=fx.get("fixture_name", ""),
            current_wattage=fx.get("wattage", 0) or 0,
            quantity=fx.get("quantity", 1),
            utility_rate=utility_rate,
            annual_hours=annual_hours,
        )
        estimates.append(est)

    total_cost_min = sum(e.replacement_cost_min for e in estimates)
    total_cost_max = sum(e.replacement_cost_max for e in estimates)
    total_cost_avg = sum(e.replacement_cost_avg for e in estimates)
    total_current_kwh = sum(e.annual_energy_current_kwh for e in estimates)
    total_repl_kwh = sum(e.annual_energy_replacement_kwh for e in estimates)
    total_savings_kwh = sum(e.annual_energy_savings_kwh for e in estimates)
    total_cost_current = sum(e.annual_cost_current for e in estimates)
    total_cost_repl = sum(e.annual_cost_replacement for e in estimates)
    total_savings = sum(e.annual_savings for e in estimates)
    rebate_count = sum(1 for e in estimates if e.rebate_eligible)
    rebate_min = sum(e.estimated_rebate_min for e in estimates)
    rebate_max = sum(e.estimated_rebate_max for e in estimates)

    avg_payback = None
    if total_savings > 0:
        avg_payback = round(total_cost_avg / total_savings, 2)

    return SiteROISummary(
        total_fixtures=total_fixture_count,
        failing_fixtures=len(estimates),
        total_replacement_cost_min=round(total_cost_min, 2),
        total_replacement_cost_max=round(total_cost_max, 2),
        total_replacement_cost_avg=round(total_cost_avg, 2),
        total_annual_energy_current_kwh=round(total_current_kwh, 2),
        total_annual_energy_replacement_kwh=round(total_repl_kwh, 2),
        total_annual_energy_savings_kwh=round(total_savings_kwh, 2),
        total_annual_cost_current=round(total_cost_current, 2),
        total_annual_cost_replacement=round(total_cost_repl, 2),
        total_annual_savings=round(total_savings, 2),
        avg_payback_years=avg_payback,
        rebate_eligible_count=rebate_count,
        estimated_total_rebate_min=round(rebate_min, 2),
        estimated_total_rebate_max=round(rebate_max, 2),
        fixture_estimates=estimates,
    )


def get_pricing_for_type(fixture_type: str) -> FixturePricing:
    """Look up pricing for a fixture type."""
    return FIXTURE_PRICING_DB.get(fixture_type, FIXTURE_PRICING_DB["Other"])


def get_all_pricing() -> List[FixturePricing]:
    """Return all pricing entries."""
    return list(FIXTURE_PRICING_DB.values())
