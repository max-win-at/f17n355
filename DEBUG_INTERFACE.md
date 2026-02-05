# Debug Interface Documentation

The debug interface provides hash-based commands for testing and development. These commands do not require any changes to application code and sit independently on top of the app.

## Usage

Navigate to the application URL with a hash command:

```
http://localhost:8000/#reset
http://localhost:8000/#tierup
http://localhost:8000/#tierclear
```

The command will execute when you navigate to the URL. After execution, the hash is cleared and the page reloads to reflect changes.

## Available Commands

### `#reset` - Factory Reset

**Clears all application data (localStorage and IndexedDB)**

- Deletes all athletes data
- Deletes all workout history
- Deletes all progress data
- Deletes the entire IndexedDB database
- Returns app to initial setup screen

**Use case:** Complete fresh start, testing setup flow

### `#tierup` - Fill Tier & Level Up

**Automatically completes the current tier by filling milestones with required workouts**

- Processes milestones in order: Bronze → Silver → Gold → Platinum → Diamond
- Creates workouts for each milestone type (using "Off Record" proof method)
- Tracks progress as if user manually added each workout
- Triggers tier level up if tier is completed
- Advances to next tier and resets its progress

**Requirements:**

- Athlete profile must exist (complete setup first)

**Use case:** Testing tier progression flow, testing milestone completion logic, advancing through tiers quickly

### `#tierclear` - Clear & Reset to Tier 1

**Removes all workouts and resets athlete to fresh Tier 1 state**

- Deletes all workouts from history
- Resets athlete to Tier 1
- Clears all milestone progress
- Maintains athlete profile (name, birthday, gender, skin tone)

**Use case:** Start fresh within current profile, testing Tier 1 flow

## Implementation Details

- **Location:** `js/debug/DebugInterface.js`
- **Integration:** Initialized in `js/app.js` without being a dependency
- **Access:** Listens on `hashchange` events
- **Error handling:** All errors are logged to console and shown in alerts
- **Non-intrusive:** Does not modify application classes or architecture

## Example Workflow

1. Complete athlete setup
2. Navigate to `#tierup` to automatically complete Tier 1
3. Navigate to `#tierup` again to complete Tier 2
4. Navigate to `#tierclear` to reset back to Tier 1
5. Navigate to `#reset` to start completely fresh (returns to setup screen)
