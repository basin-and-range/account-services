// API Configuration
const DEFAULT_API_BASE_URL = 'http://localhost:3000';
let API_BASE_URL = localStorage.getItem('apiBaseUrl') || DEFAULT_API_BASE_URL;
let currentAccountNumber = null;

// DOM Elements
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const statementsView = document.getElementById('statements-view');
const accountView = document.getElementById('account-view');
const createAccountView = document.getElementById('create-account-view');
const loadingOverlay = document.getElementById('loading-overlay');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initializeSettings();
    checkSavedAccount();
});

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('submit', handleLogout);
    
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', loadDashboardData);
    
    // Latest statement button
    document.getElementById('latest-statement-btn').addEventListener('click', loadLatestStatement);
    
    // Account edit form
    document.getElementById('edit-account-btn').addEventListener('click', enableAccountEdit);
    document.getElementById('cancel-edit-btn').addEventListener('click', cancelAccountEdit);
    document.getElementById('account-edit-form').addEventListener('submit', handleAccountUpdate);
    
    // Settings
    document.getElementById('settings-form').addEventListener('submit', handleSettingsSave);
    document.getElementById('test-connection-btn').addEventListener('click', testApiConnection);
    document.getElementById('reset-url-btn').addEventListener('click', resetApiUrl);
    
    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const url = e.currentTarget.dataset.url;
            document.getElementById('api-base-url').value = url;
        });
    });
    
    // Create account form
    document.getElementById('create-account-form').addEventListener('submit', handleCreateAccount);
    document.getElementById('use-new-account-btn').addEventListener('click', handleUseNewAccount);
    document.getElementById('create-another-btn').addEventListener('click', handleCreateAnother);
    document.getElementById('dismiss-error-btn').addEventListener('click', dismissEndpointError);
    document.getElementById('go-to-settings-btn').addEventListener('click', goToSettingsFromError);
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    const accountInput = document.getElementById('account-input');
    const accountNumber = accountInput.value.trim();
    
    if (!accountNumber) {
        alert('Please enter an account number');
        return;
    }
    
    currentAccountNumber = accountNumber;
    
    showLoading();
    
    try {
        await loadDashboardData();
        switchView('dashboard');
        updateNavigation('dashboard');
    } catch (error) {
        console.error('Login error:', error);
        alert('Error accessing account. Please try again.');
        hideLoading();
    }
}

// Handle logout
function handleLogout(e) {
    if (e) e.preventDefault();
    currentAccountNumber = null;
    document.getElementById('account-input').value = '';
    switchView('login');
    
    // Reset nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
}

// Check for saved account (disabled - require login each time)
function checkSavedAccount() {
    // No longer auto-login with saved account
    // Users must login each time they visit the app
    return;
}

// Handle navigation
function handleNavigation(e) {
    e.preventDefault();
    const view = e.currentTarget.dataset.view;
    
    // Settings and create-account can be accessed without login
    if (!currentAccountNumber && view !== 'login' && view !== 'settings' && view !== 'create-account') {
        alert('Please login first');
        return;
    }
    
    updateNavigation(view);
    switchView(view);
    
    // Load data based on view
    if (view === 'dashboard') {
        loadDashboardData();
    } else if (view === 'account') {
        loadAccountInfo();
    } else if (view === 'settings') {
        updateSettingsDisplay();
    } else if (view === 'create-account') {
        // Reset the create account form and hide success message
        document.getElementById('create-account-form').reset();
        document.getElementById('account-created-result').style.display = 'none';
        document.getElementById('create-account-message').style.display = 'none';
        
        // Make sure error alert is hidden and form container is visible
        document.getElementById('endpoint-not-found-alert').style.display = 'none';
        const formContainer = document.querySelector('#create-account-view .bank-statement-container');
        if (formContainer) {
            formContainer.style.display = 'block';
        }
    }
}

// Update active navigation link
function updateNavigation(view) {
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.dataset.view === view) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Switch between views
function switchView(viewName) {
    document.querySelectorAll('.view-container').forEach(view => {
        view.classList.remove('active');
    });
    
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.add('active');
    }
}

