import React, { useRef } from 'react';
import {
  Typography,
  Box,
  Paper,
  Stack,
  Button
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';

const reportData = {
  quarterlyEngagement: {
    xAxis: ['Q1', 'Q2', 'Q3', 'Q4'],
    series: [
      { data: [2400, 1398, 9800, 3908], label: 'Total Views', color: '#ff1c1c' },
      { data: [4000, 3000, 2000, 2780], label: 'Shares', color: '#00E5FF' },
    ]
  },
  userDistribution: [
    { id: 0, value: 10, label: 'Admins', color: '#1A1A1A' },
    { id: 1, value: 100, label: 'Trainers', color: '#ff1c1c' },
    { id: 2, value: 20, label: 'Professors', color: '#00E5FF' },
  ],
  monthlyVolume: {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    posts: [4, 6, 12, 8, 5, 10]
  },
  contentPerformance: {
    categories: ['Video', 'Articles', 'News', 'Guides'],
    values: [85, 45, 60, 95]
  }
};

function ReportsPage() {
  const printRef = useRef(null);

  const CARD_HEIGHT = 420;

  const paperStyle = {
    p: 3,
    height: CARD_HEIGHT,
    borderRadius: 2,
    border: '2px solid #1A1A1A',
    boxShadow: '4px 4px 0px #000',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };

  const chartContainer = {
    flexGrow: 1,
    width: '100%',
    minHeight: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const win = window.open('', '_blank', 'width=1200,height=900');
    if (!win) return;

    const styles = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]')
    )
      .map((node) => node.outerHTML)
      .join('');

    const date = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date());

    win.document.write(`
      <html>
        <head>
          <title>Report</title>
          ${styles}
          <style>
            body { font-family: Arial; padding: 20px; }
            .card { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h2>Analytics & Reports</h2>
          <p>Generated on ${date}</p>
          ${content.outerHTML}
        </body>
      </html>
    `);

    win.document.close();
    win.focus();
    win.print();
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

  return (
    <Box sx={{ p: 3, bgcolor: '#f0f0f0', minHeight: '100vh' }}>

      {/* HEADER */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, fontStyle: 'italic' }}>
            ANALYTICS <span style={{ color: '#cc0000' }}>& REPORTS</span>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overview of engagement, distribution, and content performance.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} flexWrap="wrap">
         <Button sx={primaryButton}>Generate</Button>
         <Button sx={primaryButton} onClick={handlePrint}>Export</Button>
         <Button sx={primaryButton}>Filter</Button>
        </Stack>
      </Stack>

      {/* CONTENT */}
      <Stack spacing={3} ref={printRef}>

        {/* CARD 1 */}
        <Paper sx={paperStyle}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            QUARTERLY VIEWS
          </Typography>

          <Box sx={chartContainer}>
            <BarChart
              series={reportData.quarterlyEngagement.series}
              xAxis={[{ data: reportData.quarterlyEngagement.xAxis, scaleType: 'band' }]}
              height={260}
              width={undefined}
            />
          </Box>
        </Paper>

        {/* CARD 2 */}
        <Paper sx={paperStyle}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            USER ROLES
          </Typography>

          <Box sx={chartContainer}>
            <PieChart
              series={[{
                data: reportData.userDistribution,
                innerRadius: 50,
                outerRadius: 90,
              }]}
              height={260}
              width={undefined}
            />
          </Box>
        </Paper>

        {/* CARD 3 */}
        <Paper sx={paperStyle}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            MONTHLY POSTS (2026)
          </Typography>

          <Box sx={chartContainer}>
            <BarChart
              xAxis={[{ scaleType: 'band', data: reportData.monthlyVolume.months }]}
              series={[{ data: reportData.monthlyVolume.posts, label: 'Articles', color: '#1A1A1A' }]}
              height={260}
              width={undefined}
            />
          </Box>
        </Paper>

        {/* CARD 4 */}
        <Paper sx={paperStyle}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            CONTENT SCORE
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
            Average engagement rating per category
          </Typography>

          <Box sx={chartContainer}>
            <BarChart
              layout="horizontal"
              yAxis={[{ scaleType: 'band', data: reportData.contentPerformance.categories }]}
              series={[{ data: reportData.contentPerformance.values, color: '#cc0000' }]}
              height={260}
              width={undefined}
            />
          </Box>
        </Paper>

      </Stack>
    </Box>
  );
}

export default ReportsPage;