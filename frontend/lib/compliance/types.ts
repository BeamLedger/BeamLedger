// ─── Core domain types ──────────────────────────────────────────────────────

export interface Fixture {
  id: string;
  assetTag: string;
  fixtureName: string;
  manufacturer: string;
  model: string;
  fixtureType: FixtureType;
  wattage: number;
  lumenOutput: number;
  cct: number;
  cri: number;
  quantity: number;
  spaceType: string;
  spaceArea: number;
  applicableStandards: StandardId[];
  importSource: "manual" | "csv" | "xlsx";
  importedAt: string;
  notes: string;
}

export type FixtureType =
  | "LED Troffer"
  | "LED Panel"
  | "LED High Bay"
  | "LED Low Bay"
  | "LED Downlight"
  | "LED Strip"
  | "LED Wall Pack"
  | "LED Flood Light"
  | "LED Area Light"
  | "LED Bollard"
  | "LED Canopy"
  | "LED Parking Garage"
  | "LED Stairwell"
  | "LED Vapor Tight"
  | "LED Track Light"
  | "LED Pendant"
  | "LED Sconce"
  | "LED Emergency"
  | "LED Exit Sign"
  | "Other";

export const FIXTURE_TYPES: FixtureType[] = [
  "LED Troffer",
  "LED Panel",
  "LED High Bay",
  "LED Low Bay",
  "LED Downlight",
  "LED Strip",
  "LED Wall Pack",
  "LED Flood Light",
  "LED Area Light",
  "LED Bollard",
  "LED Canopy",
  "LED Parking Garage",
  "LED Stairwell",
  "LED Vapor Tight",
  "LED Track Light",
  "LED Pendant",
  "LED Sconce",
  "LED Emergency",
  "LED Exit Sign",
  "Other",
];

// ─── Standards ──────────────────────────────────────────────────────────────

export type StandardId =
  | "ASHRAE_90_1_2022"
  | "TITLE_24_2022"
  | "IES_ILLUMINANCE"
  | "DLC_QPL_5_1"
  | "IECC_2021";

export interface StandardDefinition {
  id: StandardId;
  name: string;
  fullName: string;
  category: "Energy Code" | "Energy Code (CA)" | "Illuminance" | "Efficacy" | "Energy Code (Intl)";
  description: string;
  version: string;
}

// ─── LPD Tables ─────────────────────────────────────────────────────────────

export interface LpdAllowance {
  spaceType: string;
  allowedLpd: number;      // W/ft²
  codeSection: string;
  notes?: string;
}

export interface IlluminanceRequirement {
  spaceType: string;
  targetFc: number;         // foot-candles
  minFc: number;
  maxFc: number;
  codeSection: string;
}

export interface EfficacyRequirement {
  fixtureCategory: string;
  minEfficacy: number;      // lm/W
  codeSection: string;
}

// ─── Compliance results ─────────────────────────────────────────────────────

export type ComplianceStatus = "pass" | "fail" | "exempt" | "data_error";

export interface ComplianceResult {
  id: string;
  fixtureId: string;
  standard: StandardId;
  standardName: string;
  codeSection: string;
  status: ComplianceStatus;
  allowedLpd: number | null;
  calculatedLpd: number | null;
  delta: number | null;
  efficacy: number | null;
  minEfficacy: number | null;
  notes: string;
}

export interface FixtureEvaluation {
  fixtureId: string;
  fixture: Fixture;
  results: ComplianceResult[];
  overallStatus: ComplianceStatus;
  timestamp: string;
}

// ─── Import types ───────────────────────────────────────────────────────────

export type ImportRowOutcome = "imported" | "skipped" | "corrected";

export interface ImportRowResult {
  rowNumber: number;
  outcome: ImportRowOutcome;
  fieldErrors: Record<string, string>;
  warnings: string[];
  fixture?: Fixture;
}

export interface ImportAuditEntry {
  id: string;
  timestamp: string;
  fileName: string;
  rowCount: number;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
}

// ─── Search / Filter ────────────────────────────────────────────────────────

export interface SearchFilters {
  query: string;
  complianceStatus: ComplianceStatus[];
  standards: StandardId[];
  importSource: ("manual" | "csv" | "xlsx")[];
  dateRange: { from: string; to: string } | null;
}

export type SortField = "complianceScore" | "importedAt" | "fixtureName";
export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}
