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
            default: "comment",
            title: game.i18n.localize("SCENE_MACROS.macro-browser.macro-comment-dialog")
        })
        commentDialog.options.classes.push('sceneMacrosDialog')
        commentDialog.render(true)
    }

    copyToClipboard(text) {
        // @param {string} text
        if (typeof text === 'string') {
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(text)
                } else {
                    // fallback in case not in HTTPS - the jankiest method to copy text know to man, like wtf
                    const copyText = document.createElement('textarea')
                    copyText.value = text
                    copyText.style.position = 'absolute';
                    copyText.style.left = '-99999px'

                    document.body.prepend(copyText)
                    copyText.select()

                    try {
                        document.execCommand('copy')
                    } catch (err) {
                        console.error(err)
                    } finally {
                        copyText.remove()
                    }
                }
                ui.notifications.info(game.i18n.localize("SCENE_MACROS.macro-browser.copied"))
            } catch (err) {
                console.error(err)
                ui.notifications.error(game.i18n.localize("SCENE_MACROS.macro-browser.copy-failed"))
            }
        } else {
            ui.notifications.error(game.i18n.localize("SCENE_MACROS.macro-browser.copy-failed"))
            console.error('TypeError: element to copy is not a string', text, this)
        }
    }

    _macroInteraction = (ev) => {
        const data = $(ev.currentTarget).data()
        const macro = game.macros.get(data.macroId)
        switch (data.action) {
            case 'comment':
                if (!macro) return
                this.commentMacro(macro)
                break;
            case 'copy-uuid':
                this.copyToClipboard(data.uuid)
                break;
            case 'edit':
                if (!macro) return
                macro.sheet.render(true)
                break;
            case 'execute':
                if (!macro) return
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

