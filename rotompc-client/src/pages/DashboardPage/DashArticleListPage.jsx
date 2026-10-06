// filepath: rotompc-client/src/pages/DashboardPage/DashArticleListPage.jsx

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
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ClearIcon from "@mui/icons-material/Clear";
import RefreshIcon from "@mui/icons-material/Refresh";

import { DataGrid } from "@mui/x-data-grid";

import { useNavigate } from "react-router-dom";

import * as articleService from "@/services/ArticleService";

/* =========================================================
   CONFIG
========================================================= */

const COLOR_OPTIONS = [
  {
    value: "bg-pink-500",
    label: "Pink",
  },
  {
    value: "bg-blue-500",
    label: "Blue",
  },
  {
    value: "bg-yellow-400",
    label: "Yellow",
  },
  {
    value: "bg-purple-600",
    label: "Purple",
  },
  {
    value: "bg-indigo-800",
    label: "Indigo",
  },
  {
    value: "bg-green-600",
    label: "Green",
  },
  {
    value: "bg-orange-600",
    label: "Orange",
  },
  {
    value: "bg-cyan-400",
    label: "Cyan",
  },
  {
    value: "bg-zinc-500",
    label: "Zinc",
  },
];

const EMPTY_FORM = {
  id: "",
  title: "",
  name: "",
  desc: "",
  content: "",
  author: "",
  userId: "",
  status: "active",
  image: "",
  color: "bg-zinc-500",
};

const FALLBACK_IMAGE =
  "https://ik.imagekit.io/ytwzizvepv/RotomPC/placeholder.png";

/* =========================================================
   HELPERS
========================================================= */

const normalizeRole = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getArticleMongoId = (article) => String(article?._id || "");

const getArticleDate = (article) => {
  const value =
    article?.createdAt?.$date ||
    article?.createdAt ||
    article?.date ||
    article?.updatedAt?.$date ||
    article?.updatedAt;

  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (article) => {
  const date = getArticleDate(article);

  if (!date) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
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
          xs: 1.6,
          sm: 2,
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

          fontSize: "0.59rem",

          fontWeight: 900,

          letterSpacing: "0.07em",

          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: 0.65,

          color: accent,

          fontSize: {
            xs: "1.65rem",
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
            mt: 0.6,

            color: "text.secondary",

            fontSize: "0.63rem",

            fontWeight: 650,
          }}
        >
          {helper}
        </Typography>
      )}
    </Paper>
  );
};

/* =========================================================
   DASH ARTICLE LIST
========================================================= */

