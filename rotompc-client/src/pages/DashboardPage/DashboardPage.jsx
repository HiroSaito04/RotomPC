// filepath: rotompc-client/src/pages/DashboardPage/DashboardPage.jsx

import { useCallback, useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";

import { fetchAnalyticsSummary } from "@/services/AnalyticsService";

/* =========================================================
   COLORS
========================================================= */

const ROTOM_RED = "#cc0000";

const ROTOM_DARK = "#1A1A1A";

const ROTOM_BLUE = "#3b4cca";

const ROTOM_CYAN = "#00A8CC";

const ROTOM_YELLOW = "#FFB300";

const ROTOM_GREEN = "#4dad5b";

const ROLE_COLORS = {
  admin: "#1A1A1A",

  trainer: "#ff1c1c",

  professor: "#00E5FF",

  editor: "#FFB300",

  unknown: "#71717a",
};

/* =========================================================
   HELPERS
========================================================= */

const formatNumber = (value) => {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
};

const formatDecimal = (value, fallback = "—") => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return number.toFixed(1);
};

const capitalize = (value) => {
  const text = String(value || "");

  if (!text) {
    return "";
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
};

const trimText = (value, maxLength = 30) => {
  const text = String(value || "");

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
};

/* =========================================================
   METRIC CARD
========================================================= */

const MetricCard = ({
  label,

  value,

  helper,

  accent = ROTOM_DARK,

  compact = false,
}) => {
  return (
    <Paper
      sx={{
        position: "relative",

        minWidth: 0,

        minHeight: compact
          ? {
              xs: 118,
              sm: 125,
            }
          : {
              xs: 135,
              sm: 145,
            },

        p: {
          xs: 1.75,
          sm: 2.25,
        },

        border: "2px solid #1A1A1A",

        borderRadius: 2,

        bgcolor: "#fff",

        boxShadow: "4px 4px 0px #000",

        overflow: "hidden",
      }}
    >
      {/* Accent strip */}

      <Box
        sx={{
          position: "absolute",

          top: 0,

          right: 0,

          width: 8,

          height: "100%",

          bgcolor: accent,
        }}
      />

      <Typography
        sx={{
          pr: 1,

          color: "text.secondary",

          fontSize: {
            xs: "0.58rem",
            sm: "0.65rem",
          },

          fontWeight: 900,

          lineHeight: 1.2,

          letterSpacing: "0.075em",

          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: 0.8,

          pr: 1,

          color: accent,

          fontSize: compact
            ? {
                xs: "1.6rem",
                sm: "1.9rem",
              }
            : {
                xs: "1.9rem",
                sm: "2.35rem",
                lg: "2.6rem",
              },

          fontWeight: 900,

          lineHeight: 1,

          overflowWrap: "anywhere",
        }}
      >
        {value}
      </Typography>

      {helper && (
        <Typography
          sx={{
            mt: 0.8,

            pr: 1,

            color: "text.secondary",

            fontSize: {
              xs: "0.64rem",
              sm: "0.7rem",
            },

            fontWeight: 650,

            lineHeight: 1.35,
          }}
        >
          {helper}
        </Typography>
      )}
    </Paper>
  );
};

/* =========================================================
   PANEL
========================================================= */

const DashboardPanel = ({
  title,

  description,

  children,

  fullWidth = false,
}) => {
  return (
    <Paper
      sx={{
        minWidth: 0,

        p: {
          xs: 1.75,
          sm: 2.5,
          lg: 3,
        },

        border: "2px solid #1A1A1A",

        borderRadius: 2,

        bgcolor: "#fff",

        boxShadow: "4px 4px 0px #000",

        overflow: "hidden",

        gridColumn: fullWidth
          ? {
              xs: "auto",

              xl: "1 / -1",
            }
          : "auto",
      }}
    >
      <Typography
        sx={{
          color: ROTOM_DARK,

          fontSize: {
            xs: "0.9rem",
            sm: "1rem",
            lg: "1.1rem",
          },

          fontWeight: 900,

          lineHeight: 1.2,

          textTransform: "uppercase",
        }}
      >
        {title}
      </Typography>

      {description && (
        <Typography
          sx={{
            mt: 0.45,

            color: "text.secondary",

            fontSize: {
              xs: "0.66rem",
              sm: "0.73rem",
            },

            fontWeight: 600,

            lineHeight: 1.4,
          }}
        >
          {description}
        </Typography>
      )}

      <Box
        sx={{
          mt: 2,

          minWidth: 0,
        }}
      >
        {children}
      </Box>
    </Paper>
  );
};

/* =========================================================
   EMPTY STATE
========================================================= */

const EmptyData = ({ children }) => {
  return (
    <Box
      sx={{
        display: "flex",

        minHeight: 220,

        alignItems: "center",

        justifyContent: "center",

        border: "2px dashed #d4d4d8",

        borderRadius: 2,

        bgcolor: "#fafafa",

        px: 2,

        textAlign: "center",
      }}
    >
      <Typography
        sx={{
          color: "#71717a",

          fontSize: "0.75rem",

          fontWeight: 800,

          lineHeight: 1.5,
        }}
      >
        {children}
      </Typography>
    </Box>
  );
};

/* =========================================================
   ACTIVITY ROW
========================================================= */

const ActivityRow = ({
  label,

  value,

  helper,

  accent = ROTOM_DARK,
}) => {
  return (
    <Box
      sx={{
        display: "grid",

        gridTemplateColumns: "minmax(0, 1fr) auto",

        alignItems: "center",

        gap: 1.5,

        p: {
          xs: 1.25,
          sm: 1.5,
        },

        border: "1px solid #e4e4e7",

        borderRadius: 1.5,

        bgcolor: "#fafafa",
      }}
    >
      <Box
        sx={{
          minWidth: 0,
        }}
      >
        <Typography
          sx={{
            color: ROTOM_DARK,

            fontSize: {
              xs: "0.73rem",
              sm: "0.78rem",
            },

            fontWeight: 850,

            lineHeight: 1.25,
          }}
        >
          {label}
        </Typography>

        {helper && (
          <Typography
            sx={{
              mt: 0.2,

              color: "text.secondary",

              fontSize: {
                xs: "0.59rem",
                sm: "0.64rem",
              },

              fontWeight: 600,

              lineHeight: 1.35,
            }}
          >
            {helper}
          </Typography>
        )}
      </Box>

      <Typography
        sx={{
          color: accent,

          fontSize: {
            xs: "0.92rem",
            sm: "1rem",
          },

          fontWeight: 900,

          whiteSpace: "nowrap",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

/* =========================================================
   DASHBOARD
========================================================= */

function DashboardPage() {
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard = useCallback(async ({ year, refresh = false }) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetchAnalyticsSummary(year);

      setReport(response.data);
    } catch (err) {
      console.error("Dashboard analytics error:", err);

      setError(
        err.response?.data?.message || "Unable to load dashboard analytics.",
      );
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  }, []);

  /* =======================================================
     INITIAL / YEAR LOAD
  ======================================================= */

  useEffect(() => {
    loadDashboard({
      year: selectedYear,
    });
  }, [selectedYear, loadDashboard]);

  /* =======================================================
     YEARS
  ======================================================= */

  const years = useMemo(() => {
    const firstYear = 2025;

    const result = [];

    for (let year = currentYear; year >= firstYear; year -= 1) {
      result.push(year);
    }

    return result;
  }, [currentYear]);

  /* =======================================================
     ROLE DISTRIBUTION
  ======================================================= */

  const userDistribution = useMemo(() => {
    return (report?.users?.roles || []).map((item, index) => ({
      id: index,

      value: Number(item.count) || 0,

      label: capitalize(item.role),

      color: ROLE_COLORS[item.role] || ROLE_COLORS.unknown,
    }));
  }, [report]);

  /* =======================================================
     MONTHLY DATA
  ======================================================= */

  const monthlyVisits = report?.visits?.monthly || [];

  const monthlyArticles = report?.articles?.monthly || [];

  /* =======================================================
     TOP PATHS
  ======================================================= */

  const topPaths = report?.visits?.topPaths || [];

  /* =======================================================
     TOP AUTHORS
  ======================================================= */

  const topAuthors = report?.articles?.topAuthors || [];

  /* =======================================================
     RATIOS
  ======================================================= */

  const activeUserRate = useMemo(() => {
    const total = Number(report?.users?.total) || 0;

    const active = Number(report?.users?.active) || 0;

    if (!total) {
      return 0;
    }

    return Math.round((active / total) * 100);
  }, [report]);

  const buddyCoverage = useMemo(() => {
    const trainers = Number(report?.users?.trainers) || 0;

    const selected = Number(report?.buddy?.selectedBuddies) || 0;

    if (!trainers) {
      return 0;
    }

    return Math.min(
      100,

      Math.round((selected / trainers) * 100),
    );
  }, [report]);

  const groundedRate = useMemo(() => {
    const replies = Number(report?.rotomAI?.assistantMessages) || 0;

    const grounded = Number(report?.rotomAI?.groundedMessages) || 0;

    if (!replies) {
      return 0;
    }

    return Math.round((grounded / replies) * 100);
  }, [report]);

  /* =======================================================
     BUTTON STYLE
  ======================================================= */

  const buttonStyle = {
    minHeight: 40,

    border: "2px solid #1A1A1A",

    borderRadius: 2,

    boxShadow: "3px 3px 0px #000",

    px: {
      xs: 1.5,
      sm: 2,
    },

    fontSize: {
      xs: "0.68rem",
      sm: "0.74rem",
    },

    fontWeight: 900,

    textTransform: "none",

    whiteSpace: "nowrap",

    transition: "all 0.15s ease",

    "&:active": {
      transform: "translate(3px, 3px)",

      boxShadow: "none",
    },
  };

  const secondaryButton = {
    ...buttonStyle,

    bgcolor: "#fff",

    color: ROTOM_DARK,

    "&:hover": {
      bgcolor: "#f4f4f5",

      transform: "translate(1px, 1px)",

      boxShadow: "2px 2px 0px #000",
    },
  };

  const primaryButton = {
    ...buttonStyle,

    bgcolor: ROTOM_RED,

    color: "#fff",

    "&:hover": {
      bgcolor: "#a30000",

      transform: "translate(1px, 1px)",

      boxShadow: "2px 2px 0px #000",
    },
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",

          minHeight: "55vh",

          alignItems: "center",

          justifyContent: "center",
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress
            sx={{
              color: ROTOM_RED,
            }}
          />

          <Typography
            sx={{
              color: "text.secondary",

              fontSize: "0.75rem",

              fontWeight: 800,
            }}
          >
            Loading command center...
          </Typography>
        </Stack>
      </Box>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <Box
      sx={{
        width: "100%",

        minWidth: 0,

        pb: {
          xs: 2,
          sm: 4,
        },
      }}
    >
      {/* =================================================
          HEADER
      ================================================== */}

      <Stack
        direction={{
          xs: "column",
          lg: "row",
        }}
        alignItems={{
          xs: "stretch",
          lg: "center",
        }}
        justifyContent="space-between"
        spacing={2.5}
        sx={{
          mb: {
            xs: 3,
            sm: 4,
          },
        }}
      >
        <Box
          sx={{
            minWidth: 0,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: ROTOM_DARK,

              fontSize: {
                xs: "1.55rem",
                sm: "1.9rem",
                lg: "2.125rem",
              },

              fontStyle: "italic",

              fontWeight: 900,

              lineHeight: 1,

              textTransform: "uppercase",
            }}
          >
            DASHBOARD{" "}
            <Box
              component="span"
              sx={{
                color: ROTOM_RED,
              }}
            >
              OVERVIEW
            </Box>
          </Typography>

          <Typography
            sx={{
              mt: 1,

              maxWidth: 700,

              color: "text.secondary",

              fontSize: {
                xs: "0.74rem",
                sm: "0.84rem",
              },

              fontWeight: 600,

              lineHeight: 1.5,
            }}
          >
            Live RotomPC command center showing traffic, Trainer activity,
            PokéSocial engagement, Buddy activity, reports, and RotomAI usage.
          </Typography>
        </Box>

        {/* ===============================================
            ACTIONS
        ================================================ */}

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={1.2}
          sx={{
            width: {
              xs: "100%",
              lg: "auto",
            },
          }}
        >
          <FormControl
            size="small"
            sx={{
              minWidth: {
                xs: "100%",
                sm: 108,
              },

              bgcolor: "#fff",

              borderRadius: 2,

              "& .MuiOutlinedInput-root": {
                minHeight: 40,

                fontWeight: 900,

                "& fieldset": {
                  border: "2px solid #1A1A1A",
                },

                "&:hover fieldset": {
                  borderColor: "#1A1A1A",
                },

                "&.Mui-focused fieldset": {
                  borderColor: ROTOM_RED,
                },
              },
            }}
          >
            <Select
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              inputProps={{
                "aria-label": "Dashboard year",
              }}
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            type="button"
            disabled={refreshing}
            onClick={() =>
              loadDashboard({
                year: selectedYear,

                refresh: true,
              })
            }
            sx={{
              ...secondaryButton,

              width: {
                xs: "100%",
                sm: "auto",
              },
            }}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>

          <Button
            type="button"
            onClick={() => navigate("/dashboard/reports")}
            sx={{
              ...primaryButton,

              width: {
                xs: "100%",
                sm: "auto",
              },
            }}
          >
            Full Reports
          </Button>
        </Stack>
      </Stack>

      {/* =================================================
          ERROR
      ================================================== */}

      {error && (
        <Paper
          sx={{
            mb: 3,

            p: 2,

            border: "2px solid #b91c1c",

            borderRadius: 2,

            bgcolor: "#fef2f2",

            color: "#991b1b",

            boxShadow: "3px 3px 0px #b91c1c",
          }}
        >
          <Typography
            sx={{
              fontSize: "0.76rem",

              fontWeight: 800,
            }}
          >
            {error}
          </Typography>
        </Paper>
      )}

      {!report ? (
        <EmptyData>Dashboard analytics are currently unavailable.</EmptyData>
      ) : (
        <>
          {/* =============================================
              MAIN SUMMARY
          ============================================== */}

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",

                sm: "repeat(2, minmax(0, 1fr))",

                md: "repeat(3, minmax(0, 1fr))",

                xl: "repeat(6, minmax(0, 1fr))",
              },

              gap: {
                xs: 1.5,
                sm: 2,
              },

              mb: {
                xs: 3,
                sm: 4,
              },
            }}
          >
            <MetricCard
              label="Website Visits"
              value={formatNumber(report.visits?.yearTotal)}
              helper={`${formatNumber(report.visits?.today)} today`}
              accent={ROTOM_RED}
            />

            <MetricCard
              label="Unique Visitors"
              value={formatNumber(report.visits?.uniqueVisitors)}
              helper={`${formatNumber(
                report.visits?.last30Days,
              )} visits in 30 days`}
              accent={ROTOM_BLUE}
            />

            <MetricCard
              label="Registered Users"
              value={formatNumber(report.users?.total)}
              helper={`${formatNumber(report.users?.active)} active`}
              accent={ROTOM_DARK}
            />

            <MetricCard
              label="Trainers"
              value={formatNumber(report.users?.trainers)}
              helper={`${activeUserRate}% account activity`}
              accent={ROTOM_RED}
            />

            <MetricCard
              label={`${selectedYear} Reports`}
              value={formatNumber(report.articles?.yearTotal)}
              helper={`${formatNumber(
                report.articles?.active,
              )} currently active`}
              accent={ROTOM_GREEN}
            />

            <MetricCard
              label="RotomAI Messages"
              value={formatNumber(report.rotomAI?.messagesThisYear)}
              helper={`${groundedRate}% grounded replies`}
              accent={ROTOM_CYAN}
            />
          </Box>

          {/* =============================================
              QUICK ACTIVITY
          ============================================== */}

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",

                sm: "repeat(2, minmax(0, 1fr))",

                lg: "repeat(4, minmax(0, 1fr))",
              },

              gap: {
                xs: 1.5,
                sm: 2,
              },

              mb: {
                xs: 3,
                sm: 4,
              },
            }}
          >
            <MetricCard
              compact
              label="PokéSocial Likes"
              value={formatNumber(report.social?.likesThisYear)}
              helper={`${formatNumber(
                report.social?.commentsThisYear,
              )} comments`}
              accent="#e11d48"
            />

            <MetricCard
              compact
              label="Current Follows"
              value={formatNumber(report.social?.currentFollows)}
              helper="Current network links"
              accent={ROTOM_BLUE}
            />

            <MetricCard
              compact
              label="Selected Buddies"
              value={formatNumber(report.buddy?.selectedBuddies)}
              helper={`${buddyCoverage}% of Trainers`}
              accent={ROTOM_YELLOW}
            />

            <MetricCard
              compact
              label="Average User Age"
              value={report.users?.averageAge ?? "—"}
              helper="Valid registered ages"
              accent={ROTOM_RED}
            />
          </Box>

          {/* =============================================
              MAIN CHARTS
          ============================================== */}

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",

                xl: "minmax(0, 1.4fr) minmax(320px, 0.6fr)",
              },

              gap: {
                xs: 2.5,
                sm: 3,
              },

              mb: {
                xs: 2.5,
                sm: 3,
              },
            }}
          >
            {/* =========================================
                WEBSITE TRAFFIC
            ========================================== */}

            <DashboardPanel
              title="Website Traffic"
              description={`Monthly visits recorded during ${selectedYear}`}
            >
              {monthlyVisits.some((item) => Number(item.count) > 0) ? (
                <Box
                  sx={{
                    width: "100%",

                    overflowX: "auto",

                    pb: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      minWidth: {
                        xs: 520,
                        md: 0,
                      },

                      width: "100%",
                    }}
                  >
                    <BarChart
                      xAxis={[
                        {
                          scaleType: "band",

                          data: monthlyVisits.map((item) => item.label),

                          tickLabelStyle: {
                            fontSize: 10,
                          },
                        },
                      ]}
                      series={[
                        {
                          data: monthlyVisits.map(
                            (item) => Number(item.count) || 0,
                          ),

                          label: "Visits",

                          color: ROTOM_RED,
                        },
                      ]}
                      height={300}
                      margin={{
                        top: 25,

                        right: 10,

                        bottom: 35,

                        left: 45,
                      }}
                    />
                  </Box>
                </Box>
              ) : (
                <EmptyData>
                  No website traffic has been recorded for {selectedYear} yet.
                </EmptyData>
              )}
            </DashboardPanel>

            {/* =========================================
                USER ROLES
            ========================================== */}

            <DashboardPanel
              title="User Roles"
              description="Current account distribution"
            >
              {userDistribution.length > 0 ? (
                <>
                  <Box
                    sx={{
                      display: "flex",

                      width: "100%",

                      minWidth: 0,

                      minHeight: {
                        xs: 230,
                        sm: 270,
                      },

                      alignItems: "center",

                      justifyContent: "center",
                    }}
                  >
                    <PieChart
                      series={[
                        {
                          data: userDistribution,

                          innerRadius: 45,

                          outerRadius: 82,

                          paddingAngle: 4,

                          cornerRadius: 3,
                        },
                      ]}
                      height={260}
                      margin={{
                        top: 10,

                        right: 10,

                        bottom: 10,

                        left: 10,
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",

                      flexWrap: "wrap",

                      gap: 0.8,

                      mt: 1,
                    }}
                  >
                    {userDistribution.map((role) => (
                      <Box
                        key={role.label}
                        sx={{
                          display: "inline-flex",

                          alignItems: "center",

                          gap: 0.6,

                          border: "1px solid #d4d4d8",

                          borderRadius: 999,

                          bgcolor: "#fafafa",

                          px: 1,

                          py: 0.45,
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,

                            height: 8,

                            flexShrink: 0,

                            borderRadius: "50%",

                            bgcolor: role.color,
                          }}
                        />

                        <Typography
                          sx={{
                            fontSize: "0.64rem",

                            fontWeight: 850,
                          }}
                        >
                          {role.label} {role.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <EmptyData>No user-role data is available.</EmptyData>
              )}
            </DashboardPanel>
          </Box>

          {/* =============================================
              SECOND CHART ROW
          ============================================== */}

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",

                xl: "repeat(2, minmax(0, 1fr))",
              },

              gap: {
                xs: 2.5,
                sm: 3,
              },

              mb: {
                xs: 2.5,
                sm: 3,
              },
            }}
          >
            {/* =========================================
                MONTHLY REPORTS
            ========================================== */}

            <DashboardPanel
              title="Report Publishing"
              description={`Reports created during ${selectedYear}`}
            >
              {monthlyArticles.some((item) => Number(item.count) > 0) ? (
                <Box
                  sx={{
                    width: "100%",

                    overflowX: "auto",

                    pb: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      minWidth: {
                        xs: 500,
                        md: 0,
                      },

                      width: "100%",
                    }}
                  >
                    <BarChart
                      xAxis={[
                        {
                          scaleType: "band",

                          data: monthlyArticles.map((item) => item.label),

                          tickLabelStyle: {
                            fontSize: 10,
                          },
                        },
                      ]}
                      series={[
                        {
                          data: monthlyArticles.map(
                            (item) => Number(item.count) || 0,
                          ),

                          label: "Reports",

                          color: ROTOM_DARK,
                        },
                      ]}
                      height={285}
                      margin={{
                        top: 25,

                        right: 10,

                        bottom: 35,

                        left: 45,
                      }}
                    />
                  </Box>
                </Box>
              ) : (
                <EmptyData>
                  No reports were created during {selectedYear}.
                </EmptyData>
              )}
            </DashboardPanel>

            {/* =========================================
                POKÉSOCIAL
            ========================================== */}

            <DashboardPanel
              title="PokéSocial Activity"
              description="Likes and comments use the selected year; follows show the current network"
            >
              <Box
                sx={{
                  width: "100%",

                  overflowX: "auto",

                  pb: 0.5,
                }}
              >
                <Box
                  sx={{
                    minWidth: {
                      xs: 430,
                      md: 0,
                    },

                    width: "100%",
                  }}
                >
                  <BarChart
                    xAxis={[
                      {
                        scaleType: "band",

                        data: ["Likes", "Comments", "Follows"],
                      },
                    ]}
                    series={[
                      {
                        data: [
                          Number(report.social?.likesThisYear) || 0,

                          Number(report.social?.commentsThisYear) || 0,

                          Number(report.social?.currentFollows) || 0,
                        ],

                        label: "Activity",

                        color: "#ff1c1c",
                      },
                    ]}
                    height={285}
                    margin={{
                      top: 25,

                      right: 10,

                      bottom: 35,

                      left: 45,
                    }}
                  />
                </Box>
              </Box>
            </DashboardPanel>
          </Box>

          {/* =============================================
              ACTIVITY + BUDDY / AI
          ============================================== */}

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",

                lg: "repeat(2, minmax(0, 1fr))",

                xl: "repeat(3, minmax(0, 1fr))",
              },

              gap: {
                xs: 2.5,
                sm: 3,
              },

              mb: {
                xs: 2.5,
                sm: 3,
              },
            }}
          >
            {/* =========================================
                TRAFFIC SNAPSHOT
            ========================================== */}

            <DashboardPanel
              title="Traffic Snapshot"
              description="Recent website activity"
            >
              <Stack spacing={1}>
                <ActivityRow
                  label="Visits today"
                  helper="Since local day start"
                  value={formatNumber(report.visits?.today)}
                  accent={ROTOM_RED}
                />

                <ActivityRow
                  label="Last 7 days"
                  helper="Recent traffic volume"
                  value={formatNumber(report.visits?.last7Days)}
                  accent={ROTOM_YELLOW}
                />

                <ActivityRow
                  label="Last 30 days"
                  helper="Rolling traffic volume"
                  value={formatNumber(report.visits?.last30Days)}
                  accent={ROTOM_BLUE}
                />

                <ActivityRow
                  label="All-time visits"
                  helper="Since tracking started"
                  value={formatNumber(report.visits?.allTime)}
                  accent={ROTOM_DARK}
                />
              </Stack>
            </DashboardPanel>

            {/* =========================================
                BUDDY
            ========================================== */}

            <DashboardPanel
              title="Buddy Network"
              description="Current and lifetime Buddy activity"
            >
              <Stack spacing={1}>
                <ActivityRow
                  label="Selected Buddies"
                  helper={`${buddyCoverage}% of Trainer accounts`}
                  value={formatNumber(report.buddy?.selectedBuddies)}
                  accent={ROTOM_YELLOW}
                />

                <ActivityRow
                  label="Pet interactions"
                  helper="Lifetime successful pets"
                  value={formatNumber(report.buddy?.petCount)}
                  accent="#e11d48"
                />

                <ActivityRow
                  label="Play interactions"
                  helper="Lifetime Buddy play sessions"
                  value={formatNumber(report.buddy?.plays)}
                  accent={ROTOM_BLUE}
                />

                <ActivityRow
                  label="Berries fed"
                  helper={`${formatNumber(
                    report.buddy?.berriesHeld,
                  )} berries currently held`}
                  value={formatNumber(report.buddy?.berriesFed)}
                  accent={ROTOM_GREEN}
                />
              </Stack>
            </DashboardPanel>

            {/* =========================================
                ROTOM AI
            ========================================== */}

            <DashboardPanel
              title="RotomAI Activity"
              description={`AI usage during ${selectedYear}`}
            >
              <Stack spacing={1}>
                <ActivityRow
                  label="Trainer messages"
                  helper="Questions sent to RotomAI"
                  value={formatNumber(report.rotomAI?.userMessages)}
                  accent={ROTOM_BLUE}
                />

                <ActivityRow
                  label="RotomAI replies"
                  helper="Assistant messages generated"
                  value={formatNumber(report.rotomAI?.assistantMessages)}
                  accent={ROTOM_CYAN}
                />

                <ActivityRow
                  label="Grounded replies"
                  helper={`${groundedRate}% of AI replies`}
                  value={formatNumber(report.rotomAI?.groundedMessages)}
                  accent={ROTOM_GREEN}
                />

                <ActivityRow
                  label="Total messages"
                  helper="Trainer + assistant messages"
                  value={formatNumber(report.rotomAI?.messagesThisYear)}
                  accent={ROTOM_DARK}
                />
              </Stack>
            </DashboardPanel>
          </Box>

          {/* =============================================
              MOST VISITED + TOP AUTHORS
          ============================================== */}

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",

                xl: "repeat(2, minmax(0, 1fr))",
              },

              gap: {
                xs: 2.5,
                sm: 3,
              },

              mb: {
                xs: 2.5,
                sm: 3,
              },
            }}
          >
            {/* =========================================
                MOST VISITED
            ========================================== */}

            <DashboardPanel
              title="Most Visited Pages"
              description={`Top routes during ${selectedYear}`}
            >
              {topPaths.length > 0 ? (
                <Stack spacing={1}>
                  {topPaths.slice(0, 6).map((item, index) => (
                    <Box
                      key={item.path}
                      sx={{
                        display: "grid",

                        gridTemplateColumns: {
                          xs: "28px minmax(0, 1fr)",

                          sm: "30px minmax(0, 1fr) auto",
                        },

                        alignItems: "center",

                        gap: 1,

                        p: 1.2,

                        border: "1px solid #e4e4e7",

                        borderRadius: 1.5,

                        bgcolor: "#fafafa",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",

                          width: 25,

                          height: 25,

                          alignItems: "center",

                          justifyContent: "center",

                          borderRadius: "50%",

                          bgcolor: ROTOM_DARK,

                          color: "#fff",

                          fontSize: "0.62rem",

                          fontWeight: 900,
                        }}
                      >
                        {index + 1}
                      </Box>

                      <Box
                        sx={{
                          minWidth: 0,
                        }}
                      >
                        <Typography
                          title={item.path}
                          sx={{
                            overflow: "hidden",

                            textOverflow: "ellipsis",

                            whiteSpace: "nowrap",

                            fontSize: {
                              xs: "0.7rem",

                              sm: "0.76rem",
                            },

                            fontWeight: 850,
                          }}
                        >
                          {trimText(item.path, 40)}
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.15,

                            color: "text.secondary",

                            fontSize: "0.59rem",

                            fontWeight: 650,
                          }}
                        >
                          {formatNumber(item.uniqueVisitors)} unique
                        </Typography>

                        <Typography
                          sx={{
                            display: {
                              xs: "block",

                              sm: "none",
                            },

                            mt: 0.35,

                            color: ROTOM_RED,

                            fontSize: "0.68rem",

                            fontWeight: 900,
                          }}
                        >
                          {formatNumber(item.count)} visits
                        </Typography>
                      </Box>

                      <Typography
                        sx={{
                          display: {
                            xs: "none",

                            sm: "block",
                          },

                          color: ROTOM_RED,

                          fontSize: "0.8rem",

                          fontWeight: 900,

                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatNumber(item.count)} visits
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <EmptyData>
                  No website route data has been recorded yet.
                </EmptyData>
              )}
            </DashboardPanel>

            {/* =========================================
                TOP AUTHORS
            ========================================== */}

            <DashboardPanel
              title="Top Report Authors"
              description={`Most active authors during ${selectedYear}`}
            >
              {topAuthors.length > 0 ? (
                <Stack spacing={1}>
                  {topAuthors.slice(0, 6).map((author, index) => (
                    <Box
                      key={`${author.author}-${index}`}
                      sx={{
                        display: "grid",

                        gridTemplateColumns: "30px minmax(0, 1fr) auto",

                        alignItems: "center",

                        gap: 1,

                        p: 1.2,

                        border: "1px solid #e4e4e7",

                        borderRadius: 1.5,

                        bgcolor: "#fafafa",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",

                          width: 25,

                          height: 25,

                          alignItems: "center",

                          justifyContent: "center",

                          borderRadius: "50%",

                          bgcolor: index === 0 ? ROTOM_RED : ROTOM_DARK,

                          color: "#fff",

                          fontSize: "0.62rem",

                          fontWeight: 900,
                        }}
                      >
                        {index + 1}
                      </Box>

                      <Typography
                        title={author.author}
                        sx={{
                          minWidth: 0,

                          overflow: "hidden",

                          textOverflow: "ellipsis",

                          whiteSpace: "nowrap",

                          fontSize: {
                            xs: "0.7rem",

                            sm: "0.76rem",
                          },

                          fontWeight: 850,
                        }}
                      >
                        {trimText(author.author, 32)}
                      </Typography>

                      <Typography
                        sx={{
                          color: ROTOM_RED,

                          fontSize: "0.8rem",

                          fontWeight: 900,

                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatNumber(author.count)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <EmptyData>No report authors for {selectedYear}.</EmptyData>
              )}
            </DashboardPanel>
          </Box>

          {/* =============================================
              SYSTEM SNAPSHOT
          ============================================== */}

          <DashboardPanel
            title="System Snapshot"
            description="Current RotomPC operational metrics"
            fullWidth
          >
            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",

                  sm: "repeat(3, minmax(0, 1fr))",

                  lg: "repeat(6, minmax(0, 1fr))",
                },

                gap: {
                  xs: 1,
                  sm: 1.5,
                },

                "@media (max-width: 380px)": {
                  gridTemplateColumns: "1fr",
                },
              }}
            >
              <Box
                sx={{
                  p: 1.4,

                  borderRadius: 1.5,

                  bgcolor: "#f4f4f5",
                }}
              >
                <Typography
                  sx={{
                    color: "text.secondary",

                    fontSize: "0.58rem",

                    fontWeight: 850,

                    textTransform: "uppercase",
                  }}
                >
                  Active Rate
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,

                    fontSize: "1.2rem",

                    fontWeight: 900,
                  }}
                >
                  {activeUserRate}%
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 1.4,

                  borderRadius: 1.5,

                  bgcolor: "#fff7ed",
                }}
              >
                <Typography
                  sx={{
                    color: "text.secondary",

                    fontSize: "0.58rem",

                    fontWeight: 850,

                    textTransform: "uppercase",
                  }}
                >
                  Avg. Age
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,

                    fontSize: "1.2rem",

                    fontWeight: 900,

                    color: ROTOM_RED,
                  }}
                >
                  {formatDecimal(report.users?.averageAge)}
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 1.4,

                  borderRadius: 1.5,

                  bgcolor: "#fefce8",
                }}
              >
                <Typography
                  sx={{
                    color: "text.secondary",

                    fontSize: "0.58rem",

                    fontWeight: 850,

                    textTransform: "uppercase",
                  }}
                >
                  Avg. Affection
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,

                    fontSize: "1.2rem",

                    fontWeight: 900,

                    color: ROTOM_YELLOW,
                  }}
                >
                  {formatDecimal(report.buddy?.averageAffection)}
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 1.4,

                  borderRadius: 1.5,

                  bgcolor: "#eff6ff",
                }}
              >
                <Typography
                  sx={{
                    color: "text.secondary",

                    fontSize: "0.58rem",

                    fontWeight: 850,

                    textTransform: "uppercase",
                  }}
                >
                  Avg. Energy
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,

                    fontSize: "1.2rem",

                    fontWeight: 900,

                    color: ROTOM_BLUE,
                  }}
                >
                  {formatDecimal(report.buddy?.averageEnergy)}
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 1.4,

                  borderRadius: 1.5,

                  bgcolor: "#f0fdf4",
                }}
              >
                <Typography
                  sx={{
                    color: "text.secondary",

                    fontSize: "0.58rem",

                    fontWeight: 850,

                    textTransform: "uppercase",
                  }}
                >
                  Buddy Coverage
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,

                    fontSize: "1.2rem",

                    fontWeight: 900,

                    color: ROTOM_GREEN,
                  }}
                >
                  {buddyCoverage}%
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 1.4,

                  borderRadius: 1.5,

                  bgcolor: "#ecfeff",
                }}
              >
                <Typography
                  sx={{
                    color: "text.secondary",

                    fontSize: "0.58rem",

                    fontWeight: 850,

                    textTransform: "uppercase",
                  }}
                >
                  AI Grounded
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,

                    fontSize: "1.2rem",

                    fontWeight: 900,

                    color: ROTOM_CYAN,
                  }}
                >
                  {groundedRate}%
                </Typography>
              </Box>
            </Box>
          </DashboardPanel>

          {/* =============================================
              GENERATED TIME
          ============================================== */}

          <Box
            sx={{
              display: "flex",

              flexDirection: {
                xs: "column",
                sm: "row",
              },

              justifyContent: "space-between",

              gap: 0.5,

              mt: 3,

              pt: 2,

              borderTop: "1px solid #d4d4d8",
            }}
          >
            <Typography
              sx={{
                color: "text.secondary",

                fontSize: "0.64rem",

                fontWeight: 700,
              }}
            >
              Dashboard year: {selectedYear}
            </Typography>

            <Typography
              sx={{
                color: "text.secondary",

                fontSize: "0.64rem",

                fontWeight: 700,
              }}
            >
              Last refreshed:{" "}
              {report.generatedAt
                ? new Date(report.generatedAt).toLocaleString()
                : "—"}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}

export default DashboardPage;
