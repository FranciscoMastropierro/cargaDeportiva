// Runs in the document head before the body is painted. Only fixed code belongs here.
export const themeInitializationScript = `(function () {
  var theme;
  try { theme = localStorage.getItem('theme'); } catch (_) {}
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();`;