// Load dashboard data
async function loadDashboardData() {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/accounts/${currentAccountNumber}/statement/latest`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch account data');
        }
        
        const data = await response.json();
        updateDashboard(data);
        hideLoading();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        hideLoading();
        throw error;
    }
}

// Update dashboard with data
function updateDashboard(data) {
    // Update summary cards
    document.getElementById('current-balance').textContent = formatCurrency(data.balance.closing);
    document.getElementById('money-in').textContent = formatCurrency(data.money.in);
    document.getElementById('money-out').textContent = formatCurrency(data.money.out);
    document.getElementById('account-type').textContent = 'Checking'; // Default type
    
    // Update statement summary
    document.getElementById('period-dates').textContent = `${data.period.from} – ${data.period.to}`;
    document.getElementById('opening-balance').textContent = formatCurrency(data.balance.opening);
    document.getElementById('closing-balance').textContent = formatCurrency(data.balance.closing);
    document.getElementById('account-number-display').textContent = data.account || currentAccountNumber;
    document.getElementById('total-money-in').textContent = formatCurrency(data.money.in);
    document.getElementById('total-money-out').textContent = formatCurrency(data.money.out);
    
    // Update transactions table
    updateTransactionsTable(data.transactions);
}

// Update transactions table
function updateTransactionsTable(transactions) {
    const tbody = document.getElementById('transactions-body');
    
    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No transactions to display</td></tr>';
        return;
    }
    
    tbody.innerHTML = transactions.map(transaction => {
        const amountClass = transaction.amount < 0 ? 'amount-neg' : 'amount-pos';
        const amount = Math.abs(transaction.amount);
        const amountPrefix = transaction.amount < 0 ? '-' : '+';
        
        return `
            <tr>
                <td>${formatDate(transaction.date)}</td>
                <td>${transaction.type}</td>
                <td>${transaction.description}</td>
                <td class="${amountClass}">${amountPrefix}${formatCurrency(amount)}</td>
                <td>${formatCurrency(transaction.balance)}</td>
            </tr>
        `;
    }).join('');
}

// Load latest statement
async function loadLatestStatement() {
    if (!currentAccountNumber) {
        alert('Please login first');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/accounts/${currentAccountNumber}/statement/latest`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch statement');
        }
        
        const data = await response.json();
        displayStatement(data);
        hideLoading();
    } catch (error) {
        console.error('Error loading statement:', error);
        alert('Error loading statement. Please try again.');
        hideLoading();
    }
}

