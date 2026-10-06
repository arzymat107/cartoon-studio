/**
 * "Export MP4" button. Asks the local dev server (see scripts/export-server.mjs) to render the
 * episode with scripts/export-video.mjs, shows progress, then downloads the finished video.
 */
interface ExportJob {
  state: 'idle' | 'running' | 'done' | 'error';
  episode?: string;
  stage?: string;
  progress: number;
  file?: string;
  error?: string;
}

const STAGES: Record<string, string> = {
  starting: 'Starting…',
  sound: 'Rendering sound…',
  encoding: 'Finishing…',
};

export function createExportButton(episode: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'export-button';
  button.title = 'Render this episode to an MP4 video and download it';
  const idleLabel = '&#x2B07; Export MP4';
  button.innerHTML = idleLabel;

  let polling = false;

  const setLabel = (text: string, progress?: number) => {
    button.textContent = text;
    button.style.setProperty('--progress', progress === undefined ? '0' : String(progress));
  };

  const reset = (delay = 0) =>
    setTimeout(() => {
      button.disabled = false;
      button.classList.remove('busy');
      button.innerHTML = idleLabel;
      button.style.setProperty('--progress', '0');
    }, delay);

  const poll = async () => {
    if (polling) return;
    polling = true;
    button.disabled = true;
    button.classList.add('busy');
    try {
      for (;;) {
        const job: ExportJob = await (await fetch('/api/export/status')).json();
        if (job.state === 'running') {
          const label = job.stage === 'video' ? `Exporting… ${Math.round(job.progress * 100)}%` : STAGES[job.stage ?? ''] ?? 'Exporting…';
          setLabel(label, job.progress);
        } else if (job.state === 'done' && job.file) {
          setLabel('Downloading ✓', 1);
          const link = document.createElement('a');
          link.href = `/api/export/download?file=${encodeURIComponent(job.file)}`;
          link.download = job.file;
          link.click();
          reset(3000);
          return;
        } else {
          setLabel('Export failed', 0);
          alert(`Export failed:\n\n${job.error ?? 'unknown error'}`);
          reset(1000);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    } catch {
      setLabel('Export failed', 0);
      reset(1500);
    } finally {
      polling = false;
    }
  };

  button.addEventListener('click', async () => {
    let response: Response;
    try {
      response = await fetch(`/api/export?episode=${encodeURIComponent(episode)}&fps=30`, { method: 'POST' });
    } catch {
      response = new Response(null, { status: 404 });
    }
    if (response.status === 404) {
      alert('Exporting needs the local studio server.\nRun "npm run dev" in the project folder and open the page it prints.');
      return;
    }
    if (!response.ok && response.status !== 409) {
      const { error } = await response.json().catch(() => ({ error: response.statusText }));
      alert(`Could not start the export: ${error}`);
      return;
    }
    void poll(); // 409 = already running: just follow that export
  });

  // Page reloaded during an export of this episode: keep showing its progress.
  fetch('/api/export/status')
    .then((r) => (r.ok ? r.json() : null))
    .then((job: ExportJob | null) => {
      if (job?.state === 'running' && job.episode === episode) void poll();
    })
    .catch(() => { /* no studio server – the button explains on click */ });

  return button;
}
