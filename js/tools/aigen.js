/* ============================================================
   TASKNEXUS — AI IMAGE GENERATOR (Pollinations AI V1)
   ============================================================ */

const AIGen = (() => {
  const panel = document.getElementById('panel-aigen');
  let isGenerating = false;
  let history = [];

  const inspirations = [
    "A cyberpunk city with neon lights and flying cars, hyper-realistic, 8k",
    "A serene mountain lake at sunset, oil painting style, vibrant colors",
    "A futuristic workspace with holographic displays and minimalist furniture",
    "An adorable baby dragon sitting on a pile of gold, Pixar style, 3D render",
    "Abstract fluid art with gold accents, deep blues and purples, cinematic lighting",
    "A majestic lion wearing a space suit, cosmic background, nebula colors"
  ];

  function init() {
    renderUI();
    document.getElementById('ai-generate-btn').onclick = generateImage;
    renderHistory();
  }

  function renderUI() {
    panel.innerHTML = `
      <div class="panel-header animate-fade-in">
        <h2 class="panel-title">AI Image Generator</h2>
        <p class="panel-desc">Unleash your creativity with high-fidelity image synthesis powered by the Flux model.</p>
      </div>

      <div class="grid-2">
        <div class="card glass-morphism animate-slide-up" style="height: fit-content;">
          <div class="form-group">
            <label class="form-label">Imagine anything...</label>
            <textarea id="ai-prompt" class="form-textarea" placeholder="A futuristic city in the clouds..."></textarea>
          </div>

          <div class="inspiration-container" style="margin-bottom: 20px;">
            <label class="form-label" style="font-size: 0.75rem; color: var(--text-4);">Inspiration</label>
            <div id="inspiration-chips" style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${inspirations.map(insp => `
                <button class="chip" onclick="AIGen.setPrompt('${insp.replace(/'/g, "\\'")}')">${insp.split(',')[0]}</button>
              `).join('')}
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Model Architecture</label>
              <select id="ai-model" class="form-select">
                <option value="flux" selected>Flux (State of the Art)</option>
                <option value="flux-realism">Flux Realism</option>
                <option value="flux-anime">Flux Anime</option>
                <option value="flux-3d">Flux 3D</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Aspect Ratio</label>
              <select id="ai-size" class="form-select">
                <option value="1024x1024" selected>Square (1:1)</option>
                <option value="1280x720">Landscape (16:9)</option>
                <option value="720x1280">Portrait (9:16)</option>
              </select>
            </div>
          </div>

          <button id="ai-generate-btn" class="btn btn-primary btn-pill btn-vibrant" style="width: 100%; margin-top: 10px; height: 48px;">
            <span class="btn-icon">✨</span> Generate Creation
          </button>
        </div>

        <div class="card glass-morphism animate-slide-up stagger-1" style="min-height: 400px; display: flex; flex-direction: column;">
          <div class="panel-header" style="margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
            <h3 class="panel-title" style="font-size: 1.1rem;">Creation Workspace</h3>
          </div>
          
          <div id="ai-image-container" class="preview-container">
             <div class="empty-preview">
                <div class="empty-preview-icon">🎨</div>
                <p>Your AI-generated masterpiece will materialize here.</p>
                <span style="font-size: 0.75rem; color: var(--text-4);">Describe your vision on the left to begin.</span>
            </div>
          </div>
        </div>
      </div>

      <div id="ai-history-section" style="margin-top: 32px; display: none;">
        <div class="panel-header">
          <h3 class="panel-title" style="font-size: 1.25rem;">Recent Creations</h3>
        </div>
        <div id="ai-history-grid" class="history-grid"></div>
      </div>

      <style>
        .glass-morphism {
          background: rgba(255, 255, 255, 0.7) !important;
          backdrop-filter: blur(16px) !important;
          border: 1px solid rgba(255, 255, 255, 0.4) !important;
          box-shadow: 0 8px 32px rgba(31, 38, 135, 0.07) !important;
        }
        .btn-vibrant {
          background: linear-gradient(135deg, var(--primary), var(--accent)) !important;
          border: none !important;
          transition: transform 0.2s, box-shadow 0.2s !important;
        }
        .btn-vibrant:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);
        }
        .chip {
          background: var(--surface-2);
          border: 1px solid var(--border);
          color: var(--text-3);
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 0.7rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .chip:hover {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        .preview-container {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          background: var(--surface-2);
          border-radius: var(--radius-md);
          overflow: hidden;
          position: relative;
          border: 1px dashed var(--border-2);
        }
        .empty-preview {
          text-align: center;
          color: var(--text-3);
          padding: 40px;
        }
        .empty-preview-icon {
          font-size: 3rem;
          margin-bottom: 16px;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
        }
        .history-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }
        .history-item {
          aspect-ratio: 1;
          border-radius: var(--radius-md);
          overflow: hidden;
          cursor: pointer;
          position: relative;
          border: 1px solid var(--border);
          transition: transform 0.2s;
        }
        .history-item:hover {
          transform: scale(1.05);
          z-index: 2;
          box-shadow: var(--shadow-lg);
        }
        .history-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .shimmer {
          animation: shimmer 2s infinite linear;
          background: linear-gradient(to right, var(--surface-2) 4%, var(--surface-3) 25%, var(--surface-2) 36%);
          background-size: 1000px 100%;
        }

        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      </style>
    `;
  }

  function setPrompt(text) {
    const textarea = document.getElementById('ai-prompt');
    textarea.value = text;
    textarea.focus();
    toast('Prompt set!', 'info');
  }

  async function generateImage() {
    if (isGenerating) return;

    const prompt = document.getElementById('ai-prompt').value.trim();
    const model = document.getElementById('ai-model').value;
    const size = document.getElementById('ai-size').value;
    const apiKey = window.ENV.POLLINATIONS_API_KEY;

    if (!prompt) {
      toast('Please describe your vision first.', 'warning');
      return;
    }

    if (!apiKey) {
      toast('API Configuration missing.', 'error');
      return;
    }

    setLoading(true);
    const container = document.getElementById('ai-image-container');
    container.innerHTML = `
      <div style="text-align: center;">
        <div class="spinner" style="width: 48px; height: 48px; border-width: 4px; border-top-color: var(--primary);"></div>
        <p style="margin-top: 20px; color: var(--text-2); font-weight: 600; font-family: var(--font-display);">Synthesizing Pixels...</p>
        <p style="font-size: 0.8rem; color: var(--text-4);">This usually takes 10-20 seconds</p>
      </div>
    `;

    try {
      const response = await fetch("https://gen.pollinations.ai/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          "prompt": prompt,
          "model": model,
          "n": 1,
          "size": size,
          "quality": "medium",
          "response_format": "b64_json"
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const b64Data = data.data[0].b64_json;
        const imgUrl = `data:image/png;base64,${b64Data}`;
        
        container.innerHTML = `
          <div class="animate-fade-in" style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <img src="${imgUrl}" style="max-width: 100%; max-height: 100%; display: block; border-radius: 4px; box-shadow: var(--shadow-lg);" />
            <div style="position: absolute; bottom: 16px; right: 16px; display: flex; gap: 8px;">
              <button onclick="AIGen.downloadImage('${imgUrl}')" class="btn btn-primary btn-sm btn-pill" style="backdrop-filter: blur(8px); background: rgba(79, 70, 229, 0.8);">
                Download
              </button>
            </div>
          </div>
        `;

        // Add to history
        history.unshift({ url: imgUrl, prompt: prompt, date: new Date() });
        renderHistory();
        toast('Masterpiece generated!', 'success');
      } else {
        throw new Error('The AI returned no image data.');
      }
    } catch (err) {
      console.error(err);
      toast('Generation failed: ' + err.message, 'error');
      container.innerHTML = `
        <div style="text-align: center; color: var(--danger); padding: 40px;">
          <span style="font-size: 3rem;">⚠️</span>
          <p style="margin-top: 16px; font-weight: 600;">Something went wrong</p>
          <p style="font-size: 0.85rem; opacity: 0.8;">${err.message}</p>
          <button onclick="AIGen.generateImage()" class="btn btn-secondary btn-sm" style="margin-top: 20px;">Retry</button>
        </div>
      `;
    } finally {
      setLoading(false);
    }
  }

  function renderHistory() {
    const section = document.getElementById('ai-history-section');
    const grid = document.getElementById('ai-history-grid');
    
    if (history.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    grid.innerHTML = history.map((item, index) => `
      <div class="history-item animate-slide-up" style="animation-delay: ${index * 0.1}s" onclick="AIGen.viewFromHistory(${index})">
        <img src="${item.url}" alt="${item.prompt.substring(0, 20)}..." title="${item.prompt}" />
      </div>
    `).join('');
  }

  function viewFromHistory(index) {
    const item = history[index];
    const container = document.getElementById('ai-image-container');
    document.getElementById('ai-prompt').value = item.prompt;
    
    container.innerHTML = `
      <div class="animate-fade-in" style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
        <img src="${item.url}" style="max-width: 100%; max-height: 100%; display: block; border-radius: 4px; box-shadow: var(--shadow-lg);" />
        <div style="position: absolute; bottom: 16px; right: 16px; display: flex; gap: 8px;">
          <button onclick="AIGen.downloadImage('${item.url}')" class="btn btn-primary btn-sm btn-pill" style="backdrop-filter: blur(8px); background: rgba(79, 70, 229, 0.8);">
            Download
          </button>
        </div>
      </div>
    `;
    toast('Loaded from history', 'info');
  }

  async function downloadImage(url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-ai-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function setLoading(loading) {
    isGenerating = loading;
    const btn = document.getElementById('ai-generate-btn');
    if (loading) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-sm" style="margin-right: 8px;"></span> Materializing...`;
    } else {
      btn.disabled = false;
      btn.innerHTML = `<span class="btn-icon">✨</span> Generate Creation`;
    }
  }

  return { init, setPrompt, generateImage, downloadImage, viewFromHistory };
})();

// Initialize when the tool is shown
window.addEventListener('hashchange', () => {
  if (window.location.hash === '#aigen') AIGen.init();
});
// Also listen for a custom event from app.js if needed, or check on load
if (window.location.hash === '#aigen') AIGen.init();
