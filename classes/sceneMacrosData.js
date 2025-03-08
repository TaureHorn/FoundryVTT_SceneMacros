import SceneMacros from "../sceneMacros.js"
import MacroBrowser from "./macroBrowser.js"

export default class SceneMacrosData {

    static browserMenuItem = {
        name: "SCENE_MACROS.macro-browser.open-browser",
        icon: '<i class="fas fa-code"></i>',
        callback: (html) => {
            // entryId is the scene id data action in sidebar scene item, sceneId is the scene id data action in the nav bar
            const id = html.data().entryId ? html.data().entryId : html.data().sceneId
            new MacroBrowser(id).render(true)
        }
    }

    static getLinkedMacros(macroIdArr) {
        return game.macros.filter(macro => macroIdArr.includes(macro.id))
    }

    static getScene(id) {
        // get single scene
        const scene = game.scenes.get(id)
        if (!scene) {
            ui.notifications.error(game.i18n.localize("SCENE_MACROS.feedback.scene-not-found"))
        }
        return scene
    }

    static getSceneFlags(id) {
        // get modules flags from single scene
        const scene = this.getScene(id)
        return scene.getFlag(SceneMacros.NAME, SceneMacros.FLAGS.LINKS)
    }

    static async writeFlags(id, data) {
        // write data to scene flags
        const scene = this.getScene(id)
        const flags = this.getSceneFlags(scene._id) ? [...this.getSceneFlags(scene._id)] : []

        // regex test data
        const alphanumerics = new RegExp("^[A-Za-z0-9.]+$")
        if (alphanumerics.test(data)) {
            if (flags.includes(data)) {
                ui.notifications.warn(game.i18n.localize("SCENE_MACROS.feedback.macro-already-linked"))
            } else {
                flags.push(data)
                await scene.setFlag(SceneMacros.NAME, SceneMacros.FLAGS.LINKS, flags)
            }
        } else {
            ui.notifications.error(game.i18n.localize("SCENE_MACROS.feedback.invalid-id"))
        }
    }

}
