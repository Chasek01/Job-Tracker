import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from "@mui/icons-material/Settings";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

import { api } from "./api";
import { format } from "date-fns";

const STATUS_OPTIONS = ["Applied", "Interview", "Offer", "Rejected"];
const STATUS_FILTERS = ["All", ...STATUS_OPTIONS];

function statusPillStyle(theme, status) {
  // Base pill
  const pill = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "flex-start",
    height: 30,
    px: 1.25,
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 12.5,
    lineHeight: 1,
    whiteSpace: "nowrap",
  };

  const colors =
    status === "Applied"
      ? { bg: theme.palette.info.main, fg: theme.palette.info.contrastText }
      : status === "Interview"
      ? { bg: theme.palette.secondary.main, fg: theme.palette.secondary.contrastText }
      : status === "Offer"
      ? { bg: theme.palette.success.main, fg: theme.palette.success.contrastText }
      : status === "Rejected"
      ? { bg: theme.palette.error.main, fg: theme.palette.error.contrastText }
      : { bg: theme.palette.grey[600], fg: theme.palette.common.white };

  return { ...pill, backgroundColor: colors.bg, color: colors.fg };
}

function formatDate(isoString) {
  if (!isoString) return "";
  try {
    return format(new Date(isoString), "MMM d, yyyy h:mm a");
  } catch {
    return isoString;
  }
}

