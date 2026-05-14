import { useNavigate } from 'react-router-dom';

const ROLE_COLORS = { ADMIN:'#6c63ff', TRAINER:'#00d4aa', MEMBER:'#ffd60a' };
const ROLE_ICONS  = { ADMIN:'🛡️', TRAINER:'🏋️', MEMBER:'🧑' };

export default function Navbar({ title }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const color = ROLE_COLORS[user.user_type] || '#6c63ff';

  function logout() {
    localStorage.clear();
    navigate('/login');
  }

  return (
    <nav style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'16px 32px', background:'rgba(255,255,255,0.03)',
      backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.07)',
      position:'sticky', top:0, zIndex:100
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#6c63ff,#00d4aa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>💪</div>
        <div>
          <span style={{ fontWeight:800, fontSize:18, color:'#f0f4ff' }}>FitCore</span>
          <span style={{ marginLeft:10, fontSize:13, color:'#8892b0' }}>/ {title}</span>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ padding:'6px 14px', borderRadius:20, background:`${color}20`, border:`1px solid ${color}40`, fontSize:13, color, fontWeight:600 }}>
          {ROLE_ICONS[user.user_type]} {user.user_type}
        </div>
        <div style={{ fontSize:14, color:'#8892b0' }}>{user.first_name} {user.last_name}</div>
        <button onClick={logout} style={{ padding:'8px 18px', borderRadius:10, border:'1px solid rgba(255,77,109,0.4)', background:'rgba(255,77,109,0.1)', color:'#ff4d6d', cursor:'pointer', fontSize:13, fontWeight:600, transition:'all 0.2s' }}
          onMouseEnter={e=>{ e.target.style.background='rgba(255,77,109,0.2)'; }}
          onMouseLeave={e=>{ e.target.style.background='rgba(255,77,109,0.1)'; }}>
          Logout
        </button>
      </div>
    </nav>
  );
}
