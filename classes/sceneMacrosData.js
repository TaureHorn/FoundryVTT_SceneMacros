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

    static async flagsAddition(scene, flags, id) {
        if (flags.hasOwnProperty(id)) {
            ui.notifications.warn(game.i18n.localize("SCENE_MACROS.feedback.macro-already-linked"))
        } else {
            flags[id] = ""
            await scene.setFlag(SceneMacros.NAME, SceneMacros.FLAGS.LINKS, flags)
        }
    }

    static async flagsSubtraction(scene, flags, id) {
        if (flags.hasOwnProperty(id)) {
            await scene.unsetFlag(SceneMacros.NAME, `${SceneMacros.FLAGS.LINKS}.${id}`)
        } else {
            ui.notifications.warn(game.i18n.localize("SCENE_MACROS.feedback.macro-not-linked"))
        }
    }

    static getLinkedMacros(macroIdObj) {
        // get macros that match ids linked to scene and sort them alphabetically based on name
        let data = game.macros.filter(macro => macroIdObj.hasOwnProperty(macro.id)).sort((a, b) => a.name.localeCompare(b.name))
        for (const key in macroIdObj) {
            data[data.findIndex(obj => obj._id === key)].comment = macroIdObj[key]
        }
        return data
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
        // get modules flags from single scene. if no flags return empty object
        const scene = this.getScene(id)
        const flags = scene.getFlag(SceneMacros.NAME, SceneMacros.FLAGS.LINKS)
        return flags ? flags : {}
    }

    static async writeFlags(id, macroId, addition) {
        // write macroId to scene flags
        const scene = this.getScene(id)
        const flags = this.getSceneFlags(scene._id) ? structuredClone(this.getSceneFlags(scene._id)) : []

        // regex test macroId
        const alphanumerics = new RegExp("^[A-Za-z0-9.]+$")
        if (alphanumerics.test(macroId)) {
            return addition ? this.flagsAddition(scene, flags, macroId) : this.flagsSubtraction(scene, flags, macroId)
        } else {
            ui.notifications.error(game.i18n.localize("SCENE_MACROS.feedback.invalid-id"))
        }
    }

    static async writeMacroComment(sceneId, macroId, commentStr) {
        // write comment to scene flags
        if (!typeof commentStr === 'String') return
        const scene = this.getScene(sceneId)
        const flags = this.getSceneFlags(sceneId)
        flags[macroId] = commentStr
        await scene.setFlag(SceneMacros.NAME, SceneMacros.FLAGS.LINKS, flags)
    }

}

globalThis.SceneMacrosData = SceneMacrosData
