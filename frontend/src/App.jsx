import React from "react";
import { useEffect, useState } from 'react';
import axios from "axios";
import { Activity, BookOpen, BrainCircuit, ChartNoAxesColumn, FileText, FileUp, Search, Sparkles, Trash2, FileBarChart, GitCompareArrows, Layers3, LoaderCircle, ArrowUpRight, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from './api';

const tabs = [
  {id:'overview',label:'Overview',icon:ChartNoAxesColumn},
  {id:'sources',label:'Knowledge sources',icon:Layers3},
  {id:'search',label:'Semantic search',icon:Search},
  {id:'insights',label:'Document insights',icon:BrainCircuit},
  {id:'compare',label:'Compare sources',icon:GitCompareArrows},
  {id:'reports',label:'Research reports',icon:FileBarChart}
];

export default function App(){
  const [tab,setTab]=useState('overview');
  const [docs,setDocs]=useState([]);
  const [analytics,setAnalytics]=useState({document_count:0,chunk_count:0,documents:[]});
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState(null);
  const [searchText,setSearchText]=useState('');
  const [results,setResults]=useState([]);
  const [summary,setSummary]=useState('');
  const [summaryDoc,setSummaryDoc]=useState('');
  const [docA,setDocA]=useState(''); const [docB,setDocB]=useState('');
  const [comparison,setComparison]=useState('');
  const [topic,setTopic]=useState(''); const [report,setReport]=useState(null);

  const refresh=async()=>{
    try{const [d,a]=await Promise.all([api.get('/documents'),api.get('/analytics')]);setDocs(d.data.documents);setAnalytics(a.data);}
    catch(e){setNotice({type:'error',text:e.response?.data?.detail||'Could not reach FastAPI. Is the backend running?'});}
  };
  useEffect(()=>{refresh();},[]);
  const run=async(fn,success)=>{
    setBusy(true);setNotice(null);
    try{await fn();if(success)setNotice({type:'success',text:success});}
    catch(e){setNotice({type:'error',text:e.response?.data?.detail||e.response?.data?.error||e.message||'Request failed.'});}
    finally{setBusy(false);}
  };
  const upload=async(e)=>{
    const file=e.target.files?.[0]; if(!file)return;
    const form=new FormData();form.append('file',file);
    await run(async()=>{await api.post('/documents/upload',form);await refresh();},'Source ingested and indexed successfully.');
    e.target.value='';
  };
  const remove=async(id)=>run(async()=>{await api.delete(`/documents/${id}`);await refresh();},'Source removed.');
  const search=()=>run(async()=>{const {data}=await api.post('/search',{query:searchText,limit:8});setResults(data.results);},'Semantic search complete.');
  const summarize=()=>run(async()=>{const {data}=await api.post(`/documents/${summaryDoc}/summary`);setSummary(data.analysis);},'Document insights generated.');
  const compare=()=>run(async()=>{const {data}=await api.post('/compare',{document_id_a:docA,document_id_b:docB});setComparison(data.comparison);},'Comparison generated.');
  const makeReport=()=>run(async()=>{const {data}=await api.post('/reports',{topic,max_sources:10});setReport(data);},'Research report generated.');

  const Stat=({label,value,sub,icon:Icon})=><div className="stat-card"><div className="stat-top"><span>{label}</span><Icon size={17}/></div><div className="stat-value">{value}</div><div className="stat-sub">{sub}</div></div>;
  const Select=({value,onChange,children})=><select className="field" value={value} onChange={e=>onChange(e.target.value)}>{children}</select>;
  const Output=({children})=><div className="output prose">{children}</div>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="logo"><div className="logo-icon"><BrainCircuit size={21}/></div><div><b>knowsphere<span>.</span></b><small>KNOWLEDGE INTELLIGENCE</small></div></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{tabs.map(t=><button key={t.id} className={`nav-item ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}><t.icon size={17}/>{t.label}{t.id==='sources'&&<span className="nav-count">{docs.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="status-dot"></div><div><b>RAG engine</b><small>Connected workspace</small></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> {tabs.find(t=>t.id===tab)?.label}</div><div className="top-right"><span className="live"><i/> SYSTEM ONLINE</span><div className="avatar">KS</div></div></header>
      <div className="content">
        {notice&&<div className={`notice ${notice.type}`}><span>{notice.type==='success'?<CheckCircle2 size={16}/>:<AlertCircle size={16}/>}</span>{notice.text}<button onClick={()=>setNotice(null)}><X size={15}/></button></div>}
        {tab==='overview'&&<>
          <div className="hero"><div><div className="kicker"><Sparkles size={13}/> LOCAL RAG RESEARCH WORKSPACE</div><h1>Turn information into<br/><em>intelligence.</em></h1><p>Ingest your knowledge, discover hidden connections, and create evidence-backed research.</p><button className="primary" onClick={()=>setTab('sources')}>Add knowledge source <ArrowUpRight size={16}/></button></div><div className="hero-art"><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="core"><BrainCircuit size={46}/></div><div className="float-card fc1"><FileText size={15}/> Documents</div><div className="float-card fc2"><Search size={15}/> Semantic index</div><div className="float-card fc3"><Sparkles size={15}/> AI insights</div></div></div>
          <div className="section-heading"><div><h2>Knowledge overview</h2><p>Your indexed research workspace at a glance.</p></div><span className="updated"><Activity size={14}/> LIVE INDEX</span></div>
          <div className="stats-grid"><Stat label="Knowledge sources" value={analytics.document_count} sub="Indexed documents" icon={BookOpen}/><Stat label="Vector chunks" value={analytics.chunk_count} sub="Searchable passages" icon={Layers3}/><Stat label="AI workflows" value="4" sub="Search · Insights · Compare · Reports" icon={BrainCircuit}/><Stat label="Vector engine" value="Chroma" sub="Persistent local collection" icon={Activity}/></div>
          <div className="bottom-grid"><div className="surface"><div className="surface-head"><div><h3>Knowledge inventory</h3><p>Chunk distribution by source</p></div><Layers3 size={17}/></div>{docs.length?<div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={docs}><CartesianGrid strokeDasharray="3 3" stroke="#243047"/><XAxis dataKey="name" tick={{fill:'#8190a8',fontSize:10}} interval={0} angle={-12} textAnchor="end" height={55}/><YAxis tick={{fill:'#8190a8',fontSize:10}}/><Tooltip contentStyle={{background:'#111c2d',border:'1px solid #293a50',borderRadius:10,color:'#e2e8f0'}}/><Bar dataKey="chunks" fill="#6ee7d2" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div>:<div className="empty">Upload documents to visualize your knowledge base.</div>}</div><div className="surface"><div className="surface-head"><div><h3>Quick actions</h3><p>Choose a knowledge workflow</p></div><Sparkles size={17}/></div><div className="quick-list">{[['Semantic search','Find relevant passages','search',Search],['Extract insights','Summaries and topics','insights',BrainCircuit],['Compare documents','Discover overlap and gaps','compare',GitCompareArrows],['Build research report','Synthesize source evidence','reports',FileBarChart]].map(([a,b,id,Icon])=><button key={id} onClick={()=>setTab(id)}><span className="quick-icon"><Icon size={16}/></span><span><b>{a}</b><small>{b}</small></span><ArrowUpRight size={15}/></button>)}</div></div></div>
        </>}
        {tab==='sources'&&<><div className="page-title"><div className="kicker">KNOWLEDGE INGESTION</div><h1>Knowledge sources</h1><p>Build your private research index from documents.</p></div><label className="dropzone"><FileUp size={30}/><b>Upload a knowledge source</b><span>PDF, DOCX, TXT or Markdown · Max 15 MB</span><input type="file" accept=".pdf,.docx,.txt,.md" onChange={upload}/></label><div className="surface table-surface"><div className="surface-head"><div><h3>Indexed documents</h3><p>{docs.length} sources in your workspace</p></div><BookOpen size={18}/></div>{docs.length?<div className="doc-list">{docs.map(d=><div className="doc-item" key={d.id}><div className="doc-symbol"><FileText size={19}/></div><div className="doc-meta"><b>{d.name}</b><small>{d.chunks} indexed chunks · ID {d.id.slice(0,8)}</small></div><button className="icon-btn danger" onClick={()=>remove(d.id)} title="Delete source"><Trash2 size={16}/></button></div>)}</div>:<div className="empty">No sources indexed yet. Upload your first document above.</div>}</div></>}
        {tab==='search'&&<><div className="page-title"><div className="kicker">DISCOVER KNOWLEDGE</div><h1>Semantic search</h1><p>Find meaning, not just matching keywords, across your knowledge base.</p></div><div className="surface tool-surface"><label className="field-label">What are you researching?</label><div className="searchbar"><Search size={18}/><input value={searchText} onChange={e=>setSearchText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} placeholder="e.g. What are the key risks of adopting generative AI?"/><button className="primary" disabled={busy||searchText.trim().length<2} onClick={search}>{busy?<LoaderCircle className="spin" size={16}/>: 'Search index'}</button></div><div className="hint">Search uses embedding similarity to retrieve the most relevant passages.</div></div>{results.length>0&&<div className="results"><div className="section-heading"><div><h2>Retrieved evidence</h2><p>{results.length} relevant passages ranked by vector distance.</p></div></div>{results.map((r,i)=><div className="result-card" key={r.id}><div className="result-head"><span className="rank">0{i+1}</span><b>{r.document_name}</b><small>Chunk {r.chunk_index+1} · distance {r.distance}</small></div><p>{r.text}</p></div>)}</div>}</>}
        {tab==='insights'&&<><div className="page-title"><div className="kicker">AUTOMATED ANALYSIS</div><h1>Document insights</h1><p>Extract executive summaries, themes, entities and limitations.</p></div><div className="surface tool-surface"><label className="field-label">Select a knowledge source</label><Select value={summaryDoc} onChange={setSummaryDoc}><option value="">Choose a document…</option>{docs.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</Select><button className="primary action-btn" disabled={!summaryDoc||busy} onClick={summarize}>{busy?<LoaderCircle className="spin" size={16}/>:<><Sparkles size={16}/> Generate intelligence brief</>}</button></div>{summary&&<Output><pre>{summary}</pre></Output>}</>}
        {tab==='compare'&&<><div className="page-title"><div className="kicker">CROSS-SOURCE ANALYSIS</div><h1>Compare sources</h1><p>Identify shared themes, differences, contradictions and evidence gaps.</p></div><div className="surface tool-surface"><div className="two-col"><div><label className="field-label">Source A</label><Select value={docA} onChange={setDocA}><option value="">Select first document…</option>{docs.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</Select></div><div><label className="field-label">Source B</label><Select value={docB} onChange={setDocB}><option value="">Select second document…</option>{docs.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</Select></div></div><button className="primary action-btn" disabled={!docA||!docB||docA===docB||busy} onClick={compare}>{busy?<LoaderCircle className="spin" size={16}/>:<><GitCompareArrows size={16}/> Compare documents</>}</button></div>{comparison&&<Output><pre>{comparison}</pre></Output>}</>}
        {tab==='reports'&&<><div className="page-title"><div className="kicker">EVIDENCE-BASED SYNTHESIS</div><h1>Research reports</h1><p>Generate a structured report grounded in retrieved knowledge sources.</p></div><div className="surface tool-surface"><label className="field-label">Research question or topic</label><textarea className="field textarea" value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Evaluate the opportunities, risks and implementation challenges of AI in healthcare."/><button className="primary action-btn" disabled={topic.trim().length<3||busy} onClick={makeReport}>{busy?<LoaderCircle className="spin" size={16}/>:<><FileBarChart size={16}/> Generate research report</>}</button></div>{report&&<><Output><h2>{report.topic}</h2><pre>{report.report}</pre></Output><div className="section-heading"><div><h2>Evidence references</h2><p>Retrieved passages used to build this report.</p></div></div>{report.sources.map(s=><div className="result-card" key={s.source}><b>[Source {s.source}] {s.document_name}</b><p>{s.excerpt}</p></div>)}</>}</>}
        <footer>KNOSPHERE AI <span>·</span> RAG KNOWLEDGE INTELLIGENCE <span>·</span> FASTAPI + REACT</footer>
      </div>
    </main>
  </div>;
}
