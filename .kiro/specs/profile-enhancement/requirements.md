# Requirements Document

## Introduction

This document specifies the requirements for enhancing the Profile feature in a React Native travel application. The enhancement includes updating the existing ProfileScreen with improved UI and implementing five new sub-screens: PersonalInfoScreen, PaymentsScreen, NotificationsScreen, HelpCenterScreen, and SettingsScreen. All screens must follow the existing design system with primary color `#00BCD4` and maintain consistency with the current application architecture.

## Glossary

- **Profile_Screen**: The main profile screen displaying user information summary and navigation menu to sub-screens
- **Personal_Info_Screen**: A screen for viewing and editing user's personal information including name, email, and phone
- **Payments_Screen**: A screen displaying user's payment methods (placeholder implementation)
- **Notifications_Screen**: A screen for configuring notification preferences (placeholder implementation)
- **Help_Center_Screen**: A screen providing help and support resources (placeholder implementation)
- **Settings_Screen**: A screen for configuring application settings including language, theme, and privacy options
- **User**: A person who has registered an account in the application, possessing attributes: id, name, email, and optionally phone
- **Auth_Service**: The service handling authentication operations including login, register, and fetching current user data
- **App_Context**: The React context providing global state including user information and authentication status

## Requirements

### Requirement 1: Profile Screen Enhancement

**User Story:** As a logged-in user, I want to see a comprehensive profile screen with my information and navigation options, so that I can access all profile-related features easily.

#### Acceptance Criteria

1. THE Profile_Screen SHALL display the user's avatar, name, email, and phone number when the user is logged in
2. THE Profile_Screen SHALL display the count of favorites and bookings for the logged-in user
3. WHEN a user taps on a menu item, THE Profile_Screen SHALL navigate to the corresponding sub-screen
4. THE Profile_Screen SHALL display menu items for Personal info, Payments, Notifications, Help center, and Settings
5. WHEN a guest user (not logged in) views the Profile_Screen, THE Profile_Screen SHALL display a prompt to log in or sign up

### Requirement 2: Personal Info Screen

**User Story:** As a logged-in user, I want to view and edit my personal information, so that I can keep my profile up to date.

#### Acceptance Criteria

1. WHEN the Personal_Info_Screen loads, THE Personal_Info_Screen SHALL display the current user's name, email, and phone number
2. THE Personal_Info_Screen SHALL provide editable input fields for name and phone number
3. THE Personal_Info_Screen SHALL display the email field as read-only with a note explaining email changes require support
4. WHEN the user modifies the name or phone field, THE Personal_Info_Screen SHALL enable a save button
5. WHEN the user taps the save button with valid inputs, THE Personal_Info_Screen SHALL update the user information and display a success message
6. IF the user enters an empty name, THE Personal_Info_Screen SHALL display a validation error message
7. WHEN the save operation succeeds, THE Personal_Info_Screen SHALL update the user data in the App_Context

### Requirement 3: Payments Screen

**User Story:** As a logged-in user, I want to view my payment methods, so that I can manage how I pay for bookings.

#### Acceptance Criteria

1. WHEN the Payments_Screen loads, THE Payments_Screen SHALL display a placeholder message indicating the feature is coming soon
2. THE Payments_Screen SHALL display a list placeholder showing where payment methods would appear
3. THE Payments_Screen SHALL provide an "Add payment method" button that shows a coming soon alert when tapped

### Requirement 4: Notifications Screen

**User Story:** As a logged-in user, I want to configure my notification preferences, so that I can control how I receive updates.

#### Acceptance Criteria

1. WHEN the Notifications_Screen loads, THE Notifications_Screen SHALL display a placeholder message indicating the feature is coming soon
2. THE Notifications_Screen SHALL display toggle switches for notification categories (booking updates, promotions, messages) that are disabled
3. WHEN the user taps any disabled toggle, THE Notifications_Screen SHALL display a coming soon alert

### Requirement 5: Help Center Screen

**User Story:** As a user, I want to access help resources, so that I can find answers to common questions and get support.

#### Acceptance Criteria

1. WHEN the Help_Center_Screen loads, THE Help_Center_Screen SHALL display a placeholder message indicating the feature is coming soon
2. THE Help_Center_Screen SHALL display placeholder sections for FAQ, Contact Support, and Report a Problem
3. WHEN the user taps any help section, THE Help_Center_Screen SHALL display a coming soon alert

### Requirement 6: Settings Screen

**User Story:** As a logged-in user, I want to configure application settings, so that I can personalize my app experience.

#### Acceptance Criteria

1. WHEN the Settings_Screen loads, THE Settings_Screen SHALL display a language selection option
2. THE Settings_Screen SHALL display a theme selection option with Light, Dark, and System default choices
3. THE Settings_Screen SHALL display a privacy settings link
4. WHEN the user selects a theme option, THE Settings_Screen SHALL save the preference locally
5. WHEN the user taps the privacy settings option, THE Settings_Screen SHALL display a coming soon alert

### Requirement 7: Navigation Integration

**User Story:** As a user, I want seamless navigation between profile screens, so that I can move fluidly through the profile section.

#### Acceptance Criteria

1. WHEN the user taps the back button on any profile sub-screen, THE Navigation_System SHALL return to the Profile_Screen
2. THE Navigation_System SHALL preserve the scroll position of the Profile_Screen when returning from sub-screens
3. WHEN the user logs out from the Profile_Screen, THE Navigation_System SHALL navigate to the Auth screen and clear the navigation stack

### Requirement 8: Design Consistency

**User Story:** As a user, I want all profile screens to have a consistent look and feel, so that I have a cohesive user experience.

#### Acceptance Criteria

1. THE Profile_Screen and all sub-screens SHALL use the primary color `#00BCD4` (c.p) for interactive elements
2. THE Profile_Screen and all sub-screens SHALL use the text color `#1B1F27` (c.t) for headings
3. THE Profile_Screen and all sub-screens SHALL use the muted color `#8A8F9C` (c.m) for secondary text
4. THE Profile_Screen and all sub-screens SHALL use styles from the shared StyleSheet S for inputs, boxes, and text
5. THE Profile_Screen and all sub-screens SHALL use the Screen component from `@/components` as the root container
