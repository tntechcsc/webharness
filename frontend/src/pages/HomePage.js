import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useContext,
} from 'react';
import '../App'; // Ensure your styles are linked correctly
import Navbar from '../components/Navbar';
import Topbar from '../components/Topbar';
import {
  Box,
  Container,
  Typography,
  Divider,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Pagination,
  ListItemButton,
  TextField,
} from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ThemeContext } from '../context/themecontext';

const baseURL = "http://localhost";

// ------------------- ApplicationSelector ------------------- //
const ApplicationSelector = ({ processes, selectedApp, onSelect }) => {
  return (
    <Box sx={{ border: '1px solid #ddd', borderRadius: '8px', p: 2, mb: 3 }}>
      <Typography variant="subtitle1">Select an Application</Typography>
      <Divider sx={{ my: 1 }} />
      {processes.length === 0 ? (
        <Typography variant="body2" color="textSecondary">
          No processes are running.
        </Typography>
      ) : (
        processes.map((procName) => (
          <ListItemButton
            key={procName}
            selected={selectedApp === procName}
            onClick={() => onSelect(procName)}
          >
            <ListItemText primary={procName} />
          </ListItemButton>
        ))
      )}
    </Box>
  );
};

// ------------------- ResourceUtilizationCharts ------------------- //
const ResourceUtilizationCharts = ({ selectedApp }) => {
  const [dataHistory, setDataHistory] = useState({});
  const theme = useTheme();
  const pendingUpdates = useRef([]);
  const animationRef = useRef();
  const lastUpdateTime = useRef(0);

  // Process updates at 60fps max
  const processUpdates = useCallback(() => {
    const now = performance.now();
    if (now - lastUpdateTime.current < 16) {
      // ~60fps
      animationRef.current = requestAnimationFrame(processUpdates);
      return;
    }

    if (pendingUpdates.current.length === 0) {
      animationRef.current = null;
      return;
    }

    setDataHistory((prev) => {
      const newHistory = { ...prev };
      const updatesToProcess = pendingUpdates.current;
      pendingUpdates.current = [];

      updatesToProcess.forEach(({ updates, timestamp }) => {
        updates.forEach((update) => {
          const { process_name, cpu_usage, memory_gb } = update;
          if (selectedApp && process_name !== selectedApp) return;

          if (!newHistory[process_name]) {
            newHistory[process_name] = [];
          }

          newHistory[process_name].push({
            timestamp,
            cpu_usage,
            memory_gb,
            lastUpdated: timestamp,
          });

          // Keep last 60 points
          if (newHistory[process_name].length > 60) {
            newHistory[process_name].shift();
          }
        });
      });

      return newHistory;
    });

    lastUpdateTime.current = now;
    animationRef.current = requestAnimationFrame(processUpdates);
  }, [selectedApp]);

  useEffect(() => {
    const wsUrl = `ws://localhost:3000/ws/resource_util`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[ResourceUtil] WebSocket connected:', wsUrl);
    };

    ws.onmessage = (event) => {
      try {
        const updates = JSON.parse(event.data);
        pendingUpdates.current.push({
          updates,
          timestamp: Date.now(),
        });

        if (!animationRef.current) {
          animationRef.current = requestAnimationFrame(processUpdates);
        }
      } catch (err) {
        console.error('[ResourceUtil] JSON parse error:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('[ResourceUtil] WebSocket error:', err);
    };

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      ws.close();
    };
  }, [processUpdates, selectedApp]);

  // Prune old data
  useEffect(() => {
    const intervalId = setInterval(() => {
      setDataHistory((prev) => {
        const now = Date.now();
        const pruned = {};
        Object.entries(prev).forEach(([procName, dataPoints]) => {
          const filtered = dataPoints.filter(
            (dp) => now - dp.lastUpdated < 300000 // Keep data points from the last 5 minutes
          );
          if (filtered.length > 0) {
            pruned[procName] = filtered;
          }
        });
        return pruned;
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Memoized chart data builders
  const cpuData = useMemo(() => {
    const chartData = [];
    Object.entries(dataHistory).forEach(([procName, points]) => {
      points.forEach((dp, idx) => {
        if (!chartData[idx]) {
          chartData[idx] = {
            time: new Date(dp.timestamp).toLocaleTimeString(),
          };
        }
        chartData[idx][procName] = dp.cpu_usage;
      });
    });
    return chartData;
  }, [dataHistory]);

  const memData = useMemo(() => {
    const chartData = [];
    Object.entries(dataHistory).forEach(([procName, points]) => {
      points.forEach((dp, idx) => {
        if (!chartData[idx]) {
          chartData[idx] = {
            time: new Date(dp.timestamp).toLocaleTimeString(),
          };
        }
        chartData[idx][procName] = dp.memory_gb;
      });
    });
    return chartData;
  }, [dataHistory]);

  const processNames = Object.keys(dataHistory);

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Resource Utilization{' '}
        {selectedApp ? `for ${selectedApp}` : 'for All Processes'}
      </Typography>

      {/* CPU Usage */}
      <Typography variant="subtitle1">CPU Usage (%)</Typography>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart
          data={cpuData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          throttleDelay={100}
        >
          <XAxis dataKey="time" />
          <YAxis
            label={{ value: 'CPU (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip />
          <Legend />
          {processNames.map((pName) => (
            <Line
              key={pName}
              type="monotone"
              dataKey={pName}
              stroke={theme.palette.secondary.main}
              dot={false}
              isAnimationActive={false}
              animationDuration={0}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Memory Usage */}
      <Typography variant="subtitle1" sx={{ mt: 3 }}>
        Memory Usage (GB)
      </Typography>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart
          data={memData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          throttleDelay={100}
        >
          <XAxis dataKey="time" />
          <YAxis
            label={{ value: 'Memory (GB)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip />
          <Legend />
          {processNames.map((pName) => (
            <Line
              key={pName}
              type="monotone"
              dataKey={pName}
              stroke={theme.palette.secondary.main}
              dot={false}
              isAnimationActive={false}
              animationDuration={0}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

const HomePage = () => {
  const theme = useTheme();
  const { mode } = useContext(ThemeContext);
  const [activeApplications, setActiveApplications] = useState(0);
  const [totalApplications, setTotalApplications] = useState(0);

  // Logs state and totals from backend
  const [recentLogins, setRecentLogins] = useState([]);
  const [recentLoginsTotal, setRecentLoginsTotal] = useState(0);
  const [systemLogs, setSystemLogs] = useState([]);
  const [systemLogsError, setSystemLogsError] = useState('');
  const [recentLoginsError, setRecentLoginsError] = useState('');

  // Pagination state for recent logins and system logs
  const [recentLoginsPage, setRecentLoginsPage] = useState(1);
  const [systemLogsPage, setSystemLogsPage] = useState(1);
  const recentLoginsLimit = 6;
  const systemLogsLimit = 1000;
  const systemLogsPageLimit = 5;

  // Resource Util
  const [selectedApp, setSelectedApp] = useState(null);
  const [availableProcesses, setAvailableProcesses] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setSystemLogsPage(1); // Reset to first page on search
    console.log(filteredLogsTotal);
  };

  const filteredLogs = systemLogs.filter(
    (log) =>
      log.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Object.values(log.data).some((value) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
  );
  const filteredLogsTotal = filteredLogs.length;
  console.log(systemLogs);

  // A single effect that also listens for resource data (just to track process names)
  useEffect(() => {
    const wsUrl = `ws://localhost:3000/ws/resource_util`;
    const ws = new WebSocket(wsUrl);
    let processMap = {};

    ws.onopen = () => {
      console.log('[ProcessList] WebSocket connected:', wsUrl);
    };

    ws.onmessage = (event) => {
      try {
        const updates = JSON.parse(event.data);
        const now = Date.now();
        updates.forEach((u) => {
          processMap[u.process_name] = now;
        });
        // Build new array of active processes
        const newProcs = [];
        Object.entries(processMap).forEach(([pName, ts]) => {
          if (now - ts < 15000) {
            newProcs.push(pName);
          }
        });
        setAvailableProcesses(newProcs);
      } catch (err) {
        console.error('[ProcessList] JSON parse error:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('[ProcessList] WebSocket error:', err);
    };

    // Periodic prune
    const intervalId = setInterval(() => {
      const now = Date.now();
      const newProcs = [];
      Object.entries(processMap).forEach(([pName, ts]) => {
        if (now - ts < 15000) {
          newProcs.push(pName);
        }
      });
      setAvailableProcesses(newProcs);
    }, 5000);

    return () => {
      console.log('[ProcessList] Closing WebSocket');
      clearInterval(intervalId);
      ws.close();
    };
  }, []);

  // ... existing code to fetch total applications, logs, etc.
  useEffect(() => {
    const fetchTotalApplications = async () => {
      try {
        const response = await fetch(`${baseURL}:3000/api/applications`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionStorage.getItem('session_id'), // Include session ID if required
          },
        });

        if (response.ok) {
          const data = await response.json();
          const apps = data.applications || [];
          setTotalApplications(apps.length);
        } else {
          console.error('Failed to fetch total applications');
        }
      } catch (error) {
        console.error('Error fetching total applications:', error);
      }
    };
    fetchTotalApplications();
  }, []);

  // Helper function to fetch logs.
  const fetchLogsFor = async (eventType, page, limit, errorSetter) => {
    const offset = (page - 1) * limit;
    const url = eventType
      ? `${baseURL}:3000/api/system_logs?event_type=${eventType}&offset=${offset}&limit=${limit}`
      : `${baseURL}:3000/api/system_logs?offset=${offset}&limit=${limit}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionStorage.getItem('session_id'),
      },
    });
    if (response.status === 401) {
      errorSetter('You do not have permission to view logs.');
      return { logs: [], total: 0 };
    }
    if (response.ok) {
      const data = await response.json();
      errorSetter('');
      return { logs: data.logs || [], total: data.total || 0 };
    } else {
      console.error(`Failed to fetch logs for ${eventType || 'system logs'}`);
      errorSetter('Failed to fetch logs.');
      return { logs: [], total: 0 };
    }
  };

  // Fetch recent logins when recentLoginsPage changes
  useEffect(() => {
    const fetchRecentLogins = async () => {
      const result = await fetchLogsFor(
        'Login',
        recentLoginsPage,
        recentLoginsLimit,
        setRecentLoginsError
      );
      const { logs, total } = result;
      setRecentLogins(logs);
      setRecentLoginsTotal(total);
    };
    fetchRecentLogins();
  }, [recentLoginsPage]);

  // Fetch system logs when systemLogsPage changes
  useEffect(() => {
    const fetchSystemLogs = async () => {
      const result = await fetchLogsFor(
        null,
        0,
        systemLogsLimit,
        setSystemLogsError
      );
      const { logs, total } = result;
      setSystemLogs(logs);
    };
    fetchSystemLogs();
  }, [systemLogsPage]);

  // WebSocket for active application count
  useEffect(() => {
    const wsUrl = `ws://localhost:3000/ws/process_count`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[ProcessCount] WebSocket connected:', wsUrl);
    };
    ws.onmessage = (event) => {
      const processCount = parseInt(event.data, 10);
      if (!isNaN(processCount)) {
        setActiveApplications(processCount);
      }
    };
    ws.onerror = (error) => console.error('WebSocket error:', error);
    ws.onclose = () => console.log('[ProcessCount] WebSocket closed.');

    return () => {
      ws.close();
    };
  }, []);

  const startIndex = (systemLogsPage - 1) * systemLogsPageLimit;
  const endIndex = startIndex + systemLogsPageLimit;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);
  const systemLogsTotal = filteredLogs.length;

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        overflow: 'hidden',
        background:
          mode === 'default'
            ? theme.custom?.gradients?.homeBackground ||
              'linear-gradient(to bottom, #132060, #3e8e7e)'
            : theme.palette.background.default,
        justifyContent: 'center',
      }}
    >
      <Navbar /> {/* Vertical navbar */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Topbar />
        {/* Welcome Banner */}
        <Box
          sx={{
            width: '100%',
            backgroundColor: '#0A192F',
            color: 'white',
            textAlign: 'center',
            py: 2,
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
          }}
        >
          <Typography variant="h5" sx={{ color: 'white' }}>
            Welcome! Your dashboard is ready to go.
          </Typography>
        </Box>
        <Container
          sx={{ mt: 5, ml: 2, width: '100%', overflowX: 'auto' }}
          maxWidth={false}
        >
          <Grid container spacing={3}>
            {/* Recent Logins */}
            <Grid item xs={12} md={2.5}>
              <Card sx={{ p: 2 }} id="recent-logins">
                <CardContent>
                  <Typography variant="h6">Recent Logins</Typography>
                  <Divider sx={{ my: 1 }} />
                  {recentLoginsError ? (
                    <Typography variant="body1" color="error">
                      {recentLoginsError}
                    </Typography>
                  ) : (
                    <>
                      <List>
                        {recentLogins.map((log, index) => (
                          <ListItem key={index} alignItems="flex-start">
                            <ListItemText
                              primary={`${log.event}`}
                              secondary={
                                <>
                                  <Typography
                                    variant="body2"
                                    color="textSecondary"
                                  >
                                    {log.timestamp
                                      ? new Date(log.timestamp).toLocaleString()
                                      : 'Unknown Time'}
                                  </Typography>
                                  <Grid container spacing={0} sx={{ mt: 0 }}>
                                    {Object.entries(log.data).map(
                                      ([key, value]) => (
                                        <Grid item xs={12} key={key}>
                                          <Typography
                                            variant="body2"
                                            color="textSecondary"
                                          >
                                            <strong>{key}:</strong>{' '}
                                            {String(value)}
                                          </Typography>
                                        </Grid>
                                      )
                                    )}
                                  </Grid>
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          mt: 2,
                        }}
                      >
                        <Pagination
                          count={Math.ceil(
                            recentLoginsTotal / recentLoginsLimit
                          )}
                          page={recentLoginsPage}
                          onChange={(e, value) => setRecentLoginsPage(value)}
                          variant="outlined"
                          shape="rounded"
                          siblingCount={1}
                          boundaryCount={1}
                          showFirstButton
                          showLastButton
                        />
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* System Logs */}
            <Grid item xs={12} md={2.5}>
              <Card sx={{ p: 2 }} id="system-logs">
                <CardContent>
                  <Typography variant="h6">System Logs</Typography>
                  <Divider sx={{ my: 1 }} />

                  {/* Search bar */}
                  <TextField
                    label="Search Logs"
                    variant="outlined"
                    fullWidth
                    value={searchQuery}
                    onChange={handleSearchChange}
                    sx={{ mb: 2 }}
                  />

                  {systemLogsError ? (
                    <Typography variant="body1" color="error">
                      {systemLogsError}
                    </Typography>
                  ) : (
                    <>
                      <List>
                        {currentLogs.map((log, index) => (
                          <ListItem key={index} alignItems="flex-start">
                            <ListItemText
                              primary={`${log.event}`}
                              secondary={
                                <>
                                  <Typography
                                    variant="body2"
                                    color="textSecondary"
                                  >
                                    {log.timestamp
                                      ? new Date(log.timestamp).toLocaleString()
                                      : 'Unknown Time'}
                                  </Typography>
                                  <Grid container spacing={0} sx={{ mt: 0 }}>
                                    {Object.entries(log.data).map(
                                      ([key, value]) => (
                                        <Grid item xs={12} key={key}>
                                          <Typography
                                            variant="body2"
                                            color="textSecondary"
                                          >
                                            <strong>{key}:</strong>{' '}
                                            {String(value)}
                                          </Typography>
                                        </Grid>
                                      )
                                    )}
                                  </Grid>
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          mt: 2,
                        }}
                      >
                        <Pagination
                          count={Math.ceil(
                            systemLogsTotal / systemLogsPageLimit
                          )}
                          page={systemLogsPage}
                          onChange={(e, value) => setSystemLogsPage(value)}
                          variant="outlined"
                          shape="rounded"
                          siblingCount={1}
                          boundaryCount={1}
                          showFirstButton
                          showLastButton
                        />
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Active Applications */}
            <Grid item xs={4} md={3}>
              <Card sx={{ textAlign: 'center', p: 3 }} id="applications-card">
                <CardContent>
                  <Typography variant="h6">Active Applications</Typography>
                  <CircularProgress
                    id="active-applications"
                    variant="determinate"
                    value={(activeApplications / totalApplications) * 100}
                    size={120}
                    thickness={5}
                    aria-label={`Active Applications progress: ${activeApplications} out of ${totalApplications}`}
                  />
                  <Typography variant="h5" sx={{ mt: 2 }}>
                    {activeApplications}/{totalApplications}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Resource Utilization */}
            <Grid item xs={12} md={3}>
              <Card sx={{ p: 2, height: '100%' }} id="resource-utilization">
                <CardContent>
                  <Typography variant="h6">Resource Utilization</Typography>
                  <Divider sx={{ my: 1 }} />
                  <ApplicationSelector
                    processes={availableProcesses}
                    selectedApp={selectedApp}
                    onSelect={(appName) => setSelectedApp(appName)}
                  />
                  <ResourceUtilizationCharts selectedApp={selectedApp} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
