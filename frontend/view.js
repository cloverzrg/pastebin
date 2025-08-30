// Get URL parameters to extract paste ID
const pathParts = window.location.pathname.split('/');
const pasteId = pathParts[1];

// DOM elements
const pasteView = document.getElementById('pasteView');
const errorMessage = document.getElementById('errorMessage');
const loading = document.getElementById('loading');

// 语法高亮状态 - 默认启用语法高亮
let isHighlightMode = true;
let currentPasteContent = '';

// 滚动处理函数
let handleScrollFn = null;

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
    
    // 保存内容
    currentPasteContent = data.content;
    
    // 自动检测是否为日志内容
    if (isLogContent(data.content)) {
        isHighlightMode = false; // 自动切换到日志模式
    }
    
    // 渲染内容
    renderPasteContent(data.content);
    
    // 初始化控制按钮功能
    initPasteViewControls();
    
    // 确保控制按钮状态正确更新
    updateToggleButtonState();
}

// 检测内容是否为日志
function isLogContent(content) {
    if (!content || content.trim() === '') {
        return false;
    }
    
    const lines = content.split('\n');
    const totalLines = lines.length;
    
    // 如果内容太短，不太可能是日志
    if (totalLines < 3) {
        return false;
    }
    
    let logIndicators = 0;
    let timestampLines = 0;
    let logLevelLines = 0;
    let ipAddressLines = 0;
    let urlLines = 0;
    
    // 检查前50行（或全部行，如果总行数小于50）
    const linesToCheck = Math.min(50, totalLines);
    
    for (let i = 0; i < linesToCheck; i++) {
        const line = lines[i].trim();
        if (line === '') continue;
        
        // 检测时间戳格式
        const timestampPatterns = [
            /^\d{4}-\d{2}-\d{2}[\s\T]\d{2}:\d{2}:\d{2}/, // 2024-01-01 12:00:00 或 2024-01-01T12:00:00
            /^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}/, // 01/01/2024 12:00:00
            /^\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2}/, // 01-01-2024 12:00:00
            /^\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}/, // Jan 1 12:00:00
            /^\[\d{4}-\d{2}-\d{2}[\s\T]\d{2}:\d{2}:\d{2}/, // [2024-01-01 12:00:00]
            /^\d{2}:\d{2}:\d{2}/ // 12:00:00
        ];
        
        // 检测日志级别
        const logLevelPatterns = [
            /\b(DEBUG|INFO|WARN|WARNING|ERROR|FATAL|TRACE|CRITICAL)\b/i,
            /\b(debug|info|warn|warning|error|fatal|trace|critical)\b/,
            /\[(DEBUG|INFO|WARN|WARNING|ERROR|FATAL|TRACE|CRITICAL)\]/i,
            /\[(debug|info|warn|warning|error|fatal|trace|critical)\]/
        ];
        
        // 检测IP地址
        const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;
        
        // 检测URL/路径
        const urlPatterns = [
            /https?:\/\/[^\s]+/,
            /\/[a-zA-Z0-9\/_\-\.]+/,
            /"[A-Z]+\s+\/[^\s]*\s+HTTP/i // HTTP请求格式
        ];
        
        // 检查时间戳
        if (timestampPatterns.some(pattern => pattern.test(line))) {
            timestampLines++;
            logIndicators++;
        }
        
        // 检查日志级别
        if (logLevelPatterns.some(pattern => pattern.test(line))) {
            logLevelLines++;
            logIndicators++;
        }
        
        // 检查IP地址
        if (ipPattern.test(line)) {
            ipAddressLines++;
            logIndicators++;
        }
        
        // 检查URL/路径
        if (urlPatterns.some(pattern => pattern.test(line))) {
            urlLines++;
            logIndicators++;
        }
        
        // 检查常见的日志关键词
        const logKeywords = [
            /\bexception\b/i,
            /\bstack\s*trace\b/i,
            /\berror\s*code\b/i,
            /\bresponse\s*time\b/i,
            /\brequest\s*id\b/i,
            /\buser\s*agent\b/i,
            /\breferer\b/i,
            /\bstatus\s*code\b/i,
            /\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+/,
            /\b\d{3}\s+\d+/, // HTTP状态码和响应大小
            /\bms\b|\bmilliseconds\b/i, // 响应时间
        ];
        
        if (logKeywords.some(pattern => pattern.test(line))) {
            logIndicators++;
        }
    }
    
    // 计算各种特征的比例
    const timestampRatio = timestampLines / linesToCheck;
    const logLevelRatio = logLevelLines / linesToCheck;
    const ipRatio = ipAddressLines / linesToCheck;
    const urlRatio = urlLines / linesToCheck;
    const totalIndicatorRatio = logIndicators / linesToCheck;
    
    // 判断逻辑：
    // 1. 如果超过30%的行包含时间戳，很可能是日志
    // 2. 如果超过20%的行包含日志级别，很可能是日志
    // 3. 如果超过15%的行包含IP地址，可能是访问日志
    // 4. 如果超过20%的行包含URL，可能是访问日志
    // 5. 总体指标超过40%，很可能是日志
    
    return timestampRatio > 0.3 || 
           logLevelRatio > 0.2 || 
           (ipRatio > 0.15 && urlRatio > 0.2) ||
           totalIndicatorRatio > 0.4;
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
    if (isHighlightMode) {
        renderHighlightedContent(content);
    } else {
        renderPlainContent(content);
    }
}

