/*:
 * @plugindesc This plugin has some annotation issues
 * @author Tester
 *
 * @param volume
 * @text Volume
 * @desc Sound volume level.
 * @type numbre
 * @min 0
 * @max 100
 * @default 80
 *
 * @param mode
 * @text Mode
 * @desc Select a mode.
 * @type string
 * @min 0
 * @option Fast
 * @option Slow
 *
 * @command doSomething
 * @text Do Something
 * @desc A test command.
 * @default 5
 *
 * @unknownTag test
 *
 * @help
 * This plugin intentionally has errors for testing validation.
 */

(() => {
  "use strict";
  // Intentionally broken plugin for demo
})();