function DashArticleListPage() {
  const navigate = useNavigate();

  const theme = useTheme();

  const mobileView = useMediaQuery(theme.breakpoints.down("md"));

  const smallView = useMediaQuery(theme.breakpoints.down("sm"));

  /* =======================================================
     ACCESS

     Allowed:
     - admin
     - editor
  ======================================================= */

  const [accessChecked, setAccessChecked] = useState(false);

  const [authorized, setAuthorized] = useState(false);

  /* =======================================================
     ARTICLES
  ======================================================= */

  const [articles, setArticles] = useState(() => {
    try {
      const cached = sessionStorage.getItem("dash_articles_cache");

      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [initialLoading, setInitialLoading] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     FILTERS
  ======================================================= */

  const [searchQuery, setSearchQuery] = useState(
    () => sessionStorage.getItem("dash_articles_search") || "",
  );

  const [statusFilter, setStatusFilter] = useState(
    () => sessionStorage.getItem("dash_articles_status") || "all",
  );

  /* =======================================================
     EDITOR
  ======================================================= */

  const [open, setOpen] = useState(false);

  const [selectedId, setSelectedId] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [saving, setSaving] = useState(false);

  /* =======================================================
     DELETE
  ======================================================= */

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [articleToDelete, setArticleToDelete] = useState(null);

  const [deleting, setDeleting] = useState(false);

  /* =======================================================
     IDENTITY
  ======================================================= */

  const getActiveUserIdentity = useCallback(() => {
    const activeUserId = String(localStorage.getItem("id") || "");

    const rawUserData = localStorage.getItem("user");

    const storedFirstName = localStorage.getItem("firstName");

    let activeUsername = "";

    if (rawUserData) {
      try {
        const parsed = JSON.parse(rawUserData);

        activeUsername =
          parsed?.username ||
          parsed?.firstName ||
          parsed?.name ||
          parsed?.email ||
          storedFirstName ||
          "";
      } catch {
        activeUsername = rawUserData;
      }
    }

    if (!activeUsername && storedFirstName) {
      activeUsername = storedFirstName;
    }

    return {
      activeUserId,

      activeUsername: String(activeUsername || "").trim(),
    };
  }, []);

  const activeIdentity = getActiveUserIdentity();

  /* =======================================================
     NORMALIZE
  ======================================================= */

  const normalizeArticleArray = useCallback((data) => {
    const array = Array.isArray(data) ? data : data?.articles || [];

    return [...array].sort((a, b) => {
      const dateA = getArticleDate(a);

      const dateB = getArticleDate(b);

      return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    });
  }, []);

  const saveArticlesToSession = (data) => {
    try {
      sessionStorage.setItem(
        "dash_articles_cache",

        JSON.stringify(data),
      );
    } catch {
      // Ignore unavailable storage.
    }
  };

  /* =======================================================
     LOAD
  ======================================================= */

  const loadArticles = useCallback(
    async (forceRefresh = false) => {
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setInitialLoading(true);
      }

      setError("");

      try {
        if (!forceRefresh) {
          const stored = sessionStorage.getItem("dash_articles_cache");

          if (stored) {
            try {
              const cached = JSON.parse(stored);

              setArticles(normalizeArticleArray(cached));
            } catch {
              // Continue to network request.
            }
          }
        }

        const res = await articleService.fetchArticles(forceRefresh);

        const normalized = normalizeArticleArray(res.data);

        setArticles(normalized);

        saveArticlesToSession(normalized);
      } catch (err) {
        console.error("Error fetching articles:", err);

        setError(
          err.response?.data?.message || "Unable to load report archive.",
        );
      } finally {
        setInitialLoading(false);

        setIsRefreshing(false);
      }
    },
    [normalizeArticleArray],
  );

  /* =======================================================
     ACCESS + INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    const role = normalizeRole(localStorage.getItem("role"));

    if (!["admin", "editor"].includes(role)) {
      setAuthorized(false);

      setAccessChecked(true);

      navigate("/", {
        replace: true,
      });

      return;
    }

    setAuthorized(true);

    setAccessChecked(true);

    loadArticles(false);
  }, [navigate, loadArticles]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredArticles = useMemo(() => {
    let result = [...articles];

    if (statusFilter !== "all") {
      result = result.filter((article) => article?.status === statusFilter);
    }

    const query = searchQuery.trim().toLowerCase();

    if (query) {
      result = result.filter(
        (article) =>
          String(article?.title || "")
            .toLowerCase()
            .includes(query) ||
          String(article?.author || "")
            .toLowerCase()
            .includes(query) ||
          String(article?.name || "")
            .toLowerCase()
            .includes(query),
      );
    }

    return result;
  }, [articles, searchQuery, statusFilter]);

  useEffect(() => {
    try {
      sessionStorage.setItem("dash_articles_search", searchQuery);

      sessionStorage.setItem("dash_articles_status", statusFilter);
    } catch {
      // Ignore unavailable session storage.
    }
  }, [searchQuery, statusFilter]);

  /* =======================================================
     METRICS
  ======================================================= */

  const metrics = useMemo(() => {
    const active = articles.filter(
      (article) => article?.status === "active",
    ).length;

    const archived = articles.filter(
      (article) => article?.status === "archived",
    ).length;

    const mine = articles.filter(
      (article) =>
        String(article?.userId || "") ===
        String(activeIdentity.activeUserId || ""),
    ).length;

    return {
      total: articles.length,

      active,

      archived,

      mine,
    };
  }, [articles, activeIdentity.activeUserId]);

  /* =======================================================
     IMAGE
  ======================================================= */

  const renderArticleImage = (article) => {
    if (article?.imageUrl) {
      return article.imageUrl;
    }

    const mongoId = getArticleMongoId(article);

    if (mongoId) {
      return articleService.getArticleImageUrl(mongoId);
    }

    return FALLBACK_IMAGE;
  };

  /* =======================================================
     FORM
  ======================================================= */

  const resetForm = () => {
    setForm({
      ...EMPTY_FORM,
    });

    setSelectedFile(null);
  };

  const openCreateModal = () => {
    setSelectedId(null);

    resetForm();

    setOpen(true);
  };

  const handleClose = () => {
    if (saving) {
      return;
    }

    setOpen(false);

    setSelectedId(null);

    resetForm();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);

    setForm((current) => ({
      ...current,

      image: "",
    }));
  };

  const handleClearFile = () => {
    setSelectedFile(null);
  };

  const buildSlug = () => {
    const source = form.name.trim() || form.title.trim();

    return source
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    const { activeUserId, activeUsername } = getActiveUserIdentity();

    if (!selectedId && !activeUserId) {
      window.alert("Cannot create report. Missing logged-in user ID.");

      return;
    }

    if (!selectedId && !activeUsername) {
      window.alert("Cannot create report. Missing author identity.");

      return;
    }

    setSaving(true);

    const formData = new FormData();

    formData.append(
      "id",

      selectedId
        ? form.id.trim()
        : `ART-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
    );

    formData.append("title", form.title.trim());

    if (selectedId) {
      formData.append("name", buildSlug());
    }

    formData.append("desc", form.desc.trim());

    formData.append("status", form.status);

    formData.append("color", form.color);

    formData.append(
      "content",

      typeof form.content === "string"
        ? form.content.trim()
        : JSON.stringify(form.content),
    );

    if (selectedId) {
      formData.append("author", form.author.trim());

      formData.append(
        "userId",

        form.userId || activeUserId || "",
      );
    } else {
      formData.append("userId", activeUserId);

      formData.append("author", activeUsername);
    }

    if (selectedFile) {
      formData.append("image", selectedFile);
    } else if (form.image.trim()) {
      formData.append("image", form.image.trim());
    }

    try {
      if (selectedId) {
        await articleService.updateArticle(selectedId, formData);
      } else {
        await articleService.createArticle(formData);
      }

      await loadArticles(true);

      handleClose();
    } catch (err) {
      console.error("Save article error:", err);

      window.alert(err.response?.data?.message || "Unable to save report.");
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     STATUS
  ======================================================= */

  const handleToggleStatus = async (article) => {
    const mongoId = getArticleMongoId(article);

    if (!mongoId) {
      return;
    }

    try {
      const formData = new FormData();

      formData.append("id", article.id || "");

      formData.append("title", article.title || "");

      formData.append("name", article.name || "");

      formData.append("desc", article.desc || "");

      formData.append("author", article.author || "");

      formData.append("userId", article.userId || "");

      formData.append(
        "status",

        article.status === "active" ? "archived" : "active",
      );

      formData.append("color", article.color || "bg-zinc-500");

      formData.append(
        "content",

        Array.isArray(article.content)
          ? article.content.join("\n\n")
          : article.content || "",
      );

      if (article.imageUrl) {
        formData.append("image", article.imageUrl);
      }

      await articleService.updateArticle(mongoId, formData);

      await loadArticles(true);
    } catch (err) {
      console.error("Status update error:", err);

      window.alert(
        err.response?.data?.message || "Unable to update report status.",
      );
    }
  };

  /* =======================================================
     EDIT
  ======================================================= */

  const handleEditOpen = async (article) => {
    const mongoId = getArticleMongoId(article);

    if (!mongoId) {
      return;
    }

    try {
      setSelectedId(mongoId);

      setSelectedFile(null);

      const res = await articleService.fetchArticleByName(article.name);

      const fullArticle = res.data?.article || res.data;

      setForm({
        id: fullArticle?.id || "",

        title: fullArticle?.title || "",

        name: fullArticle?.name || "",

        desc: fullArticle?.desc || "",

        author: fullArticle?.author || "",

        userId: fullArticle?.userId || "",

        status: fullArticle?.status || "active",

        image: fullArticle?.imageUrl || "",

        color: fullArticle?.color || "bg-zinc-500",

        content: Array.isArray(fullArticle?.content)
          ? fullArticle.content.join("\n\n")
          : fullArticle?.content || "",
      });

      setOpen(true);
    } catch (err) {
      console.error("Load article error:", err);

      window.alert(
        err.response?.data?.message || "Unable to load report content.",
      );
    }
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleOpenDeleteConfirmation = (article) => {
    setArticleToDelete(article);

    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (deleting) {
      return;
    }

    setDeleteDialogOpen(false);

    setArticleToDelete(null);
  };

  const handleConfirmDelete = async () => {
    const mongoId = getArticleMongoId(articleToDelete);

    if (!mongoId) {
      return;
    }

    setDeleting(true);

    try {
      await articleService.deleteArticle(mongoId);

      await loadArticles(true);

      handleCloseDeleteDialog();
    } catch (err) {
      console.error("Delete report error:", err);

      window.alert(
        err.response?.data?.message || "Unable to permanently delete report.",
      );
    } finally {
      setDeleting(false);
    }
  };

  /* =======================================================
     COLUMNS
  ======================================================= */

  const columns = useMemo(
    () => [
      {
        field: "image",

        headerName: "Media",

        width: 90,

        sortable: false,

        renderCell: (params) => (
          <Box
            sx={{
              display: "flex",

              height: "100%",

              alignItems: "center",
            }}
          >
            <Box
              component="img"
              src={renderArticleImage(params.row)}
              alt=""
              sx={{
                width: 52,

                height: 36,

                border: "1px solid #d4d4d8",

                borderRadius: 1,

                objectFit: "cover",

                bgcolor: "#f4f4f5",
              }}
            />
          </Box>
        ),
      },

      {
        field: "name",

        headerName: "Slug",

        minWidth: 140,

        flex: 0.8,

        renderCell: (params) => (
          <Typography
            sx={{
              overflow: "hidden",

              textOverflow: "ellipsis",

              fontFamily: "monospace",

              fontSize: "0.7rem",

              color: "#71717a",
            }}
          >
            {params.value}
          </Typography>
        ),
      },

      {
        field: "title",

        headerName: "Title",

        minWidth: 190,

        flex: 1.2,

        renderCell: (params) => (
          <Typography
            sx={{
              overflow: "hidden",

              textOverflow: "ellipsis",

              fontSize: "0.78rem",

              fontWeight: 850,
            }}
          >
            {params.value}
          </Typography>
        ),
      },

      {
        field: "author",

        headerName: "Author",

        minWidth: 120,

        flex: 0.8,
      },

      {
        field: "status",

        headerName: "Status",

        width: 105,

        renderCell: (params) => (
          <Chip
            size="small"
            label={String(params.value || "").toUpperCase()}
            sx={{
              bgcolor: params.value === "active" ? "#4dad5b" : "#71717a",

              color: "#fff",

              fontSize: "0.61rem",

              fontWeight: 900,
            }}
          />
        ),
      },

      {
        field: "actions",

        headerName: "Actions",

        width: 250,

        sortable: false,

        filterable: false,

        renderCell: (params) => (
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
              variant="contained"
              onClick={() => handleEditOpen(params.row)}
              sx={{
                minWidth: 52,

                bgcolor: "#1A1A1A",

                fontWeight: 800,

                textTransform: "none",

                "&:hover": {
                  bgcolor: "#ffcb05",

                  color: "#000",
                },
              }}
            >
              Edit
            </Button>

            <Button
              size="small"
              variant="outlined"
              color={params.row.status === "active" ? "error" : "success"}
              onClick={() => handleToggleStatus(params.row)}
              sx={{
                minWidth: 78,

                fontWeight: 800,

                textTransform: "none",
              }}
            >
              {params.row.status === "active" ? "Archive" : "Activate"}
            </Button>

            <IconButton
              size="small"
              color="error"
              aria-label={`Delete ${params.row.title}`}
              onClick={() => handleOpenDeleteConfirmation(params.row)}
              sx={{
                border: "1px solid #ef4444",

                borderRadius: 1,

                "&:hover": {
                  bgcolor: "#fee2e2",
                },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        ),
      },
    ],
    [],
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

  if (initialLoading && articles.length === 0) {
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
            Loading Rotom archives...
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
              fontSize: {
                xs: "1.55rem",
                sm: "1.9rem",
                lg: "2.125rem",
              },

              fontStyle: "italic",

              fontWeight: 900,

              letterSpacing: -1,

              lineHeight: 1,

              textTransform: "uppercase",
            }}
          >
            ROTOM{" "}
            <Box
              component="span"
              sx={{
                color: "#cc0000",
              }}
            >
              ARCHIVES
            </Box>
          </Typography>

          <Typography
            sx={{
              mt: 1,

              maxWidth: 680,

              color: "text.secondary",

              fontSize: {
                xs: "0.73rem",
                sm: "0.84rem",
              },

              fontWeight: 600,

              lineHeight: 1.5,
            }}
          >
            Manage published and archived reports. Administrators and editors
            both have access to this workspace.
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
            variant="outlined"
            startIcon={<RefreshIcon />}
            disabled={isRefreshing}
            onClick={() => loadArticles(true)}
            sx={{
              width: {
                xs: "100%",
                sm: "auto",
              },

              minHeight: 40,

              border: "2px solid #000",

              color: "#1A1A1A",

              bgcolor: "#fff",

              fontSize: "0.7rem",

              fontWeight: 900,

              textTransform: "none",

              "&:hover": {
                border: "2px solid #000",

                bgcolor: "#f4f4f5",
              },
            }}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>

          <Button
            variant="contained"
            onClick={openCreateModal}
            sx={{
              width: {
                xs: "100%",
                sm: "auto",
              },

              minHeight: 40,

              border: "2px solid #000",

              bgcolor: "#cc0000",

              fontSize: "0.7rem",

              fontWeight: 900,

              textTransform: "none",

              boxShadow: "3px 3px 0px #000",

              "&:hover": {
                bgcolor: "#b30000",

                boxShadow: "2px 2px 0px #000",
              },
            }}
          >
            New Entry
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

            lg: "repeat(4, minmax(0, 1fr))",
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
        <SummaryCard
          label="Total Reports"
          value={formatNumber(metrics.total)}
        />

        <SummaryCard
          label="Active"
          value={formatNumber(metrics.active)}
          accent="#4dad5b"
        />

        <SummaryCard
          label="Archived"
          value={formatNumber(metrics.archived)}
          accent="#71717a"
        />

        <SummaryCard
          label="Your Reports"
          value={formatNumber(metrics.mine)}
          helper={activeIdentity.activeUsername || "Current account"}
          accent="#3b4cca"
        />
      </Box>

      {/* =================================================
          FILTERS
      ================================================== */}

      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={1.5}
        sx={{
          mb: 2.5,
        }}
      >
        <TextField
          size="small"
          label="Search title, author, or slug"
          fullWidth
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          sx={{
            bgcolor: "#fff",
          }}
        />

        <FormControl
          size="small"
          sx={{
            minWidth: {
              xs: "100%",
              sm: 170,
            },

            bgcolor: "#fff",
          }}
        >
          <InputLabel>Status</InputLabel>

          <Select
            value={statusFilter}
            label="Status"
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <MenuItem value="all">All Statuses</MenuItem>

            <MenuItem value="active">Active Only</MenuItem>

            <MenuItem value="archived">Archived Only</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Typography
        sx={{
          mb: 1.5,

          color: "text.secondary",

          fontSize: "0.67rem",

          fontWeight: 800,
        }}
      >
        Showing {formatNumber(filteredArticles.length)} of{" "}
        {formatNumber(articles.length)} reports
      </Typography>

      {/* =================================================
          MOBILE CARDS
      ================================================== */}

      {mobileView ? (
        <Stack spacing={1.5}>
          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => {
              const mongoId = getArticleMongoId(article);

              return (
                <Paper
                  key={mongoId || article.id || article.name}
                  sx={{
                    overflow: "hidden",

                    border: "2px solid #1A1A1A",

                    borderRadius: 2,

                    bgcolor: "#fff",

                    boxShadow: "4px 4px 0px #000",
                  }}
                >
                  {/* IMAGE */}

                  <Box
                    sx={{
                      aspectRatio: "16 / 7",

                      width: "100%",

                      borderBottom: "2px solid #1A1A1A",

                      bgcolor: "#e4e4e7",

                      overflow: "hidden",
                    }}
                  >
                    <Box
                      component="img"
                      src={renderArticleImage(article)}
                      alt={article.title || "Report"}
                      sx={{
                        width: "100%",

                        height: "100%",

                        objectFit: "cover",
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      p: 1.6,
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

                            lineHeight: 1.25,
                          }}
                        >
                          {article.title}
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.35,

                            overflow: "hidden",

                            textOverflow: "ellipsis",

                            whiteSpace: "nowrap",

                            color: "#71717a",

                            fontFamily: "monospace",

                            fontSize: "0.62rem",

                            fontWeight: 700,
                          }}
                        >
                          /{article.name}
                        </Typography>
                      </Box>

                      <Chip
                        size="small"
                        label={String(article.status || "").toUpperCase()}
                        sx={{
                          flexShrink: 0,

                          bgcolor:
                            article.status === "active" ? "#4dad5b" : "#71717a",

                          color: "#fff",

                          fontSize: "0.58rem",

                          fontWeight: 900,
                        }}
                      />
                    </Stack>

                    {article.desc && (
                      <Typography
                        sx={{
                          display: "-webkit-box",

                          mt: 1,

                          overflow: "hidden",

                          color: "text.secondary",

                          fontSize: "0.68rem",

                          fontWeight: 600,

                          lineHeight: 1.45,

                          WebkitBoxOrient: "vertical",

                          WebkitLineClamp: 2,
                        }}
                      >
                        {article.desc}
                      </Typography>
                    )}

                    <Stack
                      direction="row"
                      flexWrap="wrap"
                      gap={1}
                      sx={{
                        mt: 1.3,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.62rem",

                          fontWeight: 750,
                        }}
                      >
                        By {article.author || "Unknown"}
                      </Typography>

                      <Typography
                        sx={{
                          color: "text.secondary",

                          fontSize: "0.62rem",

                          fontWeight: 650,
                        }}
                      >
                        {formatDate(article)}
                      </Typography>
                    </Stack>

                    <Box
                      sx={{
                        display: "grid",

                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",

                        gap: 0.8,

                        mt: 1.5,
                      }}
                    >
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleEditOpen(article)}
                        sx={{
                          minHeight: 38,

                          bgcolor: "#1A1A1A",

                          fontSize: "0.67rem",

                          fontWeight: 850,

                          textTransform: "none",

                          "&:hover": {
                            bgcolor: "#ffcb05",

                            color: "#000",
                          },
                        }}
                      >
                        Edit
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        color={
                          article.status === "active" ? "error" : "success"
                        }
                        onClick={() => handleToggleStatus(article)}
                        sx={{
                          minHeight: 38,

                          px: 0.5,

                          fontSize: "0.63rem",

                          fontWeight: 850,

                          textTransform: "none",
                        }}
                      >
                        {article.status === "active" ? "Archive" : "Activate"}
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleOpenDeleteConfirmation(article)}
                        sx={{
                          minHeight: 38,

                          px: 0.5,

                          fontSize: "0.63rem",

                          fontWeight: 850,

                          textTransform: "none",
                        }}
                      >
                        Delete
                      </Button>
                    </Box>
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
                No reports match the current filters.
              </Typography>
            </Paper>
          )}
        </Stack>
      ) : (
        /* ===============================================
           DESKTOP DATAGRID
        ================================================ */

        <Paper
          sx={{
            width: "100%",

            height: 610,

            border: "3px solid #1A1A1A",

            borderRadius: 2,

            overflow: "hidden",

            boxShadow: "6px 6px 0px rgba(0,0,0,0.12)",
          }}
        >
          <DataGrid
            rows={filteredArticles}
            columns={columns}
            getRowId={(row) => getArticleMongoId(row) || row.id || row.name}
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
                bgcolor: "#f3f4f6",

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
        open={open}
        onClose={handleClose}
        fullWidth
        fullScreen={smallView}
        maxWidth="md"
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
            {selectedId ? "EDIT ARCHIVE LOG" : "CREATE NEW ARCHIVE LOG"}
          </DialogTitle>

          <DialogContent
            sx={{
              display: "flex",

              flexDirection: "column",

              gap: 2,

              pt: "24px !important",
            }}
          >
            {/* TITLE / ID */}

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2}
            >
              {selectedId && (
                <TextField
                  label="Log ID"
                  value={form.id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      id: event.target.value,
                    }))
                  }
                  required
                  sx={{
                    width: {
                      xs: "100%",
                      sm: "32%",
                    },
                  }}
                />
              )}

              <TextField
                label="Title"
                fullWidth
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,

                    title: event.target.value,
                  }))
                }
                required
              />
            </Stack>

            {/* SLUG / AUTHOR */}

            <Stack
              direction={{
                xs: "column",
                md: "row",
              }}
              spacing={2}
            >
              <TextField
                label="Slug"
                fullWidth
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,

                    name: event.target.value,
                  }))
                }
                placeholder="Leave empty to auto-generate"
                helperText="Used in the report URL."
              />

              <TextField
                label={selectedId ? "Author" : "Author Auto-Detected"}
                fullWidth
                value={selectedId ? form.author : activeIdentity.activeUsername}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,

                    author: event.target.value,
                  }))
                }
                required
                disabled={!selectedId}
                helperText={
                  selectedId
                    ? "Existing author metadata."
                    : "Uses the logged-in admin/editor account."
                }
              />
            </Stack>

            {/* STATUS / COLOR */}

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2}
            >
              <TextField
                label="Status"
                select
                fullWidth
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,

                    status: event.target.value,
                  }))
                }
              >
                <MenuItem value="active">Active</MenuItem>

                <MenuItem value="archived">Archived</MenuItem>
              </TextField>

              <TextField
                label="Accent Color"
                select
                fullWidth
                value={form.color}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,

                    color: event.target.value,
                  }))
                }
              >
                {COLOR_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <Box
                        className={option.value}
                        sx={{
                          width: 16,
                          height: 16,

                          border: "1px solid #aaa",

                          borderRadius: 1,
                        }}
                      />

                      <span>{option.label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Divider>
              <Chip
                size="small"
                label="ARTICLE COVER MEDIA"
                sx={{
                  fontSize: "0.6rem",

                  fontWeight: 850,
                }}
              />
            </Divider>

            {/* IMAGE */}

            <Stack
              direction={{
                xs: "column",
                md: "row",
              }}
              spacing={2}
              alignItems="stretch"
            >
              <Box
                sx={{
                  flex: 1,

                  display: "flex",

                  minHeight: 120,

                  flexDirection: "column",

                  alignItems: "center",

                  justifyContent: "center",

                  p: 2,

                  border: "2px dashed #ccc",

                  borderRadius: 2,

                  bgcolor: selectedFile ? "#f0fdf4" : "#fafafa",

                  textAlign: "center",
                }}
              >
                <input
                  accept="image/*"
                  hidden
                  id="article-image-file"
                  type="file"
                  onChange={handleFileChange}
                  disabled={Boolean(form.image.trim()) && !selectedFile}
                />

                <label htmlFor="article-image-file">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    disabled={Boolean(form.image.trim()) && !selectedFile}
                    sx={{
                      color: "#1A1A1A",

                      borderColor: "#1A1A1A",

                      fontWeight: 800,

                      textTransform: "none",
                    }}
                  >
                    Upload File
                  </Button>
                </label>

                <Typography
                  sx={{
                    mt: 1,

                    maxWidth: "100%",

                    overflowWrap: "anywhere",

                    color: "text.secondary",

                    fontSize: "0.63rem",

                    fontWeight: 650,
                  }}
                >
                  {selectedFile ? selectedFile.name : "Choose a local image"}
                </Typography>

                {selectedFile && (
                  <Button
                    type="button"
                    size="small"
                    color="error"
                    startIcon={<ClearIcon />}
                    onClick={handleClearFile}
                    sx={{
                      mt: 0.5,

                      fontSize: "0.63rem",

                      fontWeight: 800,

                      textTransform: "none",
                    }}
                  >
                    Clear
                  </Button>
                )}
              </Box>

              <Box
                sx={{
                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{
                    color: "#999",

                    fontSize: "0.68rem",

                    fontWeight: 900,
                  }}
                >
                  — OR —
                </Typography>
              </Box>

              <Box
                sx={{
                  flex: 1.35,

                  display: "flex",

                  alignItems: "center",
                }}
              >
                <TextField
                  label="Direct Image URL"
                  fullWidth
                  value={form.image}
                  disabled={Boolean(selectedFile)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      image: event.target.value,
                    }))
                  }
                  placeholder="https://example.com/image.png"
                  helperText={
                    selectedFile
                      ? "Clear the uploaded file to use an image URL."
                      : "Optional absolute image URL."
                  }
                />
              </Box>
            </Stack>

            <Divider />

            <TextField
              label="Preview Description"
              fullWidth
              multiline
              minRows={2}
              value={form.desc}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,

                  desc: event.target.value,
                }))
              }
              required
            />

            <TextField
              label="Content Blocks"
              helperText="Separate paragraphs with a blank line."
              fullWidth
              multiline
              minRows={smallView ? 8 : 6}
              value={form.content}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,

                  content: event.target.value,
                }))
              }
              required
            />
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
              onClick={handleClose}
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

                border: "2px solid #000",

                bgcolor: "#ffcb05",

                color: "#000",

                fontWeight: 900,

                "&:hover": {
                  bgcolor: "#eab308",
                },
              }}
            >
              {saving
                ? "Saving..."
                : selectedId
                  ? "Update Report"
                  : "Create Report"}
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
          DELETE REPORT
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
            Permanently delete <strong>"{articleToDelete?.title}"</strong>? This
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

export default DashArticleListPage;
