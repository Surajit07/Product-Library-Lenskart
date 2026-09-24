import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';

export default function App() {
  const [data, setData] = useState([]);
  const [pidQuery, setPidQuery] = useState('');
  const [modelQuery, setModelQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Autocomplete suggestion states
  const [pidSuggestions, setPidSuggestions] = useState([]);
  const [modelSuggestions, setModelSuggestions] = useState([]);
  const [showPidDropdown, setShowPidDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const pidRef = useRef(null);
  const modelRef = useRef(null);

  useEffect(() => {
    const csvUrl = `${import.meta.env.BASE_URL}Master_Data.csv`;

    fetch(csvUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`File not found at ${csvUrl}`);
        return res.text();
      })
      .then((csvText) => {
        if (csvText.trim().startsWith('<!DOCTYPE') || csvText.trim().startsWith('<html')) {
          throw new Error('Server returned HTML instead of CSV.');
        }

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim(),
          complete: (res) => {
            const cleanRows = (res.data || []).map((row) => {
              const cleaned = {};
              Object.keys(row).forEach((key) => {
                cleaned[key.trim()] = typeof row[key] === 'string' ? row[key].trim() : row[key];
              });
              return cleaned;
            });
            setData(cleanRows);
            setLoading(false);
          },
          error: () => {
            setErrorMsg('Error parsing CSV.');
            setLoading(false);
          }
        });
      })
      .catch((err) => {
        setErrorMsg(err.message);
        setLoading(false);
      });
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (pidRef.current && !pidRef.current.contains(e.target)) setShowPidDropdown(false);
      if (modelRef.current && !modelRef.current.contains(e.target)) setShowModelDropdown(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // PID input change & suggestion builder
  const handlePidInput = (val) => {
    setPidQuery(val);
    if (!val.trim()) {
      setPidSuggestions([]);
      setShowPidDropdown(false);
      setResults([]);
      return;
    }

    const trimmed = val.trim().toLowerCase();
    // Unique matching PIDs
    const matched = Array.from(
      new Set(
        data
          .filter((r) => String(r['PID'] || '').toLowerCase().includes(trimmed))
          .map((r) => ({ pid: r['PID'], model: r['Model No'] }))
      )
    ).slice(0, 8); // Top 8 suggestions

    setPidSuggestions(matched);
    setShowPidDropdown(matched.length > 0);

    // Exact match direct display
    const exact = data.filter((r) => String(r['PID'] || '').toLowerCase() === trimmed);
    setResults(exact);
    if (exact.length > 0) {
      setModelQuery(exact[0]['Model No'] || '');
    }
  };

  // Model input change & suggestion builder
  const handleModelInput = (val) => {
    setModelQuery(val);
    if (!val.trim()) {
      setModelSuggestions([]);
      setShowModelDropdown(false);
      setResults([]);
      return;
    }

    const trimmed = val.trim().toLowerCase();
    // Unique matching Model Numbers
    const matched = Array.from(
      new Set(
        data
          .filter((r) => String(r['Model No'] || '').toLowerCase().includes(trimmed))
          .map((r) => r['Model No'])
      )
    ).slice(0, 8); // Top 8 suggestions

    setModelSuggestions(matched);
    setShowModelDropdown(matched.length > 0);

    // Show all records containing the model query
    const exact = data.filter((r) => String(r['Model No'] || '').toLowerCase() === trimmed);
    setResults(exact);
    if (exact.length === 1) {
      setPidQuery(exact[0]['PID'] || '');
    } else {
      setPidQuery('');
    }
  };

  // Select handlers from dropdown click
  const selectPid = (item) => {
    setPidQuery(item.pid);
    setShowPidDropdown(false);
    const matched = data.filter((r) => String(r['PID'] || '') === String(item.pid));
    setResults(matched);
    if (matched.length > 0) setModelQuery(matched[0]['Model No'] || '');
  };

  const selectModel = (model) => {
    setModelQuery(model);
    setShowModelDropdown(false);
    const matched = data.filter((r) => String(r['Model No'] || '').toLowerCase() === model.toLowerCase());
    setResults(matched);
    if (matched.length === 1) {
      setPidQuery(matched[0]['PID'] || '');
    } else {
      setPidQuery('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f19', color: '#f8fafc', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        
        {/* Title */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            Frame Technical Catalog
          </h1>
          <p style={{ color: '#38bdf8', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>
            {loading ? 'Initializing dataset...' : `Dataset Active (${data.length} frames indexed)`}
          </p>
        </div>

        {/* Search Panel */}
        <div style={{ background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          
          {/* PID Input with Dropdown */}
          <div ref={pidRef} style={{ position: 'relative' }}>
            <label style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Search PID
            </label>
            <input
              type="text"
              placeholder="Type e.g. 1, 9, 204..."
              value={pidQuery}
              onChange={(e) => handlePidInput(e.target.value)}
              onFocus={() => pidSuggestions.length > 0 && setShowPidDropdown(true)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 6, background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
            />
            {showPidDropdown && pidSuggestions.length > 0 && (
              <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#182238', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 6, margin: '4px 0 0 0', padding: 0, listStyle: 'none', zIndex: 50, maxHeight: 220, overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                {pidSuggestions.map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => selectPid(item)}
                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#2563eb')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontWeight: 700, color: '#f59e0b' }}>{item.pid}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{item.model}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Model No Input with Dropdown */}
          <div ref={modelRef} style={{ position: 'relative' }}>
            <label style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Search Model No
            </label>
            <input
              type="text"
              placeholder="Type e.g. VC, 5158, LB..."
              value={modelQuery}
              onChange={(e) => handleModelInput(e.target.value)}
              onFocus={() => modelSuggestions.length > 0 && setShowModelDropdown(true)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 6, background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
            />
            {showModelDropdown && modelSuggestions.length > 0 && (
              <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#182238', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 6, margin: '4px 0 0 0', padding: 0, listStyle: 'none', zIndex: 50, maxHeight: 220, overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                {modelSuggestions.map((model, idx) => (
                  <li
                    key={idx}
                    onClick={() => selectModel(model)}
                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13, fontWeight: 600 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#2563eb')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {model}
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>

        {/* Results Container */}
        <div style={{ marginTop: 20 }}>
          {loading && <p style={{ color: '#64748b', textAlign: 'center', fontSize: 13 }}>Loading master records...</p>}
          {errorMsg && <p style={{ color: '#ef4444', textAlign: 'center', fontSize: 13 }}>{errorMsg}</p>}

          {!loading && !errorMsg && results.length === 0 && (
            <p style={{ color: '#64748b', textAlign: 'center', marginTop: 40, fontSize: 13 }}>
              Type any number or letter to view suggestions.
            </p>
          )}

          {results.map((r, i) => (
            <div key={i} style={{ background: '#131b2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 18, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{r['Model No'] || '-'}</h2>
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>{r['Brand'] || '-'} &bull; {r['Shape'] || '-'}</span>
                </div>
                <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '3px 8px', borderRadius: 6, fontWeight: 600, fontSize: 12 }}>
                  PID: {r['PID'] || '-'}
                </span>
              </div>

              <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ color: '#38bdf8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Box Dimensions</span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>
                  {(r['A Width (mm)'] || '-')} □ {(r['DBL (mm)'] || '-')} - {(r['Temple Length (mm)'] || '-')} (B: {r['B Height (mm)'] || '-'}mm)
                </span>
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
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{r['Lens Code'] || '-'} ({r['Lens tint color'] || '-'})</div>
                </div>
                <div style={{ background: '#182238', padding: 8, borderRadius: 6 }}>
                  <div style={{ fontSize: 9.5, color: '#94a3b8', textTransform: 'uppercase' }}>Tip Code</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2, color: '#38bdf8' }}>{r['Tip Code'] || '-'}</div>
                </div>
                <div style={{ background: '#182238', padding: 8, borderRadius: 6 }}>
                  <div style={{ fontSize: 9.5, color: '#94a3b8', textTransform: 'uppercase' }}>Tips Shape & Color</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{r['Tips Shape'] || '-'} / {r['Tips color'] || '-'}</div>
                </div>
                <div style={{ background: '#182238', padding: 8, borderRadius: 6 }}>
                  <div style={{ fontSize: 9.5, color: '#94a3b8', textTransform: 'uppercase' }}>Inhouse Model</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{r['Inhouse model no.'] || '-'}</div>
                </div>
                <div style={{ background: '#182238', padding: 8, borderRadius: 6 }}>
                  <div style={{ fontSize: 9.5, color: '#94a3b8', textTransform: 'uppercase' }}>Size</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{r['Size'] || '-'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}