// Display statement in statements view
function displayStatement(data) {
    const statementContent = document.getElementById('statement-content');
    
    statementContent.innerHTML = `
        <div class="summary">
            <div class="summary-section">
                <ul>
                    <li><strong>Statement Period:</strong> ${data.period.from} – ${data.period.to}</li>
                    <li><strong>Opening Balance:</strong> ${formatCurrency(data.balance.opening)}</li>
                    <li><strong>Closing Balance:</strong> ${formatCurrency(data.balance.closing)}</li>
                </ul>
            </div>
            <div class="summary-section">
                <ul>
                    <li><strong>Account Number:</strong> ${data.account || currentAccountNumber}</li>
                    <li><strong>Money In:</strong> ${formatCurrency(data.money.in)}</li>
                    <li><strong>Money Out:</strong> ${formatCurrency(data.money.out)}</li>
                </ul>
            </div>
        </div>
        
        <div class="transactions-table-container">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Balance</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.transactions.map(transaction => {
                        const amountClass = transaction.amount < 0 ? 'amount-neg' : 'amount-pos';
                        const amount = Math.abs(transaction.amount);
                        const amountPrefix = transaction.amount < 0 ? '-' : '+';
                        
                        return `
                            <tr>
                                <td>${formatDate(transaction.date)}</td>
                                <td>${transaction.type}</td>
                                <td>${transaction.description}</td>
                                <td class="${amountClass}">${amountPrefix}${formatCurrency(amount)}</td>
                                <td>${formatCurrency(transaction.balance)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Load account info
async function loadAccountInfo() {
    if (!currentAccountNumber) {
        alert('Please login first');
        return;
    }
    
    showLoading();
    
    try {
        // Load account overview
        const overviewResponse = await fetch(`${API_BASE_URL}/accounts/${currentAccountNumber}/overview`);
        
        if (!overviewResponse.ok) {
            throw new Error('Failed to fetch account info');
        }
        
        const overviewData = await overviewResponse.json();
        
        // Also get latest statement for additional info
        const statementResponse = await fetch(`${API_BASE_URL}/accounts/${currentAccountNumber}/statement/latest`);
        const statementData = statementResponse.ok ? await statementResponse.json() : null;
        
        updateAccountInfo(overviewData, statementData);
        hideLoading();
    } catch (error) {
        console.error('Error loading account info:', error);
        hideLoading();
    }
}

// Update account info view
function updateAccountInfo(overviewData, statementData) {
    document.getElementById('info-account-number').textContent = currentAccountNumber;
    
    // Set account type in the form
    const accountType = overviewData.type || 'Checking';
    document.getElementById('account-type').value = accountType;
    
    // If we have holder information
    if (overviewData.holder) {
        if (overviewData.holder.name) {
            document.getElementById('holder-first-name').value = overviewData.holder.name.first || '';
            document.getElementById('holder-middle-name').value = overviewData.holder.name.middle || '';
            document.getElementById('holder-last-name').value = overviewData.holder.name.last || '';
        }
        
        if (overviewData.holder.dob) {
            document.getElementById('holder-dob').value = overviewData.holder.dob || '';
        }
        
        if (overviewData.holder.address) {
            document.getElementById('holder-street').value = overviewData.holder.address.street || '';
            document.getElementById('holder-city').value = overviewData.holder.address.city || '';
            document.getElementById('holder-country').value = overviewData.holder.address.country || '';
        }
    } else {
        // Set placeholder/demo values
        document.getElementById('holder-first-name').value = 'John';
        document.getElementById('holder-middle-name').value = 'Q';
        document.getElementById('holder-last-name').value = 'Public';
        document.getElementById('holder-dob').value = '1985-06-15';
        document.getElementById('holder-street').value = '123 Main Street';
        document.getElementById('holder-city').value = 'New York';
        document.getElementById('holder-country').value = 'United States';
    }
    
    // If we have details from create endpoint
    if (overviewData.details && typeof overviewData.details === 'object') {
        if (overviewData.details.domestic) {
            document.getElementById('domestic-account').textContent = overviewData.details.domestic.account || '-';
            document.getElementById('domestic-routing').textContent = overviewData.details.domestic.routing || '-';
        }
        
        if (overviewData.details.international) {
            document.getElementById('international-iban').textContent = overviewData.details.international.iban || '-';
            document.getElementById('international-bic').textContent = overviewData.details.international.bic || '-';
        }
    } else {
        // Use placeholder data
        document.getElementById('domestic-account').textContent = currentAccountNumber;
        document.getElementById('domestic-routing').textContent = '071993962';
        document.getElementById('international-iban').textContent = 'US' + currentAccountNumber.padStart(22, '0');
        document.getElementById('international-bic').textContent = 'SECUBANKUS';
    }
}

// Enable account edit mode
function enableAccountEdit() {
    // Enable all form fields
    const formFields = document.querySelectorAll('#account-edit-form input, #account-edit-form select');
    formFields.forEach(field => {
        field.disabled = false;
    });
    
    // Show form actions
    document.getElementById('form-actions').style.display = 'flex';
    
    // Hide edit button
    document.getElementById('edit-account-btn').style.display = 'none';
    
    // Hide any previous messages
    document.getElementById('update-message').style.display = 'none';
}

// Cancel account edit
function cancelAccountEdit() {
    // Reload account info to reset form
    loadAccountInfo();
    
    // Disable all form fields
    const formFields = document.querySelectorAll('#account-edit-form input, #account-edit-form select');
    formFields.forEach(field => {
        field.disabled = true;
    });
    
    // Hide form actions
    document.getElementById('form-actions').style.display = 'none';
    
    // Show edit button
    document.getElementById('edit-account-btn').style.display = 'inline-flex';
    
    // Hide any previous messages
    document.getElementById('update-message').style.display = 'none';
}

// Handle account update
async function handleAccountUpdate(e) {
    e.preventDefault();
    
    if (!currentAccountNumber) {
        alert('No account selected');
        return;
    }
    
    // Get form data
    const formData = {
        holder: {
            name: {
                first: document.getElementById('holder-first-name').value.trim(),
                middle: document.getElementById('holder-middle-name').value.trim(),
                last: document.getElementById('holder-last-name').value.trim()
            },
            dob: document.getElementById('holder-dob').value,
            address: {
                street: document.getElementById('holder-street').value.trim(),
                city: document.getElementById('holder-city').value.trim(),
                country: document.getElementById('holder-country').value.trim()
            }
        },
        type: document.getElementById('account-type').value
    };
    
    // Validate required fields
    if (!formData.holder.name.first || !formData.holder.name.last) {
        showUpdateMessage('First and last name are required', 'error');
        return;
    }
    
    if (!formData.holder.address.street || !formData.holder.address.city || !formData.holder.address.country) {
        showUpdateMessage('All address fields are required', 'error');
        return;
    }
    
    showLoading();
    
    try {
        // Attempt to call the PATCH endpoint
        const apiUrl = `${API_BASE_URL}/accounts/${currentAccountNumber}`;
        console.log('Attempting to update account at:', apiUrl);
        console.log('Request payload:', JSON.stringify(formData, null, 2));
        
        const response = await fetch(apiUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        hideLoading();
        
        console.log('Response status:', response.status);
        
        // Handle different response codes
        if (response.ok) {
            // Success - endpoint exists and update worked
            let result;
            try {
                result = await response.json();
                console.log('Update successful:', result);
            } catch (jsonError) {
                console.log('Update successful (no JSON response)');
            }
            
            showUpdateMessage('✓ Account information updated successfully!', 'success');
            
            // Reload account info to show updated data
            setTimeout(() => {
                loadAccountInfo().then(() => {
                    // Disable form fields after successful update
                    const formFields = document.querySelectorAll('#account-edit-form input, #account-edit-form select');
                    formFields.forEach(field => {
                        field.disabled = true;
                    });
                    document.getElementById('form-actions').style.display = 'none';
                    document.getElementById('edit-account-btn').style.display = 'inline-flex';
                });
            }, 1000);
            
        } else if (response.status === 404) {
            // Endpoint not found - not implemented yet
            console.warn('PATCH endpoint not found at:', apiUrl);
            showUpdateMessage(
                `⚠️ Update endpoint not found at ${API_BASE_URL}/accounts/:accountNumber\n\n` +
                'The PATCH endpoint has not been implemented on the backend yet. Your changes have been validated but cannot be saved at this time.\n\n' +
                'To enable this feature, implement the endpoint or configure a different API base URL in Settings.',
                'info'
            );
        } else if (response.status === 405) {
            // Method not allowed - endpoint exists but doesn't support PATCH
            console.warn('PATCH method not allowed at:', apiUrl);
            showUpdateMessage(
                '⚠️ The endpoint exists but does not support PATCH requests. The backend needs to be updated to handle account updates.',
                'error'
            );
        } else if (response.status === 400) {
            // Bad request - validation error from server
            let errorMsg = 'Invalid request data.';
            try {
                const errorData = await response.json();
                if (errorData.error || errorData.message) {
                    errorMsg = errorData.error || errorData.message;
                }
            } catch (e) {
                // Ignore JSON parse errors
            }
            showUpdateMessage(`✗ ${errorMsg}`, 'error');
        } else {
            // Other error
            let errorMsg = `Server responded with status ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.error || errorData.message) {
                    errorMsg += `: ${errorData.error || errorData.message}`;
                }
            } catch (e) {
                errorMsg += `: ${response.statusText}`;
            }
            showUpdateMessage(`✗ ${errorMsg}`, 'error');
        }
        
    } catch (error) {
        hideLoading();
        console.error('Error updating account:', error);
        
        // Network error or other exception
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showUpdateMessage(
                `✗ Unable to connect to the API at ${API_BASE_URL}\n\n` +
                'Please check:\n' +
                '• The backend server is running\n' +
                '• The API base URL is correct (check Settings)\n' +
                '• CORS is properly configured on the backend',
                'error'
            );
        } else {
            showUpdateMessage(`✗ Error updating account: ${error.message}`, 'error');
        }
    }
}

// Show update message
function showUpdateMessage(message, type) {
    const messageDiv = document.getElementById('update-message');
    messageDiv.textContent = message;
    messageDiv.className = `update-message ${type}`;
    messageDiv.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// Settings Functions

// Initialize settings display
function initializeSettings() {
    updateSettingsDisplay();
}

// Update settings display
function updateSettingsDisplay() {
    const currentUrl = localStorage.getItem('apiBaseUrl') || DEFAULT_API_BASE_URL;
    document.getElementById('api-base-url').value = currentUrl;
    document.getElementById('current-base-url').textContent = currentUrl;
    
    // Reset status
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.getElementById('api-status-text');
    statusIndicator.classList.remove('connected', 'error');
    statusText.textContent = 'Not tested';
}

// Handle settings save
function handleSettingsSave(e) {
    e.preventDefault();
    
    const newBaseUrl = document.getElementById('api-base-url').value.trim();
    
    // Remove trailing slash if present
    const cleanUrl = newBaseUrl.replace(/\/$/, '');
    
    // Validate URL format
    try {
        new URL(cleanUrl);
    } catch (error) {
        showSettingsMessage('Please enter a valid URL', 'error');
        return;
    }
    
    // Save to localStorage
    localStorage.setItem('apiBaseUrl', cleanUrl);
    API_BASE_URL = cleanUrl;
    
    // Update display
    document.getElementById('current-base-url').textContent = cleanUrl;
    
    showSettingsMessage('✓ API base URL updated successfully! Changes will take effect immediately.', 'success');
    
    // Reset connection status
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.getElementById('api-status-text');
    statusIndicator.classList.remove('connected', 'error');
    statusText.textContent = 'Not tested';
}

// Test API connection
async function testApiConnection() {
    const testUrl = document.getElementById('api-base-url').value.trim().replace(/\/$/, '');
    
    if (!testUrl) {
        showSettingsMessage('Please enter a base URL first', 'error');
        return;
    }
    
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.getElementById('api-status-text');
    
    // Reset status
    statusIndicator.classList.remove('connected', 'error');
    statusText.textContent = 'Testing...';
    
    showLoading();
    
    try {
        // Try to fetch from a test account endpoint
        const testAccountNumber = '12345678';
        const response = await fetch(`${testUrl}/accounts/${testAccountNumber}/statement/latest`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        hideLoading();
        
        if (response.ok) {
            statusIndicator.classList.add('connected');
            statusText.textContent = 'Connected';
            showSettingsMessage('✓ Connection successful! API is responding correctly.', 'success');
        } else if (response.status === 404) {
            statusIndicator.classList.add('connected');
            statusText.textContent = 'Connected (endpoint exists)';
            showSettingsMessage('✓ Server is reachable. Endpoint responded with expected behavior.', 'success');
        } else {
            statusIndicator.classList.add('error');
            statusText.textContent = `Error: ${response.status}`;
            showSettingsMessage(`⚠️ Server responded with status ${response.status}. Check if the API is configured correctly.`, 'error');
        }
    } catch (error) {
        hideLoading();
        statusIndicator.classList.add('error');
        statusText.textContent = 'Connection failed';
        showSettingsMessage(`✗ Unable to connect to ${testUrl}. Please check the URL and ensure the server is running.`, 'error');
        console.error('Connection test error:', error);
    }
}

// Reset API URL to default
function resetApiUrl() {
    document.getElementById('api-base-url').value = DEFAULT_API_BASE_URL;
    showSettingsMessage('URL reset to default. Click "Save Settings" to apply.', 'info');
}

// Show settings message
function showSettingsMessage(message, type) {
    const messageDiv = document.getElementById('settings-message');
    messageDiv.textContent = message;
    messageDiv.className = `update-message ${type}`;
    messageDiv.style.display = 'block';
    
    // Auto-hide messages after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Create Account Functions

// Handle create account form submission
async function handleCreateAccount(e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
        holder: {
            name: {
                first: document.getElementById('new-first-name').value.trim(),
                middle: document.getElementById('new-middle-name').value.trim(),
                last: document.getElementById('new-last-name').value.trim()
            },
            dob: document.getElementById('new-dob').value,
            address: {
                street: document.getElementById('new-street').value.trim(),
                city: document.getElementById('new-city').value.trim(),
                country: document.getElementById('new-country').value.trim(),
                zip: document.getElementById('new-zip').value.trim()
            }
        },
        type: document.getElementById('new-account-type').value
    };
    
    // Validate required fields
    if (!formData.holder.name.first || !formData.holder.name.last) {
        showCreateAccountMessage('First and last name are required', 'error');
        return;
    }
    
    if (!formData.holder.dob) {
        showCreateAccountMessage('Date of birth is required', 'error');
        return;
    }
    
    if (!formData.holder.address.street || !formData.holder.address.city || 
        !formData.holder.address.country || !formData.holder.address.zip) {
        showCreateAccountMessage('All address fields are required', 'error');
        return;
    }
    
    if (!formData.type) {
        showCreateAccountMessage('Please select an account type', 'error');
        return;
    }
    
    // Convert date to the required format
    const dobDate = new Date(formData.holder.dob);
    formData.holder.dob = dobDate.toString();
    
    showLoading();
    
    try {
        const apiUrl = `${API_BASE_URL}/accounts`;
        console.log('Creating account at:', apiUrl);
        console.log('Request payload:', JSON.stringify(formData, null, 2));
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        hideLoading();
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
            // Success - parse response
            let result;
            try {
                result = await response.json();
                console.log('Account created successfully:', result);
            } catch (jsonError) {
                console.error('Error parsing JSON response:', jsonError);
                showCreateAccountMessage('✗ Account created but could not parse response', 'error');
                return;
            }
            
            // Display success message
            showCreateAccountMessage('✓ Account created successfully!', 'success');
            
            // Display the account details
            displayCreatedAccountDetails(result);
            
            // Hide the form and show the result
            document.getElementById('create-account-form').style.display = 'none';
            document.getElementById('account-created-result').style.display = 'block';
            
        } else if (response.status === 404) {
            // Endpoint not found - show prominent error alert
            console.warn('POST endpoint not found at:', apiUrl);
            showEndpointNotFoundError(apiUrl);
        } else if (response.status === 405) {
            // Method not allowed
            console.warn('POST method not allowed at:', apiUrl);
            showCreateAccountMessage(
                '⚠️ The endpoint exists but does not support POST requests. The backend needs to be updated to handle account creation.',
                'error'
            );
        } else if (response.status === 400) {
            // Bad request - validation error from server
            let errorMsg = 'Invalid request data.';
            try {
                const errorData = await response.json();
                if (errorData.error || errorData.message) {
                    errorMsg = errorData.error || errorData.message;
                }
            } catch (e) {
                // Ignore JSON parse errors
            }
            showCreateAccountMessage(`✗ ${errorMsg}`, 'error');
        } else {
            // Other error
            let errorMsg = `Server responded with status ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.error || errorData.message) {
                    errorMsg += `: ${errorData.error || errorData.message}`;
                }
            } catch (e) {
                errorMsg += `: ${response.statusText}`;
            }
            showCreateAccountMessage(`✗ ${errorMsg}`, 'error');
        }
        
    } catch (error) {
        hideLoading();
        console.error('Error creating account:', error);
        
        // Network error or other exception
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showCreateAccountMessage(
                `✗ Unable to connect to the API at ${API_BASE_URL}\n\n` +
                'Please check:\n' +
                '• The backend server is running\n' +
                '• The API base URL is correct (check Settings)\n' +
                '• CORS is properly configured on the backend',
                'error'
            );
        } else {
            showCreateAccountMessage(`✗ Error creating account: ${error.message}`, 'error');
        }
    }
}

