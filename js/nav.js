/* Navigation controller + hash routing
   Each tool has a URL hash (e.g. #exp, #chromatic) so views are linkable and
   the browser back/forward buttons work. No hash → first tool (reset state). */
(function () {
  function switchTool(toolId) {
    const view = document.getElementById('tool-' + toolId);
    const btn  = document.querySelector('.nav-btn[data-tool="' + toolId + '"]');
    if (!view || !btn) return false;

    document.querySelectorAll('.tool-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    view.classList.add('active');
    btn.classList.add('active');

    // Let tools react when they become visible (e.g. measure/scroll their DOM).
    window.dispatchEvent(new CustomEvent('tool:shown', { detail: { tool: toolId } }));
    return true;
  }

  function currentHashId() {
    return (location.hash || '').replace(/^#\/?/, '');
  }

  /** Apply the tool named in the URL hash, or fall back to the first nav button. */
  function applyRoute() {
    if (!switchTool(currentHashId())) {
      const first = document.querySelector('.nav-btn');
      if (first) switchTool(first.dataset.tool);
    }
  }

  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('visible');
  }

  function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('visible');
  }

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const id = this.dataset.tool;
      switchTool(id);                                   // switch immediately
      if (currentHashId() !== id) location.hash = id;   // reflect in URL (idempotent)
      closeSidebar();
    });
  });

  window.addEventListener('hashchange', applyRoute);
  document.getElementById('menuToggle').addEventListener('click', openSidebar);
  document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);

  applyRoute(); // initial route from URL
})();
