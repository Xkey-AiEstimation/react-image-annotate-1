// @flow
import clamp from "clamp"
import isEqual from "lodash/isEqual"
import { getIn, merge, setIn } from "seamless-immutable"
import { moveRegion } from "../../ImageCanvas/region-tools.js"
import type { Action, MainLayoutState } from "../../MainLayout/types"
import DeviceList from "../../RegionLabel/DeviceList"
import getLandmarksWithTransform from "../../utils/get-landmarks-with-transform"
import setInLocalStorage from "../../utils/set-in-local-storage"
import convertExpandingLineToPolygon from "./convert-expanding-line-to-polygon"
import fixTwisted from "./fix-twisted"
import getActiveImage from "./get-active-image"
import { saveToHistory } from "./history-handler.js"

const getRandomId = () => {
  var S4 = function () {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
  }
  return (
    S4() +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    S4() +
    S4()
  )
}

const calculateIoU = (box1, box2) => {
  const x1 = Math.max(box1.x, box2.x)
  const y1 = Math.max(box1.y, box2.y)
  const x2 = Math.min(box1.x + box1.w, box2.x + box2.w)
  const y2 = Math.min(box1.y + box1.h, box2.y + box2.h)

  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1)

  const box1Area = box1.w * box1.h
  const box2Area = box2.w * box2.h

  const union = box1Area + box2Area - intersection

  return intersection / union
}

const color_mapping = {
  "COMMUNICATION SYSTEMS": "#0000FF", // blue
  "FIRE ALARM": "#FF0000", // red
  LIGHTING: "#FFFF00", // yellow
  "MECHANICAL/ELECTRICAL": "#800080", // purple
  POWER: "#008000", // green
  "SECURITY SYSTEMS": "#545454", // light grey
  "CONDUIT AND WIRE": "#00FFFF", // bright cyan
  FEEDERS: "#66FF00", // bright green
  CABLE: "#C4A484", // everything below is light brown
  TRAY: "#C4A484",
  WIREMOLD: "#C4A484",
  BREAKERS: "#C4A484",
  WARNING: "#FFA500", // orange
  "NOT CLASSIFIED": "#C4A484",
}

const getColor = (state, device_name) => {
  let device_type = DeviceList.find((o) => o.symbol_name === device_name)
  if (device_type) {
    // return color_mapping[device_type["category"]]
    // get categoriesColorMap from the state
    let colorMap = getIn(state, ["categoriesColorMap"])
    if (colorMap) {
      if (colorMap[device_type["category"]]) {
        return colorMap[device_type["category"]]
      } else {
        return "#C4A484"
      }
    }
  } else {
    return "#C4A484"
  }
}

export const NOT_CLASSIFED = "NOT CLASSIFIED"

export const getColorByCategory = (state, category) => {
  // get categoriesColorMap from the state
  let colorMap = getIn(state, ["categoriesColorMap"])
  if (colorMap) {
    if (colorMap[category]) {
      return colorMap[category]
    } else {
      return "#C4A484"
    }
  }
}

// Update the helper functions for stricter containment checks

const isPointInBox = (point, box) => {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.w &&
    point.y >= box.y &&
    point.y <= box.y + box.h
  )
}

const isBoxFullyContained = (box1, box2) => {
  // box1 is the region, box2 is the selection box
  return (
    box1.x >= box2.x &&
    box1.x + box1.w <= box2.x + box2.w &&
    box1.y >= box2.y &&
    box1.y + box1.h <= box2.y + box2.h
  )
}

const isPolygonFullyContained = (polygon, box) => {
  // Check if ALL points of the polygon are inside the box
  return polygon.points.every(([x, y]) => isPointInBox({ x, y }, box))
}

const isLineFullyContained = (line, box) => {
  // Check if both endpoints are inside the box
  return (
    isPointInBox({ x: line.x1, y: line.y1 }, box) &&
    isPointInBox({ x: line.x2, y: line.y2 }, box)
  )
}

// Add this helper function at the top with other helpers
export const calculateLineLengthFt = (line, image_width, image_height, scales) => {
  if (scales.length === 0) return 0;

  // Calculate the pixel length of the line
  const lineLength = Math.sqrt(
    ((line.x1 - line.x2) * image_width) ** 2 + ((line.y1 - line.y2) * image_height) ** 2
  );

  // Calculate scale values (pixels per foot)
  const scaleValues = scales.map(scale => {
    const scaleVal = parseFloat(scale.cls);
    if (scaleVal > 0) {
      const scaleLength = Math.sqrt(
        ((scale.x1 - scale.x2) * image_width) ** 2 + ((scale.y1 - scale.y2) * image_height) ** 2
      );
      return scaleLength / scaleVal;
    }
    return 0;
  }).filter(val => val > 0);

  // Calculate average scale
  if (scaleValues.length === 0) return 0;
  const averageScale = scaleValues.reduce((a, b) => a + b, 0) / scaleValues.length;

  // Calculate length in feet
  return averageScale === 0 ? 0 : lineLength / averageScale;
}

// Add this helper function to update all line lengths
const updateLineLengths = (regions, image_width, image_height) => {
  const scales = regions.filter(r => r.type === "scale");
  return regions.map(region => {
    if (region.type === "line") {
      return {
        ...region,
        length_ft: calculateLineLengthFt(region, image_width, image_height, scales)
      };
    }
    return region;
  });
};

