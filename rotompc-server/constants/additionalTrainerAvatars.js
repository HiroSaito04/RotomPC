// filepath: rotompc-server/constants/additionalTrainerAvatars.js

const { TRAINER_SPRITE_BASE_URL } = require("./trainerAvatars");

const { SPECIAL_TRAINER_AVATAR_ROLES } = require("./userRoles");

/* =========================================================
   URL
========================================================= */

const getShowdownTrainerUrl = (fileName) => {
  if (!fileName) {
    return null;
  }

  return `${TRAINER_SPRITE_BASE_URL}/${fileName}`;
};

/* =========================================================
   STATIC AVATAR BUILDER

   These use Pokémon Showdown's pixel Trainer sprite set.

   They intentionally use the exact same shape expected by
   your current Trainer avatar frontend.
========================================================= */

const makeStaticAvatar = ({
  id,

  label,

  sprite,

  category = "npc",

  gender = "unspecified",

  characterType = "npc",

  restricted = false,
}) => {
  const staticImageUrl = getShowdownTrainerUrl(sprite);

  return {
    id,

    label,

    category,

    gender,

    characterType,

    /*
     * Public:
     * normal Trainer/NPC avatar.
     *
     * restricted:
     * named Pokémon character.
     */
    access: restricted ? "privileged" : "public",

    allowedRoles: restricted ? [...SPECIAL_TRAINER_AVATAR_ROLES] : [],

    animatedFile: null,

    sprite,

    imageUrl: staticImageUrl,

    animatedImageUrl: null,

    staticImageUrl,

    isAnimated: false,

    credit: "Pokémon Showdown trainer sprite — see source credits",

    source: "Pokémon Showdown",

    staticSource: "Pokémon Showdown",
  };
};

/* =========================================================
   EXTRA PUBLIC NPCs

   Available to every authenticated account.
========================================================= */

const PUBLIC_NPC_AVATARS = [
  makeStaticAvatar({
    id: "aroma-lady-extra",

    label: "Aroma Lady",

    sprite: "aromalady.png",

    category: "nature",

    gender: "female",
  }),

  makeStaticAvatar({
    id: "chef-extra",

    label: "Chef",

    sprite: "chef.png",

    category: "service",

    gender: "male",
  }),

  makeStaticAvatar({
    id: "caretaker-extra",

    label: "Caretaker",

    sprite: "caretaker.png",

    category: "service",

    gender: "unspecified",
  }),

  makeStaticAvatar({
    id: "teacher-extra",

    label: "Teacher",

    sprite: "teacher.png",

    category: "professional",

    gender: "female",
  }),

  makeStaticAvatar({
    id: "punk-girl-extra",

    label: "Punk Girl",

    sprite: "punkgirl-gen7.png",

    category: "street",

    gender: "female",
  }),

  makeStaticAvatar({
    id: "doctor-f-extra",

    label: "Doctor",

    sprite: "doctorf-gen8.png",

    category: "professional",

    gender: "female",
  }),

  makeStaticAvatar({
    id: "worker-f-extra",

    label: "Worker",

    sprite: "workerf-gen8.png",

    category: "worker",

    gender: "female",
  }),

  makeStaticAvatar({
    id: "artist-f-extra",

    label: "Artist",

    sprite: "artistf-gen6.png",

    category: "creative",

    gender: "female",
  }),

  makeStaticAvatar({
    id: "aether-employee-m",

    label: "Aether Employee",

    sprite: "aetheremployee.png",

    category: "professional",

    gender: "male",
  }),

  makeStaticAvatar({
    id: "aether-employee-f",

    label: "Aether Employee",

    sprite: "aetheremployeef.png",

    category: "professional",

    gender: "female",
  }),

  makeStaticAvatar({
    id: "league-staff-m",

    label: "League Staff",

    sprite: "leaguestaff.png",

    category: "league",

    gender: "male",
  }),

  makeStaticAvatar({
    id: "league-staff-f",

    label: "League Staff",

    sprite: "leaguestafff.png",

    category: "league",

    gender: "female",
  }),

  makeStaticAvatar({
    id: "young-athlete-m",

    label: "Young Athlete",

    sprite: "youngathlete.png",

    category: "sport",

    gender: "male",
  }),

  makeStaticAvatar({
    id: "young-athlete-f",

    label: "Young Athlete",

    sprite: "youngathletef.png",

    category: "sport",

    gender: "female",
  }),

  makeStaticAvatar({
    id: "team-yell-grunt-m",

    label: "Team Yell Grunt",

    sprite: "yellgrunt.png",

    category: "street",

    gender: "male",
  }),

  makeStaticAvatar({
    id: "team-yell-grunt-f",

    label: "Team Yell Grunt",

    sprite: "yellgruntf.png",

    category: "street",

    gender: "female",
  }),
];

/* =========================================================
   NAMED CHAMPIONS

   Restricted to:
   - admin
   - professor
   - editor
   - champion
========================================================= */

