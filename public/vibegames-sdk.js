;(function () {
  if (window.VG) {
    return
  }

  var listeners = {
    loadLevel: [],
    enterEditMode: [],
    requestSave: [],
  }
  var mode = "play"
  var lastEnterEditPayload = {}

  function emitSdkReady() {
    try {
      window.dispatchEvent(new CustomEvent("VG_SDK_READY", { detail: { mode: mode } }))
    } catch {}
  }

  function emitModeChange() {
    try {
      window.dispatchEvent(new CustomEvent("VG_MODE_CHANGE", { detail: { mode: mode } }))
    } catch {}
  }

  function setMode(nextMode) {
    var resolvedMode = nextMode === "editor" ? "editor" : "play"
    if (resolvedMode === mode) {
      return
    }

    mode = resolvedMode
    emitModeChange()
  }

  function emitEnterEditMode(payload) {
    lastEnterEditPayload = payload || {}
    listeners.enterEditMode.forEach(function (fn) {
      try {
        fn(lastEnterEditPayload)
      } catch (error) {
        console.error("VG.onEnterEditMode handler failed", error)
      }
    })
  }

  function post(type, payload) {
    if (!window.parent || window.parent === window) {
      return
    }

    window.parent.postMessage(
      {
        source: "vibegames-sdk",
        type: type,
        payload: payload || {},
      },
      "*"
    )
  }

  function onMessage(event) {
    var message = event.data
    if (!message || message.source !== "vibegames-platform") {
      return
    }

    if (message.type === "VG_INIT") {
      var initPayload = message.payload || {}
      if (initPayload.mode === "editor" || initPayload.mode === "play") {
        var previousMode = mode
        setMode(initPayload.mode)
        if (mode === "editor" && previousMode !== "editor") {
          emitEnterEditMode(initPayload)
        }
      }
      return
    }

    if (message.type === "VG_LOAD_LEVEL") {
      listeners.loadLevel.forEach(function (fn) {
        try {
          fn(message.payload || {})
        } catch (error) {
          console.error("VG.onLoadLevel handler failed", error)
        }
      })
      return
    }

    if (message.type === "VG_ENTER_EDIT_MODE") {
      setMode("editor")
      emitEnterEditMode(message.payload || {})
      return
    }

    if (message.type === "VG_REQUEST_SAVE") {
      listeners.requestSave.forEach(function (fn) {
        try {
          fn(message.payload || {})
        } catch (error) {
          console.error("VG.onRequestSave handler failed", error)
        }
      })
    }
  }

  window.addEventListener("message", onMessage)

  var api = {
    notifyReady: function notifyReady() {
      post("VG_READY")
    },
    saveLevel: function saveLevel(payload) {
      post("VG_SAVE_LEVEL", payload || {})
    },
    onLoadLevel: function onLoadLevel(handler) {
      if (typeof handler === "function") {
        listeners.loadLevel.push(handler)
      }
      return function unsubscribe() {
        listeners.loadLevel = listeners.loadLevel.filter(function (fn) {
          return fn !== handler
        })
      }
    },
    onEnterEditMode: function onEnterEditMode(handler) {
      if (typeof handler === "function") {
        listeners.enterEditMode.push(handler)
        if (mode === "editor") {
          try {
            handler(lastEnterEditPayload)
          } catch (error) {
            console.error("VG.onEnterEditMode handler failed", error)
          }
        }
      }
      return function unsubscribe() {
        listeners.enterEditMode = listeners.enterEditMode.filter(function (fn) {
          return fn !== handler
        })
      }
    },
    onRequestSave: function onRequestSave(handler) {
      if (typeof handler === "function") {
        listeners.requestSave.push(handler)
      }
      return function unsubscribe() {
        listeners.requestSave = listeners.requestSave.filter(function (fn) {
          return fn !== handler
        })
      }
    },
  }

  Object.defineProperty(api, "mode", {
    enumerable: true,
    configurable: false,
    get: function getMode() {
      return mode
    },
  })

  window.VG = api
  emitSdkReady()
})()
