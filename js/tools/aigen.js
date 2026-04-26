/* ============================================================
   TASKNEXUS — AI IMAGE GENERATOR (NVIDIA Flux-1-Dev)
   ============================================================ */

const AIGen = (() => {
  const panel = document.getElementById('panel-aigen');
  let isGenerating = false;

  function init() {
    panel.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">AI Image Generator</h2>
        <p class="panel-desc">Powered by NVIDIA NIM — High-fidelity image generation using the Flux-1-Dev model.</p>
      </div>

      <div class="card">
        <div class="form-group">
          <label class="form-label">Prompt</label>
          <textarea id="ai-prompt" class="form-textarea" placeholder="e.g. high-end product photography of a luxury watch on a dark reflective surface, dramatic lighting, ultra-realistic detail"></textarea>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Steps (1-50)</label>
            <input type="number" id="ai-steps" class="form-input" value="50" min="1" max="50">
          </div>
          <div class="form-group">
            <label class="form-label">Mode</label>
            <select id="ai-mode" class="form-select">
              <option value="base" selected>Base</option>
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
          <div id="ai-image-container" style="display: flex; justify-content: center; align-items: center; min-height: 300px;">
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
    const steps = document.getElementById('ai-steps').value;
    const mode = document.getElementById('ai-mode').value;
    const apiKey = window.ENV.MODELSLAB_API_KEY; // Using the key variable for NVIDIA key

    if (!prompt) {
      toast('Please enter a prompt.', 'error');
      return;
    }

    if (!apiKey || apiKey.startsWith('your_')) {
      toast('NVIDIA API Key is missing. Please set it in config.js.', 'error');
      return;
    }

    setLoading(true);
    const resultArea = document.getElementById('ai-result-area');
    const container = document.getElementById('ai-image-container');
    resultArea.style.display = 'none';
    container.innerHTML = '';

    try {
      // NVIDIA NIM Endpoint for Flux-1-Dev
      const invoke_url = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux-1-dev";
      
      const response = await fetch(invoke_url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "prompt": prompt,
          "mode": mode,
          "steps": parseInt(steps),
          "seed": Math.floor(Math.random() * 1000000)
        })
      });

      if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || response.statusText);
      }

      const data = await response.json();

      if (data.artifacts && data.artifacts.length > 0) {
        resultArea.style.display = 'block';
        const base64Data = data.artifacts[0].base64;
        const imgUrl = `data:image/png;base64,${base64Data}`;
        
        container.innerHTML = `
          <div style="position: relative; width: 100%; max-width: 800px;">
            <img src="${imgUrl}" style="width: 100%; border-radius: 12px; box-shadow: var(--shadow-xl);" />
            <a href="${imgUrl}" download="tasknexus-ai-gen.png" class="btn btn-secondary btn-sm btn-pill" style="position: absolute; bottom: 16px; right: 16px; background: rgba(255,255,255,0.9); backdrop-filter: blur(8px); box-shadow: var(--shadow-lg);">
              Download Image
            </a>
          </div>
        `;
      } else {
        throw new Error('No image artifacts returned from API.');
      }
    } catch (err) {
      console.error(err);
      toast('Generation failed: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function setLoading(loading) {
    isGenerating = loading;
    const btn = document.getElementById('ai-generate-btn');
    if (loading) {
      btn.disabled = true;
      btn.innerHTML = `<span class="btn-icon">⏳</span> Processing on NVIDIA GPUs...`;
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
