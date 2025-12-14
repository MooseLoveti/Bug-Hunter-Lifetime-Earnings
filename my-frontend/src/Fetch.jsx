import React, { useState, useEffect } from "react";
import "./Fetch.css";

const buildMonthlySeries = (info) => {
  if (!info?.bounty?.length) return [];
  const buckets = {};
  info.bounty.forEach((amt, idx) => {
    const published = info.published?.[idx];
    const value = Number(amt) || 0;
    const date = published ? new Date(published) : null;
    if (!date || Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    buckets[key] = (buckets[key] || 0) + value;
  });
  return Object.entries(buckets)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

const Chart = ({ series }) => {
  if (!series?.length) return <div className="muted">No bounty data</div>;

  const paddedSeries = (() => {
    if (!series.length) return [];
    const [y, m] = series[0].month.split("-").map(Number);
    const prev = new Date(y, m - 2, 1);
    const pad = {
      month: `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`,
      total: 0,
    };
    return [pad, ...series];
  })();

  const width = 480;
  const height = 220;
  const padding = 32;
  const maxY = Math.max(...paddedSeries.map((p) => p.total), 1);
  const step =
    paddedSeries.length > 1 ? (width - padding * 2) / (paddedSeries.length - 1) : 0;
  const points = paddedSeries.map((p, idx) => {
    const x = padding + step * idx;
    const y =
      height - padding - (p.total / maxY) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Monthly bounty chart">
        <polyline
          fill="none"
          stroke="url(#grad)"
          strokeWidth="3"
          points={points.join(" ")}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        {paddedSeries.map((p, idx) => {
          const x = padding + step * idx;
          const y =
            height - padding - (p.total / maxY) * (height - padding * 2);
          const labelDx = idx === 0 ? 10 : 0;
          const labelAnchor = idx === 0 ? "start" : "middle";
          const showValue = idx !== 0;
          return (
            <g key={p.month}>
              <circle cx={x} cy={y} r="4.5" fill="#fff" stroke="#6366f1" strokeWidth="2" />
              <text x={x} y={height - 10} textAnchor="middle" className="axis">
                {p.month.slice(2)}
              </text>
              {showValue && (
                <text
                  x={x + labelDx}
                  y={y - 10}
                  textAnchor={labelAnchor}
                  className="label"
                >
                  ${p.total.toLocaleString()}
                </text>
              )}
            </g>
          );
        })}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#d1d5db"
          strokeWidth="1.5"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#d1d5db"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
};

const Fetch = () => {
  const [name, setName] = useState("");
  const [query, setQuery] = useState(null);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (!query) return;
    const fetchData = async () => {
      setStatus("loading");
      try {
        const res = await fetch(
          `http://localhost:5000/?name=${encodeURIComponent(query)}`
        );
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "request failed");
        }
        setData(json);
        setStatus("idle");
      } catch (err) {
        setStatus("error");
        setData({ error: err.message });
      }
    };
    fetchData();
  }, [query]);

  return (
    <div className="container">
      <div className="form-row">
        <label className="label">
          Researcher name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Hoge Hoge"
          />
        </label>
        <button
          className="primary"
          onClick={() => setQuery(name.trim())}
          disabled={!name.trim()}
        >
          Fetch
        </button>
      </div>
      <div className="results">
        {status === "loading" && <div className="muted">Loading...</div>}
        {status === "error" && <div className="error">{data?.error}</div>}
        {status === "idle" && data && !data.error && (
          <div className="cards">
            {Object.entries(data).map(([researcher, info]) => (
              <section key={researcher} className="card">
                <div className="card-header">
                  <h1>{researcher}</h1>
                  <h2>Total bounty: ${info.total.toLocaleString()}</h2>
                </div>
                <Chart series={buildMonthlySeries(info)} />
                <ul className="list">
                  {info.urls.map((url, idx) => {
                    const cve = info.title[idx];
                    return (
                      <li key={`${url}-${idx}`}>
                        <a href={url} target="_blank" rel="noreferrer">
                          {cve}
                        </a>{" "}
                        - ${info.bounty[idx]} (published: {info.published[idx]})
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
        {status === "idle" && data?.error && (
          <div className="error">{data.error}</div>
        )}
      </div>
    </div>
  );
};

export default Fetch;
