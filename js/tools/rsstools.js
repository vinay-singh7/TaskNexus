// RSS Feed Tools
(function(){
  const el=document.getElementById('panel-rsstools');
  const PROXY='https://api.allorigins.win/get?url=';

  function load(){return Store.get('rss_feeds',[]);}
  function save(f){Store.set('rss_feeds',f);}

  function parseRSS(xml){
    const parser=new DOMParser();
    const doc=parser.parseFromString(xml,'text/xml');
    const items=[...doc.querySelectorAll('item')];
    const channel=doc.querySelector('channel');
    const title=channel?.querySelector('title')?.textContent||'Feed';
    const articles=items.slice(0,20).map(item=>({
      title:item.querySelector('title')?.textContent||'No title',
      link:item.querySelector('link')?.textContent||item.querySelector('link')?.getAttribute('href')||'#',
      desc:item.querySelector('description')?.textContent?.replace(/<[^>]+>/g,'').slice(0,200)||'',
      date:item.querySelector('pubDate')?.textContent||item.querySelector('published')?.textContent||'',
    }));
    return {title,articles};
  }

  let activeFeed=null;
  let articles=[];
  let loading=false;

  function render(){
    const feeds=load();
    el.innerHTML=`
    <div class="panel-header"><h1 class="panel-title">RSS Feed Reader</h1><p class="panel-desc">Add feeds, browse articles, manage your reading list.</p></div>
    <div class="grid-2" style="align-items:start;gap:20px">
      <div>
        <div class="card" style="margin-bottom:16px">
          <div class="form-label" style="margin-bottom:8px">Add Feed URL</div>
          <div style="display:flex;gap:8px">
            <input id="rss-url" class="form-input" placeholder="https://feeds.example.com/rss.xml" style="flex:1"/>
            <button class="btn btn-primary" id="btn-add-rss">Add</button>
          </div>
          <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
            ${[['HN','https://hnrss.org/frontpage'],['Wired','https://www.wired.com/feed/rss'],['CSS-Tricks','https://css-tricks.com/feed/'],['TechCrunch','https://techcrunch.com/feed/']].map(([n,u])=>`<button class="btn btn-secondary btn-sm preset-feed" data-url="${u}">${n}</button>`).join('')}
          </div>
        </div>
        <div class="card">
          <div style="font-weight:700;margin-bottom:12px">Saved Feeds (${feeds.length})</div>
          <div id="feed-list">
            ${feeds.length?feeds.map(f=>`
              <div class="feed-item" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer" data-url="${esc(f.url)}">
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:.88rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(f.title||f.url)}</div>
                  <div style="font-size:.72rem;color:var(--text-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(f.url)}</div>
                </div>
                <button class="btn btn-primary btn-sm feed-load" data-url="${esc(f.url)}">Load</button>
                <button class="btn btn-ghost btn-sm feed-del" data-url="${esc(f.url)}"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
              </div>`).join(''):'<div class="empty-state" style="padding:20px 0"><div class="empty-icon">📡</div><div class="empty-title">No feeds saved</div><div class="empty-desc">Add RSS/Atom feed URLs above</div></div>'}
          </div>
        </div>
      </div>
      <div class="card" id="articles-panel">
        <div style="font-weight:700;margin-bottom:12px">${activeFeed?`Articles from <span style="color:var(--primary)">${esc(activeFeed)}</span>`:'Select a feed to read'}</div>
        ${loading?'<div style="text-align:center;padding:40px;color:var(--text-3)"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align:middle"><path d="M2 12h20"></path><path d="M12 2v20"></path><path d="M4 4h16v16H4z"></path></svg> Loading articles…</div>':
          articles.length?articles.map(a=>`
            <div style="padding:12px 0;border-bottom:1px solid var(--border)">
              <a href="${esc(a.link)}" target="_blank" rel="noopener" style="font-weight:600;font-size:.9rem;color:var(--primary);text-decoration:none;display:block;margin-bottom:4px;line-height:1.4">${esc(a.title)}</a>
              ${a.date?`<div style="font-size:.7rem;color:var(--text-3);margin-bottom:4px">${new Date(a.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>`:''}
              ${a.desc?`<div style="font-size:.8rem;color:var(--text-2);line-height:1.5">${esc(a.desc)}…</div>`:''}
            </div>`).join('')
          :'<div class="empty-state" style="padding:40px 0"><div class="empty-icon">📰</div><div class="empty-title">No articles</div><div class="empty-desc">Load a feed to see articles</div></div>'}
      </div>
    </div>`;

    document.getElementById('btn-add-rss').addEventListener('click',addFeed);
    document.getElementById('rss-url').addEventListener('keydown',e=>e.key==='Enter'&&addFeed());
    el.querySelectorAll('.preset-feed').forEach(b=>b.addEventListener('click',()=>{document.getElementById('rss-url').value=b.dataset.url;addFeed();}));
    el.querySelectorAll('.feed-del').forEach(b=>b.addEventListener('click',e=>{
      e.stopPropagation();
      save(load().filter(f=>f.url!==b.dataset.url));
      if(activeFeed===b.dataset.url){activeFeed=null;articles=[];}
      render();
    }));
    el.querySelectorAll('.feed-load').forEach(b=>b.addEventListener('click',e=>{
      e.stopPropagation();
      loadFeed(b.dataset.url);
    }));
  }

  function addFeed(){
    const url=document.getElementById('rss-url').value.trim();
    if(!url){toast('Enter a feed URL','error');return;}
    const feeds=load();
    if(feeds.find(f=>f.url===url)){toast('Feed already added','warning');return;}
    feeds.push({url,title:url,added:Date.now()});
    save(feeds);
    render();
    toast('Feed added — click Load to read it','success');
  }

  async function loadFeed(url){
    activeFeed=url;
    loading=true;
    articles=[];
    render();
    try{
      const resp=await fetch(PROXY+encodeURIComponent(url));
      const json=await resp.json();
      const {title,articles:arts}=parseRSS(json.contents);
      articles=arts;
      // Update feed title
      const feeds=load();
      const f=feeds.find(x=>x.url===url);
      if(f){f.title=title;save(feeds);}
      activeFeed=title;
      loading=false;
      render();
    }catch(e){
      loading=false;
      articles=[];
      toast('Failed to load feed. Check URL or connection.','error');
      render();
    }
  }

  render();
})();
