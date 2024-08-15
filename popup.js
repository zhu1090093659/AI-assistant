// popup.js

document.addEventListener('DOMContentLoaded', function() {
    // 初始化标签切换
    initTabs();
  
    // 加载历史对话
    loadHistory();
  
    // 加载保存的设置
    loadSettings();
  
    // 保存设置
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
});
  
function initTabs() {
    const historyTab = document.getElementById('historyTab');
    const settingsTab = document.getElementById('settingsTab');

    historyTab.addEventListener('click', function() {
        openTab('History');
    });

    settingsTab.addEventListener('click', function() {
        openTab('Settings');
    });

    // 打开默认标签
    openTab('History');
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
    document.getElementById(tabName === 'History' ? 'historyTab' : 'settingsTab').classList.add("active");

    // 特别处理：如果打开的是设置标签，隐藏 ai-response
    if (tabName === 'Settings') {
        document.getElementById('ai-response').style.display = 'none';
    } else {
        document.getElementById('ai-response').style.display = 'block';
    }
}

function loadHistory() {
    chrome.storage.local.get(['conversations'], function(result) {
        const conversations = result.conversations || [];
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';
        conversations.forEach((conversation, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.textContent = `对话 ${index + 1}`;
            historyItem.addEventListener('click', () => openConversation(conversation.id));
            historyList.appendChild(historyItem);
        });
    });
}

function openConversation(conversationId) {
    chrome.storage.local.get(['conversations'], function(result) {
        const conversations = result.conversations || [];
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation) {
            const aiResponse = document.getElementById('ai-response');
            aiResponse.innerHTML = conversation.messages.map(m => `
                <div class="${m.role}">
                    <strong>${m.role === 'user' ? 'You' : 'AI'}:</strong> ${m.content}
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
}

function loadSettings() {
    chrome.storage.sync.get(['apiKey', 'model', 'beforeTime', 'afterTime'], function(items) {
        document.getElementById('apiKey').value = items.apiKey || '';
        document.getElementById('model').value = items.model || 'gpt-4o';
        document.getElementById('beforeTime').value = items.beforeTime || 30;
        document.getElementById('afterTime').value = items.afterTime || 5;
    });
}

function saveSettings() {
    const apiKey = document.getElementById('apiKey').value;
    const model = document.getElementById('model').value;
    const beforeTime = parseInt(document.getElementById('beforeTime').value);
    const afterTime = parseInt(document.getElementById('afterTime').value);
  
    chrome.storage.sync.set({
        apiKey: apiKey,
        model: model,
        beforeTime: beforeTime,
        afterTime: afterTime
    }, function() {
        alert('设置已保存！');
    });
}