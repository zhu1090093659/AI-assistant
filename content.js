// content.js

(function() {

  let videoElement;
  let currentVideoTime = 0;
  let wasPlaying = false;
  let conversations = [];
  let currentConversationId = null;

  const observer = new MutationObserver((mutations, obs) => {
    const ytpRightControls = document.querySelector('.ytp-right-controls') || document.querySelector('.bpx-player-control-bottom-right');
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
    aiButton.title = '询问AI助手';

    const ytpRightControls = document.querySelector('.ytp-right-controls') || document.querySelector('.bpx-player-control-bottom-right');
    ytpRightControls.insertBefore(aiButton, ytpRightControls.firstChild);

    aiButton.addEventListener('click', showAIAssistantPopup);

    // Apply Bilibili button styles if on Bilibili
    if (document.querySelector('.bpx-player-control-bottom-right')) {
      aiButton.style.cssText = `
        -webkit-text-size-adjust: 100%;
        -webkit-tap-highlight-color: rgba(0,0,0,0);
        font-family: PingFang SC, HarmonyOS_Regular, Helvetica Neue, Microsoft YaHei, sans-serif;
        font-weight: 400;
        -webkit-font-smoothing: antialiased;
        font-style: normal;
        margin: 0;
        padding: 0;
        touch-action: manipulation;
        fill: #fff;
        color: hsla(0,0%,100%,.8);
        height: 22px;
        line-height: 22px;
        outline: 0;
        position: relative;
        text-align: center;
        z-index: 2;
        font-size: 14px;
        width: 50px;
        background: none;
        border: none;
        cursor: pointer;
      `;
    }
  }

  function showAIAssistantPopup() {
    wasPlaying = !videoElement.paused;
    
    if (wasPlaying) {
      videoElement.pause();
    }

    const popup = document.createElement('div');
    popup.id = 'ai-assistant-popup';
    popup.innerHTML = `
      <div class="ai-assistant-popup-content">
        <button id="new-conversation-btn">新对话</button>
        <button id="clear-conversation-btn">清空对话</button>
        <textarea id="question-input" placeholder="询问AI助手关于这个视频的问题..."></textarea>
        <button id="voice-input-btn">语音输入</button>
        <button id="ask-button">提问</button>
        <div id="ai-response"></div>
      </div>
    `;

    document.body.appendChild(popup);

    document.getElementById('ask-button').addEventListener('click', handleQuestion);
    document.getElementById('new-conversation-btn').addEventListener('click', createNewConversation);
    document.getElementById('clear-conversation-btn').addEventListener('click', clearConversation);
    document.getElementById('voice-input-btn').addEventListener('click', handleVoiceInput);
    
    popup.addEventListener('click', (e) => {
      if (e.target === popup) {
        popup.remove();
        if (wasPlaying) {
          videoElement.play();
        }
      }
    });

    // 重置录音状态
    mediaRecorder = null;
    audioChunks = [];

    loadConversations();
  }

  function createNewConversation() {
    currentConversationId = Date.now().toString();
    conversations.push({
      id: currentConversationId,
      messages: []
    });
    saveConversations();
    clearConversation();
  }

  function clearConversation() {
    document.getElementById('ai-response').innerHTML = '';
    document.getElementById('question-input').value = '';
    if (currentConversationId) {
      const conversation = conversations.find(c => c.id === currentConversationId);
      if (conversation) {
        conversation.messages = [];
        saveConversations();
      }
    }
  }

  function loadConversations() {
    chrome.storage.local.get(['conversations'], (result) => {
      conversations = result.conversations || [];
      if (conversations.length === 0) {
        createNewConversation();
      } else {
        currentConversationId = conversations[conversations.length - 1].id;
        loadConversation(currentConversationId);
      }
    });
  }

  function saveConversations() {
    chrome.storage.local.set({ conversations: conversations });
  }

  function loadConversation(conversationId) {
    currentConversationId = conversationId;
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      const aiResponse = document.getElementById('ai-response');
      aiResponse.innerHTML = conversation.messages.map(m => `
        <div class="${m.role}">
          <strong>${m.role === 'user' ? '你' : 'AI'}:</strong> ${m.role === 'assistant' ? marked.parse(m.content) : m.content}
        </div>
      `).join('');
      renderMathInElement(aiResponse);
    }
  }

  function showLoading(element) {
    element.innerHTML += `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>AI正在思考...</p>
      </div>
    `;
  }

  function hideLoading(element) {
    const loadingSpinner = element.querySelector('.loading-spinner');
    if (loadingSpinner) {
      loadingSpinner.remove();
    }
  }

  function renderMathInElement(element) {
    element.innerHTML = element.innerHTML.replace(/\[([^\]]+)\]/g, (match, formula) => {
      return `\\[${formula}\\]`;
    });

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
      if (!currentConversationId) {
        createNewConversation();
      }

      // 立即添加用户问题到对话历史
      const userMessage = `<div class="user"><strong>你 (${new Date().toLocaleTimeString()}):</strong> ${question}</div>`;
      responseElement.innerHTML += userMessage;

      // 保存用户问题到对话历史
      const conversation = conversations.find(c => c.id === currentConversationId);
      if (conversation) {
        conversation.messages.push(
          { role: 'user', content: question, timestamp: new Date().toISOString() }
        );
        saveConversations();
      }

      let response = await callOpenAI(question, timestamp);
      console.log('AI response:', response);
    
      hideLoading(responseElement);
    
      if (response && typeof response === 'string') {
        const aiMessage = `<div class="ai"><strong>AI (${new Date().toLocaleTimeString()}):</strong> ${marked.parse(response)}</div>`;
        responseElement.innerHTML += aiMessage;
    
        renderMathInElement(responseElement);

        // 保存AI回答到对话历史
        if (conversation) {
          conversation.messages.push(
            { role: 'assistant', content: response, timestamp: new Date().toISOString() }
          );
          saveConversations();
        }

        // 清空输入框
        document.getElementById('question-input').value = '';

        // 滚动到对话框底部
        responseElement.scrollTop = responseElement.scrollHeight;
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error) {
      console.error('Error in handleQuestion:', error);
      hideLoading(responseElement);
      responseElement.innerHTML += `<div class="error">错误: ${error.message}</div>`;
    }
  }
  
  async function captureVideoFrames(timestamp) {
    const settings = await new Promise(resolve => {
      chrome.runtime.sendMessage({action: "getSettings"}, resolve);
    });
    
    const beforeTime = settings.beforeTime || 30;
    const afterTime = settings.afterTime || 5;
    const frameCaptureInterval = settings.frameCaptureInterval || 1;
    const totalFrames = Math.floor((beforeTime + afterTime) / frameCaptureInterval);
  
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
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
      const settings = await new Promise(resolve => {
        chrome.runtime.sendMessage({action: "getSettings"}, resolve);
      });
  
      const apiKey = settings.apiKey;
      const model = settings.model || 'gpt-4o';
      const apiEndpoint = settings.apiEndpoint || 'https://chatwithai.icu/v1/chat/completions'; // 新增

      if (!apiKey) {
        throw new Error("API Key未设置。请在扩展设置中设置您的API Key。");
      }
  
      const timestamp = parseFloat(context.split(':').reduce((acc, time) => (60 * acc) + parseFloat(time)));
      const frames = await captureVideoFrames(timestamp);
  
      const messages = [
        {
          role: "system",
          content: "您是明德视界,一个学习相关视频的AI助手。请使用简体中文提供简洁且相关的答案，当涉及到计算时使用markdown进行回答。"
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `在视频的时间戳${context}，用户问道：${prompt}  请使用简体中文提供简洁且相关的答案，当涉及到计算时使用markdown进行回答。对于内嵌公式，应该使用$来包裹。`
            },
            ...frames
          ]
        }
      ];

      // Add previous messages from the current conversation
      const conversation = conversations.find(c => c.id === currentConversationId);
      if (conversation) {
        messages.push(...conversation.messages);
      }
  
      const response = await fetch(apiEndpoint, { // 使用自定义的API端点
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: 1024,
          language: "zh-CN" // 指定输出语言为简体中文
        })
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
  
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        return data.choices[0].message.content;
      } else {
        throw new Error('Unexpected API response structure');
      }
    } catch (error) {
      console.error('Error in callOpenAI:', error);
      throw error;
    }
  }

  let mediaRecorder;
  let audioChunks = [];
  let recordingTimeout;

  async function handleVoiceInput() {
    const voiceInputBtn = document.getElementById('voice-input-btn');

    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      // 开始录音
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.addEventListener("dataavailable", event => {
          audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener("stop", async () => {
          voiceInputBtn.textContent = '处理中...';
          voiceInputBtn.disabled = true;

          // 检查是否有实际的音频数据
          if (audioChunks.length === 0 || audioChunks.every(chunk => chunk.size === 0)) {
            console.log('No audio data recorded');
            voiceInputBtn.textContent = '语音输入';
            voiceInputBtn.disabled = false;
            return;
          }

          try {
            const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
            const formData = new FormData();
            formData.append("file", audioBlob, "audio.mp3");
            formData.append("model", "whisper-1");
            formData.append("response_format", "verbose_json");
            formData.append("timestamp_granularities[]", "word");
            formData.append("language", "zh"); // 指定语言为中文

            const settings = await new Promise(resolve => {
              chrome.runtime.sendMessage({action: "getSettings"}, resolve);
            });

            const response = await fetch("https://chatwithai.icu/v1/audio/transcriptions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${settings.apiKey}`
              },
              body: formData
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            let transcribedText = result.text;

            // 如果启用了转录修正,则调用GPT-4o-mini进行修正
            if (settings.enableTranscriptionCorrection) {
              transcribedText = await correctTranscription(transcribedText, settings);
            }

            document.getElementById('question-input').value = transcribedText;
          } catch (error) {
            console.error('Error in processing voice input:', error);
            alert('处理语音输入时出错: ' + error.message);
          } finally {
            voiceInputBtn.textContent = '语音输入';
            voiceInputBtn.disabled = false;
          }
        });

        mediaRecorder.start();
        voiceInputBtn.textContent = '结束录音';

        // 设置30秒后自动结束录音
        recordingTimeout = setTimeout(() => {
          if (mediaRecorder && mediaRecorder.state === 'recording') {
            stopRecording();
          }
        }, 30000);

      } catch (error) {
        console.error('Error in starting voice input:', error);
        if (error.name === 'NotAllowedError') {
          alert('无法访问麦克风。请确保您已授予网站麦克风访问权限。');
        } else {
          alert('开始语音输入失败: ' + error.message);
        }
        voiceInputBtn.textContent = '语音输入';
      }
    } else {
      // 结束录音
      stopRecording();
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      clearTimeout(recordingTimeout);
    }
  }

  async function correctTranscription(text, settings) {
    const apiKey = settings.apiKey;
    const apiEndpoint = settings.apiEndpoint || 'https://chatwithai.icu/v1/chat/completions';

    const messages = [
      {
        role: "system",
        content: "你是一个语音转录修正助手。你的任务是修正可能的拼写错误,添加缺失的标点符号,并确保输出为简体中文。请保持原文的意思不变,只进行必要的修正。"
      },
      {
        role: "user",
        content: `请修正以下文本,确保拼写正确,标点完整,并输出简体中文: "${text}"`
      }
    ];

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1024,
        language: "zh-CN"
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content.trim();
    } else {
      throw new Error('Unexpected API response structure');
    }
  }

  // 添加消息监听器
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "openConversation") {
      loadConversation(request.conversationId);
      showAIAssistantPopup();
    }
  });
})();