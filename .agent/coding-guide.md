# Coding Guide

## Purpose

This document defines the coding standards and architectural patterns for this project. All code must adhere to these guidelines to ensure consistency, maintainability, and testability.

## Core Principles

### 1. ES6 Module Pattern

- Use ES6 `import`/`export` syntax exclusively
- Each class should be in its own module file
- Export classes as named or default exports
- No CommonJS (`require`, `module.exports`)

**Example:**

```javascript
// userService.js
export class UserService {
  // implementation
}

// app.js
import { UserService } from "./userService.js";
```

### 2. ES6 Classes

- Use ES6 class syntax for all object-oriented code
- Avoid prototype-based patterns
- Use class inheritance where appropriate with `extends`

**Example:**

```javascript
export class BaseService {
  constructor(logger) {
    this._logger = logger;
  }
}

export class UserService extends BaseService {
  constructor(logger, apiClient) {
    super(logger);
    this._apiClient = apiClient;
  }
}
```

### 3. Constructor Dependency Injection

- **All dependencies MUST be injected via the constructor**
- No dependencies should be instantiated inside classes
- No imports of concrete implementations within class files (only interfaces/types)
- This ensures testability and loose coupling

**Example:**

```javascript
// ❌ BAD - Don't do this
export class OrderService {
  constructor() {
    this._userService = new UserService(); // Don't instantiate
    this._logger = Logger.getInstance(); // Don't use singletons
  }
}

// ✅ GOOD - Do this
export class OrderService {
  constructor(userService, logger, apiClient) {
    this._userService = userService;
    this._logger = logger;
    this._apiClient = apiClient;
  }
}
```

### 4. ES6 Getters/Setters & Alpine.js Public Fields

- Use private fields (prefixed with `_`) for internal state
- Use ES6 getters/setters for computed properties or encapsulated access
- **Properties that need to be bound in Alpine.js MUST be public fields** (no underscore prefix)
- Alpine.js requires direct field access for reactive bindings

**Example:**

```javascript
export class UserViewModel {
  constructor(userService) {
    this._userService = userService;

    // Public fields for Alpine.js bindings
    this.username = "";
    this.email = "";
    this.isLoading = false;
  }

  // Private computed property using getter
  get _isValid() {
    return this.username.length > 0 && this.email.includes("@");
  }

  // Public getter for Alpine access
  get displayName() {
    return this.username || "Guest";
  }

  // Setter with validation
  set username(value) {
    this._username = value.trim();
  }
}
```

### 5. Semantic Methods

- Method names must clearly describe their purpose and behavior
- Use verb-noun patterns: `getUserById`, `createOrder`, `validateInput`
- Avoid ambiguous names like `process`, `handle`, `do`
- Method name should make the intent obvious without reading implementation

**Example:**

```javascript
// ❌ BAD
class UserService {
  process(data) {}
  handle(id) {}
  do() {}
}

// ✅ GOOD
class UserService {
  createUser(userData) {}
  findUserById(userId) {}
  updateUserEmail(userId, newEmail) {}
  deleteUser(userId) {}
}
```

### 6. No Magic Strings as Method Parameters

- Never pass string literals that determine behavior
- Use enums, constants, or dedicated methods instead
- Magic strings make code fragile and hard to refactor

**Example:**

```javascript
// ❌ BAD - Magic strings
class NotificationService {
  send(message, type) {
    if (type === "email") {
      /* ... */
    }
    if (type === "sms") {
      /* ... */
    }
  }
}
notificationService.send("Hello", "email"); // What are the valid types?

// ✅ GOOD - Dedicated methods
class NotificationService {
  sendEmail(message) {
    /* ... */
  }
  sendSms(message) {
    /* ... */
  }
  sendPushNotification(message) {
    /* ... */
  }
}

// ✅ ALSO GOOD - Using enums/constants
const NotificationType = {
  EMAIL: Symbol("email"),
  SMS: Symbol("sms"),
  PUSH: Symbol("push"),
};

class NotificationService {
  send(message, type) {
    switch (type) {
      case NotificationType.EMAIL:
        /* ... */ break;
      case NotificationType.SMS:
        /* ... */ break;
      case NotificationType.PUSH:
        /* ... */ break;
    }
  }
}
```

