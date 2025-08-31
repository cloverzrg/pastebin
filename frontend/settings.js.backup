// 设置页面JavaScript逻辑

// DOM元素
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const aiSettingsForm = document.getElementById('aiSettingsForm');
const oauth2SettingsForm = document.getElementById('oauth2SettingsForm');
const messageArea = document.getElementById('messageArea');
const logoutBtn = document.getElementById('logoutBtn');

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    // 检查认证状态
    checkAuthStatus();
    
    // 加载配置
    loadAIConfig();
    loadOAuth2Config();
    
    // 绑定事件
    bindEvents();
});

// 检查认证状态
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/check', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (!data.authenticated) {
            // 未认证，重定向到首页
            window.location.href = '/';
            return;
        }
        
        // 显示登出按钮
        logoutBtn.style.display = 'inline-block';
    } catch (error) {
        console.error('Error checking auth status:', error);
        window.location.href = '/';
    }
}

// 绑定事件
function bindEvents() {
    // 标签页切换
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // AI设置表单提交
    aiSettingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveAIConfig();
    });
    
    // OAuth2设置表单提交
    oauth2SettingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveOAuth2Config();
    });
    
    // 测试按钮
    document.getElementById('testAiBtn').addEventListener('click', testAIConnection);
    document.getElementById('testOauth2Btn').addEventListener('click', testOAuth2Config);
    
    // 获取模型按钮
    document.getElementById('fetchModelsBtn').addEventListener('click', fetchAIModels);
    
    // 登出按钮
    logoutBtn.addEventListener('click', logout);
}

// 切换标签页
function switchTab(tabName) {
    // 更新按钮状态
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    // 更新内容显示
    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tabName + '-tab') {
            content.classList.add('active');
        }
    });
}

// 加载AI配置
async function loadAIConfig() {
    try {
        const response = await fetch('/api/config/ai', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const config = await response.json();
            
            document.getElementById('aiEnabled').checked = config.enabled;
            document.getElementById('aiBaseUrl').value = config.base_url || '';
            document.getElementById('aiApiKey').value = config.api_key || '';
            document.getElementById('aiModel').value = config.model || 'gpt-3.5-turbo';
            document.getElementById('aiPrompt').value = config.prompt || '';
            document.getElementById('aiMaxTokens').value = config.max_tokens || 50;
            document.getElementById('aiTemperature').value = config.temperature || '0.7';
        }
    } catch (error) {
        console.error('Error loading AI config:', error);
        showMessage('加载AI配置失败', 'error');
    }
}

// 加载OAuth2配置
async function loadOAuth2Config() {
    try {
        const response = await fetch('/api/config/oauth2', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const config = await response.json();
            
            document.getElementById('oauth2Enabled').checked = config.enabled;
            document.getElementById('oauth2Name').value = config.name || '';
            document.getElementById('oauth2ClientId').value = config.client_id || '';
            document.getElementById('oauth2ClientSecret').value = config.client_secret || '';
            document.getElementById('oauth2AuthUrl').value = config.auth_url || '';
            document.getElementById('oauth2TokenUrl').value = config.token_url || '';
            document.getElementById('oauth2UserInfoUrl').value = config.user_info_url || '';
            document.getElementById('oauth2RedirectUrl').value = config.redirect_url || '';
            document.getElementById('oauth2Scopes').value = config.scopes || '';
        }
    } catch (error) {
        console.error('Error loading OAuth2 config:', error);
        showMessage('加载OAuth2配置失败', 'error');
    }
}

