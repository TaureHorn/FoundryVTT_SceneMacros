import SceneMacros from "../sceneMacros.js"
import SceneMacrosData from "./sceneMacrosData.js"

export default class MacroBrowser extends FormApplication {
    constructor(sceneId) {
        super()
        this.sceneId = sceneId
    }

    static get defaultOptions() {
        const defaults = super.defaultOptions
        const overrides = {
            classes: ['macrosBrowser',` macrosBrowser_${this.sceneId}`],
            closeOnSubmit: false,
            resizable: true,
            template: SceneMacros.TEMPLATES.MACRO_BROWSER,
            title: "SCENE_MACROS.macro-browser.title",
        }
        return foundry.utils.mergeObject(defaults, overrides)
    }

    getData() {
        const data = SceneMacrosData.getScene(this.sceneId)
        data.linkedMacros = SceneMacrosData.getLinkedMacros(SceneMacrosData.getSceneFlags(this.sceneId))
        return data
    }

    activateListeners(html) {
        html.on('click', '.macroInteract', this._macroInteraction)
    }

    _macroInteraction = (ev) => {
        const data = $(ev.currentTarget).data()
        const macro = game.macros.get(data.macroId)
        if (!macro) return 
        switch (data.action) {
            case 'edit':
                macro.sheet.render(true)
                break;
            case 'execute':
                macro.execute()
                break;
            default: 
        }
    }

    async _updateObject(event, formData) {
        const macroUuid = formData.macroUuid.split('.')
        const macroId = game.macros.get(macroUuid[1]) ? macroUuid[1] : false
        if (macroId) {
            await SceneMacrosData.writeFlags(this.sceneId, macroId)
            return
        } else {
            ui.notifications.warn(game.i18n.localize("SCENE_MACROS.macro-browser.invalid-uuid"))
        }

    }

}