### 7. No Static Classes or Global Methods

- **No static class methods** (except factory methods when appropriate)
- **No global functions** or singleton patterns
- All functionality must be injected as dependencies
- This ensures testability and proper dependency management

**Example:**

```javascript
// ❌ BAD - Static methods and globals
class Logger {
  static log(message) {
    console.log(message);
  }
}

function globalHelper() {
  return 42;
}

// ❌ BAD - Using statics
class UserService {
  getUser() {
    Logger.log("Getting user"); // Hard to test
    const value = globalHelper(); // Hard to mock
  }
}

// ✅ GOOD - Dependency injection
class Logger {
  log(message) {
    console.log(message);
  }
}

class HelperService {
  calculate() {
    return 42;
  }
}

class UserService {
  constructor(logger, helperService) {
    this._logger = logger;
    this._helperService = helperService;
  }

  getUser() {
    this._logger.log("Getting user"); // Easily mockable
    const value = this._helperService.calculate(); // Testable
  }
}
```

## Complete Example

```javascript
// logger.js
export class Logger {
  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  error(message, error) {
    console.error(`[${new Date().toISOString()}] ${message}`, error);
  }
}

// apiClient.js
export class ApiClient {
  constructor(logger, baseUrl) {
    this._logger = logger;
    this._baseUrl = baseUrl;
  }

  async fetchUser(userId) {
    this._logger.log(`Fetching user ${userId}`);
    const response = await fetch(`${this._baseUrl}/users/${userId}`);
    return response.json();
  }
}

// userService.js
export class UserService {
  constructor(apiClient, logger) {
    this._apiClient = apiClient;
    this._logger = logger;
  }

  async getUserById(userId) {
    try {
      return await this._apiClient.fetchUser(userId);
    } catch (error) {
      this._logger.error("Failed to fetch user", error);
      throw error;
    }
  }
}

// userViewModel.js (Alpine.js component)
export class UserViewModel {
  constructor(userService, logger) {
    this._userService = userService;
    this._logger = logger;

    // Public fields for Alpine.js bindings
    this.user = null;
    this.isLoading = false;
    this.errorMessage = "";
  }

  get isUserLoaded() {
    return this.user !== null;
  }

  async loadUser(userId) {
    this.isLoading = true;
    this.errorMessage = "";

    try {
      this.user = await this._userService.getUserById(userId);
      this._logger.log("User loaded successfully");
    } catch (error) {
      this.errorMessage = "Failed to load user";
      this._logger.error("Error loading user", error);
    } finally {
      this.isLoading = false;
    }
  }
}

// main.js - Composition root
import { Logger } from "./logger.js";
import { ApiClient } from "./apiClient.js";
import { UserService } from "./userService.js";
import { UserViewModel } from "./userViewModel.js";

// Wire up dependencies
const logger = new Logger();
const apiClient = new ApiClient(logger, "https://api.example.com");
const userService = new UserService(apiClient, logger);
const userViewModel = new UserViewModel(userService, logger);

// Use with Alpine.js
document.addEventListener("alpine:init", () => {
  Alpine.data("userComponent", () => userViewModel);
});
```

## Summary Checklist

Before committing code, verify:

- ✅ ES6 modules (`import`/`export`)
- ✅ ES6 classes (not prototypes)
- ✅ All dependencies injected via constructor
- ✅ Private fields use `_` prefix, Alpine bindings are public
- ✅ ES6 getters/setters where appropriate
- ✅ Semantic method names (verb-noun patterns)
- ✅ No magic string parameters
- ✅ No static methods or global functions
- ✅ All dependencies can be mocked for testing

## Testing Implications

These patterns make testing straightforward:

```javascript
// Easy to test with mocked dependencies
describe("UserService", () => {
  it("should fetch user by id", async () => {
    const mockApiClient = {
      fetchUser: jest.fn().mockResolvedValue({ id: 1, name: "John" }),
    };
    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    };

    const userService = new UserService(mockApiClient, mockLogger);
    const user = await userService.getUserById(1);

    expect(user).toEqual({ id: 1, name: "John" });
    expect(mockApiClient.fetchUser).toHaveBeenCalledWith(1);
  });
});
```
