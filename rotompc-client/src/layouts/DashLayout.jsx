// filepath: rotompc-client/src/layouts/DashLayout.jsx

import { useEffect, useMemo, useState } from "react";

import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { alpha, styled, useTheme } from "@mui/material/styles";

import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import useMediaQuery from "@mui/material/useMediaQuery";

import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ArticleIcon from "@mui/icons-material/Article";
import LogoutIcon from "@mui/icons-material/Logout";

import { clearAuthSession } from "@/utils/authSession";

/* =========================================================
   CONFIG
========================================================= */

const DRAWER_WIDTH = 250;

const MOBILE_DRAWER_WIDTH = 272;

const ROTOM_RED = "#cc0000";

const ROTOM_CYAN = "#00E5FF";

const ROTOM_DARK = "#1A1A1A";

/* =========================================================
   NAVIGATION

   roles:
   null = every dashboard role
========================================================= */

const DASHBOARD_NAV_ITEMS = [
  {
    label: "Dashboard",

    title: "Dashboard",

    to: "/dashboard",

    icon: DashboardIcon,

    roles: null,
  },

  {
    label: "Articles",

    title: "Article Management",

    to: "/dashboard/articles",

    icon: ArticleIcon,

    roles: ["admin", "editor"],
  },

  {
    label: "Reports",

    title: "Analytics & Reports",

    to: "/dashboard/reports",

    icon: AssessmentIcon,

    roles: ["admin", "editor"],
  },

  {
    label: "Users",

    title: "User Management",

    to: "/dashboard/users",

    icon: PeopleIcon,

    roles: ["admin"],
  },
];

/* =========================================================
   HELPERS
========================================================= */

const normalizeRole = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const capitalize = (value) => {
  const text = String(value || "");

  if (!text) {
    return "";
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
};

/* =========================================================
   DRAWER MIXINS
========================================================= */

const openedMixin = (theme) => ({
  width: DRAWER_WIDTH,

  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,

    duration: theme.transitions.duration.enteringScreen,
  }),

  overflowX: "hidden",
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,

    duration: theme.transitions.duration.leavingScreen,
  }),

  overflowX: "hidden",

  width: `calc(${theme.spacing(8)} + 1px)`,
});

/* =========================================================
   DRAWER HEADER
========================================================= */

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",

  minHeight: 92,

  alignItems: "center",

  justifyContent: "flex-end",

  padding: theme.spacing(0, 1),

  ...theme.mixins.toolbar,

  [theme.breakpoints.down("md")]: {
    minHeight: 88,
  },
}));

/* =========================================================
   APP BAR
========================================================= */

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,

  width: "100%",

  backgroundColor: "#f3f4f6",

  color: "#000",

  boxShadow: "none",

  borderBottom: "6px solid #1A1A1A",

  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,

    duration: theme.transitions.duration.leavingScreen,
  }),

  [theme.breakpoints.up("md")]: {
    ...(open && {
      marginLeft: DRAWER_WIDTH,

      width: `calc(100% - ${DRAWER_WIDTH}px)`,

      transition: theme.transitions.create(["width", "margin"], {
        easing: theme.transitions.easing.sharp,

        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  },
}));

/* =========================================================
   DESKTOP DRAWER
========================================================= */

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: DRAWER_WIDTH,

  flexShrink: 0,

  whiteSpace: "nowrap",

  boxSizing: "border-box",

  ...(open && {
    ...openedMixin(theme),

    "& .MuiDrawer-paper": {
      ...openedMixin(theme),

      backgroundColor: ROTOM_DARK,

      color: "#fff",

      borderRight: "4px solid #1A1A1A",
    },
  }),

  ...(!open && {
    ...closedMixin(theme),

    "& .MuiDrawer-paper": {
      ...closedMixin(theme),

      backgroundColor: ROTOM_DARK,

      color: "#fff",

      borderRight: "4px solid #1A1A1A",
    },
  }),
}));

/* =========================================================
   DASH LAYOUT
========================================================= */