const CHAMPION_AVATARS = [
  makeStaticAvatar({
    id: "champion-cynthia",

    label: "Champion Cynthia",

    sprite: "cynthia.png",

    category: "champion",

    gender: "female",

    characterType: "named",

    restricted: true,
  }),

  makeStaticAvatar({
    id: "champion-steven",

    label: "Champion Steven",

    sprite: "steven.png",

    category: "champion",

    gender: "male",

    characterType: "named",

    restricted: true,
  }),

  makeStaticAvatar({
    id: "champion-lance",

    label: "Champion Lance",

    sprite: "lance.png",

    category: "champion",

    gender: "male",

    characterType: "named",

    restricted: true,
  }),

  makeStaticAvatar({
    id: "champion-wallace",

    label: "Champion Wallace",

    sprite: "wallace-gen3.png",

    category: "champion",

    gender: "male",

    characterType: "named",

    restricted: true,
  }),

  makeStaticAvatar({
    id: "champion-alder",

    label: "Champion Alder",

    sprite: "alder.png",

    category: "champion",

    gender: "male",

    characterType: "named",

    restricted: true,
  }),

  makeStaticAvatar({
    id: "champion-iris",

    label: "Champion Iris",

    sprite: "iris-gen5bw2.png",

    category: "champion",

    gender: "female",

    characterType: "named",

    restricted: true,
  }),

  makeStaticAvatar({
    id: "champion-diantha",

    label: "Champion Diantha",

    sprite: "diantha.png",

    category: "champion",

    gender: "female",

    characterType: "named",

    restricted: true,
  }),

  makeStaticAvatar({
    id: "champion-leon",

    label: "Champion Leon",

    sprite: "leon.png",

    category: "champion",

    gender: "male",

    characterType: "named",

    restricted: true,
  }),

  makeStaticAvatar({
    id: "champion-geeta",

    label: "Champion Geeta",

    sprite: "geeta.png",

    category: "champion",

    gender: "female",

    characterType: "named",

    restricted: true,
  }),

  makeStaticAvatar({
    id: "champion-blue",

    label: "Champion Blue",

    sprite: "blue-gen3champion.png",

    category: "champion",

    gender: "male",

    characterType: "named",

    restricted: true,
  }),
];

/* =========================================================
   NAMED PROFESSORS

   Same restricted access rules.
========================================================= */

const PROFESSOR_AVATARS = [
  makeStaticAvatar({
    id: "professor-rowan",

    label: "Professor Rowan",

    sprite: "rowan.png",

    category: "professor",

    gender: "male",

    characterType: "named",

    restricted: true,
  }),

  makeStaticAvatar({
    id: "professor-juniper",

    label: "Professor Juniper",

    sprite: "juniper.png",

    category: "professor",

    gender: "female",

    characterType: "named",

    restricted: true,
  }),

  makeStaticAvatar({
    id: "professor-sycamore",

    label: "Professor Sycamore",

    sprite: "sycamore.png",

    category: "professor",

    gender: "male",

    characterType: "named",

    restricted: true,
  }),

  makeStaticAvatar({
    id: "professor-kukui",

    label: "Professor Kukui",

    sprite: "kukui.png",

    category: "professor",

    gender: "male",

    characterType: "named",

    restricted: true,
  }),

  makeStaticAvatar({
    id: "professor-magnolia",

    label: "Professor Magnolia",

    sprite: "magnolia.png",

    category: "professor",

    gender: "female",

    characterType: "named",

    restricted: true,
  }),

  makeStaticAvatar({
    id: "professor-laventon",

    label: "Professor Laventon",

    sprite: "laventon.png",

    category: "professor",

    gender: "male",

    characterType: "named",

    restricted: true,
  }),

  makeStaticAvatar({
    id: "professor-sada",

    label: "Professor Sada",

    sprite: "sada.png",

    category: "professor",

    gender: "female",

    characterType: "named",

    restricted: true,
  }),

  makeStaticAvatar({
    id: "professor-turo",

    label: "Professor Turo",

    sprite: "turo.png",

    category: "professor",

    gender: "male",

    characterType: "named",

    restricted: true,
  }),

  makeStaticAvatar({
    id: "professor-willow",

    label: "Professor Willow",

    sprite: "willow.png",

    category: "professor",

    gender: "male",

    characterType: "named",

    restricted: true,
  }),

  makeStaticAvatar({
    id: "professor-sonia",

    label: "Professor Sonia",

    sprite: "sonia-professor.png",

    category: "professor",

    gender: "female",

    characterType: "named",

    restricted: true,
  }),

  makeStaticAvatar({
    id: "professor-burnet",

    label: "Professor Burnet",

    sprite: "burnet.png",

    category: "professor",

    gender: "female",

    characterType: "named",

    restricted: true,
  }),
];

/* =========================================================
   EXPORT
========================================================= */

const RESTRICTED_NAMED_AVATARS = [...CHAMPION_AVATARS, ...PROFESSOR_AVATARS];

const ADDITIONAL_TRAINER_AVATARS = [
  ...PUBLIC_NPC_AVATARS,

  ...RESTRICTED_NAMED_AVATARS,
];

module.exports = {
  PUBLIC_NPC_AVATARS,

  CHAMPION_AVATARS,

  PROFESSOR_AVATARS,

  RESTRICTED_NAMED_AVATARS,

  ADDITIONAL_TRAINER_AVATARS,
};
