# Installation
`npm i git+https://github.com/bengelb-io/macrosmanager.git`

I'm not going to bother uploading this to npm, this is an AI slop project and a better more thought out version already exists.

[Don't believe me?](https://github.com/jaywcjlove/hotkeys-js "hotkeys-js")

# Usage
```ts
// Export singleton instance and types
export { MacroManager, KeyCombo, MacroAction, RegisteredMacro };


import { MacroManager } from './macro-manager';

// Create a new instance with debug mode
const macros = new MacroManager({ debug: true });

// Start listening for key combinations
macros.start();

// Register a simple macro
macros.register(
  'save', 
  { key: 's', ctrl: true },
  () => console.log('Saving document...'),
  'Save the current document'
);

// Register another macro
macros.register(
  'refresh',
  { key: 'r', ctrl: true },
  () => window.location.reload(),
  'Refresh the page'
);

// Toggle a macro on/off
macros.toggle('save');

// You can also stop listening when needed
// macros.stop();
```