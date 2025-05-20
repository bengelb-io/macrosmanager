/**
 * Jest test suite for MacroManager module
 */

import { KeyCombo, MacroManager } from "../src/index";

// Mock document methods for testing
const addEventListener = jest.spyOn(document, "addEventListener");
const removeEventListener = jest.spyOn(document, "removeEventListener");

// Helper function to create a keyboard event
function createKeyboardEvent(key: string, options: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
    target?: Partial<HTMLElement>;
} = {}): KeyboardEvent {
    const target = options.target || {
        tagName: "DIV",
    } as Partial<HTMLElement>;

    return {
        key,
        ctrlKey: options.ctrl || false,
        altKey: options.alt || false,
        shiftKey: options.shift || false,
        metaKey: options.meta || false,
        target,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
    } as unknown as KeyboardEvent;
}

// Reset mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});

describe("MacroManager", () => {
    describe("Construction and initialization", () => {
        it("should create a new instance with default options", () => {
            const macros = new MacroManager();
            expect(macros).toBeInstanceOf(MacroManager);
        });

        it("should create a new instance with custom options", () => {
            const macros = new MacroManager({
                preventDefault: false,
                stopPropagation: true,
                debug: true,
            });
            expect(macros).toBeInstanceOf(MacroManager);
        });
    });

    describe("Event listener management", () => {
        it("should add event listener when started", () => {
            const macros = new MacroManager();
            macros.start();
            expect(addEventListener).toHaveBeenCalledWith(
                "keydown",
                expect.any(Function),
            );
        });

        it("should remove event listener when stopped", () => {
            const macros = new MacroManager();
            macros.start();
            macros.stop();
            expect(removeEventListener).toHaveBeenCalledWith(
                "keydown",
                expect.any(Function),
            );
        });

        it("should not add event listener if already listening", () => {
            const macros = new MacroManager();
            macros.start();
            addEventListener.mockClear();
            macros.start();
            expect(addEventListener).not.toHaveBeenCalled();
        });

        it("should not remove event listener if not listening", () => {
            const macros = new MacroManager();
            macros.stop();
            expect(removeEventListener).not.toHaveBeenCalled();
        });
    });

    describe("Macro registration", () => {
        it("should register a new macro", () => {
            const macros = new MacroManager();
            const id = "test-macro";
            const keyCombo: KeyCombo = { key: "a", ctrl: true };
            const action = jest.fn();

            macros.register(id, keyCombo, action, "Test macro");

            const registeredMacros = macros.getAll();
            expect(registeredMacros).toHaveLength(1);
            expect(registeredMacros[0].id).toBe(id);
            expect(registeredMacros[0].keyCombo).toEqual(keyCombo);
            expect(registeredMacros[0].action).toBe(action);
            expect(registeredMacros[0].description).toBe("Test macro");
            expect(registeredMacros[0].enabled).toBe(true);
        });

        it("should throw an error when registering a macro with an existing ID", () => {
            const macros = new MacroManager();
            const id = "test-macro";
            const keyCombo: KeyCombo = { key: "a", ctrl: true };
            const action = jest.fn();

            macros.register(id, keyCombo, action);

            expect(() => {
                macros.register(id, { key: "b" }, jest.fn());
            }).toThrow(`MacroManager: Macro with ID "${id}" already exists`);
        });
    });

    describe("Macro retrieval", () => {
        it("should retrieve all registered macros", () => {
            const macros = new MacroManager();
            macros.register("macro1", { key: "a" }, jest.fn());
            macros.register("macro2", { key: "b" }, jest.fn());

            const allMacros = macros.getAll();
            expect(allMacros).toHaveLength(2);
            expect(allMacros.map((m) => m.id)).toContain("macro1");
            expect(allMacros.map((m) => m.id)).toContain("macro2");
        });

        it("should retrieve a specific macro by ID", () => {
            const macros = new MacroManager();
            const action = jest.fn();
            macros.register("macro1", { key: "a" }, action);

            const macro = macros.get("macro1");
            expect(macro).toBeDefined();
            expect(macro?.id).toBe("macro1");
            expect(macro?.action).toBe(action);
        });

        it("should return undefined when getting a non-existent macro", () => {
            const macros = new MacroManager();
            const macro = macros.get("non-existent");
            expect(macro).toBeUndefined();
        });
    });

    describe("Macro management", () => {
        it("should unregister a macro by ID", () => {
            const macros = new MacroManager();
            macros.register("macro1", { key: "a" }, jest.fn());

            const result = macros.unregister("macro1");
            expect(result).toBe(true);
            expect(macros.getAll()).toHaveLength(0);
        });

        it("should return false when unregistering a non-existent macro", () => {
            const macros = new MacroManager();
            const result = macros.unregister("non-existent");
            expect(result).toBe(false);
        });

        it("should enable a disabled macro", () => {
            const macros = new MacroManager();
            macros.register("macro1", { key: "a" }, jest.fn());
            macros.disable("macro1");

            const result = macros.enable("macro1");
            expect(result).toBe(true);

            const macro = macros.get("macro1");
            expect(macro?.enabled).toBe(true);
        });

        it("should disable an enabled macro", () => {
            const macros = new MacroManager();
            macros.register("macro1", { key: "a" }, jest.fn());

            const result = macros.disable("macro1");
            expect(result).toBe(true);

            const macro = macros.get("macro1");
            expect(macro?.enabled).toBe(false);
        });

        it("should toggle a macro state", () => {
            const macros = new MacroManager();
            macros.register("macro1", { key: "a" }, jest.fn());

            // Initially enabled
            expect(macros.get("macro1")?.enabled).toBe(true);

            // Toggle to disabled
            macros.toggle("macro1");
            expect(macros.get("macro1")?.enabled).toBe(false);

            // Toggle back to enabled
            macros.toggle("macro1");
            expect(macros.get("macro1")?.enabled).toBe(true);
        });

        it("should return false when enabling, disabling or toggling a non-existent macro", () => {
            const macros = new MacroManager();
            expect(macros.enable("non-existent")).toBe(false);
            expect(macros.disable("non-existent")).toBe(false);
            expect(macros.toggle("non-existent")).toBe(false);
        });

        it("should update an existing macro", () => {
            const macros = new MacroManager();
            const originalAction = jest.fn();
            const newAction = jest.fn();

            macros.register(
                "macro1",
                { key: "a" },
                originalAction,
                "Original description",
            );

            const result = macros.update("macro1", {
                keyCombo: { key: "b", shift: true },
                action: newAction,
                description: "Updated description",
                enabled: false,
            });

            expect(result).toBe(true);

            const updatedMacro = macros.get("macro1");
            expect(updatedMacro?.keyCombo).toEqual({ key: "b", shift: true });
            expect(updatedMacro?.action).toBe(newAction);
            expect(updatedMacro?.description).toBe("Updated description");
            expect(updatedMacro?.enabled).toBe(false);
        });

        it("should return false when updating a non-existent macro", () => {
            const macros = new MacroManager();
            const result = macros.update("non-existent", {
                keyCombo: { key: "x" },
            });
            expect(result).toBe(false);
        });

        it("should clear all registered macros", () => {
            const macros = new MacroManager();
            macros.register("macro1", { key: "a" }, jest.fn());
            macros.register("macro2", { key: "b" }, jest.fn());

            macros.clear();
            expect(macros.getAll()).toHaveLength(0);
        });
    });

    describe("Key event handling", () => {
        it("should execute macro action when matching key combo is pressed", () => {
            // Create manager and register a macro
            const macros = new MacroManager();
            const action = jest.fn();
            macros.register("testMacro", { key: "a", ctrl: true }, action);
            macros.start();

            // Get the event listener
            const eventListener = addEventListener.mock.calls[0][1] as (
                e: KeyboardEvent,
            ) => void;

            // Simulate key event that matches our macro
            const event = createKeyboardEvent("a", { ctrl: true });
            eventListener(event);

            // Action should have been called
            expect(action).toHaveBeenCalled();
            // Default should be prevented
            expect(event.preventDefault).toHaveBeenCalled();
        });

        it("should not execute disabled macro actions", () => {
            const macros = new MacroManager();
            const action = jest.fn();
            macros.register("testMacro", { key: "a", ctrl: true }, action);
            macros.disable("testMacro");
            macros.start();

            const eventListener = addEventListener.mock.calls[0][1] as (
                e: KeyboardEvent,
            ) => void;
            const event = createKeyboardEvent("a", { ctrl: true });
            eventListener(event);

            expect(action).not.toHaveBeenCalled();
        });

        it("should not execute action when key combo does not match", () => {
            const macros = new MacroManager();
            const action = jest.fn();
            macros.register("testMacro", { key: "a", ctrl: true }, action);
            macros.start();

            const eventListener = addEventListener.mock.calls[0][1] as (
                e: KeyboardEvent,
            ) => void;

            // Different key
            let event = createKeyboardEvent("b", { ctrl: true });
            eventListener(event);
            expect(action).not.toHaveBeenCalled();

            // Missing modifier
            event = createKeyboardEvent("a");
            eventListener(event);
            expect(action).not.toHaveBeenCalled();

            // Extra modifier
            event = createKeyboardEvent("a", { ctrl: true, alt: true });
            eventListener(event);
            expect(action).not.toHaveBeenCalled();
        });

        it("should handle case-insensitive key matching", () => {
            const macros = new MacroManager();
            const action = jest.fn();
            macros.register("testMacro", { key: "a", ctrl: true }, action);
            macros.start();

            const eventListener = addEventListener.mock.calls[0][1] as (
                e: KeyboardEvent,
            ) => void;

            // Capital A should still trigger macro registered with lowercase a
            const event = createKeyboardEvent("A", { ctrl: true });
            eventListener(event);
            expect(action).toHaveBeenCalled();
        });

        it("should ignore events from input elements", () => {
            const macros = new MacroManager();
            const action = jest.fn();
            macros.register("testMacro", { key: "a", ctrl: true }, action);
            macros.start();

            const eventListener = addEventListener.mock.calls[0][1] as (
                e: KeyboardEvent,
            ) => void;

            // Event from an input element
            const event = createKeyboardEvent("a", {
                ctrl: true,
                target: { tagName: "INPUT" } as Partial<HTMLElement>,
            });

            eventListener(event);
            expect(action).not.toHaveBeenCalled();
        });

        it("should stop propagation when configured", () => {
            const macros = new MacroManager({ stopPropagation: true });
            const action = jest.fn();
            macros.register("testMacro", { key: "a", ctrl: true }, action);
            macros.start();

            const eventListener = addEventListener.mock.calls[0][1] as (
                e: KeyboardEvent,
            ) => void;
            const event = createKeyboardEvent("a", { ctrl: true });
            eventListener(event);

            expect(event.stopPropagation).toHaveBeenCalled();
        });

        it("should not prevent default when configured", () => {
            const macros = new MacroManager({ preventDefault: false });
            const action = jest.fn();
            macros.register("testMacro", { key: "a", ctrl: true }, action);
            macros.start();

            const eventListener = addEventListener.mock.calls[0][1] as (
                e: KeyboardEvent,
            ) => void;
            const event = createKeyboardEvent("a", { ctrl: true });
            eventListener(event);

            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(action).toHaveBeenCalled();
        });

        it("should handle errors in macro actions gracefully", () => {
            const consoleErrorSpy = jest.spyOn(console, "error")
                .mockImplementation();

            const macros = new MacroManager();
            const action = jest.fn().mockImplementation(() => {
                throw new Error("Test error");
            });

            macros.register("testMacro", { key: "a", ctrl: true }, action);
            macros.start();

            const eventListener = addEventListener.mock.calls[0][1] as (
                e: KeyboardEvent,
            ) => void;
            const event = createKeyboardEvent("a", { ctrl: true });

            // Should not throw
            expect(() => eventListener(event)).not.toThrow();

            // Error should be logged
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'MacroManager: Error executing macro "testMacro":',
                expect.any(Error),
            );

            consoleErrorSpy.mockRestore();
        });
    });

    describe("Debug mode", () => {
        it("should log debug messages when debug is enabled", () => {
            const consoleSpy = jest.spyOn(console, "log").mockImplementation();

            const macros = new MacroManager({ debug: true });
            macros.register("testMacro", { key: "a" }, jest.fn());

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Registered macro "testMacro"'),
            );

            consoleSpy.mockRestore();
        });

        it("should not log debug messages when debug is disabled", () => {
            const consoleSpy = jest.spyOn(console, "log").mockImplementation();

            const macros = new MacroManager({ debug: false });
            macros.register("testMacro", { key: "a" }, jest.fn());

            expect(consoleSpy).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });
});
