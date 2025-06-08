import SceneMacrosData from "./sceneMacrosData.js"
import { copyToClipboard } from "./utils.js"
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export default class MacroBrowserV2 extends HandlebarsApplicationMixin(ApplicationV2) {

    static DEFAULT_OPTIONS = {
        actions: {
            comment: MacroBrowserV2.comment,
            copyUuid: MacroBrowserV2.#copyUuid,
            edit: MacroBrowserV2.#editMacro,
            execute: MacroBrowserV2.#executeMacro,
            unlink: MacroBrowserV2.#unlinkMacro
        },
        classes: ['standard-form'],
        form: {
            handler: MacroBrowserV2.#onSubmit,
        },
        id: 'macro-browser_{id}',
        position: {
            height: 'auto',
            width: window.innerWidth * 0.2
        },
        tag: 'form',
        window: {
            icon: 'fas fa-code',
            resizable: false,
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
        return `${game.i18n.localize(this.options.window.title)}: ${this.document.name}`
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

    // TOGGLE ELEMENT BETWEEN SPAN AND INPUT FOR A MACRO COMMENT
    static comment(event, target) {
        const macroId = target.dataset.macroId
        if (!macroId) return
        const [comment, input] = [
            document.getElementById(`${this.document.uuid}_macroComment_${macroId}`),
            document.getElementById(`${this.document.uuid}_macroCommentInput_${macroId}`)
        ]
        for (const el of [comment, input]) {
            el.style.display = el.style.display === 'block' ? 'none' : 'block'
        }
        if (input.style.display === 'block') {
            input.focus()
            input.setSelectionRange(-1, -1)
        }
    }

    // COPIES A UUID TO CLIPBOARD 
    static #copyUuid(event, target) {
        const text = target.dataset.uuid
        copyToClipboard(text)
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

        // LOOP THROUGH FORMDATA ENTRIES AND PROCESS
        const obj = formData.object
        for (const data in obj) {

            // IF A MACRO ID WAS PROVIDED PUSH TO DATA LAYER TO LINK IT
            if (data === 'macroUuid' && obj[data]) {
                const macroId = obj[data].split('.')[1]
                game.macros.get(macroId)
                    ? SceneMacrosData.writeFlags(this.sceneId, macroId, true)
                    : ui.notifications.warn(game.i18n.localize("SCENE_MACROS.macro-browser.invalid-uuid"))
            }

            // IF MACRO COMMENT DIFFERS FROM ONE STORED IN DB PUSH TO DATA LAYER TO UPDATE IT
            if (data.includes('macroCommentInput')) {
                const id = data.split('_')[1]
                if (obj[data] === SceneMacrosData.getSceneFlags(this.sceneId)[id]) continue
                SceneMacrosData.writeMacroComment(this.sceneId, id, obj[data])
            }
        }

    }

}

Hooks.on('getHeaderControlsMacroBrowserV2', (application, controls) => {
    controls.push({
        icon: 'fas fa-passport',
        label: game.i18n.localize("SCENE_MACROS.macro-browser.copy-scene"),
        onClick: () => {
            copyToClipboard(application.document.uuid)
        },
        ownership: CONST.DOCUMENT_OWNERSHIP_LEVELS['OWNER']
    })
})

