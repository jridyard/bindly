<h1 align="center">
  <img alt="cgapp logo" src="https://i.ibb.co/drmDMXt/bindlyJS.png" width="65px"/><br/>
  Bindly.JS
</h1>
<p align="center">Simplify the process of injecting elements for your browser extensions projects.</br>Manipulate & track DOM elements by passing straightforward arguments via JSON.</p>

## ⚡️ Quick start

Download `bindly.js` from this repo and add it to your project as a content script.

## ⭐️ Usage

```javascript
// The selector of the element you'd like to duplicate or manipulate.
const mySelector = '.selectorClass'

const myNewElement = bindElement({
    'el': mySelector, // pass a selector
    'bindAll': true, // if bindAll is true, it will bind every element with the 'el' selector.
    'duplicate': true, // if duplicate is set, a newElement will be created to mirror the target 'el'
    'hideOriginal': false, // if duplicate is true, this will hide the original element if set to true.
    'insert': 'after', // if duplicate is true, this will insert the new element after or before the original in the DOM.
    'addClasses': ['classOne', 'classTwo'], // adds classes to the target (original if duplicate = false, newElement if duplicate = true)
    'setAttributes': { // sets attributes for the target on creation
        'attrName': 'attrValue'
    },
    'addEventListeners': { // sets event listeners for the target on creation
        'click': (e) => {
            console.log("Bindly element clicked!")
        }
    },
    'onCreated': (originalElement, newElement) => { // once the 'el' is created in the DOM, this callback will run.
        // you can adjust the new element bindly created (or original) like you would any DOM element.
        newElement.textContent = "Bindly duplicated element!"
    },
    'onDestroyed': (e) => { // when either target element is destroyed, this callback will run and give information on which element was destroyed and how.
        console.log("Element removed from DOM.", e)
    },
    'onAttributeChange': (e) => {
        // when any attribute is changed, you'll see that here.
        // If any attrs/classes/styles are changed that impact css style values, you will also see which styles were changed and from/to values.
        console.log("Attribute changed!", e)
    }
})
```

- 📺 30s demo video: https://vimeo.com/758316166

## ⚙️ Options

| Option                | Description                                                                | Type     | Default        | Required?  |
|-----------------------|----------------------------------------------------------------------------|----------|----------------|------------|
| `el`                  | Selector of the element you'd like to bind                                 | `string` | _None_         | Yes        |
| `bindAll`             | Applies to all elements or just the first to appear.                       | `bool`   | `true`         | No         |
| `jquery`              | Use jquery to target elements with advanced selectors                      | `bool`   | `false`        | No         |
| `duplicate`           | Duplicates the target element if set to true                               | `bool`   | `false`        | No         |
| `hideOriginal`        | Sets display of the original element to `none`                             | `bool`   | `false`        | No         |
| `insert`              | Insert the duplicated element `before` or `after` the original element     | `string` | `after`        | No         |
| `id`                  | Set the ID for the new element                                             | `string` | _None_         | No         |
| `className`           | Set the className for the new element                                      | `string` | _None_         | No         |
| `addClasses`          | Add additional classes to the new element                                  | `array`  | _None_         | No         |
| `setAttributes`       | Add data attributes to the new element                                     | `object` | _None_         | No         |
| `addEventListeners`   | Add event listeners to the new element. Pass the listener type for the keys & callbacks for the values                            | `object`   | _None_ | No         |
| `onCreated`           | When the target element is created, this callback will run and allow you to adjust the `originalElement` and `newElement`.        | `callback` | _None_ | No         |
| `onDestroyed`         | When either the target or new element is removed from the DOM, this callback will run and give you information on the removal.    | `callback` | _None_ | No         |
| `onAttributeChange`   | When an attribute changes, you'll be able to see that here. Also, when anything that impacts styles occur, you'll get information on those changes.       | `callback` | _None_ | No         |



## 📖 Additional Notes

- Bindly can be instantiated regardless of page state.
    - You don't need to worry about DOM content loading, bindly waits until the body element is present to start tracking elements.

- You can store JSON in AWS or google cloud and fetch the selector references for your bindly objects remotely.
    - Especially for larger projects, this makes it much easier to keep your extensions working after sites change their selectors since you don't need to re-deploy the extension and can simply update your JSON selector references document.
