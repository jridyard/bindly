<h1 align="center">
  <img alt="cgapp logo" src="https://i.ibb.co/drmDMXt/bindlyJS.png" width="65px"/><br/>
  Bindly.JS
</h1>
<p align="center">Simplify the process of injecting elements for your browser extensions projects.</br>Duplicate / bind or manipulate DOM elements by passing straightforward arguments via JSON.</p>

## ⚡️ Quick start

Pull `bindly.js` from this repo and add it to your project as a content script.

## ⭐️ Usage

```javascript
// The selector of the element you'd like to duplicate or manipulate.
const mySelector = '.selectorClass'

// Name your element bind something you can easily identify
const myNewElement = Bindly({
    'el': mySelector, // pass a selector
    'bindAll': true, // if bindAll is true, it will bind every element with the 'el' selector.
    'hideOriginal': false, // this will hide the original element if set to true.
    'insert': 'after', // insert the element after or before the element we're binding to.
    'addClasses': ['class1', 'class2'],
    'addAttributes': {
        'attrName': 'attrValue'
    },
    'addListeners': {
        'click': (e) => {
            console.log("Bindly element clicked!")
        }
    },
    'adjustElm': (newElm) => { // adjust the element(s) after the element(s) become present.
        newElm.textContent = 'Bindly!'
    }
})
```

- 📺 30s demo video: https://vimeo.com/758316166

## ⚙️ Options

| Option           | Description                                                                | Type     | Default        | Required?  |
|------------------|----------------------------------------------------------------------------|----------|----------------|------------|
| `el`             | Selector of the element you'd like to bind                                 | `string` | _None_         | Yes        |
| `mode`           | Enable `jquery` mode to target elements with advanced selectors            | `string` | `regular`      | No         |
| `duplicate`      | Duplicate the target el or manipulate the original                         | `bool`   | `true`         | No         |
| `bindAll`        | Bind all elements matching the el selector or only the first to appear     | `bool`   | `true`         | No         |
| `hideOriginal`   | Sets display of the original el to none                                    | `bool`   | `false`        | No         |
| `insert`         | Insert the duplicated element `before` or `after` the original el          | `string` | `after`        | No         |
| `id`             | Overwrite the original el's ID for the new element                         | `string` | _None_         | No         |
| `className`      | Overwrite the original el's classes for the new element                    | `string` | _None_         | No         |
| `addClasses`     | Add additional classes to the new element                                  | `string` | _None_         | No         |
| `addAttributes`  | Add data attributes to the new element                                     | `string` | _None_         | No         |
| `addListeners`   | Add event listeners to the new element. Pass the listener type for the keys & callbacks for the values | `object`   | _None_ | No          |
| `adjustElm`      | Manipulate the newly created element, pass `newElm` as a parameter to your callback to reference it    | `callback` | _None_ | Yes         |

## 📖 Additional Notes

- Bindly can be instantiated regardless of page state.
    - You don't need to worry about DOM content loading, bindly waits until the body element is present to start tracking elements.

- You can store JSON in AWS or google cloud and fetch the selector references for your bindly objects remotely.
    - Especially for larger projects, this makes it much easier to keep your extensions working after sites change their selectors since you don't need to re-deploy the extension and can simply update your JSON selector references document.