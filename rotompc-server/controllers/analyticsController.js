// filepath: rotompc-server/controllers/analyticsController.js

const crypto = require("crypto");

const User = require("../models/User");

const Article = require("../models/Articles");

const ArticleLike = require("../models/ArticleLike");

const ArticleComment = require("../models/ArticleComment");

const BuddyState = require("../models/BuddyState");

const BuddyReward = require("../models/BuddyReward");

const RotomAIConversation = require("../models/RotomAIConversation");

const WebsiteVisit = require("../models/WebsiteVisit");

/* =========================================================
   CONFIG
========================================================= */

/*
 * Prevent accidental duplicate visit writes caused by:
 * - React Strict Mode
 * - very fast reloads
 * - duplicate router notifications
 */
const VISIT_DEDUPE_MS = 10 * 1000;

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/* =========================================================
   HELPERS
========================================================= */

const normalizePath = (value) => {
  let path = String(value || "")
    .trim()
    .slice(0, 300);

  if (!path) {
    return "/";
  }

  /*
   * Never save query parameters or URL hashes.
   */
  path = path.split("?")[0].split("#")[0];

  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  /*
   * Collapse repeated slashes.
   */
  path = path.replace(/\/{2,}/g, "/");

  if (path.length > 1) {
    path = path.replace(/\/+$/, "");
  }

  return path || "/";
};

const getSection = (path) => {
  if (path === "/dashboard" || path.startsWith("/dashboard/")) {
    return "dashboard";
  }

  if (path === "/auth" || path.startsWith("/auth/")) {
    return "auth";
  }

  if (path.startsWith("/")) {
    return "public";
  }

  return "other";
};

const hashVisitorId = (visitorId) => {
  /*
   * VISIT_HASH_SECRET is preferred.
   *
   * JWT_SECRET is an acceptable fallback for the existing
   * project because it is already server-only.
   */
  const secret = String(
    process.env.VISIT_HASH_SECRET ||
      process.env.JWT_SECRET ||
      "rotompc-local-analytics",
  ).trim();

  return crypto.createHmac("sha256", secret).update(visitorId).digest("hex");
};

const getYearRange = (requestedYear) => {
  const currentYear = new Date().getFullYear();

  const parsedYear = Number.parseInt(requestedYear, 10);

  const year =
    Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100
      ? parsedYear
      : currentYear;

  const start = new Date(Date.UTC(year, 0, 1));

  const end = new Date(Date.UTC(year + 1, 0, 1));

  return {
    year,
    start,
    end,
  };
};

const createMonthlySeries = (rows, valueField = "count") => {
  const result = MONTH_NAMES.map((label, index) => ({
    month: index + 1,
    label,
    [valueField]: 0,
  }));

  rows.forEach((row) => {
    const month = Number(row?._id);

    if (month >= 1 && month <= 12) {
      result[month - 1][valueField] = Number(row?.[valueField] || 0);
    }
  });

  return result;
};

const safeNumber = (value, fallback = 0) => {
  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : fallback;
};

/* =========================================================
   RECORD WEBSITE VISIT
========================================================= */

const recordWebsiteVisit = async (req, res) => {
  try {
    const visitorId = String(req.body?.visitorId || "")
      .trim()
      .slice(0, 128);

    if (!visitorId) {
      return res.status(400).json({
        message: "Visitor identifier is required.",
      });
    }

    const path = normalizePath(req.body?.path);

    const section = getSection(path);

    const visitorHash = hashVisitorId(visitorId);

    /*
     * Small duplicate guard.
     *
     * This is not intended to stop a user from legitimately
     * revisiting a page later. It only removes immediate
     * duplicate tracking calls.
     */
    const duplicateSince = new Date(Date.now() - VISIT_DEDUPE_MS);

    const duplicate = await WebsiteVisit.exists({
      visitorHash,

      path,

      createdAt: {
        $gte: duplicateSince,
      },
    });

    if (duplicate) {
      return res.json({
        recorded: false,

        duplicate: true,
      });
    }

    await WebsiteVisit.create({
      visitorHash,

      path,

      section,
    });

    return res.status(201).json({
      recorded: true,

      duplicate: false,
    });
  } catch (error) {
    console.error("recordWebsiteVisit error:", error);

    /*
     * Analytics failure should never break the actual site.
     */
    return res.status(500).json({
      message: "Unable to record website visit.",
    });
  }
};

