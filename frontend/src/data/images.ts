// Verified Unsplash photos (free Unsplash License). Every id below returned HTTP 200 and was
// looked at on a contact sheet on 2026-10-31. Hotlinking from images.unsplash.com is allowed.
// Usage:  <img src={img(PHOTO.p01_masala_dosa_with_chutneys_steel_bowls, 640, 480)} />
// Always give <img> real alt text (describe the dish), width/height, and loading="lazy" below the fold.

export const PHOTO = {
  p01_masala_dosa_with_chutneys_steel_bowls: 'photo-1668236543090-82eba5ee5976',
  p02_dosa_vada_idli_plate: 'photo-1787024231387-edccb8c44700',
  p03_banana_leaf_meals: 'photo-1625398407796-82650a8c135f',
  p04_round_thali_overhead: 'photo-1786227905994-235e1799292e',
  p05_dosa_on_leaf_with_chutneys: 'photo-1694849789325-914b71ab4075',
  p06_fish_curry_spread_dark: 'photo-1786222084052-fb6f27bfb135',
  p07_vada_stack_on_banana_leaf: 'photo-1683533678059-63c6a0e9e3ef',
  p08_idli_on_banana_leaf_with_sambar: 'photo-1680359871322-aabe6b33eff5',
  p09_chicken_biryani_white_bowl: 'photo-1631515243349-e0cb75fb8d3a',
  p10_biryani_platter: 'photo-1589302168068-964664d93dc0',
  p11_curries_in_steel_bowls: 'photo-1585937421612-70a008356fbe',
  p12_curry_rice_chutneys_dark: 'photo-1767114915989-c6ab3c8fc42e',
  p13_samosa_with_chutney: 'photo-1601050690597-df0568f70950',
  p14_butter_chicken_bowl_cream: 'photo-1772730064951-89b427965dbc',
  p15_paneer_curry_copper_kadai: 'photo-1631452180519-c014fe946bc7',
  p16_butter_chicken_pan: 'photo-1603894584373-5ac82b2ae398',
  p17_butter_chicken_brass_bowl: 'photo-1606471191009-63994c53433b',
  p18_orange_curry_bowl: 'photo-1742599361539-f096753d1100',
  p19_mushroom_masala_pan: 'photo-1596797038530-2c107229654b',
  p20_curry_with_naan_a: 'photo-1772730065344-4cf131b39951',
  p21_curry_with_naan_b: 'photo-1772730064970-a7b2735c93b9',
  p22_curry_spoon_lift: 'photo-1567529854338-fc097b962123',
  p23_mixed_kebab_platter: 'photo-1555939594-58d7cb561ad1',
  p24_steak_on_grill: 'photo-1616252980327-ec70572e5df9',
  p25_south_indian_filter_coffee_set: 'photo-1668236482744-b48b28650f12',
  p26_latte_art_two_cups: 'photo-1507133750040-4a8f57021571',
  p27_bakery_counter_pastries: 'photo-1777544575746-96654957db13',
  p28_iced_coffee_pour: 'photo-1592663527359-cf6642f54cff',
  p29_dessert_flatlay_berries: 'photo-1763683943943-c2ac7a370251',
  p30_egg_on_toast: 'photo-1525351484163-7529414344d8',
  p31_brunch_table_cafe: 'photo-1759216279330-c5a83a0a1ebe',
  p32_fresh_pasta_with_tomatoes: 'photo-1498579150354-977475b7ea0b',
  p33_spaghetti_white_plate: 'photo-1516100882582-96c3a05fe590',
  p34_pizza_margherita: 'photo-1598023696416-0193a0bcd302',
  p35_pizza_slices_on_board: 'photo-1565299624946-b28f40a0ae38',
  p36_pizza_pasta_table_flatlay: 'photo-1777333033656-0b8e6a37b2fa',
  p37_momos_with_orange_sauce: 'photo-1694923450868-b432a8ee52aa',
  p38_dumplings_dark_table: 'photo-1534422298391-e4f8c172dddb',
  p39_dumplings_closeup: 'photo-1647999019630-dabe1a837693',
  p40_ramen_shrimp_egg: 'photo-1569718212165-3a8278d5f624',
  p41_noodles_egg_black_bowl: 'photo-1612927601601-6638404737ce',
  p42_ramen_pork_egg: 'photo-1638866281450-3933540af86a',
  p43_burger_single: 'photo-1568901346375-23c9450c58cd',
  p44_burger_and_fries: 'photo-1561758033-d89a9ad46330',
  p45_two_burgers_cola: 'photo-1550547660-d9450f859349',
  p46_interior_airy_with_tree: 'photo-1636405189493-181ecf851006',
  p47_interior_dark_moody: 'photo-1552960226-639240203497',
  p48_interior_greenhouse_cafe: 'photo-1600093463592-8e36ae95ef56',
  p49_interior_rustic_fine_dining: 'photo-1766832255363-c9f060ade8b0',
  p50_interior_dim_bar_restaurant: 'photo-1765741836925-5363bbaa6507',
  p51_interior_modern_bright: 'photo-1538334421852-687c439c92f4',
  p52_interior_dark_industrial: 'photo-1521917441209-e886f0404a7b',
  p53_interior_teal_orange_cafe: 'photo-1609534655988-3f5225c13553',
  p54_interior_wooden_hall: 'photo-1667388968964-4aa652df0a9b',
  p55_interior_outdoor_checkered_cloth: 'photo-1786654735906-6e472c374c46',
  p56_vada_on_banana_leaf_dark: 'photo-1683533678033-f5d60f0a3437',
  p57_curd_rice_pomegranate_pot: 'photo-1633383718081-22ac93e3db65',
  p58_appe_with_green_chutney: 'photo-1657196118354-f25f29fe636d',
  p59_cupcakes_display: 'photo-1615557509870-98972c5e1396',
  p60_momos_bamboo_steamer: 'photo-1664138218128-2dcf791a9d27',
} as const

export type PhotoKey = keyof typeof PHOTO

/** Build a sized, cropped, compressed Unsplash URL. */
export function img(id: string, w = 640, h = 480): string {
  return `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&q=70&auto=format`
}

const BY_NUMBER: Record<string, string> = Object.fromEntries(
  Object.entries(PHOTO).map(([k, v]) => [k.slice(0, 3), v]),
)

/** Short code ('p01') → Unsplash URL at a given crop. */
export function photo(code: string, w = 640, h = 480): string {
  const id = BY_NUMBER[code]
  if (!id) throw new Error(`Unknown photo code ${code}`)
  return img(id, w, h)
}

/** Food photos only (interiors p46–p55 are for covers), as { code, label } for photo pickers. */
export const FOOD_PHOTOS = Object.keys(PHOTO)
  .filter((k) => { const n = Number(k.slice(1, 3)); return n < 46 || n > 55 })
  .map((k) => ({ code: k.slice(0, 3), label: k.slice(4).replace(/_/g, ' ') }))
