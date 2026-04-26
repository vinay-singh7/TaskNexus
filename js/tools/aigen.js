/* ============================================================
   TASKNEXUS — AI IMAGE GENERATOR (Pollinations Flux Pro)
   ============================================================ */

const AIGen = (() => {
  const panel = document.getElementById('panel-aigen');
  let isGenerating = false;

  function init() {
    panel.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">AI Image Generator</h2>
        <p class="panel-desc">Powered by Pollinations AI — High-speed, professional-grade image generation using the Flux model.</p>
      </div>

      <div class="card">
        <div class="form-group">
          <label class="form-label">Prompt</label>
          <textarea id="ai-prompt" class="form-textarea" placeholder="e.g. high-end product photography of a luxury watch on a dark reflective surface, dramatic lighting, ultra-realistic detail"></textarea>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Aspect Ratio</label>
            <select id="ai-ratio" class="form-select">
              <option value="1024x1024" selected>Square (1:1)</option>
              <option value="1280x720">Landscape (16:9)</option>
              <option value="720x1280">Portrait (9:16)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Style</label>
            <select id="ai-style" class="form-select">
              <option value="flux" selected>Flux (Balanced)</option>
              <option value="flux-realism">Photorealistic</option>
              <option value="flux-anime">Anime</option>
              <option value="flux-3d">3D Render</option>
            </select>
          </div>
        </div>

        <button id="ai-generate-btn" class="btn btn-primary btn-pill" style="width: 100%; margin-top: 10px;">
          <span class="btn-icon">✨</span> Generate Image
        </button>
      </div>

      <div id="ai-result-area" style="margin-top: 24px; display: none;">
        <div class="card">
          <div class="panel-header" style="margin-bottom: 16px;">
            <h3 class="panel-title" style="font-size: 1.2rem;">Generated Result</h3>
          </div>
          <div id="ai-image-container" style="display: flex; justify-content: center; align-items: center; min-height: 300px; border-radius: 12px; overflow: hidden; background: var(--bg-3); border: 1px solid var(--border);">
            <div id="ai-placeholder" style="text-align: center; color: var(--text-4);">
              <span style="font-size: 2rem;">🎨</span>
              <p>Image will appear here</p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('ai-generate-btn').onclick = generateImage;
  }

  function generateImage() {
    if (isGenerating) return;

    const prompt = document.getElementById('ai-prompt').value.trim();
    const ratio = document.getElementById('ai-ratio').value;
    const model = document.getElementById('ai-style').value;
    const [width, height] = ratio.split('x');
    const seed = Math.floor(Math.random() * 1000000);
    const apiKey = window.ENV.MODELSLAB_API_KEY;

    if (!prompt) {
      toast('Please enter a prompt.', 'error');
      return;
    }

    setLoading(true);
    const resultArea = document.getElementById('ai-result-area');
    const container = document.getElementById('ai-image-container');
    resultArea.style.display = 'block';
    container.innerHTML = `
      <div style="text-align: center;">
        <div class="spinner"></div>
        <p style="margin-top: 12px; color: var(--text-2); font-weight: 500;">Synthesizing pixels...</p>
      </div>
    `;

    // Construct Pollinations URL with API Key as a query param for browser compatibility
    // Using nologo=true and enhance=true for professional results
    const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true&enhance=true&safe=true`;
    
    // Create image element
    const img = new Image();
    
    img.onload = () => {
      container.innerHTML = `
        <div style="position: relative; width: 100%;">
          <img src="${imgUrl}" style="width: 100%; display: block; border-radius: 8px;" />
          <div style="position: absolute; bottom: 16px; right: 16px; display: flex; gap: 8px;">
            <button onclick="window.open('${imgUrl}', '_blank')" class="btn btn-secondary btn-sm btn-pill" style="background: rgba(255,255,255,0.9); backdrop-filter: blur(8px); border: none; color: #000;">
              View Full
            </button>
            <button onclick="AIGen.downloadImage('${imgUrl}')" class="btn btn-primary btn-sm btn-pill" style="box-shadow: var(--shadow-lg);">
              Download
            </button>
          </div>
        </div>
      `;
      setLoading(false);
    };

    img.onerror = () => {
      container.innerHTML = `
        <div style="text-align: center; color: var(--danger); padding: 20px;">
          <p>⚠️ Generation failed. The cluster might be busy.</p>
          <button onclick="AIGen.retry()" class="btn btn-secondary btn-sm" style="margin-top: 10px;">Retry</button>
        </div>
      `;
      setLoading(false);
    };

    img.src = imgUrl;
  }

  // Helper to download via blob to bypass some browser restrictions
  async function downloadImage(url) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `tasknexus-ai-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, '_blank');
    }
  }

  function setLoading(loading) {
    isGenerating = loading;
    const btn = document.getElementById('ai-generate-btn');
    if (loading) {
      btn.disabled = true;
      btn.innerHTML = `<span class="btn-icon">⏳</span> Processing...`;
    } else {
      btn.disabled = false;
      btn.innerHTML = `<span class="btn-icon">✨</span> Generate Image`;
    }
  }

  return { init, downloadImage, retry: generateImage };
})();

// Initialize when the tool is shown
window.addEventListener('hashchange', () => {
  if (window.location.hash === '#aigen') AIGen.init();
});
if (window.location.hash === '#aigen') AIGen.init();
