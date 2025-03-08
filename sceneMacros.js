import SceneMacrosData from "./classes/sceneMacrosData.js"

console.log('sceneMacros >>> init')

export default class SceneMacros {

    static NAME = 'sceneMacros'

    static FLAGS = {
        LINKS: 'linkedMacros'
    }

    static TEMPLATES = {
        MACRO_BROWSER: `/modules/${this.NAME}/macroBrowser.hbs`
    }
}

// TEMP
Hooks.on('ready', function() {
    // CONFIG.debug.hooks = true
    game.togglePause(false)
})

// add menu item to open a scenes macro browser to its context menu
Hooks.on('getSceneDirectoryEntryContext', function(object, actions) {actions.push(SceneMacrosData.browserMenuItem)})
Hooks.on('getSceneNavigationContext', function(object, actions) {actions.push(SceneMacrosData.browserMenuItem)})

