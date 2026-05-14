import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success(`Welcome, ${data.user.first_name}!`);
      const routes = { ADMIN: '/admin', TRAINER: '/trainer', MEMBER: '/member' };
      navigate(routes[data.user.user_type] || '/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'linear-gradient(135deg, #0a0f1e 0%, #0d1b4b 50%, #0a0f1e 100%)',
      position:'relative', overflow:'hidden'
    }}>
      {/* Animated orbs */}
      <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(108,99,255,0.15), transparent)', top:'-100px', left:'-100px', animation:'float 6s ease-in-out infinite' }} />
      <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,212,170,0.1), transparent)', bottom:'-50px', right:'10%', animation:'float 8s ease-in-out infinite reverse' }} />

      <div style={{
        width:'100%', maxWidth:440, padding:'48px', margin:'16px',
        background:'rgba(255,255,255,0.05)', backdropFilter:'blur(20px)',
        borderRadius:24, border:'1px solid rgba(255,255,255,0.1)',
        boxShadow:'0 32px 64px rgba(0,0,0,0.5)'
      }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:64, height:64, borderRadius:16, background:'linear-gradient(135deg,#6c63ff,#00d4aa)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:28 }}>
            💪
          </div>
          <h1 style={{ fontSize:28, fontWeight:800, background:'linear-gradient(135deg,#6c63ff,#00d4aa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>FitCore</h1>
          <p style={{ color:'#8892b0', marginTop:4, fontSize:14 }}>Fitness Management System</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:13, color:'#8892b0', marginBottom:8, fontWeight:500 }}>Email Address</label>
            <input
              type="email" value={email} onChange={e=>setEmail(e.target.value)} required
              placeholder="you@example.com"
              style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#f0f4ff', fontSize:15, outline:'none', transition:'border 0.2s' }}
              onFocus={e=>e.target.style.borderColor='#6c63ff'}
              onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}
            />
          </div>
          <div style={{ marginBottom:28 }}>
            <label style={{ display:'block', fontSize:13, color:'#8892b0', marginBottom:8, fontWeight:500 }}>Password</label>
            <input
              type="password" value={password} onChange={e=>setPassword(e.target.value)} required
              placeholder="••••••••"
              style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#f0f4ff', fontSize:15, outline:'none', transition:'border 0.2s' }}
              onFocus={e=>e.target.style.borderColor='#6c63ff'}
              onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}
            />
          </div>
          <button type="submit" disabled={loading} style={{
            width:'100%', padding:'14px', borderRadius:12, border:'none', cursor:'pointer',
            background: loading ? 'rgba(108,99,255,0.5)' : 'linear-gradient(135deg,#6c63ff,#00d4aa)',
            color:'#fff', fontSize:16, fontWeight:700, transition:'all 0.3s',
            boxShadow: loading ? 'none' : '0 8px 24px rgba(108,99,255,0.4)'
          }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop:24, padding:'16px', background:'rgba(108,99,255,0.08)', borderRadius:12, border:'1px solid rgba(108,99,255,0.15)' }}>
          <p style={{ fontSize:12, color:'#8892b0', marginBottom:8, fontWeight:600 }}>DEMO ACCOUNTS (password: password)</p>
          <p style={{ fontSize:12, color:'#6c63ff' }}>👤 admin@fitcore.com — Admin</p>
          <p style={{ fontSize:12, color:'#00d4aa' }}>🏋️ usman.ahmed@email.com — Trainer</p>
          <p style={{ fontSize:12, color:'#ffd60a' }}>🧑 ali.raza@email.com — Member</p>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
      `}</style>
    </div>
  );
}
