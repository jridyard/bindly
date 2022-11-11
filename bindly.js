/*
Version: v1.2.1 ( updates @ github.com/jridyard/bindly )
Creator: Joe Ridyard ( github.com/jridyard )
*/

class ElmBind {

    constructor(params) {

        function keyNotListed(key) { return !Object.keys(params).includes(key) }

        // if the user did not pass a target, we cant do anything and need to warn them.
        if (keyNotListed('target')) return console.error('Bindly: You must pass a target element selector.')

        // Set defaults for params that may not be passed and need to be set to TRUE.
        if (keyNotListed('bindAll')) params['bindAll'] = true
        if (keyNotListed('awaitDOM')) params['awaitDOM'] = true
        if (keyNotListed('duplicate')) params['duplicate'] = true
        if (keyNotListed('groupId')) params['groupId'] = this.guidGenerator()


        this.bindlyStyleDetails = {
            'original': {},
            'duplicate': {}
        }

        this.removalObservers = {
            'original': {},
            'duplicate': {}
        }

        this.attributeObservers = {
            'original': {},
            'duplicate': {}
        }

        this.duplicateElms = {} // contains ID's of elements that have been injected by bindly and a link to the element
        this.originalElms = {} // tracks ID's of the original elements we injected

        this.params = params

    }

