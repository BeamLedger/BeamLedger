export interface ComplianceCheck {
  id: string;
  productName: string;
  productType: string;
  manufacturer: string;
  date: string;
  status: "passed" | "failed" | "partial";
  overallScore: number;
  standards: StandardCheck[];
}

export interface StandardCheck {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "passed" | "failed" | "pending";
  score: number;
  details: string;
}

export const mockComplianceChecks: ComplianceCheck[] = [
  {
    id: "1",
    productName: "SmartGlow LED Street Light",
    productType: "Outdoor LED Lighting",
    manufacturer: "BrightTech Solutions",
    date: "2026-03-15",
    status: "passed",
    overallScore: 95,
    standards: [
      {
        id: "s1",
        name: "IEC 60598-1",
        description: "General requirements for luminaires",
        category: "Safety",
        status: "passed",
        score: 98,
        details: "All electrical safety requirements met. Insulation resistance: 150M\u03A9 (min 2M\u03A9 required)."
      },
      {
        id: "s2",
        name: "IEC 60598-2-3",
        description: "Road and street lighting",
        category: "Safety",
        status: "passed",
        score: 96,
        details: "IP65 rating confirmed. Suitable for outdoor installation."
      },
      {
        id: "s3",
        name: "EN 55015",
        description: "Electromagnetic compatibility",
        category: "EMC",
        status: "passed",
        score: 92,
        details: "Conducted and radiated emissions within limits."
      },
      {
        id: "s4",
        name: "Energy Star",
        description: "Energy efficiency certification",
        category: "Energy",
        status: "passed",
        score: 94,
        details: "Luminous efficacy: 142 lm/W (min 120 lm/W required)."
      }
    ]
  },
  {
    id: "2",
    productName: "HomeWise Smart Bulb Pro",
    productType: "Smart Indoor Lighting",
    manufacturer: "HomeWise Inc",
    date: "2026-03-18",
    status: "partial",
    overallScore: 78,
    standards: [
      {
        id: "s5",
        name: "IEC 60598-1",
        description: "General requirements for luminaires",
        category: "Safety",
        status: "passed",
        score: 88,
        details: "Basic safety requirements met."
      },
      {
        id: "s6",
        name: "FCC Part 15",
        description: "RF interference limits",
        category: "EMC",
        status: "failed",
        score: 62,
        details: "Excessive RF emissions detected at 2.4GHz band. Requires improved shielding."
      },
      {
        id: "s7",
        name: "IEEE 802.15.4",
        description: "Wireless communication standard",
        category: "Connectivity",
        status: "passed",
        score: 85,
        details: "ZigBee protocol implementation compliant."
      }
    ]
  },
  {
    id: "3",
    productName: "GardenLux Solar Path Light",
    productType: "Outdoor Solar Lighting",
    manufacturer: "EcoLight Systems",
    date: "2026-03-20",
    status: "passed",
    overallScore: 91,
    standards: [
      {
        id: "s8",
        name: "IEC 60598-2-4",
        description: "Portable luminaires",
        category: "Safety",
        status: "passed",
        score: 93,
        details: "Impact resistance and IP rating verified."
      },
      {
        id: "s9",
        name: "IEC 61215",
        description: "Photovoltaic module certification",
        category: "Energy",
        status: "passed",
        score: 89,
        details: "Solar panel efficiency and durability confirmed."
      },
      {
        id: "s10",
        name: "RoHS",
        description: "Restriction of hazardous substances",
        category: "Environmental",
        status: "passed",
        score: 92,
        details: "No restricted substances detected."
      }
    ]
  }
];

export const standardsDatabase = [
  {
    id: "IEC60598-1",
    name: "IEC 60598-1",
    category: "Safety",
    description: "General requirements and tests for luminaires",
    applicableTo: ["Outdoor LED Lighting", "Smart Indoor Lighting", "Outdoor Solar Lighting"]
  },
  {
    id: "IEC60598-2-3",
    name: "IEC 60598-2-3",
    category: "Safety",
    description: "Particular requirements for road and street lighting",
    applicableTo: ["Outdoor LED Lighting"]
  },
  {
    id: "EN55015",
    name: "EN 55015",
    category: "EMC",
    description: "Electromagnetic compatibility - Radio disturbance characteristics",
    applicableTo: ["Outdoor LED Lighting", "Smart Indoor Lighting"]
  },
  {
    id: "ENERGYSTAR",
    name: "Energy Star",
    category: "Energy",
    description: "Energy efficiency requirements",
    applicableTo: ["Outdoor LED Lighting", "Smart Indoor Lighting"]
  },
  {
    id: "FCC15",
    name: "FCC Part 15",
    category: "EMC",
    description: "Radio frequency device regulations",
    applicableTo: ["Smart Indoor Lighting", "Smart Outdoor Lighting"]
  },
  {
    id: "IEEE802154",
    name: "IEEE 802.15.4",
    category: "Connectivity",
    description: "Wireless personal area networks",
    applicableTo: ["Smart Indoor Lighting", "Smart Outdoor Lighting"]
  },
  {
    id: "IEC61215",
    name: "IEC 61215",
    category: "Energy",
    description: "Crystalline silicon terrestrial photovoltaic modules",
    applicableTo: ["Outdoor Solar Lighting"]
  },
  {
    id: "ROHS",
    name: "RoHS",
    category: "Environmental",
    description: "Restriction of hazardous substances directive",
    applicableTo: ["Outdoor LED Lighting", "Smart Indoor Lighting", "Outdoor Solar Lighting"]
  },
  {
    id: "IP65",
    name: "IP65 Rating",
    category: "Safety",
    description: "Ingress protection against dust and water",
    applicableTo: ["Outdoor LED Lighting", "Outdoor Solar Lighting"]
  },
  {
    id: "ULCERTIFIED",
    name: "UL Certification",
    category: "Safety",
    description: "Underwriters Laboratories safety certification",
    applicableTo: ["Outdoor LED Lighting", "Smart Indoor Lighting"]
  }
];

export const productTypes = [
  "Outdoor LED Lighting",
  "Smart Indoor Lighting",
  "Outdoor Solar Lighting",
  "Smart Outdoor Lighting",
  "LED Strip Lighting",
  "Smart Control Systems",
  "IoT Lighting Hub",
  "Emergency Lighting"
];
