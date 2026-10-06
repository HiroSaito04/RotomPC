// filepath: rotompc-server/constants/trainerAvatars.js

const TRAINER_SPRITE_BASE_URL =
  "https://play.pokemonshowdown.com/sprites/trainers";

const TRAINER_ANIMATED_BASE_URL =
  "https://archives.bulbagarden.net/wiki/Special:Redirect/file";

/* =========================================================
   URL HELPERS
========================================================= */

const getAnimatedTrainerUrl = (fileName) => {
  if (!fileName) {
    return null;
  }

  return `${TRAINER_ANIMATED_BASE_URL}/${encodeURIComponent(fileName)}`;
};

const getStaticTrainerUrl = (fileName) => {
  if (!fileName) {
    return null;
  }

  return `${TRAINER_SPRITE_BASE_URL}/${fileName}`;
};

/* =========================================================
   AVATAR BUILDER

   imageUrl intentionally points to the animated B2W2
   sprite so existing frontend code that already renders
   avatar.imageUrl automatically receives real animation.

   staticImageUrl remains available as a fallback.
========================================================= */

const makeAvatar = ({
  id,
  label,
  animatedFile,
  category = "trainer",
  gender = "unspecified",
  staticSprite = null,
}) => ({
  id,
  label,

  category,
  gender,

  animatedFile,
  sprite: staticSprite,

  credit: "Pokémon Black 2 / White 2 game sprite",

  source: "Bulbagarden Archives",

  staticSource: staticSprite ? "Pokémon Showdown" : null,
});

/* =========================================================
   CURATED ANIMATED TRAINER AVATARS

   These are Trainer-class sprites rather than named
   Pokémon characters.

   The B2W2 versions are actual animated PNG files.
========================================================= */

