
export function copyToClipboard(text) {
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

