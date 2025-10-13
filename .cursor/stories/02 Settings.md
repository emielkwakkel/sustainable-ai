# Settings Feature

## Status: Todo

## Overview
The Settings page provides users with the ability to manage their WattTime API connections, configure application preferences, and access account management features.

## User Story

### As a user
I want to configure my API connections and application settings
So that I can personalize my experience and ensure the dashboard works with my data sources

## Acceptance Criteria

### WattTime API Integration
- [ ] **Register to WattTime**: Complete registration form with validation
- [ ] **Connect to WattTime**: Login form with secure credential handling
- [ ] **Token Management**: Display current token status and expiration
- [ ] **Connection Status**: Visual indicators for API connection health
- [ ] **Error Handling**: Clear error messages for failed connections

### User Interface Requirements
- [ ] **Clean Layout**: Well-organized sections with clear headings
- [ ] **Form Validation**: Real-time validation with helpful error messages
- [ ] **Loading States**: Visual feedback during API operations
- [ ] **Success Feedback**: Confirmation messages for successful operations
- [ ] **Responsive Design**: Works on all device sizes

### Security Features
- [ ] **Secure Storage**: Tokens stored securely in localStorage
- [ ] **Do not store username and password**: only the obtained token should be stored in localStorage.
- [ ] **Password Protection**: Masked password inputs
- [ ] **Token Expiration**: Automatic handling of expired tokens
- [ ] **Logout Functionality**: Secure token removal

### API Details.
- Use the https://api.watttime.org/register and https://api.watttime.org/login API uri's. 
- The `https://api.watttime.org` domain should be stored in a environment variable

## User Experience Flow

### Registration Flow
1. **Access**: User navigates to Settings page
2. **Registration**: User fills out WattTime registration form
3. **Validation**: Real-time form validation provides feedback
4. **Submission**: User submits registration
5. **Confirmation**: Success message confirms account creation
6. **Next Step**: User proceeds to connection step

### Connection Flow
1. **Connection Status**: On page load it should check if the connection to WattTime is successful. If so display a green check icon, if not a red cross icon.  
1. **Login Form**: User enters WattTime credentials
2. **Authentication**: System validates credentials with WattTime API
3. **Token Storage**: Secure token storage in localStorage
4. **Status Update**: Connection status updates in real-time.

### Settings Management
1. **Preference Updates**: User modifies application settings
2. **Real-time Updates**: Changes apply immediately
3. **Persistence**: Settings saved across browser sessions
4. **Validation**: Input validation ensures data integrity

### Error Handling
- **Network Errors**: Graceful handling of API failures
- **Validation Errors**: Clear, actionable error messages
- **Token Expiry**: Automatic token refresh or re-authentication prompts
- **Rate Limiting**: User-friendly messages for API rate limits

## Success Metrics
- **Registration Success**: 95% successful account creation
- **Connection Success**: 98% successful API connections
- **User Satisfaction**: Settings page usability score > 4.5/5
- **Error Rate**: < 2% form submission errors

## Future Enhancements
- **Multiple API Support**: Integration with additional carbon intensity APIs
- **Advanced Preferences**: More granular user customization options
- **Account Management**: Profile management and account settings
- **API Key Management**: Support for multiple API keys and regions
- **Data Export**: Export user preferences and connection history
