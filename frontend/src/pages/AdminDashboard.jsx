import { useEffect, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import api from '../api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TABS = ['Overview','Members','Trainers','Subscriptions','Devices'];

const inputStyle = { width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.06)', color:'#f0f4ff', fontSize:14, outline:'none' };
const btnGhost = { padding:'6px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.06)', color:'#f0f4ff', cursor:'pointer', fontSize:12, fontWeight:600 };
const btnDanger = { ...btnGhost, borderColor:'rgba(255,77,109,0.5)', color:'#ff4d6d' };

export default function AdminDashboard() {
  const [tab, setTab]   = useState('Overview');
  const [stats, setStats]           = useState({});
  const [members, setMembers]       = useState([]);
  const [trainers, setTrainers]     = useState([]);
  const [subscriptions, setSubs]    = useState([]);
  const [devices, setDevices]       = useState([]);
  const [revenue, setRevenue]       = useState([]);
  const [modal, setModal] = useState(null);
  const [f, setF] = useState({});

  const loadData = useCallback(async () => {
    try {
      const [st, m, t, s, d, rev] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/members'),
        api.get('/admin/trainers'),
        api.get('/admin/subscriptions'),
        api.get('/admin/devices'),
        api.get('/admin/revenue'),
      ]);
      setStats(st.data);
      setMembers(m.data);
      setTrainers(t.data);
      setSubs(s.data);
      setDevices(d.data);
      setRevenue(rev.data);
    } catch {
      toast.error('Failed to load admin data');
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!modal) return;
    if (modal.t === 'memberEdit') {
      const r = modal.row;
      setF({
        first_name: r.first_name || '',
        last_name: r.last_name || '',
        email: r.email || '',
        phone: r.phone || '',
        dob: r.dob ? String(r.dob).slice(0, 10) : '',
        fitness_goal: r.fitness_goal || '',
      });
    }
    if (modal.t === 'memberNew') {
      setF({ first_name:'', last_name:'', email:'', phone:'', dob:'', fitness_goal:'', password:'password' });
    }
    if (modal.t === 'trainerEdit') {
      const r = modal.row;
      setF({
        first_name: r.first_name || '',
        last_name: r.last_name || '',
        email: r.email || '',
        phone: r.phone || '',
        dob: r.dob ? String(r.dob).slice(0, 10) : '',
        specialization: r.specialization || '',
        certification: r.certification || '',
        years_of_exp: r.years_of_exp ?? '',
        bio: r.bio || '',
        rating: r.rating ?? '',
      });
    }
    if (modal.t === 'trainerNew') {
      setF({
        first_name:'', last_name:'', email:'', phone:'', dob:'',
        specialization:'', certification:'', years_of_exp:'', bio:'', password:'password',
      });
    }
    if (modal.t === 'subNew') {
      setF({
        member_id: members[0]?.member_id ?? '',
        plan_type: 'BASIC',
        start_date: new Date().toISOString().slice(0, 10),
        end_date: '',
        price: '49.99',
        payment_method: 'CREDIT_CARD',
        status: 'ACTIVE',
      });
    }
    if (modal.t === 'subEdit') {
      const r = modal.row;
      setF({
        plan_type: r.plan_type,
        start_date: r.start_date ? String(r.start_date).slice(0, 10) : '',
        end_date: r.end_date ? String(r.end_date).slice(0, 10) : '',
        price: String(r.price),
        payment_method: r.payment_method || 'CREDIT_CARD',
        status: r.status,
      });
    }
    if (modal.t === 'deviceNew') {
      setF({
        member_id: members[0]?.member_id ?? '',
        device_name: '',
        manufacturer: '',
        category: 'WEARABLE',
        battery_life: '',
        sensor_type: '',
        os: '',
      });
    }
    if (modal.t === 'deviceEdit') {
      const r = modal.row;
      setF({
        device_name: r.device_name || '',
        manufacturer: r.manufacturer || '',
        battery_life: '',
        sensor_type: r.category === 'WEARABLE' ? (r.device_spec || '') : '',
        os: r.category === 'MOBILE' ? (r.device_spec || '') : '',
      });
    }
  }, [modal, members]);

  const statusBadge = (s) => {
    const c = { ACTIVE:'#00d4aa', CANCELLED:'#ff4d6d', SUSPENDED:'#ffd60a', INACTIVE:'#8892b0' }[s] || '#8892b0';
    return <span style={{ padding:'2px 10px', borderRadius:20, background:`${c}20`, color:c, fontWeight:600, fontSize:11 }}>{s}</span>;
  };
  const catBadge = (c) => {
    const col = c === 'WEARABLE' ? '#6c63ff' : '#00d4aa';
    return <span style={{ padding:'2px 10px', borderRadius:20, background:`${col}20`, color:col, fontWeight:600, fontSize:11 }}>{c}</span>;
  };

  async function submitMember(e) {
    e.preventDefault();
    try {
      if (modal.t === 'memberNew') {
        await api.post('/admin/members', {
          first_name: f.first_name, last_name: f.last_name, email: f.email, phone: f.phone || null, dob: f.dob || null,
          password: f.password, fitness_goal: f.fitness_goal || null,
        });
        toast.success('Member created');
      } else {
        await api.patch(`/admin/members/${modal.row.member_id}`, {
          first_name: f.first_name, last_name: f.last_name, email: f.email, phone: f.phone || null, dob: f.dob || null,
          fitness_goal: f.fitness_goal || null,
        });
        toast.success('Member updated');
      }
      setModal(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Request failed');
    }
  }

  async function submitTrainer(e) {
    e.preventDefault();
    try {
      if (modal.t === 'trainerNew') {
        await api.post('/admin/trainers', {
          first_name: f.first_name, last_name: f.last_name, email: f.email, phone: f.phone || null, dob: f.dob || null,
          password: f.password, specialization: f.specialization || null, certification: f.certification || null,
          years_of_exp: f.years_of_exp === '' ? null : Number(f.years_of_exp), bio: f.bio || null,
        });
        toast.success('Trainer created');
      } else {
        await api.patch(`/admin/trainers/${modal.row.trainer_id}`, {
          first_name: f.first_name, last_name: f.last_name, email: f.email, phone: f.phone || null, dob: f.dob || null,
          specialization: f.specialization || null, certification: f.certification || null,
          years_of_exp: f.years_of_exp === '' ? null : Number(f.years_of_exp), bio: f.bio || null,
          rating: f.rating === '' ? null : Number(f.rating),
        });
        toast.success('Trainer updated');
      }
      setModal(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Request failed');
    }
  }

  async function submitSub(e) {
    e.preventDefault();
    try {
      if (modal.t === 'subNew') {
        await api.post('/admin/subscriptions', {
          member_id: Number(f.member_id),
          plan_type: f.plan_type,
          start_date: f.start_date,
          end_date: f.end_date || null,
          price: Number(f.price),
          payment_method: f.payment_method,
          status: f.status,
        });
        toast.success('Subscription created');
      } else {
        await api.patch(`/admin/subscriptions/${modal.row.sub_id}`, {
          plan_type: f.plan_type,
          start_date: f.start_date,
          end_date: f.end_date || null,
          price: Number(f.price),
          payment_method: f.payment_method,
          status: f.status,
        });
        toast.success('Subscription updated');
      }
      setModal(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Request failed');
    }
  }

  async function submitDevice(e) {
    e.preventDefault();
    try {
      if (modal.t === 'deviceNew') {
        const body = {
          member_id: Number(f.member_id),
          device_name: f.device_name,
          manufacturer: f.manufacturer || null,
          category: f.category,
          battery_life: f.category === 'WEARABLE' && f.battery_life ? Number(f.battery_life) : null,
          sensor_type: f.category === 'WEARABLE' ? (f.sensor_type || null) : null,
          os: f.category === 'MOBILE' ? (f.os || null) : null,
        };
        await api.post('/admin/devices', body);
        toast.success('Device created');
      } else {
        const r = modal.row;
        await api.patch(`/admin/devices/${r.device_id}`, {
          device_name: f.device_name,
          manufacturer: f.manufacturer,
          ...(r.category === 'WEARABLE' ? { battery_life: f.battery_life ? Number(f.battery_life) : null, sensor_type: f.sensor_type || null } : {}),
          ...(r.category === 'MOBILE' ? { os: f.os || null } : {}),
        });
        toast.success('Device updated');
      }
      setModal(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Request failed');
    }
  }

  const overlay = (
    <div style={{ position:'fixed', inset:0, background:'rgba(5,8,20,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 }} onClick={() => setModal(null)}>
      <div style={{ width:'min(440px,100%)', maxHeight:'90vh', overflow:'auto', background:'linear-gradient(160deg,#12182c,#0a0f1e)', border:'1px solid rgba(108,99,255,0.25)', borderRadius:16, padding:24 }} onClick={e => e.stopPropagation()}>
        {modal?.t === 'memberEdit' || modal?.t === 'memberNew' ? (
          <form onSubmit={submitMember}>
            <h3 style={{ marginBottom:16, fontWeight:700, color:'#f0f4ff' }}>{modal.t === 'memberNew' ? 'Add member' : 'Edit member'}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {modal.t === 'memberNew' && (
                <div>
                  <label style={{ fontSize:12, color:'#8892b0', display:'block', marginBottom:6 }}>Password</label>
                  <input style={inputStyle} type="text" value={f.password || ''} onChange={e => setF({ ...f, password: e.target.value })} required />
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={{ fontSize:12, color:'#8892b0' }}>First name</label><input style={inputStyle} value={f.first_name || ''} onChange={e => setF({ ...f, first_name: e.target.value })} required /></div>
                <div><label style={{ fontSize:12, color:'#8892b0' }}>Last name</label><input style={inputStyle} value={f.last_name || ''} onChange={e => setF({ ...f, last_name: e.target.value })} required /></div>
              </div>
              <div><label style={{ fontSize:12, color:'#8892b0' }}>Email</label><input style={inputStyle} type="email" value={f.email || ''} onChange={e => setF({ ...f, email: e.target.value })} required /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={{ fontSize:12, color:'#8892b0' }}>Phone</label><input style={inputStyle} value={f.phone || ''} onChange={e => setF({ ...f, phone: e.target.value })} /></div>
                <div><label style={{ fontSize:12, color:'#8892b0' }}>DOB</label><input style={inputStyle} type="date" value={f.dob || ''} onChange={e => setF({ ...f, dob: e.target.value })} /></div>
              </div>
              <div><label style={{ fontSize:12, color:'#8892b0' }}>Fitness goal</label><input style={inputStyle} value={f.fitness_goal || ''} onChange={e => setF({ ...f, fitness_goal: e.target.value })} /></div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
              <button type="button" style={btnGhost} onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" style={{ ...btnGhost, border:'none', background:'linear-gradient(135deg,#6c63ff,#00d4aa)', color:'#fff' }}>Save</button>
            </div>
          </form>
        ) : null}

        {modal?.t === 'trainerEdit' || modal?.t === 'trainerNew' ? (
          <form onSubmit={submitTrainer}>
            <h3 style={{ marginBottom:16, fontWeight:700, color:'#f0f4ff' }}>{modal.t === 'trainerNew' ? 'Add trainer' : 'Edit trainer'}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {modal.t === 'trainerNew' && (
                <div>
                  <label style={{ fontSize:12, color:'#8892b0', display:'block', marginBottom:6 }}>Password</label>
                  <input style={inputStyle} type="text" value={f.password || ''} onChange={e => setF({ ...f, password: e.target.value })} required />
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={{ fontSize:12, color:'#8892b0' }}>First name</label><input style={inputStyle} value={f.first_name || ''} onChange={e => setF({ ...f, first_name: e.target.value })} required /></div>
                <div><label style={{ fontSize:12, color:'#8892b0' }}>Last name</label><input style={inputStyle} value={f.last_name || ''} onChange={e => setF({ ...f, last_name: e.target.value })} required /></div>
              </div>
              <div><label style={{ fontSize:12, color:'#8892b0' }}>Email</label><input style={inputStyle} type="email" value={f.email || ''} onChange={e => setF({ ...f, email: e.target.value })} required /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={{ fontSize:12, color:'#8892b0' }}>Phone</label><input style={inputStyle} value={f.phone || ''} onChange={e => setF({ ...f, phone: e.target.value })} /></div>
                <div><label style={{ fontSize:12, color:'#8892b0' }}>DOB</label><input style={inputStyle} type="date" value={f.dob || ''} onChange={e => setF({ ...f, dob: e.target.value })} /></div>
              </div>
              <div><label style={{ fontSize:12, color:'#8892b0' }}>Specialization</label><input style={inputStyle} value={f.specialization || ''} onChange={e => setF({ ...f, specialization: e.target.value })} /></div>
              <div><label style={{ fontSize:12, color:'#8892b0' }}>Certification</label><input style={inputStyle} value={f.certification || ''} onChange={e => setF({ ...f, certification: e.target.value })} /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={{ fontSize:12, color:'#8892b0' }}>Years exp</label><input style={inputStyle} type="number" value={f.years_of_exp} onChange={e => setF({ ...f, years_of_exp: e.target.value })} /></div>
                {modal.t === 'trainerEdit' && (
                  <div><label style={{ fontSize:12, color:'#8892b0' }}>Rating</label><input style={inputStyle} type="number" step="0.1" min="0" max="5" value={f.rating} onChange={e => setF({ ...f, rating: e.target.value })} /></div>
                )}
              </div>
              <div><label style={{ fontSize:12, color:'#8892b0' }}>Bio</label><textarea style={{ ...inputStyle, minHeight:72, resize:'vertical' }} value={f.bio || ''} onChange={e => setF({ ...f, bio: e.target.value })} /></div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
              <button type="button" style={btnGhost} onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" style={{ ...btnGhost, border:'none', background:'linear-gradient(135deg,#6c63ff,#00d4aa)', color:'#fff' }}>Save</button>
            </div>
          </form>
        ) : null}

        {modal?.t === 'subNew' || modal?.t === 'subEdit' ? (
          <form onSubmit={submitSub}>
            <h3 style={{ marginBottom:16, fontWeight:700, color:'#f0f4ff' }}>{modal.t === 'subNew' ? 'New subscription' : 'Edit subscription'}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {modal.t === 'subNew' && (
                <div>
                  <label style={{ fontSize:12, color:'#8892b0', display:'block', marginBottom:6 }}>Member</label>
                  <select style={inputStyle} value={f.member_id} onChange={e => setF({ ...f, member_id: e.target.value })} required>
                    {members.map(m => <option key={m.member_id} value={m.member_id}>{m.first_name} {m.last_name} (#{m.member_id})</option>)}
                  </select>
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:12, color:'#8892b0' }}>Plan</label>
                  <select style={inputStyle} value={f.plan_type} onChange={e => setF({ ...f, plan_type: e.target.value })}>
                    {['BASIC','PREMIUM','ELITE'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize:12, color:'#8892b0' }}>Price</label><input style={inputStyle} type="number" step="0.01" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} required /></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={{ fontSize:12, color:'#8892b0' }}>Start</label><input style={inputStyle} type="date" value={f.start_date} onChange={e => setF({ ...f, start_date: e.target.value })} required /></div>
                <div><label style={{ fontSize:12, color:'#8892b0' }}>End</label><input style={inputStyle} type="date" value={f.end_date} onChange={e => setF({ ...f, end_date: e.target.value })} /></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:12, color:'#8892b0' }}>Payment</label>
                  <select style={inputStyle} value={f.payment_method} onChange={e => setF({ ...f, payment_method: e.target.value })}>
                    {['CREDIT_CARD','DEBIT_CARD','BANK_TRANSFER','PAYPAL'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, color:'#8892b0' }}>Status</label>
                  <select style={inputStyle} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
                    {['ACTIVE','INACTIVE','SUSPENDED','CANCELLED'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
              <button type="button" style={btnGhost} onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" style={{ ...btnGhost, border:'none', background:'linear-gradient(135deg,#6c63ff,#00d4aa)', color:'#fff' }}>Save</button>
            </div>
          </form>
        ) : null}

        {modal?.t === 'deviceNew' || modal?.t === 'deviceEdit' ? (
          <form onSubmit={submitDevice}>
            <h3 style={{ marginBottom:16, fontWeight:700, color:'#f0f4ff' }}>{modal.t === 'deviceNew' ? 'Register device' : 'Edit device'}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {modal.t === 'deviceNew' && (
                <>
                  <div>
                    <label style={{ fontSize:12, color:'#8892b0', display:'block', marginBottom:6 }}>Member</label>
                    <select style={inputStyle} value={f.member_id} onChange={e => setF({ ...f, member_id: e.target.value })} required>
                      {members.map(m => <option key={m.member_id} value={m.member_id}>{m.first_name} {m.last_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'#8892b0' }}>Category</label>
                    <select style={inputStyle} value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>
                      <option value="WEARABLE">WEARABLE</option>
                      <option value="MOBILE">MOBILE</option>
                    </select>
                  </div>
                </>
              )}
              <div><label style={{ fontSize:12, color:'#8892b0' }}>Device name</label><input style={inputStyle} value={f.device_name || ''} onChange={e => setF({ ...f, device_name: e.target.value })} required /></div>
              <div><label style={{ fontSize:12, color:'#8892b0' }}>Manufacturer</label><input style={inputStyle} value={f.manufacturer || ''} onChange={e => setF({ ...f, manufacturer: e.target.value })} /></div>
              {(modal.t === 'deviceNew' && f.category === 'WEARABLE') || (modal.t === 'deviceEdit' && modal.row.category === 'WEARABLE') ? (
                <>
                  <div><label style={{ fontSize:12, color:'#8892b0' }}>Battery (hours)</label><input style={inputStyle} type="number" value={f.battery_life} onChange={e => setF({ ...f, battery_life: e.target.value })} /></div>
                  <div><label style={{ fontSize:12, color:'#8892b0' }}>Sensors</label><input style={inputStyle} value={f.sensor_type || ''} onChange={e => setF({ ...f, sensor_type: e.target.value })} /></div>
                </>
              ) : null}
              {(modal.t === 'deviceNew' && f.category === 'MOBILE') || (modal.t === 'deviceEdit' && modal.row.category === 'MOBILE') ? (
                <div><label style={{ fontSize:12, color:'#8892b0' }}>OS</label><input style={inputStyle} value={f.os || ''} onChange={e => setF({ ...f, os: e.target.value })} /></div>
              ) : null}
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
              <button type="button" style={btnGhost} onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" style={{ ...btnGhost, border:'none', background:'linear-gradient(135deg,#6c63ff,#00d4aa)', color:'#fff' }}>Save</button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );

  const actionsCol = (onEdit, onDelete) => ({
    key: '_actions',
    label: 'Actions',
    render: (_, row) => (
      <span style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <button type="button" style={btnGhost} onClick={() => onEdit(row)}>Edit</button>
        <button type="button" style={btnDanger} onClick={() => onDelete(row)}>Delete</button>
      </span>
    ),
  });

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0a0f1e 0%,#0d1b4b 100%)' }}>
      <Navbar title="Admin Dashboard" />
      <div style={{ padding:'32px' }}>
        <div style={{ display:'flex', gap:8, marginBottom:32, flexWrap:'wrap' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:'10px 22px', borderRadius:12, border:'none', cursor:'pointer', fontWeight:600, fontSize:14, transition:'all 0.2s',
              background: tab===t ? 'linear-gradient(135deg,#6c63ff,#00d4aa)' : 'rgba(255,255,255,0.05)',
              color: tab===t ? '#fff' : '#8892b0',
              boxShadow: tab===t ? '0 4px 16px rgba(108,99,255,0.35)' : 'none'
            }}>{t}</button>
          ))}
        </div>

        {tab === 'Overview' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:20, marginBottom:32 }}>
              <StatCard icon="👥" label="Total Members"  value={stats.total_members  ?? '…'} color="#6c63ff" />
              <StatCard icon="🏋️" label="Total Trainers" value={stats.total_trainers ?? '…'} color="#00d4aa" />
              <StatCard icon="📋" label="Active Subs"    value={stats.active_subs    ?? '…'} color="#ffd60a" />
              <StatCard icon="💰" label="Total Revenue"  value={stats.total_revenue ? `$${Number(stats.total_revenue).toFixed(2)}` : '…'} color="#ff6b6b" />
              <StatCard icon="📅" label="Sessions"       value={stats.total_sessions ?? '…'} color="#00bcd4" />
            </div>
            {revenue.length > 0 && (
              <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:24 }}>
                <h3 style={{ marginBottom:20, fontWeight:700, fontSize:16 }}>📊 Revenue by Month & Plan</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={revenue}>
                    <XAxis dataKey="month" stroke="#8892b0" fontSize={12} />
                    <YAxis stroke="#8892b0" fontSize={12} />
                    <Tooltip contentStyle={{ background:'#1a2035', border:'1px solid rgba(108,99,255,0.3)', borderRadius:8 }} />
                    <Bar dataKey="total_revenue" radius={[6,6,0,0]}>
                      {revenue.map((_, i) => <Cell key={i} fill={['#6c63ff','#00d4aa','#ffd60a'][i%3]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {tab === 'Members' && (
          <div>
            <div style={{ marginBottom:16 }}>
              <button type="button" style={{ ...btnGhost, border:'none', background:'linear-gradient(135deg,#6c63ff,#00d4aa)', color:'#fff', padding:'10px 18px' }} onClick={() => setModal({ t: 'memberNew' })}>+ Add member</button>
            </div>
            <DataTable
              getRowKey={row => row.member_id}
              rows={members}
              columns={[
                { key:'member_id',          label:'ID' },
                { key:'first_name',         label:'First Name' },
                { key:'last_name',          label:'Last Name' },
                { key:'email',              label:'Email' },
                { key:'fitness_goal',       label:'Goal' },
                { key:'date_joined',        label:'Joined', render: v => v ? new Date(v).toLocaleDateString() : '—' },
                { key:'device_count',       label:'Devices' },
                { key:'active_subscriptions', label:'Active Subs' },
                { key:'metric_count',       label:'Metrics' },
                actionsCol(
                  row => setModal({ t: 'memberEdit', row }),
                  row => {
                    if (!window.confirm(`Delete member #${row.member_id}? This removes their user account.`)) return;
                    api.delete(`/admin/members/${row.member_id}`).then(() => { toast.success('Member deleted'); loadData(); }).catch(e => toast.error(e.response?.data?.error || 'Delete failed'));
                  }
                ),
              ]}
            />
          </div>
        )}

        {tab === 'Trainers' && (
          <div>
            <div style={{ marginBottom:16 }}>
              <button type="button" style={{ ...btnGhost, border:'none', background:'linear-gradient(135deg,#6c63ff,#00d4aa)', color:'#fff', padding:'10px 18px' }} onClick={() => setModal({ t: 'trainerNew' })}>+ Add trainer</button>
            </div>
            <DataTable
              getRowKey={row => row.trainer_id}
              rows={trainers}
              columns={[
                { key:'trainer_id',     label:'ID' },
                { key:'first_name',     label:'First Name' },
                { key:'last_name',      label:'Last Name' },
                { key:'email',          label:'Email' },
                { key:'specialization', label:'Specialization' },
                { key:'rating',         label:'Rating', render: v => v ? `⭐ ${v}` : '—' },
                { key:'years_of_exp',   label:'Exp (yrs)' },
                { key:'certification',  label:'Cert' },
                { key:'session_count',  label:'Sessions' },
                actionsCol(
                  row => setModal({ t: 'trainerEdit', row }),
                  row => {
                    if (!window.confirm(`Delete trainer #${row.trainer_id}?`)) return;
                    api.delete(`/admin/trainers/${row.trainer_id}`).then(() => { toast.success('Trainer deleted'); loadData(); }).catch(e => toast.error(e.response?.data?.error || 'Delete failed'));
                  }
                ),
              ]}
            />
          </div>
        )}

        {tab === 'Subscriptions' && (
          <div>
            <div style={{ marginBottom:16 }}>
              <button type="button" style={{ ...btnGhost, border:'none', background:'linear-gradient(135deg,#6c63ff,#00d4aa)', color:'#fff', padding:'10px 18px' }} onClick={() => setModal({ t: 'subNew' })} disabled={!members.length}>+ Add subscription</button>
            </div>
            <DataTable
              getRowKey={row => row.sub_id}
              rows={subscriptions}
              columns={[
                { key:'sub_id',       label:'ID' },
                { key:'member_name',  label:'Member' },
                { key:'plan_type',    label:'Plan' },
                { key:'price',        label:'Price', render: v => `$${Number(v).toFixed(2)}` },
                { key:'start_date',   label:'Start', render: v => v ? new Date(v).toLocaleDateString() : '—' },
                { key:'end_date',     label:'End',   render: v => v ? new Date(v).toLocaleDateString() : '—' },
                { key:'status',       label:'Status', render: v => statusBadge(v) },
                { key:'payment_method', label:'Payment' },
                actionsCol(
                  row => setModal({ t: 'subEdit', row }),
                  row => {
                    if (!window.confirm(`Delete subscription #${row.sub_id}? Active subscriptions must be cancelled first.`)) return;
                    api.delete(`/admin/subscriptions/${row.sub_id}`).then(() => { toast.success('Subscription deleted'); loadData(); }).catch(e => toast.error(e.response?.data?.error || 'Delete failed'));
                  }
                ),
              ]}
            />
          </div>
        )}

        {tab === 'Devices' && (
          <div>
            <div style={{ marginBottom:16 }}>
              <button type="button" style={{ ...btnGhost, border:'none', background:'linear-gradient(135deg,#6c63ff,#00d4aa)', color:'#fff', padding:'10px 18px' }} onClick={() => setModal({ t: 'deviceNew' })} disabled={!members.length}>+ Register device</button>
            </div>
            <DataTable
              getRowKey={row => row.device_id}
              rows={devices}
              columns={[
                { key:'device_id',   label:'ID' },
                { key:'member_name', label:'Owner' },
                { key:'device_name', label:'Device' },
                { key:'manufacturer',label:'Brand' },
                { key:'category',    label:'Type', render: v => catBadge(v) },
                { key:'device_spec', label:'Spec' },
                { key:'metric_count',label:'Metrics' },
                actionsCol(
                  row => setModal({ t: 'deviceEdit', row }),
                  row => {
                    if (!window.confirm(`Delete device #${row.device_id}?`)) return;
                    api.delete(`/admin/devices/${row.device_id}`).then(() => { toast.success('Device deleted'); loadData(); }).catch(e => toast.error(e.response?.data?.error || 'Delete failed'));
                  }
                ),
              ]}
            />
          </div>
        )}
      </div>
      {modal ? overlay : null}
    </div>
  );
}
