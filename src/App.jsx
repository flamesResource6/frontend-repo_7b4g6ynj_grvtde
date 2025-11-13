import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function FormSection({ onCreated }) {
  const [form, setForm] = useState({
    scenario: 'dry',
    site_name: '',
    lat: '',
    lon: '',
    collected_at: '',
    ph: '',
    dissolved_oxygen_mg_l: '',
    turbidity_ntu: '',
    metals_mg_l: '{}',
    notes: ''
  })

  const setNow = () => {
    const now = new Date().toISOString()
    setForm(f => ({ ...f, collected_at: now }))
  }

  const getLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(pos => {
      setForm(f => ({ ...f, lat: pos.coords.latitude.toFixed(6), lon: pos.coords.longitude.toFixed(6) }))
    })
  }

  const submit = async (e) => {
    e.preventDefault()
    try {
      const body = {
        scenario: form.scenario,
        site_name: form.site_name || null,
        collected_at: new Date(form.collected_at).toISOString(),
        location: { lat: parseFloat(form.lat), lon: parseFloat(form.lon) },
        ph: form.ph === '' ? null : parseFloat(form.ph),
        dissolved_oxygen_mg_l: form.dissolved_oxygen_mg_l === '' ? null : parseFloat(form.dissolved_oxygen_mg_l),
        turbidity_ntu: form.turbidity_ntu === '' ? null : parseFloat(form.turbidity_ntu),
        metals_mg_l: (() => { try { const d = JSON.parse(form.metals_mg_l); return d } catch { return null } })(),
        notes: form.notes || null,
        files: null
      }
      const res = await fetch(`${API_BASE}/samples`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed')
      onCreated?.(data)
      alert('Sample saved')
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Scenario</label>
          <select className="mt-1 w-full border rounded p-2" value={form.scenario} onChange={e => setForm(f => ({ ...f, scenario: e.target.value }))}>
            <option value="dry">Dry</option>
            <option value="monsoon">Monsoon</option>
            <option value="upstream">Upstream</option>
            <option value="downstream">Downstream</option>
            <option value="industrial">Industrial</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Site name</label>
          <input className="mt-1 w-full border rounded p-2" value={form.site_name} onChange={e => setForm(f => ({ ...f, site_name: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium">Latitude</label>
          <div className="flex gap-2">
            <input className="mt-1 w-full border rounded p-2" value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} />
            <button type="button" onClick={getLocation} className="mt-1 px-3 py-2 bg-slate-100 rounded">Use GPS</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Longitude</label>
          <input className="mt-1 w-full border rounded p-2" value={form.lon} onChange={e => setForm(f => ({ ...f, lon: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium">Collected at (ISO)</label>
          <div className="flex gap-2">
            <input className="mt-1 w-full border rounded p-2" value={form.collected_at} onChange={e => setForm(f => ({ ...f, collected_at: e.target.value }))} />
            <button type="button" onClick={setNow} className="mt-1 px-3 py-2 bg-slate-100 rounded">Now</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">pH</label>
          <input type="number" step="0.01" className="mt-1 w-full border rounded p-2" value={form.ph} onChange={e => setForm(f => ({ ...f, ph: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium">Dissolved Oxygen (mg/L)</label>
          <input type="number" step="0.01" className="mt-1 w-full border rounded p-2" value={form.dissolved_oxygen_mg_l} onChange={e => setForm(f => ({ ...f, dissolved_oxygen_mg_l: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium">Turbidity (NTU)</label>
          <input type="number" step="0.01" className="mt-1 w-full border rounded p-2" value={form.turbidity_ntu} onChange={e => setForm(f => ({ ...f, turbidity_ntu: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium">Metals (JSON, mg/L)</label>
          <textarea rows={2} className="mt-1 w-full border rounded p-2" placeholder='{"Pb": 0.01, "Hg": 0.001}' value={form.metals_mg_l} onChange={e => setForm(f => ({ ...f, metals_mg_l: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium">Notes</label>
          <textarea rows={2} className="mt-1 w-full border rounded p-2" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </div>
      <div className="flex justify-end">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Save sample</button>
      </div>
    </form>
  )
}

function SamplesTable({ refreshKey, scenario }) {
  const [data, setData] = useState({ items: [], count: 0 })
  useEffect(() => {
    const url = new URL(`${API_BASE}/samples`)
    if (scenario) url.searchParams.set('scenario', scenario)
    fetch(url).then(r => r.json()).then(setData)
  }, [refreshKey, scenario])

  return (
    <div className="overflow-auto border rounded">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left">Scenario</th>
            <th className="px-3 py-2 text-left">Site</th>
            <th className="px-3 py-2 text-left">Time</th>
            <th className="px-3 py-2 text-left">Lat</th>
            <th className="px-3 py-2 text-left">Lon</th>
            <th className="px-3 py-2 text-left">pH</th>
            <th className="px-3 py-2 text-left">DO</th>
            <th className="px-3 py-2 text-left">Turb</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="px-3 py-1">{s.scenario}</td>
              <td className="px-3 py-1">{s.site_name}</td>
              <td className="px-3 py-1">{new Date(s.collected_at).toLocaleString()}</td>
              <td className="px-3 py-1">{s.location?.lat}</td>
              <td className="px-3 py-1">{s.location?.lon}</td>
              <td className="px-3 py-1">{s.ph ?? '-'}</td>
              <td className="px-3 py-1">{s.dissolved_oxygen_mg_l ?? '-'}</td>
              <td className="px-3 py-1">{s.turbidity_ntu ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Summaries({ refreshKey }) {
  const [items, setItems] = useState([])
  useEffect(() => { fetch(`${API_BASE}/summaries`).then(r => r.json()).then(setItems) }, [refreshKey])
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      {items.map((s) => (
        <div key={s.scenario} className="border rounded p-3">
          <div className="font-semibold">{s.scenario}</div>
          <div className="text-xs text-slate-500">{s.count} samples</div>
          <div className="mt-2 text-sm">avg pH: {s.avg_ph?.toFixed?.(2) ?? '-'}</div>
          <div className="text-sm">avg DO: {s.avg_do?.toFixed?.(2) ?? '-'}</div>
          <div className="text-sm">avg Turb: {s.avg_turbidity?.toFixed?.(2) ?? '-'}</div>
        </div>
      ))}
    </div>
  )
}

function ClusterSection({ scenario }) {
  const [result, setResult] = useState(null)
  const run = async () => {
    const res = await fetch(`${API_BASE}/cluster`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario, k: 3 }) })
    const data = await res.json()
    setResult(data)
  }
  return (
    <div className="space-y-2">
      <button onClick={run} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded">Run clustering</button>
      {result && (
        <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded overflow-auto">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  )
}

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [scenario, setScenario] = useState('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Water Quality Dashboard</h1>
            <p className="text-slate-600">Capture samples, view summaries, and run clustering across scenarios.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Scenario filter:</label>
            <select className="border rounded p-2" value={scenario} onChange={e => setScenario(e.target.value)}>
              <option value="">All</option>
              <option value="dry">Dry</option>
              <option value="monsoon">Monsoon</option>
              <option value="upstream">Upstream</option>
              <option value="downstream">Downstream</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          <section className="bg-white rounded-xl shadow p-5 space-y-4">
            <h2 className="text-lg font-semibold">New sample</h2>
            <FormSection onCreated={() => setRefreshKey(k => k + 1)} />
          </section>

          <section className="bg-white rounded-xl shadow p-5 space-y-4">
            <h2 className="text-lg font-semibold">Scenario summaries</h2>
            <Summaries refreshKey={refreshKey} />
            <ClusterSection scenario={scenario || null} />
          </section>
        </div>

        <section className="bg-white rounded-xl shadow p-5 space-y-4">
          <h2 className="text-lg font-semibold">Samples</h2>
          <SamplesTable refreshKey={refreshKey} scenario={scenario || undefined} />
        </section>
      </div>
    </div>
  )
}
