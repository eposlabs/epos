# Env API

The **Environment API** provides information about the current Epos runtime context.  
It helps you detect where your code is running — in a web page, popup, side panel, or background — and identify the active tab.

## `epos.env.tabId`

The numeric ID of the current browser tab. Useful when sending messages or managing tab-specific data.

## `epos.env.isWeb`

`true` if the code runs inside a web page (including iframes injected by Epos).

## `epos.env.isPopup`

`true` if running inside the extension popup.

## `epos.env.isSidePanel`

`true` if running inside the side panel context.

## `epos.env.isBackground`

`true` if running in the background context (service worker or background frame).
