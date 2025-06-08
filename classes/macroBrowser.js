import SceneMacros from "../sceneMacros.js"
import SceneMacrosData from "./sceneMacrosData.js"
const { ApplicationV2, DialogV2, HandlebarsApplicationMixin } = foundry.applications.api

export class MacroBroswerV2 extends HandlebarsApplicationMixin(ApplicationV2) {

    static DEFAULT_OPTIONS = {
        actions: {
            comment: MacroBroswerV2.#comment,
            copyUuid: MacroBroswerV2.#copyUuid,
            edit: MacroBroswerV2.#editMacro,
            execute: MacroBroswerV2.#executeMacro,
            unlink: MacroBroswerV2.#unlinkMacro
        },
        form: {
            handler: MacroBroswerV2.#onSubmit,
        },
        id: 'macro-browser_{id}',
        position: {
            height: 'auto',
            width: window.innerWidth * 0.2
        },
        tag: 'form',
        window: {
            icon: 'fas fa-code',
            resizable: true,
            title: "SCENE_MACROS.macro-browser.title",
        }
    }

    static PARTS = {
        form: {
            template: 'modules/sceneMacros/templates/macroBrowser.hbs'
        },
    }

    constructor(sceneId) {
        super()
        this.sceneId = sceneId
        this.document = SceneMacrosData.getScene(sceneId)
    }

    get title() {
        return `${this.document.name}: ${game.i18n.localize(this.options.window.title)}`
    }

    _prepareContext(opts) {
        this.options.classes.push(`macrosBrowser_${this.sceneId}`)

        const data = this.document
        data.linkedMacros = SceneMacrosData.getLinkedMacros(SceneMacrosData.getSceneFlags(this.sceneId))
        return data
    }

    // REGISTER APP TO DOCUMENT APPS SO DOCUMENT UPDATES RE-RENDER APP
    _onFirstRender(context, options) {
        this.document.apps[this.id] = this
    }

    // REMOVE APP FROM DOCUMENT APPS
    close(...args) {
        delete this.document.apps[this.id]
        return super.close(args)
    }

    // OPENS DIALOG TO INPUT COMMENT AND WRITE SENDS COMMENT TO BE WRITTEN BY DATA LAYER
    static #comment(event, target) {
        const macro = game.macros.get(target.dataset.macroId)
        if (!macro) return

        const previousComment = SceneMacrosData.getSceneFlags(this.sceneId)[macro.id]
        const dialogId = `commentDialog_${this.sceneId}_${macro.id}`

        // MAKE NEW DIALOG TO GET USER COMMENT AND RENDER
        const commentDialog = new DialogV2({
            buttons: [
                {
                    action: 'makeComment',
                    callback: async (event, button, dialog) => {
                        const newComment = button.form.elements.macroComment.value
                        SceneMacrosData.writeMacroComment(this.sceneId, macro.id, newComment)
                    },
                    icon: 'fas fa-comment',
                    label: game.i18n.localize('SCENE_MACROS.macro-browser.comment-short'),
                },
            ],
            confirmed: false,
            content: `
                <div>
                    <input 
                        id="macroCommentInput"
                        name="macroComment" 
                        type="text" 
                        minlength="1" 
                        maxlength="256" 
                        value="${previousComment}" 
                        placeholder="${game.i18n.localize("SCENE_MACROS.macro-browser.comment-short")}" 
                        required
                    />
                </div>`,
            id: dialogId,
            position: {
                width: window.innerWidth * 0.2
            },
            window: {
                title: `${game.i18n.localize('SCENE_MACROS.macro-browser.comment-short')}: ${macro.name}`,
            },
        })
        document.getElementById(dialogId)?.length
            ? foundry.applications.instances.get(dialogId).bringToFront()
            : commentDialog.render(true)
    }

    // COPIES A UUID TO CLIPBOARD 
    static #copyUuid(event, target) {
        const text = target.dataset.uuid
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

    // OPEN EDITOR FOR MACRO
    static #editMacro(event, target) {
        const macro = game.macros.get(target.dataset.macroId)
        if (!macro) return
        macro.sheet.render(true)
    }

    // RUN MACRO
    static #executeMacro(event, target) {
        const macro = game.macros.get(target.dataset.macroId)
        if (!macro) return
        macro.execute()
    }

    // REMOVE MACRO FROM LIST OF MACROS LINKED TO SCENE
    static #unlinkMacro(event, target) {
        const macro = game.macros.get(target.dataset.macroId)
        if (!macro) return
        SceneMacrosData.writeFlags(this.sceneId, target.dataset.macroId, false)
    }

    // UPDATE
    static #onSubmit(event, form, formData) {
        // GET MACRO ID FROM FORM, IF CORRESPOND TO MACRO IN DB ADD TO SCENE FLAGS
        const macroId = formData.object.macroUuid.split('.')[1]
        game.macros.get(macroId)
            ? SceneMacrosData.writeFlags(this.sceneId, macroId, true)
            : ui.notifications.warn(game.i18n.localize("SCENE_MACROS.macro-browser.invalid-uuid"))
    }

}

