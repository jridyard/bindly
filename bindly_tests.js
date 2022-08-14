window.addEventListener('DOMContentLoaded', () => {
    bindlyTest()
})

function bindlyTest() {
    // Bindly operates in any page state.
    // You can use bindly before DOMContentLoaded, but if you prefer to use it afterwards then both will work.

    const gmailSendButton = Bindly({
        'runBeforeComplete': true,
        'el': '[data-tooltip^="Send"]', // pass a selector
        'parentToBind': '.dC', // if you need to duplicate the parent instead of the target selector itself, pass a second selector to bind the parent. (note: "newElm" will be the parent. The 'el' selector just helps Bindly get the right parent to duplicate, but the parent is the element Bindly is now using.)
        'bindAll': true, // if bindAll is true, it will bind every element with the 'el' selector params. If you only want to bind 1, pass 'false' for bindAll.
        'hideOriginal': true, // this will hide the original element if set to true, if you want to keep the original element, pass false
        'insert': 'after', // insert the element after or before the element we're binding to.
        'addClasses': ['bindlyIsCool', 'bindlyButton'], // this will add classes to the element duplicated, but if you prefer to start fresh, remove 'addClasses' and pass the param 'className': 'desiredClass here' instead.
        'addAttributes': {
            'data-bindly-attribute': 'bindly-attribute-value'
        },
        'addListeners': { // add listeners to make your custom elm do things!
            'click': (e) => {
                console.log('clicked!')
            },
            'mouseover': (e) => {
                console.log('hovered in!')
            },
            'mouseout': (e) => {
                console.log('hovered out!')
            }
        },
        'adjustElm': (newElm) => { // adjust the element(s) after the element(s) become present.
            newElm.querySelector('[data-tooltip^="Send"]').textContent = 'Bindly!'
        }
    });

    const zillowDrawButton = Bindly({
        'el': '[data-alttitle="draw region"]', // pass a selector
        // 'parentToBind': '', // if you need to duplicate the parent instead of the target selector itself, pass a second selector to bind the parent. (note: "newElm" will be the parent. The 'el' selector just helps Bindly get the right parent to duplicate, but the parent is the element Bindly is now using.)
        'bindAll': true, // if bindAll is true, it will bind every element with the 'el' selector params. If you only want to bind 1, pass 'false' for bindAll.
        'hideOriginal': false, // this will hide the original element if set to true, if you want to keep the original element, pass false
        'insert': 'after', // insert the element after or before the element we're binding to.
        'addClasses': ['bindlyIsCool', 'bindlyButton'], // this will add classes to the element duplicated, but if you prefer to start fresh, remove 'addClasses' and pass the param 'className': 'desiredClass here' instead.
        'addAttributes': {
            'data-bindly-attribute': 'bindly-attribute-value'
        },
        'addListeners': { // add listeners to make your custom elm do things!
            'click': (e) => {
                console.log('clicked!')
            },
            'mouseover': (e) => {
                console.log('hovered in!')
            },
            'mouseout': (e) => {
                console.log('hovered out!')
            }
        },
        'adjustElm': (newElm) => { // adjust the element(s) after the element(s) become present.
            newElm.textContent = 'Bindly!'
        }
    });

    const zillowRequestTourButton = Bindly({
        'mode': 'jquery',
        'el': '[data-cft-name="contact-button-tour"] div:contains("Request")', // pass a selector
        'parentToBind': '.contact-button', // if you need to duplicate the parent instead of the target selector itself, pass a second selector to bind the parent. (note: "newElm" will be the parent. The 'el' selector just helps Bindly get the right parent to duplicate, but the parent is the element Bindly is now using.)
        'bindAll': true, // if bindAll is true, it will bind every element with the 'el' selector params. If you only want to bind 1, pass 'false' for bindAll.
        'hideOriginal': false, // this will hide the original element if set to true, if you want to keep the original element, pass false
        'insert': 'after', // insert the element after or before the element we're binding to.
        'addClasses': ['bindlyIsCool', 'bindlyButton'], // this will add classes to the element duplicated, but if you prefer to start fresh, remove 'addClasses' and pass the param 'className': 'desiredClass here' instead.
        'addAttributes': {
            'data-bindly-attribute': 'bindly-attribute-value'
        },
        'addListeners': { // add listeners to make your custom elm do things!
            'click': (e) => {
                console.log('clicked!')
            },
            'mouseover': (e) => {
                console.log('hovered in!')
            },
            'mouseout': (e) => {
                console.log('hovered out!')
            }
        },
        'adjustElm': (newElm) => { // adjust the element(s) after the element(s) become present.
            newElm.querySelector('[data-cft-name="contact-button-tour"]').innerHTML = `
                <div>
                    Bindly!
                    <p class="Text-c11n-8-65-2__sc-aiai24-0 StyledParagraph-c11n-8-65-2__sc-18ze78a-0 glNMBd">
                        this is a bindly example!
                    </p>
                </div>
            `
        }
    });

    // This one is a great example of the risks of running before document.readyState == 'complete'
    const zillowHouseFact = Bindly({
        'runBeforeComplete': false, // if there's no chance of the elm breaking while other elements load in, runBeforeComplete creates a slightly higher UX. However, in some rare  cases, you will want to make sure it all loads in first. (to prevent issues, the default is to await document readyState 'complete' status to handle the edge case potential)
        'mode': 'jquery',
        'el': 'span:contains("None")', // pass a selector
        'parentToBind': '.dpf__sc-2arhs5-0.ecJCxh', // if you need to duplicate the parent instead of the target selector itself, pass a second selector to bind the parent. (note: "newElm" will be the parent. The 'el' selector just helps Bindly get the right parent to duplicate, but the parent is the element Bindly is now using.)
        // 'parentToBind': '', // if you need to duplicate the parent instead of the target selector itself, pass a second selector to bind the parent. (note: "newElm" will be the parent. The 'el' selector just helps Bindly get the right parent to duplicate, but the parent is the element Bindly is now using.)
        'bindAll': false, // if bindAll is true, it will bind every element with the 'el' selector params. If you only want to bind 1, pass 'false' for bindAll.
        'hideOriginal': false, // this will hide the original element if set to true, if you want to keep the original element, pass false
        'insert': 'after', // insert the element after or before the element we're binding to.
        'addClasses': ['bindlyIsCool', 'bindlyButton'], // this will add classes to the element duplicated, but if you prefer to start fresh, remove 'addClasses' and pass the param 'className': 'desiredClass here' instead.
        'addAttributes': {
            'data-bindly-attribute': 'bindly-attribute-value'
        },
        'addListeners': { // add listeners to make your custom elm do things!
            'click': (e) => {
                console.log('clicked!')
            },
            'mouseover': (e) => {
                console.log('hovered in!')
            },
            'mouseout': (e) => {
                console.log('hovered out!')
            }
        },
        'adjustElm': (newElm) => { // adjust the element(s) after the element(s) become present.
            newElm.querySelector('.Text-c11n-8-65-2__sc-aiai24-0').textContent = 'Bindly Is Cool Though!'
        }
    });

    const zillowTakeATourButton = Bindly({
        'el': '.contact-button-group', // pass a selector
        'parentToBind': 'li', // if you need to duplicate the parent instead of the target selector itself, pass a second selector to bind the parent. (note: "newElm" will be the parent. The 'el' selector just helps Bindly get the right parent to duplicate, but the parent is the element Bindly is now using.)
        'bindAll': true, // if bindAll is true, it will bind every element with the 'el' selector params. If you only want to bind 1, pass 'false' for bindAll.
        'hideOriginal': false, // this will hide the original element if set to true, if you want to keep the original element, pass false
        'insert': 'after', // insert the element after or before the element we're binding to.
        'addClasses': ['bindlyIsCool', 'bindlyButton'], // this will add classes to the element duplicated, but if you prefer to start fresh, remove 'addClasses' and pass the param 'className': 'desiredClass here' instead.
        'addAttributes': {
            'data-bindly-attribute': 'bindly-attribute-value'
        },
        'addListeners': { // add listeners to make your custom elm do things!
            'click': (e) => {
                console.log('clicked!')
            },
            'mouseover': (e) => {
                console.log('hovered in!')
            },
            'mouseout': (e) => {
                console.log('hovered out!')
            }
        },
        'adjustElm': (newElm) => { // adjust the element(s) after the element(s) become present.
            newElm.querySelector('button').textContent = 'Bindly Tour?'
        }
    });

    const zillowPhotosTab = Bindly({
        'el': '[aria-controls="gallery_panel"]', // pass a selector
        // 'parentToBind': 'li', // if you need to duplicate the parent instead of the target selector itself, pass a second selector to bind the parent. (note: "newElm" will be the parent. The 'el' selector just helps Bindly get the right parent to duplicate, but the parent is the element Bindly is now using.)
        'bindAll': true, // if bindAll is true, it will bind every element with the 'el' selector params. If you only want to bind 1, pass 'false' for bindAll.
        'hideOriginal': false, // this will hide the original element if set to true, if you want to keep the original element, pass false
        'insert': 'after', // insert the element after or before the element we're binding to.
        'addClasses': ['bindlyIsCool', 'bindlyButton'], // this will add classes to the element duplicated, but if you prefer to start fresh, remove 'addClasses' and pass the param 'className': 'desiredClass here' instead.
        'addAttributes': {
            'data-bindly-attribute': 'bindly-attribute-value'
        },
        'addListeners': { // add listeners to make your custom elm do things!
            'click': (e) => {
                console.log('clicked!')
            },
            'mouseover': (e) => {
                console.log('hovered in!')
            },
            'mouseout': (e) => {
                console.log('hovered out!')
            }
        },
        'adjustElm': (newElm) => { // adjust the element(s) after the element(s) become present.
            newElm.textContent = 'Bindly!'
            newElm.setAttribute('aria-selected', 'false')
        }
    });

    const zillowListingViewTabs = Bindly({
        'mode': 'jquery',
        'el': '.sc-bkkeKt.hMZfUH:contains("Facts and features")', // pass a selector
        'parentToBind': '.sc-iwjdpV.eESupB', // if you need to duplicate the parent instead of the target selector itself, pass a second selector to bind the parent. (note: "newElm" will be the parent. The 'el' selector just helps Bindly get the right parent to duplicate, but the parent is the element Bindly is now using.)
        'bindAll': true, // if bindAll is true, it will bind every element with the 'el' selector params. If you only want to bind 1, pass 'false' for bindAll.
        'hideOriginal': false, // this will hide the original element if set to true, if you want to keep the original element, pass false
        'insert': 'after', // insert the element after or before the element we're binding to.
        'addClasses': ['bindlyIsCool', 'bindlyButton'], // this will add classes to the element duplicated, but if you prefer to start fresh, remove 'addClasses' and pass the param 'className': 'desiredClass here' instead.
        'addAttributes': {
            'data-bindly-attribute': 'bindly-attribute-value'
        },
        'addListeners': { // add listeners to make your custom elm do things!
            'click': (e) => {
                console.log('clicked!')
            },
            'mouseover': (e) => {
                console.log('hovered in!')
            },
            'mouseout': (e) => {
                console.log('hovered out!')
            }
        },
        'adjustElm': (newElm) => { // adjust the element(s) after the element(s) become present.
            newElm.querySelector('a').textContent = 'Bindly Tab!'
            newElm.querySelector('a').removeAttribute('href')
            // newElm.setAttribute('aria-selected', 'false')
        }
    });
}