/*
Version: v1.1.8 ( updates @ github.com/jridyard/bindly )
Creator: Joe Ridyard ( github.com/jridyard )
*/

class ElmBind {
    constructor(params) {
        function keyNotListed(key) { return !Object.keys(params).includes(key) }

        // if the user did not pass a target, we cant do anything and need to warn them.
        if (keyNotListed('target')) return console.error('Bindly: You must pass a target element selector.')

        // Set defaults for params that may not be passed and need to be set to TRUE.
        if (keyNotListed('bindAll')) params['bindAll'] = true
        if (keyNotListed('duplicate')) params['duplicate'] = true

        this.bindlyStyleDetails = {
            'bound-element': {},
            'original': {}
        }

        this.removalObservers = {
            'bound-element': {},
            'original': {}
        }

        this.attributeObservers = {
            'bound-element': {},
            'original': {}
        }

        this.elmsInjected = {} // contains ID's of elements that have been injected by bindly and a link to the element
        this.originalElmsBound = {} // tracks ID's of the original elements we injected

        this.params = params

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
        this.pageStateObserver = new MutationObserver(mutations => {
            if (document.readyState === 'complete') {
                this.pageStateObserver.disconnect()
                this.waitForElm()
            }
        });
        this.pageStateObserver.observe(document.body, {
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
                this.awaitPresenceObserver = new MutationObserver(mutations => {
                    if ($(`${this.params.target}:not([bindly="bound"])`).length >= 1) {
                        resolve($(`${this.params.target}:not([bindly="bound"])`)[0])
                        this.awaitPresenceObserver.disconnect();
                    }
                });
                this.awaitPresenceObserver.observe(document.body, { childList: true, subtree: true })
            }
            else {
                if (document.querySelector(`${this.params.target}:not([bindly="bound"])`)) {
                    return resolve(document.querySelector(`${this.params.target}:not([bindly="bound"])`))
                }
                this.awaitPresenceObserver = new MutationObserver(mutations => {
                    if (document.querySelector(`${this.params.target}:not([bindly="bound"])`)) {
                        resolve(document.querySelector(`${this.params.target}:not([bindly="bound"])`))
                        this.awaitPresenceObserver.disconnect();
                    }
                });
                this.awaitPresenceObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                })
            }
        }).then((element) => {
            element.setAttribute('bindly', 'bound')
            element.setAttribute('bindly-element-type', 'original')

            const bindly_id = this.guidGenerator()
            element.setAttribute('bindly-id', bindly_id)
            this.originalElm = element
            this.originalElmsBound[bindly_id] = this.originalElm

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
            this.trackElmDeletion(element, 'original', bindly_id)
            if (this.params.onAttributeChange) {
                this.bindlyStyleDetails['original'][bindly_id] = this.getCurrentStyles(this.originalElm)
                this.onAttributeChange(element, 'original', bindly_id)
            }

        })
    }
    trackElmDeletion(target, element_type, bindly_element_id) {
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
            this.removalObservers[element_type][bindly_element_id] = observer
        }).then((removalEventDetails) => {
            this.onDestroyed(removalEventDetails)
            if (!this.params.bindAll) this.waitForElm() // if we are on bindall then we are already listenng for new elements to be created, allows waitforelm to run here would cuase a recursive loop
        })
    }
    onAttributeChange(target_element, bindly_element_type, bindly_element_id) {

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

        target_element.removeAttribute = (...args) => {
            changeInfo = {
                'attribute': args[0],
                'old_value': target_element.getAttribute(args[0]),
                'new_value': null,
            }
            return HTMLElement.prototype.removeAttribute.apply(target_element, args);
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

            this.attributeObservers[bindly_element_type][bindly_element_id] = observer
        }).then((record) => {

            const bindly_id = record.target.getAttribute('bindly-id') ? record.target.getAttribute('bindly-id') : this.guidGenerator()

            // we use .then() to access our class information without being limited by the mutation observers class.
            // re-instantiate observer right away since we don't actually want it to be off
            if (bindly_element_type == 'original') this.onAttributeChange(record.target, 'original', bindly_id)
            if (bindly_element_type == 'bound-element') this.onAttributeChange(record.target, 'bound-element', bindly_id)

            // the below inline if statement is irrelevant with the current version of bindly. We will ALWAYS have it present. More so just a backup in the unlikely case something goes wrong.
            // TODO: Get the guts up to remove the crutch if statement below...
            const previousStyleDetails = this.bindlyStyleDetails[bindly_element_type][bindly_id] ? this.bindlyStyleDetails[bindly_element_type][bindly_id] : {}

            this.bindlyStyleDetails[bindly_element_type][bindly_id] = this.getCurrentStyles(target_element)

            var styleChangeLog = {};

            const newStyleDetails = this.bindlyStyleDetails[bindly_element_type][bindly_id]
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
        const bindly_id = this.guidGenerator()
        this.newElm.setAttribute('bindly-id', bindly_id)
        this.elmsInjected[bindly_id] = this.newElm

        // track removal of the bound element
        this.trackElmDeletion( this.newElm, 'bound-element', bindly_id )

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
            this.bindlyStyleDetails['bound-element'][bindly_id] = this.getCurrentStyles(this.newElm)
            this.onAttributeChange(this.newElm, 'bound-element', bindly_id)
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
        const createdInfo = {
            'originalElement': this.originalElm,
            'newElement': this.newElm,
        }
        this.params.onCreated(createdInfo)
    }
    onDestroyed(removalEventDetails) {
        const uuid_removed = removalEventDetails.target.getAttribute('bindly-id')
        delete this.elmsInjected[uuid_removed]
        if (this.params.onDestroyed) this.params.onDestroyed(removalEventDetails)
    }
    destroy(onDestroyCallback) {
        if (this.enabled) {

            // this callback allows the user to modify the originalElm back to its initial state and collect metadata or w/e they want from the duplicated elm.
            const newElments = Object.assign({}, this.elmsInjected)
            const originalElements = Object.assign({}, this.originalElmsBound)
            if (onDestroyCallback) onDestroyCallback({'originalElements': originalElements, 'newElements': newElments})

            if (this.awaitPresenceObserver) this.awaitPresenceObserver.disconnect() // it's possible for the element to already be present and bindAll be set to false. This would cause the awaitPresenceObserver never to have been created.
            this.disconnectObservers(this.removalObservers, 'original')
            this.disconnectObservers(this.attributeObservers, 'original')
            this.removalObservers['original'] = {}
            this.attributeObservers['original'] = {}

            const originalElmsBoundIds = Object.keys(this.originalElmsBound)
            for (var i=0; i < originalElmsBoundIds.length; i++) {
                const originalElmBoundId = originalElmsBoundIds[i]
                const originalElement = this.originalElmsBound[originalElmBoundId]
                if (originalElement) {
                    originalElement.removeAttribute('bindly')
                    originalElement.removeAttribute('bindly-element-type')
                    originalElement.removeAttribute('bindly-id')
                }
                delete this.originalElmsBound[originalElmBoundId]
            }
    
            if (this.params.duplicate) {
                this.disconnectObservers(this.removalObservers, 'bound-element')
                this.disconnectObservers(this.attributeObservers, 'bound-element')
                this.removalObservers['bound-element'] = {}
                this.attributeObservers['bound-element'] = {}

                const injectedElmIds = Object.keys(this.elmsInjected)
                for (var i=0; i < injectedElmIds.length; i++) {
                    const injectedElmId = injectedElmIds[i]
                    const elementInjected = this.elmsInjected[injectedElmId]
                    if (elementInjected) {
                        elementInjected.remove()
                    }
                    delete this.elmsInjected[injectedElmId]
                }
                this.newElm.remove()
            }
    
            this.enabled = false
        }
    }
    bind() {
        if (!this.enabled) {
            this.awaitDOM() // resets the original launch routine
            this.enabled = true
        }
    }
    disconnectObservers(observersType, elementType) {
        const observersToDisconnect = Object.keys(observersType[elementType])
        for (var i=0; i < observersToDisconnect.length; i++) {
            const observerKey = observersToDisconnect[i]
            const observer = observersType[elementType][observerKey]
            observer.disconnect()
        }
    }
}

function Bindly(params) {
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