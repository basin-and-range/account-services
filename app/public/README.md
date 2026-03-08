# Online Banking Web Application

A modern, clean web front-end for the Accounts API that simulates an online banking experience.

## Features

- **Dashboard View**: Overview of account balance, transactions, and financial summary
- **Account Statements**: View latest account statements with detailed transaction history
- **Account Information**: Display and edit account details including:
  - Personal information (name, date of birth)
  - Address information (street, city, country)
  - Account type selection
  - Domestic and international banking information (read-only)
- **Editable Account Info**: Click "Edit Information" to modify account holder details
- **Settings Page**: Configure application preferences
  - Change API base URL to point to different backend environments
  - Test API connection before saving
  - Quick preset buttons for common configurations (local, staging, production)
  - Reset to default settings
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional interface matching banking industry standards

## Getting Started

### Prerequisites

- Node.js and npm installed
- The backend API server running (from the parent directory)

### Running the Application

1. Start the backend server from the project root:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. **(Optional) Configure API Settings**:
   - Click the **Settings** (gear icon) in the navigation
   - Change the API Base URL if your backend is running on a different port or server
   - Click **Test Connection** to verify the API is reachable
   - Click **Save Settings** to persist your changes

4. Enter any account number (e.g., `12345678`) to access the banking dashboard

5. **Explore the interface**:
   - **Dashboard** - View your balance and recent transactions
   - **Statements** - Click "View Latest Statement" for detailed reports
   - **Account** - See and edit your account information and routing details
   - **Settings** - Configure the API base URL and test connections

## 🔧 Settings & Configuration

### Changing the API Base URL

1. Click the **Settings** icon (⚙️) in the navigation bar
2. Enter your desired API base URL in the input field
3. Click **Test Connection** to verify the API is accessible
4. Click **Save Settings** to apply changes
5. Your new API URL is saved in localStorage and will persist across sessions

### Quick Presets

The Settings page includes preset buttons for common configurations:
- **Local Development** - `http://localhost:3000`
- **Local (Port 8080)** - `http://localhost:8080`
- **Staging** - `https://api-staging.example.com`
- **Production** - `https://api.example.com`

Click any preset to populate the URL field, then save to apply.

### Resetting to Default

Click the **Reset to Default** button to restore the original API base URL (`http://localhost:3000`).

## Application Structure

- `index.html` - Main HTML structure
- `styles.css` - Styling with modern banking theme
- `app.js` - Application logic and API integration

## API Endpoints Used

- `GET /accounts/:accountNumber/statement/latest` - Retrieve latest account statement
- `GET /accounts/:accountNumber/overview` - Get account overview
- `GET /accounts/:accountNumber/statement/date` - Get statement by date range
- `PATCH /accounts/:accountNumber` - Update account holder information (not yet implemented on backend)

### Account Update Endpoint (Ready for Implementation)

The frontend **actively calls** the PATCH endpoint with the following request body structure:

```json
{
  "holder": {
    "name": {
      "first": "string",
      "middle": "string",
      "last": "string"
    },
    "dob": "YYYY-MM-DD",
    "address": {
      "street": "string",
      "city": "string",
      "country": "string"
    }
  },
  "type": "string"
}
```

**Current Behavior:**
- The "Save Changes" button **makes a real API call** to `PATCH /accounts/:accountNumber`
- If the endpoint returns **404** (Not Found), a friendly message explains the endpoint isn't implemented yet
- If the endpoint returns **200/201**, the update succeeds and account info is reloaded
- If the endpoint returns **400** (Bad Request), validation errors from the server are displayed
- If the endpoint returns **405** (Method Not Allowed), it indicates PATCH needs to be enabled
- Network errors provide helpful troubleshooting guidance

**How to Enable:**
1. Implement the PATCH endpoint on your backend at `/accounts/:accountNumber`
2. OR configure the API base URL in Settings to point to a server that has the endpoint
3. The frontend will automatically work once the endpoint is available - no code changes needed!

Users can:
1. Click "Edit Information" on the Account page
2. Modify personal details, address, and account type
3. Click "Save Changes" to attempt the update
4. Receive detailed feedback based on the server response

## Design Features

- **Color Scheme**: Professional blue theme (#1a237e) consistent with banking applications
- **Typography**: Segoe UI and Roboto fonts for readability
- **Layout**: Card-based design with clear information hierarchy
- **Interactions**: Smooth transitions and hover effects
- **Accessibility**: Semantic HTML and clear visual indicators

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Security Note

This is a demonstration application. In a production environment, you would need to add:
- User authentication and authorization
- HTTPS encryption
- CSRF protection
- Session management
- Input validation and sanitization
- Rate limiting

## Styling Based On

The design follows the same aesthetic as the Postman visualization (`postman/Visualization/new-visualization.js`), maintaining consistency across the application ecosystem.