export default function App() {
  // ---- Theme / Dark mode ----
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("jobtracker_dark_mode");
    return saved ? saved === "true" : false;
  });

  useEffect(() => {
    localStorage.setItem("jobtracker_dark_mode", String(darkMode));
  }, [darkMode]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: { mode: darkMode ? "dark" : "light" },
        shape: { borderRadius: 10 },
        components: {
          MuiButton: { styleOverrides: { root: { borderRadius: 12 } } },
          MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12 } } },
          MuiPaper: { styleOverrides: { root: { borderRadius: 14 } } },
        },
      }),
    [darkMode]
  );

  // ---- Data / UI state ----
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const [sortDir, setSortDir] = useState("desc");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    company: "",
    role: "",
    status: "Applied",
    date_applied: "",
    location: "",
    job_url: "",
    salary_range: "",
    notes: "",
  });

  const [toast, setToast] = useState({ open: false, msg: "", severity: "success" });

  const filteredAndSortedApps = useMemo(() => {
    const term = search.trim().toLowerCase();

    let filtered = apps;

    if (term) {
      filtered = filtered.filter((a) => {
        const company = (a.company || "").toLowerCase();
        const role = (a.role || "").toLowerCase();
        return company.includes(term) || role.includes(term);
      });
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    const copy = [...filtered];
    copy.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortDir === "desc" ? db - da : da - db;
    });

    return copy;
  }, [apps, search, statusFilter, sortDir]);

  async function fetchApps() {
    setLoading(true);
    try {
      const res = await api.get("/applications", { params: { sort: "-created_at" } });
      setApps(res.data);
    } catch (e) {
      setToast({ open: true, msg: "Failed to load applications.", severity: "error" });
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchApps();
  }, []);

  function toggleSort() {
    setSortDir((d) => (d === "desc" ? "asc" : "desc"));
  }

  async function handleStatusChange(appId, newStatus) {
    setSavingId(appId);
    try {
      await api.put(`/applications/${appId}`, { status: newStatus });
      setApps((prev) => prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a)));
      setToast({ open: true, msg: "Status updated.", severity: "success" });
    } catch (e) {
      setToast({ open: true, msg: "Failed to update status.", severity: "error" });
      console.error(e);
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(appId) {
    if (!window.confirm("Delete this application?")) return;

    try {
      await api.delete(`/applications/${appId}`);
      setApps((prev) => prev.filter((a) => a.id !== appId));
      setToast({ open: true, msg: "Application deleted.", severity: "success" });
    } catch (e) {
      setToast({ open: true, msg: "Failed to delete application.", severity: "error" });
      console.error(e);
    }
  }

  function resetForm() {
    setForm({
      company: "",
      role: "",
      status: "Applied",
      date_applied: "",
      location: "",
      job_url: "",
      salary_range: "",
      notes: "",
    });
  }

  function openAddModal() {
    setEditingId(null);
    resetForm();
    setOpen(true);
  }

  function openEditModal(app) {
    setEditingId(app.id);
    setForm({
      company: app.company ?? "",
      role: app.role ?? "",
      status: app.status ?? "Applied",
      date_applied: app.date_applied ?? "",
      location: app.location ?? "",
      job_url: app.job_url ?? "",
      salary_range: app.salary_range ?? "",
      notes: app.notes ?? "",
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.company.trim() || !form.role.trim()) {
      setToast({ open: true, msg: "Company and role are required.", severity: "error" });
      return;
    }

    const payload = {
      company: form.company.trim(),
      role: form.role.trim(),
      status: form.status,
      date_applied: form.date_applied || null,
      location: form.location.trim() || null,
      job_url: form.job_url.trim() || null,
      salary_range: form.salary_range.trim() || null,
      notes: form.notes.trim() || null,
    };

    try {
      if (editingId === null) {
        const res = await api.post("/applications", payload);
        setApps((prev) => [res.data, ...prev]);
        setToast({ open: true, msg: "Application added.", severity: "success" });
      } else {
        const res = await api.put(`/applications/${editingId}`, payload);
        setApps((prev) => prev.map((a) => (a.id === editingId ? res.data : a)));
        setToast({ open: true, msg: "Application updated.", severity: "success" });
      }

      setOpen(false);
      setEditingId(null);
      resetForm();
    } catch (e) {
      setToast({
        open: true,
        msg: editingId === null ? "Failed to add application." : "Failed to update application.",
        severity: "error",
      });
      console.error(e);
    }
  }

  // Layout
  const desktopCols = "2.1fr 2.1fr 2.0fr 0.95fr 90px";

  const pillSelectSx = (status) => ({
    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
    "&:hover .MuiOutlinedInput-notchedOutline": { border: "none" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { border: "none" },

    "& .MuiSelect-select": {
      p: 0,
      pr: 4, // keep room for the dropdown arrow
      display: "flex",
      alignItems: "center",
    },

    // tweak the arrow position
    "& .MuiSelect-icon": {
      right: 8,
    },

    // apply background to the input root (so clicks anywhere on pill work)
    "& .MuiOutlinedInput-root": {
      p: 0,
    },

    minHeight: 30,

    width: "100%",
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", p: { xs: 2, md: 4 }, bgcolor: "background.default" }}>
        <Box sx={{ maxWidth: 1100, mx: "auto" }}>
          <Paper elevation={0} sx={{ p: { xs: 2, md: 3 } }}>
            {/* Top bar */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
                  Job Application Tracker
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Search, filter by status, edit and delete applications.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                <IconButton
                  aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                  onClick={() => setDarkMode((v) => !v)}
                  size="large"
                >
                  {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>

                <Button variant="outlined" onClick={fetchApps} disabled={loading}>
                  Refresh
                </Button>
                <Button variant="contained" onClick={openAddModal}>
                  Add
                </Button>
              </Stack>
            </Stack>

            {/* Search + Status filter */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Search (company or role)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <FormControl sx={{ minWidth: 220 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {STATUS_FILTERS.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* Table */}
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                overflow: "clip",
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1.6fr 1.6fr 1.2fr", md: desktopCols },
                  gap: 2,
                  px: 2,
                  py: 1.5,
                  bgcolor: "action.hover",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  fontWeight: 700,
                }}
              >
                <Box>Company</Box>
                <Box>Role</Box>

                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  onClick={toggleSort}
                  sx={{ cursor: "pointer", userSelect: "none", display: { xs: "none", md: "flex" } }}
                  title="Sort by created date"
                >
                  <Box>Created</Box>
                  {sortDir === "desc" ? (
                    <ArrowDownwardIcon fontSize="small" />
                  ) : (
                    <ArrowUpwardIcon fontSize="small" />
                  )}
                </Stack>

                <Box sx={{ display: { xs: "none", md: "block" } }}>Status</Box>
                <Box sx={{ textAlign: "right", display: { xs: "none", md: "block" } }}>Actions</Box>
              </Box>

              {/* Body */}
              {loading ? (
                <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
                  <CircularProgress />
                </Box>
              ) : filteredAndSortedApps.length === 0 ? (
                <Box sx={{ p: 3 }}>
                  <Typography color="text.secondary">
                    No applications match your search/filter. Click “Add” to create one.
                  </Typography>
                </Box>
              ) : (
                filteredAndSortedApps.map((a, idx) => (
                  <Box
                    key={a.id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1.6fr 1.6fr 1.2fr", md: desktopCols },
                      gap: 2,
                      px: 2,
                      py: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      alignItems: "center",
                      bgcolor: idx % 2 === 0 ? "background.paper" : "action.selected",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <Box sx={{ fontWeight: 800 }}>{a.company}</Box>
                    <Box>{a.role}</Box>

                    {/* Mobile compact column */}
                    <Stack spacing={0.75} sx={{ display: { xs: "flex", md: "none" } }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(a.created_at)}
                      </Typography>

                      {/* Mobile: pill-like select */}
                      <FormControl size="small">
                        <Select
                          value={a.status}
                          disabled={savingId === a.id}
                          onChange={(e) => handleStatusChange(a.id, e.target.value)}
                          variant="outlined"
                          renderValue={(val) => (
                            <Box sx={statusPillStyle(theme, val)}>{val}</Box>
                          )}
                          sx={pillSelectSx(a.status)}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <MenuItem key={s} value={s}>
                              <Box sx={statusPillStyle(theme, s)}>{s}</Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Stack direction="row" spacing={1}>
                        <IconButton aria-label="edit" size="small" onClick={() => openEditModal(a)}>
                          <SettingsIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          aria-label="delete"
                          size="small"
                          color="error"
                          onClick={() => handleDelete(a.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>

                    {/* Desktop: created (one line) */}
                    <Box sx={{ display: { xs: "none", md: "block" } }}>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                        {formatDate(a.created_at)}
                      </Typography>
                    </Box>

                    {/* Desktop: Status */}
                    <Box sx={{ display: { xs: "none", md: "block" } }}>
                      <FormControl size="small" sx={{ width: "100%" }}>
                        <Select
                          value={a.status}
                          disabled={savingId === a.id}
                          onChange={(e) => handleStatusChange(a.id, e.target.value)}
                          variant="outlined"
                          renderValue={(val) => (
                            <Box sx={statusPillStyle(theme, val)}>{val}</Box>
                          )}
                          sx={pillSelectSx(a.status)}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <MenuItem key={s} value={s}>
                              <Box sx={statusPillStyle(theme, s)}>{s}</Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    {/* Desktop actions */}
                    <Stack
                      direction="row"
                      spacing={0.5}
                      justifyContent="flex-end"
                      sx={{ display: { xs: "none", md: "flex" } }}
                    >
                      <IconButton aria-label="edit" onClick={() => openEditModal(a)} size="small">
                        <SettingsIcon />
                      </IconButton>
                      <IconButton
                        aria-label="delete"
                        onClick={() => handleDelete(a.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </Box>
                ))
              )}
            </Box>
          </Paper>

          <Fab
            color="primary"
            aria-label="add"
            onClick={openAddModal}
            sx={{ position: "fixed", right: 24, bottom: 24, borderRadius: 999 }}
          >
            <AddIcon />
          </Fab>

          {/* Add/Edit modal */}
          <Dialog
            open={open}
            onClose={() => {
              setOpen(false);
              setEditingId(null);
            }}
            fullWidth
            maxWidth="sm"
            PaperProps={{ sx: { borderRadius: 3 } }}
          >
            <DialogTitle sx={{ fontWeight: 800 }}>
              {editingId === null ? "Add Application" : "Edit Application"}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="Company *"
                  value={form.company}
                  onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                />
                <TextField
                  label="Role *"
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                />

                {/* Modal status select can stay normal (simpler) */}
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Date Applied"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.date_applied}
                  onChange={(e) => setForm((p) => ({ ...p, date_applied: e.target.value }))}
                />

                <TextField
                  label="Location"
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                />
                <TextField
                  label="Job URL"
                  value={form.job_url}
                  onChange={(e) => setForm((p) => ({ ...p, job_url: e.target.value }))}
                />
                <TextField
                  label="Salary Range"
                  value={form.salary_range}
                  onChange={(e) => setForm((p) => ({ ...p, salary_range: e.target.value }))}
                />
                <TextField
                  label="Notes"
                  multiline
                  minRows={3}
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button
                onClick={() => {
                  setOpen(false);
                  setEditingId(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSave}>
                {editingId === null ? "Add" : "Save"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Toast */}
          <Snackbar
            open={toast.open}
            autoHideDuration={2500}
            onClose={() => setToast((t) => ({ ...t, open: false }))}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert
              onClose={() => setToast((t) => ({ ...t, open: false }))}
              severity={toast.severity}
              variant="filled"
              sx={{ width: "100%", borderRadius: 2 }}
            >
              {toast.msg}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </ThemeProvider>
  );
}