// Get URL parameters to extract paste ID
const pathParts = window.location.pathname.split('/');
const pasteId = pathParts[1];

// DOM elements
const pasteView = document.getElementById('pasteView');
const errorMessage = document.getElementById('errorMessage');
const loading = document.getElementById('loading');

// Initialize the page
if (pasteId && pasteId !== '') {
    fetchPaste(pasteId);
} else {
    showError('无效的链接');
}

// Fetch paste data
async function fetchPaste(id) {
    try {
        showLoading();
        const response = await fetch(`/api/paste/${id}`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (response.ok) {
            displayPaste(data);
            initPasteViewControls();
        } else {
            showError(data.error || '获取内容失败');
        }
    } catch (error) {
        console.error('Error fetching paste:', error);
        showError('网络错误，请稍后重试');
    }
}

// Display paste content
function displayPaste(data) {
    hideLoading();
    hideError();
    
    // Display paste
    pasteView.style.display = 'block';
    
    // 处理标题显示 - 如果没有标题则隐藏标题元素
    const pasteTitleElement = document.getElementById('pasteTitle');
    const pasteHeaderElement = document.querySelector('.paste-header');
    if (data.title && data.title.trim() !== '') {
        pasteTitleElement.textContent = data.title;
        pasteTitleElement.style.display = 'block';
        pasteHeaderElement.classList.remove('no-title');
        // 设置浏览器标签页标题
        document.title = data.title + ' - Modern Pastebin';
    } else {
        pasteTitleElement.textContent = 'Untitled Paste';
        pasteTitleElement.style.display = 'block';
        pasteHeaderElement.classList.remove('no-title');
        // 设置浏览器标签页标题
        document.title = 'Untitled Paste - Modern Pastebin';
    }
    document.getElementById('pasteDate').textContent = formatRelativeTime(data.created_at);
    
    // 处理内容并生成行号
    renderPasteContent(data.content);
}

// Show loading state
function showLoading() {
    loading.style.display = 'block';
    pasteView.style.display = 'none';
    errorMessage.style.display = 'none';
}

// Hide loading state
function hideLoading() {
    loading.style.display = 'none';
}

// Show error message
function showError(message) {
    hideLoading();
    pasteView.style.display = 'none';
    errorMessage.style.display = 'block';
    const errorText = errorMessage.querySelector('p');
    if (errorText) {
        errorText.textContent = message;
    }
    document.title = '错误 - Modern Pastebin';
}

// Hide error message
function hideError() {
    errorMessage.style.display = 'none';
}

// 渲染粘贴内容和行号
function renderPasteContent(content) {
    const lines = content.split('\n');
    const lineNumbersElement = document.getElementById('lineNumbers');
    const pasteContentElement = document.getElementById('pasteContent');
    const pasteContentContainer = document.getElementById('pasteContentContainer');
    
    if (!lineNumbersElement || !pasteContentElement || !pasteContentContainer) {
        console.error('Line numbers or paste content element not found');
        return;
    }
    
    // 生成行号
    const lineNumbersHtml = lines.map((_, index) => 
        `<span class="line-number">${index + 1}</span>`
    ).join('');
    lineNumbersElement.innerHTML = lineNumbersHtml;
    
    // 生成代码行
    const codeHtml = lines.map((line, index) => 
        `<div class="code-line" data-line="${index + 1}">${escapeHtml(line)}</div>`
    ).join('');
    pasteContentElement.innerHTML = codeHtml;
    
    // 添加滚动同步
    setupScrollSync();
}

// HTML转义函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 格式化相对时间函数
function formatRelativeTime(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    // 小于1分钟
    if (diffInSeconds < 60) {
        return 'just now';
    }
    
    // 分钟
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
    }
    
    // 小时
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    }
    
    // 超过24小时，显示具体时间
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

// 设置滚动同步
function setupScrollSync() {
    const pasteContentContainer = document.getElementById('pasteContentContainer');
    const lineNumbersElement = document.getElementById('lineNumbers');
    
    if (!pasteContentContainer || !lineNumbersElement) {
        return;
    }
    
    // 移除之前的事件监听器（如果存在）
    pasteContentContainer.removeEventListener('scroll', handleScroll);
    
    // 添加滚动事件监听器
    pasteContentContainer.addEventListener('scroll', handleScroll);
    
    function handleScroll() {
        // 同步滚动行号
        const scrollTop = pasteContentContainer.scrollTop;
        lineNumbersElement.style.transform = `translateY(-${scrollTop}px)`;
    }
}

// 初始化展示页面控制功能
function initPasteViewControls() {
    const copyContent = document.getElementById('copyContent');

    if (copyContent) {
        copyContent.addEventListener('click', copyPasteContent);
    }
}

// 复制内容
async function copyPasteContent() {
    const pasteContentElement = document.getElementById('pasteContent');
    const copyContentElement = document.getElementById('copyContent');
    
    if (!pasteContentElement || !copyContentElement) return;
    
    try {
        // 从各个代码行元素中提取文本，并用换行符连接
        const codeLines = pasteContentElement.querySelectorAll('.code-line');
        const textContent = Array.from(codeLines).map(line => line.textContent).join('\n');
        await navigator.clipboard.writeText(textContent);
        
        const copyIcon = copyContentElement.querySelector('.copy-icon');
        if (copyIcon) {
            // 保存原始的 SVG 图标
            const originalSVG = copyIcon.innerHTML;
            
            // 切换到成功图标
            copyIcon.innerHTML = `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-check js-clipboard-check-icon color-fg-success m-2 d-none">
                <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
            </svg>`;
            copyContentElement.title = 'copied';
            
            setTimeout(() => {
                copyIcon.innerHTML = originalSVG;
                copyContentElement.title = '复制内容';
            }, 3000);
        }
    } catch (err) {
        // 降级方案
        const codeLines = pasteContentElement.querySelectorAll('.code-line');
        const textContent = Array.from(codeLines).map(line => line.textContent).join('\n');
        const textArea = document.createElement('textarea');
        textArea.value = textContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        const copyIcon = copyContentElement.querySelector('.copy-icon');
        if (copyIcon) {
            // 保存原始的 SVG 图标
            const originalSVG = copyIcon.innerHTML;
            
            // 切换到成功图标
            copyIcon.innerHTML = `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-check js-clipboard-check-icon color-fg-success m-2 d-none">
                <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
            </svg>`;
            copyContentElement.title = 'copied';
            
            setTimeout(() => {
                copyIcon.innerHTML = originalSVG;
                copyContentElement.title = '复制内容';
            }, 3000);
        }
    }
}