    guidGenerator() {
        var S4 = function() {
           return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        };
        return (S4()+"-"+S4()+"-"+S4());
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
        if (document.readyState === 'complete' || !this.params.awaitDOM) {
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
        // no need to ever have waitForElm running more than once at a time.
        if (this.awaitingElm) return
        this.awaitingElm = true

        if (this.awaitPresenceObserver) this.awaitPresenceObserver.disconnect() // if we are on bindall then we are already listening for new elements to be created, this would cause a recursive loop if don't disconnect here first in that.
        
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
        }).then((originalElement) => {
            // waitForElm has no completed a cycle, next time we call WFE, we need to make sure it runs.
            this.awaitingElm = false

            const bindly_id = this.guidGenerator()
            originalElement.setAttribute('bindly-id', bindly_id)
            originalElement.setAttribute('bindly-element-type', 'original')
            originalElement.setAttribute('bindly', 'bound')

            if (this.params.groupId) originalElement.setAttribute('bindly-group-id', this.params.groupId)

            const originalElm = originalElement
            this.originalElms[bindly_id] = originalElm

            if (!this.params.duplicate) {
                // element is created, run OnCreated callback if user passed one
                if (this.params.onCreated) {
                    const createdInfo = {
                        'originalElement': originalElm,
                        'duplicateElement': null,
                    }
                    this.onCreated(createdInfo)
                }
            }

            this.trackElmDeletion(originalElement, 'original', bindly_id)

            if (this.params.duplicate) {
                const targetToClone = originalElement
                this.initializeDuplicateElm(targetToClone)
            }

            const manipulationParams = this.params.originalElement // .adjustments?
            if (manipulationParams) this.manipulateElm(originalElm, manipulationParams)

            if (this.params.onAttributeChange) {
                this.bindlyStyleDetails['original'][bindly_id] = this.getCurrentStyles(originalElm)
                this.onAttributeChange(originalElm, 'original', bindly_id)
            }

            if (this.params.bindAll) this.waitForElm()

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
                            'destructionMethod': directMatch ? "direct-match" : parentMatch ? "parent-match" : "unknown",
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
            this.waitForElm()
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
                    } catch (err) { /* supress err */ }
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
            if (bindly_element_type == 'duplicate') this.onAttributeChange(record.target, 'duplicate', bindly_id)

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

    initializeDuplicateElm(targetToClone) {
        // targetToClone == originalElm
        const duplicateElm = this.dupliacteElm(targetToClone)

        const bindly_id = this.guidGenerator()
        duplicateElm.setAttribute('bindly-id', bindly_id)
        duplicateElm.setAttribute('bindly-element-type', 'duplicate')
        this.duplicateElms[bindly_id] = duplicateElm

        if (this.params.groupId) duplicateElm.setAttribute('bindly-group-id', this.params.groupId)

        // track removal of the bound element
        this.trackElmDeletion( duplicateElm, 'duplicate', bindly_id )

        const manipulationParams = this.params.duplicateElement // .adjustments?
        if (manipulationParams) this.manipulateElm(duplicateElm, manipulationParams)

        // 'insert' is not a manipulation parameter, it is a global param. That way, you can place it directly after 'duplicate' = true so you know how it will be injected at an easy glance.
        typeof this.params.insert === 'string' ? this.params.insert.toLowerCase() == 'before' ? this.insertBefore(targetToClone, duplicateElm) : this.insertAfter(targetToClone, duplicateElm) : this.insertAfter(targetToClone, duplicateElm)

        // set Elements that are bound to each other
        const duplicateElmId = duplicateElm.getAttribute('bindly-id')
        const originalElmId = targetToClone.getAttribute('bindly-id')
        targetToClone.setAttribute('bindly-bound-to', duplicateElmId)
        duplicateElm.setAttribute('bindly-bound-to', originalElmId)
        
        // onAttributeChange =>
        if (this.params.onAttributeChange) {
            this.bindlyStyleDetails['duplicate'][bindly_id] = this.getCurrentStyles(duplicateElm)
            this.onAttributeChange(duplicateElm, 'duplicate', bindly_id)
        }

        // onCreated =>
        if (this.params.onCreated) {
            const createdInfo = {
                'originalElement': targetToClone,
                'duplicateElement': duplicateElm,
            }
            this.onCreated(createdInfo)
        }
    }

    manipulateElm(element, manipulationParams) {
        if (manipulationParams.id) this.setId(element, manipulationParams.id)
        if (manipulationParams.className) this.setClass(element, manipulationParams.className)
        if (manipulationParams.addClasses) this.addClasses(element, manipulationParams.addClasses)
        if (manipulationParams.setAttributes) (() => {
            for (let i=0; i < Object.keys(manipulationParams.setAttributes).length; i++) {
                var attrKey = Object.keys(manipulationParams.setAttributes)[i]
                var attrVal = Object.values(manipulationParams.setAttributes)[i]
                this.addAttribute(element, attrKey, attrVal)
            }
        })()
        if (manipulationParams.addEventListeners) (() => {
            for (let i=0; i < Object.keys(manipulationParams.addEventListeners).length; i++) {
                var listenerKey = Object.keys(manipulationParams.addEventListeners)[i]
                var listenerVal = Object.values(manipulationParams.addEventListeners)[i]
                this.addListener(element, listenerKey, listenerVal)
            }
        })()
        if (manipulationParams.innerHTML) this.setInnerHTML(element, manipulationParams.innerHTML)
        this.setDisplay(element, manipulationParams.display)
    }

    dupliacteElm(targetToClone) {
        const duplicateElm = targetToClone.cloneNode(true)
        return duplicateElm
    }

    setId(element, id) {
        element.id = id
    }

    setClass(element, className) {
        element.className = className
    }

    addClasses(element, classes) {
        element.classList.add(...classes)
    }

    addAttribute(element, attrName, attrValue) {
        element.setAttribute(attrName, attrValue)
    }

    addListener(element, listenFor, callback) {
        element.addEventListener(listenFor, callback)
    }

    setInnerHTML(element, innerHTML) {
        element.innerHTML = innerHTML
    }

    setDisplay(element, display) {
        if (display === false || display === 'none') element.style.display = 'none'
    }

    insertAfter(targetToClone, duplicateElm) {
        targetToClone.parentNode.insertBefore(duplicateElm, targetToClone.nextSibling)
    }

    insertBefore(targetToClone, duplicateElm) {
        targetToClone.parentNode.insertBefore(duplicateElm, targetToClone)
    }

    onCreated(createdInfo) {
        this.params.onCreated(createdInfo)
    }

    onDestroyed(removalEventDetails) {
        const uuid_removed = removalEventDetails.target.getAttribute('bindly-id')
        delete this.duplicateElms[uuid_removed]
        delete this.originalElms[uuid_removed]
        if (this.params.onDestroyed) this.params.onDestroyed(removalEventDetails)
    }

    collectElements(groupId) {

        // There are super rare cases where elements will be removed, but reinjected by the page.
        // This causes our onDestroy method to remove them from our global object, but they are still in the DOM.
        // When you run .destroy(), these rare edge case elements will not be removed from the DOM.
        // If the user passed a groupId, we can do a manual check for elements missing from our global object to make sure we cover this edge case.

        const originalElements = document.querySelectorAll(`[bindly-group-id="${ groupId }"][bindly-element-type="original"]`)
        for (var i=0; i < originalElements.length; i++) {
            var originalElement = originalElements[i]
            var originalElmId = originalElement.getAttribute('bindly-id')
            if (!Object.keys(this.originalElms).includes(originalElmId)) {
                this.originalElms[originalElmId] = originalElement
            }
        }
    
        const duplicateElements = document.querySelectorAll(`[bindly-group-id="${ groupId }"][bindly-element-type="duplicate"]`)
        for (var i=0; i < duplicateElements.length; i++) {
            var duplicateElement = duplicateElements[i]
            var duplicateElmId = duplicateElement.getAttribute('bindly-id')
            if (!Object.keys(this.duplicateElms).includes(duplicateElmId)) {
                this.duplicateElms[duplicateElmId] = duplicateElement
            }
        }

    }

    getElements() {
        const groupId = this.groupId

        var elements = {
            'originalElements': [],
            'duplicateElements': []
        }
    
        const originalElements = document.querySelectorAll(`[bindly-group-id="${ groupId }"][bindly-element-type="original"]`)
        for (var i=0; i < originalElements.length; i++) {
            var originalElement = originalElements[i]
            elements['originalElements'].push(originalElement)
        }
    
        const duplicateElements = document.querySelectorAll(`[bindly-group-id="${ groupId }"][bindly-element-type="duplicate"]`)
        for (var i=0; i < duplicateElements.length; i++) {
            var duplicateElement = duplicateElements[i]
            elements['duplicateElements'].push(duplicateElement)
        }
    
        return elements
    }

    destroy(onDestroyCallback) {
        if (this.enabled) {

            const groupId = this.params.groupId
            if (groupId) {
                // if there is a group id, we can run collectElements for more precise element revokation.
                this.collectElements(groupId)
            }

            // this callback allows the user to modify the originalElm back to its initial state and collect metadata or w/e they want from the duplicated elm.
            const duplicateElements = Object.assign({}, this.duplicateElms)
            const originalElements = Object.assign({}, this.originalElms)

            if (onDestroyCallback) onDestroyCallback({'originalElements': Object.values(originalElements), 'duplicateElements': Object.values(duplicateElements) })

            if (this.awaitPresenceObserver) this.awaitPresenceObserver.disconnect() // it's possible for the element to already be present and bindAll be set to false. This would cause the awaitPresenceObserver never to have been created.
            
            this.disconnectObservers(this.removalObservers, 'original')
            this.disconnectObservers(this.attributeObservers, 'original')
            this.removalObservers['original'] = {}
            this.attributeObservers['original'] = {}

            if (this.params.duplicate) {
                this.disconnectObservers(this.removalObservers, 'duplicate')
                this.disconnectObservers(this.attributeObservers, 'duplicate')
                this.removalObservers['duplicate'] = {}
                this.attributeObservers['duplicate'] = {}
            }

            const elementsToRemove = {
                'originalElms': this.originalElms,
                'duplicateElms': this.duplicateElms
            }
            this.destroyElements(elementsToRemove)
    
            this.awaitingElm = false
            this.enabled = false
            
        }
    }

    destroyElements(elements) {

        const originalElmsIds = Object.keys(elements.originalElms)
        for (var i=0; i < originalElmsIds.length; i++) {
            const originalElmBoundId = originalElmsIds[i]
            const originalElement = elements.originalElms[originalElmBoundId]
            if (originalElement) {
                originalElement.removeAttribute('bindly')
                originalElement.removeAttribute('bindly-element-type')
                originalElement.removeAttribute('bindly-id')
                originalElement.removeAttribute('bindly-bound-to')
                originalElement.removeAttribute('bindly-group-id')
            }
            delete elements.originalElms[originalElmBoundId]
        }

        const injectedElmIds = Object.keys(elements.duplicateElms)
        for (var i=0; i < injectedElmIds.length; i++) {
            const injectedElmId = injectedElmIds[i]
            const elementInjected = elements.duplicateElms[injectedElmId]
            if (elementInjected) {
                elementInjected.remove()
            }
            delete elements.duplicateElms[injectedElmId]
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


/*
    Below are auxiliary functions that technically do not have to do with Bindly directly, but can assist in certain cases for features that fall outside Bindly's default scope!
*/

// waitForElm offers a simple option to await the presence of an element.
// An ideal use case would be for when you need to collect data from an element before proceeding with other functions.
async function waitForElm(selector, jquery = false) {
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

// getHTML just provides a simple function to call to get HTML from a file that can be inserted in the "innerHTML" adjustment param.
async function getHTML(url) {
    var htmlText = await fetch(url).then(response => response.text()).then(data => { return data })
    return htmlText
}

// resetIfOriginalPresent is a function that can be inserted in the 'onDestroyed' callback that will reset / reinject the duplicate element if the duplicate is removed, but the original is still there.
function resetIfOriginalPresent(e, originalDisplay = 'block') {
    if (e.elementType == 'duplicate') { // && removalEventDetails.destructionMethod == "direct match"
        const elmRemoved = e.target
        const boundTo = elmRemoved.getAttribute('bindly-bound-to')
        const boundElm = document.querySelector(`[bindly-id="${ boundTo }"]`)
        if (boundElm) {
            boundElm.removeAttribute('bindly')
            boundElm.style.display = originalDisplay
        }
    }
}

// resetOriginals can be passed in the .destroy() callback to reset the original elements to their initial state. (only for display)
function resetOriginals(e, originalDisplay = 'block') {
    const targets = Object.values(e.originalElements)

    for (var i=0; i < targets.length; i++) {
        var target = targets[i]
        target.style.display = originalDisplay
    }
}