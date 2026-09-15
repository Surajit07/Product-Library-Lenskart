import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

export default function App() {
  const [data, setData] = useState([]);
  const [pidQuery, setPidQuery] = useState('');
  const [modelQuery, setModelQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    // Uses Vite's base path and exact filename
    const filePath = `${import.meta.env.BASE_URL}Master_Data.csv`;

    fetch(filePath)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load CSV: ${res.status} ${res.statusText}`);
        }
        return res.text();
      })
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (parsed) => {
            console.log("Loaded records count:", parsed.data.length);
            console.log("Sample row:", parsed.data[0]);
            setData(parsed.data);
            setLoading(false);
          },
          error: (err) => {
            console.error("CSV parse error:", err);
            setErrorMsg("Error parsing CSV data.");
            setLoading(false);
          }
        });
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setErrorMsg(err.message);
        setLoading(false);
      });
  }, []);

  const handlePidSearch = (val) => {
    setPidQuery(val);
    if (!val.trim()) {
      setResults([]);
      return;
    }
    const filtered = data.filter(
      r => String(r['PID'] || '').trim().toLowerCase() === val.trim().toLowerCase()
    );
    setResults(filtered);
    if (filtered.length > 0) {
      setModelQuery(filtered[0]['Model No'] || '');
    }
  };

  const handleModelSearch = (val) => {
    setModelQuery(val);
    if (!val.trim()) {
      setResults([]);
      return;
    }
    const filtered = data.filter(
      r => String(r['Model No'] || '').trim().toLowerCase() === val.trim().toLowerCase()
    );
    setResults(filtered);
    if (filtered.length === 1) {
      setPidQuery(filtered[0]['PID'] || '');
    } else {
      setPidQuery('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f19', color: '#f8fafc', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px', margin: '0 0 4px 0' }}>Frame Technical Catalog</h1>
        <p style={{ color: '#38bdf8', fontSize: 13, fontWeight: 600, margin: '0 0 20px 0' }}>Local Dataset ({data.length} frames indexed)</p>

        {/* Search Panel */}
        <div style={{ background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>Search PID</label>
            <input
              type="text"
              placeholder="e.g. 93668"
              value={pidQuery}
              onChange={(e) => handlePidSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 6, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>Search Model No</label>
            <input
              type="text"
              placeholder="e.g. VC 5158/P"
              value={modelQuery}
              onChange={(e) => handleModelSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 6, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Status / Errors */}
        <div style={{ marginTop: 20 }}>
          {loading && <p style={{ color: '#64748b', textAlign: 'center', fontSize: 13 }}>Loading master records...</p>}
          {errorMsg && <p style={{ color: '#ef4444', textAlign: 'center', fontSize: 13 }}>Error: {errorMsg}</p>}
          
          {!loading && !errorMsg && results.length === 0 && (
            <p style={{ color: '#64748b', textAlign: 'center', marginTop: 40, fontSize: 13 }}>
              {data.length > 0 ? "Type a PID or Model Number to view technical details." : "No records found in CSV file."}
            </p>
          )}

          {results.map((r, i) => (
            <div key={i} style={{ background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 18, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{r['Model No']}</h2>
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>{r['Brand']} &bull; {r['Shape']}</span>
                </div>
                <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '3px 8px', borderRadius: 6, fontWeight: 600, fontSize: 12 }}>
                  PID: {r['PID']}
                </span>
              </div>

              <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ color: '#38bdf8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Box Dimensions</span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{r['A Width (mm)']} □ {r['DBL (mm)']} - {r['Temple Length (mm)']} (B: {r['B Height (mm)']}mm)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
                <div style={{ background: '#182238', padding: 8, borderRadius: 6 }}>
                  <div style={{ fontSize: 9.5, color: '#94a3b8', textTransform: 'uppercase' }}>Plating Color</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{r['Plating Color'] || '-'}</div>
                </div>
                <div style={{ background: '#182238', padding: 8, borderRadius: 6 }}>
                  <div style={{ fontSize: 9.5, color: '#94a3b8', textTransform: 'uppercase' }}>Paint Color</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{r['Paint Color'] || '-'}</div>
                </div>
                <div style={{ background: '#182238', padding: 8, borderRadius: 6 }}>
                  <div style={{ fontSize: 9.5, color: '#94a3b8', textTransform: 'uppercase' }}>Lens Tint / Code</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{r['Lens Code']} ({r['Lens tint color']})</div>
                </div>
                <div style={{ background: '#182238', padding: 8, borderRadius: 6 }}>
                  <div style={{ fontSize: 9.5, color: '#94a3b8', textTransform: 'uppercase' }}>Tip Code</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2, color: '#38bdf8' }}>{r['Tip Code'] || '-'}</div>
                </div>
                <div style={{ background: '#182238', padding: 8, borderRadius: 6 }}>
                  <div style={{ fontSize: 9.5, color: '#94a3b8', textTransform: 'uppercase' }}>Tips Shape & Color</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{r['Tips Shape']} / {r['Tips color']}</div>
                </div>
                <div style={{ background: '#182238', padding: 8, borderRadius: 6 }}>
                  <div style={{ fontSize: 9.5, color: '#94a3b8', textTransform: 'uppercase' }}>Inhouse Model</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{r['Inhouse model no.'] || '-'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}