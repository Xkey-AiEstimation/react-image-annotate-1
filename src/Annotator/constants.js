export const subTypeTitles = {
  yearly_full_suite: "FULL SUITE ELECTRICAL",
  monthly_full_suite: "FULL SUITE ELECTRICAL",
  yearly_data: "DATA COMMUNICATIONS",
  monthly_data: "DATA COMMUNICATIONS",
  yearly_xkey_se: "STANDARD EDITION",
  monthly_xkey_se: "STANDARD EDITION",
  yearly_xkey_see: "STANDARD EDITION ELECTRICAL",
  monthly_lite: "AiE ELECTRICAL LITE",
  yearly_lite: "AiE ELECTRICAL LITE",
}

export const subTypes = {
  fullSuiteYearly: "yearly_full_suite",
  fullSuiteMonthly: "monthly_full_suite",
  dataYearly: "yearly_data",
  dataMonthly: "monthly_data",
  standardEditionYearly: "yearly_xkey_se",
  standardEditionMonthly: "monthly_xkey_se",
  electricalAieLite: "yearly_lite",
  electricalAieLiteMonthly: "monthly_lite",
  standardEditionElectricalYearly: "yearly_xkey_see",
}

export const disableBreakoutSubscription = [
  subTypes.standardEditionYearly,
  subTypes.standardEditionElectricalYearly,
  subTypes.electricalAieLite,
  subTypes.electricalAieLiteMonthly,
  subTypes.standardEditionMonthly
]

export const disableMultiPageOCR = [
  subTypes.standardEditionYearly,
  subTypes.standardEditionElectricalYearly,
  subTypes.electricalAieLite,
  subTypes.electricalAieLiteMonthly,
  subTypes.standardEditionMonthly
]

export const lowerTiers = [
  subTypes.standardEditionYearly,
  subTypes.standardEditionElectricalYearly,
  subTypes.standardEditionMonthly
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


export const absoluteMaxZIndex = 2147483647;

export const zIndices = {
  tooltip: 2100000001,
  sidebar: 2100000000,
  modal: 2100000003,
  backdrop: 2100000002
};
