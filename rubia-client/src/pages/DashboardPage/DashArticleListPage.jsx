import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Button, Stack, Dialog, DialogTitle, 
  DialogContent, TextField, DialogActions, MenuItem, Chip, 
  Select, FormControl, InputLabel, IconButton, DialogContentText, Divider 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ClearIcon from '@mui/icons-material/Clear';
import { DataGrid } from '@mui/x-data-grid';

import * as articleService from '../../services/ArticleService';

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

function DashArticleListPage() {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [form, setForm] = useState({ 
    id: '', title: '', name: '', desc: '', content: '', author: '', status: 'active', image: '', color: 'bg-zinc-500' 
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);

  useEffect(() => { loadArticles(); }, []);

  useEffect(() => {
    let result = articles;
    if (statusFilter !== 'all') result = result.filter(a => a.status === statusFilter);
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.title.toLowerCase().includes(query) || 
        a.author.toLowerCase().includes(query) ||
        a.name.toLowerCase().includes(query)
      );
    }
    setFilteredArticles(result);
  }, [articles, searchQuery, statusFilter]);

  const loadArticles = async () => {
    try {
      const res = await articleService.fetchArticles();
      setArticles(res.data);
    } catch (err) { 
      console.error("Error fetching articles:", err); 
    }
  };

  const renderArticleImage = (row) => {
    if (row.imageBuffer && row.imageMimeType) {
      const binaryString = typeof row.imageBuffer === 'string' 
        ? row.imageBuffer 
        : btoa(new Uint8Array(row.imageBuffer.data || row.imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
      return `data:${row.imageMimeType};base64,${binaryString}`;
    }
    return row.imageFallbackUrl || 'https://ik.imagekit.io/ytwzizvepv/RotomPC/placeholder.png';
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const calculatedSlug = form.name.trim() !== '' 
      ? form.name.trim().toLowerCase().replace(/\s+/g, '-')
      : form.title.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

    const formData = new FormData();
    formData.append('id', form.id.trim());
    formData.append('title', form.title.trim());
    formData.append('name', calculatedSlug);
    formData.append('desc', form.desc.trim());
    formData.append('author', form.author.trim());
    formData.append('status', form.status);
    formData.append('color', form.color);
    formData.append('content', typeof form.content === 'string' ? form.content : JSON.stringify(form.content));

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
      loadArticles();
      handleClose();
    } catch (err) { 
      console.error("Network request failed:", err.response?.data);
      alert(err.response?.data?.message || "Error saving article data.");
    }
  };

  const handleToggleStatus = async (row) => {
    try {
      const formData = new FormData();
      Object.keys(row).forEach(key => {
        if (key === 'status') {
          formData.append('status', row.status === 'active' ? 'archived' : 'active');
        } else if (key === 'content') {
          formData.append('content', Array.isArray(row.content) ? row.content.join('\n\n') : row.content);
        } else if (key !== 'imageBuffer' && key !== 'imageMimeType') {
          formData.append(key, row[key]);
        }
      });
      await articleService.updateArticle(row._id, formData);
      loadArticles();
    } catch (err) {
      console.error("Failed to alter record status scope:", err);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedId(null);
    setSelectedFile(null);
    setForm({ id: '', title: '', name: '', desc: '', content: '', author: '', status: 'active', image: '', color: 'bg-zinc-500' });
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
      loadArticles();
      handleCloseDeleteDialog();
    } catch (err) {
      alert("Error hard deleting archive record entry.");
    }
  };

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
            style={{ width: '45px', height: '30px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} 
          />
        </Box>
      )
    },
    { field: 'name', headerName: 'SLUG', width: 140, renderCell: (p) => <span style={{ fontFamily: 'monospace', color: '#666' }}>{p.value}</span> },
    { field: 'title', headerName: 'TITLE', flex: 1, renderCell: (p) => <strong style={{ color: '#1A1A1A' }}>{p.value}</strong> },
    { field: 'desc', headerName: 'PREVIEW', width: 160 },
    { 
      field: 'status', 
      headerName: 'STATUS', 
      width: 110,
      renderCell: (params) => (
        <Chip 
          label={params.value.toUpperCase()} 
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
            sx={{ bgcolor: '#1A1A1A', '&:hover': { bgcolor: '#ffcb05', color: '#000' } }}
            onClick={() => { 
              setSelectedId(p.row._id); 
              setForm({
                id: p.row.id || '',
                title: p.row.title || '',
                name: p.row.name || '',
                desc: p.row.desc || '',
                author: p.row.author || '',
                status: p.row.status || 'active',
                image: p.row.imageFallbackUrl || '',
                color: p.row.color || 'bg-zinc-500',
                content: Array.isArray(p.row.content) ? p.row.content.join('\n\n') : p.row.content
              }); 
              setOpen(true); 
            }}
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
            sx={{ border: '1px solid #ef4444', borderRadius: '4px', p: '5px', '&:hover': { bgcolor: '#fee2e2' } }}
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
        <Button 
          variant="contained" 
          sx={{ bgcolor: '#cc0000', fontWeight: 'bold', border: '2px solid #000', boxShadow: '4px 4px 0px #000', '&:hover': { bgcolor: '#b30000' } }}
          onClick={() => {
            setSelectedId(null);
            setOpen(true);
          }}
        >
          NEW ENTRY
        </Button>
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

      <Paper sx={{ height: 600, border: '4px solid #1A1A1A', borderRadius: '12px', overflow: 'hidden', boxShadow: '8px 8px 0px rgba(0,0,0,0.1)' }}>
        <DataGrid 
          rows={filteredArticles} 
          columns={columns} 
          getRowId={(r) => r._id} 
          sx={{ '& .MuiDataGrid-columnHeaders': { bgcolor: '#f3f4f6', fontWeight: 'black' } }}
        />
      </Paper>

      {/* Entry Management Modal */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 900, bgcolor: '#1A1A1A', color: '#fff' }}>
            {selectedId ? 'EDIT ARCHIVE LOG' : 'CREATE NEW ARCHIVE LOG'}
          </DialogTitle>
          <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Stack direction="row" spacing={2}>
              <TextField label="Log ID (e.g. 025)" variant="outlined" value={form.id} onChange={(e) => setForm({...form, id: e.target.value})} required sx={{ width: '30%' }} />
              <TextField label="Title" fullWidth variant="outlined" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Slug String (Leave empty to auto-generate)" fullWidth variant="outlined" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} helperText="URL direct string format without spaces" />
              <TextField label="Author" fullWidth variant="outlined" value={form.author} onChange={(e) => setForm({...form, author: e.target.value})} required />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Status" select sx={{ width: '50%' }} value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </TextField>

              <TextField 
                label="Accent Color Block" 
                select 
                fullWidth 
                value={form.color} 
                onChange={(e) => setForm({...form, color: e.target.value})}
              >
                {COLOR_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 16, height: 16, borderRadius: '4px', border: '1px solid #aaa' }} className={option.value} />
                      <span>{option.label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Divider sx={{ my: 1 }}><Chip label="ARTICLE COVER MEDIA SOURCE" size="small" sx={{ fontWeight: 'bold' }} /></Divider>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">
              {/* Option A: Device File Upload */}
              <Box sx={{ flex: 1, border: '2px dashed #ccc', p: 2, borderRadius: '8px', textAlign: 'center', bgcolor: selectedFile ? '#f0fdf4' : '#fafafa', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 100 }}>
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
                    <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />} disabled={!!form.image.trim() && !selectedFile} sx={{ color: '#1A1A1A', borderColor: '#1A1A1A', mb: 1 }}>
                      Upload File
                    </Button>
                  </label>
                  <Typography variant="caption" display="block" color="textSecondary" sx={{ px: 1 }}>
                    {selectedFile ? `File: ${selectedFile.name}` : "Pick local file asset"}
                  </Typography>
                  {selectedFile && (
                    <IconButton size="small" color="error" onClick={handleClearFile} sx={{ mt: 0.5 }}>
                      <ClearIcon fontSize="small" /> <span style={{ fontSize: '10px', fontWeight: 'bold' }}>CLEAR</span>
                    </IconButton>
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#999' }}>— OR —</Typography>
              </Box>

              {/* Option B: Direct URL Input */}
              <Box sx={{ flex: 1.5, display: 'flex', alignItems: 'center' }}>
                <TextField 
                  label="Direct Image URL String" 
                  fullWidth 
                  variant="outlined"
                  value={form.image} 
                  onChange={(e) => setForm({...form, image: e.target.value})} 
                  disabled={!!selectedFile}
                  placeholder="https://example.com/image.png"
                  helperText={selectedFile ? "Clear uploaded file path above to input web url reference link text" : "Paste an absolute network layout hotlink track path"}
                />
              </Box>
            </Stack>

            <Divider sx={{ my: 1 }} />

            <TextField label="Preview Description" fullWidth multiline rows={2} value={form.desc} onChange={(e) => setForm({...form, desc: e.target.value})} required />
            <TextField label="Content Blocks (Separate paragraphs using a double line break [Enter x2])" fullWidth multiline rows={6} value={form.content} onChange={(e) => setForm({...form, content: e.target.value})} required />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleClose} sx={{ color: '#666' }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#ffcb05', color: '#000', fontWeight: 'bold', border: '2px solid #000' }}>
              COMMIT TRANSACTION
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Purge Confirmation Dialog */}
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
            sx={{ fontWeight: 'bold', border: '2px solid #000', boxShadow: '2px 2px 0px #000' }}
          >
            DELETE FOREVER
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DashArticleListPage;