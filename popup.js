// popup.js

function resizePopup() {
    const body = document.body;
    const html = document.documentElement;
    const height = Math.max(body.scrollHeight, body.offsetHeight, 
                            html.clientHeight, html.scrollHeight, html.offsetHeight);
    chrome.windows.getCurrent((window) => {
        chrome.windows.update(window.id, {
            width: 400,
            height: Math.min(600, height + 40) // 40是一个缓冲值,可以根据需要调整
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // 初始化标签切换
    initTabs();
  
    // 加载历史对话
    loadHistory();
  
    // 加载保存的设置
    loadSettings();
  
    // 保存设置
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    
    // 调整popup大小
    resizePopup();
});

function initTabs() {
    const historyTab = document.getElementById('historyTab');
    const settingsTab = document.getElementById('settingsTab');

    historyTab.addEventListener('click', function() {
        openTab('历史');
    });

    settingsTab.addEventListener('click', function() {
        openTab('设置');
    });

    // 打开默认标签
    openTab('历史');
}

function openTab(tabName) {
    var tabcontent = document.getElementsByClassName("tabcontent");
    for (var i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    var tablinks = document.getElementsByClassName("tablinks");
    for (var i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }

    document.getElementById(tabName).style.display = "block";
    document.getElementById(tabName === '历史' ? 'historyTab' : 'settingsTab').classList.add("active");

    // 特别处理：如果打开的是设置标签，隐藏 ai-response
    if (tabName === '设置') {
        document.getElementById('ai-response').style.display = 'none';
    } else {
        document.getElementById('ai-response').style.display = 'block';
    }
    
    // 调整popup大小
    resizePopup();
}

function loadHistory() {
    chrome.storage.local.get(['conversations'], function(result) {
        const conversations = result.conversations || [];
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';
        conversations.forEach((conversation, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <input type="checkbox" class="history-checkbox" data-id="${conversation.id}">
                <span>对话 ${index + 1}</span>
            `;
            historyItem.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox') {
                    openConversation(conversation.id);
                }
            });
            historyList.appendChild(historyItem);
        });
    });
    
    resizePopup();
}

function openConversation(conversationId) {
    chrome.storage.local.get(['conversations'], function(result) {
        const conversations = result.conversations || [];
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation) {
            const aiResponse = document.getElementById('ai-response');
            aiResponse.innerHTML = conversation.messages.map(m => `
                <div class="${m.role}">
                    <strong>${m.role === 'user' ? '你' : 'AI'}:</strong> ${m.content}
                </div>
            `).join('');
            
            // 在内容被添加到DOM后，调用MathJax来渲染数学公式
            if (window.MathJax) {
                MathJax.typesetPromise([aiResponse]).then(() => {
                    console.log('Math rendering complete');
                }).catch((err) => console.error('Error in MathJax rendering:', err));
            } else {
                console.warn('MathJax not found. Math expressions may not render correctly.');
            }
        }
    });
    
    // 调整popup大小
    resizePopup();
}

function deleteSelectedConversations() {
    const selectedCheckboxes = document.querySelectorAll('.history-checkbox:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(checkbox => checkbox.dataset.id);

    chrome.storage.local.get(['conversations'], function(result) {
        let conversations = result.conversations || [];
        conversations = conversations.filter(conv => !selectedIds.includes(conv.id));
        chrome.storage.local.set({ conversations }, function() {
            loadHistory();
        });
    });
}

function loadSettings() {
    chrome.storage.sync.get(['apiKey', 'model', 'beforeTime', 'afterTime', 'frameCaptureInterval', 'apiEndpoint', 'enableTranscriptionCorrection'], function(items) {
        document.getElementById('apiKey').value = items.apiKey || '';
        document.getElementById('model').value = items.model || 'gpt-4o';
        document.getElementById('beforeTime').value = items.beforeTime || 30;
        document.getElementById('afterTime').value = items.afterTime || 5;
        document.getElementById('frameCaptureInterval').value = items.frameCaptureInterval || 1;
        document.getElementById('apiEndpoint').value = items.apiEndpoint || 'https://chatwithai.icu/v1/chat/completions';
        document.getElementById('enableTranscriptionCorrection').checked = items.enableTranscriptionCorrection || false;
    });
}

function saveSettings() {
    const apiKey = document.getElementById('apiKey').value;
    const model = document.getElementById('model').value;
    const beforeTime = parseInt(document.getElementById('beforeTime').value);
    const afterTime = parseInt(document.getElementById('afterTime').value);
    const frameCaptureInterval = Math.max(1, Math.round(parseFloat(document.getElementById('frameCaptureInterval').value)));
    const apiEndpoint = document.getElementById('apiEndpoint').value;
    const enableTranscriptionCorrection = document.getElementById('enableTranscriptionCorrection').checked;

    chrome.storage.sync.set({
        apiKey: apiKey,
        model: model,
        beforeTime: beforeTime,
        afterTime: afterTime,
        frameCaptureInterval: frameCaptureInterval,
        apiEndpoint: apiEndpoint,
        enableTranscriptionCorrection: enableTranscriptionCorrection
    }, function() {
        alert('设置已保存！');
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // 初始化标签切换
    initTabs();
  
    // 加载历史对话
    loadHistory();
  
    // 加载保存的设置
    loadSettings();
  
    // 保存设置
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    
    // 调整popup大小
    resizePopup();
    
    // 添加新的事件监听器
    document.getElementById('selectAllHistory').addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.history-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allChecked);
    });

    document.getElementById('deleteSelectedHistory').addEventListener('click', deleteSelectedConversations);
});