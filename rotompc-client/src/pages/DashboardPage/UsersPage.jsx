// filepath: rotompc-client/src/pages/DashboardPage/UsersPage.jsx

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";

import { useNavigate } from "react-router-dom";

import * as userService from "@/services/UserService";

/* =========================================================
   CONFIG
========================================================= */

const ROLES = ["admin", "trainer", "professor", "editor", "champion"];

const GENDERS = ["male", "female", "other"];

const BLANK_FORM = {
  firstName: "",
  lastName: "",
  age: "",
  gender: "",
  contactNumber: "",
  email: "",
  role: "trainer",
  username: "",
  password: "",
  address: "N/A",
  isActive: true,
};

/* =========================================================
   HELPERS
========================================================= */

const normalizeRole = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getUserId = (user) => String(user?.id || user?._id || "");

const getFullName = (user) => {
  const fullName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || user?.username || "Unnamed User";
};

const formatNumber = (value) =>
  new Intl.NumberFormat("en-US").format(Number(value) || 0);

/* =========================================================
   SUMMARY CARD
========================================================= */

const SummaryCard = ({ label, value, helper, accent = "#1A1A1A" }) => {
  return (
    <Paper
      sx={{
        position: "relative",
        minWidth: 0,

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
      <Box
        sx={{
          position: "absolute",
          top: 0,
          right: 0,

          width: 7,
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
            sm: "0.64rem",
          },

          fontWeight: 900,

          letterSpacing: "0.07em",

          lineHeight: 1.2,

          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: 0.75,

          color: accent,

          fontSize: {
            xs: "1.7rem",
            sm: "2rem",
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
            mt: 0.7,

            color: "text.secondary",

            fontSize: "0.65rem",

            fontWeight: 650,

            lineHeight: 1.3,
          }}
        >
          {helper}
        </Typography>
      )}
    </Paper>
  );
};

/* =========================================================
   USERS PAGE
========================================================= */

