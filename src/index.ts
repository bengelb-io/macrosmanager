/**
 * MacroManager - A TypeScript module for registering and managing keyboard macros in the browser
 */

// Types
type KeyCombo = {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
};

type MacroAction = () => void;

type RegisteredMacro = {
  id: string;
  keyCombo: KeyCombo;
  action: MacroAction;
  description?: string;
  enabled: boolean;
};

interface MacroManagerOptions {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  debug?: boolean;
}

class MacroManager {
  private macros: Map<string, RegisteredMacro>;
  private options: MacroManagerOptions;
  private isListening: boolean;
  private listenerFn: (e: KeyboardEvent) => void;

  constructor(options: MacroManagerOptions = {}) {
    this.macros = new Map();
    this.options = {
      preventDefault: true,
      stopPropagation: false,
      debug: false,
      ...options
    };
    this.isListening = false;
    this.listenerFn = this.handleKeyPress.bind(this);
  }

  /**
   * Generate a unique key for the key combination
   */
  private getComboKey(combo: KeyCombo): string {
    return `${combo.ctrl ? 'Ctrl+' : ''}${combo.alt ? 'Alt+' : ''}${combo.shift ? 'Shift+' : ''}${combo.meta ? 'Meta+' : ''}${combo.key}`;
  }

  /**
   * Compare a keyboard event with a key combination
   */
  private matchesCombo(event: KeyboardEvent, combo: KeyCombo): boolean {
    const key = combo.key.toLowerCase();
    const eventKey = event.key.toLowerCase();
    
    return (
      eventKey === key &&
      !!event.ctrlKey === !!combo.ctrl &&
      !!event.altKey === !!combo.alt &&
      !!event.shiftKey === !!combo.shift &&
      !!event.metaKey === !!combo.meta
    );
  }

  /**
   * Handle keyboard events
   */
  private handleKeyPress(event: KeyboardEvent): void {
    // Ignore events from input elements unless option is set
    const target = event.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    if (['input', 'textarea', 'select'].includes(tagName)) {
      return;
    }

    for (const macro of this.macros.values()) {
      if (macro.enabled && this.matchesCombo(event, macro.keyCombo)) {
        if (this.options.debug) {
          console.log(`MacroManager: Executing macro "${macro.id}"`);
        }
        
        if (this.options.preventDefault) {
          event.preventDefault();
        }
        
        if (this.options.stopPropagation) {
          event.stopPropagation();
        }
        
        try {
          macro.action();
        } catch (error) {
          console.error(`MacroManager: Error executing macro "${macro.id}":`, error);
        }
      }
    }
  }

  /**
   * Start listening for key combinations
   */
  public start(): void {
    if (!this.isListening) {
      document.addEventListener('keydown', this.listenerFn);
      this.isListening = true;
      
      if (this.options.debug) {
        console.log('MacroManager: Started listening for key combinations');
      }
    }
  }

  /**
   * Stop listening for key combinations
   */
  public stop(): void {
    if (this.isListening) {
      document.removeEventListener('keydown', this.listenerFn);
      this.isListening = false;
      
      if (this.options.debug) {
        console.log('MacroManager: Stopped listening for key combinations');
      }
    }
  }

  /**
   * Register a new macro
   */
  public register(
    id: string,
    keyCombo: KeyCombo,
    action: MacroAction,
    description?: string
  ): string {
    const comboKey = this.getComboKey(keyCombo);
    
    const existingMacro = this.macros.get(id);
    if (existingMacro) {
      throw new Error(`MacroManager: Macro with ID "${id}" already exists`);
    }

    this.macros.set(id, {
      id,
      keyCombo,
      action,
      description,
      enabled: true
    });

    if (this.options.debug) {
      console.log(`MacroManager: Registered macro "${id}" with key combination "${comboKey}"`);
    }

    return id;
  }

  /**
   * Unregister a macro by ID
   */
  public unregister(id: string): boolean {
    if (this.macros.has(id)) {
      this.macros.delete(id);
      
      if (this.options.debug) {
        console.log(`MacroManager: Unregistered macro "${id}"`);
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Enable a specific macro
   */
  public enable(id: string): boolean {
    const macro = this.macros.get(id);
    if (macro) {
      macro.enabled = true;
      
      if (this.options.debug) {
        console.log(`MacroManager: Enabled macro "${id}"`);
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Disable a specific macro
   */
  public disable(id: string): boolean {
    const macro = this.macros.get(id);
    if (macro) {
      macro.enabled = false;
      
      if (this.options.debug) {
        console.log(`MacroManager: Disabled macro "${id}"`);
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Toggle a specific macro
   */
  public toggle(id: string): boolean {
    const macro = this.macros.get(id);
    if (macro) {
      macro.enabled = !macro.enabled;
      
      if (this.options.debug) {
        console.log(`MacroManager: ${macro.enabled ? 'Enabled' : 'Disabled'} macro "${id}"`);
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Get all registered macros
   */
  public getAll(): RegisteredMacro[] {
    return Array.from(this.macros.values());
  }

  /**
   * Get a specific macro by ID
   */
  public get(id: string): RegisteredMacro | undefined {
    return this.macros.get(id);
  }

  /**
   * Update an existing macro
   */
  public update(
    id: string,
    updates: Partial<Omit<RegisteredMacro, 'id'>>
  ): boolean {
    const macro = this.macros.get(id);
    if (macro) {
      Object.assign(macro, updates);
      
      if (this.options.debug) {
        console.log(`MacroManager: Updated macro "${id}"`);
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Clear all registered macros
   */
  public clear(): void {
    this.macros.clear();
    
    if (this.options.debug) {
      console.log('MacroManager: Cleared all macros');
    }
  }
}

// Export singleton instance and types
export { MacroManager, KeyCombo, MacroAction, RegisteredMacro };

// Example usage:
/*
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
*/