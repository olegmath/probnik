export function pill(label, active, onClick, color = 'var(--black)') {
  return (
    <button key={label} onClick={onClick} style={{ border: `2px solid ${active ? color : 'var(--border)'}`, background: active ? color : 'var(--white)', color: active ? 'var(--white)' : 'var(--black)', borderRadius: 100, padding: '5px 14px', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', transition: 'all 0.15s' }}>{label}</button>
  );
}

export function Sel({ label, value, onChange, options, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {label && <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)' }}>{label}</div>}
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ height: 36, padding: '0 10px', border: '2px solid var(--border)', borderRadius: 8, fontSize: 13, fontFamily: 'Inter', fontWeight: 700, color: 'var(--black)', background: 'var(--white)', outline: 'none', cursor: 'pointer', minWidth: 180 }}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export function Th({ children, right }) {
  return <th style={{ padding: '8px 10px', textAlign: right ? 'right' : 'left', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--black)', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap', background: '#f8f8f8' }}>{children}</th>;
}

export function Td({ children, right, mono, bold }) {
  return <td style={{ padding: '8px 10px', textAlign: right ? 'right' : 'left', fontWeight: bold ? 900 : 600, fontSize: mono ? 13 : 12, fontVariantNumeric: mono ? 'tabular-nums' : 'normal', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{children}</td>;
}
