// @flow

import type {
  Action,
  Image,
  MainLayoutState,
  Mode,
  ToolEnum,
} from "../MainLayout/types"
import React, { useEffect, useMemo, useReducer, useState } from "react"
import makeImmutable, { without, setIn, getIn } from "seamless-immutable"

import type { KeypointsDefinition } from "../ImageCanvas/region-tools"
import MainLayout from "../MainLayout"
import type { Node } from "react"
import SettingsProvider from "../SettingsProvider"
import combineReducers from "./reducers/combine-reducers.js"
import generalReducer from "./reducers/general-reducer.js"
import getFromLocalStorage from "../utils/get-from-local-storage"
import historyHandler from "./reducers/history-handler.js"
import imageReducer from "./reducers/image-reducer.js"
import useEventCallback from "use-event-callback"
import videoReducer from "./reducers/video-reducer.js"
import { HotKeys } from "react-hotkeys"
import { defaultKeyMap } from "../ShortcutsManager"
import getActiveImage from "../Annotator/reducers/get-active-image"
import DeviceList from "../RegionLabel/DeviceList.js"
import { AIE_CATEGORIES } from "./constants.js"

const getRandomId = () => Math.random().toString().split(".")[1]

// Add these constants at the top of the file
const STORAGE_KEY = "annotator_autosave_state"
const AUTOSAVE_INTERVAL = 30000 // 30 seconds

// Add this recovery modal component
const RecoveryModal = ({ onRecover, onDiscard }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: 24,
          borderRadius: 8,
          maxWidth: 400,
        }}
      >
        <h2>Recover Unsaved Work?</h2>
        <p>We found some unsaved annotation work. Would you like to recover it?</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onDiscard}>Discard</button>
          <button onClick={onRecover} style={{ fontWeight: "bold" }}>
            Recover
          </button>
        </div>
      </div>
    </div>
  )
}

type Props = {
  taskDescription?: string,
  allowedArea?: { x: number, y: number, w: number, h: number },
  regionTagList?: Array<string>,
  regionClsList?: Array<string>,
  imageTagList?: Array<string>,
  imageClsList?: Array<string>,
  enabledTools?: Array<string>,
  selectedTool?: String,
  showTags?: boolean,
  selectedImage?: string | number,
  images?: Array<Image>,
  showPointDistances?: boolean,
  pointDistancePrecision?: number,
  RegionEditLabel?: Node,
  onExit: (MainLayoutState) => any,
  onSave: (MainLayoutState) => any,
  videoTime?: number,
  videoSrc?: string,
  keyframes?: Object,
  videoName?: string,
  keypointDefinitions: KeypointsDefinition,
  fullImageSegmentationMode?: boolean,
  autoSegmentationOptions?:
    | {| type: "simple" |}
    | {| type: "autoseg", maxClusters?: number, slicWeightFactor?: number |},
  hideHeader?: boolean,
  hideHeaderText?: boolean,
  hideNext?: boolean,
  hidePrev?: boolean,
  hideClone?: boolean,
  hideSettings?: boolean,
  hideFullScreen?: boolean,
  hideSave?: boolean,
}

// Helper to prepare state for storage
const prepareStateForStorage = (state) => {
  // Create a clean copy of essential state
  return {
    selectedImage: state.selectedImage,
    images: state.images.map(img => ({
      ...img,
      // Keep only essential image data and regions
      regions: img.regions || [],
      src: img.src,
      name: img.name,
      frameTime: img.frameTime
    })),
    breakouts: state.breakouts || [],
    categories: state.categories || [],
    deviceList: state.deviceList || [],
    categoriesColorMap: state.categoriesColorMap || {},
    selectedTool: state.selectedTool,
    showTags: state.showTags,
    // Add other essential state properties you need to preserve
  }
}