// Display created account details
function displayCreatedAccountDetails(accountData) {
    // Store the new account number for later use
    window.newAccountNumber = accountData.details?.domestic?.account || 'Unknown';
    
    // Display account type
    document.getElementById('created-account-type').textContent = accountData.type || 'Unknown';
    
    // Display domestic banking details
    if (accountData.details && accountData.details.domestic) {
        document.getElementById('created-domestic-account').textContent = 
            accountData.details.domestic.account || '-';
        document.getElementById('created-domestic-routing').textContent = 
            accountData.details.domestic.routing || '-';
    } else {
        document.getElementById('created-domestic-account').textContent = '-';
        document.getElementById('created-domestic-routing').textContent = '-';
    }
    
    // Display international banking details
    if (accountData.details && accountData.details.international) {
        document.getElementById('created-international-iban').textContent = 
            accountData.details.international.iban || '-';
        document.getElementById('created-international-bic').textContent = 
            accountData.details.international.bic || '-';
    } else {
        document.getElementById('created-international-iban').textContent = '-';
        document.getElementById('created-international-bic').textContent = '-';
    }
}

// Handle "Login to New Account" button
function handleUseNewAccount() {
    if (window.newAccountNumber && window.newAccountNumber !== 'Unknown') {
        // Set the account number in the login form
        document.getElementById('account-input').value = window.newAccountNumber;
        
        // Set as current account
        currentAccountNumber = window.newAccountNumber;
        
        // Load dashboard and switch view
        showLoading();
        loadDashboardData()
            .then(() => {
                switchView('dashboard');
                updateNavigation('dashboard');
            })
            .catch(error => {
                console.error('Error loading new account:', error);
                // If loading fails, just go to login screen with the account number pre-filled
                switchView('login');
                updateNavigation('login');
                alert('Account created! Please click "Access Account" to login.');
                hideLoading();
            });
    } else {
        alert('No account number available. Please note your account details and login manually.');
        switchView('login');
        updateNavigation('login');
    }
}

