import SceneMacros from "../sceneMacros.js"
import SceneMacrosData from "./sceneMacrosData.js"
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class MacroBrowser extends FormApplication {
    constructor(sceneId) {
        super()
        this.sceneId = sceneId
        this.document = SceneMacrosData.getScene(sceneId)
    }

    static get defaultOptions() {
        const defaults = super.defaultOptions
        const overrides = {
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
        commentDialog.options.classes.push('sceneMacrosDialog', `sceneMacrosDialog_${this.sceneId}_${macro._id}`)

        // if app for this macro from this document is  open bring it to top, if not open it --> only one instance of each macro comment dialog for each document allowed at once
        const currentlyOpen = $('body').find(`.sceneMacrosDialog_${this.sceneId}_${macro._id}`)[0]
        currentlyOpen ? ui.windows[currentlyOpen.dataset.appid].bringToTop() : commentDialog.render(true)
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
        this.options.classes.push('macrosBrowser', `macrosBrowser_${this.sceneId}`)

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
            template: 'modules/sceneMacros/macroBrowser.hbs'
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

    static #comment(event, target, str) {
        console.log('#comment', event, target, str)
    }

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

    static #editMacro(event, target) {
        const macro = game.macros.get(target.dataset.macroId)
        if (!macro) return
        macro.sheet.render(true)
    }

    static #executeMacro(event, target) {
        const macro = game.macros.get(target.dataset.macroId)
        if (!macro) return
        macro.execute()
    }

    static #unlinkMacro(event, target) {
        const macro = game.macros.get(target.dataset.macroId)
        if (!macro) return
        SceneMacrosData.writeFlags(this.sceneId, target.dataset.macroId, false)
    }

    static #onSubmit(event, form, formData) {
        // GET MACRO ID FROM FORM, IF CORRESPOND TO MACRO IN DB ADD TO SCENE FLAGS
        const macroId = formData.object.macroUuid.split('.')[1]
        game.macros.get(macroId)
            ? SceneMacrosData.writeFlags(this.sceneId, macroId, true)
            : ui.notifications.warn(game.i18n.localize("SCENE_MACROS.macro-browser.invalid-uuid"))
    }

}

