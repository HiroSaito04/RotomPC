// rubia-client\src\pages\Admin\UsersPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Paper, Button, Stack, Dialog, DialogTitle, DialogContent, 
  TextField, MenuItem, FormControlLabel, Switch, DialogActions, Chip, Select, 
  InputAdornment, IconButton, DialogContentText
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';

// Integrated your custom centralized user service layer
import * as userService from '../../services/UserService';

const roles = ['admin', 'trainer', 'professor', 'editor'];
const genders = ['male', 'female', 'other'];
const blankForm = { 
  firstName: '', lastName: '', age: '', gender: '', 
  contactNumber: '', email: '', role: 'trainer', 
  username: '', password: '', address: 'N/A', isActive: true 
};

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState({ open: false, id: null });
  const [form, setForm] = useState(blankForm);
  const [showPassword, setShowPassword] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState(null); 
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    const userRole = localStorage.getItem('role'); 
    const userId = localStorage.getItem('id'); 
    setCurrentAdminId(userId);

    if (userRole === 'editor') {
      alert("Access Denied: Editors cannot manage users.");
      navigate('/dashboard');
    } else if (userRole === 'trainer') { 
        navigate('/');
    }
    fetchUsersList();
  }, [navigate]); 
  
  const fetchUsersList = async () => {
    try {
      const res = await userService.fetchUsers();
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
      const matchesSearch = 
        fullName.includes(search.toLowerCase()) || 
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.username?.toLowerCase().includes(search.toLowerCase());
      
      const matchesRole = filterRole === 'all' || u.role === filterRole;
      const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? u.isActive : !u.isActive);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, filterRole, filterStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!modal.id && (!form.password || form.password.length < 8)) {
      return alert('Password is required and must be at least 8 characters long for new registrations.');
    }
    if (modal.id && form.password && form.password.length < 8) {
      return alert('The updated character password must be at least 8 characters long.');
    }
    
    if (!/^09\d{9}$/.test(form.contactNumber)) {
      return alert('Contact number must be exactly 11 digits and start with 09.');
    }

    try {
      const payload = { ...form };
      if (modal.id) {
        if (!payload.password || payload.password.trim() === '') {
          delete payload.password;
        }
        await userService.updateUser(modal.id, payload);
      } else {
        await userService.createUser(payload);
      }
      fetchUsersList(); 
      closeModal();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save user configuration updates.");
    }
  };

  const toggleStatus = async (user) => {
    try {
      // Replaced direct execution payload mapping with centralized target update method
      await userService.updateUser(user._id, { isActive: !user.isActive });
      fetchUsersList();
    } catch (err) {
      console.error("Toggle Status Error:", err);
      alert(err.response?.data?.message || "Failed to update account status configuration");
    }
  };

  const handleOpenDeleteConfirmation = (row) => {
    if (row._id === currentAdminId) {
      return alert("Operation Prohibited: You cannot delete your own profile account from this control dashboard.");
    }
    setUserToDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    if (!currentAdminId) {
      return alert("Security Block: Your Admin Identification token is missing from local storage. Please re-login.");
    }

    try {
      // Clean target mapping pointing to the base user deletion service context
      // pass global parameters safely if required by interceptors or manual config blocks
      await userService.deleteUser(userToDelete._id, {
        headers: { 
          'x-user-id': currentAdminId 
        }
      });
      fetchUsersList();
      handleCloseDeleteDialog();
    } catch (err) {
      alert(err.response?.data?.message || "Error permanently removing user profile registry.");
    }
  };

  const buttonStyle = {
    fontWeight: 700,
    borderRadius: 2,
    textTransform: 'none',
    border: '2px solid #1A1A1A',
    boxShadow: '3px 3px 0px #000',
    px: 2,
    py: 0.8,
    '&:hover': {
      boxShadow: '1px 1px 0px #000',
      transform: 'translate(2px, 2px)',
    },
  };

  const primaryButton = {
    ...buttonStyle,
    bgcolor: '#cc0000',
    color: '#fff',
    '&:hover': {
      bgcolor: '#a30000',
    },
  };

  const openModal = (user = null) => {
    setModal({ open: true, id: user?._id || null });
    setForm(user ? { ...user, password: '' } : { ...blankForm });
  };

  const closeModal = () => {
    setModal({ open: false, id: null });
    setShowPassword(false);
  };

  const columns = [
    { field: 'firstName', headerName: 'First Name', flex: 1 },
    { field: 'lastName', headerName: 'Last Name', flex: 1 },
    { field: 'username', headerName: 'Username', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1.2 },
    { field: 'role', headerName: 'Role', width: 110, renderCell: (p) => (
      <Typography sx={{ textTransform: 'capitalize', fontSize: '0.875rem', mt: 1.5 }}>{p.value}</Typography>
    )},
    { field: 'isActive', headerName: 'Status', width: 110, renderCell: (p) => (
      <Chip sx={{ mt: 1 }} size="small" label={p.value ? 'Active' : 'Inactive'} color={p.value ? 'success' : 'default'} />
    )},
    { field: 'actions', headerName: 'Actions', width: 240, sortable: false, renderCell: (p) => (
      <Stack direction="row" spacing={1} sx={{ height: '100%', alignItems: 'center' }}>
        <Button size="small" variant="outlined" onClick={() => openModal(p.row)}>Edit</Button>
        <Button 
          size="small" 
          variant="contained" 
          color={p.row.isActive ? 'warning' : 'success'} 
          disabled={p.row._id === currentAdminId} 
          onClick={() => toggleStatus(p.row)}
        >
          {p.row.isActive ? 'Disable' : 'Enable'}
        </Button>
        
        <IconButton 
          color="error" 
          size="small"
          disabled={p.row._id === currentAdminId}
          onClick={() => handleOpenDeleteConfirmation(p.row)}
          sx={{ 
            border: '1px solid #ef4444', 
            borderRadius: '4px', 
            p: '5px', 
            '&:hover': { bgcolor: '#fee2e2' },
            '&:disabled': { border: '1px solid #d1d5db', color: '#9ca3af' }
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Stack>
    )}
  ];

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>
          USER <span style={{ color: '#cc0000' }}>MANAGEMENT</span>
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField 
          fullWidth 
          label="Search by Name, Email, or Username" 
          onChange={(e) => setSearch(e.target.value)} 
          sx={{ bgcolor: '#fff', borderRadius: 1 }} 
        />
        <Select 
          value={filterRole} 
          onChange={(e) => setFilterRole(e.target.value)} 
          sx={{ minWidth: 160, bgcolor: '#fff' }}
        >
          <MenuItem value="all">All Roles</MenuItem>
          {roles.map(r => <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r}</MenuItem>)}
        </Select>
        <Select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)} 
          sx={{ minWidth: 160, bgcolor: '#fff' }}
        >
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </Select>
        <Button 
          variant="contained" 
          onClick={() => openModal()} 
          sx={primaryButton}
        >
          Add User
        </Button>
      </Stack>

      <Paper sx={{ height: 600, width: '100%', border: '2px solid #1A1A1A', boxShadow: '4px 4px 0px #000' }}>
        <DataGrid 
          rows={filteredUsers} 
          columns={columns} 
          getRowId={(row) => row._id} 
          disableRowSelectionOnClick 
        />
      </Paper>

      <Dialog open={modal.open} onClose={closeModal} fullWidth maxWidth="sm">
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 900, bgcolor: '#1a1a1a', color: '#fff' }}>
            {modal.id ? 'EDIT USER PROFILE' : 'REGISTER NEW USER'}
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack direction="row" spacing={2}>
                <TextField label="First Name" fullWidth value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required />
                <TextField label="Last Name" fullWidth value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required />
              </Stack>
              <TextField label="Username" fullWidth value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
              <TextField label="Email" type="email" fullWidth value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              
              <Stack direction="row" spacing={2}>
                <TextField label="Contact (11 digits)" fullWidth value={form.contactNumber} onChange={e => setForm({...form, contactNumber: e.target.value})} required />
                <TextField label="Age" type="number" fullWidth value={form.age} onChange={e => setForm({...form, age: e.target.value})} required />
              </Stack>

              <Stack direction="row" spacing={2}>
                <TextField select label="Gender" fullWidth value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} required>
                  {genders.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </TextField>
                <TextField select label="Role" fullWidth value={form.role} onChange={e => setForm({...form, role: e.target.value})} required>
                  {roles.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
              </Stack>

              <TextField label="Address" fullWidth value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              
              <TextField 
                type={showPassword ? 'text' : 'password'} 
                label={modal.id ? "Change Password (Leave blank to keep old password)" : "Password"} 
                fullWidth 
                value={form.password || ''} 
                onChange={e => setForm({...form, password: e.target.value})} 
                required={!modal.id}
                InputProps={{ 
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ) 
                }}
              />
              
              <FormControlLabel 
                control={<Switch checked={form.isActive} disabled={modal.id === currentAdminId} onChange={e => setForm({...form, isActive: e.target.checked})} color="error" />} 
                label={form.isActive ? "Account is Active" : "Account is Inactive"} 
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={closeModal} sx={{ color: '#666' }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#cc0000', px: 4 }}>
              {modal.id ? 'Update User' : 'Create User'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle sx={{ fontWeight: 900, bgcolor: '#cc0000', color: '#fff' }}>
          PERMANENT PROFILE PURGE
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ color: '#1a1a1a', fontWeight: 'bold' }}>
            Are you sure you want to completely delete the user profile for "{userToDelete?.firstName} {userToDelete?.lastName}" ({userToDelete?.username})? This operation wipes their dataset and cannot be reversed.
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
            CONFIRM WIPE
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UsersPage;