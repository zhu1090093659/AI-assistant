// popup.js
document.addEventListener('DOMContentLoaded', function() {
    // 加载保存的设置
    chrome.storage.sync.get(['apiKey', 'model', 'beforeTime', 'afterTime'], function(items) {
      document.getElementById('apiKey').value = items.apiKey || '';
      document.getElementById('model').value = items.model || 'gpt-4o';
      document.getElementById('beforeTime').value = items.beforeTime || 30;
      document.getElementById('afterTime').value = items.afterTime || 5;
    });
  
    // 保存设置
    document.getElementById('saveSettings').addEventListener('click', function() {
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
        alert('Settings saved!');
      });
    });
  });