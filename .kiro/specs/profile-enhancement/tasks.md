# Implementation Plan: Profile Enhancement

## Overview

This implementation plan covers enhancing the Profile feature with updated ProfileScreen and five new sub-screens (PersonalInfoScreen, PaymentsScreen, NotificationsScreen, HelpCenterScreen, SettingsScreen). The implementation follows the existing architecture pattern with feature-based organization, shared component reuse, and integration with the existing navigation and state management systems.

## Tasks

- [x] 1. Set up types, interfaces, and navigation routes
  - [x] 1.1 Extend navigation types for profile sub-screens
    - Add PersonalInfo, Payments, Notifications, HelpCenter, Settings routes to RootStackParamList
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 1.2 Create profile feature types file
    - Create src/features/profile/types.ts with ThemeOption, SettingsState, PersonalInfoFormState types
    - _Requirements: 6.2, 6.4_

- [x] 2. Create shared profile components
  - [x] 2.1 Create MenuItem component
    - Create src/features/profile/components/MenuItem.tsx with icon, title, onPress, rightElement props
    - Use Ionicons and follow design system colors (c.p, c.t, c.m)
    - _Requirements: 1.4, 8.1, 8.2, 8.3_

  - [x] 2.2 Create ProfileHeader component
    - Create src/features/profile/components/ProfileHeader.tsx displaying avatar, name, email, phone, favorites/bookings count
    - _Requirements: 1.1, 1.2_

  - [x] 2.3 Create SettingRow component
    - Create src/features/profile/components/SettingRow.tsx with type prop for 'navigate' | 'select' | 'toggle' variants
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 3. Implement backend endpoint for profile updates
  - [x] 3.1 Add PATCH /api/auth/me endpoint to server
    - Update server/src/routes/auth.js to handle profile updates (name, phone)
    - Add validation for name (required, not empty) and phone (optional)
    - _Requirements: 2.5, 2.6_

- [x] 4. Create userService for profile operations
  - [ ] 4.1 Create userService.ts
    - Create src/services/userService.ts with updateProfile method
    - Define UpdateUserPayload and UpdateUserResponse types
    - _Requirements: 2.5, 2.7_

- [ ] 5. Implement PersonalInfoScreen
  - [ ] 5.1 Create PersonalInfoScreen component
    - Create src/features/profile/screens/PersonalInfoScreen.tsx with form for name and phone
    - Display email as read-only with explanatory note
    - Implement form validation (name required, phone optional format check)
    - Handle save with loading state and success/error feedback
    - Update AppContext user data on successful save
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 5.2 Write unit tests for PersonalInfoScreen
    - Test form display with current user data
    - Test validation errors for empty name and invalid phone
    - Test successful save updates context
    - Test error handling for network failures
    - _Requirements: 2.1, 2.2, 2.5, 2.6, 2.7_

- [ ] 6. Implement PaymentsScreen (placeholder)
  - [ ] 6.1 Create PaymentsScreen component
    - Create src/features/profile/screens/PaymentsScreen.tsx with placeholder UI
    - Display "Coming soon" message and payment method placeholders
    - Add "Add payment method" button that shows coming soon alert
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 7. Implement NotificationsScreen (placeholder)
  - [ ] 7.1 Create NotificationsScreen component
    - Create src/features/profile/screens/NotificationsScreen.tsx with placeholder UI
    - Display disabled toggle switches for notification categories
    - Show coming soon alert when toggles are tapped
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 8. Implement HelpCenterScreen (placeholder)
  - [ ] 8.1 Create HelpCenterScreen component
    - Create src/features/profile/screens/HelpCenterScreen.tsx with placeholder UI
    - Display sections for FAQ, Contact Support, Report a Problem
    - Show coming soon alert when sections are tapped
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 9. Implement SettingsScreen
  - [ ] 9.1 Create SettingsScreen component
    - Create src/features/profile/screens/SettingsScreen.tsx
    - Implement language selection option (placeholder for now)
    - Implement theme selection with Light/Dark/System options
    - Implement privacy settings link showing coming soon alert
    - Save theme preference to local state
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 10. Update ProfileScreen with enhanced UI
  - [x] 10.1 Refactor ProfileScreen to use new components
    - [x] Update ProfileScreen to use ProfileHeader and MenuItem components
    - [x] Add navigation to all sub-screens
    - [x] Handle guest user state with login prompt
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 10.2 Write unit tests for ProfileScreen
    - Test rendering with logged-in user
    - Test rendering with guest user (login prompt)
    - Test navigation to all sub-screens
    - Test logout functionality
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 11. Integrate navigation in RootNavigator
  - [x] 11.1 Add profile sub-screens to RootNavigator
    - [x] Import and add PersonalInfo, Payments, Notifications, HelpCenter, Settings screens
    - [x] Configure screen options for proper back navigation
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 12. Update feature barrel exports
  - [x] 12.1 Update profile index.ts exports
    - [x] Export all new screens and components from src/features/profile/index.ts
    - _Requirements: 1.3, 7.1_

- [x] 13. Checkpoint - Test navigation and core flows
  - [x] Ensure all screens navigate correctly, back returns to Profile, logout navigates to Auth screen.
  - [x] Ask the user if questions arise.

- [ ] 14. Write integration tests
  - [ ]* 14.1 Write integration tests for profile update flow
    - Test successful profile update updates AppContext
    - Test handling of network errors and 401 auth errors
    - _Requirements: 2.5, 2.7_

  - [ ]* 14.2 Write integration tests for navigation flow
    - Test all sub-screens navigate correctly from ProfileScreen
    - Test back navigation returns to ProfileScreen
    - Test logout clears stack and navigates to Auth
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 15. Final checkpoint - Verify all requirements
  - Ensure all tests pass and all acceptance criteria are met. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The design uses TypeScript with React Native, following existing project patterns
- Placeholder screens (Payments, Notifications, HelpCenter) allow incremental feature rollout
- Theme preference is stored in local state initially; AsyncStorage integration is a future enhancement
- The backend endpoint (Task 3) can be implemented in parallel with frontend tasks 1-2

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "3.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "4.1"] },
    { "id": 2, "tasks": ["5.1", "6.1", "7.1", "8.1", "9.1"] },
    { "id": 3, "tasks": ["5.2", "10.1"] },
    { "id": 4, "tasks": ["10.2", "11.1", "12.1"] },
    { "id": 5, "tasks": ["14.1", "14.2"] }
  ]
}
```
