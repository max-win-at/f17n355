# Architecture Documentation

## Project Overview

This is a single-page application (SPA) built with pure ES6 JavaScript, following strict architectural principles and patterns.

## Core Technology Stack

### JavaScript Framework

- **Alpine.js**: Primary reactive framework for all UI interactions
- **Pure ES6 JavaScript**: No transpilation, no build step required
- All-in on Alpine.js - no mixing with other reactive frameworks

### Styling

- **Tailwind CSS**: Primary styling framework (use Tailwind utilities first)
- **Custom CSS**: Only when Tailwind utilities are insufficient
- **Google Material Design**: Fonts and icons standard

### Design Pattern

- **MVVM (Model-View-ViewModel)**: Strict separation of concerns for all visual components

## Architectural Principles

### 1. Dependency Injection & IoC Container

#### app.js as Central Registry

- `app.js` serves as the IoC container and dependency collector
- All services, repositories, and utilities are instantiated in `app.js`
- Dependencies are passed via constructor injection
- No global variables or service locators

#### Registration Pattern

```javascript
// IoC manual object creation & resolution
const viewModel = new ViewModel(dependency1, dependency2);

//... more creation and resolution - order relevant

// Register singletons via Alpine.data()
Alpine.data("viewModelName", viewModel);
// Transients are created on-demand but follow same pattern
Alpine.data(
  "anotherViewModelName",
  new AnotherViewModel(
    dependency1,
    dependency2,
    viewModel /*e.g.: parent viewmodel*/,
  ),
);
```

#### Dependency Flow

```
app.js → constructs services → injects into ViewModels via Alpine.data()
```

### 2. MVVM Pattern Implementation

#### ViewModel Rules

- **ViewModels are registered via `Alpine.data()`**
- All UI state lives in public fields of ViewModels
- ViewModels receive dependencies through constructor parameters
- ViewModels expose:
  - **Public fields**: Bound directly to HTML elements
  - **Public methods**: Called from HTML event handlers
  - **Computed properties**: Derived state using getters
  - **Events**: For ViewModel-to-ViewModel communication
- ViewModel composite pattern:
  - Sub/child viewmodel are injected to parent
  - parent subscribes to sub viewmodel events
  - sub viewmodel remains unaware to parent

#### Model Layer

- Business logic and data structures
- Independent of UI concerns
- Injected into ViewModels as services

#### View Layer (HTML)

- Pure declarative markup
- All elements bind to ViewModel public fields
- Use Alpine.js directives: `x-data`, `x-bind`, `x-on`, `x-model`, `x-show`, `x-if`, etc.
- No inline JavaScript logic beyond simple property access

### 3. No Direct DOM Manipulation

#### Strict Prohibition

- **NEVER** access `document.querySelector()` in ViewModels
- **NEVER** create DOM elements programmatically in ViewModels
- **NEVER** manipulate `element.style`, `element.classList`, etc. in ViewModels

#### Allowed Approaches

- **Field bindings**: Use `x-bind:class`, `x-bind:style`, `x-model`
- **Conditional rendering**: Use `x-if`, `x-show`
- **Event handlers**: Use `x-on:click`, `x-on:input`, etc.
- **ViewModel events**: Use custom events or observable patterns for communication

#### Example of Correct Pattern

```html
<!-- View -->
<div x-data="myViewModel()">
  <button
    x-on:click="handleClick()"
    x-bind:class="buttonClass"
    x-bind:disabled="isDisabled"
  >
    <span x-text="buttonText"></span>
  </button>
</div>
```

```javascript
// ViewModel
Alpine.data("myViewModel", (someService) => ({
  // Public fields (bound to view)
  buttonText: "Click Me",
  isDisabled: false,

  // Computed properties
  get buttonClass() {
    return this.isDisabled
      ? "opacity-50 cursor-not-allowed"
      : "hover:bg-blue-600";
  },

  // Public methods (called from view)
  handleClick() {
    this.isDisabled = true;
    someService.doSomething().then(() => {
      this.isDisabled = false;
    });
  },
}));
```

### 4. Markup and HTML Structure

#### HTML is Source of Truth

- All markup is explicit and lives in HTML files
- No programmatic HTML generation in JavaScript
- Use `x-for` for dynamic lists
- Use `x-if` and `x-show` for conditional rendering
- Templates can use `<template>` tags with Alpine.js directives

#### Multi-File Structure

- Separate HTML files are allowed and encouraged for modularity
- Each HTML file can contain multiple Alpine.js components
- Use proper semantic HTML5 structure

### 5. Styling Guidelines

#### Tailwind First

