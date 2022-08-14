class ElmBind {
    constructor(params) {
        this.params = params
        this.awaitDOM()
    }
    awaitDOM() {
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', async (e) => {
                this.awaitReadyStateComplete()
            })
        }
        else if (document.readyState === 'interactive') { this.awaitReadyStateComplete() }
        else { this.waitForElm() }
    }
    awaitReadyStateComplete() {
        if (document.readyState === 'complete' || this.params.runBeforeComplete) { return this.waitForElm() }
        console.log('waiting completeion')
        let observer = new MutationObserver(mutations => {
            if (document.readyState === 'complete') {
                observer.disconnect()
                this.waitForElm()
            }
        });
        observer.observe(document.body, { childList: true, subtree: true })
    }
    waitForElm() {
        new Promise(resolve => {
            if (this.params.mode == 'jquery') {
                if ($(`${this.params.el}:not([bindly="bound"])`).length >= 1) { return resolve($(`${this.params.el}:not([bindly="bound"])`)[0]) }
                let observer = new MutationObserver(mutations => {
                    if ($(`${this.params.el}:not([bindly="bound"])`).length >= 1) {
                        resolve($(`${this.params.el}:not([bindly="bound"])`)[0])
                        observer.disconnect();
                    }
                });
                observer.observe(document.body, { childList: true, subtree: true })
            }
            else {
                if (document.querySelector(`${this.params.el}:not([bindly="bound"])`)) { return resolve(document.querySelector(`${this.params.el}:not([bindly="bound"])`)) }
                let observer = new MutationObserver(mutations => {
                    if (document.querySelector(`${this.params.el}:not([bindly="bound"])`)) {
                        resolve(document.querySelector(`${this.params.el}:not([bindly="bound"])`))
                        observer.disconnect();
                    }
                });
                observer.observe(document.body, { childList: true, subtree: true })
            }
        }).then((element) => {
            element.setAttribute('bindly', 'bound')
            if (this.params.parentToBind) {
                this.params.elToClone = element.closest(this.params.parentToBind)
                if (this.params.elToClone) {
                    element.closest(this.params.parentToBind).setAttribute('bindly', 'bound')
                    this.initializeElm()
                    !this.params.bindAll && this.trackElmDeletion(element)
                    this.params.bindAll && this.waitForElm()
                } else {
                    // this checks if the element has the desired parent class, if not, we need to re run the waitForElm routine regardless of bindAll status.
                    this.waitForElm()
                }
            } else {
                this.params.elToClone = element
                this.initializeElm()
                !this.params.bindAll && this.trackElmDeletion(element)
                this.params.bindAll && this.waitForElm()
            }
        })
    }
    trackElmDeletion(target) {
        new Promise(resolve => {
            let observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    var nodes = Array.from(mutation.removedNodes)
                    var directMatch = nodes.indexOf(target) > -1
                    var parentMatch = nodes.some(parent => parent.contains(target))
                    if (directMatch || parentMatch) {
                        observer.disconnect()
                        resolve('Element Deleted')
                    }
                })
            })
            var config = { subtree: true, childList: true }
            observer.observe(document.body, config)
        }).then((msg) => {
            this.waitForElm()
        })
    }
    initializeElm() {
        this.dupliacteElm()
        this.params.hideOriginal && this.hideOriginal()
        this.params.id && this.setNewElmId()
        this.params.className && this.setClass()
        this.params.addClasses && this.addClasses()
        this.params.addAttributes && (() => {for (let i=0; i < Object.keys(this.params.addAttributes).length; i++) { this.addAttribute(Object.keys(this.params.addAttributes)[i], Object.values(this.params.addAttributes)[i]) }})()
        this.params.addListeners && (() => {for (let i=0; i < Object.keys(this.params.addListeners).length; i++) { this.addListener(Object.keys(this.params.addListeners)[i], Object.values(this.params.addListeners)[i]) }})()
        typeof this.params.insert === 'string' ? this.params.insert.toLowerCase() == 'before' ? this.insertBefore() : this.insertAfter() : this.insertAfter()
        this.params.adjustElm && this.adjustElm()
    }
    dupliacteElm() {
        this.newElm = this.params.elToClone.cloneNode(true)
    }
    hideOriginal() {
        this.params.elToClone.style.display = 'none'
    }
    setNewElmId() {
        if (this.params.id) { this.newElm.id = this.params.id }
    }
    setClass() {
        this.newElm.className = this.params.className
    }
    addClasses() {
        this.newElm.classList.add(...this.params.addClasses)
    }
    addAttribute(attrName, attrValue) {
        this.newElm.setAttribute(attrName, attrValue)
    }
    addListener(listFor, callback) {
        this.newElm.addEventListener(listFor, callback)
    }
    insertAfter() {
        this.params.elToClone.parentNode.insertBefore(this.newElm, this.params.elToClone.nextSibling)
    }
    insertBefore() {
        this.params.elToClone.parentNode.insertBefore(this.newElm, this.params.elToClone)
    }
    adjustElm() {
        this.params.adjustElm(this.newElm)
    }
}
function Bindly(params) { return new ElmBind(params) }