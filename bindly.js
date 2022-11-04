class ElmBind {
    constructor(params) {
        function keyNotListed(key) { return !Object.keys(params).includes(key) }

        // if the user did not pass a target, we cant do anything and need to warn them.
        if (keyNotListed('target')) return console.error('Bindly: You must pass a target element selector.')

        // Set defaults for params that may not be passed and need to be set to TRUE.
        if (keyNotListed('bindAll')) params['bindAll'] = true

        this.bindlyStyleDetails = {
            'bound-element': null,
            'original': null
        }

        this.params = params
        this.awaitDOM()

    }
    guidGenerator() {
        var S4 = function() {
           return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        };
        return (S4()+"-"+S4()+"-"+S4()+"-"+S4());
    }
    awaitDOM() {
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', async (e) => {
                this.awaitReadyStateComplete()
            })
        }
        else if (document.readyState === 'interactive') {
            this.awaitReadyStateComplete()
        }
        else {
            this.waitForElm()
        }
    }
    awaitReadyStateComplete() {
        if (document.readyState === 'complete' || this.params.runBeforeComplete) {
            return this.waitForElm()
        }
        let observer = new MutationObserver(mutations => {
            if (document.readyState === 'complete') {
                observer.disconnect()
                this.waitForElm()
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        })
    }
    waitForElm() {
        new Promise(resolve => {
            if (this.params.jquery == true) {
                if ($(`${this.params.target}:not([bindly="bound"])`).length >= 1) {
                    return resolve($(`${this.params.target}:not([bindly="bound"])`)[0])
                }
                let observer = new MutationObserver(mutations => {
                    if ($(`${this.params.target}:not([bindly="bound"])`).length >= 1) {
                        resolve($(`${this.params.target}:not([bindly="bound"])`)[0])
                        observer.disconnect();
                    }
                });
                observer.observe(document.body, { childList: true, subtree: true })
            }
            else {
                if (document.querySelector(`${this.params.target}:not([bindly="bound"])`)) {
                    return resolve(document.querySelector(`${this.params.target}:not([bindly="bound"])`))
                }
                let observer = new MutationObserver(mutations => {
                    if (document.querySelector(`${this.params.target}:not([bindly="bound"])`)) {
                        resolve(document.querySelector(`${this.params.target}:not([bindly="bound"])`))
                        observer.disconnect();
                    }
                });
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                })
            }
        }).then((element) => {
            element.setAttribute('bindly', 'bound')
            element.setAttribute('bindly-element-type', 'original')
            element.setAttribute('bindly-id', this.guidGenerator())
            this.originalElm = element

            if (!this.params.duplicate) {
                if (this.params.bindToParent) {
                    this.params.newElm = element.closest(this.params.bindToParent)
                    if (this.params.newElm) {
                        this.params.newElm.setAttribute('bindly', 'bound')
                        this.manipulateElm()
                    }
                    else {
                        // this checks if the element has the desired parent class, if not, we need to re run the waitForElm routine regardless of bindAll status.
                        this.waitForElm()
                    }
                }
                else {
                    this.newElm = element // We set "newElm" directly to the element itself since the user does not wish to duplicate the elm
                    this.manipulateElm()
                }
            }

            if (this.params.duplicate) {
                if (this.params.bindToParent) {
                    this.params.targetToClone = element.closest(this.params.bindToParent)
                    if (this.params.targetToClone) {
                        element.closest(this.params.bindToParent).setAttribute('bindly', 'bound')
                        this.initializeElm()
                    }
                    else {
                        // this checks if the element has the desired parent class, if not, we need to re run the waitForElm routine regardless of bindAll status.
                        this.waitForElm()
                    }
                } else {
                    this.params.targetToClone = element
                    this.initializeElm()
                }
            }

            this.params.bindAll && this.waitForElm()
            this.trackElmDeletion(element, 'original')
            if (this.params.onAttributeChange) {
                this.bindlyStyleDetails['original'] = this.getCurrentStyles(this.originalElm)
                this.onAttributeChange(element, 'original')
            }

        })
    }
    trackElmDeletion(target, element_type) {
        new Promise(resolve => {
            let observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    var nodes = Array.from(mutation.removedNodes)
                    var directMatch = nodes.indexOf(target) > -1
                    var parentMatch = nodes.some(parent => parent.contains(target))
                    if (directMatch || parentMatch) {
                        observer.disconnect()
                        resolve({
                            'elementType': element_type,
                            'target': target,
                            'mutation': mutation,
                            'destructionMethod': directMatch ? "direct match" : parentMatch ? "parent match" : "unknown",
                        })
                    }
                })
            })
            var config = {
                subtree: true,
                childList: true
            }
            observer.observe(document.body, config)
        }).then((removalEventDetails) => {
            this.onDestroyed(removalEventDetails)
            if (!this.params.bindAll) this.waitForElm() // if we are on bindall then we are already listenng for new elements to be created, allows waitforelm to run here would cuase a recursive loop
        })
    }
    onAttributeChange(target_element, bindly_element_type) {

        // collect information on attribute changes
        var changeInfo = {}

        target_element.setAttribute = (...args) => {
            changeInfo = {
                'attribute': args[0],
                'old_value': target_element.getAttribute(args[0]),
                'new_value': args[1],
            }
            return HTMLElement.prototype.setAttribute.apply(target_element, args);
        };
        
        new Promise(resolve => {
            let observer = new MutationObserver(function (records) {
                records.forEach(function (record) {
                    try {
                        if (record.target == target_element) {
                            observer.disconnect()
                            resolve(record)
                        }
                    } catch (err) { console.error(err) /* supress err */ }
                });
            });
        
            observer.observe(document.body.parentElement, {
                childList: false,
                subtree: true,
                attributes: true
            });
        }).then((record) => {

            // we use .then() to access our class information without being limited by the mutation observers class.
            // re-instantiate observer right away since we don't actually want it to be off
            if (bindly_element_type == 'original') this.onAttributeChange(this.originalElm, 'original')
            if (bindly_element_type == 'bound-element') this.onAttributeChange(this.newElm, 'bound-element')

            // the below inline if statement is irrelevant with the current version of bindly. We will ALWAYS have it present. More so just a backup in the unlikely case something goes wrong.
            // TODO: Get the guts up to remove the crutch if statement below...
            const previousStyleDetails = this.bindlyStyleDetails[bindly_element_type] ? this.bindlyStyleDetails[bindly_element_type] : {}

            this.bindlyStyleDetails[bindly_element_type] = this.getCurrentStyles(target_element)

            var styleChangeLog = {};

            const newStyleDetails = this.bindlyStyleDetails[bindly_element_type]
            const newStyleDetailsKeys = Object.keys(newStyleDetails)
            for (var i=0; i < newStyleDetailsKeys.length; i++) {
                var newStlyeKey = newStyleDetailsKeys[i]
                if (previousStyleDetails[newStlyeKey] != newStyleDetails[newStlyeKey]) {
                    styleChangeLog[newStlyeKey] = {
                        'old_value': previousStyleDetails[newStlyeKey],
                        'new_value': newStyleDetails[newStlyeKey],
                    }
                }
            }

            const attribute_change_record = {
                'attributeTrigger': record.attributeName,
                'bindlyElementType': bindly_element_type,
                'target': target_element,
                'mutation': record,
                'styleChanges': styleChangeLog,
                'attributeChanges': changeInfo
            }

            changeInfo = {} // reset changeInfo

            this.params.onAttributeChange(attribute_change_record)
    
        })

    }
    getCurrentStyles(elm) {
        const computedStyles = window.getComputedStyle(elm)
        const computedStyleKeys = Object.keys(computedStyles)
        var allStyles = {}
        for (var i=0; i < computedStyleKeys.length; i++) { 
            var styleKey = computedStyleKeys[i];
            if (isNaN(styleKey)) allStyles[styleKey] = computedStyles[styleKey] 
        }
        return allStyles
    }
    initializeElm() {
        this.dupliacteElm()
        this.newElm.setAttribute('bindly-id', this.guidGenerator())

        this.params.hideOriginal && this.hideOriginal()
        this.params.id && this.setNewElmId()
        this.params.className && this.setClass()
        this.params.addClasses && this.addClasses()
        this.params.setAttributes && (() => {
            for (let i=0; i < Object.keys(this.params.setAttributes).length; i++) {
                var attrKey = Object.keys(this.params.setAttributes)[i]
                var attrVal = Object.values(this.params.setAttributes)[i]
                this.addAttribute(attrKey, attrVal)
            }
        })()
        this.params.addEventListeners && (() => {
            for (let i=0; i < Object.keys(this.params.addEventListeners).length; i++) {
                var listenerKey = Object.keys(this.params.addEventListeners)[i]
                var listenerVal = Object.values(this.params.addEventListeners)[i]
                this.addListener(listenerKey, listenerVal)
            }
        })()
        typeof this.params.insert === 'string' ? this.params.insert.toLowerCase() == 'before' ? this.insertBefore() : this.insertAfter() : this.insertAfter()

        // onAttributeChange =>
        if (this.params.onAttributeChange) {
            this.bindlyStyleDetails['bound-element'] = this.getCurrentStyles(this.newElm)
            this.onAttributeChange(this.newElm, 'bound-element')
        }

        // onCreated =>
        this.params.onCreated && this.onCreated()
    }
    manipulateElm() {
        this.params.id && this.setNewElmId()
        this.params.className && this.setClass()
        this.params.addClasses && this.addClasses()
        this.params.setAttributes && (() => {
            for (let i=0; i < Object.keys(this.params.setAttributes).length; i++) {
                var attrKey = Object.keys(this.params.setAttributes)[i]
                var attrVal = Object.values(this.params.setAttributes)[i]
                this.addAttribute(attrKey, attrVal)
            }
        })()
        this.params.addEventListeners && (() => {
            for (let i=0; i < Object.keys(this.params.addEventListeners).length; i++) {
                var listenerKey = Object.keys(this.params.addEventListeners)[i]
                var listenerVal = Object.values(this.params.addEventListeners)[i]
                this.addListener(listenerKey, listenerVal)
            }
        })()
        this.params.onCreated && this.onCreated()
    }
    dupliacteElm() {
        this.newElm = this.params.targetToClone.cloneNode(true)
        this.newElm.setAttribute('bindly-element-type', 'bound-element')
        this.trackElmDeletion( this.newElm, 'bound-element' )
    }
    hideOriginal() {
        this.params.targetToClone.style.display = 'none'
    }
    setNewElmId() {
        if (this.params.id) this.newElm.id = this.params.id
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
        this.params.targetToClone.parentNode.insertBefore(this.newElm, this.params.targetToClone.nextSibling)
    }
    insertBefore() {
        this.params.targetToClone.parentNode.insertBefore(this.newElm, this.params.targetToClone)
    }
    onCreated() {
        this.params.onCreated(this.originalElm, this.newElm)
    }
    onDestroyed(removalEventDetails) {
        if (this.params.onDestroyed) this.params.onDestroyed(removalEventDetails)
    }
}

function bindElement(params) {
    return new ElmBind(params)
}

// awaitPresence offers a simple option to await the presence of an element.
// An ideal use case would be for when you need to collect data from an element before proceeding with other functions.
async function awaitPresence(selector, jquery = false) {
    if (jquery == false) return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector))
        }

        let observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector))
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        })
    })

    // JQUERY MODE:
    return new Promise(resolve => {
        if ($(selector)[0]) {
            return resolve($(selector)[0])
        }
        let observer = new MutationObserver(mutations => {
            if ($(selector)[0]) {
                resolve($(selector)[0])
                observer.disconnect();
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}