// 保存AI配置
async function saveAIConfig() {
    const config = {
        enabled: document.getElementById('aiEnabled').checked,
        base_url: document.getElementById('aiBaseUrl').value.trim(),
        api_key: document.getElementById('aiApiKey').value.trim(),
        model: document.getElementById('aiModel').value,
        prompt: document.getElementById('aiPrompt').value.trim(),
        max_tokens: parseInt(document.getElementById('aiMaxTokens').value) || 50,
        temperature: document.getElementById('aiTemperature').value || '0.7'
    };
    
    try {
        const response = await fetch('/api/config/ai', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(config)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage('AI配置保存成功', 'success');
        } else {
            showMessage('保存失败: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error saving AI config:', error);
        showMessage('保存AI配置时发生错误', 'error');
    }
}

// 保存OAuth2配置
async function saveOAuth2Config() {
    const config = {
        enabled: document.getElementById('oauth2Enabled').checked,
        name: document.getElementById('oauth2Name').value.trim(),
        client_id: document.getElementById('oauth2ClientId').value.trim(),
        client_secret: document.getElementById('oauth2ClientSecret').value.trim(),
        auth_url: document.getElementById('oauth2AuthUrl').value.trim(),
        token_url: document.getElementById('oauth2TokenUrl').value.trim(),
        user_info_url: document.getElementById('oauth2UserInfoUrl').value.trim(),
        redirect_url: document.getElementById('oauth2RedirectUrl').value.trim(),
        scopes: document.getElementById('oauth2Scopes').value.trim()
    };
    
    try {
        const response = await fetch('/api/config/oauth2', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(config)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage('OAuth2配置保存成功', 'success');
        } else {
            showMessage('保存失败: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error saving OAuth2 config:', error);
        showMessage('保存OAuth2配置时发生错误', 'error');
    }
}

// 测试AI连接
async function testAIConnection() {
    const testBtn = document.getElementById('testAiBtn');
    const originalText = testBtn.textContent;
    
    testBtn.textContent = '测试中...';
    testBtn.disabled = true;
    
    try {
        // 使用AI服务生成测试标题
        const testContent = "console.log('Hello World');";
        const response = await fetch('/api/test/ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ content: testContent })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            if (result.title) {
                showMessage(`AI连接成功！生成的测试标题：${result.title}`, 'success');
            } else {
                showMessage('AI连接成功，但未返回标题（可能AI功能未启用或API Key为空）', 'info');
            }
        } else {
            showMessage('AI连接失败: ' + result.error, 'error');
        }
    } catch (error) {
        showMessage('测试AI连接时发生错误: ' + error.message, 'error');
    } finally {
        testBtn.textContent = originalText;
        testBtn.disabled = false;
    }
}

// 测试OAuth2配置
async function testOAuth2Config() {
    const testBtn = document.getElementById('testOauth2Btn');
    const originalText = testBtn.textContent;
    
    testBtn.textContent = '测试中...';
    testBtn.disabled = true;
    
    try {
        const response = await fetch('/api/oauth2/status', {
            credentials: 'include'
        });
        const result = await response.json();
        
        if (response.ok) {
            if (result.oauth2_enabled) {
                showMessage('OAuth2配置已启用', 'success');
            } else {
                showMessage('OAuth2配置未启用', 'info');
            }
        } else {
            showMessage('测试OAuth2配置失败', 'error');
        }
    } catch (error) {
        showMessage('测试OAuth2配置时发生错误', 'error');
    } finally {
        testBtn.textContent = originalText;
        testBtn.disabled = false;
    }
}

// 显示消息
function showMessage(message, type) {
    messageArea.textContent = message;
    messageArea.className = 'message-area ' + type;
    messageArea.style.display = 'block';
    
    // 3秒后自动隐藏成功消息
    if (type === 'success') {
        setTimeout(() => {
            messageArea.style.display = 'none';
        }, 3000);
    }
}

// 登出功能
async function logout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// 获取AI模型列表
async function fetchAIModels() {
    const fetchBtn = document.getElementById('fetchModelsBtn');
    const originalText = fetchBtn.textContent;
    
    fetchBtn.textContent = '获取中...';
    fetchBtn.disabled = true;
    
    try {
        const response = await fetch('/api/models', {
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (response.ok && result.models) {
            // 更新模型列表
            updateModelList(result.models);
            showMessage(`成功获取 ${result.count} 个可用模型`, 'success');
        } else {
            showMessage('获取模型列表失败: ' + (result.error || '未知错误'), 'error');
        }
    } catch (error) {
        showMessage('获取模型列表时发生错误: ' + error.message, 'error');
    } finally {
        fetchBtn.textContent = originalText;
        fetchBtn.disabled = false;
    }
}

// 更新模型列表选项
function updateModelList(models) {
    const modelInput = document.getElementById('aiModel');
    const modelList = document.getElementById('modelList');
    
    // 清空现有选项
    modelList.innerHTML = '';
    
    // 添加新的模型选项
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.id;
        modelList.appendChild(option);
    });
    
    // 如果当前没有选择模型且有可用模型，选择第一个
    if (!modelInput.value && models.length > 0) {
        modelInput.value = models[0].id;
    }
}
