IDEA: click to put inside window.smth

PlainValue => show as is
CollectionValue with units => open submenu
CollectionValue without units => click and show <pre/>

- @ App
- :version 1
- libs
- utils
- idb
- theme
- projects

- @ Projects
- :version 2
- list (contains units)
- selectedProjectId: value

When list clicked:
title: list

- Project 1 (.label is rendered + id, or just id if label is missing)
- Project 2
- Project 3

- @ Project
- mode
- spec -> <pre/> (+ preview object with truncate)
- enabled
- dir -> null or click + <pre> and preview with truncate
- fs (click)
- state.error (click if object)
- state.updating
- inert.rootDirHandle (show type only) + IDEA: click to put inside window.smth
- inert.rootDirObserver (show type only)
- inert.updateTimer value

actions:

- toggle enabled
- toggle mode
- set mode @action(String) => [input] + [confirm]
- remove
- connect dir
- start observer
- stop observer