- Use Tailwind utility classes for all standard styling needs
- Responsive design: `sm:`, `md:`, `lg:`, `xl:`, `2xl:` prefixes
- State variants: `hover:`, `focus:`, `active:`, `disabled:`
- Dark mode: Use `dark:` prefix when applicable

#### Custom CSS

- Only add custom CSS when Tailwind utilities are genuinely insufficient
- Place custom styles in dedicated CSS files
- Use CSS custom properties (variables) for theme values
- Follow BEM or similar naming convention for custom classes

#### Material Design Integration

- **Fonts**: Use Google Material Design font recommendations
  - Primary: Roboto, Inter, or similar
- **Icons**: Use Material Icons (icon font or SVG)
  - Include via CDN or local copy
  - Reference in HTML: `<i class="material-icons">icon_name</i>`

### 6. Application Structure

#### File Organization

```
/
├── index.html              # Main HTML entry point
├── css/
│   ├── tailwind.css       # Tailwind CSS
│   └── custom.css         # Custom styles (if needed)
├── js/
│   ├── app.js             # IoC container, dependency registration
│   ├── viewmodels/        # ViewModel definitions
│   ├── services/          # Business logic services
│   ├── models/            # Data models
│   └── utils/             # Utility functions
└── img/                   # Static assets
```

#### app.js Template

```javascript
// Import services and dependencies
import { SomeService } from "./services/SomeService.js";
import { DataRepository } from "./services/DataRepository.js";

// Initialize Alpine.js
document.addEventListener("alpine:init", () => {
  // Instantiate services (singletons)
  const dataRepository = new DataRepository();
  const someService = new SomeService(dataRepository);

  // Register ViewModels with injected dependencies
  Alpine.data("mainViewModel", () => ({
    // ViewModel implementation
    init() {
      // Initialization logic
    },
    // ... public fields and methods
  }));

  Alpine.data("anotherViewModel", () => {
    // Inject dependencies via closure
    const service = someService;

    return {
      init() {
        // Access injected service
        service.initialize();
      },
      // ... public fields and methods
    };
  });
});

// Start Alpine.js
Alpine.start();
```

### 7. Best Practices

#### ViewModel Lifecycle

- Use `init()` method for initialization logic
- Use `destroy()` for cleanup if needed
- Leverage Alpine.js lifecycle: `x-init`, `x-effect`

#### State Management

- Keep state in ViewModels
- For shared state, use a service injected into multiple ViewModels
- Avoid prop drilling - use dependency injection

#### Event Communication

- ViewModels can dispatch custom events: `$dispatch('eventName', data)`
- ViewModels can listen: `x-on:event-name="handleEvent"`
- Keep events scoped and well-documented

#### Testing Considerations

- Services should be easily unit-testable (pure functions, no DOM)
- ViewModels test via integration tests or Alpine.js testing utilities
- Mock dependencies during tests

## Common Patterns

### Service Injection Pattern

```javascript
// In app.js
const userService = new UserService();

Alpine.data("userProfile", () => {
  const service = userService; // Capture in closure

  return {
    user: null,
    loading: false,

    async init() {
      this.loading = true;
      this.user = await service.getCurrentUser();
      this.loading = false;
    },
  };
});
```

### Computed Properties Pattern

```javascript
Alpine.data("shoppingCart", () => ({
  items: [],

  get total() {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  },

  get itemCount() {
    return this.items.length;
  },
}));
```

### List Rendering Pattern

```html
<ul x-data="itemList()">
  <template x-for="item in items" :key="item.id">
    <li
      x-text="item.name"
      x-bind:class="item.selected ? 'bg-blue-100' : ''"
    ></li>
  </template>
</ul>
```

## Critical Rules Summary

1. ✅ **DO**: Use Alpine.data() for all ViewModel registrations
2. ✅ **DO**: Inject dependencies through app.js
3. ✅ **DO**: Bind all UI state to ViewModel public fields
4. ✅ **DO**: Use Tailwind utilities first, custom CSS second
5. ✅ **DO**: Keep all markup in HTML files
6. ✅ **DO**: Use Material Design fonts and icons

7. ❌ **DON'T**: Access DOM directly in ViewModels
8. ❌ **DON'T**: Create DOM elements programmatically in ViewModels
9. ❌ **DON'T**: Use global variables for dependency access
10. ❌ **DON'T**: Generate HTML strings in JavaScript
11. ❌ **DON'T**: Mix other reactive frameworks with Alpine.js
12. ❌ **DON'T**: Skip constructor injection for dependencies

## References

- **Alpine.js**: https://alpinejs.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **Material Design**: https://material.io/
- **Material Icons**: https://fonts.google.com/icons

---

_This architecture document serves as the single source of truth for all development decisions in this project. All code must conform to these patterns and principles._