export const Annotator = ({
  images,
  allowedArea,
  selectedImage = images && images.length > 0 ? 0 : undefined,
  showPointDistances,
  pointDistancePrecision,
  showTags = getFromLocalStorage("showTags", true),
  enabledTools = [
    "select",
    "create-point",
    "create-box",
    "create-polygon",
    "create-line",
    "create-expanding-line",
    "show-mask",
    "create-scale",
    "multi-delete-select",
  ],
  selectedTool = "select",
  regionTagList = [],
  regionClsList = [],
  deviceList = [],
  categories = [],
  categoriesColorMap = {},
  imageTagList = [],
  imageClsList = [],
  keyframes = {},
  taskDescription = "",
  fullImageSegmentationMode = false,
  RegionEditLabel,
  videoSrc,
  videoTime = 0,
  videoName,
  onExit,
  onSave,
  onNextImage,
  onPrevImage,
  keypointDefinitions,
  autoSegmentationOptions = { type: "autoseg" },
  hideHeader,
  hideHeaderText,
  hideNext,
  hidePrev,
  hideClone,
  hideSettings,
  hideFullScreen,
  hideSave,
  allowComments,
  subType,
}: Props) => {
  if (typeof selectedImage === "string") {
    selectedImage = (images || []).findIndex((img) => img.src === selectedImage)
    if (selectedImage === -1) selectedImage = undefined
  }
  const annotationType = images ? "image" : "video"

  const uniqueBreakouts = new Set()
  if (images) {
    images.forEach((image) => {
      if (image.regions) {
        image.regions.forEach((region) => {
          if (region.breakout && region.breakout.is_breakout) {
            uniqueBreakouts.add(region.breakout)
          }
        })
      }
    })
  }

  

  // Converting Set back to an array before returning
  const breakouts = Array.from(uniqueBreakouts)

  const filters = {
    categories: [...new Set(DeviceList.map((item) => item.category))],
    breakoutNames: new Set(),
  }

  // Add state for recovery modal
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  const [savedState, setSavedState] = useState(null)

  const [state, dispatchToReducer] = useReducer(
    historyHandler(
      combineReducers(
        annotationType === "image" ? imageReducer : videoReducer,
        generalReducer
      )
    ),
    makeImmutable({
      annotationType,
      showTags,
      allowedArea,
      showPointDistances,
      pointDistancePrecision,
      selectedTool,
      fullImageSegmentationMode: fullImageSegmentationMode,
      autoSegmentationOptions,
      mode: null,
      taskDescription,
      showMask: true,
      labelImages: imageClsList.length > 0 || imageTagList.length > 0,
      regionClsList,
      regionTagList,
      imageClsList,
      imageTagList,
      currentVideoTime: videoTime,
      enabledTools,
      history: [],
      videoName,
      keypointDefinitions,
      allowComments,
      loadingTemplateMatching: false,
      toggleList: [],
      selectedBreakoutIdAutoAdd: null,
      breakouts: breakouts,
      deviceList,
      newDevicesToSave: [],
      newCategoriesToSave: [],
      categoriesColorMap,
      counts: [],
      filters: filters,
      excludedCategories: [],
      selectedBreakoutToggle: null,
      selectedDeviceToggle: "ALL",
      categories: categories || AIE_CATEGORIES,
      subType,
      ...(annotationType === "image"
        ? {
            selectedImage,
            images,
            selectedImageFrameTime:
              images && images.length > 0 ? images[0].frameTime : undefined,
          }
        : {
            videoSrc,
            keyframes,
          }),
    })
  )

  // Improved autosave effect
  useEffect(() => {
    const saveInterval = setInterval(() => {
      // Only save if there are actual changes
      if (state.history && state.history.length > 0) {
        try {
          const stateToSave = prepareStateForStorage(state)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
        } catch (e) {
          console.error("Error saving annotator state:", e)
        }
      }
    }, AUTOSAVE_INTERVAL)

    return () => clearInterval(saveInterval)
  }, [state])

  // Improved recovery effect
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        // Validate the saved state has required properties
        if (parsed.images && Array.isArray(parsed.images)) {
          setSavedState(parsed)
          setShowRecoveryModal(true)
        }
      } catch (e) {
        console.error("Error parsing saved annotator state:", e)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  const dispatch = useEventCallback((action: Action) => {
    if (action.type === "HEADER_BUTTON_CLICKED") {
      if (["Exit", "Done", "Complete"].includes(action.buttonName)) {
        localStorage.removeItem(STORAGE_KEY) // Clear autosave on exit
        return onExit(without(state, "history"))
      } else if (action.buttonName === "Save") {
        localStorage.removeItem(STORAGE_KEY) // Clear autosave on save
        onSave(without(state, "history"))
        dispatchToReducer({
          type: "CLEAR_NEW_DEVICES_TO_SAVE",
        })
        return
      } else if (action.buttonName === "Next" && onNextImage) {
        dispatchToReducer({
          type: "ON_NEXT_OR_PREV_BREAKOUT_RESET",
        })
        return onNextImage(without(state, "history"))
      } else if (action.buttonName === "Prev" && onPrevImage) {
        dispatchToReducer({
          type: "ON_NEXT_OR_PREV_BREAKOUT_RESET",
        })
        return onPrevImage(without(state, "history"))
      }
    } else {
      dispatchToReducer(action)
    }
  })

  const onRegionClassAdded = useEventCallback((cls) => {
    dispatchToReducer({
      type: "ON_CLS_ADDED",
      cls: cls,
    })
  })

  useEffect(() => {
    if (selectedImage === undefined) return
    dispatchToReducer({
      type: "SELECT_IMAGE",
      imageIndex: selectedImage,
      image: state.images[selectedImage],
    })
  }, [selectedImage, state.images])

  // Improved recovery handler
  const handleRecover = () => {
    if (savedState) {
      // Merge saved state with initial state to ensure all required properties exist
      const restoredState = {
        ...state,
        ...savedState,
        mode: null, // Reset mode to prevent stuck states
        history: [], // Start fresh history
      }
      
      dispatchToReducer({
        type: "RESTORE_STATE",
        state: makeImmutable(restoredState)
      })
    }
    setShowRecoveryModal(false)
  }

  const handleDiscard = () => {
    localStorage.removeItem(STORAGE_KEY)
    setShowRecoveryModal(false)
  }

  if (!images && !videoSrc)
    return 'Missing required prop "images" or "videoSrc"'

  return (
    <HotKeys keyMap={defaultKeyMap}>
      <SettingsProvider>
        {showRecoveryModal && (
          <RecoveryModal onRecover={handleRecover} onDiscard={handleDiscard} />
        )}
        <MainLayout
          RegionEditLabel={RegionEditLabel}
          alwaysShowNextButton={Boolean(onNextImage)}
          alwaysShowPrevButton={Boolean(onPrevImage)}
          state={state}
          dispatch={dispatch}
          onRegionClassAdded={onRegionClassAdded}
          hideHeader={hideHeader}
          hideHeaderText={hideHeaderText}
          hideNext={hideNext}
          hidePrev={hidePrev}
          hideClone={hideClone}
          hideSettings={hideSettings}
          hideFullScreen={hideFullScreen}
          hideSave={hideSave}
        />
      </SettingsProvider>
    </HotKeys>
  )
}

export default Annotator
