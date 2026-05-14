export default function StatCard({ icon, label, value, color = '#6c63ff', sub }) {
  return (
    <div style={{
      background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
      borderRadius:16, padding:'24px', position:'relative', overflow:'hidden',
      transition:'transform 0.2s, box-shadow 0.2s', cursor:'default'
    }}
      onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 12px 32px ${color}25`; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
    >
      <div style={{ position:'absolute', top:0, left:0, width:4, height:'100%', background:`linear-gradient(to bottom, ${color}, transparent)` }} />
      <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:32, fontWeight:800, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:13, color:'#8892b0', marginTop:6, fontWeight:500 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:'#6c63ff', marginTop:4 }}>{sub}</div>}
    </div>
  );
}
