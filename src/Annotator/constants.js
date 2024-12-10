export const subTypeTitles = {
  yearly_full_suite: "FULL SUITE ELECTRICAL",
  monthly_full_suite: "FULL SUITE ELECTRICAL",
  yearly_data: "DATA COMMUNICATIONS",
  monthly_data: "DATA COMMUNICATIONS",
  yearly_xkey_se: "STANDARD EDITION",
  yearly_xkey_see: "STANDARD EDITION ELECTRICAL",
}

export const subTypes = {
  fullSuiteYearly: "yearly_full_suite",
  fullSuiteMonthly: "monthly_full_suite",
  dataYearly: "yearly_data",
  dataMonthly: "monthly_data",
  standardEditionYearly: "yearly_xkey_se",
  electricalAieLite: "yearly_lite",
  standardEditionElectricalYearly: "yearly_xkey_see",
}

export const disableBreakoutSubscription = [
  subTypes.standardEditionYearly,
  subTypes.standardEditionElectricalYearly,
  subTypes.electricalAieLite,
]

export const lowerTiers = [
  subTypes.standardEditionYearly,
  subTypes.standardEditionElectricalYearly,
]

export const higherTiers = [
  subTypes.fullSuiteYearly,
  subTypes.fullSuiteMonthly,
  subTypes.dataYearly,
  subTypes.dataMonthly,
]

export const AIE_CATEGORIES = [
  "COMMUNICATION SYSTEMS",
  "FIRE ALARM",
  "LIGHTING",
  "MECHANICAL/ELECTRICAL",
  "POWER",
  "SECURITY SYSTEMS",
  "CONDUIT AND WIRE",
  "FEEDERS",
  "CABLE",
  "TRAY",
  "WIREMOLD",
  "BREAKERS",
  "NOT CLASSIFIED",
]

export const defaultColor = "#C4A484"
export const defaultSystem = "NOT CLASSIFIED"