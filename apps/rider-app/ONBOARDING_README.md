# RideShare Rider App - Onboarding Flow

## Overview

The rider app now features a modern, multi-step onboarding flow inspired by popular ride-sharing apps like Uber, Bolt, and Lyft. This replaces the basic sign-in/sign-up flow with a more engaging and user-friendly experience.

## Onboarding Flow Steps

### 1. Phone Entry Screen (`PhoneEntryScreen.js`)
- **Purpose**: Initial entry point for user authentication
- **Features**:
  - Country code dropdown with flags
  - Phone number input with validation
  - Social login options (Google, Apple, Email)
  - "Skip Sign-In" button for testing purposes
- **Navigation**: Proceeds to UserDetailsScreen or skips to main app

### 2. User Details Screen (`UserDetailsScreen.js`)
- **Purpose**: Collect user's personal information
- **Features**:
  - First name and last name inputs
  - Pre-filled phone number (if entered in previous step)
  - Form validation
  - Back navigation to phone entry
- **Navigation**: Proceeds to OTP verification

### 3. OTP Verification Screen (`OtpVerificationScreen.js`)
- **Purpose**: Verify user's phone number
- **Features**:
  - 6-digit OTP input with auto-focus
  - Resend OTP functionality
  - Mock verification (for development)
  - Back navigation to user details
- **Navigation**: Proceeds to terms and conditions

### 4. Terms & Conditions Screen (`TermsScreen.js`)
- **Purpose**: Present and accept terms of service
- **Features**:
  - Scrollable terms and conditions
  - Checkbox for acceptance
  - Complete onboarding button
  - Back navigation to OTP verification
- **Navigation**: Completes onboarding and enters main app

## Technical Implementation

### Navigation Structure
```javascript
// App.js - Root Navigator
{token ? (
  // Main app screens
) : (
  <>
    <Stack.Screen name="Onboarding" component={OnboardingStack} />
    <Stack.Screen name="Auth" component={AuthStack} />
  </>
)}

// OnboardingStack
<Stack.Navigator screenOptions={{ headerShown: false }}>
  <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
  <Stack.Screen name="UserDetails" component={UserDetailsScreen} />
  <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
  <Stack.Screen name="Terms" component={TermsScreen} />
</Stack.Navigator>
```

### AuthContext Integration
The onboarding flow integrates with the existing AuthContext:

```javascript
// New methods added to AuthContext
const completeOnboarding = async (userData) => {
  // Creates user account and completes onboarding
  // Stores token and user data
  // Sets onboardingCompleted flag
};

const skipOnboarding = async () => {
  // Creates test account for development/testing
  // Bypasses entire onboarding flow
};
```

### Styling & Design
- **Theme**: Consistent with the app's dark gradient theme
- **Colors**: Uses the established color palette from `Colors.ts`
- **Typography**: Poppins font family throughout
- **Components**: Reuses existing UI components (Button, Card)
- **Accessibility**: Proper contrast ratios and focus states

## Usage

### For Development/Testing
1. **Skip Onboarding**: Use the "Skip Sign-In" button on the phone entry screen
2. **Complete Full Flow**: Go through all 4 screens to test the complete experience
3. **Mock Data**: All API calls are mocked for development

### For Production
1. **Backend Integration**: Replace mock API calls with real endpoints
2. **OTP Service**: Integrate with SMS service for real OTP delivery
3. **Social Login**: Implement OAuth for Google and Apple sign-in
4. **Terms & Conditions**: Replace mock terms with actual legal text

## File Structure
```
apps/rider-app/screens/onboarding/
├── PhoneEntryScreen.js      # Step 1: Phone number entry
├── UserDetailsScreen.js     # Step 2: User information
├── OtpVerificationScreen.js # Step 3: OTP verification
└── TermsScreen.js          # Step 4: Terms acceptance
```

## Key Features

### Modern UI/UX
- **Gradient Backgrounds**: Multi-stop vertical gradients with radial glow
- **Microinteractions**: Button press animations and smooth transitions
- **Accessibility**: WCAG 2.1 compliant contrast ratios
- **Responsive Design**: Works across different screen sizes

### User Experience
- **Progressive Disclosure**: Information collected step by step
- **Clear Navigation**: Back buttons and progress indicators
- **Validation**: Real-time form validation with helpful error messages
- **Flexibility**: Multiple entry points (phone, social, skip)

### Developer Experience
- **Modular Design**: Each screen is self-contained
- **Reusable Components**: Leverages existing UI components
- **Mock Data**: Easy testing without backend dependencies
- **Clear Documentation**: Well-commented code and this README

## Testing the Onboarding Flow

1. **Start the app**: `npm start` in the rider-app directory
2. **Clear storage**: If you have existing tokens, clear AsyncStorage
3. **Test skip flow**: Use "Skip Sign-In" button
4. **Test full flow**: Complete all 4 steps
5. **Test navigation**: Use back buttons and test edge cases

## Future Enhancements

- **Biometric Authentication**: Add fingerprint/face ID support
- **Profile Picture**: Allow users to add profile photos
- **Referral System**: Integrate referral codes
- **Localization**: Support for multiple languages
- **Analytics**: Track onboarding completion rates
- **A/B Testing**: Test different onboarding flows

## Troubleshooting

### Common Issues
1. **Navigation not working**: Check that all screens are properly imported in App.js
2. **Styling issues**: Ensure Colors.ts and Typography.ts are properly configured
3. **AuthContext errors**: Verify that AuthProvider wraps the entire app
4. **Font loading**: Make sure Poppins fonts are properly loaded

### Debug Tips
- Use console.log in each screen to track navigation flow
- Check AsyncStorage for token and user data
- Test on both iOS and Android simulators
- Verify all dependencies are installed correctly 