export default (state: MainLayoutState, action: Action) => {

  if (
    state.allowedArea &&
    state.selectedTool !== "modify-allowed-area" &&
    ["MOUSE_DOWN", "MOUSE_UP", "MOUSE_MOVE"].includes(action.type)
  ) {
    const aa = state.allowedArea
    action.x = clamp(action.x, aa.x, aa.x + aa.w)
    action.y = clamp(action.y, aa.y, aa.y + aa.h)
  }

  if (action.type === "ON_CLS_ADDED" && action.cls && action.cls !== "") {
    const oldRegionClsList = state.regionClsList
    const newState = {
      ...state,
      regionClsList: oldRegionClsList.concat(action.cls),
    }
    return newState
  }

  // Throttle certain actions
  if (action.type === "MOUSE_MOVE") {
    if (Date.now() - ((state: any).lastMouseMoveCall || 0) < 16) return state
    state = setIn(state, ["lastMouseMoveCall"], Date.now())
  }
  if (!action.type.includes("MOUSE")) {
    state = setIn(state, ["lastAction"], action)
  }

  const { currentImageIndex, pathToActiveImage, activeImage } =
    getActiveImage(state)

  const getRegionIndex = (region) => {
    const regionId =
      typeof region === "string" || typeof region === "number"
        ? region
        : region?.id
    if (!activeImage) return null
    if (!regionId) return null
    const regionIndex = (activeImage.regions || []).findIndex(
      (r) => r.id === regionId
    )
    return regionIndex === -1 ? null : regionIndex
  }
  const getRegion = (regionId) => {
    if (!activeImage) return null
    const regionIndex = getRegionIndex(regionId)
    if (regionIndex === null) return [null, null]
    const region = activeImage.regions[regionIndex]
    return [region, regionIndex]
  }
  const modifyRegion = (regionId, obj) => {
    const [region, regionIndex] = getRegion(regionId)
    if (!region) return state
    if (obj !== null) {
      return setIn(state, [...pathToActiveImage, "regions", regionIndex], {
        ...region,
        ...obj,
      })
    } else {
      // delete region
      const regions = activeImage.regions
      return setIn(
        state,
        [...pathToActiveImage, "regions"],
        (regions || []).filter((r) => r.id !== region.id)
      )
    }
  }
  const unselectRegions = (state: MainLayoutState) => {
    if (!activeImage) return state
    return setIn(
      state,
      [...pathToActiveImage, "regions"],
      (activeImage.regions || []).map((r) => ({
        ...r,
        highlighted: false,
      }))
    )
  }

  const closeEditors = (state: MainLayoutState) => {
    if (currentImageIndex === null) return state
    return setIn(
      state,
      [...pathToActiveImage, "regions"],
      (activeImage.regions || []).map((r) => ({
        ...r,
        editingLabels: false,
      }))
    )
  }

  const getCategoryBySymbolName = (symbolName) => {
    let newDevice = getIn(state, ["deviceList"]).find(
      (device) => device.symbol_name === symbolName
    )
    if (newDevice) {
      return newDevice.category
    } else {
      return "NOT CLASSIFIED"
    }
  }

  const setNewImage = (img: string | Object, index: number) => {
    let { src, frameTime } = typeof img === "object" ? img : { src: img }
    return setIn(
      setIn(state, ["selectedImage"], index),
      ["selectedImageFrameTime"],
      frameTime
    )
  }
  switch (action.type) {
    case "@@INIT": {
      return state
    }
    case "SELECT_IMAGE": {
      return setNewImage(action.image, action.imageIndex)
    }
    case "SELECT_CLASSIFICATION": {
      return setIn(state, ["selectedCls"], action.cls)
    }
    case "CHANGE_ALL_REGION_VISIBILITY": {
      let newState = { ...state }
      let current_visibility = getIn(state, [
        "images",
        currentImageIndex,
        "allRegionVisibility",
      ])
      let new_visibility =
        current_visibility === undefined || current_visibility === true
          ? false
          : true
      let newImage = getIn(newState, ["images", currentImageIndex])
      newImage = merge(newImage, [{ allRegionVisibility: new_visibility }])
      let newRegions = getIn(newState, ["images", currentImageIndex, "regions"])
      if (!newRegions) {
        return state
      }
      newRegions = newRegions.map((region) => ({
        ...region,
        visible: new_visibility,
      }))
      newImage = setIn(newImage, ["regions"], newRegions)
      newState = setIn(newState, ["images", currentImageIndex], newImage)
      return newState
    }
    case "ADD_NEW_CATEGORY": {
      let newState = { ...state }
      let newImage = getIn(newState, ["images", currentImageIndex])
      let newRegions = getIn(newState, ["images", currentImageIndex, "regions"])
      if (!newRegions) {
        return state
      }

      const newCategory = action.category
      const color = action.color || "#C4A484"
      let categories = getIn(newState, ["categories"]) || []
      let newCategoriesToSave = getIn(newState, ["newCategoriesToSave"]) || []

      const newCat = { category: newCategory, color }

      if (!categories.includes(newCategory)) {
        // Add new category
        newCategoriesToSave = [...newCategoriesToSave, newCat]
        categories = [...categories, newCategory]
      } else {
        // Update color of existing category
        newCategoriesToSave = newCategoriesToSave.map((cat) =>
          cat.category === newCategory ? newCat : cat
        )
      }

      // update the categoriesColorMap
      let categoriesColorMap = getIn(newState, ["categoriesColorMap"])
      if (!categoriesColorMap) {
        categoriesColorMap = {}
      }


      // make sure the color is not already in the categoriesColorMap
      // we have to create a shallow copy of the categoriesColorMap and check if the color is already in the copy
      let categoriesColorMapCopy = { ...categoriesColorMap }
      if (!Object.values(categoriesColorMapCopy).includes(color)) {
        categoriesColorMapCopy[newCategory] = color
        newState = setIn(newState, ["categoriesColorMap"], categoriesColorMapCopy)
      }

      newState = setIn(newState, ["newCategoriesToSave"], newCategoriesToSave)
      newState = setIn(newState, ["categories"], categories)

      newState = setIn(newState, ["images", currentImageIndex], newImage)
      return newState
    }
    case "CHANGE_CATEGORY_COLOR": {
      const { category, color } = action
      let newState = { ...state }

      // Update the color in the categories array
      let newCategoriesToSave = getIn(newState, ["newCategoriesToSave"]) || []

      // Update the color of the existing category
      let newCatToSave = newCategoriesToSave.map((cat) =>
        cat.category === category ? { ...cat, color } : cat
      )

      // If the category does not exist in newCategoriesToSave, add it
      if (!newCatToSave.some((cat) => cat.category === category)) {
        newCatToSave = [...newCatToSave, { category, color }]
      }

      // Update all regions with the new color in all images
      let newImages = getIn(newState, ["images"]) || []
      newImages = newImages.map((image) => {
        let newRegions = image.regions.map((region) =>
          region.category === category ? { ...region, color } : region
        )
        return setIn(image, ["regions"], newRegions)
      })
      // update the categoriesColorMap
      let categoriesColorMap = getIn(newState, ["categoriesColorMap"])
      if (!categoriesColorMap) {
        categoriesColorMap = {}
      }
      // make sure the color is already in the categoriesColorMap
      let categoriesColorMapCopy = { ...categoriesColorMap }
      categoriesColorMapCopy[category] = color
      newState = setIn(newState, ["categoriesColorMap"], categoriesColorMapCopy)

      newState = setIn(newState, ["images"], newImages)
      newState = setIn(newState, ["newCategoriesToSave"], newCatToSave)

      return newState
    }
    case "UPDATE_REGION_COLOR": {
      const { region, color } = action

      let newState = { ...state }
      let newImage = getIn(newState, ["images", currentImageIndex])
      let newRegions = getIn(newState, ["images", currentImageIndex, "regions"])
      if (!newRegions) {
        return state
      }

      newRegions = newRegions.map((r) =>
        r.id === region.id ? { ...r, color } : r
      )

      newImage = setIn(newImage, ["regions"], newRegions)
      newState = setIn(newState, ["images", currentImageIndex], newImage)
      return newState
    }

    case "TOGGLE_VISIBILITY": {
      let newState = { ...state }
      let newImage = getIn(newState, ["images", currentImageIndex])
      let newRegions = getIn(newState, ["images", currentImageIndex, "regions"])
      let excludedCategories = getIn(newState, ["excludedCategories"]) || []
      let selectedBreakoutToggle = getIn(newState, ["selectedBreakoutToggle"])
      let newExcludedCategories = excludedCategories.includes(action.category)
        ? excludedCategories.filter((category) => category !== action.category)
        : [...excludedCategories, action.category]
      if (!newRegions) {
        return state
      }
      newRegions = newRegions.map((region) => {
        const isCategoryMatch = region.category === action.category
        const isBreakoutMatch =
          !selectedBreakoutToggle || (region.breakout || {}).id === selectedBreakoutToggle;

        const isVisible =
          isCategoryMatch && isBreakoutMatch
            ? !newExcludedCategories.includes(action.category)
            : region.visible

        return { ...region, visible: isVisible }
      })

      newState = setIn(newState, ["excludedCategories"], newExcludedCategories)
      newImage = setIn(newImage, ["regions"], newRegions)
      newState = setIn(newState, ["images", currentImageIndex], newImage)
      return newState
    }

    case "ADD_OLD_DEVICE_TO_NEW_DEVICES": {
      let newState = { ...state }
      let newImage = getIn(newState, ["images", currentImageIndex])
      let newRegions = getIn(newState, ["images", currentImageIndex, "regions"])
      let newDevicesToSave = getIn(newState, ["newDevicesToSave"])
      let devices = getIn(newState, ["deviceList"])
      const { device } = action
      if (!newRegions) {
        return state
      }

      let deviceIndex = devices.findIndex(
        (d) => d.symbol_name === device.symbol_name
      )

      if (deviceIndex === -1) {
        const newDevice = {
          symbol_name: device.symbol_name,
          category: device.category,
          user_defined: true,
          id: `${device.symbol_name}-device-${device.category}`,
        }
        newDevicesToSave = newDevicesToSave.concat(newDevice)
        newState = setIn(state, ["deviceList"], [newDevice, ...devices])
      }

      // iterate over all regions and add the device to the regions and set the category and set isOldDevice to false
      newRegions = newRegions.map((region) => {
        if (region.cls === device.symbol_name) {
          return {
            ...region,
            category: device.category,
            color: getColorByCategory(state, device.category),
            isOldDevice: false,
          }
        } else {
          return region
        }
      })

      newImage = setIn(newImage, ["regions"], newRegions)
      newState = setIn(newState, ["images", currentImageIndex], newImage)
      newState = setIn(newState, ["newDevicesToSave"], newDevicesToSave)
      return newState
    }

    case "TOGGLE_DEVICE_VISIBILITY": {
      // GIVEN A DEVICE NAME, TOGGLE THE VISIBILITY OF ALL REGIONS WITH THAT DEVICE NAME (CLS). MULTIPLE DEVICES CAN BE TOGGLED AT ONCE.
      // SET THE STATE OF THE CATEGORY TO THE OPPOSITE OF ITS CURRENT STATE
      // if the device name is "ALL" then set the visibility of all regions to true
      let newState = { ...state }
      let newImage = getIn(newState, ["images", currentImageIndex])
      let newRegions = getIn(newState, ["images", currentImageIndex, "regions"])
      let newSelectedBreakoutToggle = getIn(newState, [
        "selectedBreakoutToggle",
      ])
      let newSelectedDeviceToggle = getIn(newState, ["selectedDeviceToggle"])

      if (newSelectedDeviceToggle === action.deviceName) {
        newSelectedDeviceToggle = "ALL"
      } else {
        newSelectedDeviceToggle = action.deviceName
      }

      if (!newRegions) {
        return state
      }
      // TOGGLE THE VISIBILITY OF THE DEVICE NAME
      newRegions = newRegions.map((region) => {
        if (newSelectedDeviceToggle === "ALL") {
          if (newSelectedBreakoutToggle) {
            if (
              region.breakout &&
              region.breakout.id === newSelectedBreakoutToggle
            ) {
              return { ...region, visible: true }
            } else {
              return { ...region, visible: false }
            }
          } else {
            return { ...region, visible: true }
          }
        } else {
          if (region.cls === newSelectedDeviceToggle) {
            if (newSelectedBreakoutToggle) {
              if (
                region.breakout &&
                region.breakout.id === newSelectedBreakoutToggle
              ) {
                return { ...region, visible: true }
              } else {
                return { ...region, visible: false }
              }
            } else {
              return { ...region, visible: true }
            }
          } else {
            return { ...region, visible: false }
          }
        }
      })
      newState = merge(newState, [
        { selectedDeviceToggle: newSelectedDeviceToggle },
      ])
      newImage = setIn(newImage, ["regions"], newRegions)
      newState = setIn(newState, ["images", currentImageIndex], newImage)
      return newState
    }
    case "ON_NEXT_OR_PREV_BREAKOUT_RESET": {
      let newState = { ...state }
      let newImage = getIn(newState, ["images", currentImageIndex])
      let newBreakouts = getIn(newState, ["breakouts"])
      let newRegions = getIn(newState, ["images", currentImageIndex, "regions"])
      if (!newRegions) {
        return state
      }

      newBreakouts = newBreakouts.map((breakout) => {
        return {
          ...breakout,
          visible: false,
        }
      })

      newRegions = newRegions.map((region) => {
        return {
          ...region,
          highlighted: false,
          visible: region.breakout
            ? region.breakout.visible
              ? false
              : true
            : true,
          breakout: region.breakout
            ? { ...region.breakout, visible: false }
            : undefined,
        }
      })
      newState = merge(newState, [{ breakouts: newBreakouts }])
      newState = merge(newState, [{ selectedBreakoutIdAutoAdd: null }])
      newImage = setIn(newImage, ["regions"], newRegions)
      newState = setIn(newState, ["images", currentImageIndex], newImage)
      return newState
    }
    case "TOGGLE_BREAKOUT_AUTO_ADD": {
      let newState = { ...state }
      let newImage = getIn(newState, ["images", currentImageIndex])
      let selectedBreakoutIdAutoAdd = getIn(newState, [
        "selectedBreakoutIdAutoAdd",
      ])

      if (selectedBreakoutIdAutoAdd === action.breakoutId) {
        selectedBreakoutIdAutoAdd = null
      } else {
        selectedBreakoutIdAutoAdd = action.breakoutId
      }

      newState = merge(newState, [
        { selectedBreakoutIdAutoAdd: selectedBreakoutIdAutoAdd },
      ])
      newState = setIn(newState, ["images", currentImageIndex], newImage)
      return newState
    }
    case "TOGGLE_BREAKOUT_VISIBILITY":
      const { images, breakouts } = state
      const currentImage = images[currentImageIndex]
      if (!currentImage || !currentImage.regions) {
        return state
      }
      // get the eccluded categories
      let excludedCategories = getIn(state, ["excludedCategories"]) || []
      let selectedBreakoutToggle = getIn(state, ["selectedBreakoutToggle"])

      if (selectedBreakoutToggle === action.breakoutId) {
        selectedBreakoutToggle = null
      } else {
        selectedBreakoutToggle = action.breakoutId
      }

      const updatedBreakouts = breakouts.map((breakout) => {
        const isVisible =
          breakout.id === action.breakoutId ? !breakout.visible : false
        return { ...breakout, visible: isVisible }
      })

      let allBreakoutsInvisible = updatedBreakouts.every(
        (breakout) => !breakout.visible
      )
      let updatedRegions = currentImage.regions.map((region) => {
        const breakout = region.breakout
        let breakoutVisible = false
        // check if the regions category is included in the excluded categories list if it is then set the visibility to false
        if (excludedCategories.includes(region.category)) {
          breakoutVisible = false
        } else if (breakout && breakout.id === action.breakoutId) {
          breakoutVisible = !breakout.visible
          allBreakoutsInvisible = allBreakoutsInvisible && !breakoutVisible
        }
        return {
          ...region,
          visible: breakoutVisible,
          breakout: breakout
            ? { ...breakout, visible: breakoutVisible }
            : undefined,
        }
      })

      if (allBreakoutsInvisible) {
        updatedRegions = updatedRegions.map((region) => ({
          ...region,
          visible: true,
          breakout: region.breakout
            ? { ...region.breakout, visible: false }
            : undefined,
        }))
      }

      const updatedImage = { ...currentImage, regions: updatedRegions }
      const updatedImages = [...images]
      updatedImages[currentImageIndex] = updatedImage
      // newState = merge(newState, [
      //   { selectedBreakoutToggle: selectedBreakoutToggle },
      // ])
      return {
        ...state,
        images: updatedImages,
        breakouts: updatedBreakouts,
        selectedBreakoutToggle: selectedBreakoutToggle,
      }
    case "ADD_NEW_BREAKOUT": {
      let newState = { ...state }
      let newImage = getIn(newState, ["images", currentImageIndex])
      let newRegions = getIn(newState, ["images", currentImageIndex, "regions"])
      if (!newRegions) {
        return state
      }
      const breakoutId = getRandomId()
      newRegions = newRegions.map((region) => {
        if (region.id === action.region.id) {
          return {
            ...region,
            breakout: {
              is_breakout: true,
              name: action.name,
              id: breakoutId,
              visible: false,
            },
          }
        } else {
          return region
        }
      })
      let newBreakouts = getIn(newState, ["breakouts"])
      newBreakouts = newBreakouts.concat({
        name: action.name,
        is_breakout: true,
        visible: false,
        id: breakoutId,
      })

      newImage = setIn(newImage, ["regions"], newRegions)
      newState = merge(newState, [{ breakouts: newBreakouts }])
      newState = setIn(newState, ["images", currentImageIndex], newImage)
      return newState
    }

    case "DELETE_DEVICES_WITH_DEVICENAME": {
      let newState = { ...state }
      let newImage = getIn(newState, ["images", currentImageIndex])
      let newRegions = getIn(newState, ["images", currentImageIndex, "regions"])
      if (!newRegions) {
        return state
      }
      newRegions = newRegions.filter(
        (region) => region.cls !== action.deviceName
      )
      newImage = setIn(newImage, ["regions"], newRegions)
      newState = setIn(newState, ["images", currentImageIndex], newImage)
      // save to history
      // newState = saveToHistory(
      //   newState,
      //   "Delete Devices with Device Name: " + action.deviceName
      // )
      return newState
    }

    case "DELETE_ALL_DEVICES": {
      let newState = { ...state }
      let newImage = getIn(newState, ["images", currentImageIndex])
      let newRegions = getIn(newState, ["images", currentImageIndex, "regions"])
      if (!newRegions) {
        return state
      }
      newRegions = newRegions.filter((region) => region.cls === undefined)
      newImage = setIn(newImage, ["regions"], newRegions)
      newState = setIn(newState, ["images", currentImageIndex], newImage)
      // save to history
      // newState = saveToHistory(newState, "Delete All Devices")
      return newState
    }

    case "ADD_NEW_BREAKOUT_BY_CATEGORY": {
      let newState = { ...state }
      let images = getIn(newState, ["images"])
      let newBreakouts = getIn(newState, ["breakouts"])

      let categoryBreakout = {
        name: action.category,
        is_breakout: true,
        visible: false,
        id: getRandomId(),
      }
      const existingBreakout = newBreakouts.some(
        (breakout) => breakout.name === action.category
      )

      if (!existingBreakout) {
        // Create a new breakout and append it to newBreakouts
        newBreakouts = newBreakouts.concat(categoryBreakout)
      } else {
        // Use the existing breakout with the matching category
        categoryBreakout = newBreakouts.find(
          (breakout) => breakout.name === action.category
        )
      }

      images = images.map((image, imgIDX) => {
        let regions = image.regions
        if (!regions) {
          return image
        }

        regions = regions.map((region) => {
          if (region.category === action.category) {
            if (region.breakout === undefined) {
              return {
                ...region,
                breakout: categoryBreakout,
              }
            } else {
              return region
            }
          } else {
            return region
          }
        })
        let newImage = setIn(image, ["regions"], regions)
        newState = setIn(newState, ["images", imgIDX], newImage)
      })
      newState = merge(newState, [{ breakouts: newBreakouts }])
      return newState
    }
    case "ADD_NEW_BREAKOUT_BY_REGION_ID": {
      let newState = { ...state }
      let newImage = getIn(newState, ["images", currentImageIndex])
      let newRegions = getIn(newState, ["images", currentImageIndex, "regions"])
      let newBreakouts = getIn(newState, ["breakouts"])
      if (!newRegions) {
        return state
      }
      const breakoutId = getRandomId()
      // check if region already has a breakout
      const regionHasBreakout = newRegions.some(
        (region) => region.breakout && region.breakout.id === breakoutId
      )
      if (regionHasBreakout) {
        return state
      }

      newRegions = newRegions.map((region) => {
        if (region.id === action.region.id) {
          return {
            ...region,
            breakout: {
              is_breakout: true,
              name: action.name,
              id: breakoutId,
              visible: false,
            },
          }
        } else {
          return region
        }
      })

      newBreakouts = newBreakouts.concat({
        name: action.name,
        is_breakout: true,
        visible: false,

        id: breakoutId,
      })

      newImage = setIn(newImage, ["regions"], newRegions)
      newState = merge(newState, [{ breakouts: newBreakouts }])
      newState = setIn(newState, ["images", currentImageIndex], newImage)

      return newState
    }

    case "DELETE_BREAKOUT_BY_BREAKOUT_ID": {
      let newState = { ...state }
      let images = getIn(newState, ["images"])
      let newBreakouts = getIn(newState, ["breakouts"])
      let newImage = getIn(newState, ["images", currentImageIndex])
      let newRegions = getIn(newState, ["images", currentImageIndex, "regions"])
      if (!newRegions) {
        return state
      }
      const deleteBreakoutId = action.breakoutId

      newBreakouts = newBreakouts.filter(
        (breakout) => breakout.id !== deleteBreakoutId
      )
      images = images.map((image, imgIDX) => {
        let regions = getIn(newState, ["images", imgIDX, "regions"])

        if (!regions) {
          return image
        }
        regions = regions.map((region) => {
          if (region.breakout && region.breakout.id === deleteBreakoutId) {
            // Toggle visibility if the region's category matches the action's category
            return {
              ...region,
              visible: true,
              breakout: undefined,
            }
          } else {
            return region
          }
        })
        newImage = setIn(image, ["regions"], regions)
        newState = setIn(newState, ["images", imgIDX], newImage)
      })
      newState = merge(newState, [{ breakouts: newBreakouts }])
      return newState
    }

    case "ADD_EXISTING_BREAKOUT": {
      let newState = { ...state }
      let newImage = getIn(newState, ["images", currentImageIndex])
      let newRegions = getIn(newState, ["images", currentImageIndex, "regions"])
      if (!newRegions) {
        return state
      }
      newRegions = newRegions.map((region) => {
        if (region.id === action.region.id) {
          return {
            ...region,
            breakout: {
              is_breakout: true,
              name: action.breakoutName,
              id: action.breakoutId,
              visible: false,
            },
          }
        } else {
          return region
        }
      })
      newImage = setIn(newImage, ["regions"], newRegions)
      newState = setIn(newState, ["images", currentImageIndex], newImage)
      return newState
    }

    case "REMOVE_BREAKOUT_BY_REGION_ID": {
      let newState = { ...state }
      let newImage = getIn(newState, ["images", currentImageIndex])
      let newRegions = getIn(newState, ["images", currentImageIndex, "regions"])
      if (!newRegions) {
        return state
      }
      newRegions = newRegions.map((region) => {
        if (region.id === action.region.id) {
          return {
            ...region,
            breakout: undefined,
          }
        } else {
          return region
        }
      })
      newImage = setIn(newImage, ["regions"], newRegions)
      newState = setIn(newState, ["images", currentImageIndex], newImage)
      return newState
    }

    case "DELETE_BREAKOUT": {
      let newState = { ...state }
      let newImage = getIn(newState, ["images", currentImageIndex])
      let newRegions = getIn(newState, ["images", currentImageIndex, "regions"])
      if (!newRegions) {
        return state
      }
      const deleteBreakoutId = action.breakoutId
      newRegions = newRegions.map((region) => {
        if (region.breakout.id === deleteBreakoutId) {
          // Toggle visibility if the region's category matches the action's category
          return {
            ...region,
            breakout: undefined,
          }
        } else {
          return region
        }
      })
      newImage = setIn(newImage, ["regions"], newRegions)
      newState = setIn(newState, ["images", currentImageIndex], newImage)
      return newState
    }
    case "CLEAR_NEW_DEVICES_TO_SAVE": {
      return setIn(state, ["newDevicesToSave"], [])
    }
    case "UPDATE_DEVICE_CATEGORY_ON_ALL_REGIONS_BY_SYMBOL_NAME_AND_CATEGORY_USER_DEFINED": {
      let newState = { ...state }
      const color = getColorByCategory(state, action.category)

      // Iterate over all images
      newState.images = newState.images.map((image) => {
        // Get regions of the current image
        let newRegions = getIn(image, ["regions"])
        if (!newRegions) {
          return image
        }

        // Iterate over all regions in the current image
        newRegions = newRegions.map((region) => {
          // If the region's cls property matches the symbol_name from the action, update the region's category and color
          if (region.cls === action.symbol_name) {
            return {
              ...region,
              category: action.category,
              color: color,
            }
          } else {
            return region
          }
        })

        // Update the regions of the current image and return the updated image
        return setIn(image, ["regions"], newRegions)
      })

      // update user defined devices
      let deviceList = getIn(newState, ["deviceList"])
      let newDevicesToSave = getIn(newState, ["newDevicesToSave"])
      let deviceIndex = deviceList.findIndex(
        (device) => device.symbol_name === action.symbol_name
      )

      // if device exists in the device list then update the category
      if (deviceIndex !== -1) {
        newState = setIn(
          newState,
          ["deviceList", deviceIndex, "category"],
          action.category
        )

        // update the newDevicesToSave
        let newDevicesToSaveIndex = newDevicesToSave.findIndex(
          (device) => device.symbol_name === action.symbol_name
        )
        if (newDevicesToSaveIndex !== -1) {
          newState = setIn(
            newState,
            ["newDevicesToSave", newDevicesToSaveIndex, "category"],
            action.category
          )
        } else {
          newState = setIn(
            newState,
            ["newDevicesToSave"],
            [
              ...newDevicesToSave,
              {
                symbol_name: action.symbol_name,
                category: action.category,
                user_defined: true,
              },
            ]
          )
        }
      }

      newState = setIn(newState, ["selectedCls"], action.symbol_name)
      newState = setIn(newState, ["selectedCategory"], action.category)

      return newState
    }
    // ANCHOR
    case "CHANGE_NEW_REGION": {
      const { region } = action
      const regionIndex = getRegionIndex(action.region)
      if (regionIndex === null) return state

      region.color = getColorByCategory(state, region.category)
      region.visible = true
      state = saveToHistory(state, "Add New Region")

      const deviceList = getIn(state, ["deviceList"])
      const newDevicesToSave = getIn(state, ["newDevicesToSave"])

      // deviceList is an array of objects with symbol_name and category
      // deviceList is an array of objects with symbol_name and category
      const deviceIndex = deviceList.findIndex(
        (device) => device.symbol_name === region.cls
      )
      if (deviceIndex === -1) {
        // concat the new device to the device list with name and category
        const newDevice = {
          symbol_name: region.cls,
          category: region.category,
          user_defined: true,
        }
        state = setIn(state, ["deviceList"], [newDevice, ...deviceList])
        state = setIn(
          state,
          ["newDevicesToSave"],
          [...newDevicesToSave, newDevice]
        )
        state = setIn(state, ["selectedCls"], region.cls)
        state = setIn(state, ["selectedCategory"], region.category)
      } else {
        state = setIn(state, ["selectedCls"], region.cls)
        state = setIn(state, ["selectedCategory"], region.category)

        // change the category of the device in the device list
        state = setIn(
          state,
          ["deviceList", deviceIndex, "category"],
          region.category
        )

        // change newDevicesToSave
        const newDevicesToSaveIndex = newDevicesToSave.findIndex(
          (device) => device.symbol_name === region.cls
        )
        if (newDevicesToSaveIndex !== -1) {
          state = setIn(
            state,
            ["newDevicesToSave", newDevicesToSaveIndex, "category"],
            region.category
          )
        }
      }

      return setIn(
        state,
        [...pathToActiveImage, "regions", regionIndex],
        region
      )
    }
    case "CHANGE_REGION": {
      // if region.type is a scale then set cls to action.region.cls and all regions with type line need to have their length_ft recaculated
      const regions = getIn(state, ["images", currentImageIndex, "regions"]);
      const regionIndex = getRegionIndex(action.region);
      if (regionIndex === null) return state;
      const oldRegion = regions[regionIndex];
      if (action.region.type === "scale") {
        if (oldRegion.cls !== action.region.cls) {
          action.region.visible = true;
          // GET THE IMAGE WIDTH AND HEIGHT FROM THE STATE
          const updatedRegionsWithNewScale = regions.map((region, index) =>
            index === regionIndex ? action.region : region
          )
          let image_width = getIn(state, ["images", currentImageIndex, "width"])
          let image_height = getIn(state, ["images", currentImageIndex, "height"])
          if (!image_width) {
            image_width = activeImage?.pixelSize?.w || 0
          }
          if (!image_height) {
            image_height = activeImage?.pixelSize?.h || 0
          }
          const updatedRegions = updateLineLengths(updatedRegionsWithNewScale, image_width, image_height)
          state = saveToHistory(state, "Change Scale");
          return setIn(state, [...pathToActiveImage, "regions"], updatedRegions)
        }
      }
      
      // Handle device name (cls) changes
      if (
        oldRegion.type !== "scale" &&
        oldRegion.cls !== action.region.cls) {
        action.region.visible = true
        action.region.category = getCategoryBySymbolName(action.region.cls)
        action.region.color = getColorByCategory(state, action.region.category)
        state = saveToHistory(state, "Change Region Classification")
        const clsIndex = state.regionClsList.indexOf(action.region.cls)
        if (clsIndex !== -1) {
          state = setIn(state, ["selectedCls"], action.region.cls)
          state = setIn(state, ["selectedCategory"], action.region.category)
        }
      }
      
      // Handle category changes (even when cls doesn't change)
      if (oldRegion.category !== action.region.category) {
        action.region.visible = true
        action.region.color = getColorByCategory(state, action.region.category)
        state = saveToHistory(state, "Change Region Category")
        
        // Update device list if this device exists
        const deviceList = getIn(state, ["deviceList"])
        const newDevicesToSave = getIn(state, ["newDevicesToSave"])
        const deviceIndex = deviceList.findIndex(
          (device) => device.symbol_name === action.region.cls
        )
        
        if (deviceIndex !== -1) {
          // Update existing device in device list
          state = setIn(
            state,
            ["deviceList", deviceIndex, "category"],
            action.region.category
          )
          
          // Update in newDevicesToSave
          const newDevicesToSaveIndex = newDevicesToSave.findIndex(
            (device) => device.symbol_name === action.region.cls
          )
          if (newDevicesToSaveIndex !== -1) {
            state = setIn(
              state,
              ["newDevicesToSave", newDevicesToSaveIndex, "category"],
              action.region.category
            )
          } else {
            // Add to newDevicesToSave if not already there
            state = setIn(
              state,
              ["newDevicesToSave"],
              [
                ...newDevicesToSave,
                {
                  symbol_name: action.region.cls,
                  category: action.region.category,
                  user_defined: true,
                },
              ]
            )
          }
        } else {
          // Create new device entry if it doesn't exist
          const newDevice = {
            symbol_name: action.region.cls,
            category: action.region.category,
            user_defined: true,
          }
          state = setIn(state, ["deviceList"], [newDevice, ...deviceList])
          state = setIn(
            state,
            ["newDevicesToSave"],
            [...newDevicesToSave, newDevice]
          )
        }
        
        state = setIn(state, ["selectedCls"], action.region.cls)
        state = setIn(state, ["selectedCategory"], action.region.category)
      }
      
      if (!isEqual(oldRegion.tags, action.region.tags)) {
        state = saveToHistory(state, "Change Region Tags")
      }
      if (!isEqual(oldRegion.comment, action.region.comment)) {
        state = saveToHistory(state, "Change Region Comment")
      }
      return setIn(
        state,
        [...pathToActiveImage, "regions", regionIndex],
        action.region
      )
    }
    case "CHANGE_IMAGE": {
      if (!activeImage) return state
      const { delta } = action

      // Handle direct page selection
      if (typeof delta === 'number') {
        // If delta is a direct index difference
        const targetIndex = currentImageIndex + delta
        console.log(targetIndex)
        if (targetIndex < 0 || targetIndex >= state.images.length) return state

        // Reset any active modes or selections
        state = setIn(state, ["mode"], null)
        state = setIn(state, ["selectedTool"], "select")

        // Clear any existing region highlights
        if (activeImage.regions) {
          state = setIn(
            state,
            [...pathToActiveImage, "regions"],
            activeImage.regions.map(r => ({
              ...r,
              highlighted: false,
              editingLabels: false
            }))
          )
        }

        // chekc if currentImage is different from targetIndex
        console.log(currentImageIndex, targetIndex) 
        console.log(state.images[currentImageIndex], state.images[targetIndex])
        return setNewImage(
          state.images[targetIndex],
          targetIndex
        )
      }

      // Handle existing image property changes
      for (const key of Object.keys(delta)) {
        if (key === "cls") saveToHistory(state, "Change Image Class")
        if (key === "tags") saveToHistory(state, "Change Image Tags")
        state = setIn(state, [...pathToActiveImage, key], delta[key])
      }
      return state
    }
    case "CHANGE_IMAGE_AND_SELECT_REGION": {
      const { region, imageIndex } = action
      let newState = { ...state }
      let regions = getIn(newState, ["images", imageIndex, "regions"])
      // switch image 
      state = getIn(state, ["selectedImage"], imageIndex)
      state = getIn(state, ["images", imageIndex], activeImage)

      const regionIndex = getRegionIndex(region)
      if (regionIndex === null) return state

      const newRegions = regions.map((r) => ({
        ...r,
        highlighted: r.id === region.id,
        editingLabels: r.id === region.id,
        visible: true,
      }))
      newState = merge(newState, [{ breakouts: newBreakouts }])
      newState = merge(newState, [{ selectedBreakoutIdAutoAdd: null }])
      newImage = setIn(newImage, ["regions"], newRegions)
      newState = setIn(newState, ["images", imageIndex], newImage)
      return newState
    }
    case "CHANGE_IMAGE_NAME": {
      if (!activeImage) return state
      const { name } = action
      return setIn(state, [...pathToActiveImage, "name"], name)
    }
    case "SELECT_REGION": {
      const { region } = action
      const regionIndex = getRegionIndex(action.region)
      if (regionIndex === null) return state
      const selectedBreakoutIdAutoAdd = getIn(state, [
        "selectedBreakoutIdAutoAdd",
      ])
      const regions = [...(activeImage.regions || [])].map((r) => ({
        ...r,
        highlighted: r.id === region.id,
        editingLabels: r.id === region.id,
        ...(selectedBreakoutIdAutoAdd && r.id === region.id
          ? {
            breakout: {
              is_breakout: true,
              name: state.breakouts.find(
                (breakout) => breakout.id === selectedBreakoutIdAutoAdd
              ).name,
              id: selectedBreakoutIdAutoAdd,
              visible: false,
            },
          }
          : {
            breakout: r.breakout || undefined,
          }),
      }))
      return setIn(state, [...pathToActiveImage, "regions"], regions)
    }
    case "BEGIN_MOVE_POINT": {
      state = closeEditors(state)
      return setIn(state, ["mode"], {
        mode: "MOVE_REGION",
        regionId: action.point.id,
      })
    }
    case "BEGIN_BOX_TRANSFORM": {
      const { box, directions } = action
      state = closeEditors(state)
      if (directions[0] === 0 && directions[1] === 0) {
        return setIn(state, ["mode"], { mode: "MOVE_REGION", regionId: box.id })
      } else {
        return setIn(state, ["mode"], {
          mode: "RESIZE_BOX",
          regionId: box.id,
          freedom: directions,
          original: { x: box.x, y: box.y, w: box.w, h: box.h },
        })
      }
    }
    case "BEGIN_MOVE_POLYGON_POINT": {
      const { polygon, pointIndex } = action
      state = closeEditors(state)
      if (
        state.mode &&
        state.mode.mode === "DRAW_POLYGON" &&
        pointIndex === 0
      ) {
        return setIn(
          modifyRegion(polygon, {
            points: polygon.points.slice(0, -1),
            open: false,
          }),
          ["mode"],
          null
        )
      } else {
        state = saveToHistory(state, "Move Polygon Point")
      }
      return setIn(state, ["mode"], {
        mode: "MOVE_POLYGON_POINT",
        regionId: polygon.id,
        pointIndex,
      })
    }
    case "BEGIN_MOVE_KEYPOINT": {
      const { region, keypointId } = action
      state = closeEditors(state)
      state = saveToHistory(state, "Move Keypoint")
      return setIn(state, ["mode"], {
        mode: "MOVE_KEYPOINT",
        regionId: region.id,
        keypointId,
      })
    }
    case "ADD_POLYGON_POINT": {
      const { polygon, point, pointIndex } = action
      const regionIndex = getRegionIndex(polygon)
      if (regionIndex === null) return state
      const points = [...polygon.points]
      points.splice(pointIndex, 0, point)
      return setIn(state, [...pathToActiveImage, "regions", regionIndex], {
        ...polygon,
        points,
      })
    }
    case "MOUSE_MOVE": {
      const { x, y } = action

      if (!state.mode) return state
      if (!activeImage) return state
      const { mouseDownAt } = state

      switch (state.mode.mode) {
        case "MULTI_DELETE_SELECT": {
          const { start } = state.mode
          // Calculate dimensions of selection box
          const w = Math.abs(x - start.x)
          const h = Math.abs(y - start.y)
          // Calculate top-left position
          const newX = Math.min(x, start.x)
          const newY = Math.min(y, start.y)

          return setIn(state, ["mode"], {
            ...state.mode,
            x: newX,
            y: newY,
            w,
            h
          })
        }
        case "MOVE_POLYGON_POINT": {
          const { pointIndex, regionId } = state.mode
          const regionIndex = getRegionIndex(regionId)
          if (regionIndex === null) return state
          return setIn(
            state,
            [
              ...pathToActiveImage,
              "regions",
              regionIndex,
              "points",
              pointIndex,
            ],
            [x, y]
          )
        }
        case "MOVE_KEYPOINT": {
          const { keypointId, regionId } = state.mode
          const [region, regionIndex] = getRegion(regionId)
          if (regionIndex === null) return state
          return setIn(
            state,
            [
              ...pathToActiveImage,
              "regions",
              regionIndex,
              "points",
              keypointId,
            ],
            { ...(region: any).points[keypointId], x, y }
          )
        }
        case "MOVE_REGION": {
          const { regionId } = state.mode
          if (regionId === "$$allowed_area") {
            const {
              allowedArea: { w, h },
            } = state
            return setIn(state, ["allowedArea"], {
              x: x - w / 2,
              y: y - h / 2,
              w,
              h,
            })
          }
          const regionIndex = getRegionIndex(regionId)
          if (regionIndex === null) return state
          return setIn(
            state,
            [...pathToActiveImage, "regions", regionIndex],
            moveRegion(activeImage.regions[regionIndex], x, y)
          )
        }
        case "RESIZE_BOX": {
          const {
            regionId,
            freedom: [xFree, yFree],
            original: { x: ox, y: oy, w: ow, h: oh },
          } = state.mode

          const dx = xFree === 0 ? ox : xFree === -1 ? Math.min(ox + ow, x) : ox
          const dw =
            xFree === 0
              ? ow
              : xFree === -1
                ? ow + (ox - dx)
                : Math.max(0, ow + (x - ox - ow))
          const dy = yFree === 0 ? oy : yFree === -1 ? Math.min(oy + oh, y) : oy
          const dh =
            yFree === 0
              ? oh
              : yFree === -1
                ? oh + (oy - dy)
                : Math.max(0, oh + (y - oy - oh))

          // determine if we should switch the freedom
          if (dw <= 0.001) {
            state = setIn(state, ["mode", "freedom"], [xFree * -1, yFree])
          }
          if (dh <= 0.001) {
            state = setIn(state, ["mode", "freedom"], [xFree, yFree * -1])
          }

          if (regionId === "$$allowed_area") {
            return setIn(state, ["allowedArea"], {
              x: dx,
              w: dw,
              y: dy,
              h: dh,
            })
          }

          const regionIndex = getRegionIndex(regionId)
          if (regionIndex === null) return state
          const box = activeImage.regions[regionIndex]

          return setIn(state, [...pathToActiveImage, "regions", regionIndex], {
            ...box,
            x: dx,
            w: dw,
            y: dy,
            h: dh,
          })
        }
        case "RESIZE_KEYPOINTS": {
          const { regionId, landmarks, centerX, centerY } = state.mode
          const distFromCenter = Math.sqrt(
            (centerX - x) ** 2 + (centerY - y) ** 2
          )
          const scale = distFromCenter / 0.15
          return modifyRegion(regionId, {
            points: getLandmarksWithTransform({
              landmarks,
              center: { x: centerX, y: centerY },
              scale,
            }),
          })
        }
        case "DRAW_POLYGON": {
          const { regionId } = state.mode
          const [region, regionIndex] = getRegion(regionId)
          if (!region) return setIn(state, ["mode"], null)
          return setIn(
            state,
            [
              ...pathToActiveImage,
              "regions",
              regionIndex,
              "points",
              (region: any).points.length - 1,
            ],
            [x, y]
          )
        }
        case "DRAW_LINE": {
          const { regionId } = state.mode
          const [region, regionIndex] = getRegion(regionId)
          if (!region) return setIn(state, ["mode"], null)


          return setIn(state, [...pathToActiveImage, "regions", regionIndex], {
            ...region,
            x2: x,
            y2: y,
          })
        }
        case "ASSIGN_SCALE": {
          const { regionId } = state.mode
          const [region, regionIndex] = getRegion(regionId)
          if (!region) return setIn(state, ["mode"], null)
          return setIn(state, [...pathToActiveImage, "regions", regionIndex], {
            ...region,
            x2: x,
            y2: y,
          })
        }
        case "DRAW_EXPANDING_LINE": {
          const { regionId } = state.mode
          const [expandingLine, regionIndex] = getRegion(regionId)
          if (!expandingLine) return state
          const isMouseDown = Boolean(state.mouseDownAt)
          if (isMouseDown) {
            // If the mouse is down, set width/angle
            const lastPoint = expandingLine.points.slice(-1)[0]
            const mouseDistFromLastPoint = Math.sqrt(
              (lastPoint.x - x) ** 2 + (lastPoint.y - y) ** 2
            )
            if (mouseDistFromLastPoint < 0.002 && !lastPoint.width) return state

            const newState = setIn(
              state,
              [...pathToActiveImage, "regions", regionIndex, "points"],
              expandingLine.points.slice(0, -1).concat([
                {
                  ...lastPoint,
                  width: mouseDistFromLastPoint * 2,
                  angle: Math.atan2(lastPoint.x - x, lastPoint.y - y),
                },
              ])
            )
            return newState
          } else {
            // If mouse is up, move the next candidate point
            return setIn(
              state,
              [...pathToActiveImage, "regions", regionIndex],
              {
                ...expandingLine,
                candidatePoint: { x, y },
              }
            )
          }

          return state
        }
        case "SET_EXPANDING_LINE_WIDTH": {
          const { regionId } = state.mode
          const [expandingLine, regionIndex] = getRegion(regionId)
          if (!expandingLine) return state
          const lastPoint = expandingLine.points.slice(-1)[0]
          const { mouseDownAt } = state
          return setIn(
            state,
            [...pathToActiveImage, "regions", regionIndex, "expandingWidth"],
            Math.sqrt((lastPoint.x - x) ** 2 + (lastPoint.y - y) ** 2)
          )
        }
        default:
          return state
      }
    }
    case "MOUSE_DOWN": {
      if (!activeImage) return state
      const { x, y } = action

      state = setIn(state, ["mouseDownAt"], { x, y })

      if (state.selectedTool === "multi-delete-select") {
        return setIn(state, ["mode"], {
          mode: "MULTI_DELETE_SELECT",
          regionId: getRandomId(),  // Generate a temporary region ID for the selection box
          start: { x, y },
          w: 0,
          h: 0,
          highlighted: true,
          type: "eraser-selection"  // Special type to identify this is an eraser box
        })
      }


      if (state.mode) {
        switch (state.mode.mode) {
          case "DRAW_POLYGON": {
            const [polygon, regionIndex] = getRegion(state.mode.regionId)
            if (!polygon) break
            return setIn(
              state,
              [...pathToActiveImage, "regions", regionIndex],
              { ...polygon, points: polygon.points.concat([[x, y]]) }
            )
          }
          case "DRAW_LINE": {
            const [line, regionIndex] = getRegion(state.mode.regionId)

            if (!line) break
            if (line.type !== "line") return state
            // check if x1 and y1 are set. also check if x1 != x and y1 != y to prevent setting a scale of 0. if x1 and x2 are not set or x1 == x2 and y1 == y2 then remove the scale
            if (line.x1 === undefined || line.y1 === undefined) {
              return state
            }
            if (line.x1 === x && line.y1 === y) {
              // remove the region
              return setIn(
                state,
                [...pathToActiveImage, "regions"],
                activeImage.regions.filter((r) => r.id !== line.id)
              )
            }
            const scales = activeImage.regions.filter(region => region.type === "scale");
            const image_width = activeImage.pixelSize.w
            const image_height = activeImage.pixelSize.h

            let relativeLineLengthFt = calculateLineLengthFt(line, image_width, image_height, scales)


            state = saveToHistory(state, "Create Line")
            const newState = setIn(state, [...pathToActiveImage, "regions", regionIndex], {
              ...line,
              x2: x,
              y2: y,
              length_ft: relativeLineLengthFt,
            })
            return setIn(newState, ["mode"], null)
          }
          case "ASSIGN_SCALE": {
            const [line, regionIndex] = getRegion(state.mode.regionId)
            if (!line) break
            if (line.type !== "scale") return state
            // check if x1 and y1 are set. also check if x1 != x and y1 != y to prevent setting a scale of 0. if x1 and x2 are not set or x1 == x2 and y1 == y2 then remove the scale

            if (line.x1 === undefined || line.y1 === undefined) {
              return state
            }
            if (line.x1 === x && line.y1 === y) {
              // remove the region
              return setIn(
                state,
                [...pathToActiveImage, "regions"],
                activeImage.regions.filter((r) => r.id !== line.id)
              )
            }
            state = saveToHistory(state, "Create scale")
            setIn(state, [...pathToActiveImage, "regions", regionIndex], {
              ...line,
              x2: x,
              y2: y,
            })
            return setIn(state, ["mode"], null)
          }
          case "DRAW_EXPANDING_LINE": {
            const [expandingLine, regionIndex] = getRegion(state.mode.regionId)
            if (!expandingLine) break
            const lastPoint = expandingLine.points.slice(-1)[0]
            if (
              expandingLine.points.length > 1 &&
              Math.sqrt((lastPoint.x - x) ** 2 + (lastPoint.y - y) ** 2) < 0.002
            ) {
              if (!lastPoint.width) {
                return setIn(state, ["mode"], {
                  mode: "SET_EXPANDING_LINE_WIDTH",
                  regionId: state.mode.regionId,
                })
              } else {
                return state
                  .setIn(
                    [...pathToActiveImage, "regions", regionIndex],
                    convertExpandingLineToPolygon(expandingLine)
                  )
                  .setIn(["mode"], null)
              }
            }

            // Create new point
            return setIn(
              state,
              [...pathToActiveImage, "regions", regionIndex, "points"],
              expandingLine.points.concat([{ x, y, angle: null, width: null }])
            )
          }
          case "SET_EXPANDING_LINE_WIDTH": {
            const [expandingLine, regionIndex] = getRegion(state.mode.regionId)
            if (!expandingLine) break
            const { expandingWidth } = expandingLine
            return state
              .setIn(
                [...pathToActiveImage, "regions", regionIndex],
                convertExpandingLineToPolygon({
                  ...expandingLine,
                  points: expandingLine.points.map((p) =>
                    p.width ? p : { ...p, width: expandingWidth }
                  ),
                  expandingWidth: undefined,
                })
              )
              .setIn(["mode"], null)
          }
          default:
            break
        }
      }
      let newRegion
      let defaultRegionCls =
        state.selectedCls !== undefined && state.selectedCls !== null
          ? state.selectedCls
          : Array.isArray(state.regionClsList) && state.regionClsList.length > 0
            ? state.regionClsList[0]
            : undefined

      let defaultRegionCategory =
        state.selectedCategory !== undefined && state.selectedCategory !== null
          ? state.selectedCategory
          : defaultRegionCls
            ? getCategoryBySymbolName(defaultRegionCls)
            : "NOT CLASSIFIED"
      let defaultPointAndBoxColor = getColorByCategory(
        state,
        defaultRegionCategory
      )
      let defaultRegionColor = "#C4A484"
      const clsIndex = (state.regionClsList || []).indexOf(defaultRegionCls)
      if (clsIndex !== -1) {
        defaultRegionColor = getColor(state, state.selectedCls)
      }

      switch (state.selectedTool) {
        case "create-point": {
          state = saveToHistory(state, "Create Point")
          let newRegionBreakout = undefined
          const { selectedBreakoutIdAutoAdd } = state
          if (selectedBreakoutIdAutoAdd !== null) {
            newRegionBreakout = state.breakouts.find(
              (breakout) => breakout.id === selectedBreakoutIdAutoAdd
            )
          }

          // Get the currently selected device's details
          const selectedDevice = state.deviceList.find(
            device => device.symbol_name === state.selectedCls
          )

          // Use the selected device's category and color if available
          const deviceCategory = selectedDevice ? selectedDevice.category : defaultRegionCategory
          const deviceColor = selectedDevice ?
            getColorByCategory(state, deviceCategory) :
            defaultPointAndBoxColor

          newRegion = {
            type: "point",
            x,
            y,
            highlighted: true,
            editingLabels: true,
            color: deviceColor,
            id: getRandomId(),
            cls: state.selectedCls || defaultRegionCls,
            category: deviceCategory,
            visible: true,
            breakout: newRegionBreakout,
          }
          break
        }
        case "create-box": {
          state = saveToHistory(state, "Create Box")
          let newRegionBreakout = undefined
          const { selectedBreakoutIdAutoAdd } = state
          if (selectedBreakoutIdAutoAdd !== null) {
            // create a breakout object with id === selectedBreakoutIdAutoAdd
            newRegionBreakout = state.breakouts.find(
              (breakout) => breakout.id === selectedBreakoutIdAutoAdd
            )
          }
          
          // Get the currently selected device's details
          const selectedDevice = state.deviceList.find(
            device => device.symbol_name === defaultRegionCls
          )

          // Use the selected device's category and color if available
          const deviceCategory = selectedDevice ? selectedDevice.category : defaultRegionCategory
          const deviceColor = selectedDevice ?
            getColorByCategory(state, deviceCategory) :
            defaultPointAndBoxColor
            
          newRegion = {
            type: "box",
            x: x,
            y: y,
            w: 0,
            h: 0,
            highlighted: true,
            editingLabels: false,
            color: deviceColor,
            cls: defaultRegionCls,
            id: getRandomId(),
            category: deviceCategory,
            visible: true,
            breakout: newRegionBreakout,
          }
          state = setIn(state, ["mode"], {
            mode: "RESIZE_BOX",
            editLabelEditorAfter: true,
            regionId: newRegion.id,
            freedom: [1, 1],
            original: { x, y, w: newRegion.w, h: newRegion.h },
            isNew: true,
          })
          break
        }
        case "create-polygon": {
          if (state.mode && state.mode.mode === "DRAW_POLYGON") break
          state = saveToHistory(state, "Create Polygon")
          let newRegionBreakout = undefined
          const { selectedBreakoutIdAutoAdd } = state
          if (selectedBreakoutIdAutoAdd !== null) {
            // create a breakout object with id === selectedBreakoutIdAutoAdd
            newRegionBreakout = state.breakouts.find(
              (breakout) => breakout.id === selectedBreakoutIdAutoAdd
            )
          }
          newRegion = {
            type: "polygon",
            points: [
              [x, y],
              [x, y],
            ],
            open: true,
            highlighted: true,
            color: defaultRegionColor,
            cls: defaultRegionCls,
            id: getRandomId(),
            category: getCategoryBySymbolName(defaultRegionCls),
            visible: true,
            breakout: newRegionBreakout,
          }
          state = setIn(state, ["mode"], {
            mode: "DRAW_POLYGON",
            regionId: newRegion.id,
          })
          break
        }
        case "create-expanding-line": {
          state = saveToHistory(state, "Create Expanding Line")
          let newRegionBreakout = undefined
          const { selectedBreakoutIdAutoAdd } = state
          if (selectedBreakoutIdAutoAdd !== null) {
            // create a breakout object with id === selectedBreakoutIdAutoAdd
            newRegionBreakout = state.breakouts.find(
              (breakout) => breakout.id === selectedBreakoutIdAutoAdd
            )
          }
          newRegion = {
            type: "expanding-line",
            unfinished: true,
            points: [{ x, y, angle: null, width: null }],
            open: true,
            highlighted: true,
            color: defaultRegionColor,
            cls: defaultRegionCls,
            id: getRandomId(),
            category: getCategoryBySymbolName(defaultRegionCls),
            visible: true,
            breakout: newRegionBreakout,
          }
          state = setIn(state, ["mode"], {
            mode: "DRAW_EXPANDING_LINE",
            regionId: newRegion.id,
          })
          break
        }
        case "create-line": {
          if (state.mode && state.mode.mode === "DRAW_LINE") break
          let newRegionBreakout = undefined
          const { selectedBreakoutIdAutoAdd } = state
          if (selectedBreakoutIdAutoAdd !== null) {
            // create a breakout object with id === selectedBreakoutIdAutoAdd
            newRegionBreakout = state.breakouts.find(
              (breakout) => breakout.id === selectedBreakoutIdAutoAdd
            )
          }
          newRegion = {
            type: "line",
            x1: x,
            y1: y,
            x2: x,
            y2: y,
            highlighted: true,
            editingLabels: false,
            color: defaultPointAndBoxColor,
            cls: defaultRegionCls,
            id: getRandomId(),
            category: getCategoryBySymbolName(defaultRegionCls),
            visible: true,
            breakout: newRegionBreakout,
            length_ft: undefined,
          }
          state = setIn(state, ["mode"], {
            mode: "DRAW_LINE",
            regionId: newRegion.id,
          })
          break
        }
        case "create-scale": {
          if (state.mode && state.mode.mode == "ASSIGN_SCALE") break
          newRegion = {
            type: "scale",
            x1: x,
            y1: y,
            x2: x,
            y2: y,
            unit: "ft",
            length: 1,
            highlighted: true,
            editingLabels: false,
            color: "#4f46e5",
            cls: "1", // Make sure this is set
            id: getRandomId(),
            visible: true,
            breakout: undefined,
          }
          state = setIn(state, ["mode"], {
            mode: "ASSIGN_SCALE",
            regionId: newRegion.id,
          })
          break
        }
        case "create-keypoints": {
          state = saveToHistory(state, "Create Keypoints")
          const [[keypointsDefinitionId, { landmarks, connections }]] =
            (Object.entries(state.keypointDefinitions): any)

            newRegion = {
              type: "keypoints",
              keypointsDefinitionId,
              points: getLandmarksWithTransform({
                landmarks,
                center: { x, y },
                scale: 1,
              }),
              highlighted: true,
              editingLabels: false,
              id: getRandomId(),
              category: getCategoryBySymbolName(defaultRegionCls),
              visible: true,
              breakout: undefined,
            }
          state = setIn(state, ["mode"], {
            mode: "RESIZE_KEYPOINTS",
            landmarks,
            centerX: x,
            centerY: y,
            regionId: newRegion.id,
            isNew: true,
          })
          break
        }
        default:
          break
      }

      const regions = [...(getIn(state, pathToActiveImage).regions || [])]
        .map((r) =>
          setIn(r, ["editingLabels"], false).setIn(["highlighted"], false)
        )
        .concat(newRegion ? [newRegion] : [])

      return setIn(state, [...pathToActiveImage, "regions"], regions)
    }
    case "MOUSE_UP": {
      const { x, y } = action

      const { mouseDownAt = { x, y } } = state
      if (!state.mode) return state
      state = setIn(state, ["mouseDownAt"], null)

      if (state.mode?.mode === "MULTI_DELETE_SELECT") {
        const { start } = state.mode
        // Calculate final selection box
        const selectionBox = {
          x: Math.min(start.x, x),
          y: Math.min(start.y, y),
          w: Math.abs(x - start.x),
          h: Math.abs(y - start.y)
        }

        // Get regions before deletion for history
        const regionsBeforeDelete = activeImage.regions || []

        // Filter out regions that intersect with the selection box
        const newRegions = regionsBeforeDelete.filter((region) => {
          // only delete visible regions
          if (!region.visible || region.type === "scale" || region.dimmed
          ) return true
          switch (region.type) {
            case "point":
              return !isPointInBox(region, selectionBox)
            case "box":
              return !isBoxFullyContained(region, selectionBox)
            case "polygon":
              return !isPolygonFullyContained(region, selectionBox)
            case "line":
              return !isLineFullyContained(region, selectionBox)
            default:
              return true
          }
        })

        // Count deleted regions
        const deletedCount = regionsBeforeDelete.length - newRegions.length

        // Only save to history if regions were actually deleted
        if (deletedCount > 0) {
          state = saveToHistory(
            state,
            `Eraser Tool: Deleted ${deletedCount} region${deletedCount !== 1 ? "s" : ""
            }`
          )
        }

        return setIn(
          setIn(state, ["mode"], null),
          [...pathToActiveImage, "regions"],
          newRegions
        )
      }
      switch (state.mode.mode) {
        case "RESIZE_BOX": {
          if (state.mode.isNew) {
            if (
              Math.abs(state.mode.original.x - x) < 0.002 ||
              Math.abs(state.mode.original.y - y) < 0.002
            ) {
              return setIn(
                modifyRegion(state.mode.regionId, null),
                ["mode"],
                null
              )
            }
          }
          if (state.mode.editLabelEditorAfter) {
            return {
              ...modifyRegion(state.mode.regionId, { editingLabels: true }),
              mode: null,
            }
          }
        }
        case "MOVE_REGION":
        case "RESIZE_KEYPOINTS":
        case "MOVE_POLYGON_POINT": {
          return { ...state, mode: null }
        }
        case "MOVE_KEYPOINT": {
          return { ...state, mode: null }
        }
        case "CREATE_POINT_LINE": {
          return state
        }
        case "DRAW_EXPANDING_LINE": {
          const [expandingLine, regionIndex] = getRegion(state.mode.regionId)
          if (!expandingLine) return state
          let newExpandingLine = expandingLine
          const lastPoint =
            expandingLine.points.length !== 0
              ? expandingLine.points.slice(-1)[0]
              : mouseDownAt
          let jointStart
          if (expandingLine.points.length > 1) {
            jointStart = expandingLine.points.slice(-2)[0]
          } else {
            jointStart = lastPoint
          }
          const mouseDistFromLastPoint = Math.sqrt(
            (lastPoint.x - x) ** 2 + (lastPoint.y - y) ** 2
          )
          if (mouseDistFromLastPoint > 0.002) {
            // The user is drawing has drawn the width for the last point
            const newPoints = [...expandingLine.points]
            for (let i = 0; i < newPoints.length - 1; i++) {
              if (newPoints[i].width) continue
              newPoints[i] = {
                ...newPoints[i],
                width: lastPoint.width,
              }
            }
            newExpandingLine = setIn(
              expandingLine,
              ["points"],
              fixTwisted(newPoints)
            )
          } else {
            return state
          }
          return setIn(
            state,
            [...pathToActiveImage, "regions", regionIndex],
            newExpandingLine
          )
        }
        case "ASSIGN_SCALE": {
          const image_pixel_size = getIn(state, pathToActiveImage).pixelSize
          const image_width = image_pixel_size ? image_pixel_size.w : 0
          const image_height = image_pixel_size ? image_pixel_size.h : 0
          // When finishing drawing a scale
          const regions = updateLineLengths([
            ...(getIn(state, pathToActiveImage).regions || [])
          ], image_width, image_height)
          return setIn(state, [...pathToActiveImage, "regions"], regions);
        }
        default:
          return state
      }
    }
    case "OPEN_REGION_EDITOR": {
      const { region } = action
      const regionIndex = getRegionIndex(action.region)
      if (regionIndex === null) return state
      const selectedBreakoutIdAutoAdd = getIn(state, [
        "selectedBreakoutIdAutoAdd",
      ])
      const newRegions = setIn(
        activeImage.regions.map((r) => ({
          ...r,
          highlighted: false,
          editingLabels: false,
          visible: true,
        })),
        [regionIndex],
        {
          ...(activeImage.regions || [])[regionIndex],
          highlighted: true,
          editingLabels: true,
          ...(selectedBreakoutIdAutoAdd &&
            (activeImage.regions || [])[regionIndex].id === region.id
            ? {
              breakout: {
                is_breakout: true,
                name: state.breakouts.find(
                  (breakout) => breakout.id === selectedBreakoutIdAutoAdd
                ).name,
                id: selectedBreakoutIdAutoAdd,
                visible: false,
              },
            }
            : {
              breakout:
                (activeImage.regions || [])[regionIndex].breakout ||
                undefined,
            }),
        }
      )
      return setIn(state, [...pathToActiveImage, "regions"], newRegions)
    }
    case "CLOSE_REGION_EDITOR": {
      const { region } = action
      const regionIndex = getRegionIndex(action.region)

      if (regionIndex === null) return state
      let regionColor = getColor(state, region.cls)

      let newState = state;

      // If editing a scale, update all line lengths
      if (region.type === "scale") {
        const image_pixel_size = getIn(state, pathToActiveImage).pixelSize
        const image_width = image_pixel_size ? image_pixel_size.w : 0
        const image_height = image_pixel_size ? image_pixel_size.h : 0
        const regions = updateLineLengths([
          ...(getIn(state, pathToActiveImage).regions || [])
        ], image_width, image_height);
        newState = setIn(state, [...pathToActiveImage, "regions"], regions);
      }

      return setIn(newState, [...pathToActiveImage, "regions", regionIndex], {
        ...(activeImage.regions || [])[regionIndex],
        color: regionColor,
        editingLabels: false,
        isOCR: false,
      })
    }
    case "DELETE_REGION_KEYPRESS": {
      // get highlighted region
      const highlightedRegion = activeImage.regions.find((r) => r.highlighted)
      if (!highlightedRegion) return state
      if (highlightedRegion.type === "scale") {
        const image_pixel_size = getIn(state, pathToActiveImage).pixelSize
        const image_width = image_pixel_size ? image_pixel_size.w : 0
        const image_height = image_pixel_size ? image_pixel_size.h : 0
        const newRegions = [...(getIn(state, pathToActiveImage).regions || [])]
          .filter(r => r.id !== highlightedRegion.id)
        const updatedRegions = updateLineLengths(newRegions, image_width, image_height);
        return setIn(state, [...pathToActiveImage, "regions"], updatedRegions);
      } else {
        return setIn(
          state,
          [...pathToActiveImage, "regions"],
          (activeImage.regions || []).filter((r) => !r.highlighted)
        )
      }
    }
    case "DELETE_REGION": {
      const regionIndex = getRegionIndex(action.region); // 
      const activeImage = getIn(state, pathToActiveImage);
      const regions = activeImage?.regions || [];

      // If regionIndex is null/undefined, fall back to deleting highlighted regions
      const shouldDeleteByHighlight = regionIndex == null;

      // If deleting a scale, update all line lengths
      if (action.region?.type === "scale") {
        const image_pixel_size = activeImage?.pixelSize;
        const image_width = image_pixel_size?.w || 0;
        const image_height = image_pixel_size?.h || 0;

        const newRegions = regions.filter(r =>
          (shouldDeleteByHighlight ? !r.highlighted : r.id !== action.region.id)
        );

        const updatedRegions = updateLineLengths(newRegions, image_width, image_height);
        return setIn(state, [...pathToActiveImage, "regions"], updatedRegions);
      }

      // Support both new and old deletion methods
      return setIn(
        state,
        [...pathToActiveImage, "regions"],
        regions.filter(r =>
          (shouldDeleteByHighlight ? !r.highlighted : r.id !== action.region.id)
        )
      );

    }
    case "DELETE_SELECTED_REGION": {
      return setIn(
        state,
        [...pathToActiveImage, "regions"],
        (activeImage.regions || []).filter((r) => !r.highlighted)
      )
    }
    case "MATCH_REGION_LOADING": {
      return setIn(state, ["loadingTemplateMatching"], true)
    }
    case "MATCH_REGION_FINISHED": {
      // we need a new _pathToActiveImage to store the path of image where the template matching is applied to,
      // to prevent the case that the user may switch to another image while the template matching is still running,
      // and the result of template matching is applied to the wrong image.
      if (action.ocr_type === "page") {
        const page_index = action.page_properties.page_index
        let _pathToActiveImage = [...pathToActiveImage]
        _pathToActiveImage[_pathToActiveImage.length - 1] = page_index
        let page_properties = action.page_properties
        let old_regions = [...(getIn(state, _pathToActiveImage).regions || [])]
        let new_regions = action.region
        // remove the new regions that have IoU > 0.5 with the old regions to prevent duplicate regions
        for (let i = 0; i < old_regions.length; i++) {
          for (let j = 0; j < new_regions.length; j++) {
            let iou_temp = calculateIoU(old_regions[i], new_regions[j])
            if (iou_temp > 0.1) {
              new_regions.splice(j, 1)
              break
            }
          }
        }

        // append new regions to the old regions, and reset highlighting
        let regions = [...(getIn(state, _pathToActiveImage).regions || [])]
          .map((r) =>
            setIn(r, ["editingLabels"], false).setIn(["highlighted"], false)
          )
          .concat(action.region ? [...action.region] : [])
        let newState = { ...state }
        newState = setIn(newState, ["loadingTemplateMatching"], false)
        // save to history
        newState = saveToHistory(newState, `RAN OCR Matching`)
        return setIn(newState, [..._pathToActiveImage, "regions"], regions)
      } else if (action.ocr_type === "project") {
        let newState = { ...state }
        let project_regions = action.region
        for (
          let page_index = 0;
          page_index < project_regions.length;
          page_index++
        ) {
          let old_regions = [
            ...(getIn(state, ["images", page_index]).regions || []),
          ]
          let new_regions = project_regions[page_index]
          // remove the new regions that have IoU > 0.5 with the old regions to prevent duplicate regions
          for (let i = 0; i < old_regions.length; i++) {
            for (let j = 0; j < new_regions.length; j++) {
              let iou_temp = calculateIoU(old_regions[i], new_regions[j])
              if (iou_temp > 0.1) {
                new_regions.splice(j, 1)
                break
              }
            }
          }
          let regions = [
            ...(getIn(state, ["images", page_index]).regions || []),
          ]
            .map((r) =>
              setIn(r, ["editingLabels"], false).setIn(["highlighted"], false)
            )
            .concat(new_regions ? [...new_regions] : [])
          newState = setIn(newState, ["images", page_index, "regions"], regions)
        }
        newState = setIn(newState, ["loadingTemplateMatching"], false)
        // save to history
        newState = saveToHistory(newState, `RAN OCR Matching`)
        return newState
      }
    }
    case "HEADER_BUTTON_CLICKED": {
      const buttonName = action.buttonName.toLowerCase()
      switch (buttonName) {
        case "prev": {
          if (currentImageIndex === null) return state
          if (currentImageIndex === 0) return state

          // Reset any active modes or selections before navigation
          state = setIn(state, ["mode"], null)
          state = setIn(state, ["selectedTool"], "select")

          // Clear highlights from current image regions
          if (activeImage.regions) {
            state = setIn(
              state,
              [...pathToActiveImage, "regions"],
              activeImage.regions.map(r => ({
                ...r,
                highlighted: false,
                editingLabels: false
              }))
            )
          }

          return setNewImage(
            state.images[currentImageIndex - 1],
            currentImageIndex - 1
          )
        }
        case "next": {
          if (currentImageIndex === null) return state
          if (currentImageIndex === state.images.length - 1) return state

          // Reset any active modes or selections before navigation
          state = setIn(state, ["mode"], null)
          state = setIn(state, ["selectedTool"], "select")

          // Clear highlights from current image regions
          if (activeImage.regions) {
            state = setIn(
              state,
              [...pathToActiveImage, "regions"],
              activeImage.regions.map(r => ({
                ...r,
                highlighted: false,
                editingLabels: false
              }))
            )
          }

          return setNewImage(
            state.images[currentImageIndex + 1],
            currentImageIndex + 1
          )
        }
        case "clone": {
          if (currentImageIndex === null) return state
          if (currentImageIndex === state.images.length - 1) return state
          return setIn(
            setNewImage(
              state.images[currentImageIndex + 1],
              currentImageIndex + 1
            ),
            ["images", currentImageIndex + 1, "regions"],
            activeImage.regions
          )
        }
        case "settings": {
          return setIn(state, ["settingsOpen"], !state.settingsOpen)
        }
        case "help": {
          return state
        }
        case "fullscreen": {
          return setIn(state, ["fullScreen"], true)
        }
        case "exit fullscreen":
        case "window": {
          return setIn(state, ["fullScreen"], false)
        }
        case "hotkeys": {
          return state
        }
        case "exit":
        case "save": {
          let newState = { ...state }
          let newImage = getIn(newState, ["images", currentImageIndex])
          let newRegions = getIn(newState, [
            "images",
            currentImageIndex,
            "regions",
          ])
          if (!newRegions) {
            return state
          }
          newRegions = newRegions.map((region) => ({
            ...region,
            visible: true,
          }))
          newImage = setIn(newImage, ["regions"], newRegions)
          newState = setIn(newState, ["images", currentImageIndex], newImage)
          return newState
        }
        case "done": {
          return state
        }
        default:
          return state
      }
    }
    case "SELECT_TOOL": {
      if (action.selectedTool === "show-tags") {
        setInLocalStorage("showTags", !state.showTags)
        return setIn(state, ["showTags"], !state.showTags)
      } else if (action.selectedTool === "show-mask") {
        return setIn(state, ["showMask"], !state.showMask)
      }
      if (action.selectedTool === "modify-allowed-area" && !state.allowedArea) {
        state = setIn(state, ["allowedArea"], { x: 0, y: 0, w: 1, h: 1 })
      }
      state = setIn(state, ["mode"], null)
      return setIn(state, ["selectedTool"], action.selectedTool)
    }
    case "CANCEL": {
      const { mode } = state
      if (mode) {
        switch (mode.mode) {
          case "DRAW_EXPANDING_LINE":
          case "SET_EXPANDING_LINE_WIDTH":
          case "DRAW_POLYGON": {
            const { regionId } = mode
            return modifyRegion(regionId, null)
          }
          case "MOVE_POLYGON_POINT":
          case "RESIZE_BOX":
          case "MOVE_REGION": {
            return setIn(state, ["mode"], null)
          }
          default:
            return state
        }
      }
      // Close any open boxes
      const regions: any = activeImage.regions
      if (regions && regions.some((r) => r.editingLabels)) {
        return setIn(
          state,
          [...pathToActiveImage, "regions"],
          regions.map((r) => ({
            ...r,
            editingLabels: false,
          }))
        )
      } else if (regions) {
        return setIn(
          state,
          [...pathToActiveImage, "regions"],
          regions.map((r) => ({
            ...r,
            highlighted: false,
          }))
        )
      }
      break
    }
    case "PAN_TO_REGION": {
      const { region } = action
      if (!region || !activeImage) return state

      // Calculate the region coordinates based on type
      let regionData = {}

      if (region.type === "box") {
        // For boxes, use the coordinates directly
        regionData = {
          x: region.x,
          y: region.y,
          w: region.w,
          h: region.h
        }
      } else if (region.type === "polygon") {
        // For polygons, calculate the bounding box
        const points = region.points || []
        if (points.length > 0) {
          let minX = 1, minY = 1, maxX = 0, maxY = 0

          points.forEach(point => {
            let px, py
            if (Array.isArray(point)) {
              px = point[0]
              py = point[1]
            } else if (point.x !== undefined && point.y !== undefined) {
              px = point.x
              py = point.y
            }

            minX = Math.min(minX, px)
            minY = Math.min(minY, py)
            maxX = Math.max(maxX, px)
            maxY = Math.max(maxY, py)
          })

          regionData = {
            x: minX,
            y: minY,
            w: maxX - minX,
            h: maxY - minY
          }
        }
      } else if (region.type === "point") {
        // For points, create a small region around the point
        regionData = {
          x: region.x - 0.01, // Small offset for better visibility
          y: region.y - 0.01,
          w: 0.02,            // Small width/height
          h: 0.02
        }
      } else if (region.type === "line" || region.type === "scale") {
        // For lines, focus on the starting point (x1, y1) instead of the middle
        regionData = {
          x: region.x1 - 0.01, // Small offset for better visibility
          y: region.y1 - 0.01,
          w: 0.02,            // Small width/height like points
          h: 0.02
        }
      } else if (region.type === "keypoints") {
        // For keypoints, calculate the bounding box
        const points = region.points || {}
        const pointArray = Object.values(points)

        if (pointArray.length > 0) {
          let minX = 1, minY = 1, maxX = 0, maxY = 0

          pointArray.forEach(point => {
            minX = Math.min(minX, point.x)
            minY = Math.min(minY, point.y)
            maxX = Math.max(maxX, point.x)
            maxY = Math.max(maxY, point.y)
          })

          regionData = {
            x: minX,
            y: minY,
            w: maxX - minX,
            h: maxY - minY
          }
        } else {
          // Fallback for empty keypoints
          regionData = {
            x: 0.4,
            y: 0.4,
            w: 0.2,
            h: 0.2
          }
        }
      } else {
        // Default fallback for other region types
        regionData = {
          x: 0.4,
          y: 0.4,
          w: 0.2,
          h: 0.2
        }
      }

      // First just set the panToRegion with the target region ID,
      // but don't highlight it yet - we'll do that after panning
      return setIn(state, ["panToRegion"], {
        regionId: region.id,
        shouldHighlight: true, // Flag to indicate this region should be highlighted after panning
        ...regionData
      })
    }
    case "CLEAR_PAN_TO_REGION": {
      // Only clear the panning state, don't modify region highlighting
      return setIn(state, ["panToRegion"], null)
    }
    case "HIGHLIGHT_REGION_AFTER_PAN": {
      const { regionId } = action
      if (!regionId || !activeImage) return state

      // Now highlight the region
      return setIn(
        state,
        [...pathToActiveImage, "regions"],
        (activeImage.regions || []).map((r) => ({
          ...r,
          highlighted: r.id === regionId,
          editingLabels: r.id === regionId
        }))
      )
    }
    case "BULK_EDIT_DEVICE_NAME_AND_CATEGORY": {
      const { oldName, newName, category } = action
      let newState = { ...state }
      
      // Get the color for this category
      const color = getColorByCategory(newState, category)

      // Update all images
      let newImages = getIn(newState, ["images"]) || []
      newImages = newImages.map((image) => {
        let newRegions = image.regions || []
        newRegions = newRegions.map(region => {
          if (region.cls === oldName) {
            return {
              ...region,
              cls: newName,
              category: category,
              color: color
            }
          }
          return region
        })
        return setIn(image, ["regions"], newRegions)
      })
      
      // Update device list
      const deviceList = getIn(newState, ["deviceList"])
      const newDevicesToSave = getIn(newState, ["newDevicesToSave"])
      
      // Remove old device from device list
      const filteredDeviceList = deviceList.filter(device => device.symbol_name !== oldName)
      const filteredNewDevicesToSave = newDevicesToSave.filter(device => device.symbol_name !== oldName)
      
      // Add new device to device list
      const newDevice = {
        symbol_name: newName,
        category: category,
        user_defined: true,
      }
      
      newState = setIn(newState, ["deviceList"], [newDevice, ...filteredDeviceList])
      newState = setIn(newState, ["newDevicesToSave"], [newDevice, ...filteredNewDevicesToSave])
      newState = setIn(newState, ["images"], newImages)
      
      // Update selected device if it was the one being edited
      if (newState.selectedCls === oldName) {
        newState = setIn(newState, ["selectedCls"], newName)
        newState = setIn(newState, ["selectedCategory"], category)
      }
      
      return newState
    }

    case "CHANGE_DEVICE_NAME": {
      const { oldName, newName } = action

      // Find all regions with the old device name and update them
      let newState = state

      // Get the current image
      const { currentImageIndex, activeImage } = getActiveImage(state)
      if (!activeImage) return state

      // Update all regions with the matching device name
      const updatedRegions = (activeImage.regions || []).map(region => {
        if (region.cls === oldName) {
          return {
            ...region,
            cls: newName
          }
        }
        return region
      })

      // Set the updated regions in the state
      newState = setIn(
        newState,
        ["images", currentImageIndex, "regions"],
        updatedRegions
      )

      // Save to history
      return saveToHistory(newState, `Renamed device "${oldName}" to "${newName}"`)
    }
    case "SET_OCR_THRESHOLD": {
      return setIn(state, ["ocrThreshold"], action.threshold)
    }
    case "TOGGLE_REGIONS_VISIBILITY": {
      let newState = { ...state }
      let newImage = getIn(newState, ["images", currentImageIndex])
      let newRegions = getIn(newState, ["images", currentImageIndex, "regions"])
      let hideRegions = getIn(newState, ["hideRegions"]) || false

      // Toggle the hideRegions state
      newState = setIn(newState, ["hideRegions"], !hideRegions)

      if (!newRegions) {
        return newState
      }

      // When toggling ON (hiding regions), mark existing regions as dimmed
      if (!hideRegions) {
        const timestamp = Date.now() // Use timestamp to mark existing regions
        newRegions = newRegions.map(region => ({
          ...region,
          createdAt: region.createdAt || timestamp,
          dimmed: true
        }))
      } else {
        // When toggling OFF, remove dimmed flag from all regions
        newRegions = newRegions.map(region => ({
          ...region,
          dimmed: false
        }))
      }

      newImage = setIn(newImage, ["regions"], newRegions)
      newState = setIn(newState, ["images", currentImageIndex], newImage)
      return newState
    }
    case "TOGGLE_REGION_LABELS_VISIBILITY": {
      let newState = { ...state }
      let hideRegionLabels = getIn(newState, ["hideRegionLabels"]) || false

      // Toggle the hideRegionLabels state
      newState = setIn(newState, ["hideRegionLabels"], !hideRegionLabels)
      return newState
    }
    default:
      break
  }
  return state
}
