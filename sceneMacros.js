import MacroBroswerV2 from "./classes/macroBrowser.js"

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
                const element = game.release.generation >= 13 ? html : html[0]
                const id = element.dataset.sceneId || element.dataset.entryId
                const uiElement = {
                    window: document.getElementsByClassName(`macrosBrowser_${id}`)
                }
                uiElement.currentlyOpen = uiElement.window.length ? true : false

                // IF APP ALREADY OPEN ? BRING TO FRONT : RENDER NEW MACRO_BROWSER WINDOW
                uiElement.currentlyOpen
                    ? foundry.applications.instances.get(uiElement.window[0].id).bringToFront()
                    : new MacroBroswerV2(id).render(true)
            },
            condition: gmStatus,
            icon: '<i class="fas fa-code"></i>',
            name: "SCENE_MACROS.macro-browser.open-browser"
        }
    }
}

Handlebars.registerHelper('evenIndex', function(index, options) {
    // determine if index is odd or even and return boolean for block scoping
    if (typeof index !== 'number') throw new Error('Handlebars.evenIndex: arguments[0] index not a number')
    if (index % 2 === 0) {
        return options.fn(this)
    } else {
        return options.inverse(this)
    }
})

// ADD MENU ITEM TO OPEN A SCENES MACRO BROWSER TO ITS CONTEXT MENU
// V13+ HOOK
Hooks.on('getSceneContextOptions', (application, element, context, options) => {
    if (game.release.generation < 13) return
    element.push(SceneMacros.makeBrowserMenuItem(game.user.isGM))
    console.log('Scene Macros | added context menu item in getSceneContextOptions')
})

// V12 AND OLDER HOOKS
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

