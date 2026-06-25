import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Stack, Dialog, DialogTitle,
  DialogContent, TextField, DialogActions, MenuItem, Chip,
  Select, FormControl, InputLabel, IconButton, DialogContentText, Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ClearIcon from '@mui/icons-material/Clear';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DataGrid } from '@mui/x-data-grid';

import * as articleService from '@/services/ArticleService';

const COLOR_OPTIONS = [
  { value: 'bg-pink-500', label: 'Pink' },
  { value: 'bg-blue-500', label: 'Blue' },
  { value: 'bg-yellow-400', label: 'Yellow' },
  { value: 'bg-purple-600', label: 'Purple' },
  { value: 'bg-indigo-800', label: 'Indigo' },
  { value: 'bg-green-600', label: 'Green' },
  { value: 'bg-orange-600', label: 'Orange' },
  { value: 'bg-cyan-400', label: 'Cyan' },
  { value: 'bg-zinc-500', label: 'Zinc' }
];

const EMPTY_FORM = {
  id: '',
  title: '',
  name: '',
  desc: '',
  content: '',
  author: '',
  userId: '',
  status: 'active',
  image: '',
  color: 'bg-zinc-500'
};

function DashArticleListPage() {
  const [articles, setArticles] = useState(() => {
    try {
      const cached = sessionStorage.getItem('dash_articles_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [filteredArticles, setFilteredArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem('dash_articles_search') || '');
  const [statusFilter, setStatusFilter] = useState(() => sessionStorage.getItem('dash_articles_status') || 'all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);

  const saveArticlesToSession = (data) => {
    sessionStorage.setItem('dash_articles_cache', JSON.stringify(data));
  };

  const getActiveUserIdentity = () => {
    const activeUserId = localStorage.getItem('id');
    const rawUserData = localStorage.getItem('user');
    const storedFirstName = localStorage.getItem('firstName');

    let activeUsername = '';

    if (rawUserData) {
      try {
        if (rawUserData.trim().startsWith('{')) {
          const parsed = JSON.parse(rawUserData);

          activeUsername =
            parsed.username ||
            parsed.firstName ||
            parsed.name ||
            parsed.email ||
            storedFirstName ||
            '';
        } else {
          activeUsername = rawUserData;
        }
      } catch (e) {
        console.error('Identity extraction failure:', e);
        activeUsername = rawUserData;
      }
    }

    if (!activeUsername && storedFirstName) {
      activeUsername = storedFirstName;
    }

    return { activeUserId, activeUsername };
  };

  const normalizeArticleArray = (data) => {
    const dataArray = Array.isArray(data) ? data : data?.articles || [];

    return [...dataArray].sort((a, b) => {
      const timeA = new Date(a.createdAt?.$date || a.createdAt || a.date || 0);
      const timeB = new Date(b.createdAt?.$date || b.createdAt || b.date || 0);
      return timeB - timeA;
    });
  };

  const loadArticles = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setIsRefreshing(true);

      const stored = sessionStorage.getItem('dash_articles_cache');

      if (!forceRefresh && stored) {
        const cachedArticles = JSON.parse(stored);
        setArticles(normalizeArticleArray(cachedArticles));
      }

      const res = await articleService.fetchArticles(forceRefresh);
      const normalized = normalizeArticleArray(res.data);

      setArticles(normalized);
      saveArticlesToSession(normalized);
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      if (forceRefresh) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadArticles(false);
  }, []);

  useEffect(() => {
    let result = [...articles];

    if (statusFilter !== 'all') {
      result = result.filter((a) => a.status === statusFilter);
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();

      result = result.filter((a) =>
        String(a.title || '').toLowerCase().includes(query) ||
        String(a.author || '').toLowerCase().includes(query) ||
        String(a.name || '').toLowerCase().includes(query)
      );
    }

    setFilteredArticles(result);
    sessionStorage.setItem('dash_articles_search', searchQuery);
    sessionStorage.setItem('dash_articles_status', statusFilter);
  }, [articles, searchQuery, statusFilter]);

const renderArticleImage = (row) => {
  if (!row) {
    return 'https://ik.imagekit.io/ytwzizvepv/RotomPC/placeholder.png';
  }

  if (row.imageUrl) return row.imageUrl;

  if (row._id) return articleService.getArticleImageUrl(row._id);

  return 'https://ik.imagekit.io/ytwzizvepv/RotomPC/placeholder.png';
};

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setSelectedFile(null);
  };

  const openCreateModal = () => {
    setSelectedId(null);
    resetForm();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedId(null);
    resetForm();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setForm((prev) => ({ ...prev, image: '' }));
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
  };

  const buildSlug = () => {
    const base = form.name.trim() !== '' ? form.name : form.title;

    return base
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { activeUserId, activeUsername } = getActiveUserIdentity();

    if (!selectedId && !activeUserId) {
      alert('Cannot create article. Missing logged-in user ID.');
      return;
    }

    if (!selectedId && !activeUsername) {
      alert('Cannot create article. Missing logged-in author identity.');
      return;
    }

    const formData = new FormData();

    formData.append(
     'id',
      selectedId
      ? form.id.trim()
       : `ART-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`
);
    formData.append('title', form.title.trim());
    if (selectedId) {
     formData.append('name', buildSlug());
    }
    formData.append('desc', form.desc.trim());
    formData.append('status', form.status);
    formData.append('color', form.color);
    formData.append(
      'content',
      typeof form.content === 'string'
        ? form.content.trim()
        : JSON.stringify(form.content)
    );

    if (selectedId) {
      formData.append('author', form.author.trim());
      formData.append('userId', form.userId || activeUserId || '');
    } else {
      formData.append('userId', activeUserId);
      formData.append('author', activeUsername);
    }

    if (selectedFile) {
      formData.append('image', selectedFile);
    } else {
      formData.append('image', form.image.trim());
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
      console.error('Network request failed:', err.response?.data);
      alert(err.response?.data?.message || 'Error saving article data.');
    }
  };

  const handleToggleStatus = async (row) => {
    try {
      const formData = new FormData();

      formData.append('id', row.id || '');
      formData.append('title', row.title || '');
      formData.append('name', row.name || '');
      formData.append('desc', row.desc || '');
      formData.append('author', row.author || '');
      formData.append('userId', row.userId || '');
      formData.append('status', row.status === 'active' ? 'archived' : 'active');
      formData.append('color', row.color || 'bg-zinc-500');
      formData.append('content', Array.isArray(row.content) ? row.content.join('\n\n') : row.content || '');
      formData.append('image', row.imageUrl || '');

      await articleService.updateArticle(row._id, formData);
      await loadArticles(true);
    } catch (err) {
      console.error('Failed to alter record status scope:', err);
    }
  };

  const handleOpenDeleteConfirmation = (row) => {
    setArticleToDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setArticleToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!articleToDelete) return;

    try {
      await articleService.deleteArticle(articleToDelete._id);
      await loadArticles(true);
      handleCloseDeleteDialog();
    } catch (err) {
      alert('Error hard deleting archive record entry.');
    }
  };

const handleEditOpen = async (row) => {
  try {
    setSelectedId(row._id);
    setSelectedFile(null);

    const res = await articleService.fetchArticleByName(row.name);
    const fullArticle = res.data;

    setForm({
      id: fullArticle.id || '',
      title: fullArticle.title || '',
      name: fullArticle.name || '',
      desc: fullArticle.desc || '',
      author: fullArticle.author || '',
      userId: fullArticle.userId || '',
      status: fullArticle.status || 'active',
      image: fullArticle.imageUrl || '',
      color: fullArticle.color || 'bg-zinc-500',
      content: Array.isArray(fullArticle.content)
        ? fullArticle.content.join('\n\n')
        : fullArticle.content || ''
    });

    setOpen(true);
  } catch (err) {
    console.error('Error loading full article for editing:', err);
    alert('Unable to load full article content.');
  }
};

  const activeIdentity = getActiveUserIdentity();

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    {
      field: 'image',
      headerName: 'MEDIA PREVIEW',
      width: 130,
      renderCell: (p) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <img
            src={renderArticleImage(p.row)}
            alt="article asset"
            style={{
              width: '45px',
              height: '30px',
              objectFit: 'cover',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          />
        </Box>
      )
    },
    {
      field: 'name',
      headerName: 'SLUG',
      width: 140,
      renderCell: (p) => (
        <span style={{ fontFamily: 'monospace', color: '#666' }}>{p.value}</span>
      )
    },
    {
      field: 'title',
      headerName: 'TITLE',
      flex: 1,
      renderCell: (p) => <strong style={{ color: '#1A1A1A' }}>{p.value}</strong>
    },
    { field: 'desc', headerName: 'PREVIEW', width: 160 },
    {
      field: 'status',
      headerName: 'STATUS',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={String(params.value || '').toUpperCase()}
          sx={{
            fontWeight: 'bold',
            borderRadius: '4px',
            bgcolor: params.value === 'active' ? '#4dad5b' : '#71717a',
            color: '#fff'
          }}
        />
      )
    },
    {
      field: 'actions',
      headerName: 'ACTIONS',
      width: 240,
      renderCell: (p) => (
        <Stack direction="row" spacing={1} sx={{ height: '100%', alignItems: 'center' }}>
          <Button
            size="small"
            variant="contained"
            sx={{
              bgcolor: '#1A1A1A',
              '&:hover': { bgcolor: '#ffcb05', color: '#000' }
            }}
            onClick={() => handleEditOpen(p.row)}
          >
            Edit
          </Button>

          <Button
            size="small"
            variant="outlined"
            color={p.row.status === 'active' ? 'error' : 'success'}
            onClick={() => handleToggleStatus(p.row)}
          >
            {p.row.status === 'active' ? 'Archive' : 'Activate'}
          </Button>

          <IconButton
            color="error"
            size="small"
            onClick={() => handleOpenDeleteConfirmation(p.row)}
            sx={{
              border: '1px solid #ef4444',
              borderRadius: '4px',
              p: '5px',
              '&:hover': { bgcolor: '#fee2e2' }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, fontStyle: 'italic', letterSpacing: -1 }}>
          ROTOM <span style={{ color: '#cc0000' }}>ARCHIVES</span>
        </Typography>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            disabled={isRefreshing}
            onClick={() => loadArticles(true)}
            sx={{
              color: '#1A1A1A',
              border: '2px solid #000',
              fontWeight: 'bold',
              bgcolor: '#fff',
              '&:hover': { bgcolor: '#f3f4f6', border: '2px solid #000' }
            }}
          >
            {isRefreshing ? 'REFRESHING...' : 'REFRESH'}
          </Button>

          <Button
            variant="contained"
            sx={{
              bgcolor: '#cc0000',
              fontWeight: 'bold',
              border: '2px solid #000',
              boxShadow: '4px 4px 0px #000',
              '&:hover': { bgcolor: '#b30000' }
            }}
            onClick={openCreateModal}
          >
            NEW ENTRY
          </Button>
        </Stack>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Search Title, Author, or Slug..."
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Status Filter</InputLabel>
          <Select
            value={statusFilter}
            label="Status Filter"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="active">Active Only</MenuItem>
            <MenuItem value="archived">Archived Only</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Paper
        sx={{
          height: 600,
          border: '4px solid #1A1A1A',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '8px 8px 0px rgba(0,0,0,0.1)'
        }}
      >
        <DataGrid
          rows={filteredArticles}
          columns={columns}
          getRowId={(r) => r._id}
          disableRowSelectionOnClick
          keepNonExistentRowsSelected
          sx={{
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#f3f4f6',
              fontWeight: 'black'
            }
          }}
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 900, bgcolor: '#1A1A1A', color: '#fff' }}>
            {selectedId ? 'EDIT ARCHIVE LOG' : 'CREATE NEW ARCHIVE LOG'}
          </DialogTitle>

          <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
           <Stack direction="row" spacing={2}>
             {selectedId && (
              <TextField
              label="Log ID"
              variant="outlined"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              required
              sx={{ width: '30%' }}
            />
             )}

             <TextField
               label="Title"
                fullWidth
               variant="outlined"
               value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
             required
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Slug String (Leave empty to auto-generate)"
                fullWidth
                variant="outlined"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                helperText="URL direct string format without spaces"
              />

              <TextField
                label={selectedId ? 'Author' : 'Author Auto-Detected'}
                fullWidth
                variant="outlined"
                value={selectedId ? form.author : activeIdentity.activeUsername}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                required
                disabled={!selectedId}
                helperText={
                  selectedId
                    ? 'Editing existing archive author metadata'
                    : 'Author will be taken from the logged-in admin/editor account'
                }
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Status"
                select
                sx={{ width: '50%' }}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </TextField>

              <TextField
                label="Accent Color Block"
                select
                fullWidth
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              >
                {COLOR_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '4px',
                          border: '1px solid #aaa'
                        }}
                        className={option.value}
                      />
                      <span>{option.label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Divider sx={{ my: 1 }}>
              <Chip label="ARTICLE COVER MEDIA SOURCE" size="small" sx={{ fontWeight: 'bold' }} />
            </Divider>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">
              <Box
                sx={{
                  flex: 1,
                  border: '2px dashed #ccc',
                  p: 2,
                  borderRadius: '8px',
                  textAlign: 'center',
                  bgcolor: selectedFile ? '#f0fdf4' : '#fafafa',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 100
                }}
              >
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="contained-button-file"
                  type="file"
                  onChange={handleFileChange}
                  disabled={!!form.image.trim() && !selectedFile}
                />

                <Box>
                  <label htmlFor="contained-button-file">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUploadIcon />}
                      disabled={!!form.image.trim() && !selectedFile}
                      sx={{
                        color: '#1A1A1A',
                        borderColor: '#1A1A1A',
                        mb: 1
                      }}
                    >
                      Upload File
                    </Button>
                  </label>

                  <Typography variant="caption" display="block" color="textSecondary" sx={{ px: 1 }}>
                    {selectedFile ? `File: ${selectedFile.name}` : 'Pick local file asset'}
                  </Typography>

                  {selectedFile && (
                    <IconButton size="small" color="error" onClick={handleClearFile} sx={{ mt: 0.5 }}>
                      <ClearIcon fontSize="small" />
                      <span style={{ fontSize: '10px', fontWeight: 'bold' }}>CLEAR</span>
                    </IconButton>
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#999' }}>
                  — OR —
                </Typography>
              </Box>

              <Box sx={{ flex: 1.5, display: 'flex', alignItems: 'center' }}>
                <TextField
                  label="Direct Image URL String"
                  fullWidth
                  variant="outlined"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  disabled={!!selectedFile}
                  placeholder="https://example.com/image.png"
                  helperText={
                    selectedFile
                      ? 'Clear uploaded file path above to input web url reference link text'
                      : 'Paste an absolute network layout hotlink track path'
                  }
                />
              </Box>
            </Stack>

            <Divider sx={{ my: 1 }} />

            <TextField
              label="Preview Description"
              fullWidth
              multiline
              rows={2}
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
              required
            />

            <TextField
              label="Content Blocks (Separate paragraphs using a double line break [Enter x2])"
              fullWidth
              multiline
              rows={6}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
            />
          </DialogContent>

          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleClose} sx={{ color: '#666' }}>
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: '#ffcb05',
                color: '#000',
                fontWeight: 'bold',
                border: '2px solid #000'
              }}
            >
              COMMIT TRANSACTION
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle sx={{ fontWeight: 900, bgcolor: '#cc0000', color: '#fff' }}>
          CONFIRM RECORD PURGE
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ color: '#1a1a1a', fontWeight: 'bold' }}>
            Are you sure you want to permanently delete "{articleToDelete?.title}"? This transaction cannot be undone.
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeleteDialog} sx={{ color: '#666', fontWeight: 'bold' }}>
            CANCEL
          </Button>

          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            sx={{
              fontWeight: 'bold',
              border: '2px solid #000',
              boxShadow: '2px 2px 0px #000'
            }}
          >
            DELETE FOREVER
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DashArticleListPage;