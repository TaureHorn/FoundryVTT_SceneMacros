import SceneMacros from "../sceneMacros.js"
import SceneMacrosData from "./sceneMacrosData.js"

export default class MacroBrowser extends FormApplication {
    constructor(sceneId) {
        super()
        this.sceneId = sceneId
        this.document = SceneMacrosData.getScene(sceneId)
    }

    static get defaultOptions() {
        const defaults = super.defaultOptions
        const overrides = {
            classes: ['macrosBrowser', ` macrosBrowser_${this.sceneId}`],
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

    _getHeaderButtons() {
        return [{
            class: 'close',
            icon: 'fas fa-times',
            label: '',
            onclick: () => this.close(),
            tooltip: "SCENE_MACROS.macro-browser.close"
        }]
    }

    activateListeners(html) {
        html.on('click', '.macroInteract', this._macroInteraction)
    }

    commentMacro(macro) {
        const commentDialog = new Dialog({
            buttons: {
                comment: {
                    callback: async (html) => {
                        SceneMacrosData.writeMacroComment(this.sceneId, macro._id, $(html).find('#macroCommentInput')[0].value)
                    },
                    icon: '<i class="fas fa-comment"></i>',
                    label: game.i18n.localize("SCENE_MACROS.macro-browser.comment-short")
                }
            },
            content: `
                <p>Write a comment about the macro <strong>${macro.name}</strong></p>
                <form>
                    <input id="macroCommentInput" name="macroComment" type="text" minlength="1" maxlength="240" placeholder="${game.i18n.localize("SCENE_MACROS.macro-browser.comment-short")}" required
                </form>`,
            title: game.i18n.localize("SCENE_MACROS.macro-browser.macro-comment-dialog")
        })
        commentDialog.options.classes.push('sceneMacrosDialog')
        commentDialog.render(true)
    }

    _macroInteraction = (ev) => {
        const data = $(ev.currentTarget).data()
        const macro = game.macros.get(data.macroId)
        if (!macro) return
        switch (data.action) {
            case 'comment':
                this.commentMacro(macro)
                break;
            case 'edit':
                macro.sheet.render(true)
                break;
            case 'execute':
                macro.execute()
                break;
            case 'unlink':
                SceneMacrosData.writeFlags(this.sceneId, data.macroId, false)
                break;
            default:
                console.error()
                ui.notifications.error(`_macroInteraction switch(data-action) ${game.i18n.localize("SCENE_MACROS.macro-browser.switch-error")}`)
        }
    }

    render(...args) {
        // link app to documents so it re-renders normally
        this.document.apps[this.appId] = this

        super.render(...args)
    }

    _updateObject(event, formData) {
        const macroUuid = formData.macroUuid.split('.')
        const macroId = game.macros.get(macroUuid[1]) ? macroUuid[1] : false
        if (macroId) {
            SceneMacrosData.writeFlags(this.sceneId, macroId, true)
            return
        } else {
            ui.notifications.warn(game.i18n.localize("SCENE_MACROS.macro-browser.invalid-uuid"))
        }
    }

}

