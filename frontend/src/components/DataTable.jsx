export default function DataTable({ columns, rows, emptyMsg = 'No data found.', getRowKey }) {
  if (!rows || rows.length === 0) return (
    <div style={{ textAlign:'center', padding:'40px', color:'#8892b0', fontSize:14 }}>{emptyMsg}</div>
  );
  return (
    <div style={{ overflowX:'auto', borderRadius:12, border:'1px solid rgba(255,255,255,0.07)' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr style={{ background:'rgba(255,255,255,0.04)' }}>
            {columns.map(c => (
              <th key={c.key} style={{ padding:'12px 16px', textAlign:'left', color:'#8892b0', fontWeight:600, fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'1px solid rgba(255,255,255,0.07)', whiteSpace:'nowrap' }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={getRowKey ? getRowKey(row, i) : i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(108,99,255,0.05)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >
              {columns.map(c => (
                <td key={c.key} style={{ padding:'12px 16px', color:'#f0f4ff', whiteSpace:'nowrap' }}>
                  {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
