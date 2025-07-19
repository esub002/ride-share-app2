import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  LinearProgress,
  Button,
  FormControl,
  Select,
  MenuItem,
  TextField,
  InputLabel
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  LocalShipping as ShippingIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Star as StarIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import axios from 'axios';

function Analytics() {
  const [analyticsData, setAnalyticsData] = useState({
    revenue: {
      daily: [1200, 1400, 1600, 1800, 2000, 2200, 2400],
      weekly: [8000, 9000, 10000, 11000, 12000, 13000, 14000],
      monthly: [35000, 40000, 45000, 50000, 55000, 60000]
    },
    rides: {
      completed: 1250,
      cancelled: 45,
      active: 23,
      total: 1318
    },
    drivers: {
      total: 156,
      active: 142,
      inactive: 14,
      newThisMonth: 23
    },
    riders: {
      total: 892,
      active: 756,
      inactive: 136,
      newThisMonth: 67
    },
    ratings: {
      average: 4.6,
      distribution: {
        '5': 65,
        '4': 25,
        '3': 8,
        '2': 2,
        '1': 0
      }
    }
  });

  const [timeRange, setTimeRange] = useState('weekly');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // In a real app, you'd fetch this from your backend
      // const response = await axios.get(`/api/admin/analytics?range=${timeRange}`);
      // setAnalyticsData(response.data);
      
      // For now, we'll use mock data
      setTimeout(() => setLoading(false), 1000);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, trend, subtitle }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
        {trend && (
          <Box display="flex" alignItems="center" mt={1}>
            {trend > 0 ? <TrendingUpIcon color="success" /> : <TrendingDownIcon color="error" />}
            <Typography variant="body2" color="textSecondary" ml={0.5}>
              {Math.abs(trend)}% from last period
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const ProgressCard = ({ title, value, total, color, icon }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: `${color}.main`, mr: 2 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" color="textSecondary">
              {value} of {total}
            </Typography>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={(value / total) * 100}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </CardContent>
    </Card>
  );

  const RevenueChart = () => (
    <Card>
      <CardHeader title="Revenue Trends" />
      <CardContent>
        <Box height={300} display="flex" alignItems="center" justifyContent="center">
          <Typography variant="h6" color="textSecondary">
            Chart Component - Revenue over {timeRange}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  const TopDrivers = () => (
    <Card>
      <CardHeader title="Top Performing Drivers" />
      <CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Driver</TableCell>
                <TableCell>Rides</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Earnings</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                { name: 'John Driver', rides: 45, rating: 4.9, earnings: 1250 },
                { name: 'Jane Smith', rides: 42, rating: 4.8, earnings: 1180 },
                { name: 'Mike Johnson', rides: 38, rating: 4.7, earnings: 1050 },
                { name: 'Sarah Wilson', rides: 35, rating: 4.6, earnings: 980 },
                { name: 'David Brown', rides: 32, rating: 4.5, earnings: 890 }
              ].map((driver, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2 }}>
                        {driver.name.charAt(0)}
                      </Avatar>
                      {driver.name}
                    </Box>
                  </TableCell>
                  <TableCell>{driver.rides}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <StarIcon sx={{ color: 'gold', fontSize: 16, mr: 0.5 }} />
                      {driver.rating}
                    </Box>
                  </TableCell>
                  <TableCell>${driver.earnings}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const RatingDistribution = () => (
    <Card>
      <CardHeader title="Rating Distribution" />
      <CardContent>
        {Object.entries(analyticsData.ratings.distribution).map(([rating, percentage]) => (
          <Box key={rating} mb={2}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2">
                {rating} Stars
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {percentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={percentage}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Analytics Dashboard</Typography>
          <FormControl size="small">
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Key Metrics */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Revenue"
              value={`$${analyticsData.revenue.weekly[analyticsData.revenue.weekly.length - 1]}`}
              icon={<MoneyIcon />}
              color="success"
              trend={12}
              subtitle={`${timeRange} total`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Completed Rides"
              value={analyticsData.rides.completed}
              icon={<ShippingIcon />}
              color="primary"
              trend={8}
              subtitle={`${analyticsData.rides.active} active`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Drivers"
              value={analyticsData.drivers.active}
              icon={<CarIcon />}
              color="secondary"
              trend={15}
              subtitle={`${analyticsData.drivers.newThisMonth} new this month`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Average Rating"
              value={analyticsData.ratings.average}
              icon={<StarIcon />}
              color="warning"
              trend={2}
              subtitle="Platform average"
            />
          </Grid>
        </Grid>

        {/* Progress Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={4}>
            <ProgressCard
              title="Driver Utilization"
              value={analyticsData.drivers.active}
              total={analyticsData.drivers.total}
              color="primary"
              icon={<CarIcon />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <ProgressCard
              title="Rider Engagement"
              value={analyticsData.riders.active}
              total={analyticsData.riders.total}
              color="secondary"
              icon={<PersonIcon />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <ProgressCard
              title="Ride Completion Rate"
              value={analyticsData.rides.completed}
              total={analyticsData.rides.total}
              color="success"
              icon={<ShippingIcon />}
            />
          </Grid>
        </Grid>

        {/* Charts and Tables */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <RevenueChart />
          </Grid>
          <Grid item xs={12} md={4}>
            <RatingDistribution />
          </Grid>
          <Grid item xs={12}>
            <TopDrivers />
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default Analytics; 