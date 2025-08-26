// Get URL parameters
const pathParts = window.location.pathname.split('/');
const pasteId = pathParts[1];

// DOM elements
const loginForm = document.getElementById('loginForm');
const authForm = document.getElementById('authForm');
const pasteForm = document.getElementById('pasteForm');
const pasteCreationForm = document.getElementById('pasteCreationForm');
const pasteResult = document.getElementById('pasteResult');
const pasteView = document.getElementById('pasteView');
const pasteLink = document.getElementById('pasteLink');
const copyLink = document.getElementById('copyLink');
const logoutBtn = document.getElementById('logoutBtn');

// 展示页面相关元素将在需要时动态获取

// Check if we're viewing a paste first
if (pasteId && pasteId !== '') {
    fetchPaste(pasteId);
} else {
    // 只有在不是查看粘贴的情况下才检查认证状态
    checkAuthStatus();
}

// Handle login form submission
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('loginPassword').value;
    
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
        // Login successful, show paste form
        loginForm.style.display = 'none';
        pasteForm.style.display = 'block';
        logoutBtn.style.display = 'inline-block';
    } else {
        alert('Login failed: ' + data.error);
    }
});

// Handle paste creation form submission
pasteCreationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    
    const response = await fetch('/api/paste', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ title, content })
    });
    
    const data = await response.json();
    
    if (response.ok) {
        // Show result
        pasteForm.style.display = 'none';
        pasteResult.style.display = 'block';
        
        // Set the link with short URL format
        const url = new URL(window.location);
        url.pathname = '/' + data.id;
        url.search = '';
        pasteLink.value = url.toString();
    } else {
        if (response.status === 401) {
            alert('You need to login to create a paste');
            // Redirect to login
            showLogin();
        } else {
            alert('Error creating paste: ' + data.error);
        }
    }
});

// Handle logout
logoutBtn.addEventListener('click', async () => {
    const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
    });
    
    if (response.ok) {
        // Show login form
        showLogin();
    }
});

// Copy link to clipboard
copyLink.addEventListener('click', () => {
    pasteLink.select();
    document.execCommand('copy');
    copyLink.textContent = 'Copied!';
    setTimeout(() => {
        copyLink.textContent = 'Copy Link';
    }, 2000);
});

// 初始化展示页面控制功能
function initPasteViewControls() {
    const copyContent = document.getElementById('copyContent');

    if (copyContent) {
        copyContent.addEventListener('click', copyPasteContent);
    }
}



// Check authentication status
async function checkAuthStatus() {
    // 如果当前正在显示粘贴，不要检查认证状态
    if (pasteView.style.display === 'block') {
        return;
    }
    
    const response = await fetch('/api/auth/check', {
        credentials: 'include'
    });
    const data = await response.json();
    
    if (data.authenticated) {
        // User is authenticated, show paste form
        loginForm.style.display = 'none';
        pasteForm.style.display = 'block';
        logoutBtn.style.display = 'inline-block';
    } else {
        // User is not authenticated, show login form
        showLogin();
    }
}

// Show login form
function showLogin() {
    loginForm.style.display = 'block';
    pasteForm.style.display = 'none';
    pasteResult.style.display = 'none';
    logoutBtn.style.display = 'none';
}

// Fetch paste data
async function fetchPaste(id) {
    const response = await fetch(`/api/paste/${id}`, {
        credentials: 'include'
    });
    const data = await response.json();
    
    if (response.ok) {
        // 隐藏所有认证相关的元素
        const authSection = document.getElementById('authSection');
        if (authSection) {
            authSection.style.display = 'none';
        }
        
        // Display paste
        loginForm.style.display = 'none';
        pasteForm.style.display = 'none';
        pasteResult.style.display = 'none';
        pasteView.style.display = 'block';
        
        // 处理标题显示 - 如果没有标题则隐藏标题元素
        const pasteTitleElement = document.getElementById('pasteTitle');
        const pasteHeaderElement = document.querySelector('.paste-header');
        if (data.title && data.title.trim() !== '') {
            pasteTitleElement.textContent = data.title;
            pasteTitleElement.style.display = 'block';
            pasteHeaderElement.classList.remove('no-title');
            // 设置浏览器标签页标题
            document.title = data.title + ' pastebin';
        } else {
            pasteTitleElement.textContent = 'Untitled Paste';
            pasteTitleElement.style.display = 'block';
            pasteHeaderElement.classList.remove('no-title');
            // 设置浏览器标签页标题
            document.title = 'Untitled Paste pastebin';
        }
        document.getElementById('pasteDate').textContent = formatRelativeTime(data.created_at);
        
        // 处理内容并生成行号
        renderPasteContent(data.content);
        
        // 初始化控制功能
        initPasteViewControls();
    } else {
        alert('Error fetching paste: ' + data.error);
        // 如果获取粘贴失败，显示登录表单
        showLogin();
    }
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



