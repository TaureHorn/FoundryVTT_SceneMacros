import MacroBrowser from "./classes/macroBrowser.js"

console.log('Scene Macros | initialised')

export default class SceneMacros {

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
                // entryId is the scene id data action in sidebar scene item, sceneId is the scene id data action in the nav bar
                const id = html.data().entryId ? html.data().entryId : html.data().sceneId
                const currentlyOpen = $('body').find(`.macrosBrowser_${id}`)[0]

                // if app for this scene open bring it to top, if not open it --> only one instance of each scenes macro browser allowed at once
                currentlyOpen ? ui.windows[currentlyOpen.dataset.appid].bringToTop() : new MacroBrowser(id).render(true)
            },
            condition: gmStatus,
            icon: '<i class="fas fa-code"></i>',
            name: "SCENE_MACROS.macro-browser.open-browser"
        }
    }
}

// add menu item to open a scenes macro browser to its context menu
Hooks.on('getSceneDirectoryEntryContext', function(object, actions) {
    actions.push(SceneMacros.makeBrowserMenuItem(game.user.isGM))
    console.log('Scene Macros | added context menu item in getSceneDirectoryEntryContext')
})

Hooks.on('getSceneNavigationContext', function(object, actions) {
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