/* =========================================================
   GET ANALYTICS SUMMARY

   Intended for:
   - admin
   - editor
========================================================= */

const getAnalyticsSummary = async (req, res) => {
  try {
    const { year, start, end } = getYearRange(req.query?.year);

    const now = new Date();

    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    /* =====================================================
       RUN ANALYTICS IN PARALLEL
    ===================================================== */

    const [
      totalUsers,

      activeUsers,

      roleRows,

      averageAgeRows,

      totalArticlesAllTime,

      yearArticles,

      activeYearArticles,

      archivedYearArticles,

      articleMonthRows,

      articleQuarterRows,

      topAuthorRows,

      likesThisYear,

      commentsThisYear,

      currentFollowRows,

      buddyRows,

      rewardRows,

      rotomRows,

      totalVisits,

      yearVisits,

      uniqueVisitorRows,

      visitMonthRows,

      visitSectionRows,

      topPathRows,

      todayVisits,

      last7DayVisits,

      last30DayVisits,
    ] = await Promise.all([
      /* ---------------------------------------------------
         USERS
      --------------------------------------------------- */

      User.countDocuments(),

      User.countDocuments({
        isActive: {
          $ne: false,
        },
      }),

      User.aggregate([
        {
          $group: {
            _id: {
              $ifNull: ["$role", "unknown"],
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            count: -1,
          },
        },
      ]),

      User.aggregate([
        {
          $match: {
            age: {
              $gte: 18,
              $lte: 100,
            },
          },
        },

        {
          $group: {
            _id: null,

            average: {
              $avg: "$age",
            },
          },
        },
      ]),

      /* ---------------------------------------------------
         ARTICLES
      --------------------------------------------------- */

      Article.countDocuments(),

      Article.countDocuments({
        createdAt: {
          $gte: start,
          $lt: end,
        },
      }),

      Article.countDocuments({
        status: "active",

        createdAt: {
          $gte: start,
          $lt: end,
        },
      }),

      Article.countDocuments({
        status: "archived",

        createdAt: {
          $gte: start,
          $lt: end,
        },
      }),

      Article.aggregate([
        {
          $match: {
            createdAt: {
              $gte: start,
              $lt: end,
            },
          },
        },

        {
          $group: {
            _id: {
              $month: "$createdAt",
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            _id: 1,
          },
        },
      ]),

      Article.aggregate([
        {
          $match: {
            createdAt: {
              $gte: start,
              $lt: end,
            },
          },
        },

        {
          $project: {
            status: 1,

            quarter: {
              $ceil: {
                $divide: [
                  {
                    $month: "$createdAt",
                  },

                  3,
                ],
              },
            },
          },
        },

        {
          $group: {
            _id: {
              quarter: "$quarter",

              status: "$status",
            },

            count: {
              $sum: 1,
            },
          },
        },
      ]),

      Article.aggregate([
        {
          $match: {
            createdAt: {
              $gte: start,
              $lt: end,
            },
          },
        },

        {
          $group: {
            _id: {
              $ifNull: ["$author", "Unknown Trainer"],
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            count: -1,
          },
        },

        {
          $limit: 8,
        },
      ]),

      /* ---------------------------------------------------
         SOCIAL ACTIVITY
      --------------------------------------------------- */

      ArticleLike.countDocuments({
        createdAt: {
          $gte: start,
          $lt: end,
        },
      }),

      ArticleComment.countDocuments({
        createdAt: {
          $gte: start,
          $lt: end,
        },
      }),

      User.aggregate([
        {
          $project: {
            count: {
              $size: {
                $ifNull: ["$following", []],
              },
            },
          },
        },

        {
          $group: {
            _id: null,

            total: {
              $sum: "$count",
            },
          },
        },
      ]),

      /* ---------------------------------------------------
         BUDDY
      --------------------------------------------------- */

      BuddyState.aggregate([
        {
          $group: {
            _id: null,

            trainerCount: {
              $sum: 1,
            },

            selectedBuddies: {
              $sum: {
                $cond: [
                  {
                    $ne: ["$pokemon.id", null],
                  },

                  1,

                  0,
                ],
              },
            },

            totalPetCount: {
              $sum: {
                $ifNull: ["$petCount", 0],
              },
            },

            totalPlays: {
              $sum: {
                $ifNull: ["$totalPlays", 0],
              },
            },

            totalBerriesFed: {
              $sum: {
                $ifNull: ["$totalBerriesFed", 0],
              },
            },

            berriesHeld: {
              $sum: {
                $ifNull: ["$berries", 0],
              },
            },

            averageAffection: {
              $avg: {
                $ifNull: ["$affection", 0],
              },
            },

            averageEnergy: {
              $avg: {
                $ifNull: ["$energy", 0],
              },
            },
          },
        },
      ]),

      BuddyReward.aggregate([
        {
          $match: {
            createdAt: {
              $gte: start,
              $lt: end,
            },
          },
        },

        {
          $group: {
            _id: "$action",

            rewards: {
              $sum: 1,
            },

            berries: {
              $sum: "$berries",
            },
          },
        },
      ]),

      /* ---------------------------------------------------
         ROTOM AI
      --------------------------------------------------- */

      RotomAIConversation.aggregate([
        {
          $unwind: "$messages",
        },

        {
          $match: {
            "messages.createdAt": {
              $gte: start,
              $lt: end,
            },
          },
        },

        {
          $group: {
            _id: null,

            messages: {
              $sum: 1,
            },

            userMessages: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$messages.role", "user"],
                  },

                  1,

                  0,
                ],
              },
            },

            assistantMessages: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$messages.role", "assistant"],
                  },

                  1,

                  0,
                ],
              },
            },

            groundedMessages: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $eq: ["$messages.role", "assistant"],
                      },

                      {
                        $eq: ["$messages.grounded", true],
                      },
                    ],
                  },

                  1,

                  0,
                ],
              },
            },
          },
        },
      ]),

      /* ---------------------------------------------------
         WEBSITE VISITS
      --------------------------------------------------- */

      WebsiteVisit.countDocuments(),

      WebsiteVisit.countDocuments({
        createdAt: {
          $gte: start,
          $lt: end,
        },
      }),

      WebsiteVisit.aggregate([
        {
          $match: {
            createdAt: {
              $gte: start,
              $lt: end,
            },
          },
        },

        {
          $group: {
            _id: "$visitorHash",
          },
        },

        {
          $count: "count",
        },
      ]),

      WebsiteVisit.aggregate([
        {
          $match: {
            createdAt: {
              $gte: start,
              $lt: end,
            },
          },
        },

        {
          $group: {
            _id: {
              $month: "$createdAt",
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            _id: 1,
          },
        },
      ]),

      WebsiteVisit.aggregate([
        {
          $match: {
            createdAt: {
              $gte: start,
              $lt: end,
            },
          },
        },

        {
          $group: {
            _id: "$section",

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            count: -1,
          },
        },
      ]),

      WebsiteVisit.aggregate([
        {
          $match: {
            createdAt: {
              $gte: start,
              $lt: end,
            },
          },
        },

        {
          $group: {
            _id: "$path",

            count: {
              $sum: 1,
            },

            uniqueVisitors: {
              $addToSet: "$visitorHash",
            },
          },
        },

        {
          $project: {
            _id: 0,

            path: "$_id",

            count: 1,

            uniqueVisitors: {
              $size: "$uniqueVisitors",
            },
          },
        },

        {
          $sort: {
            count: -1,
          },
        },

        {
          $limit: 10,
        },
      ]),

      WebsiteVisit.countDocuments({
        createdAt: {
          $gte: todayStart,
        },
      }),

      WebsiteVisit.countDocuments({
        createdAt: {
          $gte: last7Days,
        },
      }),

      WebsiteVisit.countDocuments({
        createdAt: {
          $gte: last30Days,
        },
      }),
    ]);

    /* =====================================================
       ROLES
    ===================================================== */

    const roles = roleRows.map((row) => ({
      role: String(row._id || "unknown").toLowerCase(),

      count: safeNumber(row.count),
    }));

    const trainerCount =
      roles.find((row) => row.role === "trainer")?.count || 0;

    const adminCount = roles.find((row) => row.role === "admin")?.count || 0;

    const editorCount = roles.find((row) => row.role === "editor")?.count || 0;

    const professorCount =
      roles.find((row) => row.role === "professor")?.count || 0;

    /* =====================================================
       QUARTERLY ARTICLES
    ===================================================== */

    const quarterlyArticles = [1, 2, 3, 4].map((quarter) => {
      const active =
        articleQuarterRows.find(
          (row) =>
            Number(row?._id?.quarter) === quarter &&
            row?._id?.status === "active",
        )?.count || 0;

      const archived =
        articleQuarterRows.find(
          (row) =>
            Number(row?._id?.quarter) === quarter &&
            row?._id?.status === "archived",
        )?.count || 0;

      return {
        quarter: `Q${quarter}`,

        active: safeNumber(active),

        archived: safeNumber(archived),
      };
    });

    /* =====================================================
       BUDDY
    ===================================================== */

    const buddy = buddyRows[0] || {};

    const rewardMap = {
      like: {
        rewards: 0,
        berries: 0,
      },

      follow: {
        rewards: 0,
        berries: 0,
      },

      post: {
        rewards: 0,
        berries: 0,
      },
    };

    rewardRows.forEach((row) => {
      if (rewardMap[row._id]) {
        rewardMap[row._id] = {
          rewards: safeNumber(row.rewards),

          berries: safeNumber(row.berries),
        };
      }
    });

    /* =====================================================
       ROTOM AI
    ===================================================== */

    const rotom = rotomRows[0] || {};

    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.json({
      year,

      generatedAt: new Date().toISOString(),

      users: {
        total: totalUsers,

        active: activeUsers,

        inactive: Math.max(0, totalUsers - activeUsers),

        trainers: trainerCount,

        admins: adminCount,

        editors: editorCount,

        professors: professorCount,

        averageAge: averageAgeRows[0]?.average
          ? Number(averageAgeRows[0].average.toFixed(1))
          : null,

        roles,
      },

      articles: {
        allTime: totalArticlesAllTime,

        yearTotal: yearArticles,

        active: activeYearArticles,

        archived: archivedYearArticles,

        monthly: createMonthlySeries(articleMonthRows),

        quarterly: quarterlyArticles,

        topAuthors: topAuthorRows.map((row) => ({
          author: String(row._id || "Unknown Trainer"),

          count: safeNumber(row.count),
        })),
      },

      social: {
        likesThisYear: likesThisYear,

        commentsThisYear: commentsThisYear,

        currentFollows: safeNumber(currentFollowRows[0]?.total),
      },

      buddy: {
        trainerStates: safeNumber(buddy.trainerCount),

        selectedBuddies: safeNumber(buddy.selectedBuddies),

        petCount: safeNumber(buddy.totalPetCount),

        plays: safeNumber(buddy.totalPlays),

        berriesFed: safeNumber(buddy.totalBerriesFed),

        berriesHeld: safeNumber(buddy.berriesHeld),

        averageAffection: Number(safeNumber(buddy.averageAffection).toFixed(1)),

        averageEnergy: Number(safeNumber(buddy.averageEnergy).toFixed(1)),

        rewardsThisYear: rewardMap,
      },

      rotomAI: {
        messagesThisYear: safeNumber(rotom.messages),

        userMessages: safeNumber(rotom.userMessages),

        assistantMessages: safeNumber(rotom.assistantMessages),

        groundedMessages: safeNumber(rotom.groundedMessages),
      },

      visits: {
        allTime: totalVisits,

        yearTotal: yearVisits,

        uniqueVisitors: safeNumber(uniqueVisitorRows[0]?.count),

        today: todayVisits,

        last7Days: last7DayVisits,

        last30Days: last30DayVisits,

        monthly: createMonthlySeries(visitMonthRows),

        sections: visitSectionRows.map((row) => ({
          section: String(row._id || "other"),

          count: safeNumber(row.count),
        })),

        topPaths: topPathRows.map((row) => ({
          path: row.path,

          count: safeNumber(row.count),

          uniqueVisitors: safeNumber(row.uniqueVisitors),
        })),
      },
    });
  } catch (error) {
    console.error("getAnalyticsSummary error:", error);

    return res.status(500).json({
      message: "Unable to load analytics.",
    });
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  recordWebsiteVisit,

  getAnalyticsSummary,
};