// 普通模式渲染
function renderPlainContent(content) {
    const lines = content.split('\n');
    const lineNumbersElement = document.getElementById('lineNumbers');
    const pasteContentElement = document.getElementById('pasteContent');
    const pasteContentContainer = document.getElementById('pasteContentContainer');
    const pasteContentWrapper = document.querySelector('.paste-content-wrapper');
    
    if (!lineNumbersElement || !pasteContentElement || !pasteContentContainer || !pasteContentWrapper) {
        console.error('Required elements not found');
        return;
    }
    
    // 移除高亮模式样式
    pasteContentWrapper.classList.remove('highlight-mode');
    
    // 显示行号
    lineNumbersElement.style.display = 'block';
    
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

// 语法高亮模式渲染
function renderHighlightedContent(content) {
    const pasteContentElement = document.getElementById('pasteContent');
    const pasteContentWrapper = document.querySelector('.paste-content-wrapper');
    const lineNumbersElement = document.getElementById('lineNumbers');
    
    if (!pasteContentElement || !pasteContentWrapper || !lineNumbersElement) {
        console.error('Required elements not found');
        return;
    }
    
    // 添加高亮模式样式
    pasteContentWrapper.classList.add('highlight-mode');
    
    // 隐藏原有行号
    lineNumbersElement.style.display = 'none';
    
    // 创建代码块并应用语法高亮
    const codeElement = document.createElement('code');
    codeElement.textContent = content;
    pasteContentElement.innerHTML = '';
    pasteContentElement.appendChild(codeElement);
    
    // 自动检测语言并应用高亮
    hljs.highlightElement(codeElement);
    
    // 添加行号
    setTimeout(() => {
        if (typeof hljs !== 'undefined' && hljs.lineNumbersBlock) {
            hljs.lineNumbersBlock(codeElement);
        } else if (typeof window.hljs !== 'undefined' && window.hljs.lineNumbersBlock) {
            window.hljs.lineNumbersBlock(codeElement);
        } else {
            // 备用方案：尝试全局初始化
            if (typeof window.hljs !== 'undefined' && window.hljs.initLineNumbersOnLoad) {
                window.hljs.initLineNumbersOnLoad();
            }
            console.warn('highlightjs-line-numbers plugin not found or not properly loaded');
        }
    }, 50);
    
    // 移除滚动同步（语法高亮模式不需要）
    const pasteContentContainer = document.getElementById('pasteContentContainer');
    if (pasteContentContainer && handleScrollFn) {
        pasteContentContainer.removeEventListener('scroll', handleScrollFn);
        handleScrollFn = null;
    }
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 设置滚动同步
function setupScrollSync() {
    const pasteContentContainer = document.getElementById('pasteContentContainer');
    const lineNumbersElement = document.getElementById('lineNumbers');
    
    if (!pasteContentContainer || !lineNumbersElement) {
        return;
    }
    
    // 移除之前的事件监听器（如果存在）
    if (handleScrollFn) {
        pasteContentContainer.removeEventListener('scroll', handleScrollFn);
    }
    
    // 创建新的滚动处理函数
    handleScrollFn = function() {
        // 同步滚动行号
        const scrollTop = pasteContentContainer.scrollTop;
        lineNumbersElement.style.transform = `translateY(-${scrollTop}px)`;
    };
    
    // 添加滚动事件监听器
    pasteContentContainer.addEventListener('scroll', handleScrollFn);
}

// 初始化展示页面控制功能
function initPasteViewControls() {
    const copyContent = document.getElementById('copyContent');
    const logModeToggle = document.getElementById('logModeToggle');
    const rawButton = document.getElementById('rawButton');

    if (copyContent) {
        copyContent.addEventListener('click', copyPasteContent);
    }
    
    if (logModeToggle) {
        logModeToggle.addEventListener('click', toggleLogMode);
        // 初始化按钮状态
        updateToggleButtonState();
    }

    if (rawButton) {
        rawButton.addEventListener('click', openRawView);
    }
}

// 切换日志模式
function toggleLogMode() {
    isHighlightMode = !isHighlightMode;
    
    // 更新按钮状态
    updateToggleButtonState();
    
    // 重新渲染内容
    renderPasteContent(currentPasteContent);
}

// 更新切换按钮状态
function updateToggleButtonState() {
    const logModeToggle = document.getElementById('logModeToggle');
    const body = document.body;
    if (logModeToggle) {
        if (isHighlightMode) {
            // 当前是语法高亮模式，按钮用于切换到日志模式
            logModeToggle.style.background = '#f8f9fa';
            logModeToggle.style.color = '#495057';
            logModeToggle.title = '切换到日志模式';
            body.classList.remove('log-mode');
        } else {
            // 当前是日志模式，按钮用于切换到语法高亮模式
            logModeToggle.style.background = '#2980b9';
            logModeToggle.style.color = 'white';
            logModeToggle.title = '切换到代码高亮模式';
            body.classList.add('log-mode');
        }
    }
}

// 复制内容
async function copyPasteContent() {
    const pasteContentElement = document.getElementById('pasteContent');
    const copyContentElement = document.getElementById('copyContent');
    
    if (!pasteContentElement || !copyContentElement) return;
    
    try {
        let textContent;
        if (isHighlightMode) {
            // 语法高亮模式：直接获取原始内容
            textContent = currentPasteContent;
        } else {
            // 普通模式：从各个代码行元素中提取文本
            const codeLines = pasteContentElement.querySelectorAll('.code-line');
            textContent = Array.from(codeLines).map(line => line.textContent).join('\n');
        }
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
        let textContent;
        if (isHighlightMode) {
            textContent = currentPasteContent;
        } else {
            const codeLines = pasteContentElement.querySelectorAll('.code-line');
            textContent = Array.from(codeLines).map(line => line.textContent).join('\n');
        }
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

// 打开原始内容视图
function openRawView() {
    if (pasteId && pasteId !== '') {
        window.open(`/raw/${pasteId}`, '_blank');
    }
}
