;(function () {
  if (window.VG) {
    return
  }

  var listeners = {
    loadLevel: [],
    loadGhost: [],
    enterEditMode: [],
    requestSave: [],
    requestScreenshot: [],
  }
  var MAX_SCREENSHOT_WIDTH = 960
  var SCREENSHOT_QUALITY = 0.68
  var mode = "play"
  var lastEnterEditPayload = {}

  function exportCanvasImage(canvas) {
    var width = canvas.width || 0
    var height = canvas.height || 0

    if (!width || !height) {
      return null
    }

    var scale = Math.min(1, MAX_SCREENSHOT_WIDTH / width)
    var targetCanvas = canvas

    if (scale < 1) {
      targetCanvas = document.createElement("canvas")
      targetCanvas.width = Math.max(1, Math.round(width * scale))
      targetCanvas.height = Math.max(1, Math.round(height * scale))

      var targetContext = targetCanvas.getContext("2d")
      if (!targetContext) {
        return null
      }

      targetContext.imageSmoothingEnabled = true
      targetContext.imageSmoothingQuality = "high"
      targetContext.drawImage(canvas, 0, 0, width, height, 0, 0, targetCanvas.width, targetCanvas.height)
    }

    var webpDataUrl = targetCanvas.toDataURL("image/webp", SCREENSHOT_QUALITY)
    if (webpDataUrl.indexOf("data:image/webp") === 0) {
      return webpDataUrl
    }

    return targetCanvas.toDataURL("image/jpeg", SCREENSHOT_QUALITY)
  }

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

  async function captureScreenshot(payload) {
    var requestPayload = payload || {}
    var imageDataUrl = null

    for (var index = 0; index < listeners.requestScreenshot.length; index += 1) {
      var handler = listeners.requestScreenshot[index]

      try {
        var result = handler(requestPayload)
        if (result && typeof result.then === "function") {
          result = await result
        }

        if (typeof result === "string" && result.indexOf("data:image/") === 0) {
          imageDataUrl = result
          break
        }
      } catch (error) {
        console.error("VG.onRequestScreenshot handler failed", error)
      }
    }

    if (!imageDataUrl) {
      try {
        var canvas = document.querySelector("canvas")
        if (canvas && typeof canvas.toDataURL === "function") {
          imageDataUrl = exportCanvasImage(canvas)
        }
      } catch (error) {
        console.error("VG default screenshot capture failed", error)
      }
    }

    if (imageDataUrl) {
      post("VG_SCREENSHOT_CAPTURED", {
        captureId: requestPayload.captureId || null,
        imageDataUrl: imageDataUrl,
      })
      return
    }

    post("VG_SCREENSHOT_CAPTURED", {
      captureId: requestPayload.captureId || null,
      error: "Unable to capture screenshot. Render to a canvas or register VG.onRequestScreenshot().",
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

    if (message.type === "VG_LOAD_GHOST") {
      post("VG_GHOST_LOAD_RECEIVED", {
        handlerCount: listeners.loadGhost.length,
        hasReplayData: Boolean((message.payload || {}).ghost && (message.payload || {}).ghost.replayData),
      })
      listeners.loadGhost.forEach(function (fn) {
        try {
          fn(message.payload || {})
        } catch (error) {
          console.error("VG.onLoadGhost handler failed", error)
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
      return
    }

    if (message.type === "VG_REQUEST_SCREENSHOT") {
      captureScreenshot(message.payload || {})
    }
  }

  window.addEventListener("message", onMessage)

  var api = {
    notifyReady: function notifyReady() {
      post("VG_READY")
    },
    notifyGhostReady: function notifyGhostReady() {
      post("VG_GHOST_READY")
    },
    saveLevel: function saveLevel(payload) {
      post("VG_SAVE_LEVEL", payload || {})
    },
    saveGhostRun: function saveGhostRun(payload) {
      post("VG_SAVE_GHOST_RUN", payload || {})
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
    onLoadGhost: function onLoadGhost(handler) {
      if (typeof handler === "function") {
        listeners.loadGhost.push(handler)
        post("VG_GHOST_HOOK_BOUND", {
          hook: "onLoadGhost",
          count: listeners.loadGhost.length,
        })
      }
      return function unsubscribe() {
        listeners.loadGhost = listeners.loadGhost.filter(function (fn) {
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
    onRequestScreenshot: function onRequestScreenshot(handler) {
      if (typeof handler === "function") {
        listeners.requestScreenshot.push(handler)
      }
      return function unsubscribe() {
        listeners.requestScreenshot = listeners.requestScreenshot.filter(function (fn) {
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
