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

Handlebars.registerHelper('evenIndex', function(index, options) {
    // determine if index is odd or even and return boolean for block scoping
    if (typeof index !== 'number') throw new Error ('Handlebars.evenIndex: arguments[0] index not a number')
    if (index % 2 === 0) {
        return options.fn(this)
    } else { 
        return options.inverse(this)}
})

