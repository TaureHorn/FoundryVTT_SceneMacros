import MacroBrowser from "./classes/macroBrowser.js"

console.log('Scene Macros | initialised')

export default class SceneMacros {

    static DEBUG = false

    static NAME = 'sceneMacros'

    static FLAGS = {
        LINKS: 'linkedMacros'
    }

    static TEMPLATES = {
        MACRO_BROWSER: `/modules/${this.NAME}/macroBrowser.hbs`
    }

    static makeBrowserMenuItem(gmStatus) {
        return {
            callback: (html) => {
                // ID = ID OF SCENE
                const id = (() => {
                    return game.release.generation >= 13
                        ? html.dataset.sceneId
                        : html.data().entryId || html.data().sceneId
                })()
                const uiElement = {
                    window: document.getElementsByClassName(`macrosBrowser_${id}`)
                }
                uiElement.currentlyOpen = uiElement.window.length ? true : false

                // IF APP ALREADY OPEN ? BRING TO FRONT : RENDER NEW MACRO_BROWSER WINDOW
                uiElement.currentlyOpen ?
                    ui.windows[uiElement.window[0].dataset.appid].bringToTop()
                    : new MacroBrowser(id).render(true)
            },
            condition: gmStatus,
            icon: '<i class="fas fa-code"></i>',
            name: "SCENE_MACROS.macro-browser.open-browser"
        }
    }
}

// debug set hooks
Hooks.on('init', () => {
    CONFIG.debug.hooks = SceneMacros.DEBUG
})

// add menu item to open a scenes macro browser to its context menu
Hooks.on('getSceneContextOptions', (...args) => {
    if (game.release.generation < 13) return
    args[1].push(SceneMacros.makeBrowserMenuItem(game.user.isGM))
    console.log('Scene Macros | added context menu item in getSceneContextOptions')
})

Hooks.on('getSceneDirectoryEntryContext', function(object, actions) {
    if (game.release.generation >= 13) return
    actions.push(SceneMacros.makeBrowserMenuItem(game.user.isGM))
    console.log('Scene Macros | added context menu item in getSceneDirectoryEntryContext')
})

Hooks.on('getSceneNavigationContext', function(object, actions) {
    if (game.release.generation >= 13) return
    actions.push(SceneMacros.makeBrowserMenuItem(game.user.isGM))
    console.log('Scene Macros | added context menu item in getSceneNavigationContext')
})

Handlebars.registerHelper('evenIndex', function(index, options) {
    // determine if index is odd or even and return boolean for block scoping
    if (typeof index !== 'number') throw new Error('Handlebars.evenIndex: arguments[0] index not a number')
    if (index % 2 === 0) {
        return options.fn(this)
    } else {
        return options.inverse(this)
    }
})

