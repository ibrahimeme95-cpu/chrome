document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('startAutofill');
  const statusDiv = document.getElementById('status');
  const statusMessage = statusDiv.querySelector('.status-message');

  function showStatus(message, type = 'info') {
    statusDiv.className = `status ${type}`;
    statusMessage.textContent = message;
  }

  function hideStatus() {
    statusDiv.className = 'status hidden';
  }

  startButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];

      if (!activeTab.url || !activeTab.url.includes('ptc.eightfold.ai')) {
        showStatus('Please navigate to a PTC Eightfold AI job application page first.', 'error');
        return;
      }

      showStatus('Starting autofill...', 'info');
      startButton.disabled = true;

      chrome.tabs.sendMessage(activeTab.id, { action: 'startAutofill' }, (response) => {
        if (chrome.runtime.lastError) {
          showStatus(`Error: ${chrome.runtime.lastError.message}`, 'error');
          startButton.disabled = false;
        } else {
          showStatus('Autofill started! Check the page for progress.', 'success');
          setTimeout(() => {
            startButton.disabled = false;
            hideStatus();
          }, 3000);
        }
      });
    });
  });
});