function UsersPage() {
  const navigate = useNavigate();

  const theme = useTheme();

  const mobileView = useMediaQuery(theme.breakpoints.down("md"));

  const smallView = useMediaQuery(theme.breakpoints.down("sm"));

  /* =======================================================
     ACCESS
  ======================================================= */

  const [accessChecked, setAccessChecked] = useState(false);

  const [authorized, setAuthorized] = useState(false);

  const [currentAdminId, setCurrentAdminId] = useState("");

  /* =======================================================
     DATA
  ======================================================= */

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     FILTERS
  ======================================================= */

  const [search, setSearch] = useState("");

  const [filterRole, setFilterRole] = useState("all");

  const [filterStatus, setFilterStatus] = useState("all");

  /* =======================================================
     EDIT / CREATE
  ======================================================= */

  const [modal, setModal] = useState({
    open: false,
    id: null,
  });

  const [form, setForm] = useState(BLANK_FORM);

  const [showPassword, setShowPassword] = useState(false);

  const [saving, setSaving] = useState(false);

  /* =======================================================
     DELETE
  ======================================================= */

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [userToDelete, setUserToDelete] = useState(null);

  const [deleting, setDeleting] = useState(false);

  /* =======================================================
     LOAD USERS
  ======================================================= */

  const fetchUsersList = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const res = await userService.fetchUsers();

      setUsers(Array.isArray(res.data) ? res.data : res.data?.users || []);
    } catch (err) {
      console.error("Fetch users error:", err);

      setError(err.response?.data?.message || "Unable to load users.");
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  }, []);

  /* =======================================================
     ADMIN-ONLY ACCESS

     Important:
     Do not call fetchUsers() until the role has already
     been confirmed as admin.
  ======================================================= */

  useEffect(() => {
    const role = normalizeRole(localStorage.getItem("role"));

    const userId = String(localStorage.getItem("id") || "");

    setCurrentAdminId(userId);

    if (role !== "admin") {
      setAuthorized(false);

      setAccessChecked(true);

      if (role === "editor") {
        navigate("/dashboard", {
          replace: true,
        });
      } else {
        navigate("/", {
          replace: true,
        });
      }

      return;
    }

    setAuthorized(true);

    setAccessChecked(true);

    fetchUsersList();
  }, [navigate, fetchUsersList]);

  /* =======================================================
     FILTERED USERS
  ======================================================= */

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const fullName = getFullName(user).toLowerCase();

      const email = String(user?.email || "").toLowerCase();

      const username = String(user?.username || "").toLowerCase();

      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        email.includes(query) ||
        username.includes(query);

      const matchesRole =
        filterRole === "all" || normalizeRole(user?.role) === filterRole;

      const isActive = user?.isActive !== false;

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" ? isActive : !isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, filterRole, filterStatus]);

  /* =======================================================
     METRICS
  ======================================================= */

  const metrics = useMemo(() => {
    const active = users.filter((user) => user?.isActive !== false).length;

    const trainers = users.filter(
      (user) => normalizeRole(user?.role) === "trainer",
    ).length;

    const staff = users.filter((user) =>
      ["admin", "editor", "professor"].includes(normalizeRole(user?.role)),
    ).length;

    return {
      total: users.length,

      active,

      inactive: users.length - active,

      trainers,

      staff,
    };
  }, [users]);

  /* =======================================================
     MODAL
  ======================================================= */

  const openModal = (user = null) => {
    if (user) {
      const id = getUserId(user);

      setModal({
        open: true,
        id,
      });

      setForm({
        ...BLANK_FORM,
        ...user,

        password: "",

        role: normalizeRole(user.role) || "trainer",

        isActive: user.isActive !== false,
      });
    } else {
      setModal({
        open: true,
        id: null,
      });

      setForm({
        ...BLANK_FORM,
      });
    }

    setShowPassword(false);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModal({
      open: false,
      id: null,
    });

    setForm({
      ...BLANK_FORM,
    });

    setShowPassword(false);
  };

  /* =======================================================
     SAVE USER
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    if (!modal.id && (!form.password || form.password.length < 8)) {
      window.alert(
        "Password is required and must be at least 8 characters long for new registrations.",
      );

      return;
    }

    if (modal.id && form.password && form.password.length < 8) {
      window.alert("The updated password must be at least 8 characters long.");

      return;
    }

    if (!/^09\d{9}$/.test(String(form.contactNumber || ""))) {
      window.alert(
        "Contact number must be exactly 11 digits and start with 09.",
      );

      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,

        firstName: String(form.firstName || "").trim(),

        lastName: String(form.lastName || "").trim(),

        username: String(form.username || "").trim(),

        email: String(form.email || "")
          .trim()
          .toLowerCase(),

        contactNumber: String(form.contactNumber || "").trim(),

        role: normalizeRole(form.role),

        address: String(form.address || "").trim(),
      };

      if (modal.id) {
        if (!payload.password || !payload.password.trim()) {
          delete payload.password;
        }

        /*
         * Do not let the currently logged-in admin
         * accidentally deactivate themselves.
         */
        if (String(modal.id) === String(currentAdminId)) {
          delete payload.isActive;

          delete payload.role;
        }

        await userService.updateUser(modal.id, payload);
      } else {
        await userService.createUser(payload);
      }

      await fetchUsersList({
        refresh: true,
      });

      closeModal();
    } catch (err) {
      console.error("Save user error:", err);

      window.alert(err.response?.data?.message || "Failed to save user.");
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     TOGGLE STATUS
  ======================================================= */

  const toggleStatus = async (user) => {
    const id = getUserId(user);

    if (!id) {
      return;
    }

    if (String(id) === String(currentAdminId)) {
      window.alert("You cannot disable your own active admin session.");

      return;
    }

    try {
      await userService.updateUser(id, {
        isActive: user?.isActive === false,
      });

      await fetchUsersList({
        refresh: true,
      });
    } catch (err) {
      console.error("Toggle status error:", err);

      window.alert(
        err.response?.data?.message || "Failed to update account status.",
      );
    }
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleOpenDeleteConfirmation = (user) => {
    const id = getUserId(user);

    if (String(id) === String(currentAdminId)) {
      window.alert(
        "You cannot delete your own account from the current session.",
      );

      return;
    }

    setUserToDelete(user);

    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (deleting) {
      return;
    }

    setDeleteDialogOpen(false);

    setUserToDelete(null);
  };

  const handleConfirmDelete = async () => {
    const id = getUserId(userToDelete);

    if (!userToDelete || !id) {
      return;
    }

    setDeleting(true);

    try {
      await userService.deleteUser(id);

      await fetchUsersList({
        refresh: true,
      });

      handleCloseDeleteDialog();
    } catch (err) {
      console.error("Delete user error:", err);

      window.alert(err.response?.data?.message || "Unable to delete user.");
    } finally {
      setDeleting(false);
    }
  };

  /* =======================================================
     BUTTON STYLE
  ======================================================= */

  const baseButtonStyle = {
    minHeight: 40,

    border: "2px solid #1A1A1A",

    borderRadius: 2,

    px: 2,

    fontSize: "0.72rem",

    fontWeight: 900,

    textTransform: "none",

    boxShadow: "3px 3px 0px #000",

    "&:active": {
      transform: "translate(3px, 3px)",

      boxShadow: "none",
    },
  };

  const primaryButton = {
    ...baseButtonStyle,

    bgcolor: "#cc0000",

    color: "#fff",

    "&:hover": {
      bgcolor: "#a30000",

      boxShadow: "2px 2px 0px #000",
    },
  };

  const secondaryButton = {
    ...baseButtonStyle,

    bgcolor: "#fff",

    color: "#1A1A1A",

    "&:hover": {
      bgcolor: "#f4f4f5",

      boxShadow: "2px 2px 0px #000",
    },
  };

  /* =======================================================
     DESKTOP COLUMNS
  ======================================================= */

  const columns = useMemo(
    () => [
      {
        field: "firstName",

        headerName: "First Name",

        minWidth: 120,

        flex: 1,
      },

      {
        field: "lastName",

        headerName: "Last Name",

        minWidth: 120,

        flex: 1,
      },

      {
        field: "username",

        headerName: "Username",

        minWidth: 140,

        flex: 1,
      },

      {
        field: "email",

        headerName: "Email",

        minWidth: 210,

        flex: 1.4,
      },

      {
        field: "role",

        headerName: "Role",

        width: 110,

        renderCell: (params) => (
          <Chip
            size="small"
            label={capitalizeRole(params.value)}
            sx={{
              fontWeight: 800,

              textTransform: "capitalize",
            }}
          />
        ),
      },

      {
        field: "isActive",

        headerName: "Status",

        width: 110,

        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value !== false ? "Active" : "Inactive"}
            sx={{
              bgcolor: params.value !== false ? "#dcfce7" : "#e4e4e7",

              color: params.value !== false ? "#166534" : "#52525b",

              fontWeight: 800,
            }}
          />
        ),
      },

      {
        field: "actions",

        headerName: "Actions",

        width: 260,

        sortable: false,

        filterable: false,

        renderCell: (params) => {
          const id = getUserId(params.row);

          const isSelf = String(id) === String(currentAdminId);

          return (
            <Stack
              direction="row"
              spacing={0.8}
              alignItems="center"
              sx={{
                height: "100%",
              }}
            >
              <Button
                size="small"
                variant="outlined"
                onClick={() => openModal(params.row)}
                sx={{
                  minWidth: 55,

                  fontWeight: 800,

                  textTransform: "none",
                }}
              >
                Edit
              </Button>

              <Button
                size="small"
                variant="contained"
                disabled={isSelf}
                onClick={() => toggleStatus(params.row)}
                sx={{
                  minWidth: 74,

                  bgcolor:
                    params.row?.isActive !== false ? "#f59e0b" : "#16a34a",

                  color: "#fff",

                  fontWeight: 800,

                  textTransform: "none",

                  "&:hover": {
                    bgcolor:
                      params.row?.isActive !== false ? "#d97706" : "#15803d",
                  },
                }}
              >
                {params.row?.isActive !== false ? "Disable" : "Enable"}
              </Button>

              <IconButton
                size="small"
                disabled={isSelf}
                aria-label={`Delete ${getFullName(params.row)}`}
                onClick={() => handleOpenDeleteConfirmation(params.row)}
                sx={{
                  border: "1px solid #ef4444",

                  borderRadius: 1,

                  color: "#dc2626",

                  "&:hover": {
                    bgcolor: "#fee2e2",
                  },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          );
        },
      },
    ],
    [currentAdminId],
  );

  /* =======================================================
     ACCESS / LOADING
  ======================================================= */

  if (!accessChecked) {
    return (
      <Box
        sx={{
          display: "flex",
          minHeight: "50vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress
          sx={{
            color: "#cc0000",
          }}
        />
      </Box>
    );
  }

  if (!authorized) {
    return null;
  }

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
        <Stack spacing={2} alignItems="center">
          <CircularProgress
            sx={{
              color: "#cc0000",
            }}
          />

          <Typography
            sx={{
              color: "text.secondary",

              fontSize: "0.75rem",

              fontWeight: 800,
            }}
          >
            Loading user registry...
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
          md: "row",
        }}
        justifyContent="space-between"
        alignItems={{
          xs: "stretch",
          md: "center",
        }}
        spacing={2}
        sx={{
          mb: {
            xs: 3,
            sm: 4,
          },
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,

              fontStyle: "italic",

              textTransform: "uppercase",

              lineHeight: 1,

              fontSize: {
                xs: "1.55rem",
                sm: "1.9rem",
                lg: "2.125rem",
              },
            }}
          >
            USER{" "}
            <Box
              component="span"
              sx={{
                color: "#cc0000",
              }}
            >
              MANAGEMENT
            </Box>
          </Typography>

          <Typography
            sx={{
              mt: 1,

              maxWidth: 650,

              color: "text.secondary",

              fontSize: {
                xs: "0.73rem",
                sm: "0.84rem",
              },

              fontWeight: 600,
            }}
          >
            Administrator-only account management for RotomPC users, roles, and
            account status.
          </Typography>
        </Box>

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={1.2}
        >
          <Button
            type="button"
            startIcon={<RefreshIcon />}
            disabled={refreshing}
            onClick={() =>
              fetchUsersList({
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
            onClick={() => openModal()}
            sx={{
              ...primaryButton,

              width: {
                xs: "100%",
                sm: "auto",
              },
            }}
          >
            Add User
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

      {/* =================================================
          SUMMARY
      ================================================== */}

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",

            md: "repeat(5, minmax(0, 1fr))",
          },

          gap: {
            xs: 1.25,
            sm: 2,
          },

          mb: 3,

          "@media (max-width: 370px)": {
            gridTemplateColumns: "1fr",
          },
        }}
      >
        <SummaryCard label="Total Users" value={formatNumber(metrics.total)} />

        <SummaryCard
          label="Active"
          value={formatNumber(metrics.active)}
          accent="#16a34a"
        />

        <SummaryCard
          label="Inactive"
          value={formatNumber(metrics.inactive)}
          accent="#71717a"
        />

        <SummaryCard
          label="Trainers"
          value={formatNumber(metrics.trainers)}
          accent="#cc0000"
        />

        <SummaryCard
          label="Staff"
          value={formatNumber(metrics.staff)}
          helper="Admin, editor, professor"
          accent="#3b4cca"
        />
      </Box>

      {/* =================================================
          FILTERS
      ================================================== */}

      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        spacing={1.5}
        sx={{
          mb: 3,
        }}
      >
        <TextField
          fullWidth
          size="small"
          label="Search name, email, or username"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{
            bgcolor: "#fff",
          }}
        />

        <Select
          size="small"
          value={filterRole}
          onChange={(event) => setFilterRole(event.target.value)}
          sx={{
            minWidth: {
              xs: "100%",
              md: 150,
            },

            bgcolor: "#fff",
          }}
        >
          <MenuItem value="all">All Roles</MenuItem>

          {ROLES.map((role) => (
            <MenuItem
              key={role}
              value={role}
              sx={{
                textTransform: "capitalize",
              }}
            >
              {role}
            </MenuItem>
          ))}
        </Select>

        <Select
          size="small"
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
          sx={{
            minWidth: {
              xs: "100%",
              md: 150,
            },

            bgcolor: "#fff",
          }}
        >
          <MenuItem value="all">All Status</MenuItem>

          <MenuItem value="active">Active</MenuItem>

          <MenuItem value="inactive">Inactive</MenuItem>
        </Select>
      </Stack>

      {/* =================================================
          RESULT COUNT
      ================================================== */}

      <Typography
        sx={{
          mb: 1.5,

          color: "text.secondary",

          fontSize: "0.68rem",

          fontWeight: 800,
        }}
      >
        Showing {formatNumber(filteredUsers.length)} of{" "}
        {formatNumber(users.length)} accounts
      </Typography>

      {/* =================================================
          MOBILE USER CARDS
      ================================================== */}

      {mobileView ? (
        <Stack spacing={1.5}>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => {
              const id = getUserId(user);

              const isSelf = String(id) === String(currentAdminId);

              return (
                <Paper
                  key={id}
                  sx={{
                    p: 1.75,

                    border: "2px solid #1A1A1A",

                    borderRadius: 2,

                    bgcolor: "#fff",

                    boxShadow: "4px 4px 0px #000",
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1}
                  >
                    <Box
                      sx={{
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.92rem",

                          fontWeight: 900,

                          lineHeight: 1.2,
                        }}
                      >
                        {getFullName(user)}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.3,

                          color: "text.secondary",

                          fontSize: "0.67rem",

                          fontWeight: 700,

                          overflow: "hidden",

                          textOverflow: "ellipsis",
                        }}
                      >
                        @{user.username}
                      </Typography>
                    </Box>

                    <Chip
                      size="small"
                      label={normalizeRole(user.role) || "unknown"}
                      sx={{
                        flexShrink: 0,

                        fontSize: "0.62rem",

                        fontWeight: 850,

                        textTransform: "capitalize",
                      }}
                    />
                  </Stack>

                  <Box
                    sx={{
                      mt: 1.5,

                      p: 1.2,

                      borderRadius: 1.5,

                      bgcolor: "#f4f4f5",
                    }}
                  >
                    <Typography
                      sx={{
                        overflow: "hidden",

                        textOverflow: "ellipsis",

                        fontSize: "0.68rem",

                        fontWeight: 700,
                      }}
                    >
                      {user.email}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.35,

                        color: "text.secondary",

                        fontSize: "0.63rem",

                        fontWeight: 650,
                      }}
                    >
                      {user.contactNumber || "No contact number"}
                    </Typography>
                  </Box>

                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1}
                    sx={{
                      mt: 1.25,
                    }}
                  >
                    <Chip
                      size="small"
                      label={user.isActive !== false ? "Active" : "Inactive"}
                      sx={{
                        bgcolor:
                          user.isActive !== false ? "#dcfce7" : "#e4e4e7",

                        color: user.isActive !== false ? "#166534" : "#52525b",

                        fontSize: "0.62rem",

                        fontWeight: 850,
                      }}
                    />

                    {isSelf && (
                      <Typography
                        sx={{
                          color: "#3b4cca",

                          fontSize: "0.59rem",

                          fontWeight: 850,

                          textTransform: "uppercase",
                        }}
                      >
                        Current account
                      </Typography>
                    )}
                  </Stack>

                  <Box
                    sx={{
                      display: "grid",

                      gridTemplateColumns: isSelf
                        ? "1fr"
                        : "repeat(3, minmax(0, 1fr))",

                      gap: 0.8,

                      mt: 1.5,
                    }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => openModal(user)}
                      sx={{
                        minHeight: 38,

                        fontWeight: 850,

                        textTransform: "none",
                      }}
                    >
                      Edit
                    </Button>

                    {!isSelf && (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => toggleStatus(user)}
                          sx={{
                            minHeight: 38,

                            bgcolor:
                              user.isActive !== false ? "#f59e0b" : "#16a34a",

                            color: "#fff",

                            fontSize: "0.68rem",

                            fontWeight: 850,

                            textTransform: "none",

                            "&:hover": {
                              bgcolor:
                                user.isActive !== false ? "#d97706" : "#15803d",
                            },
                          }}
                        >
                          {user.isActive !== false ? "Disable" : "Enable"}
                        </Button>

                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleOpenDeleteConfirmation(user)}
                          sx={{
                            minHeight: 38,

                            fontSize: "0.68rem",

                            fontWeight: 850,

                            textTransform: "none",
                          }}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </Box>
                </Paper>
              );
            })
          ) : (
            <Paper
              sx={{
                p: 4,

                border: "2px dashed #d4d4d8",

                borderRadius: 2,

                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  color: "text.secondary",

                  fontSize: "0.75rem",

                  fontWeight: 800,
                }}
              >
                No users match the current filters.
              </Typography>
            </Paper>
          )}
        </Stack>
      ) : (
        /* ===============================================
           DESKTOP TABLE
        ================================================ */

        <Paper
          sx={{
            width: "100%",

            height: 610,

            border: "2px solid #1A1A1A",

            borderRadius: 2,

            boxShadow: "4px 4px 0px #000",

            overflow: "hidden",
          }}
        >
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            getRowId={(row) => getUserId(row)}
            disableRowSelectionOnClick
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 10,
                },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            sx={{
              border: "none",

              "& .MuiDataGrid-columnHeaders": {
                bgcolor: "#f4f4f5",

                fontWeight: 900,
              },

              "& .MuiDataGrid-cell": {
                display: "flex",

                alignItems: "center",
              },
            }}
          />
        </Paper>
      )}

      {/* =================================================
          CREATE / EDIT DIALOG
      ================================================== */}

      <Dialog
        open={modal.open}
        onClose={closeModal}
        fullWidth
        fullScreen={smallView}
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle
            sx={{
              bgcolor: "#1A1A1A",

              color: "#fff",

              fontSize: {
                xs: "0.95rem",
                sm: "1.1rem",
              },

              fontWeight: 900,
            }}
          >
            {modal.id ? "EDIT USER PROFILE" : "REGISTER NEW USER"}
          </DialogTitle>

          <DialogContent
            sx={{
              pt: "24px !important",
            }}
          >
            <Stack spacing={2}>
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={2}
              >
                <TextField
                  label="First Name"
                  fullWidth
                  value={form.firstName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      firstName: event.target.value,
                    }))
                  }
                  required
                />

                <TextField
                  label="Last Name"
                  fullWidth
                  value={form.lastName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      lastName: event.target.value,
                    }))
                  }
                  required
                />
              </Stack>

              <TextField
                label="Username"
                fullWidth
                value={form.username}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,

                    username: event.target.value,
                  }))
                }
                required
              />

              <TextField
                label="Email"
                type="email"
                fullWidth
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,

                    email: event.target.value,
                  }))
                }
                required
              />

              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={2}
              >
                <TextField
                  label="Contact Number"
                  placeholder="09XXXXXXXXX"
                  fullWidth
                  value={form.contactNumber}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      contactNumber: event.target.value,
                    }))
                  }
                  required
                />

                <TextField
                  label="Age"
                  type="number"
                  fullWidth
                  value={form.age}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      age: event.target.value,
                    }))
                  }
                  required
                  inputProps={{
                    min: 18,
                    max: 100,
                  }}
                />
              </Stack>

              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={2}
              >
                <TextField
                  select
                  label="Gender"
                  fullWidth
                  value={form.gender}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      gender: event.target.value,
                    }))
                  }
                  required
                >
                  {GENDERS.map((gender) => (
                    <MenuItem
                      key={gender}
                      value={gender}
                      sx={{
                        textTransform: "capitalize",
                      }}
                    >
                      {gender}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Role"
                  fullWidth
                  disabled={String(modal.id) === String(currentAdminId)}
                  value={form.role}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      role: event.target.value,
                    }))
                  }
                  required
                >
                  {ROLES.map((role) => (
                    <MenuItem
                      key={role}
                      value={role}
                      sx={{
                        textTransform: "capitalize",
                      }}
                    >
                      {role}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              <TextField
                label="Address"
                fullWidth
                multiline
                minRows={2}
                value={form.address}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,

                    address: event.target.value,
                  }))
                }
              />

              <TextField
                type={showPassword ? "text" : "password"}
                label={modal.id ? "Change Password" : "Password"}
                helperText={
                  modal.id
                    ? "Leave blank to keep the existing password."
                    : "Minimum 8 characters."
                }
                fullWidth
                value={form.password || ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,

                    password: event.target.value,
                  }))
                }
                required={!modal.id}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        edge="end"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        onClick={() => setShowPassword((current) => !current)}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={form.isActive}
                    disabled={String(modal.id) === String(currentAdminId)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        isActive: event.target.checked,
                      }))
                    }
                    color="error"
                  />
                }
                label={
                  form.isActive ? "Account is Active" : "Account is Inactive"
                }
              />
            </Stack>
          </DialogContent>

          <DialogActions
            sx={{
              display: "flex",

              flexDirection: {
                xs: "column-reverse",
                sm: "row",
              },

              gap: 1,

              p: {
                xs: 2,
                sm: 3,
              },

              "& > :not(style) ~ :not(style)": {
                ml: {
                  xs: "0 !important",
                  sm: 1,
                },
              },
            }}
          >
            <Button
              type="button"
              disabled={saving}
              onClick={closeModal}
              sx={{
                width: {
                  xs: "100%",
                  sm: "auto",
                },

                color: "#666",

                fontWeight: 800,
              }}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{
                width: {
                  xs: "100%",
                  sm: "auto",
                },

                minHeight: 42,

                bgcolor: "#cc0000",

                px: 4,

                fontWeight: 900,

                "&:hover": {
                  bgcolor: "#a30000",
                },
              }}
            >
              {saving ? "Saving..." : modal.id ? "Update User" : "Create User"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* =================================================
          DELETE DIALOG
      ================================================== */}

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle
          sx={{
            bgcolor: "#cc0000",

            color: "#fff",

            fontSize: "1rem",

            fontWeight: 900,
          }}
        >
          DELETE USER
        </DialogTitle>

        <DialogContent
          sx={{
            pt: "24px !important",
          }}
        >
          <DialogContentText
            sx={{
              color: "#1A1A1A",

              fontSize: "0.8rem",

              fontWeight: 700,

              lineHeight: 1.6,
            }}
          >
            Permanently delete <strong>{getFullName(userToDelete)}</strong>
            {userToDelete?.username ? ` (@${userToDelete.username})` : ""}? This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>

        <DialogActions
          sx={{
            display: "flex",

            flexDirection: {
              xs: "column-reverse",
              sm: "row",
            },

            gap: 1,

            p: 2,

            "& > :not(style) ~ :not(style)": {
              ml: {
                xs: "0 !important",
                sm: 1,
              },
            },
          }}
        >
          <Button
            type="button"
            disabled={deleting}
            onClick={handleCloseDeleteDialog}
            sx={{
              width: {
                xs: "100%",
                sm: "auto",
              },

              color: "#666",

              fontWeight: 800,
            }}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="contained"
            color="error"
            disabled={deleting}
            onClick={handleConfirmDelete}
            sx={{
              width: {
                xs: "100%",
                sm: "auto",
              },

              border: "2px solid #000",

              fontWeight: 900,

              boxShadow: "2px 2px 0px #000",
            }}
          >
            {deleting ? "Deleting..." : "Delete Forever"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/* =========================================================
   ROLE LABEL
========================================================= */

const capitalizeRole = (value) => {
  const role = String(value || "");

  return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Unknown";
};

export default UsersPage;
