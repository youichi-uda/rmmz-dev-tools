/*:
 * @target MZ
 * @plugindesc desc
 * @author youichi uda
 *
 * @param enabled
 * @text Enabled
 * @desc Enable or disable this plugin's effects.
 * @type boolean
 * @on Enable
 * @off Disable
 * @default true
 *
 * @param displayName
 * @text Display Name
 * @desc Name displayed in-game.
 * @type string
 * @default Default
 *
 * @command showMessage
 * @text Show Message
 * @desc Displays a message on screen.
 *
 * @arg text
 * @text Message Text
 * @desc The text to display.
 * @type string
 * @default Hello!
 *
 * @help
 * MyPlugin2
 *
 * desc
 *
 * Usage:
 *   Enable the plugin in Plugin Manager.
 *   Use plugin commands from the Event Editor.
 */

(() => {
  "use strict";

  const PLUGIN_NAME = "MyPlugin2";

  const parameters = PluginManager.parameters(PLUGIN_NAME);
  const param = {
    enabled: parameters["enabled"] === "true",
    displayName: parameters["displayName"] || "Default",
  };

  PluginManager.registerCommand(PLUGIN_NAME, "showMessage", (args) => {
    const text = args.text || "Hello!";
    // TODO: Implement your command logic here
    console.log(`${PLUGIN_NAME}: ${text}`);
  });

  // TODO: Add your plugin logic here
  //
  // Example: Override a method
  // const _alias = Game_Player.prototype.update;
  // Game_Player.prototype.update = function(sceneActive) {
  //   _alias.call(this, sceneActive);
  //   // Your logic here
  // };

})();
