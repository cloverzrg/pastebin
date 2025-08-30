// DOM elements
const loginForm = document.getElementById('loginForm');
const authForm = document.getElementById('authForm');
const pasteForm = document.getElementById('pasteForm');
const pasteCreationForm = document.getElementById('pasteCreationForm');
const pasteResult = document.getElementById('pasteResult');

const pasteLink = document.getElementById('pasteLink');
const copyLink = document.getElementById('copyLink');
const logoutBtn = document.getElementById('logoutBtn');
const settingsBtn = document.getElementById('settingsBtn');
const oauth2LoginBtn = document.getElementById('oauth2LoginBtn');
const pasteList = document.getElementById('pasteList');
const pasteTableBody = document.getElementById('pasteTableBody');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');

// Pagination state
let currentPage = 1;
let totalPages = 1;
const pageSize = 10;

// Initialize the application
checkAuthStatus();
checkOAuth2Status();

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
        // Login successful, show paste form and load paste list
        loginForm.style.display = 'none';
        pasteForm.style.display = 'block';
        pasteList.style.display = 'block';
        logoutBtn.style.display = 'inline-block';
        settingsBtn.style.display = 'inline-block';
        loadPasteList();
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
        url.pathname = '/' + data.random_id;
        url.search = '';
        pasteLink.value = url.toString();
        
        // Reload paste list to show the newly created paste
        loadPasteList();
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

// Handle settings button
settingsBtn.addEventListener('click', () => {
    window.location.href = '/settings';
});

// Handle OAuth2 login button
oauth2LoginBtn.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/oauth2/login', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (response.ok) {
            // Redirect to OAuth2 provider
            window.location.href = data.auth_url;
        } else {
            alert('OAuth2 login failed: ' + data.error);
        }
    } catch (error) {
        console.error('OAuth2 login error:', error);
        alert('OAuth2 login error');
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





// Check authentication status
async function checkAuthStatus() {
    const response = await fetch('/api/auth/check', {
        credentials: 'include'
    });
    const data = await response.json();
    
    if (data.authenticated) {
        // User is authenticated, show paste form and load paste list
        loginForm.style.display = 'none';
        pasteForm.style.display = 'block';
        pasteList.style.display = 'block';
        logoutBtn.style.display = 'inline-block';
        settingsBtn.style.display = 'inline-block';
        loadPasteList();
    } else {
        // User is not authenticated, show login form
        showLogin();
    }
}

// Check OAuth2 status
async function checkOAuth2Status() {
    try {
        const response = await fetch('/api/oauth2/status', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.oauth2_enabled) {
            oauth2LoginBtn.style.display = 'inline-block';
        } else {
            oauth2LoginBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking OAuth2 status:', error);
        oauth2LoginBtn.style.display = 'none';
    }
}

// Show login form
function showLogin() {
    loginForm.style.display = 'block';
    pasteForm.style.display = 'none';
    pasteResult.style.display = 'none';
    pasteList.style.display = 'none';
    logoutBtn.style.display = 'none';
    settingsBtn.style.display = 'none';
}

















// Load paste list with pagination
async function loadPasteList(page = 1) {
    try {
        const response = await fetch(`/api/pastes/paginated?page=${page}&page_size=${pageSize}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.error('Failed to load paste list');
            return;
        }
        
        const data = await response.json();
        currentPage = data.current_page;
        totalPages = data.total_pages;
        
        renderPasteTable(data.pastes);
        updatePaginationControls();
    } catch (error) {
        console.error('Error loading paste list:', error);
    }
}

// Render paste table rows
function renderPasteTable(pastes) {
    pasteTableBody.innerHTML = '';
    
    pastes.forEach(paste => {
        const row = document.createElement('tr');
        
        // Title cell
        const titleCell = document.createElement('td');
        const titleLink = document.createElement('a');
        titleLink.href = `/${paste.random_id}`;
        titleLink.textContent = paste.title || '无标题';
        titleLink.className = 'paste-link';
        titleCell.appendChild(titleLink);
        
        // Created at cell
        const createdCell = document.createElement('td');
        createdCell.textContent = formatRelativeTime(paste.created_at);
        createdCell.className = 'paste-date';
        
        // Actions cell
        const actionsCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '删除';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = () => deletePaste(paste.random_id, row);
        actionsCell.appendChild(deleteBtn);
        
        row.appendChild(titleCell);
        row.appendChild(createdCell);
        row.appendChild(actionsCell);
        
        pasteTableBody.appendChild(row);
    });
}

// Update pagination controls
function updatePaginationControls() {
    pageInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页`;
    
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
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

// Delete paste
async function deletePaste(randomId, row) {
    if (!confirm('确定要删除这个粘贴吗？')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/paste/${randomId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            // Remove row from table
            row.remove();
            // Reload the current page to update pagination if needed
            loadPasteList(currentPage);
        } else {
            const data = await response.json();
            alert('删除失败：' + data.error);
        }
    } catch (error) {
        console.error('Error deleting paste:', error);
        alert('删除时发生错误');
    }
}

// Pagination event listeners
if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            loadPasteList(currentPage - 1);
        }
    });
}

if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            loadPasteList(currentPage + 1);
        }
    });
}


