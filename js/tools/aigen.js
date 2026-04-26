/* ============================================================
   TASKNEXUS — AI IMAGE GENERATOR (Pollinations v1 API)
   ============================================================ */

const AIGen = (() => {
  const panel = document.getElementById('panel-aigen');
  let isGenerating = false;

  function init() {
    panel.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">AI Image Generator</h2>
        <p class="panel-desc">Advanced synthesis using the Pollinations v1 cluster. High-fidelity results via Flux models.</p>
      </div>

      <div class="card">
        <div class="form-group">
          <label class="form-label">Prompt</label>
          <textarea id="ai-prompt" class="form-textarea" placeholder="e.g. high-end product photography of a luxury watch on a dark reflective surface, dramatic lighting, ultra-realistic detail"></textarea>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Resolution</label>
            <select id="ai-size" class="form-select">
              <option value="1024x1024" selected>Square (1024x1024)</option>
              <option value="512x512">Square Small (512x512)</option>
              <option value="768x1024">Portrait</option>
              <option value="1024x768">Landscape</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Quality</label>
            <select id="ai-quality" class="form-select">
              <option value="medium" selected>Standard (Medium)</option>
              <option value="high">High Definition</option>
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
          <div id="ai-image-container" style="display: flex; justify-content: center; align-items: center; min-height: 400px; border-radius: 12px; background: var(--bg-3); border: 1px solid var(--border);">
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
    const size = document.getElementById('ai-size').value;
    const quality = document.getElementById('ai-quality').value;
    const apiKey = window.ENV.MODELSLAB_API_KEY;

    if (!prompt) {
      toast('Please enter a prompt.', 'error');
      return;
    }

    if (!apiKey || apiKey.startsWith('your_')) {
      toast('Pollinations API Key is missing.', 'error');
      return;
    }

    setLoading(true);
    const resultArea = document.getElementById('ai-result-area');
    const container = document.getElementById('ai-image-container');
    resultArea.style.display = 'block';
    container.innerHTML = `
      <div style="text-align: center;">
        <div class="spinner"></div>
        <p style="margin-top: 12px; color: var(--text-2);">Cluster synthesizing pixels...</p>
      </div>
    `;

    try {
      // Pollinations v1 OpenAI-Compatible Endpoint
      const response = await fetch("https://gen.pollinations.ai/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          "prompt": prompt,
          "model": "flux",
          "n": 1,
          "size": size,
          "quality": quality,
          "response_format": "b64_json"
        })
      });

      if (!response.ok) {
          let errData;
          try { errData = await response.json(); } catch(e) { errData = { error: { message: response.statusText } }; }
          throw new Error(errData.error?.message || `API Error ${response.status}`);
      }

      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const base64Data = data.data[0].b64_json;
        const imgUrl = `data:image/png;base64,${base64Data}`;
        
        container.innerHTML = `
          <div style="position: relative; width: 100%;">
            <img src="${imgUrl}" style="width: 100%; display: block; border-radius: 8px; box-shadow: var(--shadow-xl);" />
            <div style="position: absolute; bottom: 16px; right: 16px; display: flex; gap: 8px;">
              <a href="${imgUrl}" download="tasknexus-pollinations.png" class="btn btn-primary btn-sm btn-pill" style="box-shadow: var(--shadow-lg);">
                Download PNG
              </a>
            </div>
          </div>
        `;
      } else {
        throw new Error("No image data returned.");
      }
    } catch (err) {
      console.error(err);
      // If it's a CORS error, fetch usually throws without a response object or with a very generic message
      if (err.message.includes('Failed to fetch')) {
          toast('Network Error: Possible CORS restriction. Try Option 2 (Proxy).', 'error');
      } else {
          toast('Generation failed: ' + err.message, 'error');
      }
      container.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--danger);">⚠️ ${err.message}</div>`;
    } finally {
      setLoading(false);
    }
  }

  function setLoading(loading) {
    isGenerating = loading;
    const btn = document.getElementById('ai-generate-btn');
    if (loading) {
      btn.disabled = true;
      btn.innerHTML = `<span class="btn-icon">⏳</span> Cluster Synthesizing...`;
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
