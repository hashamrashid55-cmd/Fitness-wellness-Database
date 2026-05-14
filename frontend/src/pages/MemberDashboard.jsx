import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import api from '../api';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const TABS = ['Overview','Health Metrics','Subscriptions','Devices','Trainers'];

export default function MemberDashboard() {
  const [tab, setTab] = useState('Overview');
  const [profile, setProfile]       = useState({});
  const [metrics, setMetrics]       = useState([]);
  const [subscriptions, setSubs]    = useState([]);
  const [devices, setDevices]       = useState([]);
  const [trainers, setTrainers]     = useState([]);
  const [newMetric, setNewMetric]   = useState({ metric_type:'Heart Rate', value:'', unit:'bpm', notes:'' });

  const [metricModal, setMetricModal] = useState(null);
  const [editMetric, setEditMetric] = useState({});

  async function refreshMetrics() {
    const r = await api.get('/member/health-metrics');
    setMetrics(r.data);
  }

  useEffect(() => {
    api.get('/member/profile').then(r => setProfile(r.data)).catch(() => {});
    api.get('/member/health-metrics').then(r => setMetrics(r.data)).catch(() => {});
    api.get('/member/subscriptions').then(r => setSubs(r.data)).catch(() => {});
    api.get('/member/devices').then(r => setDevices(r.data)).catch(() => {});
    api.get('/member/trainers').then(r => setTrainers(r.data)).catch(() => {});
  }, []);

  async function logMetric(e) {
    e.preventDefault();
    try {
      await api.post('/member/health-metrics', newMetric);
      toast.success('Health metric logged!');
      await refreshMetrics();
      setNewMetric({ metric_type:'Heart Rate', value:'', unit:'bpm', notes:'' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to log metric');
    }
  }

  const METRIC_UNITS = { 'Heart Rate':'bpm', 'Weight':'kg', 'Steps':'steps', 'Sleep Hours':'hours', 'Blood Pressure':'mmHg', 'Body Fat %':'%', 'Calories Burned':'kcal', 'VO2 Max':'mL/kg/min', 'Temperature':'°C', 'Stress Level':'/10' };

  const chartData = metrics.slice(0,20).reverse().map(m => ({
    date: new Date(m.measured_at).toLocaleDateString(),
    [m.metric_type]: m.value,
    value: m.value,
    type: m.metric_type
  }));

  const statusBadge = (s) => {
    const c = { ACTIVE:'#00d4aa', EXPIRED:'#ff4d6d', CANCELLED:'#8892b0' }[s] || '#8892b0';
    return <span style={{ padding:'2px 10px', borderRadius:20, background:`${c}20`, color:c, fontWeight:600, fontSize:11 }}>{s}</span>;
  };
  const catBadge = (c) => {
    const col = c === 'WEARABLE' ? '#6c63ff' : '#00d4aa';
    return <span style={{ padding:'2px 10px', borderRadius:20, background:`${col}20`, color:col, fontWeight:600, fontSize:11 }}>{c}</span>;
  };

  const inputStyle = { width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#f0f4ff', fontSize:14, outline:'none' };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0a0f1e 0%,#1a0a2e 100%)' }}>
      <Navbar title="Member Dashboard" />
      <div style={{ padding:'32px' }}>
        {/* Tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:32, flexWrap:'wrap' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:'10px 22px', borderRadius:12, border:'none', cursor:'pointer', fontWeight:600, fontSize:14, transition:'all 0.2s',
              background: tab===t ? 'linear-gradient(135deg,#ffd60a,#ff6b6b)' : 'rgba(255,255,255,0.05)',
              color: tab===t ? '#0a0f1e' : '#8892b0',
              boxShadow: tab===t ? '0 4px 16px rgba(255,214,10,0.35)' : 'none'
            }}>{t}</button>
          ))}
        </div>

        {tab === 'Overview' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:20, marginBottom:32 }}>
              <StatCard icon="📊" label="Health Metrics"    value={metrics.length}       color="#ffd60a" />
              <StatCard icon="📋" label="Subscriptions"     value={subscriptions.length} color="#6c63ff" />
              <StatCard icon="📱" label="Devices"           value={devices.length}       color="#00d4aa" />
              <StatCard icon="🏋️" label="Available Trainers" value={trainers.length}     color="#ff6b6b" />
              <StatCard icon="🎯" label="Fitness Goal" value={profile.fitness_goal || '—'} color="#00bcd4" />
            </div>
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:24, marginBottom:24 }}>
              <h3 style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>👤 My Profile</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
                {[
                  ['Name', `${profile.first_name||''} ${profile.last_name||''}`],
                  ['Email', profile.email],
                  ['Phone', profile.phone || '—'],
                  ['Date of Birth', profile.dob ? new Date(profile.dob).toLocaleDateString() : '—'],
                  ['Joined', profile.date_joined ? new Date(profile.date_joined).toLocaleDateString() : '—'],
                  ['Fitness Goal', profile.fitness_goal || '—'],
                ].map(([k,v]) => (
                  <div key={k} style={{ padding:12, background:'rgba(255,255,255,0.03)', borderRadius:10 }}>
                    <div style={{ fontSize:11, color:'#8892b0', fontWeight:600, marginBottom:4 }}>{k.toUpperCase()}</div>
                    <div style={{ fontSize:14, color:'#f0f4ff' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            {chartData.length > 0 && (
              <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:24 }}>
                <h3 style={{ fontWeight:700, fontSize:16, marginBottom:20 }}>📈 Recent Health Trend</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" stroke="#8892b0" fontSize={11} />
                    <YAxis stroke="#8892b0" fontSize={11} />
                    <Tooltip contentStyle={{ background:'#1a2035', border:'1px solid rgba(255,214,10,0.3)', borderRadius:8 }} />
                    <Line type="monotone" dataKey="value" stroke="#ffd60a" strokeWidth={2} dot={{ fill:'#ffd60a', r:4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {tab === 'Health Metrics' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, alignItems:'start' }}>
            <div>
              <h3 style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>📊 My Health Metrics</h3>
              <DataTable
                getRowKey={row => row.metric_id}
                rows={metrics}
                columns={[
                  { key:'metric_type', label:'Type' },
                  { key:'value',       label:'Value' },
                  { key:'unit',        label:'Unit' },
                  { key:'source',      label:'Source' },
                  { key:'measured_at', label:'Date', render: v => v ? new Date(v).toLocaleString() : '—' },
                  { key:'_a', label:'Actions', render: (_, row) => (
                    <span style={{ display:'flex', gap:8 }}>
                      <button type="button" onClick={() => { setMetricModal(row.metric_id); setEditMetric({ metric_type: row.metric_type, value: row.value, unit: row.unit, notes: row.notes || '' }); }} style={{ padding:'6px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.06)', color:'#f0f4ff', cursor:'pointer', fontSize:12, fontWeight:600 }}>Edit</button>
                      <button type="button" onClick={async () => {
                        if (!window.confirm('Delete this metric entry?')) return;
                        try {
                          await api.delete(`/member/health-metrics/${row.metric_id}`);
                          toast.success('Deleted');
                          await refreshMetrics();
                        } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
                      }} style={{ padding:'6px 12px', borderRadius:8, border:'1px solid rgba(255,77,109,0.45)', background:'rgba(255,77,109,0.08)', color:'#ff4d6d', cursor:'pointer', fontSize:12, fontWeight:600 }}>Delete</button>
                    </span>
                  ) },
                ]}
              />
            </div>
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:24 }}>
              <h3 style={{ fontWeight:700, fontSize:16, marginBottom:20 }}>➕ Log Metric</h3>
              <form onSubmit={logMetric} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label style={{ fontSize:12, color:'#8892b0', display:'block', marginBottom:6 }}>Metric Type</label>
                  <select style={inputStyle} value={newMetric.metric_type} onChange={e => {
                    const type = e.target.value;
                    setNewMetric({...newMetric, metric_type: type, unit: METRIC_UNITS[type] || ''});
                  }}>
                    {Object.keys(METRIC_UNITS).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, color:'#8892b0', display:'block', marginBottom:6 }}>Value</label>
                  <input type="number" step="any" style={inputStyle} value={newMetric.value} onChange={e=>setNewMetric({...newMetric,value:e.target.value})} required placeholder="e.g. 72" />
                </div>
                <div>
                  <label style={{ fontSize:12, color:'#8892b0', display:'block', marginBottom:6 }}>Unit</label>
                  <input type="text" style={inputStyle} value={newMetric.unit} onChange={e=>setNewMetric({...newMetric,unit:e.target.value})} required />
                </div>
                <div>
                  <label style={{ fontSize:12, color:'#8892b0', display:'block', marginBottom:6 }}>Notes (optional)</label>
                  <input type="text" style={inputStyle} value={newMetric.notes} onChange={e=>setNewMetric({...newMetric,notes:e.target.value})} placeholder="e.g. Morning reading" />
                </div>
                <button type="submit" style={{ padding:'12px', borderRadius:10, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#ffd60a,#ff6b6b)', color:'#0a0f1e', fontWeight:700, fontSize:14 }}>
                  Log Metric
                </button>
              </form>
            </div>
          </div>
        )}

        {metricModal != null && (
          <div style={{ position:'fixed', inset:0, background:'rgba(5,8,20,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 }} onClick={() => setMetricModal(null)}>
            <div style={{ width:'min(400px,100%)', background:'linear-gradient(160deg,#12182c,#0a0f1e)', border:'1px solid rgba(255,214,10,0.25)', borderRadius:16, padding:24 }} onClick={e => e.stopPropagation()}>
              <h3 style={{ marginBottom:16, fontWeight:700, color:'#f0f4ff' }}>Edit metric</h3>
              <form onSubmit={async e => {
                e.preventDefault();
                try {
                  await api.patch(`/member/health-metrics/${metricModal}`, {
                    metric_type: editMetric.metric_type,
                    value: editMetric.value,
                    unit: editMetric.unit,
                    notes: editMetric.notes || null,
                  });
                  toast.success('Updated');
                  setMetricModal(null);
                  await refreshMetrics();
                } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
              }} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div>
                  <label style={{ fontSize:12, color:'#8892b0', display:'block', marginBottom:6 }}>Type</label>
                  <select style={inputStyle} value={editMetric.metric_type} onChange={e => setEditMetric({ ...editMetric, metric_type: e.target.value, unit: METRIC_UNITS[e.target.value] || editMetric.unit })}>
                    {Object.keys(METRIC_UNITS).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize:12, color:'#8892b0' }}>Value</label><input type="number" step="any" style={inputStyle} value={editMetric.value} onChange={e => setEditMetric({ ...editMetric, value: e.target.value })} required /></div>
                <div><label style={{ fontSize:12, color:'#8892b0' }}>Unit</label><input style={inputStyle} value={editMetric.unit} onChange={e => setEditMetric({ ...editMetric, unit: e.target.value })} required /></div>
                <div><label style={{ fontSize:12, color:'#8892b0' }}>Notes</label><input style={inputStyle} value={editMetric.notes} onChange={e => setEditMetric({ ...editMetric, notes: e.target.value })} /></div>
                <div style={{ display:'flex', gap:10, marginTop:8, justifyContent:'flex-end' }}>
                  <button type="button" style={{ padding:'10px 16px', borderRadius:10, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.06)', color:'#f0f4ff', cursor:'pointer', fontWeight:600 }} onClick={() => setMetricModal(null)}>Cancel</button>
                  <button type="submit" style={{ padding:'10px 16px', borderRadius:10, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#ffd60a,#ff6b6b)', color:'#0a0f1e', fontWeight:700 }}>Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {tab === 'Subscriptions' && (
          <DataTable rows={subscriptions} columns={[
            { key:'plan_type',     label:'Plan' },
            { key:'price',         label:'Price', render: v => `$${Number(v).toFixed(2)}` },
            { key:'start_date',    label:'Start', render: v => v ? new Date(v).toLocaleDateString() : '—' },
            { key:'end_date',      label:'End',   render: v => v ? new Date(v).toLocaleDateString() : '—' },
            { key:'current_status',label:'Status', render: v => statusBadge(v) },
            { key:'payment_method',label:'Payment' },
          ]} />
        )}

        {tab === 'Devices' && (
          <DataTable rows={devices} columns={[
            { key:'device_name',   label:'Device' },
            { key:'manufacturer',  label:'Brand' },
            { key:'category',      label:'Type', render: v => catBadge(v) },
            { key:'device_spec',   label:'Spec' },
            { key:'registration_date', label:'Registered', render: v => v ? new Date(v).toLocaleDateString() : '—' },
          ]} />
        )}

        {tab === 'Trainers' && (
          <DataTable rows={trainers} columns={[
            { key:'trainer_name',     label:'Trainer' },
            { key:'specialization',   label:'Specialization' },
            { key:'rating',           label:'Rating', render: v => v ? `⭐ ${v}` : '—' },
            { key:'years_of_exp',     label:'Experience' },
            { key:'certification',    label:'Certification' },
            { key:'upcoming_sessions',label:'Upcoming Sessions' },
          ]} />
        )}
      </div>
    </div>
  );
}
