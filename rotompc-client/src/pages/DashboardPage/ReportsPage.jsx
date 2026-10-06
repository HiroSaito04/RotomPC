// filepath: rotompc-client/src/pages/DashboardPage/ReportsPage.jsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const capitalize = (value) => {
  const text = String(value || "");

  if (!text) {
    return "";
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
};

const shortenPath = (path) => {
  const value = String(path || "/");

  if (value.length <= 34) {
    return value;
  }

  return `${value.slice(0, 31)}...`;
};

/* =========================================================
   SUMMARY CARD
========================================================= */

const SummaryCard = ({
  label,

  value,

  helper,

  accent = "#1A1A1A",
}) => {
  return (
    <Paper
      sx={{
        minWidth: 0,

        p: {
          xs: 2,
          sm: 2.25,
        },

        border: "2px solid #1A1A1A",

        borderRadius: 2,

        bgcolor: "#fff",

        boxShadow: "4px 4px 0px #000",

        overflow: "hidden",
      }}
    >
      <Typography
        sx={{
          color: "text.secondary",

          fontSize: {
            xs: "0.63rem",
            sm: "0.68rem",
          },

          fontWeight: 900,

          letterSpacing: "0.08em",

          lineHeight: 1.2,

          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: 0.8,

          color: accent,

          fontSize: {
            xs: "1.8rem",
            sm: "2.15rem",
            lg: "2.5rem",
          },

          fontWeight: 900,

          lineHeight: 1,
        }}
      >
        {value}
      </Typography>

      {helper && (
        <Typography
          sx={{
            mt: 0.8,

            color: "text.secondary",

            fontSize: {
              xs: "0.68rem",
              sm: "0.72rem",
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
   CHART CARD
========================================================= */

const ChartCard = ({
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
          xs: 2,
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
        variant="h6"
        sx={{
          color: "#1A1A1A",

          fontSize: {
            xs: "0.9rem",
            sm: "1rem",
            lg: "1.1rem",
          },

          fontWeight: 900,

          lineHeight: 1.15,
        }}
      >
        {title}
      </Typography>

      {description && (
        <Typography
          sx={{
            mt: 0.5,

            color: "text.secondary",

            fontSize: {
              xs: "0.68rem",
              sm: "0.74rem",
            },

            fontWeight: 600,

            lineHeight: 1.4,
          }}
        >
          {description}
        </Typography>
      )}

      <Box sx={{ mt: 2 }}>{children}</Box>
    </Paper>
  );
};

/* =========================================================
   EMPTY
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

          fontSize: "0.78rem",

          fontWeight: 800,
        }}
      >
        {children}
      </Typography>
    </Box>
  );
};

/* =========================================================
   REPORTS
========================================================= */

function ReportsPage() {
  const printRef = useRef(null);

  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     LOAD
  ======================================================= */

  const loadReport = useCallback(
    async ({ refresh = false, year = selectedYear } = {}) => {
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
        console.error("Analytics load error:", err);

        setError(err.response?.data?.message || "Unable to load analytics.");
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    [selectedYear],
  );

  useEffect(() => {
    loadReport({
      year: selectedYear,
    });
  }, [selectedYear, loadReport]);

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
     ROLE DATA
  ======================================================= */

  const roleData = useMemo(() => {
    return (report?.users?.roles || []).map((item, index) => ({
      id: index,

      value: item.count,

      label: capitalize(item.role),

      color: ROLE_COLORS[item.role] || ROLE_COLORS.unknown,
    }));
  }, [report]);

  /* =======================================================
     MONTHS
  ======================================================= */

  const articleMonths = report?.articles?.monthly || [];

  const visitMonths = report?.visits?.monthly || [];

  /* =======================================================
     QUARTERS
  ======================================================= */

  const quarters = report?.articles?.quarterly || [];

  /* =======================================================
     BUDDY DATA
  ======================================================= */

  const buddyLabels = ["Pets", "Plays", "Berries Fed"];

  const buddyValues = [
    report?.buddy?.petCount || 0,

    report?.buddy?.plays || 0,

    report?.buddy?.berriesFed || 0,
  ];

  /* =======================================================
     SOCIAL DATA
  ======================================================= */

  const socialLabels = ["Likes", "Comments", "Follows"];

  const socialValues = [
    report?.social?.likesThisYear || 0,

    report?.social?.commentsThisYear || 0,

    report?.social?.currentFollows || 0,
  ];

  /* =======================================================
     EXPORT
  ======================================================= */

  const handlePrint = () => {
    const content = printRef.current;

    if (!content) {
      return;
    }

    const win = window.open("", "_blank", "width=1280,height=900");

    if (!win) {
      return;
    }

    const styles = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]'),
    )
      .map((node) => node.outerHTML)
      .join("");

    const generated = report?.generatedAt
      ? new Date(report.generatedAt)
      : new Date();

    const date = new Intl.DateTimeFormat("en-US", {
      dateStyle: "long",

      timeStyle: "short",
    }).format(generated);

    win.document.write(`
      <!doctype html>

      <html>
        <head>
          <title>RotomPC Analytics ${selectedYear}</title>

          ${styles}

          <style>
            body {
              margin: 0;
              padding: 28px;
              color: #18181b;
              background: white;
              font-family: Arial, sans-serif;
            }

            .print-header {
              margin-bottom: 24px;
              padding-bottom: 16px;
              border-bottom: 4px solid #18181b;
            }

            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              body {
                padding: 12px;
              }

              button {
                display: none !important;
              }
            }
          </style>
        </head>

        <body>
          <div class="print-header">
            <h1 style="margin:0;">
              RotomPC Analytics & Reports
            </h1>

            <p style="margin:7px 0 0;">
              Reporting year: ${selectedYear}
            </p>

            <p style="margin:4px 0 0;color:#71717a;font-size:12px;">
              Generated ${date}
            </p>
          </div>

          ${content.outerHTML}
        </body>
      </html>
    `);

    win.document.close();

    win.focus();

    win.onload = () => {
      window.setTimeout(() => {
        win.print();
      }, 250);
    };
  };

  /* =======================================================
     STYLES
  ======================================================= */

  const buttonStyle = {
    minHeight: 40,

    px: 2,

    border: "2px solid #1A1A1A",

    borderRadius: 2,

    boxShadow: "3px 3px 0px #000",

    fontSize: {
      xs: "0.7rem",
      sm: "0.76rem",
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

  const primaryButton = {
    ...buttonStyle,

    bgcolor: "#cc0000",

    color: "#fff",

    "&:hover": {
      bgcolor: "#a30000",

      transform: "translate(1px, 1px)",

      boxShadow: "2px 2px 0px #000",
    },
  };

  const secondaryButton = {
    ...buttonStyle,

    bgcolor: "#fff",

    color: "#1A1A1A",

    "&:hover": {
      bgcolor: "#f4f4f5",

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
              color: "#cc0000",
            }}
          />

          <Typography
            sx={{
              color: "text.secondary",

              fontSize: "0.78rem",

              fontWeight: 800,
            }}
          >
            Loading RotomPC analytics...
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

        pb: 4,
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
        justifyContent="space-between"
        alignItems={{
          xs: "stretch",
          lg: "center",
        }}
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
              color: "#1A1A1A",

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
            ANALYTICS{" "}
            <Box
              component="span"
              sx={{
                color: "#cc0000",
              }}
            >
              & REPORTS
            </Box>
          </Typography>

          <Typography
            sx={{
              mt: 1,

              maxWidth: 690,

              color: "text.secondary",

              fontSize: {
                xs: "0.75rem",
                sm: "0.85rem",
              },

              fontWeight: 600,

              lineHeight: 1.5,
            }}
          >
            Live RotomPC activity including website traffic, accounts,
            PokéSocial, Buddy interactions, reports, and RotomAI usage.
          </Typography>
        </Box>

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={1.25}
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
                sm: 110,
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
                  borderColor: "#cc0000",
                },
              },
            }}
          >
            <Select
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              inputProps={{
                "aria-label": "Report year",
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
            sx={{
              ...secondaryButton,

              width: {
                xs: "100%",
                sm: "auto",
              },
            }}
            onClick={() =>
              loadReport({
                refresh: true,
              })
            }
          >
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </Button>

          <Button
            type="button"
            sx={{
              ...primaryButton,

              width: {
                xs: "100%",
                sm: "auto",
              },
            }}
            onClick={handlePrint}
          >
            Export Report
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
              fontSize: "0.78rem",

              fontWeight: 800,
            }}
          >
            {error}
          </Typography>
        </Paper>
      )}

      {!report ? (
        <EmptyData>No analytics data available.</EmptyData>
      ) : (
        <Box ref={printRef}>
          {/* =============================================
              SUMMARY
          ============================================== */}

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",

                sm: "repeat(2, minmax(0, 1fr))",

                lg: "repeat(3, minmax(0, 1fr))",

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
            <SummaryCard
              label="Website Visits"
              value={formatNumber(report.visits?.yearTotal)}
              helper={`${formatNumber(report.visits?.allTime)} all-time`}
              accent="#cc0000"
            />

            <SummaryCard
              label="Unique Visitors"
              value={formatNumber(report.visits?.uniqueVisitors)}
              helper={`${formatNumber(
                report.visits?.last30Days,
              )} visits in last 30 days`}
              accent="#3b4cca"
            />

            <SummaryCard
              label="Registered Users"
              value={formatNumber(report.users?.total)}
              helper={`${formatNumber(report.users?.active)} active`}
            />

            <SummaryCard
              label={`${selectedYear} Reports`}
              value={formatNumber(report.articles?.yearTotal)}
              helper={`${formatNumber(report.articles?.active)} active`}
              accent="#ff1c1c"
            />

            <SummaryCard
              label={`${selectedYear} Likes`}
              value={formatNumber(report.social?.likesThisYear)}
              helper={`${formatNumber(
                report.social?.commentsThisYear,
              )} comments`}
              accent="#e11d48"
            />

            <SummaryCard
              label="RotomAI Messages"
              value={formatNumber(report.rotomAI?.messagesThisYear)}
              helper={`${formatNumber(
                report.rotomAI?.groundedMessages,
              )} grounded replies`}
              accent="#00a8cc"
            />
          </Box>

          {/* =============================================
              QUICK TRAFFIC
          ============================================== */}

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",

                sm: "repeat(3, minmax(0, 1fr))",
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
            <SummaryCard
              label="Visits Today"
              value={formatNumber(report.visits?.today)}
              accent="#4dad5b"
            />

            <SummaryCard
              label="Last 7 Days"
              value={formatNumber(report.visits?.last7Days)}
              accent="#FFB300"
            />

            <SummaryCard
              label="Last 30 Days"
              value={formatNumber(report.visits?.last30Days)}
              accent="#3b4cca"
            />
          </Box>

          {/* =============================================
              ANALYTICS GRID
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
            }}
          >
            {/* =========================================
                WEBSITE VISITS
            ========================================== */}

            <ChartCard
              title="WEBSITE TRAFFIC"
              description={`Monthly route visits during ${selectedYear}`}
            >
              {visitMonths.some((item) => item.count > 0) ? (
                <Box
                  sx={{
                    width: "100%",

                    overflowX: "auto",
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

                          data: visitMonths.map((item) => item.label),
                        },
                      ]}
                      series={[
                        {
                          data: visitMonths.map((item) => item.count),

                          label: "Visits",

                          color: "#cc0000",
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
                  No website visits recorded for {selectedYear} yet.
                </EmptyData>
              )}
            </ChartCard>

            {/* =========================================
                USER ROLES
            ========================================== */}

            <ChartCard
              title="USER ROLES"
              description="Current registered account distribution"
            >
              {roleData.length > 0 ? (
                <>
                  <Box
                    sx={{
                      display: "flex",

                      minHeight: 280,

                      alignItems: "center",

                      justifyContent: "center",

                      width: "100%",
                    }}
                  >
                    <PieChart
                      series={[
                        {
                          data: roleData,

                          innerRadius: 48,

                          outerRadius: 90,

                          paddingAngle: 4,

                          cornerRadius: 3,
                        },
                      ]}
                      height={280}
                      margin={{
                        top: 15,

                        right: 15,

                        bottom: 15,

                        left: 15,
                      }}
                    />
                  </Box>

                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {roleData.map((item) => (
                      <Box
                        key={item.label}
                        sx={{
                          display: "inline-flex",

                          alignItems: "center",

                          gap: 0.75,

                          border: "1px solid #d4d4d8",

                          borderRadius: 999,

                          bgcolor: "#fafafa",

                          px: 1.1,

                          py: 0.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,

                            height: 8,

                            borderRadius: "50%",

                            bgcolor: item.color,
                          }}
                        />

                        <Typography
                          sx={{
                            fontSize: "0.68rem",

                            fontWeight: 800,
                          }}
                        >
                          {item.label} {item.value}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </>
              ) : (
                <EmptyData>No user data available.</EmptyData>
              )}
            </ChartCard>

            {/* =========================================
                ARTICLE ACTIVITY
            ========================================== */}

            <ChartCard
              title="REPORT ACTIVITY"
              description={`Articles created during ${selectedYear}`}
            >
              {articleMonths.some((item) => item.count > 0) ? (
                <Box
                  sx={{
                    width: "100%",

                    overflowX: "auto",
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

                          data: articleMonths.map((item) => item.label),
                        },
                      ]}
                      series={[
                        {
                          data: articleMonths.map((item) => item.count),

                          label: "Reports",

                          color: "#1A1A1A",
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
                  No reports were created during {selectedYear}.
                </EmptyData>
              )}
            </ChartCard>

            {/* =========================================
                QUARTERLY STATUS
            ========================================== */}

            <ChartCard
              title="QUARTERLY REPORT STATUS"
              description="Active and archived reports"
            >
              {quarters.some((item) => item.active > 0 || item.archived > 0) ? (
                <Box
                  sx={{
                    width: "100%",

                    overflowX: "auto",
                  }}
                >
                  <Box
                    sx={{
                      minWidth: {
                        xs: 460,
                        md: 0,
                      },

                      width: "100%",
                    }}
                  >
                    <BarChart
                      xAxis={[
                        {
                          scaleType: "band",

                          data: quarters.map((item) => item.quarter),
                        },
                      ]}
                      series={[
                        {
                          data: quarters.map((item) => item.active),

                          label: "Active",

                          color: "#4dad5b",
                        },

                        {
                          data: quarters.map((item) => item.archived),

                          label: "Archived",

                          color: "#71717a",
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
                <EmptyData>No quarterly report data available.</EmptyData>
              )}
            </ChartCard>

            {/* =========================================
                SOCIAL ACTIVITY
            ========================================== */}

            <ChartCard
              title="POKÉSOCIAL ACTIVITY"
              description={`Likes and comments from ${selectedYear}; follows show the current network`}
            >
              <Box
                sx={{
                  width: "100%",

                  overflowX: "auto",
                }}
              >
                <Box
                  sx={{
                    minWidth: {
                      xs: 420,
                      md: 0,
                    },

                    width: "100%",
                  }}
                >
                  <BarChart
                    xAxis={[
                      {
                        scaleType: "band",

                        data: socialLabels,
                      },
                    ]}
                    series={[
                      {
                        data: socialValues,

                        label: "Activity",

                        color: "#ff1c1c",
                      },
                    ]}
                    height={280}
                    margin={{
                      top: 25,

                      right: 10,

                      bottom: 35,

                      left: 45,
                    }}
                  />
                </Box>
              </Box>
            </ChartCard>

            {/* =========================================
                BUDDY ACTIVITY
            ========================================== */}

            <ChartCard
              title="BUDDY ACTIVITY"
              description="Stored lifetime Buddy interaction counters"
            >
              <Box
                sx={{
                  width: "100%",

                  overflowX: "auto",
                }}
              >
                <Box
                  sx={{
                    minWidth: {
                      xs: 420,
                      md: 0,
                    },

                    width: "100%",
                  }}
                >
                  <BarChart
                    xAxis={[
                      {
                        scaleType: "band",

                        data: buddyLabels,
                      },
                    ]}
                    series={[
                      {
                        data: buddyValues,

                        label: "Interactions",

                        color: "#FFB300",
                      },
                    ]}
                    height={280}
                    margin={{
                      top: 25,

                      right: 10,

                      bottom: 35,

                      left: 45,
                    }}
                  />
                </Box>
              </Box>

              <Box
                sx={{
                  display: "grid",

                  gridTemplateColumns: {
                    xs: "repeat(2, minmax(0, 1fr))",

                    sm: "repeat(4, minmax(0, 1fr))",
                  },

                  gap: 1,

                  mt: 1,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: "text.secondary",

                      fontSize: "0.62rem",

                      fontWeight: 800,

                      textTransform: "uppercase",
                    }}
                  >
                    Buddies
                  </Typography>

                  <Typography
                    sx={{
                      fontWeight: 900,
                    }}
                  >
                    {formatNumber(report.buddy?.selectedBuddies)}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: "text.secondary",

                      fontSize: "0.62rem",

                      fontWeight: 800,

                      textTransform: "uppercase",
                    }}
                  >
                    Berries Held
                  </Typography>

                  <Typography
                    sx={{
                      fontWeight: 900,
                    }}
                  >
                    {formatNumber(report.buddy?.berriesHeld)}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: "text.secondary",

                      fontSize: "0.62rem",

                      fontWeight: 800,

                      textTransform: "uppercase",
                    }}
                  >
                    Avg. Affection
                  </Typography>

                  <Typography
                    sx={{
                      fontWeight: 900,
                    }}
                  >
                    {report.buddy?.averageAffection}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: "text.secondary",

                      fontSize: "0.62rem",

                      fontWeight: 800,

                      textTransform: "uppercase",
                    }}
                  >
                    Avg. Energy
                  </Typography>

                  <Typography
                    sx={{
                      fontWeight: 900,
                    }}
                  >
                    {report.buddy?.averageEnergy}
                  </Typography>
                </Box>
              </Box>
            </ChartCard>

            {/* =========================================
                ROTOM AI
            ========================================== */}

            <ChartCard
              title="ROTOMAI ACTIVITY"
              description={`Conversation message activity during ${selectedYear}`}
            >
              <Box
                sx={{
                  width: "100%",

                  overflowX: "auto",
                }}
              >
                <Box
                  sx={{
                    minWidth: {
                      xs: 440,
                      md: 0,
                    },

                    width: "100%",
                  }}
                >
                  <BarChart
                    xAxis={[
                      {
                        scaleType: "band",

                        data: ["Trainer", "RotomAI", "Grounded"],
                      },
                    ]}
                    series={[
                      {
                        data: [
                          report.rotomAI?.userMessages || 0,

                          report.rotomAI?.assistantMessages || 0,

                          report.rotomAI?.groundedMessages || 0,
                        ],

                        label: "Messages",

                        color: "#00a8cc",
                      },
                    ]}
                    height={280}
                    margin={{
                      top: 25,

                      right: 10,

                      bottom: 35,

                      left: 45,
                    }}
                  />
                </Box>
              </Box>
            </ChartCard>

            {/* =========================================
                BERRY REWARDS
            ========================================== */}

            <ChartCard
              title="BERRY REWARDS"
              description={`PokéSocial berry rewards issued during ${selectedYear}`}
            >
              <Box
                sx={{
                  width: "100%",

                  overflowX: "auto",
                }}
              >
                <Box
                  sx={{
                    minWidth: {
                      xs: 440,
                      md: 0,
                    },

                    width: "100%",
                  }}
                >
                  <BarChart
                    xAxis={[
                      {
                        scaleType: "band",

                        data: ["Likes", "Follows", "Posts"],
                      },
                    ]}
                    series={[
                      {
                        data: [
                          report.buddy?.rewardsThisYear?.like?.berries || 0,

                          report.buddy?.rewardsThisYear?.follow?.berries || 0,

                          report.buddy?.rewardsThisYear?.post?.berries || 0,
                        ],

                        label: "Berries",

                        color: "#4dad5b",
                      },
                    ]}
                    height={280}
                    margin={{
                      top: 25,

                      right: 10,

                      bottom: 35,

                      left: 45,
                    }}
                  />
                </Box>
              </Box>
            </ChartCard>

            {/* =========================================
                TOP PAGES
            ========================================== */}

            <ChartCard
              title="MOST VISITED PAGES"
              description={`Top routes during ${selectedYear}`}
            >
              {report.visits?.topPaths?.length ? (
                <Stack spacing={1}>
                  {report.visits.topPaths.map((item, index) => (
                    <Box
                      key={item.path}
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

                          bgcolor: "#1A1A1A",

                          color: "#fff",

                          fontSize: "0.65rem",

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

                            fontSize: "0.78rem",

                            fontWeight: 850,
                          }}
                        >
                          {shortenPath(item.path)}
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.15,

                            color: "text.secondary",

                            fontSize: "0.63rem",

                            fontWeight: 600,
                          }}
                        >
                          {formatNumber(item.uniqueVisitors)} unique
                        </Typography>
                      </Box>

                      <Typography
                        sx={{
                          color: "#cc0000",

                          fontSize: "0.85rem",

                          fontWeight: 900,

                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatNumber(item.count)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <EmptyData>No website traffic recorded yet.</EmptyData>
              )}
            </ChartCard>

            {/* =========================================
                TOP AUTHORS
            ========================================== */}

            <ChartCard
              title="TOP REPORT AUTHORS"
              description={`Most active report authors during ${selectedYear}`}
              fullWidth
            >
              {report.articles?.topAuthors?.length ? (
                <Box
                  sx={{
                    width: "100%",

                    overflowX: "auto",
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
                      layout="horizontal"
                      yAxis={[
                        {
                          scaleType: "band",

                          data: report.articles.topAuthors.map(
                            (item) => item.author,
                          ),
                        },
                      ]}
                      series={[
                        {
                          data: report.articles.topAuthors.map(
                            (item) => item.count,
                          ),

                          label: "Reports",

                          color: "#cc0000",
                        },
                      ]}
                      height={320}
                      margin={{
                        top: 25,

                        right: 20,

                        bottom: 30,

                        left: 120,
                      }}
                    />
                  </Box>
                </Box>
              ) : (
                <EmptyData>No author activity for {selectedYear}.</EmptyData>
              )}
            </ChartCard>
          </Box>

          {/* =============================================
              FOOTER
          ============================================== */}

          <Box
            sx={{
              display: "flex",

              flexDirection: {
                xs: "column",
                sm: "row",
              },

              justifyContent: "space-between",

              gap: 1,

              mt: 3,

              pt: 2,

              borderTop: "1px solid #d4d4d8",
            }}
          >
            <Typography
              sx={{
                color: "text.secondary",

                fontSize: "0.68rem",

                fontWeight: 700,
              }}
            >
              Reporting year: {selectedYear}
            </Typography>

            <Typography
              sx={{
                color: "text.secondary",

                fontSize: "0.68rem",

                fontWeight: 700,
              }}
            >
              Generated{" "}
              {report.generatedAt
                ? new Date(report.generatedAt).toLocaleString()
                : ""}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default ReportsPage;
