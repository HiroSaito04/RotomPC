// rubia-client\src\pages\Dashboard\DashboardPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Box, Paper, Grid, CircularProgress } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { DataGrid } from '@mui/x-data-grid';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Importing your centralized user service layer
import * as userService from '../../services/UserService';

const trainerColumns = [
  { field: '_id', headerName: 'ID', width: 220 },
  {
    field: 'fullName',
    headerName: 'Full Name',
    width: 200,
    valueGetter: (value, row) => `${row.firstName || ''} ${row.lastName || ''}`,
  },
  { field: 'firstName', headerName: 'First Name', width: 130 },
  { field: 'lastName', headerName: 'Last Name', width: 130 },
  { field: 'age', headerName: 'Age', type: 'number', width: 80 },
  { field: 'gender', headerName: 'Gender', width: 100 },
  { field: 'contactNumber', headerName: 'Contact Number', width: 160 },
  { field: 'email', headerName: 'Email', width: 200 },
];

function DashboardPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const mapCoords = [14.604253, 120.994314];
  const mapLabel = "RotomPC Command Center";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await userService.fetchUsers();
        setUsers(res.data.users || []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const totalUsers = users.length;
  
  const totalTrainers = useMemo(() => {
    return users.filter(u => u.role === 'trainer').length;
  }, [users]);

  const trainersOnlyRows = useMemo(() => {
    return users.filter(u => u.role === 'trainer');
  }, [users]);

  const averageAge = useMemo(() => {
    const validAges = users.filter(u => u.age && !isNaN(u.age)).map(u => Number(u.age));
    return validAges.length > 0 
      ? (validAges.reduce((a, b) => a + b, 0) / validAges.length).toFixed(1)
      : 0;
  }, [users]);

  const userDistribution = useMemo(() => {
    const counts = users.reduce((acc, user) => {
      const role = user.role || 'unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    const colors = { admin: '#1A1A1A', trainer: '#ff1c1c', professor: '#00E5FF', editor: '#FFB300' };

    return Object.keys(counts).map((role, index) => ({
      id: index,
      value: counts[role],
      label: role.charAt(0).toUpperCase() + role.slice(1) + 's',
      color: colors[role] || '#666'
    }));
  }, [users]);

  const PAPER_STYLE = {
    p: 3,
    border: '2px solid #1A1A1A',
    boxShadow: '4px 4px 0px #000',
    borderRadius: 2,
    bgcolor: '#fff'
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: '#cc0000' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 4, fontStyle: 'italic', textTransform: 'uppercase' }}>
        DASHBOARD <span style={{ color: '#cc0000' }}>OVERVIEW</span>
      </Typography>

      {/* 1. Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={PAPER_STYLE}>
            <Typography variant="overline" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Total Users</Typography>
            <Typography variant="h3" sx={{ fontWeight: 900 }}>{totalUsers}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={PAPER_STYLE}>
            <Typography variant="overline" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Total Trainers</Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#ff1c1c' }}>{totalTrainers}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={PAPER_STYLE}>
            <Typography variant="overline" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Average User Age</Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#cc0000' }}>{averageAge}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* 2. Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={7}>
          <Paper sx={PAPER_STYLE}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>MONTHLY POSTS (2026)</Typography>
            <Box sx={{ width: '100%' }}>
              <BarChart
                xAxis={[{ scaleType: 'band', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] }]}
                series={[{ data: [4, 6, 12, 8, 5, 10], label: 'Articles', color: '#1A1A1A' }]}
                height={300}
                width={600}
                margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={5}>
          <Paper sx={{ ...PAPER_STYLE, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', width: '100%', mb: 2 }}>USER ROLES</Typography>
            <PieChart
              series={[{
                data: userDistribution,
                innerRadius: 50,
                paddingAngle: 5,
              }]}
              height={300}
              width={400}
              margin={{ right: 20, left: 20 }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* 3. DataGrid Section */}
      <Paper sx={{ ...PAPER_STYLE, mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>TRAINERS OVERVIEW</Typography>
        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={trainersOnlyRows}
            columns={trainerColumns}
            getRowId={(row) => row._id}
            initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
            pageSizeOptions={[5]}
            disableRowSelectionOnClick
            sx={{ border: 'none' }}
          />
        </Box>
      </Paper>

      {/* 4. Map Section */}
      <Paper sx={{ ...PAPER_STYLE, overflow: 'hidden' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>REGIONAL SCANNER (GPS)</Typography>
        <Box sx={{ height: 400, width: '100%', borderRadius: 1, overflow: 'hidden', border: '1px solid #ddd' }}>
          <MapContainer 
            center={mapCoords} 
            zoom={15} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <Marker position={mapCoords}>
              <Popup>
                <strong>{mapLabel}</strong> <br /> 
                National University - Manila
              </Popup>
            </Marker>
          </MapContainer>
        </Box>
      </Paper>
    </Box>
  );
}

export default DashboardPage;