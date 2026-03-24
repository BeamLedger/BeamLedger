/**
 * Hard-coded compliance standard lookup tables.
 *
 * LPD allowances sourced from:
 *   ASHRAE 90.1-2022  Table 9.6.1  (Space-by-Space Method)
 *   CA Title 24-2022  Table 140.6-C
 *   IECC 2021         Table C405.3.2(2)
 *
 * Illuminance targets: IES Lighting Handbook 10th ed. / RP series.
 * Efficacy minimums:   DLC QPL Technical Requirements v5.1.
 */

import type { StandardId, StandardDefinition, LpdAllowance, IlluminanceRequirement, EfficacyRequirement } from "./types";

// ── Standard Definitions ─────────────────────────────────────────────────────

export const STANDARD_DEFINITIONS: Record<StandardId, StandardDefinition> = {
  ASHRAE_90_1_2022: {
    id: "ASHRAE_90_1_2022",
    name: "ASHRAE 90.1-2022",
    fullName: "ASHRAE Standard 90.1-2022: Energy Standard for Buildings",
    category: "Energy Code",
    description: "Space-by-space LPD limits for commercial buildings",
    version: "2022",
  },
  TITLE_24_2022: {
    id: "TITLE_24_2022",
    name: "CA Title 24-2022",
    fullName: "California Building Energy Efficiency Standards (Title 24, Part 6)",
    category: "Energy Code (CA)",
    description: "California-specific LPD and controls requirements",
    version: "2022",
  },
  IES_ILLUMINANCE: {
    id: "IES_ILLUMINANCE",
    name: "IES Illuminance",
    fullName: "IES Lighting Handbook & Recommended Practice Series",
    category: "Illuminance",
    description: "Target illuminance levels by space type",
    version: "10th Edition",
  },
  DLC_QPL_5_1: {
    id: "DLC_QPL_5_1",
    name: "DLC QPL v5.1",
    fullName: "DesignLights Consortium Qualified Products List v5.1",
    category: "Efficacy",
    description: "Minimum luminous efficacy by fixture category",
    version: "5.1",
  },
  IECC_2021: {
    id: "IECC_2021",
    name: "IECC 2021",
    fullName: "International Energy Conservation Code 2021",
    category: "Energy Code (Intl)",
    description: "International LPD limits for commercial buildings",
    version: "2021",
  },
};

// ── ASHRAE 90.1-2022  Table 9.6.1 ───────────────────────────────────────────

