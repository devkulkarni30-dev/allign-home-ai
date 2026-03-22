
export const VASTU_RULES_DATABASE = {
  zones: {
    N: { name: "North", element: "Water", deity: "Kuber", attributes: ["Wealth", "Opportunities", "Career"], ideal: ["Entrance", "Living Room"], taboo: ["Toilet", "Kitchen"] },
    NE: { name: "North-East", element: "Water", deity: "Eshanya", attributes: ["Spirituality", "Health", "Clarity"], ideal: ["Pooja Room", "Entrance", "Living Room"], taboo: ["Toilets", "Kitchen", "Septic Tank"] },
    E: { name: "East", element: "Air", deity: "Indra", attributes: ["Social Connections", "Power", "Fame"], ideal: ["Entrance", "Living Room", "Pooja"], taboo: ["Toilet", "Storage"] },
    SE: { name: "South-East", element: "Fire", deity: "Agni", attributes: ["Cash Flow", "Energy", "Passion"], ideal: ["Kitchen", "Electrical Equipment"], taboo: ["Master Bedroom", "Water Tank"] },
    S: { name: "South", element: "Fire", deity: "Yama", attributes: ["Rest", "Relaxation", "Fame"], ideal: ["Bedroom", "Staircase"], taboo: ["Entrance", "Kitchen"] },
    SW: { name: "South-West", element: "Earth", deity: "Nirriti", attributes: ["Stability", "Strength", "Relationships"], ideal: ["Master Bedroom", "Heavy Storage"], taboo: ["Entrance", "Pooja Room", "Borewell"] },
    W: { name: "West", element: "Space", deity: "Varun", attributes: ["Gains", "Profits", "Learning"], ideal: ["Study Room", "Children's Bed", "Store"], taboo: ["Entrance", "Kitchen"] },
    NW: { name: "North-West", element: "Air", deity: "Vayu", attributes: ["Support", "Movement", "Banking"], ideal: ["Guest Room", "Toilet", "Store Room"], taboo: ["Master Bedroom"] },
    C: { name: "Brahmasthan", element: "Space", deity: "Brahma", attributes: ["Balance", "Centering", "Universal Energy"], ideal: ["Open Space", "Courtyard"], taboo: ["Heavy Pillars", "Toilet", "Staircase"] }
  },
  remedies: [
    { conflict: "Toilet in NE", remedy: "Place a lead helix and use blue sea salt in a bowl. Fix a silver strip on the door frame." },
    { conflict: "Kitchen in SW", remedy: "Paint the walls in light yellow. Place a Yellow Jasper stone under the gas stove." },
    { conflict: "Main Door in South", remedy: "Fix 3 Lead Pyramids above the main door. Use a red door mat or brass threshold." },
    { conflict: "Borewell in SE", remedy: "Place red jasper crystals and a copper pyramid near the water source." }
  ]
};
