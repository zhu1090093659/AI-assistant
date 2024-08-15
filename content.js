// content.js

(function() {

  let videoElement;
  let currentVideoTime = 0;
  let wasPlaying = false;

  const observer = new MutationObserver((mutations, obs) => {
    const ytpRightControls = document.querySelector('.ytp-right-controls');
    if (ytpRightControls) {
      obs.disconnect();
      injectAIAssistantButton();
      setupVideoTracking();
    }
  });

  observer.observe(document, {
    childList: true,
    subtree: true
  });

  function setupVideoTracking() {
      videoElement = document.querySelector('video');
      if (videoElement) {
      videoElement.addEventListener('timeupdate', () => {
          currentVideoTime = videoElement.currentTime;
      });
      }
  }

  function formatTimestamp(seconds) {
    const date = new Date(0);
    date.setSeconds(seconds);
    return date.toISOString().substr(11, 8);
  }

  function injectAIAssistantButton() {
    const aiButton = document.createElement('button');
    aiButton.className = 'ytp-button ai-assistant-button';
    aiButton.innerHTML = '<svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%"><use class="ytp-svg-shadow" xlink:href="#ytp-id-20"></use><path d="M18 10.5c-4.14 0-7.5 3.36-7.5 7.5s3.36 7.5 7.5 7.5 7.5-3.36 7.5-7.5-3.36-7.5-7.5-7.5zm0 13.5c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm-1-9h2v5h-2v-5z" fill="#fff" id="ytp-id-20"></path></svg>';
    aiButton.title = 'Ask AI Assistant';

    const ytpRightControls = document.querySelector('.ytp-right-controls');
    ytpRightControls.insertBefore(aiButton, ytpRightControls.firstChild);

    aiButton.addEventListener('click', showAIAssistantPopup);
  }

  function showAIAssistantPopup() {
    // 检查视频是否正在播放
    wasPlaying = !videoElement.paused;
    
    // 暂停视频
    if (wasPlaying) {
      videoElement.pause();
    }

    const popup = document.createElement('div');
    popup.id = 'ai-assistant-popup';
    popup.innerHTML = `
      <div class="ai-assistant-popup-content">
        <textarea id="question-input" placeholder="Ask AI Assistant about this video..."></textarea>
        <button id="ask-button">Ask</button>
        <div id="ai-response"></div>
      </div>
    `;

    document.body.appendChild(popup);

    document.getElementById('ask-button').addEventListener('click', handleQuestion);
    // document.getElementById('summarize-button').addEventListener('click', summarizeVideo);
    popup.addEventListener('click', (e) => {
      if (e.target === popup) {
        popup.remove();
        // 如果视频之前在播放，则恢复播放
        if (wasPlaying) {
          videoElement.play();
        }
      }
    });
  }
    
    

    function showLoading(element) {
      element.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>AI is thinking...</p>
        </div>
      `;
    }

    function hideLoading(element) {
      const loadingSpinner = element.querySelector('.loading-spinner');
      if (loadingSpinner) {
        loadingSpinner.remove();
      }
    }

    function waitForKaTeX(callback) {
      if (window.katex) {
        callback();
      } else {
        const observer = new MutationObserver((mutations, obs) => {
          if (window.katex) {
            obs.disconnect();
            callback();
          }
        });
        observer.observe(document, {
          childList: true,
          subtree: true
        });
      }
    }

    function log(message) {
      console.log(`[YouTube AI Assistant]: ${message}`);
  }

  function renderMathInElement(element) {
    // 将方括号替换为 \[ 和 \]
    element.innerHTML = element.innerHTML.replace(/\[([^\]]+)\]/g, (match, formula) => {
        return `\\[${formula}\\]`;
    });

    // 确保 MathJax 已加载并初始化
    if (window.MathJax && window.MathJax.typesetPromise) {
        MathJax.typesetPromise([element]).catch((err) => console.error('MathJax rendering error:', err));
    } else {
        console.error('MathJax is not properly loaded');
    }
}
async function handleQuestion() {
    const question = document.getElementById('question-input').value;
    const responseElement = document.getElementById('ai-response');
    const timestamp = formatTimestamp(currentVideoTime);
    
    showLoading(responseElement);
    
    try {
        let response = await callOpenAI(question, timestamp);
        console.log('AI response:', response);
    
        hideLoading(responseElement);
    
        if (response && typeof response === 'string') {
            // // 检查响应是否带有 markdown 语法框
            // const hasMarkdown = response.includes('```') || response.includes('$$');
            // // 如果没有 markdown 语法框，则补充```markdown 和 ```结束标记
            // if (!hasMarkdown) {
            //     response = '```markdown\n' + response + '\n```';
            // }

            // 使用 marked 函数来渲染 Markdown
            responseElement.innerHTML = marked.parse(response);
    
            // 渲染数学公式
            renderMathInElement(responseElement);
        } else {
            throw new Error('Invalid response from AI');
        }
    } catch (error) {
        console.error('Error in handleQuestion:', error);
        hideLoading(responseElement);
        responseElement.textContent = `Error: ${error.message}`;
    }
}
  
    async function summarizeVideo() {
      const responseElement = document.getElementById('ai-response');
      responseElement.textContent = "Analyzing video content and generating summary...";
  
      try {
        const response = await callOpenAI("Summarize the key points of this video", "full video");
        responseElement.innerHTML = `
          <h3>Video Summary:</h3>
          <p>${response}</p>
        `;
      } catch (error) {
        responseElement.textContent = `Error: ${error.message}`;
      }
    }
  
    async function captureVideoFrames(timestamp) {
      // 获取用户设置
      const settings = await new Promise(resolve => {
        chrome.storage.sync.get(['beforeTime', 'afterTime'], resolve);
      });
      
      const beforeTime = settings.beforeTime || 30;
      const afterTime = settings.afterTime || 5;
      const totalFrames = beforeTime + afterTime;
    
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const frameCaptureInterval = 1; // 每秒捕获一帧
      const frames = [];
      const originalTime = videoElement.currentTime;
    
      for (let i = 0; i < totalFrames; i++) {
        const captureTime = timestamp - beforeTime + i * frameCaptureInterval;
        if (captureTime >= 0 && captureTime <= videoElement.duration) {
          videoElement.currentTime = captureTime;
          await new Promise(resolve => videoElement.addEventListener('seeked', resolve, { once: true }));
          
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          
          const base64Image = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
          frames.push({
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          });
        }
      }
    
      // 恢复原始播放位置
      videoElement.currentTime = originalTime;
    
      return frames;
    }
    
    async function callOpenAI(prompt, context) {
      try {
        // 获取用户设置的API Key和模型
        const settings = await new Promise(resolve => {
          chrome.storage.sync.get(['apiKey', 'model'], resolve);
        });
    
        const apiKey = settings.apiKey;
        const model = settings.model || 'gpt-4o'; // 默认使用gpt-4o
    
        if (!apiKey) {
          throw new Error("API Key not set. Please set your API Key in the extension settings.");
        }
    
        const timestamp = parseFloat(context.split(':').reduce((acc, time) => (60 * acc) + parseFloat(time)));
        const frames = await captureVideoFrames(timestamp);
    
        const messages = [
          {
            role: "system",
            content: "您是YouTube视频的AI助手。提供简洁且相关的答案，当涉及到计算时使用markdown进行回答。"
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `在视频的时间戳${context}，用户问道：${prompt}  提供简洁且相关的答案，当涉及到计算时使用markdown进行回答。对于内嵌公式，应该使用$来包裹。`
              },
              ...frames
            ]
          }
        ];
    
        const response = await fetch('https://chatwithai.icu/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            max_tokens: 1024
          })
        });
    
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const data = await response.json();
        // console.log('API response data:', data); // 日志记录 API 的完整响应
    
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
          return data.choices[0].message.content;
        } else {
          throw new Error('Unexpected API response structure');
        }
      } catch (error) {
        console.error('Error in callOpenAI:', error);
        throw error; // 重新抛出错误以便在 handleQuestion 中捕获
      }
    }
})();