export const ASHRAE_90_1_2022_LPD: LpdAllowance[] = [
  { spaceType: "Atrium - First 40 ft", allowedLpd: 0.03, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Atrium - Above 40 ft", allowedLpd: 0.02, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Audience Seating Area - Convention", allowedLpd: 0.56, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Audience Seating Area - Gymnasium", allowedLpd: 0.23, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Audience Seating Area - Motion Picture", allowedLpd: 0.27, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Audience Seating Area - Perf. Arts", allowedLpd: 1.16, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Audience Seating Area - Religious", allowedLpd: 0.72, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Audience Seating Area - Sports Arena", allowedLpd: 0.33, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Audience Seating Area - All Other", allowedLpd: 0.43, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Banking Activity Area", allowedLpd: 0.61, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Breakroom", allowedLpd: 0.46, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Classroom/Lecture/Training - Lect.", allowedLpd: 0.71, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Classroom/Lecture/Training - All Other", allowedLpd: 0.65, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Computer Room", allowedLpd: 0.71, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Conference/Meeting/Multipurpose", allowedLpd: 0.74, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Copy/Print Room", allowedLpd: 0.31, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Corridor", allowedLpd: 0.41, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Courtroom", allowedLpd: 0.74, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Dining Area - Bar/Lounge", allowedLpd: 0.56, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Dining Area - Cafeteria/Fast Food", allowedLpd: 0.40, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Dining Area - Family", allowedLpd: 0.60, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Dining Area - Leisure", allowedLpd: 0.55, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Dining Area - All Other", allowedLpd: 0.43, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Electrical/Mechanical Room", allowedLpd: 0.42, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Emergency Vehicle Garage", allowedLpd: 0.52, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Exam/Treatment Room", allowedLpd: 0.90, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Exercise Area - Gymnasium", allowedLpd: 0.72, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Exercise Area - Fitness Center", allowedLpd: 0.72, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Food Preparation Area", allowedLpd: 0.72, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Guest Room", allowedLpd: 0.41, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Healthcare Facility Exam", allowedLpd: 1.66, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Healthcare Facility Operating Room", allowedLpd: 1.89, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Healthcare Facility Patient Room", allowedLpd: 0.62, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Laboratory - Classroom", allowedLpd: 1.11, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Laboratory - Medical/Industrial/Research", allowedLpd: 1.33, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Laundry/Washing Area", allowedLpd: 0.53, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Library - Reading Area", allowedLpd: 0.96, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Library - Stacks", allowedLpd: 1.17, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Loading Dock Interior", allowedLpd: 0.47, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Lobby - Elevator", allowedLpd: 0.64, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Lobby - Hotel", allowedLpd: 0.51, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Lobby - All Other", allowedLpd: 0.84, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Locker Room", allowedLpd: 0.52, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Manufacturing - High Bay", allowedLpd: 0.56, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Manufacturing - Low Bay", allowedLpd: 0.53, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Office - Enclosed ≤ 250 sf", allowedLpd: 0.74, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Office - Enclosed > 250 sf", allowedLpd: 0.66, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Office - Open Plan", allowedLpd: 0.61, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Parking Area Interior", allowedLpd: 0.15, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Pharmacy Area", allowedLpd: 0.91, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Restroom", allowedLpd: 0.63, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Retail Sales Area", allowedLpd: 0.84, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Stairwell", allowedLpd: 0.49, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Storage Room ≤ 50 sf", allowedLpd: 0.51, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Storage Room > 50 sf", allowedLpd: 0.38, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Warehouse - Fine", allowedLpd: 0.69, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Warehouse - Medium/Bulky", allowedLpd: 0.33, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
  { spaceType: "Workshop", allowedLpd: 0.92, codeSection: "ASHRAE 90.1-2022 Table 9.6.1" },
];

// ── CA Title 24-2022  Table 140.6-C ─────────────────────────────────────────

export const TITLE_24_2022_LPD: LpdAllowance[] = [
  { spaceType: "Auditorium", allowedLpd: 0.60, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Classroom", allowedLpd: 0.58, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Computer Room", allowedLpd: 0.58, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Conference Room", allowedLpd: 0.67, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Copy Room", allowedLpd: 0.31, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Corridor", allowedLpd: 0.36, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Dining Area", allowedLpd: 0.43, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Electrical/Mechanical", allowedLpd: 0.36, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Exercise/Fitness", allowedLpd: 0.58, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Exam/Treatment Room", allowedLpd: 0.82, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Food Preparation", allowedLpd: 0.72, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Guest Room", allowedLpd: 0.41, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Kitchen", allowedLpd: 0.72, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Laboratory", allowedLpd: 1.11, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Library Reading", allowedLpd: 0.87, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Library Stacks", allowedLpd: 1.10, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Lobby", allowedLpd: 0.67, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Locker Room", allowedLpd: 0.41, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Lounge", allowedLpd: 0.43, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Manufacturing Low Bay", allowedLpd: 0.45, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Manufacturing High Bay", allowedLpd: 0.48, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Office ≤ 250 sf", allowedLpd: 0.63, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Office > 250 sf", allowedLpd: 0.55, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Open Office", allowedLpd: 0.55, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Parking Garage", allowedLpd: 0.14, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Pharmacy", allowedLpd: 0.82, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Restroom", allowedLpd: 0.48, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Retail", allowedLpd: 0.84, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Stairwell", allowedLpd: 0.41, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Storage ≤ 50 sf", allowedLpd: 0.41, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Storage > 50 sf", allowedLpd: 0.36, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Warehouse", allowedLpd: 0.33, codeSection: "Title 24-2022 Table 140.6-C" },
  { spaceType: "Workshop", allowedLpd: 0.82, codeSection: "Title 24-2022 Table 140.6-C" },
];

// ── IECC 2021  Table C405.3.2(2) ────────────────────────────────────────────

export const IECC_2021_LPD: LpdAllowance[] = [
  { spaceType: "Audience Seating", allowedLpd: 0.43, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Banking Activity Area", allowedLpd: 0.61, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Breakroom", allowedLpd: 0.46, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Classroom", allowedLpd: 0.65, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Computer Room", allowedLpd: 0.71, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Conference Room", allowedLpd: 0.74, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Copy Room", allowedLpd: 0.31, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Corridor", allowedLpd: 0.41, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Courtroom", allowedLpd: 0.74, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Dining Area", allowedLpd: 0.43, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Electrical/Mechanical", allowedLpd: 0.42, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Exam/Treatment Room", allowedLpd: 0.90, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Exercise Area", allowedLpd: 0.72, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Food Preparation", allowedLpd: 0.72, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Guest Room", allowedLpd: 0.41, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Healthcare Exam", allowedLpd: 1.66, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Healthcare Operating Room", allowedLpd: 1.89, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Healthcare Patient Room", allowedLpd: 0.62, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Laboratory", allowedLpd: 1.33, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Laundry", allowedLpd: 0.53, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Library Reading", allowedLpd: 0.96, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Library Stacks", allowedLpd: 1.17, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Lobby", allowedLpd: 0.84, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Locker Room", allowedLpd: 0.52, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Manufacturing High Bay", allowedLpd: 0.56, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Manufacturing Low Bay", allowedLpd: 0.53, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Office Enclosed", allowedLpd: 0.74, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Office Open Plan", allowedLpd: 0.61, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Parking Garage", allowedLpd: 0.15, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Pharmacy", allowedLpd: 0.91, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Restroom", allowedLpd: 0.63, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Retail", allowedLpd: 0.84, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Stairwell", allowedLpd: 0.49, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Storage ≤ 50 sf", allowedLpd: 0.51, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Storage > 50 sf", allowedLpd: 0.38, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Warehouse", allowedLpd: 0.33, codeSection: "IECC 2021 Table C405.3.2(2)" },
  { spaceType: "Workshop", allowedLpd: 0.92, codeSection: "IECC 2021 Table C405.3.2(2)" },
];

// ── IES Illuminance Recommendations ──────────────────────────────────────────

export const IES_ILLUMINANCE_TABLE: IlluminanceRequirement[] = [
  { spaceType: "Office - Open Plan", targetFc: 30, minFc: 20, maxFc: 50, codeSection: "IES RP-1-12 Table 4.1" },
  { spaceType: "Office - Private", targetFc: 30, minFc: 20, maxFc: 50, codeSection: "IES RP-1-12 Table 4.1" },
  { spaceType: "Corridor", targetFc: 10, minFc: 5, maxFc: 20, codeSection: "IES RP-1-12 Table 4.1" },
  { spaceType: "Conference Room", targetFc: 30, minFc: 20, maxFc: 50, codeSection: "IES RP-1-12 Table 4.1" },
  { spaceType: "Classroom", targetFc: 30, minFc: 20, maxFc: 50, codeSection: "IES RP-1-12 Table 4.1" },
  { spaceType: "Laboratory", targetFc: 50, minFc: 30, maxFc: 75, codeSection: "IES RP-1-12 Table 4.1" },
  { spaceType: "Retail Sales Area", targetFc: 30, minFc: 15, maxFc: 50, codeSection: "IES RP-1-12 Table 4.1" },
  { spaceType: "Warehouse - General", targetFc: 10, minFc: 5, maxFc: 30, codeSection: "IES RP-1-12 Table 4.1" },
  { spaceType: "Parking Area Interior", targetFc: 5, minFc: 2, maxFc: 10, codeSection: "IES RP-20-14 Table 1" },
  { spaceType: "Stairwell", targetFc: 10, minFc: 5, maxFc: 20, codeSection: "IES RP-1-12 Table 4.1" },
  { spaceType: "Restroom", targetFc: 15, minFc: 10, maxFc: 30, codeSection: "IES RP-1-12 Table 4.1" },
  { spaceType: "Dining Area", targetFc: 15, minFc: 10, maxFc: 30, codeSection: "IES RP-1-12 Table 4.1" },
  { spaceType: "Healthcare Patient Room", targetFc: 10, minFc: 5, maxFc: 30, codeSection: "IES RP-29-16 Table 1" },
  { spaceType: "Healthcare Exam Room", targetFc: 50, minFc: 30, maxFc: 75, codeSection: "IES RP-29-16 Table 1" },
  { spaceType: "Healthcare Operating Room", targetFc: 75, minFc: 50, maxFc: 150, codeSection: "IES RP-29-16 Table 1" },
  { spaceType: "Manufacturing", targetFc: 30, minFc: 20, maxFc: 50, codeSection: "IES RP-7-17 Table 1" },
  { spaceType: "Kitchen/Food Prep", targetFc: 50, minFc: 30, maxFc: 75, codeSection: "IES RP-1-12 Table 4.1" },
  { spaceType: "Library Reading", targetFc: 30, minFc: 20, maxFc: 50, codeSection: "IES RP-1-12 Table 4.1" },
  { spaceType: "Library Stacks", targetFc: 20, minFc: 10, maxFc: 30, codeSection: "IES RP-1-12 Table 4.1" },
  { spaceType: "Lobby", targetFc: 20, minFc: 10, maxFc: 30, codeSection: "IES RP-1-12 Table 4.1" },
  { spaceType: "Exercise Area", targetFc: 30, minFc: 20, maxFc: 50, codeSection: "IES RP-1-12 Table 4.1" },
  { spaceType: "Locker Room", targetFc: 15, minFc: 10, maxFc: 30, codeSection: "IES RP-1-12 Table 4.1" },
  { spaceType: "Guest Room", targetFc: 15, minFc: 10, maxFc: 30, codeSection: "IES RP-28-16 Table 2" },
];

// ── DLC QPL v5.1 Efficacy Requirements ───────────────────────────────────────

export const DLC_QPL_5_1_EFFICACY: EfficacyRequirement[] = [
  { fixtureCategory: "LED Troffer", minEfficacy: 110, codeSection: "DLC QPL v5.1 §3.1" },
  { fixtureCategory: "LED Panel", minEfficacy: 110, codeSection: "DLC QPL v5.1 §3.1" },
  { fixtureCategory: "LED High Bay", minEfficacy: 120, codeSection: "DLC QPL v5.1 §3.2" },
  { fixtureCategory: "LED Low Bay", minEfficacy: 105, codeSection: "DLC QPL v5.1 §3.2" },
  { fixtureCategory: "LED Downlight", minEfficacy: 70, codeSection: "DLC QPL v5.1 §3.3" },
  { fixtureCategory: "LED Strip", minEfficacy: 105, codeSection: "DLC QPL v5.1 §3.4" },
  { fixtureCategory: "LED Wall Pack", minEfficacy: 80, codeSection: "DLC QPL v5.1 §3.5" },
  { fixtureCategory: "LED Flood Light", minEfficacy: 85, codeSection: "DLC QPL v5.1 §3.6" },
  { fixtureCategory: "LED Area Light", minEfficacy: 100, codeSection: "DLC QPL v5.1 §3.7" },
  { fixtureCategory: "LED Bollard", minEfficacy: 65, codeSection: "DLC QPL v5.1 §3.8" },
  { fixtureCategory: "LED Canopy", minEfficacy: 85, codeSection: "DLC QPL v5.1 §3.9" },
  { fixtureCategory: "LED Parking Garage", minEfficacy: 90, codeSection: "DLC QPL v5.1 §3.10" },
  { fixtureCategory: "LED Stairwell", minEfficacy: 80, codeSection: "DLC QPL v5.1 §3.11" },
  { fixtureCategory: "LED Vapor Tight", minEfficacy: 95, codeSection: "DLC QPL v5.1 §3.12" },
  { fixtureCategory: "LED Track Light", minEfficacy: 70, codeSection: "DLC QPL v5.1 §3.13" },
  { fixtureCategory: "LED Pendant", minEfficacy: 90, codeSection: "DLC QPL v5.1 §3.14" },
  { fixtureCategory: "LED Sconce", minEfficacy: 65, codeSection: "DLC QPL v5.1 §3.15" },
  { fixtureCategory: "LED Emergency", minEfficacy: 45, codeSection: "DLC QPL v5.1 §3.16" },
  { fixtureCategory: "LED Exit Sign", minEfficacy: 40, codeSection: "DLC QPL v5.1 §3.17" },
];

// ── Exempt space types ───────────────────────────────────────────────────────

export const EXEMPT_SPACE_TYPES = new Set([
  "dwelling unit",
  "sleeping quarters",
  "patient sleeping (acute care)",
  "theatrical performance",
  "athletic playing area",
  "display/accent (museum/gallery)",
]);

// ── Lookup helpers ───────────────────────────────────────────────────────────

function fuzzyMatch(needle: string, haystack: string): boolean {
  const n = needle.toLowerCase();
  const h = haystack.toLowerCase();
  return h.includes(n) || n.includes(h);
}

export function findLpdAllowance(standardId: StandardId, spaceType: string): LpdAllowance | null {
  const tables: Partial<Record<StandardId, LpdAllowance[]>> = {
    ASHRAE_90_1_2022: ASHRAE_90_1_2022_LPD,
    TITLE_24_2022: TITLE_24_2022_LPD,
    IECC_2021: IECC_2021_LPD,
  };
  const table = tables[standardId];
  if (!table) return null;
  const key = spaceType.trim().toLowerCase();
  const exact = table.find((a) => a.spaceType.toLowerCase() === key);
  if (exact) return exact;
  return table.find((a) => fuzzyMatch(key, a.spaceType.toLowerCase())) ?? null;
}

export function findIlluminance(spaceType: string): IlluminanceRequirement | null {
  const key = spaceType.trim().toLowerCase();
  const exact = IES_ILLUMINANCE_TABLE.find((r) => r.spaceType.toLowerCase() === key);
  if (exact) return exact;
  return IES_ILLUMINANCE_TABLE.find((r) => fuzzyMatch(key, r.spaceType.toLowerCase())) ?? null;
}

export function findEfficacy(fixtureType: string): EfficacyRequirement | null {
  const key = fixtureType.trim().toLowerCase();
  const exact = DLC_QPL_5_1_EFFICACY.find((r) => r.fixtureCategory.toLowerCase() === key);
  if (exact) return exact;
  return DLC_QPL_5_1_EFFICACY.find((r) => fuzzyMatch(key, r.fixtureCategory.toLowerCase())) ?? null;
}

export function getAllSpaceTypes(): string[] {
  const types: Record<string, boolean> = {};
  const tables = [ASHRAE_90_1_2022_LPD, TITLE_24_2022_LPD, IECC_2021_LPD];
  for (let t = 0; t < tables.length; t++) {
    const table = tables[t];
    for (let i = 0; i < table.length; i++) {
      types[table[i].spaceType] = true;
    }
  }
  return Object.keys(types).sort();
}