const DashLayout = () => {
  const theme = useTheme();

  const location = useLocation();

  const navigate = useNavigate();

  /*
   * Anything below md uses the temporary mobile drawer.
   *
   * This includes phones and small tablets.
   */
  const isMobileView = useMediaQuery(theme.breakpoints.down("md"));

  const [open, setOpen] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);

  /* =======================================================
     AUTH
  ======================================================= */

  const token = localStorage.getItem("token");

  const role = normalizeRole(localStorage.getItem("role"));

  const allowedRoles = ["admin", "editor"];

  /* =======================================================
     ROLE-SPECIFIC NAVIGATION

     Editors:
     - Dashboard
     - Articles
     - Reports

     Admin:
     - Dashboard
     - Articles
     - Reports
     - Users
  ======================================================= */

  const visibleNavItems = useMemo(() => {
    return DASHBOARD_NAV_ITEMS.filter((item) => {
      if (!item.roles) {
        return true;
      }

      return item.roles.includes(role);
    });
  }, [role]);

  /* =======================================================
     ACTIVE PAGE
  ======================================================= */

  const activeItem = useMemo(() => {
    return visibleNavItems.find((item) => {
      if (item.to === "/dashboard") {
        return location.pathname === "/dashboard";
      }

      return location.pathname.startsWith(item.to);
    });
  }, [visibleNavItems, location.pathname]);

  const pageTitle = activeItem?.title || "Dashboard";

  /* =======================================================
     CLOSE MOBILE DRAWER AFTER NAVIGATION
  ======================================================= */

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /* =======================================================
     DRAWER
  ======================================================= */

  const handleDrawerToggle = () => {
    if (isMobileView) {
      setMobileOpen((current) => !current);

      return;
    }

    setOpen((current) => !current);
  };

  const handleMobileClose = () => {
    setMobileOpen(false);
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = () => {
    clearAuthSession();

    navigate("/", {
      replace: true,
    });
  };

  /* =======================================================
     ACCESS GUARDS
  ======================================================= */

  if (!token) {
    return <Navigate to="/auth/signin" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  /*
   * Defense-in-depth:
   *
   * UsersPage itself should also be admin-only,
   * but block editors here too so they never render it.
   */
  if (role !== "admin" && location.pathname.startsWith("/dashboard/users")) {
    return <Navigate to="/dashboard" replace />;
  }

  /* =======================================================
     NAVIGATION MENU
  ======================================================= */

  const renderNavigationMenu = (mobile = false) => {
    const expanded = open || mobile;

    return (
      <Box
        sx={{
          display: "flex",

          height: "100%",

          flexDirection: "column",
        }}
      >
        {/* ===============================================
            ROLE INFO
        ================================================ */}

        {expanded && (
          <Box
            sx={{
              px: 2,

              pt: mobile ? 1 : 2,

              pb: 1,
            }}
          >
            <Typography
              sx={{
                color: "#71717a",

                fontSize: "0.58rem",

                fontWeight: 900,

                letterSpacing: "0.12em",

                textTransform: "uppercase",
              }}
            >
              RotomPC Control
            </Typography>

            <Chip
              size="small"
              label={`${capitalize(role)} Access`}
              sx={{
                mt: 0.8,

                height: 24,

                border: `1px solid ${ROTOM_CYAN}`,

                bgcolor: "rgba(0,229,255,0.08)",

                color: ROTOM_CYAN,

                fontSize: "0.6rem",

                fontWeight: 900,

                textTransform: "uppercase",
              }}
            />
          </Box>
        )}

        {/* ===============================================
            NAV
        ================================================ */}

        <List
          sx={{
            px: 1,

            pt: expanded ? 1 : 3,
          }}
        >
          {visibleNavItems.map(({ label, to, icon: Icon }) => {
            const selected =
              to === "/dashboard"
                ? location.pathname === "/dashboard"
                : location.pathname.startsWith(to);

            return (
              <ListItem
                key={to}
                disablePadding
                sx={{
                  display: "block",

                  mb: 1,
                }}
              >
                <ListItemButton
                  component={Link}
                  to={to}
                  selected={selected}
                  onClick={mobile ? handleMobileClose : undefined}
                  sx={{
                    minHeight: 48,

                    px: 1.5,

                    border: "2px solid transparent",

                    borderRadius: 2,

                    justifyContent: expanded ? "initial" : "center",

                    color: "#d4d4d8",

                    transition: "all 0.15s ease",

                    "&.Mui-selected": {
                      borderColor: ROTOM_CYAN,

                      bgcolor: "#000",

                      color: ROTOM_CYAN,

                      boxShadow: `inset 0 0 8px ${alpha(ROTOM_CYAN, 0.35)}`,

                      "& .MuiListItemIcon-root": {
                        color: ROTOM_CYAN,
                      },

                      "&:hover": {
                        bgcolor: "#111",
                      },
                    },

                    "&:hover": {
                      bgcolor: alpha(ROTOM_RED, 0.12),

                      color: "#fff",

                      "& .MuiListItemIcon-root": {
                        color: ROTOM_RED,
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,

                      mr: expanded ? 2.5 : "auto",

                      justifyContent: "center",

                      color: "#a1a1aa",
                    }}
                  >
                    <Icon />
                  </ListItemIcon>

                  <ListItemText
                    primary={label}
                    sx={{
                      m: 0,

                      opacity: expanded ? 1 : 0,

                      "& .MuiTypography-root": {
                        overflow: "hidden",

                        fontSize: "0.72rem",

                        fontStyle: "italic",

                        fontWeight: 900,

                        letterSpacing: "0.06em",

                        textOverflow: "ellipsis",

                        textTransform: "uppercase",

                        whiteSpace: "nowrap",
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* ===============================================
            FOOTER
        ================================================ */}

        {expanded && (
          <Box
            sx={{
              mt: "auto",

              p: 2,

              textAlign: "center",
            }}
          >
            <Box
              sx={{
                height: 3,

                width: "100%",

                mb: 1,

                borderRadius: 99,

                bgcolor: "#3f3f46",
              }}
            />

            <Typography
              sx={{
                color: "#71717a",

                fontSize: "0.56rem",

                fontWeight: 800,

                letterSpacing: "0.08em",

                textTransform: "uppercase",
              }}
            >
              v2.0 · Rotom OS
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <Box
      sx={{
        display: "flex",

        width: "100%",

        minWidth: 0,

        minHeight: "100dvh",

        overflowX: "hidden",

        bgcolor: "#e5e7eb",
      }}
    >
      <CssBaseline />

      {/* =================================================
          APP BAR
      ================================================== */}

      <AppBar position="fixed" open={!isMobileView && open}>
        {/* ===============================================
            HARDWARE STATUS STRIP
        ================================================ */}

        <Box
          sx={{
            display: "flex",

            height: {
              xs: 18,
              md: 22,
            },

            width: "100%",

            alignItems: "center",

            gap: {
              xs: 0.75,
              sm: 1,
            },

            px: {
              xs: 1.5,
              sm: 2,
              md: 3,
            },

            borderBottom: "2px solid rgba(0,0,0,0.2)",

            bgcolor: ROTOM_RED,
          }}
        >
          <Box
            sx={{
              width: {
                xs: 9,
                md: 11,
              },

              height: {
                xs: 9,
                md: 11,
              },

              border: "2px solid #fff",

              borderRadius: "50%",

              bgcolor: "#60a5fa",

              boxShadow: "0 0 7px #60a5fa",

              animation: "dashboardPulse 2s ease-in-out infinite",

              "@keyframes dashboardPulse": {
                "0%, 100%": {
                  opacity: 1,
                },

                "50%": {
                  opacity: 0.55,
                },
              },
            }}
          />

          <Box
            sx={{
              display: "flex",

              gap: 0.55,
            }}
          >
            <Box
              sx={{
                width: 7,

                height: 7,

                border: "1px solid rgba(0,0,0,0.25)",

                borderRadius: "50%",

                bgcolor: "#ff1c1c",
              }}
            />

            <Box
              sx={{
                width: 7,

                height: 7,

                border: "1px solid rgba(0,0,0,0.25)",

                borderRadius: "50%",

                bgcolor: "#ffcb05",
              }}
            />

            <Box
              sx={{
                width: 7,

                height: 7,

                border: "1px solid rgba(0,0,0,0.25)",

                borderRadius: "50%",

                bgcolor: "#4dad5b",
              }}
            />
          </Box>

          <Box
            sx={{
              ml: "auto",

              width: {
                xs: 30,
                sm: 48,
              },

              height: 3,

              borderRadius: 99,

              bgcolor: "rgba(0,0,0,0.22)",
            }}
          />
        </Box>

        {/* ===============================================
            MAIN TOOLBAR
        ================================================ */}

        <Toolbar
          sx={{
            minHeight: "64px !important",

            gap: {
              xs: 0.75,
              sm: 1,
            },

            px: {
              xs: "10px !important",

              sm: "16px !important",

              md: "20px !important",
            },
          }}
        >
          {/* =============================================
              DRAWER TOGGLE
          ============================================== */}

          <IconButton
            type="button"
            edge="start"
            aria-label={
              isMobileView
                ? mobileOpen
                  ? "Close dashboard menu"
                  : "Open dashboard menu"
                : open
                  ? "Collapse dashboard sidebar"
                  : "Expand dashboard sidebar"
            }
            onClick={handleDrawerToggle}
            sx={{
              flexShrink: 0,

              width: {
                xs: 38,
                sm: 42,
              },

              height: {
                xs: 38,
                sm: 42,
              },

              border: "2px solid #000",

              borderRadius: 2,

              bgcolor: ROTOM_DARK,

              color: "#fff",

              "&:hover": {
                bgcolor: ROTOM_RED,
              },
            }}
          >
            {(isMobileView ? mobileOpen : open) ? (
              <MenuOpenIcon
                sx={{
                  fontSize: {
                    xs: 20,
                    sm: 24,
                  },
                }}
              />
            ) : (
              <MenuIcon
                sx={{
                  fontSize: {
                    xs: 20,
                    sm: 24,
                  },
                }}
              />
            )}
          </IconButton>

          {/* =============================================
              PAGE TITLE
          ============================================== */}

          <Box
            sx={{
              display: "flex",

              minWidth: 0,

              flex: 1,

              alignItems: "center",

              gap: 1.25,
            }}
          >
            {/* Desktop hardware emblem */}

            <Box
              sx={{
                display: {
                  xs: "none",
                  lg: "flex",
                },

                position: "relative",

                width: 42,

                height: 42,

                flexShrink: 0,

                alignItems: "center",

                justifyContent: "center",

                border: "3px solid #18181b",

                borderRadius: "50%",

                bgcolor: "#27272a",

                boxShadow: "3px 3px 0 rgba(0,0,0,0.12)",
              }}
            >
              <Box
                sx={{
                  position: "relative",

                  display: "flex",

                  width: 27,

                  height: 27,

                  alignItems: "center",

                  justifyContent: "center",

                  overflow: "hidden",

                  border: "2px solid #93c5fd",

                  borderRadius: "50%",

                  background: "linear-gradient(135deg, #2563eb, #60a5fa)",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",

                    top: 4,

                    left: 6,

                    width: 12,

                    height: 12,

                    borderRadius: "50%",

                    bgcolor: "rgba(255,255,255,0.35)",

                    filter: "blur(1px)",
                  }}
                />
              </Box>
            </Box>

            <Box
              sx={{
                minWidth: 0,
              }}
            >
              <Typography
                noWrap
                sx={{
                  overflow: "hidden",

                  color: ROTOM_DARK,

                  fontSize: {
                    xs: "0.82rem",
                    sm: "1rem",
                    md: "1.1rem",
                  },

                  fontStyle: "italic",

                  fontWeight: 900,

                  letterSpacing: {
                    xs: "-0.02em",
                    sm: "-0.03em",
                  },

                  lineHeight: 1.1,

                  textOverflow: "ellipsis",

                  textTransform: "uppercase",
                }}
              >
                <Box
                  component="span"
                  sx={{
                    display: {
                      xs: "none",
                      sm: "inline",
                    },
                  }}
                >
                  RotomPC{" "}
                </Box>

                <Box
                  component="span"
                  sx={{
                    color: ROTOM_RED,
                  }}
                >
                  {pageTitle}
                </Box>
              </Typography>

              <Typography
                noWrap
                sx={{
                  display: {
                    xs: "none",
                    md: "block",
                  },

                  mt: 0.2,

                  color: "#71717a",

                  fontSize: "0.56rem",

                  fontWeight: 800,

                  letterSpacing: "0.08em",

                  textTransform: "uppercase",
                }}
              >
                {capitalize(role)} Control Center
              </Typography>
            </Box>
          </Box>

          {/* =============================================
              ROLE BADGE

              Hide on very small phones to preserve header
              space.
          ============================================== */}

          <Chip
            size="small"
            label={capitalize(role)}
            sx={{
              display: {
                xs: "none",
                sm: "inline-flex",
              },

              height: 28,

              flexShrink: 0,

              border: "1px solid #d4d4d8",

              bgcolor: "#fff",

              color: ROTOM_DARK,

              fontSize: "0.58rem",

              fontWeight: 900,

              textTransform: "uppercase",
            }}
          />

          {/* =============================================
              LOGOUT
          ============================================== */}

          <Button
            type="button"
            aria-label="Log out"
            title="Log out"
            startIcon={
              <LogoutIcon
                sx={{
                  fontSize: "17px !important",
                }}
              />
            }
            onClick={handleLogout}
            sx={{
              minWidth: {
                xs: 40,
                sm: "auto",
              },

              height: {
                xs: 38,
                sm: 40,
              },

              flexShrink: 0,

              border: "2px solid #1A1A1A",

              borderRadius: 2,

              bgcolor: "#fff",

              color: "#1A1A1A",

              px: {
                xs: 1,
                sm: 1.5,
              },

              fontSize: "0.62rem",

              fontStyle: "italic",

              fontWeight: 900,

              textTransform: "uppercase",

              boxShadow: "2px 2px 0 #000",

              "& .MuiButton-startIcon": {
                m: {
                  xs: 0,
                  sm: "0 6px 0 0",
                },
              },

              "&:hover": {
                bgcolor: ROTOM_RED,

                color: "#fff",

                transform: "translateY(-1px)",

                boxShadow: "3px 3px 0 #000",
              },

              "&:active": {
                transform: "translate(2px, 2px)",

                boxShadow: "none",
              },
            }}
          >
            <Box
              component="span"
              sx={{
                display: {
                  xs: "none",
                  sm: "inline",
                },
              }}
            >
              Log Out
            </Box>
          </Button>
        </Toolbar>
      </AppBar>

      {/* =================================================
          MOBILE / TABLET DRAWER
      ================================================== */}

      <MuiDrawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleMobileClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: {
            xs: "block",
            md: "none",
          },

          "& .MuiDrawer-paper": {
            boxSizing: "border-box",

            width: `min(${MOBILE_DRAWER_WIDTH}px, 86vw)`,

            maxWidth: "86vw",

            backgroundColor: ROTOM_DARK,

            color: "#fff",

            borderRight: "4px solid #1A1A1A",
          },
        }}
      >
        <DrawerHeader>
          <Box
            sx={{
              display: "flex",

              width: "100%",

              alignItems: "center",

              justifyContent: "space-between",

              px: 1,
            }}
          >
            <Typography
              sx={{
                ml: 1,

                color: "#fff",

                fontSize: "0.75rem",

                fontStyle: "italic",

                fontWeight: 900,

                textTransform: "uppercase",
              }}
            >
              Rotom
              <Box
                component="span"
                sx={{
                  color: ROTOM_RED,
                }}
              >
                PC
              </Box>
            </Typography>

            <IconButton
              type="button"
              aria-label="Close dashboard menu"
              onClick={handleMobileClose}
              sx={{
                width: 38,

                height: 38,

                border: `2px solid ${ROTOM_RED}`,

                borderRadius: 2,

                color: ROTOM_RED,

                "&:hover": {
                  bgcolor: alpha(ROTOM_RED, 0.12),
                },
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
          </Box>
        </DrawerHeader>

        {renderNavigationMenu(true)}
      </MuiDrawer>

      {/* =================================================
          DESKTOP DRAWER
      ================================================== */}

      <Drawer
        variant="permanent"
        open={open}
        sx={{
          display: {
            xs: "none",
            md: "block",
          },
        }}
      >
        <DrawerHeader>
          {open ? (
            <Box
              sx={{
                display: "flex",

                width: "100%",

                alignItems: "center",

                justifyContent: "space-between",

                px: 1,
              }}
            >
              <Typography
                sx={{
                  ml: 1,

                  color: "#fff",

                  fontSize: "0.72rem",

                  fontStyle: "italic",

                  fontWeight: 900,

                  textTransform: "uppercase",
                }}
              >
                Rotom
                <Box
                  component="span"
                  sx={{
                    color: ROTOM_RED,
                  }}
                >
                  PC
                </Box>
              </Typography>

              <IconButton
                type="button"
                aria-label="Collapse dashboard sidebar"
                onClick={() => setOpen(false)}
                sx={{
                  width: 36,

                  height: 36,

                  border: `2px solid ${ROTOM_RED}`,

                  borderRadius: 2,

                  color: ROTOM_RED,
                }}
              >
                {theme.direction === "rtl" ? (
                  <ChevronRightIcon />
                ) : (
                  <ChevronLeftIcon />
                )}
              </IconButton>
            </Box>
          ) : (
            <Box
              sx={{
                width: "100%",

                textAlign: "center",

                color: ROTOM_CYAN,

                fontSize: "1rem",

                fontWeight: 900,
              }}
            >
              R
            </Box>
          )}
        </DrawerHeader>

        {renderNavigationMenu(false)}
      </Drawer>

      {/* =================================================
          MAIN CONTENT
      ================================================== */}

      <Box
        component="main"
        sx={{
          flex: 1,

          width: 0,

          minWidth: 0,

          minHeight: "100dvh",

          overflowX: "hidden",

          p: {
            xs: 1.5,
            sm: 2,
            md: 2.5,
            lg: 3,
          },
        }}
      >
        {/* Offset fixed AppBar */}

        <DrawerHeader />

        <Box
          sx={{
            width: "100%",

            minWidth: 0,

            mt: {
              xs: 1,
              sm: 1.5,
              md: 2,
            },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashLayout;
