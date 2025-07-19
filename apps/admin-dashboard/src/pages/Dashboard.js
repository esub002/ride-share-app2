import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Chip,
  Avatar,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  People as PeopleIcon,
  DirectionsCar as CarIcon,
  Refresh as RefreshIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export default function Dashboard() {
  const [drivers, setDrivers] = useState([]);
  const [rideRequests, setRideRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, online, offline
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverDetailsOpen, setDriverDetailsOpen] = useState(false);
  const [stats, setStats] = useState({
    totalDrivers: 0,
    onlineDrivers: 0,
    activeRides: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch drivers data
      const driversResponse = await axios.get(`${API_BASE_URL}/drivers/debug/data`, {
        headers: { 'Authorization': 'Bearer admin-token' } // Mock admin token
      });
      
      // Fetch ride requests
      const ridesResponse = await axios.get(`${API_BASE_URL}/rides/debug/all`, {
        headers: { 'Authorization': 'Bearer admin-token' }
      });

      // Process drivers data
      const driversData = driversResponse.data || [];
      const processedDrivers = Object.entries(driversData).map(([driverId, data]) => ({
        id: driverId,
        name: data.driverData?.name || 'Unknown Driver',
        email: data.driverData?.email || 'No email',
        phone: data.driverData?.phone || 'No phone',
        car: data.driverData?.car || 'Unknown vehicle',
        rating: data.driverData?.rating || 0,
        totalRides: data.driverData?.totalRides || 0,
        totalEarnings: data.driverData?.totalEarnings || 0,
        available: data.driverData?.available || false,
        location: data.locationData,
        earnings: data.earningsData,
        stats: data.driverStats,
        lastActive: data.locationData?.timestamp || new Date().toISOString()
      }));

      setDrivers(processedDrivers);
      setRideRequests(ridesResponse.data?.rideRequests || []);

      // Calculate stats
      const onlineDrivers = processedDrivers.filter(d => d.available).length;
      const activeRides = ridesResponse.data?.rideRequests?.filter(r => r.status === 'active').length || 0;
      const totalEarnings = processedDrivers.reduce((sum, d) => sum + (d.totalEarnings || 0), 0);

      setStats({
        totalDrivers: processedDrivers.length,
        onlineDrivers,
        activeRides,
        totalEarnings
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Using mock data for demo.');
      
      // Fallback to mock data
      const mockDrivers = [
        {
          id: 1,
          name: 'John Driver',
          email: 'john.driver@example.com',
          phone: '+1234567890',
          car: 'Toyota Prius 2020',
          rating: 4.8,
          totalRides: 1250,
          totalEarnings: 15420.50,
          available: true,
          location: {
            latitude: 41.9090653,
            longitude: -87.8528217,
            timestamp: new Date().toISOString()
          },
          earnings: {
            today: 125.50,
            week: 875.25,
            month: 3240.75,
            total: 15420.50
          },
          stats: {
            totalRides: 1250,
            rating: 4.8,
            onlineHours: 156,
            acceptanceRate: 94.5
          },
          lastActive: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Sarah Wilson',
          email: 'sarah.wilson@example.com',
          phone: '+1234567891',
          car: 'Honda Civic 2021',
          rating: 4.9,
          totalRides: 980,
          totalEarnings: 12850.75,
          available: false,
          location: null,
          earnings: {
            today: 0,
            week: 0,
            month: 0,
            total: 12850.75
          },
          stats: {
            totalRides: 980,
            rating: 4.9,
            onlineHours: 142,
            acceptanceRate: 96.2
          },
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        }
      ];

      setDrivers(mockDrivers);
      setStats({
        totalDrivers: mockDrivers.length,
        onlineDrivers: mockDrivers.filter(d => d.available).length,
        activeRides: 2,
        totalEarnings: mockDrivers.reduce((sum, d) => sum + d.totalEarnings, 0)
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'online') return matchesSearch && driver.available;
    if (filter === 'offline') return matchesSearch && !driver.available;
    return matchesSearch;
  });

  const handleDriverClick = (driver) => {
    setSelectedDriver(driver);
    setDriverDetailsOpen(true);
  };

  const getStatusColor = (available) => {
    return available ? 'success' : 'default';
  };

  const getStatusIcon = (available) => {
    return available ? <CheckCircleIcon color="success" /> : <CancelIcon color="disabled" />;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Admin Dashboard
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PeopleIcon color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">{stats.totalDrivers}</Typography>
                    <Typography variant="body2" color="textSecondary">Total Drivers</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">{stats.onlineDrivers}</Typography>
                    <Typography variant="body2" color="textSecondary">Online Drivers</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CarIcon color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">{stats.activeRides}</Typography>
                    <Typography variant="body2" color="textSecondary">Active Rides</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MoneyIcon color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">{formatCurrency(stats.totalEarnings)}</Typography>
                    <Typography variant="body2" color="textSecondary">Total Earnings</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Search */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="Search drivers"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filter}
              label="Status"
              onChange={(e) => setFilter(e.target.value)}
            >
              <MenuItem value="all">All Drivers</MenuItem>
              <MenuItem value="online">Online Only</MenuItem>
              <MenuItem value="offline">Offline Only</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Drivers Table */}
        <Card>
          <CardHeader
            title="Driver Management"
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  {filteredDrivers.length} drivers
                </Typography>
              </Box>
            }
          />
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Driver</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Today's Earnings</TableCell>
                      <TableCell>Total Rides</TableCell>
                      <TableCell>Rating</TableCell>
                      <TableCell>Last Active</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDrivers.map((driver) => (
                      <TableRow key={driver.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2 }}>
                              {driver.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">{driver.name}</Typography>
                              <Typography variant="body2" color="textSecondary">
                                {driver.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(driver.available)}
                            label={driver.available ? 'Online' : 'Offline'}
                            color={getStatusColor(driver.available)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {driver.location ? (
                            <Box>
                              <Typography variant="body2">
                                {driver.location.latitude.toFixed(4)}, {driver.location.longitude.toFixed(4)}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {formatTime(driver.location.timestamp)}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              No location
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" color="primary">
                            {formatCurrency(driver.earnings?.today || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {driver.totalRides}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <StarIcon sx={{ color: 'gold', fontSize: 16, mr: 0.5 }} />
                            <Typography variant="body2">
                              {driver.rating}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatTime(driver.lastActive)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatDate(driver.lastActive)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleDriverClick(driver)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Error Snackbar */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
        >
          <Alert severity="warning" onClose={() => setError('')}>
            {error}
          </Alert>
        </Snackbar>

        {/* Driver Details Dialog */}
        <Dialog
          open={driverDetailsOpen}
          onClose={() => setDriverDetailsOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedDriver && (
            <>
              <DialogTitle>
                Driver Details: {selectedDriver.name}
              </DialogTitle>
              <DialogContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Profile Information</Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">Email</Typography>
                      <Typography variant="body1">{selectedDriver.email}</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">Phone</Typography>
                      <Typography variant="body1">{selectedDriver.phone}</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">Vehicle</Typography>
                      <Typography variant="body1">{selectedDriver.car}</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">Status</Typography>
                      <Chip
                        icon={getStatusIcon(selectedDriver.available)}
                        label={selectedDriver.available ? 'Online' : 'Offline'}
                        color={getStatusColor(selectedDriver.available)}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Earnings</Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">Today</Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(selectedDriver.earnings?.today || 0)}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">This Week</Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(selectedDriver.earnings?.week || 0)}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">This Month</Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(selectedDriver.earnings?.month || 0)}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">Total</Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(selectedDriver.earnings?.total || 0)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Statistics</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {selectedDriver.totalRides}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Total Rides
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {selectedDriver.rating}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Rating
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {selectedDriver.stats?.onlineHours || 0}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Online Hours
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {selectedDriver.stats?.acceptanceRate || 0}%
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Acceptance Rate
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDriverDetailsOpen(false)}>
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Container>
  );
} 