// Handle "Create Another Account" button
function handleCreateAnother() {
    // Reset the form
    document.getElementById('create-account-form').reset();
    document.getElementById('create-account-form').style.display = 'block';
    document.getElementById('account-created-result').style.display = 'none';
    document.getElementById('create-account-message').style.display = 'none';
    
    // Clear stored account number
    window.newAccountNumber = null;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show create account message
function showCreateAccountMessage(message, type) {
    const messageDiv = document.getElementById('create-account-message');
    messageDiv.textContent = message;
    messageDiv.className = `update-message ${type}`;
    messageDiv.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// Show prominent endpoint not found error
function showEndpointNotFoundError(endpointUrl) {
    const errorAlert = document.getElementById('endpoint-not-found-alert');
    const endpointUrlDisplay = document.getElementById('error-endpoint-url');
    const formContainer = document.querySelector('#create-account-view .bank-statement-container');
    
    // Set the endpoint URL in the error message
    endpointUrlDisplay.textContent = endpointUrl;
    
    // Hide the form container and show the error alert
    formContainer.style.display = 'none';
    errorAlert.style.display = 'block';
    
    // Scroll to top to ensure the error is visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Dismiss the endpoint error alert
function dismissEndpointError() {
    const errorAlert = document.getElementById('endpoint-not-found-alert');
    const formContainer = document.querySelector('#create-account-view .bank-statement-container');
    
    // Hide the error alert and show the form container
    errorAlert.style.display = 'none';
    formContainer.style.display = 'block';
}

// Navigate to settings from error alert
function goToSettingsFromError() {
    // Hide the error alert first
    dismissEndpointError();
    
    // Navigate to settings
    updateNavigation('settings');
    switchView('settings');
    updateSettingsDisplay();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Utility functions
function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return dateString; // Return original if can't parse
    }
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function showLoading() {
    loadingOverlay.classList.add('active');
}

function hideLoading() {
    loadingOverlay.classList.remove('active');
}

// Add logout button functionality
document.getElementById('logout-btn').addEventListener('click', handleLogout);

