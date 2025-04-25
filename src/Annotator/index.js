// @flow

import type {
  Action,
  Image,
  MainLayoutState,
  Mode,
  ToolEnum,
} from "../MainLayout/types"
import React, { useEffect, useMemo, useReducer, useCallback, useImperativeHandle, forwardRef, useState } from "react"
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
import UncategorizedRegionsModal from "../UncategorizedRegionsModal"

const getRandomId = () => Math.random().toString().split(".")[1]

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
    | {| type: "autoseg", maxClusters ?: number, slicWeightFactor ?: number |},
hideHeader ?: boolean,
  hideHeaderText ?: boolean,
  hideNext ?: boolean,
  hidePrev ?: boolean,
  hideClone ?: boolean,
  hideSettings ?: boolean,
  hideFullScreen ?: boolean,
  hideSave ?: boolean,
  onImageChange ?: (imageIndex: number) => void,
}

export const Annotator = forwardRef < { focusRegion: (region: any) => void }, Props> (({
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
  onImageChange,
}, ref) => {
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

  const [showUncategorizedModal, setShowUncategorizedModal] = useState(false)
  const [uncategorizedRegions, setUncategorizedRegions] = useState([])
  const [selectedDeviceToggle, setSelectedDeviceToggle] = useState(null)
  const [ocrThreshold, setOcrThreshold] = useState(0.8)
  const [lastAutoSave, setLastAutoSave] = useState(Date.now())
  const [autoSaveIndicator, setAutoSaveIndicator] = useState({ show: false, message: "" })
  const AUTOSAVE_INTERVAL = 5 * 60 * 1000 // 5 minutes in milliseconds

  const findUncategorizedRegions = useCallback((state) => {
    const regions = []
    state.images.forEach((image, imageIndex) => {
      image.regions.forEach((region, regionIndex) => {
        if (
          ['box', 'point', 'line'].includes(region.type) &&
          (!region.category || region.category === undefined)
        ) {
          regions.push({
            ...region,
            imageIndex,
            regionIndex
          })
        }
      })
    })
    return regions
  }, [])

  const onToggleDevice = useCallback((device) => {
    setSelectedDeviceToggle(device)
  }, [])

  const dispatch = useEventCallback((action: Action) => {
    if (action.type === "HEADER_BUTTON_CLICKED") {
      if (["Exit", "Done", "Complete"].includes(action.buttonName)) {
        const uncategorized = findUncategorizedRegions(state)
        if (uncategorized.length > 0) {
          setUncategorizedRegions(uncategorized)
          setShowUncategorizedModal(true)
          return
        }
        return onExit(without(state, "history"))
      } else if (action.buttonName === "Save") {
        onSave(without(state, "history"))
        dispatchToReducer({
          type: "CLEAR_NEW_DEVICES_TO_SAVE",
        })
        setLastAutoSave(Date.now())
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

  // Add autosave effect
  useEffect(() => {
    const interval = setInterval(async () => {
      console.log("Auto-saving annotations...")
      setAutoSaveIndicator({ show: true, message: "Auto-saving..." })

      try {
        await onSave(without(state, "history"))
        setLastAutoSave(Date.now())
        setAutoSaveIndicator({ show: true, message: "Auto-save successful" })

        dispatchToReducer({ type: "CLEAR_NEW_DEVICES_TO_SAVE" })

        setTimeout(() => {
          setAutoSaveIndicator({ show: false, message: "" })
        }, 3000)
      } catch (error) {
        console.error("Auto-save failed:", error)
        setAutoSaveIndicator({ show: true, message: "Auto-save failed" })

        setTimeout(() => {
          setAutoSaveIndicator({ show: false, message: "" })
        }, 5000)
      }
    }, AUTOSAVE_INTERVAL) // Every 5 minutes = 300,000 ms

    return () => clearInterval(interval)
  }, [state, onSave])


  if (!images && !videoSrc)
    return 'Missing required prop "images" or "videoSrc"'

  // Add method to focus on a region
  const focusRegion = useCallback((region) => {
    // First select the correct image
    if (typeof region.imageIndex === 'number') {
      // Switch to the correct image first
      dispatch({
        type: "CHANGE_IMAGE_AND_SELECT_REGION",
        region: region,
        imageIndex: region.imageIndex
      })

      // Wait a bit for the image to load before selecting the region
      // setTimeout(() => {
      //   if (region) {
      //     dispatch({
      //       type: "SELECT_REGION",
      //       region
      //     })
      //   }
      // }, 100)
    }
  }, [state, dispatch]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    focusRegion
  }));

  const handleForceExit = useCallback(() => {
    // Filter out uncategorized regions before exiting
    const filteredState = {
      ...state,
      images: state.images.map(image => ({
        ...image,
        regions: image.regions.filter(region => {
          return !['box', 'point', 'line'].includes(region.type) ||
            (region.category && region.category !== undefined)
        })
      }))
    }
    onExit(without(filteredState, "history"))
  }, [state, onExit])

  const handleOcrThresholdChange = useCallback((newThreshold) => {
    setOcrThreshold(newThreshold)
    dispatch({
      type: "SET_OCR_THRESHOLD",
      threshold: newThreshold
    })
  }, [dispatch])

  const handleImageChange = useCallback((imageIndex) => {
    onImageChange(imageIndex)
  }, [onImageChange])

  return (
    <HotKeys keyMap={defaultKeyMap}>
      <SettingsProvider>
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
          onOcrThresholdChange={handleOcrThresholdChange}
          onImageChange={handleImageChange}
        />
        <UncategorizedRegionsModal
          open={showUncategorizedModal}
          onClose={() => setShowUncategorizedModal(false)}
          uncategorizedRegions={uncategorizedRegions}
          onPanToRegion={focusRegion}
          onToggleDevice={onToggleDevice}
          selectedDeviceToggle={selectedDeviceToggle}
          onForceExit={handleForceExit}
        />
      </SettingsProvider>
    </HotKeys>
  )
})

export default Annotator
