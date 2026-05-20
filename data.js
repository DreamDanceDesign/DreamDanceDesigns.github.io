// Edit this file to update fabric colors, product styles, prices, or payment info.
// To use real cropped fabric photos instead of solid colors, add `img: "swatches/name.jpg"`
// to any swatch — the photo will be used in place of the hex color block.

const CONFIG = {
  businessName: "Dream Dance Designs",
  subtitle: "Custom by Jo-Anne",
  tagline: "Handmade. Custom-fit. One of a kind.",
  pricing: {
    perItem: 55,
    bundle: 95,        // 1 top + 1 bottom
    textureUpcharge: 5, // added per ribbed or foil color selection on an item
    shipping: 9        // flat fee, waived for local pickup
  },
  timeline: {
    standardDays: "10 business days",
    maxDays: "3 weeks"
  },
  payment: {
    venmoHandle: "@DreamDanceDesigns",
    venmoLink: "https://venmo.com/u/DreamDanceDesigns",
    contactEmail: "DreamDanceDesigns@gmail.com",
    note: "Most orders ship within 2–3 weeks. Reach out anytime with questions.",
    // Web3Forms access key — paste here after signup (see README for steps).
    // Leave empty string to fall back to the mailto button on the receipt page.
    web3formsKey: "78176a7e-c693-49c1-9aeb-7fc2331b362c"
  }
};

// All measurements in inches. Edit ranges below if needed.
const SIZE_CHART = {
  unit: "inches",
  columns: ["Bust", "Waist", "Hips", "Girth"],
  children: [
    { size: "XXSM (2-3)",  values: ["19–21", "19–21", "21–22", "36–37"] },
    { size: "XSM (4-5)",   values: ["19–22", "19–21", "22–23", "37–39"] },
    { size: "SM (6-7)",    values: ["22–24", "20–22", "23–25", "39–43"] },
    { size: "M (8-10)",    values: ["23–25", "22–25", "25–28", "43–47"] },
    { size: "LG (12)",     values: ["25–30", "24–26", "28–30", "48–51"] },
    { size: "XLG (14-16)", values: ["26–31", "25–29", "29–32", "49–52"] }
  ],
  adults: [
    { size: "XSM", values: ["30–32", "24–26", "29–33", "51–53"] },
    { size: "SM",  values: ["32–34", "24–27", "34–36", "54–59"] },
    { size: "M",   values: ["34–36", "26–28", "36–38", "59–63"] },
    { size: "LG",  values: ["36–39", "29–32", "38–40", "61–66"] },
    { size: "XLG", values: ["39–42", "33–34", "41–44", "64–70"] }
  ]
};

// Each product lists its color zones — the order matters (color1, color2…). 1-color items omit color2.
const PRODUCTS = {
  tops: [
    {
      id: "top-1",
      name: "Ruched Bralette",
      type: "top",
      desc: "Soft ruched front bralette with adjustable straps. Made to order in your two custom fabrics.",
      img: "images/ruched-bralette.jpeg",
      colors: [
        { key: "color1", label: "Main Body" },
        { key: "color2", label: "Straps" }
      ]
    },
    {
      id: "top-2",
      name: "One Shoulder Top",
      type: "top",
      desc: "Asymmetric one-shoulder top with a clean line and structured fit.",
      img: "images/one-shoulder-top.jpeg",
      colors: [
        { key: "color1", label: "Main Body" },
        { key: "color2", label: "Straps" }
      ]
    },
    {
      id: "top-3",
      name: "Longline Ruched Top",
      type: "top",
      desc: "Extended longline silhouette with ruched detailing — beautiful on its own or paired with high-waist bottoms.",
      img: null,
      colors: [
        { key: "color1", label: "Main Body" },
        { key: "color2", label: "Straps" }
      ]
    }
  ],
  bottoms: [
    {
      id: "bot-1",
      name: "High Waisted Booty Shorts",
      type: "bottom",
      desc: "Flattering high-rise booty shorts in a single fabric for a clean, sleek look.",
      img: "images/booty-shorts.jpeg",
      colors: [
        { key: "color1", label: "Main Body" }
      ]
    },
    {
      id: "bot-2",
      name: "Standard Brief",
      type: "bottom",
      desc: "Classic dance brief with a contrast waistband.",
      img: "images/standard-brief.jpeg",
      colors: [
        { key: "color1", label: "Main Body" },
        { key: "color2", label: "Waistband" }
      ]
    },
    {
      id: "bot-3",
      name: "Featured Brief",
      type: "bottom",
      desc: "Brief with feature straps and a contrast waistband for an elevated look on stage.",
      img: null,
      colors: [
        { key: "color1", label: "Main Body" },
        { key: "color2", label: "Waistband & Straps" }
      ]
    }
  ]
};

