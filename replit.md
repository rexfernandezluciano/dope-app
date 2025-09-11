# Overview

DOPE is a cross-platform social media network built with React Native and Expo. The application provides a modern social media experience with features like posting, following, commenting, polls, real-time messaging, and user analytics. It's designed to run on iOS, Android, and web platforms using a unified codebase.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React Native with Expo SDK for cross-platform development
- **Navigation**: React Navigation with stack and bottom tab navigators
- **UI Components**: React Native Paper for Material Design components
- **State Management**: React hooks and Context API for local state and scroll animations
- **Animations**: React Native Reanimated and Animatable for smooth user interactions
- **Layout**: Bottom sheet modals, tab views, and responsive design patterns

## Backend Integration
- **API Client**: Custom DOPEClient wrapper around Axios for HTTP requests
- **Authentication**: JWT token-based authentication with secure storage
- **Error Handling**: Centralized error handling with custom error classes
- **Request Management**: Singleton pattern for service classes with retry logic

## Data Architecture
- **Local Storage**: Expo SecureStore for sensitive data like authentication tokens
- **Data Models**: TypeScript interfaces for Post, User, Poll, and other entities
- **Caching Strategy**: In-memory state management with refresh controls
- **Real-time Features**: Prepared for WebSocket integration (chat functionality)

## Security Implementation
- **Token Management**: Secure storage with encryption capabilities
- **Authentication Flow**: Multi-step signup with email verification and 2FA support
- **Privacy Controls**: User-configurable privacy settings for profiles and interactions
- **Content Moderation**: Built-in moderation status tracking for posts

## Component Design Patterns
- **Memoization**: React.memo and useMemo for performance optimization
- **Custom Hooks**: Reusable hooks for scroll animations and state management
- **Service Layer**: Abstracted business logic in service classes
- **Type Safety**: Comprehensive TypeScript interfaces throughout the application

# External Dependencies

## Core Technologies
- **Expo**: Cross-platform development framework and build system
- **React Native**: Mobile application framework
- **TypeScript**: Type-safe JavaScript development
- **React Navigation**: Navigation library for screen routing

## UI and UX Libraries
- **React Native Paper**: Material Design component library
- **@gorhom/bottom-sheet**: Advanced bottom sheet component
- **react-native-reanimated**: High-performance animations
- **react-native-tab-view**: Tab navigation component

## API and Network
- **Axios**: HTTP client for API requests
- **link-preview-js**: URL preview generation for social posts
- **DOPEClient**: Custom API wrapper (internal service)

## Storage and Security
- **expo-secure-store**: Encrypted local storage for sensitive data
- **expo-crypto**: Cryptographic utilities for data encryption
- **MD5**: Hashing utilities for data integrity

## Media and Content
- **heic2any**: Image format conversion for iOS compatibility
- **react-native-webview**: Web content rendering within the app
- **expo-font**: Custom font loading and management

## Development Tools
- **Babel**: JavaScript transpilation with Expo presets
- **Metro**: React Native bundler and development server
- **ESLint/Prettier**: Code formatting and linting (implied from format comments)