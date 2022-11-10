<h1 align="center">
  <img alt="cgapp logo" src="https://i.ibb.co/drmDMXt/bindlyJS.png" width="65px"/><br/>
  Bindly.JS
</h1>
<p align="center">
  Simplify the process of managing elements for your browser extensions projects.
    </br>
  Duplicate / manipulate elements and track DOM changes through straightforward arguments.
 </p>

## ⚡️ Installation

Download `bindly.js` from this repo and add it to your project as a content script.

## ⭐️ Usage

### Basic Usage
```javascript

const myNewElement = Bindly({
    'target': '[selector]',
    'awaitDOM': true, // waits to start binding elements until DOM is ready.
    'bindAll': true, // bind only to the first element to appear or all occurences
    'duplicate': true, // set to false to track only the target itself.
    'insert': 'after', // insert the duplicate element before or after the target
    'onCreated': (e) => {
        console.log("Newly Created Elements!", e)
        
        const originalElm = e.originalElement
        const duplicateElm = e.duplicateElement
        
        duplicateElm.textContent = 'Bindly Element!'
    },
    'onDestroyed': (e) => {
        console.log("Element Destroyed", e)
    },
    'onAttributeChange': (e) => {
        console.log('Attribute Changed!', e)
    }
});

myNewElement.bind() // starts binding the element

```

Bindly offers a robust feature set, although all you really need is basic instantiation.

You can adjust the newly created `original` and `duplicate` elements by using data from the event in the `onCreated` callback. This callback runs synchronously with the element's creation and all adjustments can be performed before the element becomes visible to the user.

There are additional options available for setting default adjustments. See the section entitled `Default Element Adjustments`.

### Remove & Reset Binds

```javascript
myNewElement.destroy((e) => {
    console.log("Bindly instance destroyed", e)
})
```
You'll receive information on the `original` and `duplicate` elements in the event info.

You can collect metadata from duplicateElements and/or adjust the original elements back to their pre-bindly state. This feature is most useful for extensions that have on/off modes where you need to remove your injections and revert the page back to normal.

### Get Bound Elements

```javascript
myNewElement.getElements()
```

If you need to see what elements your instance of bindly has bound, you can simple call `.getElements()` to receive arrays of the originals and duplicates.

### Default Element Adjustments

```javascript
const myNewElement = Bindly({
    'target': '[selector]',
    'originalElement': {
        'display': false, // hides the original, only shows duplicate on creation
    },
    'duplicateElement': {
        'display': true,
        'addEventListeners': {
            'click': (e) => {
                console.log("Duplicate Element Clicked!", e)
            }
        },
        'setAttributes': {
            'attrName': 'attrValue'
        },
        'addClasses': ['class', 'anotherClass'],
        'innerHTML': '<h1>Bindly Element!</h1>'
    }
});

myNewElement.bind() // starts binding the element
```

You can set defaults for newly created `original` and `duplicate` elements that will be applied before the element becomes visible to the user.

For more information on all the default options available, view the table entitled `Default Element Options`.


## ⚙️ Options

## Basic Options

| Option                | Description                                                                | Type     | Default        | Required?  |
|-----------------------|----------------------------------------------------------------------------|----------|----------------|------------|
| `target`              | Selector of the element you'd like to bind                                 | `string` | _None_         | Yes        |
| `awaitDOM`            | Bindly manages page state readiness for you, or you can do it on your own by turning this off  | `bool`   | `true`        | No         |
| `duplicate`           | Duplicates the target element                                             | `bool`   | `true`         | No         |
| `insert`              | Insert the duplicated element `before` or `after` the original element     | `string` | `after`        | No         |
| `bindAll`             | Applies bindly rules to all elements or just the first to appear          | `bool`   | `true`         | No         |
| `jquery`              | Use jquery to target elements with advanced selectors                      | `bool`   | `false`        | No         |
| `groupId`             | Set the `bindly-group-id` to a custom string for each element bound by the instance.  | `string`       | _12-charater uuid_        | No         |
| `duplicateElement`    | Pass arguments to set defaults for the duplicate element. See `Default Element Options` table for more details | `object`   | _None_        | No         |
| `originalElement`    | Pass arguments to set defaults for the original element. See `Default Element Options` table for more details | `object`   | _None_        | No         |
| `onCreated`           | When the target element is created, this callback will run and allow you to adjust the `originalElement` and `newElement`        | `callback` | _None_ | No         |
| `onDestroyed`         | When either the target or new element is removed from the DOM, this callback will run and give you information on the removal    | `callback` | _None_ | No         |
| `onAttributeChange`   | When an attribute changes, you'll be able to see that here. Also, when anything that impacts styles occur, you'll get information on those changes       | `callback` | _None_ | No         |

### Default Element Options
| Option                | Description                                                                | Type     | Default        | Required?  |
|-----------------------|----------------------------------------------------------------------------|----------|----------------|------------|
| `display`             | Sets display of the element                                                | `bool`   | _None_         | No         |
| `id`                  | Set the ID for the new element                                             | `string` | _None_         | No         |
| `className`           | Set the className for the new element                                      | `string` | _None_         | No         |
| `innerHTML`           | Sets the innerHTML property of the element                                 | `string` | _None_         | No         |
| `addClasses`          | Add additional classes to the new element                                  | `array`  | _None_         | No         |
| `setAttributes`       | Add data attributes to the new element                                     | `object` | _None_         | No         |
| `addEventListeners`   | Add event listeners to the new element. Pass the listener type for the keys & callbacks for the values                            | `object`   | _None_ | No         |

## 📖 Additional Notes

- You can store JSON in AWS or google cloud and fetch the selector references for your bindly objects remotely.
    - Especially for larger projects, this makes it much easier to keep your extensions working after sites change their selectors since you don't need to re-deploy the extension and can simply update your JSON selector references document.
