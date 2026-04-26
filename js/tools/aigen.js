/* ============================================================
   TASKNEXUS — AI IMAGE GENERATOR (ModelsLab Flux-Klein)
   ============================================================ */

const AIGen = (() => {
  const panel = document.getElementById('panel-aigen');
  let isGenerating = false;

  function init() {
    panel.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">AI Image Generator</h2>
        <p class="panel-desc">Generate stunning images using the ModelsLab Flux-Klein model.</p>
      </div>

      <div class="card">
        <div class="form-group">
          <label class="form-label">Prompt</label>
          <textarea id="ai-prompt" class="form-textarea" placeholder="Describe the image you want to generate..."></textarea>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Width</label>
            <select id="ai-width" class="form-select">
              <option value="512">512</option>
              <option value="768">768</option>
              <option value="1024" selected>1024</option>
              <option value="1280">1280</option>
              <option value="1488">1488</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Height</label>
            <select id="ai-height" class="form-select">
              <option value="512">512</option>
              <option value="768">768</option>
              <option value="1024" selected>1024</option>
              <option value="1280">1280</option>
              <option value="1488">1488</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Samples (1-2)</label>
          <input type="number" id="ai-samples" class="form-input" value="1" min="1" max="2">
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
          <div id="ai-image-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
            <!-- Images will appear here -->
          </div>
        </div>
      </div>
    `;

    document.getElementById('ai-generate-btn').onclick = generateImage;
  }

  async function generateImage() {
    if (isGenerating) return;

    const prompt = document.getElementById('ai-prompt').value.trim();
    const width = document.getElementById('ai-width').value;
    const height = document.getElementById('ai-height').value;
    const samples = document.getElementById('ai-samples').value;
    const apiKey = window.ENV.MODELSLAB_API_KEY;

    if (!prompt) {
      toast('Please enter a prompt.', 'error');
      return;
    }

    if (!apiKey || apiKey === 'your_modelslab_api_key_here') {
      toast('ModelsLab API Key is missing. Please set it in config.js.', 'error');
      return;
    }

    setLoading(true);
    const resultArea = document.getElementById('ai-result-area');
    const container = document.getElementById('ai-image-container');
    resultArea.style.display = 'none';
    container.innerHTML = '';

    try {
      const response = await fetch("https://modelslab.com/api/v6/images/text2img", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "key": apiKey,
          "model_id": "flux-klein",
          "prompt": prompt,
          "width": width,
          "height": height,
          "samples": samples
        })
      });

      const data = await response.json();

      if (data.status === 'success' || data.status === 'processing') {
        resultArea.style.display = 'block';
        
        if (data.output && data.output.length > 0) {
          data.output.forEach(url => {
            const imgWrapper = document.createElement('div');
            imgWrapper.style.position = 'relative';
            imgWrapper.innerHTML = `
              <img src="${url}" style="width: 100%; border-radius: 12px; box-shadow: var(--shadow-md);" />
              <a href="${url}" download="generated-image.png" target="_blank" class="btn btn-secondary btn-sm btn-pill" style="position: absolute; bottom: 10px; right: 10px; background: rgba(255,255,255,0.8); backdrop-filter: blur(4px);">
                Download
              </a>
            `;
            container.appendChild(imgWrapper);
          });
        } else if (data.status === 'processing') {
          container.innerHTML = `<p class="panel-desc">Image is being generated. This might take a minute. Please check back shortly.</p>`;
          if (data.fetch_result) {
              // Optionally poll for result using data.fetch_result URL
              pollForResult(data.fetch_result);
          }
        }
      } else {
        throw new Error(data.message || 'Generation failed');
      }
    } catch (err) {
      console.error(err);
      toast('Generation failed: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function pollForResult(fetchUrl) {
      const container = document.getElementById('ai-image-container');
      let attempts = 0;
      const maxAttempts = 20;
      
      const interval = setInterval(async () => {
          attempts++;
          if (attempts > maxAttempts) {
              clearInterval(interval);
              container.innerHTML = `<p class="panel-desc">Generation timed out. Please check your ModelsLab dashboard.</p>`;
              return;
          }
          
          try {
              const res = await fetch(fetchUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ key: window.ENV.MODELSLAB_API_KEY })
              });
              const data = await res.json();
              
              if (data.status === 'success' && data.output) {
                  clearInterval(interval);
                  container.innerHTML = '';
                  data.output.forEach(url => {
                      const imgWrapper = document.createElement('div');
                      imgWrapper.style.position = 'relative';
                      imgWrapper.innerHTML = `
                        <img src="${url}" style="width: 100%; border-radius: 12px; box-shadow: var(--shadow-md);" />
                        <a href="${url}" download="generated-image.png" target="_blank" class="btn btn-secondary btn-sm btn-pill" style="position: absolute; bottom: 10px; right: 10px; background: rgba(255,255,255,0.8); backdrop-filter: blur(4px);">
                          Download
                        </a>
                      `;
                      container.appendChild(imgWrapper);
                  });
              }
          } catch (e) {
              console.error("Polling error:", e);
          }
      }, 5000);
  }

  function setLoading(loading) {
    isGenerating = loading;
    const btn = document.getElementById('ai-generate-btn');
    if (loading) {
      btn.disabled = true;
      btn.innerHTML = `<span class="btn-icon">⏳</span> Generating...`;
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
