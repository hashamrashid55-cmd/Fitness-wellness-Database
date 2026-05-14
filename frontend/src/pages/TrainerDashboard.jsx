import { useEffect, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import api from '../api';
import toast from 'react-hot-toast';

const TABS = ['Overview','My Sessions','Workout Plans','Nutrition Plans','Member Health'];

const inputStyle = { width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#f0f4ff', fontSize:14, outline:'none' };
const btnGhost = { padding:'6px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.06)', color:'#f0f4ff', cursor:'pointer', fontSize:12, fontWeight:600 };
const btnDanger = { ...btnGhost, borderColor:'rgba(255,77,109,0.5)', color:'#ff4d6d' };

export default function TrainerDashboard() {
  const [tab, setTab]     = useState('Overview');
  const [profile, setProfile]   = useState({});
  const [sessions, setSessions] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [nutrition, setNutrition] = useState([]);
  const [health, setHealth]     = useState([]);

  const [newSession, setNewSession] = useState({ session_date:'', duration:'', session_type:'STRENGTH', location:'', capacity:1 });
  const [sessionModal, setSessionModal] = useState(null);
  const [editSession, setEditSession] = useState({});

  const [newWorkout, setNewWorkout] = useState({ plan_name:'', difficulty:'Beginner', duration:'', goal_type:'General Fitness', description:'' });
  const [workoutModal, setWorkoutModal] = useState(null);
  const [editWorkout, setEditWorkout] = useState({});

  const [newNutrition, setNewNutrition] = useState({ plan_name:'', calorie_target:'', diet_type:'Balanced', duration_weeks:'', description:'' });
  const [nutritionModal, setNutritionModal] = useState(null);
  const [editNutrition, setEditNutrition] = useState({});

  const loadData = useCallback(async () => {
    try {
      const [p, s, w, n, h] = await Promise.all([
        api.get('/trainer/profile'),
        api.get('/trainer/sessions'),
        api.get('/trainer/workout-plans'),
        api.get('/trainer/nutrition-plans'),
        api.get('/trainer/members-health'),
      ]);
      setProfile(p.data);
      setSessions(s.data);
      setWorkouts(w.data);
      setNutrition(n.data);
      setHealth(h.data);
    } catch {
      toast.error('Failed to load trainer data');
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!sessionModal) return;
    const r = sessionModal;
    setEditSession({
      session_date: r.session_date ? String(r.session_date).slice(0, 10) : '',
      duration: r.duration,
      session_type: r.session_type,
      location: r.location || '',
      capacity: r.capacity,
    });
  }, [sessionModal]);

  useEffect(() => {
    if (!workoutModal) return;
    const r = workoutModal;
    setEditWorkout({
      plan_name: r.plan_name || '',
      difficulty: r.difficulty,
      duration: r.duration,
      goal_type: r.goal_type,
      description: r.description || '',
    });
  }, [workoutModal]);

  useEffect(() => {
    if (!nutritionModal) return;
    const r = nutritionModal;
    setEditNutrition({
      plan_name: r.plan_name || '',
      calorie_target: r.calorie_target ?? '',
      diet_type: r.diet_type,
      duration_weeks: r.duration_weeks,
      description: r.description || '',
    });
  }, [nutritionModal]);

  async function addSession(e) {
    e.preventDefault();
    try {
      await api.post('/trainer/sessions', newSession);
      toast.success('Session created!');
      await loadData();
      setNewSession({ session_date:'', duration:'', session_type:'STRENGTH', location:'', capacity:1 });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create session');
    }
  }

  async function saveSession(e) {
    e.preventDefault();
    if (!sessionModal) return;
    try {
      await api.put(`/trainer/sessions/${sessionModal.session_id}`, {
        session_date: editSession.session_date,
        duration: Number(editSession.duration),
        session_type: editSession.session_type,
        location: editSession.location || null,
        capacity: Number(editSession.capacity) || 1,
      });
      toast.success('Session updated');
      setSessionModal(null);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  }

  async function addWorkout(e) {
    e.preventDefault();
    try {
      await api.post('/trainer/workout-plans', {
        plan_name: newWorkout.plan_name,
        difficulty: newWorkout.difficulty,
        duration: Number(newWorkout.duration),
        goal_type: newWorkout.goal_type,
        description: newWorkout.description || null,
      });
      toast.success('Workout plan created');
      await loadData();
      setNewWorkout({ plan_name:'', difficulty:'Beginner', duration:'', goal_type:'General Fitness', description:'' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  }

  async function saveWorkout(e) {
    e.preventDefault();
    if (!workoutModal) return;
    try {
      await api.put(`/trainer/workout-plans/${workoutModal.plan_id}`, {
        plan_name: editWorkout.plan_name,
        difficulty: editWorkout.difficulty,
        duration: Number(editWorkout.duration),
        goal_type: editWorkout.goal_type,
        description: editWorkout.description || null,
      });
      toast.success('Plan updated');
      setWorkoutModal(null);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  }

  async function addNutrition(e) {
    e.preventDefault();
    try {
      await api.post('/trainer/nutrition-plans', {
        plan_name: newNutrition.plan_name,
        calorie_target: newNutrition.calorie_target === '' ? null : Number(newNutrition.calorie_target),
        diet_type: newNutrition.diet_type,
        duration_weeks: Number(newNutrition.duration_weeks),
        description: newNutrition.description || null,
      });
      toast.success('Nutrition plan created');
      await loadData();
      setNewNutrition({ plan_name:'', calorie_target:'', diet_type:'Balanced', duration_weeks:'', description:'' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  }

  async function saveNutrition(e) {
    e.preventDefault();
    if (!nutritionModal) return;
    try {
      await api.put(`/trainer/nutrition-plans/${nutritionModal.nutrition_plan_id}`, {
        plan_name: editNutrition.plan_name,
        calorie_target: editNutrition.calorie_target === '' ? null : Number(editNutrition.calorie_target),
        diet_type: editNutrition.diet_type,
        duration_weeks: Number(editNutrition.duration_weeks),
        description: editNutrition.description || null,
      });
      toast.success('Plan updated');
      setNutritionModal(null);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0a0f1e 0%,#071a2e 100%)' }}>
      <Navbar title="Trainer Dashboard" />
      <div style={{ padding:'32px' }}>
        <div style={{ display:'flex', gap:8, marginBottom:32, flexWrap:'wrap' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:'10px 22px', borderRadius:12, border:'none', cursor:'pointer', fontWeight:600, fontSize:14, transition:'all 0.2s',
              background: tab===t ? 'linear-gradient(135deg,#00d4aa,#6c63ff)' : 'rgba(255,255,255,0.05)',
              color: tab===t ? '#fff' : '#8892b0',
              boxShadow: tab===t ? '0 4px 16px rgba(0,212,170,0.35)' : 'none'
            }}>{t}</button>
          ))}
        </div>

        {tab === 'Overview' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:20, marginBottom:32 }}>
              <StatCard icon="📅" label="Total Sessions"   value={sessions.length}  color="#00d4aa" />
              <StatCard icon="💪" label="Workout Plans"    value={workouts.length}  color="#6c63ff" />
              <StatCard icon="🥗" label="Nutrition Plans"  value={nutrition.length} color="#ffd60a" />
              <StatCard icon="⭐" label="Rating" value={profile.rating ?? '—'} color="#ff6b6b" />
              <StatCard icon="🏅" label="Experience" value={profile.years_of_exp ? `${profile.years_of_exp} yrs` : '—'} color="#00bcd4" />
            </div>
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:24 }}>
              <h3 style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>👤 My Profile</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
                {[
                  ['Name', `${profile.first_name||''} ${profile.last_name||''}`],
                  ['Email', profile.email],
                  ['Phone', profile.phone || '—'],
                  ['Specialization', profile.specialization || '—'],
                  ['Certification', profile.certification || '—'],
                  ['Bio', profile.bio || '—'],
                ].map(([k,v]) => (
                  <div key={k} style={{ padding:12, background:'rgba(255,255,255,0.03)', borderRadius:10 }}>
                    <div style={{ fontSize:11, color:'#8892b0', fontWeight:600, marginBottom:4 }}>{k.toUpperCase()}</div>
                    <div style={{ fontSize:14, color:'#f0f4ff' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'My Sessions' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, alignItems:'start' }}>
            <div>
              <h3 style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>📅 My Sessions</h3>
              <DataTable
                getRowKey={row => row.session_id}
                rows={sessions}
                columns={[
                  { key:'session_date',  label:'Date', render: v => v ? new Date(v).toLocaleDateString() : '—' },
                  { key:'session_type',  label:'Type' },
                  { key:'duration',      label:'Dur (min)' },
                  { key:'location',      label:'Location' },
                  { key:'capacity',      label:'Cap' },
                  { key:'_a', label:'Actions', render: (_, row) => (
                    <span style={{ display:'flex', gap:8 }}>
                      <button type="button" style={btnGhost} onClick={() => setSessionModal(row)}>Edit</button>
                      <button type="button" style={btnDanger} onClick={async () => {
                        if (!window.confirm('Delete this session?')) return;
                        try {
                          await api.delete(`/trainer/sessions/${row.session_id}`);
                          toast.success('Deleted');
                          await loadData();
                        } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
                      }}>Delete</button>
                    </span>
                  ) },
                ]}
              />
            </div>
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:24 }}>
              <h3 style={{ fontWeight:700, fontSize:16, marginBottom:20 }}>➕ New Session</h3>
              <form onSubmit={addSession} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label style={{ fontSize:12, color:'#8892b0', display:'block', marginBottom:6 }}>Date</label>
                  <input type="date" style={inputStyle} value={newSession.session_date} onChange={e=>setNewSession({...newSession,session_date:e.target.value})} required />
                </div>
                <div>
                  <label style={{ fontSize:12, color:'#8892b0', display:'block', marginBottom:6 }}>Duration (min)</label>
                  <input type="number" style={inputStyle} value={newSession.duration} onChange={e=>setNewSession({...newSession,duration:e.target.value})} required min="1" />
                </div>
                <div>
                  <label style={{ fontSize:12, color:'#8892b0', display:'block', marginBottom:6 }}>Type</label>
                  <select style={inputStyle} value={newSession.session_type} onChange={e=>setNewSession({...newSession,session_type:e.target.value})}>
                    {['STRENGTH','CARDIO','FLEXIBILITY','CORE','FUNCTIONAL','HIIT'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, color:'#8892b0', display:'block', marginBottom:6 }}>Location</label>
                  <input type="text" style={inputStyle} value={newSession.location} onChange={e=>setNewSession({...newSession,location:e.target.value})} placeholder="e.g. Gym Floor A" />
                </div>
                <div>
                  <label style={{ fontSize:12, color:'#8892b0', display:'block', marginBottom:6 }}>Capacity</label>
                  <input type="number" style={inputStyle} value={newSession.capacity} onChange={e=>setNewSession({...newSession,capacity:e.target.value})} min="1" />
                </div>
                <button type="submit" style={{ padding:'12px', borderRadius:10, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#00d4aa,#6c63ff)', color:'#fff', fontWeight:700, fontSize:14 }}>
                  Create Session
                </button>
              </form>
            </div>
          </div>
        )}

        {tab === 'Workout Plans' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, alignItems:'start' }}>
            <div>
              <h3 style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>💪 Workout plans</h3>
              <DataTable
                getRowKey={row => row.plan_id}
                rows={workouts}
                columns={[
                  { key:'plan_name',  label:'Plan Name' },
                  { key:'difficulty', label:'Difficulty' },
                  { key:'duration',   label:'Duration (wks)' },
                  { key:'goal_type',  label:'Goal' },
                  { key:'created_at', label:'Created', render: v => v ? new Date(v).toLocaleDateString() : '—' },
                  { key:'_a', label:'Actions', render: (_, row) => (
                    <span style={{ display:'flex', gap:8 }}>
                      <button type="button" style={btnGhost} onClick={() => setWorkoutModal(row)}>Edit</button>
                      <button type="button" style={btnDanger} onClick={async () => {
                        if (!window.confirm('Delete this workout plan?')) return;
                        try {
                          await api.delete(`/trainer/workout-plans/${row.plan_id}`);
                          toast.success('Deleted');
                          await loadData();
                        } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
                      }}>Delete</button>
                    </span>
                  ) },
                ]}
              />
            </div>
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:24 }}>
              <h3 style={{ fontWeight:700, fontSize:16, marginBottom:20 }}>➕ New workout plan</h3>
              <form onSubmit={addWorkout} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div><label style={{ fontSize:12, color:'#8892b0' }}>Name</label><input style={inputStyle} value={newWorkout.plan_name} onChange={e=>setNewWorkout({...newWorkout,plan_name:e.target.value})} required /></div>
                <div>
                  <label style={{ fontSize:12, color:'#8892b0', display:'block', marginBottom:6 }}>Difficulty</label>
                  <select style={inputStyle} value={newWorkout.difficulty} onChange={e=>setNewWorkout({...newWorkout,difficulty:e.target.value})}>
                    {['Beginner','Intermediate','Advanced','Elite'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize:12, color:'#8892b0' }}>Duration (weeks)</label><input type="number" min="1" style={inputStyle} value={newWorkout.duration} onChange={e=>setNewWorkout({...newWorkout,duration:e.target.value})} required /></div>
                <div>
                  <label style={{ fontSize:12, color:'#8892b0', display:'block', marginBottom:6 }}>Goal</label>
                  <select style={inputStyle} value={newWorkout.goal_type} onChange={e=>setNewWorkout({...newWorkout,goal_type:e.target.value})}>
                    {['Weight Loss','Muscle Gain','Endurance','Flexibility','General Fitness'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize:12, color:'#8892b0' }}>Description</label><textarea style={{ ...inputStyle, minHeight:72 }} value={newWorkout.description} onChange={e=>setNewWorkout({...newWorkout,description:e.target.value})} /></div>
                <button type="submit" style={{ padding:'12px', borderRadius:10, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#00d4aa,#6c63ff)', color:'#fff', fontWeight:700, fontSize:14 }}>Create plan</button>
              </form>
            </div>
          </div>
        )}

        {tab === 'Nutrition Plans' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, alignItems:'start' }}>
            <div>
              <h3 style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>🥗 Nutrition plans</h3>
              <DataTable
                getRowKey={row => row.nutrition_plan_id}
                rows={nutrition}
                columns={[
                  { key:'plan_name',      label:'Plan Name' },
                  { key:'diet_type',      label:'Diet Type' },
                  { key:'calorie_target', label:'Calories', render: v => v ?? '—' },
                  { key:'duration_weeks', label:'Weeks' },
                  { key:'created_at',     label:'Created', render: v => v ? new Date(v).toLocaleDateString() : '—' },
                  { key:'_a', label:'Actions', render: (_, row) => (
                    <span style={{ display:'flex', gap:8 }}>
                      <button type="button" style={btnGhost} onClick={() => setNutritionModal(row)}>Edit</button>
                      <button type="button" style={btnDanger} onClick={async () => {
                        if (!window.confirm('Delete this nutrition plan?')) return;
                        try {
                          await api.delete(`/trainer/nutrition-plans/${row.nutrition_plan_id}`);
                          toast.success('Deleted');
                          await loadData();
                        } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
                      }}>Delete</button>
                    </span>
                  ) },
                ]}
              />
            </div>
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:24 }}>
              <h3 style={{ fontWeight:700, fontSize:16, marginBottom:20 }}>➕ New nutrition plan</h3>
              <form onSubmit={addNutrition} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div><label style={{ fontSize:12, color:'#8892b0' }}>Name</label><input style={inputStyle} value={newNutrition.plan_name} onChange={e=>setNewNutrition({...newNutrition,plan_name:e.target.value})} required /></div>
                <div>
                  <label style={{ fontSize:12, color:'#8892b0', display:'block', marginBottom:6 }}>Diet type</label>
                  <select style={inputStyle} value={newNutrition.diet_type} onChange={e=>setNewNutrition({...newNutrition,diet_type:e.target.value})}>
                    {['Keto','Vegan','Paleo','Mediterranean','High Protein','Balanced'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize:12, color:'#8892b0' }}>Calorie target (optional)</label><input type="number" min="1" style={inputStyle} value={newNutrition.calorie_target} onChange={e=>setNewNutrition({...newNutrition,calorie_target:e.target.value})} /></div>
                <div><label style={{ fontSize:12, color:'#8892b0' }}>Duration (weeks)</label><input type="number" min="1" style={inputStyle} value={newNutrition.duration_weeks} onChange={e=>setNewNutrition({...newNutrition,duration_weeks:e.target.value})} required /></div>
                <div><label style={{ fontSize:12, color:'#8892b0' }}>Description</label><textarea style={{ ...inputStyle, minHeight:72 }} value={newNutrition.description} onChange={e=>setNewNutrition({...newNutrition,description:e.target.value})} /></div>
                <button type="submit" style={{ padding:'12px', borderRadius:10, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#00d4aa,#6c63ff)', color:'#fff', fontWeight:700, fontSize:14 }}>Create plan</button>
              </form>
            </div>
          </div>
        )}

        {tab === 'Member Health' && (
          <DataTable
            getRowKey={row => `${row.metric_id}-${row.measured_at}`}
            rows={health}
            columns={[
              { key:'member_name',  label:'Member' },
              { key:'metric_type',  label:'Metric' },
              { key:'value',        label:'Value' },
              { key:'unit',         label:'Unit' },
              { key:'measured_at',  label:'Measured At', render: v => v ? new Date(v).toLocaleString() : '—' },
            ]}
          />
        )}
      </div>

      {sessionModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(5,8,20,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 }} onClick={() => setSessionModal(null)}>
          <div style={{ width:'min(400px,100%)', background:'linear-gradient(160deg,#12182c,#0a0f1e)', border:'1px solid rgba(0,212,170,0.25)', borderRadius:16, padding:24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom:16, fontWeight:700, color:'#f0f4ff' }}>Edit session</h3>
            <form onSubmit={saveSession} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div><label style={{ fontSize:12, color:'#8892b0' }}>Date</label><input type="date" style={inputStyle} value={editSession.session_date} onChange={e=>setEditSession({...editSession,session_date:e.target.value})} required /></div>
              <div><label style={{ fontSize:12, color:'#8892b0' }}>Duration (min)</label><input type="number" min="1" style={inputStyle} value={editSession.duration} onChange={e=>setEditSession({...editSession,duration:e.target.value})} required /></div>
              <div>
                <label style={{ fontSize:12, color:'#8892b0' }}>Type</label>
                <select style={inputStyle} value={editSession.session_type} onChange={e=>setEditSession({...editSession,session_type:e.target.value})}>
                  {['STRENGTH','CARDIO','FLEXIBILITY','CORE','FUNCTIONAL','HIIT'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize:12, color:'#8892b0' }}>Location</label><input style={inputStyle} value={editSession.location} onChange={e=>setEditSession({...editSession,location:e.target.value})} /></div>
              <div><label style={{ fontSize:12, color:'#8892b0' }}>Capacity</label><input type="number" min="1" style={inputStyle} value={editSession.capacity} onChange={e=>setEditSession({...editSession,capacity:e.target.value})} /></div>
              <div style={{ display:'flex', gap:10, marginTop:8, justifyContent:'flex-end' }}>
                <button type="button" style={btnGhost} onClick={() => setSessionModal(null)}>Cancel</button>
                <button type="submit" style={{ ...btnGhost, border:'none', background:'linear-gradient(135deg,#00d4aa,#6c63ff)', color:'#fff' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {workoutModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(5,8,20,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 }} onClick={() => setWorkoutModal(null)}>
          <div style={{ width:'min(420px,100%)', background:'linear-gradient(160deg,#12182c,#0a0f1e)', border:'1px solid rgba(108,99,255,0.25)', borderRadius:16, padding:24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom:16, fontWeight:700, color:'#f0f4ff' }}>Edit workout plan</h3>
            <form onSubmit={saveWorkout} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div><label style={{ fontSize:12, color:'#8892b0' }}>Name</label><input style={inputStyle} value={editWorkout.plan_name} onChange={e=>setEditWorkout({...editWorkout,plan_name:e.target.value})} required /></div>
              <div>
                <label style={{ fontSize:12, color:'#8892b0' }}>Difficulty</label>
                <select style={inputStyle} value={editWorkout.difficulty} onChange={e=>setEditWorkout({...editWorkout,difficulty:e.target.value})}>
                  {['Beginner','Intermediate','Advanced','Elite'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize:12, color:'#8892b0' }}>Duration (weeks)</label><input type="number" min="1" style={inputStyle} value={editWorkout.duration} onChange={e=>setEditWorkout({...editWorkout,duration:e.target.value})} required /></div>
              <div>
                <label style={{ fontSize:12, color:'#8892b0' }}>Goal</label>
                <select style={inputStyle} value={editWorkout.goal_type} onChange={e=>setEditWorkout({...editWorkout,goal_type:e.target.value})}>
                  {['Weight Loss','Muscle Gain','Endurance','Flexibility','General Fitness'].map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize:12, color:'#8892b0' }}>Description</label><textarea style={{ ...inputStyle, minHeight:72 }} value={editWorkout.description} onChange={e=>setEditWorkout({...editWorkout,description:e.target.value})} /></div>
              <div style={{ display:'flex', gap:10, marginTop:8, justifyContent:'flex-end' }}>
                <button type="button" style={btnGhost} onClick={() => setWorkoutModal(null)}>Cancel</button>
                <button type="submit" style={{ ...btnGhost, border:'none', background:'linear-gradient(135deg,#00d4aa,#6c63ff)', color:'#fff' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {nutritionModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(5,8,20,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 }} onClick={() => setNutritionModal(null)}>
          <div style={{ width:'min(420px,100%)', background:'linear-gradient(160deg,#12182c,#0a0f1e)', border:'1px solid rgba(255,214,10,0.25)', borderRadius:16, padding:24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom:16, fontWeight:700, color:'#f0f4ff' }}>Edit nutrition plan</h3>
            <form onSubmit={saveNutrition} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div><label style={{ fontSize:12, color:'#8892b0' }}>Name</label><input style={inputStyle} value={editNutrition.plan_name} onChange={e=>setEditNutrition({...editNutrition,plan_name:e.target.value})} required /></div>
              <div>
                <label style={{ fontSize:12, color:'#8892b0' }}>Diet type</label>
                <select style={inputStyle} value={editNutrition.diet_type} onChange={e=>setEditNutrition({...editNutrition,diet_type:e.target.value})}>
                  {['Keto','Vegan','Paleo','Mediterranean','High Protein','Balanced'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize:12, color:'#8892b0' }}>Calorie target</label><input type="number" min="1" style={inputStyle} value={editNutrition.calorie_target} onChange={e=>setEditNutrition({...editNutrition,calorie_target:e.target.value})} /></div>
              <div><label style={{ fontSize:12, color:'#8892b0' }}>Duration (weeks)</label><input type="number" min="1" style={inputStyle} value={editNutrition.duration_weeks} onChange={e=>setEditNutrition({...editNutrition,duration_weeks:e.target.value})} required /></div>
              <div><label style={{ fontSize:12, color:'#8892b0' }}>Description</label><textarea style={{ ...inputStyle, minHeight:72 }} value={editNutrition.description} onChange={e=>setEditNutrition({...editNutrition,description:e.target.value})} /></div>
              <div style={{ display:'flex', gap:10, marginTop:8, justifyContent:'flex-end' }}>
                <button type="button" style={btnGhost} onClick={() => setNutritionModal(null)}>Cancel</button>
                <button type="submit" style={{ ...btnGhost, border:'none', background:'linear-gradient(135deg,#00d4aa,#6c63ff)', color:'#fff' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
