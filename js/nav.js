/* Navigation controller */
(function () {
  function switchTool(toolId) {
    document.querySelectorAll('.tool-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const view = document.getElementById('tool-' + toolId);
    if (view) view.classList.add('active');

    const btn = document.querySelector('.nav-btn[data-tool="' + toolId + '"]');
    if (btn) btn.classList.add('active');

    // Close sidebar on mobile after selection
    closeSidebar();
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
      switchTool(this.dataset.tool);
    });
  });

  document.getElementById('menuToggle').addEventListener('click', openSidebar);
  document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);
})();
