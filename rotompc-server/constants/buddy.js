// rotompc-server/constants/buddy.js

const BUDDY_MAX_ENERGY = 100;
const BUDDY_MAX_AFFECTION = 100;

const BUDDY_STARTING_BERRIES = 5;

const BUDDY_PET_ENERGY_COST = 5;
const BUDDY_PLAY_ENERGY_COST = 10;

const BUDDY_BERRY_ENERGY_GAIN = 15;

/*
 * Buddy wakes weak after its 2-minute rest.
 *
 * 10 + 30 + 30 + 30 = 100
 *
 * Therefore exactly 3 berries restore a
 * freshly awakened buddy to full energy.
 */
const BUDDY_WAKE_ENERGY = 10;

const BUDDY_REST_MS = 2 * 60 * 1000;

const POKESOCIAL_BERRY_REWARDS = {
  like: 1,
  follow: 5,
  post: 10,
};

/*
 * Cosmetic berry choices.
 *
 * All restore the same energy because the
 * inventory is a simple berry currency.
 */
const ALLOWED_BERRIES = [
  "cheri",
  "chesto",
  "pecha",
  "rawst",
  "aspear",
  "leppa",
  "oran",
  "persim",
  "sitrus",
  "lum",
];

module.exports = {
  BUDDY_MAX_ENERGY,
  BUDDY_MAX_AFFECTION,
  BUDDY_STARTING_BERRIES,
  BUDDY_PET_ENERGY_COST,
  BUDDY_PLAY_ENERGY_COST,
  BUDDY_BERRY_ENERGY_GAIN,
  BUDDY_WAKE_ENERGY,
  BUDDY_REST_MS,
  POKESOCIAL_BERRY_REWARDS,
  ALLOWED_BERRIES,
};
