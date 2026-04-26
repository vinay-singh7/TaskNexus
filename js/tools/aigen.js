/* ============================================================
   TASKNEXUS — AI IMAGE GENERATOR (Pollinations Flux)
   ============================================================ */

const AIGen = (() => {
  const panel = document.getElementById('panel-aigen');
  let isGenerating = false;

  function init() {
    panel.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">AI Image Generator</h2>
        <p class="panel-desc">Powered by Pollinations AI — High-speed image generation using the Flux model. Optimized for browser performance.</p>
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
          <div id="ai-image-container" style="display: flex; justify-content: center; align-items: center; min-height: 300px; border-radius: 12px; overflow: hidden; background: var(--bg-3);">
            <!-- Image will appear here -->
          </div>
        </div>
      </div>
    `;

    document.getElementById('ai-generate-btn').onclick = generateImage;
  }

  async function generateImage() {
    if (isGenerating) return;

    const prompt = document.getElementById('ai-prompt').value.trim();
    const ratio = document.getElementById('ai-ratio').value;
    const model = document.getElementById('ai-style').value;
    const [width, height] = ratio.split('x');
    const seed = Math.floor(Math.random() * 1000000);

    if (!prompt) {
      toast('Please enter a prompt.', 'error');
      return;
    }

    setLoading(true);
    const resultArea = document.getElementById('ai-result-area');
    const container = document.getElementById('ai-image-container');
    resultArea.style.display = 'block';
    container.innerHTML = `<div class="spinner"></div><p style="margin-left:10px; color:var(--text-2)">Synthesizing pixels...</p>`;

    try {
      // Pollinations API URL
      const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true&enhance=true`;
      
      // We "fetch" just to verify it's ready, then display
      const response = await fetch(imgUrl);
      if (!response.ok) throw new Error("Synthesis failed");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      container.innerHTML = `
        <div style="position: relative; width: 100%;">
          <img src="${objectUrl}" style="width: 100%; display: block; border-radius: 8px;" />
          <div style="position: absolute; bottom: 16px; right: 16px; display: flex; gap: 8px;">
            <button onclick="window.open('${imgUrl}', '_blank')" class="btn btn-secondary btn-sm btn-pill" style="background: rgba(255,255,255,0.9); backdrop-filter: blur(8px);">
              Open Original
            </button>
            <a href="${objectUrl}" download="tasknexus-ai.png" class="btn btn-primary btn-sm btn-pill" style="box-shadow: var(--shadow-lg);">
              Download
            </a>
          </div>
        </div>
      `;
    } catch (err) {
      console.error(err);
      toast('Generation failed. Please try a different prompt.', 'error');
      container.innerHTML = `<p style="color:var(--danger)">⚠️ Error: Could not connect to generation cluster.</p>`;
    } finally {
      setLoading(false);
    }
  }

  function setLoading(loading) {
    isGenerating = loading;
    const btn = document.getElementById('ai-generate-btn');
    if (loading) {
      btn.disabled = true;
      btn.innerHTML = `<span class="btn-icon">⏳</span> Thinking...`;
    } else {
      btn.disabled = false;
      btn.innerHTML = `<span class="btn-icon">✨</span> Generate Image`;
    }
  }

  return { init };
})();

// Initialize when the tool is shown
window.addEventListener('hashchange', () => {
  if (window.location.hash === '#aigen') AIGen.init();
});
if (window.location.hash === '#aigen') AIGen.init();