const RAW_TRAINER_AVATARS = [
  makeAvatar({
    id: "ace-trainer-m",
    label: "Ace Trainer",
    animatedFile: "Spr B2W2 Ace Trainer M.png",
    staticSprite: "acetrainer-gen6xy.png",
    category: "trainer",
    gender: "male",
  }),

  makeAvatar({
    id: "ace-trainer-f",
    label: "Ace Trainer",
    animatedFile: "Spr B2W2 Ace Trainer F.png",
    staticSprite: "acetrainerf-gen6xy.png",
    category: "trainer",
    gender: "female",
  }),

  makeAvatar({
    id: "backpacker-m",
    label: "Backpacker",
    animatedFile: "Spr B2W2 Backpacker M.png",
    staticSprite: "backpacker-gen8.png",
    category: "explorer",
    gender: "male",
  }),

  makeAvatar({
    id: "backpacker-f",
    label: "Backpacker",
    animatedFile: "Spr B2W2 Backpacker F.png",
    staticSprite: "backpackerf.png",
    category: "explorer",
    gender: "female",
  }),

  makeAvatar({
    id: "battle-girl",
    label: "Battle Girl",
    animatedFile: "Spr B2W2 Battle Girl.png",
    staticSprite: "battlegirl-gen6xy.png",
    category: "battle",
    gender: "female",
  }),

  makeAvatar({
    id: "black-belt",
    label: "Black Belt",
    animatedFile: "Spr B2W2 Black Belt.png",
    category: "battle",
    gender: "male",
  }),

  makeAvatar({
    id: "beauty",
    label: "Beauty",
    animatedFile: "Spr B2W2 Beauty.png",
    staticSprite: "beauty-gen6xy.png",
    category: "style",
    gender: "female",
  }),

  makeAvatar({
    id: "breeder-m",
    label: "Pokémon Breeder",
    animatedFile: "Spr B2W2 Pokémon Breeder M.png",
    staticSprite: "pokemonbreeder-gen7.png",
    category: "breeder",
    gender: "male",
  }),

  makeAvatar({
    id: "breeder-f",
    label: "Pokémon Breeder",
    animatedFile: "Spr B2W2 Pokémon Breeder F.png",
    staticSprite: "pokemonbreederf-gen7.png",
    category: "breeder",
    gender: "female",
  }),

  makeAvatar({
    id: "ranger-m",
    label: "Pokémon Ranger",
    animatedFile: "Spr B2W2 Pokémon Ranger M.png",
    staticSprite: "pokemonranger-gen6xy.png",
    category: "ranger",
    gender: "male",
  }),

  makeAvatar({
    id: "ranger-f",
    label: "Pokémon Ranger",
    animatedFile: "Spr B2W2 Pokémon Ranger F.png",
    staticSprite: "pokemonrangerf-gen6xy.png",
    category: "ranger",
    gender: "female",
  }),

  makeAvatar({
    id: "artist",
    label: "Artist",
    animatedFile: "Spr B2W2 Artist.png",
    category: "creative",
    gender: "male",
  }),

  makeAvatar({
    id: "baker",
    label: "Baker",
    animatedFile: "Spr B2W2 Baker.png",
    category: "service",
    gender: "female",
  }),

  makeAvatar({
    id: "biker",
    label: "Biker",
    animatedFile: "Spr B2W2 Biker.png",
    staticSprite: "biker.png",
    category: "street",
    gender: "male",
  }),

  makeAvatar({
    id: "clerk-m",
    label: "Clerk",
    animatedFile: "Spr B2W2 Clerk M.png",
    category: "professional",
    gender: "male",
  }),

  makeAvatar({
    id: "clerk-f",
    label: "Clerk",
    animatedFile: "Spr B2W2 Clerk F.png",
    category: "professional",
    gender: "female",
  }),

  makeAvatar({
    id: "cyclist-m",
    label: "Cyclist",
    animatedFile: "Spr B2W2 Cyclist M.png",
    staticSprite: "cyclist.png",
    category: "sport",
    gender: "male",
  }),

  makeAvatar({
    id: "cyclist-f",
    label: "Cyclist",
    animatedFile: "Spr B2W2 Cyclist F.png",
    staticSprite: "cyclistf.png",
    category: "sport",
    gender: "female",
  }),

  makeAvatar({
    id: "dancer",
    label: "Dancer",
    animatedFile: "Spr B2W2 Dancer.png",
    category: "creative",
    gender: "male",
  }),

  makeAvatar({
    id: "depot-agent",
    label: "Depot Agent",
    animatedFile: "Spr B2W2 Depot Agent.png",
    category: "professional",
    gender: "male",
  }),

  makeAvatar({
    id: "doctor",
    label: "Doctor",
    animatedFile: "Spr B2W2 Doctor.png",
    category: "professional",
    gender: "male",
  }),

  makeAvatar({
    id: "fisherman",
    label: "Fisherman",
    animatedFile: "Spr B2W2 Fisherman.png",
    staticSprite: "fisherman-gen6xy.png",
    category: "explorer",
    gender: "male",
  }),

  makeAvatar({
    id: "gentleman",
    label: "Gentleman",
    animatedFile: "Spr B2W2 Gentleman.png",
    category: "style",
    gender: "male",
  }),

  makeAvatar({
    id: "guitarist",
    label: "Guitarist",
    animatedFile: "Spr B2W2 Guitarist.png",
    category: "creative",
    gender: "male",
  }),

  makeAvatar({
    id: "harlequin",
    label: "Harlequin",
    animatedFile: "Spr B2W2 Harlequin.png",
    category: "creative",
    gender: "male",
  }),

  makeAvatar({
    id: "hiker",
    label: "Hiker",
    animatedFile: "Spr B2W2 Hiker.png",
    category: "explorer",
    gender: "male",
  }),

  makeAvatar({
    id: "hoopster",
    label: "Hoopster",
    animatedFile: "Spr B2W2 Hoopster.png",
    category: "sport",
    gender: "male",
  }),

  makeAvatar({
    id: "infielder",
    label: "Infielder",
    animatedFile: "Spr B2W2 Infielder.png",
    category: "sport",
    gender: "male",
  }),

  makeAvatar({
    id: "janitor",
    label: "Janitor",
    animatedFile: "Spr B2W2 Janitor.png",
    category: "worker",
    gender: "male",
  }),

  makeAvatar({
    id: "lady",
    label: "Lady",
    animatedFile: "Spr B2W2 Lady.png",
    category: "style",
    gender: "female",
  }),

  makeAvatar({
    id: "lass",
    label: "Lass",
    animatedFile: "Spr B2W2 Lass.png",
    category: "trainer",
    gender: "female",
  }),

  makeAvatar({
    id: "linebacker",
    label: "Linebacker",
    animatedFile: "Spr B2W2 Linebacker.png",
    category: "sport",
    gender: "male",
  }),

  makeAvatar({
    id: "maid",
    label: "Maid",
    animatedFile: "Spr B2W2 Maid.png",
    category: "service",
    gender: "female",
  }),

  makeAvatar({
    id: "musician",
    label: "Musician",
    animatedFile: "Spr B2W2 Musician.png",
    category: "creative",
    gender: "male",
  }),

  makeAvatar({
    id: "nurse",
    label: "Nurse",
    animatedFile: "Spr B2W2 Nurse.png",
    category: "service",
    gender: "female",
  }),

  makeAvatar({
    id: "nursery-aide",
    label: "Nursery Aide",
    animatedFile: "Spr B2W2 Nursery Aide.png",
    category: "service",
    gender: "female",
  }),

  makeAvatar({
    id: "parasol-lady",
    label: "Parasol Lady",
    animatedFile: "Spr B2W2 Parasol Lady.png",
    category: "style",
    gender: "female",
  }),

  makeAvatar({
    id: "pilot",
    label: "Pilot",
    animatedFile: "Spr B2W2 Pilot.png",
    category: "professional",
    gender: "male",
  }),

  makeAvatar({
    id: "poke-fan-m",
    label: "Poké Fan",
    animatedFile: "Spr B2W2 Pokéfan M.png",
    category: "fan",
    gender: "male",
  }),

  makeAvatar({
    id: "poke-fan-f",
    label: "Poké Fan",
    animatedFile: "Spr B2W2 Pokéfan F.png",
    category: "fan",
    gender: "female",
  }),

  makeAvatar({
    id: "policeman",
    label: "Policeman",
    animatedFile: "Spr B2W2 Policeman.png",
    category: "professional",
    gender: "male",
  }),

  makeAvatar({
    id: "preschooler-m",
    label: "Preschooler",
    animatedFile: "Spr B2W2 Preschooler M.png",
    category: "student",
    gender: "male",
  }),

  makeAvatar({
    id: "preschooler-f",
    label: "Preschooler",
    animatedFile: "Spr B2W2 Preschooler F.png",
    category: "student",
    gender: "female",
  }),

  makeAvatar({
    id: "psychic-m",
    label: "Psychic",
    animatedFile: "Spr B2W2 Psychic M.png",
    category: "psychic",
    gender: "male",
  }),

  makeAvatar({
    id: "psychic-f",
    label: "Psychic",
    animatedFile: "Spr B2W2 Psychic F.png",
    category: "psychic",
    gender: "female",
  }),

  makeAvatar({
    id: "rich-boy",
    label: "Rich Boy",
    animatedFile: "Spr B2W2 Rich Boy.png",
    category: "style",
    gender: "male",
  }),

  makeAvatar({
    id: "roughneck",
    label: "Roughneck",
    animatedFile: "Spr B2W2 Roughneck.png",
    category: "street",
    gender: "male",
  }),

  makeAvatar({
    id: "school-kid-m",
    label: "School Kid",
    animatedFile: "Spr B2W2 School Kid M.png",
    category: "student",
    gender: "male",
  }),

  makeAvatar({
    id: "school-kid-f",
    label: "School Kid",
    animatedFile: "Spr B2W2 School Kid F.png",
    category: "student",
    gender: "female",
  }),

  makeAvatar({
    id: "scientist-m",
    label: "Scientist",
    animatedFile: "Spr B2W2 Scientist M.png",
    category: "science",
    gender: "male",
  }),

  makeAvatar({
    id: "scientist-f",
    label: "Scientist",
    animatedFile: "Spr B2W2 Scientist F.png",
    category: "science",
    gender: "female",
  }),

  makeAvatar({
    id: "smasher",
    label: "Smasher",
    animatedFile: "Spr B2W2 Smasher.png",
    category: "sport",
    gender: "female",
  }),

  makeAvatar({
    id: "socialite",
    label: "Socialite",
    animatedFile: "Spr B2W2 Socialite.png",
    category: "style",
    gender: "female",
  }),

  makeAvatar({
    id: "striker",
    label: "Striker",
    animatedFile: "Spr B2W2 Striker.png",
    category: "sport",
    gender: "male",
  }),

  makeAvatar({
    id: "swimmer-m",
    label: "Swimmer",
    animatedFile: "Spr B2W2 Swimmer M.png",
    category: "water",
    gender: "male",
  }),

  makeAvatar({
    id: "swimmer-f",
    label: "Swimmer",
    animatedFile: "Spr B2W2 Swimmer F.png",
    category: "water",
    gender: "female",
  }),

  makeAvatar({
    id: "veteran-m",
    label: "Veteran",
    animatedFile: "Spr B2W2 Veteran M.png",
    category: "battle",
    gender: "male",
  }),

  makeAvatar({
    id: "veteran-f",
    label: "Veteran",
    animatedFile: "Spr B2W2 Veteran F.png",
    category: "battle",
    gender: "female",
  }),

  makeAvatar({
    id: "waiter",
    label: "Waiter",
    animatedFile: "Spr B2W2 Waiter.png",
    category: "service",
    gender: "male",
  }),

  makeAvatar({
    id: "waitress",
    label: "Waitress",
    animatedFile: "Spr B2W2 Waitress.png",
    category: "service",
    gender: "female",
  }),

  makeAvatar({
    id: "worker",
    label: "Worker",
    animatedFile: "Spr B2W2 Worker.png",
    category: "worker",
    gender: "male",
  }),

  makeAvatar({
    id: "young-trainer",
    label: "Young Trainer",
    animatedFile: "Spr B2W2 Youngster.png",
    staticSprite: "youngster-gen9.png",
    category: "trainer",
    gender: "male",
  }),
];

/* =========================================================
   SERIALIZED CATALOG
========================================================= */

const TRAINER_AVATARS = RAW_TRAINER_AVATARS.map((avatar) => {
  const animatedImageUrl = getAnimatedTrainerUrl(avatar.animatedFile);

  const staticImageUrl = getStaticTrainerUrl(avatar.sprite);

  return {
    ...avatar,

    /*
     * Existing components already use imageUrl.
     *
     * Make it animated by default.
     */
    imageUrl: animatedImageUrl || staticImageUrl,

    animatedImageUrl,

    staticImageUrl,

    isAnimated: Boolean(animatedImageUrl),
  };
});

/* =========================================================
   HELPERS
========================================================= */

const getTrainerAvatarById = (avatarId) => {
  const normalized = String(avatarId || "")
    .trim()
    .toLowerCase();

  return TRAINER_AVATARS.find((avatar) => avatar.id === normalized) || null;
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  TRAINER_SPRITE_BASE_URL,

  TRAINER_ANIMATED_BASE_URL,

  TRAINER_AVATARS,

  getTrainerAvatarById,
};