// Three texture groups. Standard is the base price; ribbed and foil each add $5 per selection.
const FABRIC_GROUPS = [
  {
    id: "standard",
    label: "Standard",
    upcharge: 0,
    note: "Smooth athletic stretch — included in base price.",
    swatches: [
      // From the three solid-color board photos
      { name: "Avorio",         hex: "#ece1c4" },
      { name: "Nude",           hex: "#d8c5a4" },
      { name: "OS-Vegas Gold",  hex: "#c9b896" },
      { name: "Chino",          hex: "#9b9385" },
      { name: "Khaki",          hex: "#88837a" },
      { name: "Capuccino",      hex: "#6a615a" },
      { name: "Brown",          hex: "#4a3d3a" },
      { name: "OS-Grey",        hex: "#b0b0ae" },
      { name: "Silver",         hex: "#8a8a8e" },
      { name: "Antrazit",       hex: "#3a3e3a" },
      { name: "Black",          hex: "#1a1d24" },
      { name: "White",          hex: "#f7f6f3" },

      { name: "Pink Light",     hex: "#f7c5d6" },
      { name: "Camio",          hex: "#ecaad0" },
      { name: "Lavender",       hex: "#c79bcf" },
      { name: "Orchid",         hex: "#9e80c9" },
      { name: "Lilac",          hex: "#5e8fb8" },
      { name: "OS-Columbia",    hex: "#44339e" },
      { name: "Purple",         hex: "#4c2885" },
      { name: "BT-Periwinkle",  hex: "#a4a7b5" },

      { name: "Neon Pink",      hex: "#ff48a1" },
      { name: "Neon Green",     hex: "#95e235" },
      { name: "Neon Yellow",    hex: "#f3e547" },
      { name: "Neon Orange",    hex: "#ff5733" },
      { name: "Light Coral",    hex: "#ff8aa2" },
      { name: "Neon Coral",     hex: "#ff3a78" },
      { name: "Girasole",       hex: "#e5c84a" },
      { name: "BT-Lemonade",    hex: "#f3e44a" },
      { name: "BT-Mustard",     hex: "#e3a82f" },
      { name: "BT-Brt Orange",  hex: "#ff8043" },
      { name: "BT-Copper",      hex: "#b95d2e" },

      { name: "Red",            hex: "#c91d3f" },
      { name: "Carminio",       hex: "#d7522c" },
      { name: "Tagete",         hex: "#e75d2a" },
      { name: "OS-Orange",      hex: "#d72e7e" },
      { name: "Fuschia",        hex: "#e94c98" },
      { name: "BT-Hibiscus",    hex: "#9c2c8a" },
      { name: "Lips Coral",     hex: "#ee9094" },
      { name: "Light Skin",     hex: "#c1a884" },

      { name: "OS-Maroon",      hex: "#482030" },
      { name: "Maroon",         hex: "#732538" },
      { name: "Plum",           hex: "#5a2c4f" },
      { name: "BT-Merlot",      hex: "#391f2c" },
      { name: "BT-Wine",        hex: "#401a3a" },

      { name: "Deep Navy",      hex: "#1d2840" },
      { name: "Navy",           hex: "#1a2b48" },
      { name: "Nautical Teal",  hex: "#14304a" },
      { name: "Caramela",       hex: "#1f3046" },
      { name: "Hawaii",         hex: "#1786ce" },
      { name: "Turquise",       hex: "#1e4ec8" },
      { name: "True Blue",      hex: "#1f4abd" },
      { name: "Blue Royal",     hex: "#1f49c8" },
      { name: "Blue Light",     hex: "#79c8e8" },
      { name: "Versila",        hex: "#28c4d8" },
      { name: "Light Turquoise",hex: "#5cb6ce" },
      { name: "Teal Green",     hex: "#2a8197" },
      { name: "BT-Bayern",      hex: "#3c79b5" },
      { name: "BT-Corona",      hex: "#1f93cf" },
      { name: "BT-Mallard",     hex: "#1f5d7a" },

      { name: "Olive",          hex: "#1f3b35" },
      { name: "Forest",         hex: "#163d2c" },
      { name: "S-Martini Olive",hex: "#4a4738" },
      { name: "Bocciolo",       hex: "#adde3f" },
      { name: "Kelly Green",    hex: "#2db84a" },
      { name: "Asian Jade",     hex: "#41c19c" },
      { name: "BT-Mint",        hex: "#40c39d" },
      { name: "BT-Jade",        hex: "#1c8d80" },
      { name: "BT-Emerald",     hex: "#103b3a" },
      { name: "BT-Drab",        hex: "#5d6248" },
      { name: "BT-Basil",       hex: "#93b58e" }
    ]
  },
  {
    id: "ribbed",
    label: "Ribbed Performance (+$5)",
    upcharge: 5,
    note: "Sportek SP-RIB20 — ribbed texture, 82% poly / 18% spandex.",
    swatches: [
      { name: "True Blue",      hex: "#3b6fc4", ribbed: true },
      { name: "Navy Nautica",   hex: "#5a82c1", ribbed: true },
      { name: "Hawaii",         hex: "#1bb0d4", ribbed: true },
      { name: "Lavender",       hex: "#b8a3d4", ribbed: true },
      { name: "Light Pink",     hex: "#ee9caa", ribbed: true },
      { name: "Maroon Dream",   hex: "#d34a55", ribbed: true },
      { name: "Carminio",       hex: "#ec3a4f", ribbed: true },
      { name: "Fuchsia",        hex: "#e63d8e", ribbed: true },
      { name: "Neon Pink",      hex: "#ff2891", ribbed: true },
      { name: "Neon Orange",    hex: "#ff4a1c", ribbed: true },
      { name: "Martini Olive",  hex: "#aab6a0", ribbed: true },
      { name: "Cappuccino",     hex: "#797572", ribbed: true },
      { name: "Skin Nude",      hex: "#d4d2cb", ribbed: true },
      { name: "Chino",          hex: "#c2bdb4", ribbed: true },
      { name: "White",          hex: "#eeeeec", ribbed: true },
      { name: "Black Raven",    hex: "#2a2a2e", ribbed: true }
    ]
  },
  {
    id: "foil",
    label: "Sparkle Foil (+$5)",
    upcharge: 5,
    note: "Sportek Fog Foil — 80% nylon / 20% spandex tricot with metallic sheen.",
    swatches: [
      { name: "Fog Holo",        hex: "#dcdce0", sparkle: true },
      { name: "White/Silver Foil", hex: "#e8e8ec", sparkle: true },
      { name: "Canary Yellow",   hex: "#f0d540", sparkle: true },
      { name: "Yellow/Gold",     hex: "#ddb13a", sparkle: true },
      { name: "Gold/Gold Foil",  hex: "#b69546", sparkle: true },
      { name: "Lime",            hex: "#a7d63a", sparkle: true },
      { name: "Lime/Lime",       hex: "#7fb83a", sparkle: true },
      { name: "Avocado",         hex: "#4a8a3c", sparkle: true },
      { name: "Kelly",           hex: "#229c46", sparkle: true },
      { name: "Forest/F Green",  hex: "#1c5a3a", sparkle: true },
      { name: "Light Pink",      hex: "#f5b6c8", sparkle: true },
      { name: "Fuchsia/Fuchsia", hex: "#e83a90", sparkle: true },
      { name: "Lipstick",        hex: "#d61f4a", sparkle: true },
      { name: "Red/Red Foil",    hex: "#c8201c", sparkle: true },
      { name: "Orange/Gold",     hex: "#df6826", sparkle: true },
      { name: "Lilac",           hex: "#b89ed1", sparkle: true },
      { name: "Purple/Purple",   hex: "#5a2a8e", sparkle: true },
      { name: "Light Blue",      hex: "#9ec8e0", sparkle: true },
      { name: "Blue/Blue",       hex: "#2c5fb8", sparkle: true },
      { name: "Pacific Blue",    hex: "#1f4a8a", sparkle: true },
      { name: "Midnight Navy",   hex: "#1a2545", sparkle: true },
      { name: "Chocolate",       hex: "#6e4326", sparkle: true },
      { name: "Metal",           hex: "#888c90", sparkle: true },
      { name: "Black/Silver",    hex: "#3a3a40", sparkle: true },
      { name: "Black on Black",  hex: "#1a1a1c", sparkle: true }
    ]
  }
];
