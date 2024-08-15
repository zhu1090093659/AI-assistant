window.MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      processEscapes: true,
      processEnvironments: true
    },
    options: {
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
    },
    startup: {
      ready: () => {
        console.log('MathJax is loaded, but not yet initialized');
        MathJax.startup.defaultReady();
        console.log('MathJax is initialized');
      }
    }
  };