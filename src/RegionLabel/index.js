// @flow
import {
  Box,
  createGenerateClassName,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
  Tooltip,
  Typography
} from "@material-ui/core"
import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import Paper from "@material-ui/core/Paper"

import { makeStyles, withStyles } from "@material-ui/core/styles"
import AddIcon from "@material-ui/icons/Add"
import TrashIcon from "@material-ui/icons/Delete"
import ImageSearchIcon from "@material-ui/icons/ImageSearch"
import InfoIcon from "@material-ui/icons/Info"
import LinearScaleIcon from "@material-ui/icons/LinearScale"
import classnames from "classnames"
import React, { memo, useEffect, useMemo, useRef, useState } from "react"
import Select from "react-select"
import CreatableSelect from "react-select/creatable"
import { asMutable } from "seamless-immutable"
import {
  AIE_CATEGORIES,
  defaultColor,
  defaultSystem,
  disableBreakoutSubscription,
  disableMultiPageOCR,
  subTypes,
} from "../Annotator/constants.js"
import {
  getColorByCategory,
  NOT_CLASSIFED,
} from "../Annotator/reducers/general-reducer.js"
import type { Region } from "../ImageCanvas/region-tools.js"
import BreakoutSection from "./BreakoutSection.js"
import DeviceList from "./DeviceList"
import styles from "./styles"
// import { ColorPicker } from "material-ui-color"
import generalReducer, { calculateLineLengthFt } from '../Annotator/reducers/general-reducer'

const useStyles = makeStyles(styles)

const RedOCRToggleSwitch = withStyles({
  switchBase: {
    "&$checked": {
      color: "#FF0000",
    },
    "&$checked + $track": {
      backgroundColor: "#FF0000",
    },
  },
  checked: {},
  track: {},
})(Switch)

type Props = {
  region: Region,
  editing?: boolean,
  allowedClasses?: Array<string>,
  allowedTags?: Array<string>,
  cls?: string,
  tags?: Array<string>,
  imageSrc?: string,
  imageSrcs?: Array<string>,
  pageIndex: number,
  regionTemplateMatchingDisabled?: boolean,
  onDelete: (Region) => null,
  onChange: (Region) => null,
  onClose: (Region) => null,
  onOpen: (Region) => null,
  onMatchTemplate: (Region) => null,
  finishMatchTemplate: (Region, PageProperties, ocr_type) => null,
  onRegionClassAdded: (cls) => any,
  allowComments?: boolean,
  breakoutList: Array<Region>,
  selectedBreakoutIdAutoAdd: string,
  dispatch: any,
  devices: Array<Region>,
  categories: Array<string>,
  categoriesColorMap: any,
  disableAddingClasses?: boolean,
  subType: string,
  imageWidth: number,
  imageHeight: number,
  simplifiedView?: boolean,
  ocrThreshold?: number,
}

const all_types = [...new Set(DeviceList.map((pair) => pair.category))]
const all_symbols = [...new Set(DeviceList.map((pair) => pair.symbol_name))]
const allowed_conduit_type = [
  "FEEDERS",
  "CABLE",
  "TRAY",
  "WIREMOLD",
  "CONDUIT AND WIRE",
]
const allowed_device_type = all_types.filter(
  (x) => !allowed_conduit_type.includes(x)
)
const conduit_symbols = DeviceList.filter((i) =>
  allowed_conduit_type.includes(i.category)
).map((symbol) => symbol.symbol_name)
const device_symbols = DeviceList.filter((i) =>
  allowed_device_type.includes(i.category)
).map((symbol) => symbol.symbol_name)
const getRandomId = () => Math.random().toString().split(".")[1]

const encodeAzureURL = (url) => {
  var first = url.substring(0, url.lastIndexOf("/"))
  var parts = url.split("/")
  var part = parts[parts.length - 1]
  return first + "/" + encodeURIComponent(part)
}

const generateClassName = createGenerateClassName({
  seed: "ColorPicker--",
})

export const RegionLabel = ({
  region,
  regions,
  editing,
  allowedClasses,
  allowedTags,
  imageSrc,
  imageSrcs,
  pageIndex,
  regionTemplateMatchingDisabled,
  onDelete,
  onChange,
  onChangeNewRegion,
  onAddNewCategory,
  onClose,
  onOpen,
  onMatchTemplate,
  finishMatchTemplate,
  onRegionClassAdded,
  allowComments,
  breakoutList,
  selectedBreakoutIdAutoAdd,
  dispatch,
  devices,
  categories,
  categoriesColorMap,
  disableAddingClasses = false,
  subType,
  imageWidth,
  imageHeight,
  simplifiedView = false,
  ocrThreshold,
}: Props) => {
  const classes = useStyles()
  const [openBreakout, setOpenBreakout] = React.useState(false)

  const isBreakoutDisabled = React.useMemo(() => {
    return disableBreakoutSubscription.includes(subType)
  }, [region])

  const commentInputRef = useRef(null)
  const onCommentInputClick = (_) => {
    // The TextField wraps the <input> tag with two divs
    const commentInput = commentInputRef.current.children[0].children[0]

    if (commentInput) return commentInput.focus()
  }
  const [isTemplateMatchingLoading, setIsTemplateMatchingLoading] =
    React.useState(regionTemplateMatchingDisabled)

  const [scales, setScales] = useState(
    region.type === "line" ? regions.filter((r) => r.type === "scale") : []
  )

  const [averageTotalScale, setAverageTotalScale] = useState(0)

  const initialRelativeLineLengthFt =
    (region.type === "line" || region.type === "scale") && region.length_ft
      ? region.length_ft
      : 0

  const [relativeLineLengthFt, setRelativeLineLengthFt] = useState(
    initialRelativeLineLengthFt
  )

  const [scaleInputVal, setScaleInputVal] = useState(
    region.type === "scale" ? region.cls : "1"
  )

  const min = 1
  // const max = 1000
  const values = [
    {
      value: 1,
      label: 1,
    },
    {
      value: 2,
      label: 2,
    },
    {
      value: 3,
      label: 3,
    },
    {
      value: 4,
      label: 4,
    },
    {
      value: 5,
      label: 5,
    },
    {
      value: 6,
      label: 6,
    },
    {
      value: 7,
      label: 7,
    },
    {
      value: 8,
      label: 8,
    },
    {
      value: 9,
      label: 9,
    },
    {
      value: 10,
      label: 10,
    },
    {
      value: 20,
      label: 20,
    },
    {
      value: 30,
      label: 30,
    },
    {
      value: 40,
      label: 40,
    },
    {
      value: 50,
      label: 50,
    },
    {
      value: 100,
      label: 100,
    },
    {
      value: 1000,
      label: 1000
    }
  ]

  const shouldDisableMultiPageOCR = useMemo(() => {
    // Return true (disabled) if subType is null/undefined
    if (!subType) {
      return true;
    }

    const isMultiPageOcrDisabled = disableMultiPageOCR.includes(subType)
    return isMultiPageOcrDisabled
  }, [subType])

  useEffect(() => {
    if (region.type === "line") {
      const imageScales = regions.filter((r) => r.type === "scale") || []
      setScales(imageScales)
      const scaleValues = []
      imageScales.map((scale) => {
        let scaleVal = parseFloat(scale["cls"])
        if (scaleVal > 0) {
          scaleValues.push(
            Math.sqrt(
              (scale["x1"] - scale["x2"]) ** 2 +
              (scale["y1"] - scale["y2"]) ** 2
            ) / scaleVal
          )
        }
      })
      if (scaleValues.length > 0) {
        setAverageTotalScale(
          scaleValues.reduce((a, b) => a + b, 0) / scaleValues.length
        )
      } else {
        setAverageTotalScale(0)
      }
    }
  }, [regions, region])

  useEffect(() => {
    if (region.type !== "line") return;

    if (region.length_ft !== undefined) {
      setRelativeLineLengthFt(region.length_ft);
      return;
    }

    if (!imageWidth || !imageHeight || scales.length === 0) {
      setRelativeLineLengthFt(0);
      return;
    }

    const scaleRegions = regions.filter((r) => r.type === "scale");
    const relativeLineLength = calculateLineLengthFt(region, imageWidth, imageHeight, scaleRegions);

    setRelativeLineLengthFt(relativeLineLength || 0);
  }, [scales, region, imageWidth, imageHeight]);



  const isNumeric = (str) => {
    return !isNaN(str) && str.trim() !== "" && str !== null
  }
  const changeScaleHandler = (e) => {
    // check if e.value is a number and if it is >0
    let newValue = e.value;

    if (isNaN(newValue) || Number(newValue) < 0) {
      newValue = min;
    } else if (Number(newValue) < min) {
      newValue = min;
    }

    setScaleInputVal(newValue);

    // Immediately update the region with the new scale value
    onChange({
      ...region,
      cls: newValue.toString()
    });

    if (onClose) {
      onClose(region);
    }
  }

  const [deviceOptions, setDeviceOptions] = useState(undefined)
  const [conduitOptions, setConduitOptions] = useState(undefined)
  const [isNewDevice, setIsNewDevice] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState({
    value: "NOT CLASSIFIED",
    label: "NOT CLASSIFIED",
  })
  const [selectedDevice, setSelectedDevice] = useState({
    value: "NOT CLASSIFIED",
    label: "NOT CLASSIFIED",
  })
  const [userCategories, setUserCategories] = useState(
    categories || AIE_CATEGORIES
  )

  const [canChangeCategory, setCanChangeCategory] = useState(false)

  // cam only change category if the region is user defined
  useEffect(() => {
    const mutableDeviceList = [...devices]

    const userDefinedDevices = mutableDeviceList.filter(
      (device) => device.user_defined
    )
    const nonUserDefinedDevices = mutableDeviceList.filter(
      (device) => !device.user_defined
    )
    const nonUserDefinedConduits = [...nonUserDefinedDevices]

    const userDefinedDeviceOptions = userDefinedDevices.map((device) => ({
      label: device.symbol_name,
      value: device.id,
      id: device.id,
      user_defined: device.user_defined,
    }))

    const nonUserDefinedDeviceOptions = nonUserDefinedDevices.map((device) => ({
      label: device.symbol_name,
      value: device.id,
      id: device.id,
      user_defined: device.user_defined,
    }))

    const nonUserDefinedConduitOptions = nonUserDefinedConduits
      .filter((device) => conduit_symbols.includes(device.symbol_name))
      .map((device) => ({
        label: device.symbol_name,
        value: device.id,
        id: device.id,
        user_defined: device.user_defined,
      }))

    const deviceOptions = [
      {
        label: "User Defined Devices",
        options: userDefinedDeviceOptions,
      },
      {
        label: "Xkey Standard Devices",
        options: nonUserDefinedDeviceOptions,
      },
    ]

    const xkeyConduitOptions = [
      {
        label: "User Defined Devices",
        options: userDefinedDeviceOptions,
      },
      {
        label: "Xkey Standard Conduits",
        options: nonUserDefinedConduitOptions,
      },
    ]

    const categoryOptions = [
      ...new Set(DeviceList.map((device) => device.category)),
    ].map((category) => ({
      label: category,
      value: category,
    }))

    const categoryList = [...categories]

    const options = categoryList.map((category) => ({
      label: category,
      value: category,
    }))

    const device = mutableDeviceList.find(
      (device) => device.symbol_name === region.cls
    )

    if (device) {
      const deviceName =
        device.symbol_name === "" ||
          device.symbol_name === null ||
          device.symbol_name === undefined
          ? "NOT CLASSIFIED"
          : device.symbol_name

      setSelectedDevice({
        label: deviceName,
        value: device.id || null,
        id: device.id,
        user_defined: device.user_defined,
      })

      const categoryExists = categories.includes(device?.category)
      const selectedCategoryValue = categoryExists
        ? device?.category
        : defaultSystem

      setSelectedCategory({
        label: selectedCategoryValue,
        value: selectedCategoryValue,
      })
      setCanChangeCategory(device.user_defined && !region.isOldDevice)
    } else {
      const deviceName =
        region.cls === "" || region.cls === null || region.cls === undefined
          ? "NOT CLASSIFIED"
          : region.cls
      setSelectedDevice({
        label: deviceName,
        value: deviceName,
        id: region.id,
        user_defined: false,
      })
      const categoryExists = categories.includes(device?.category)
      const selectedCategoryValue = categoryExists
        ? device?.category
        : defaultSystem
      setSelectedCategory({
        label: selectedCategoryValue,
        value: selectedCategoryValue,
      })
      setCanChangeCategory(region?.isOldDevice ? false : true)
    }

    if (options.length > 0) {
      setUserCategories(options)
    } else {
      if (
        // check sub type
        subType === subTypes.standardEditionYearly
      )
        setUserCategories([])
      else {
        setUserCategories(categoryOptions)
      }
    }

    setDeviceOptions(deviceOptions)
    setConduitOptions(xkeyConduitOptions)
  }, [devices, region, categories])

  const onChangeNewDevice = (newDevice) => {
    return onChange({
      ...region,
      cls: newDevice.symbol_name,
      category: newDevice.category,
    })
  }

  const createNewDevice = (label) => ({
    symbol_name: label,
    category: "NOT CLASSIFIED",
    id: getRandomId(),
  })

  const setCategory = (category) =>
    setSelectedCategory({
      value: category,
      label: category,
    })

  const onDeviceAdd = (isActionCreate, label, value) => {
    setSelectedDevice({
      label: label,
      value: value,
    })

    if (isActionCreate) {
      setIsNewDevice(true)
      const newDevice = createNewDevice(label)
      setCategory("NOT CLASSIFIED")
      setCanChangeCategory(true)
      return onChangeNewDevice(newDevice)
    } else {
      setIsNewDevice(false)
      const device = devices.find((device) => device.symbol_name === label)
      if (device) {
        setCategory(device.category)
        setCanChangeCategory(device.user_defined)
      }
      return onChange({
        ...region,
        cls: label,
      })
    }
  }

  const updateRegionCategory = (category) => {
    onChange({
      ...region,
      category: category,
      color: categoriesColorMap[category] || defaultColor,
    })
  }

  const updateUserCreatedDeviceCategory = (category) => {
    dispatch({
      type: "UPDATE_DEVICE_CATEGORY_ON_ALL_REGIONS_BY_SYMBOL_NAME_AND_CATEGORY_USER_DEFINED",
      symbol_name: selectedDevice.label,
      category: category,
    })
  }

  const [selectedColor, setSelectedColor] = useState(region.color)
  const [isNewCategory, setIsNewCategory] = useState(false)

  const onSelectCategoryColor = (category) => {
    setSelectedCategory({
      value: category,
      label: category,
    })
    return onChange({
      ...region,
      category: category,
      color: getColorByCategory(generalReducer, category),
    })
  }

  const onSelectCategory = (e, isNewCategory) => {
    const category = e.value
    setSelectedCategory(e)

    if (isNewCategory) {
      setIsNewCategory(true)
      onAddNewCategory(category)
    }

    if (isNewDevice) {
      onChangeNewRegion({
        ...region,
        symbol_name: selectedDevice,
        category: category,
      })
      setIsNewDevice(false)
    } else {
      const device = devices.find((device) => device.symbol_name === region.cls)
      device?.user_defined
        ? updateUserCreatedDeviceCategory(category)
        : updateRegionCategory(category)
    }
  }

  // const handleColorChange = (color) => {
  //   setSelectedColor(color)
  //   onAddNewCategory(selectedCategory.value, color)
  // }

  const handleSaveSystemWithCategory = (e) => {
    e.preventDefault()
    onAddNewCategory(selectedCategory.value, selectedColor)
    dispatch({
      type: "UPDATE_REGION_COLOR",
      region: region,
      color: selectedColor,
    })
  }

  // const onSaveNewDevice = () => {
  //   setIsNewDevice(false)
  //   return onChangeNewRegion({
  //     ...region,
  //     symbol_name: selectedDevice,
  //     category: selectedCategory.value,
  //     color: getColorByCategory(category),
  //   })

  //
  const [sketchPickerColor, setSketchPickerColor] = useState(
    region.color || categoriesColorMap[selectedCategory.value] || defaultColor
  )
  const [openToolMap, setOpenToolMap] = useState(false)

  const handleToolTipClick = () => {
    setOpenToolMap(!openToolMap)
  }

  const handleColorChangeComplete = (color) => {
    setSketchPickerColor(color.hex)
    dispatch({
      type: "CHANGE_CATEGORY_COLOR",
      category: selectedCategory.value,
      color: color.hex,
    })
  }

  // Function to determine the text color based on the background color
  const getTextForColorPicker = (backgroundColor) => {
    const hexColor = backgroundColor.replace("#", "")
    const r = parseInt(hexColor.substring(0, 2), 16)
    const g = parseInt(hexColor.substring(2, 4), 16)
    const b = parseInt(hexColor.substring(4, 6), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 125 ? "black" : "white"
  }

  const regionLabelDescription = ` Note: If you don't see the device you are looking for, you can add it
  to the list. If you are unsure of the category, please select "NOT
  CLASSIFIED". Only user defined devices can have their category
  changed.`

  const regionDeviceInfo =
    "If you don't see the device you are looking for, you can add it to the list simply by typing the device name."

  const regionLabelCategoryInfo = `Only user defined devices can have their category changed. Changing the category will update all regions with the same device name.`
  const regionLabelExtra =
    "Only user defined devices can have their category changed."

  const regionLabelOld =
    "This device is not in the list. It may have been deleted, renamed, or is outdated. Please add it to the list to modify it."

  const conditionalRegionTextField = (region, regionType) => {
    if (regionType === "scale") {

      // do scale
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div>
            <div>Current Scale Length: {region.cls} ft</div>
            <div>Min = {min} ft, Max = any ft.</div>
          </div>
          <CreatableSelect
            placeholder="Length"
            onChange={(o, actionMeta) => {
              changeScaleHandler(o)
            }}
            components={{
              DropdownIndicator: (props) => (
                <div
                  style={{
                    marginRight: "8px",
                  }}
                  {...props}
                >
                  ft
                </div>
              ),
              IndicatorSeparator: () => null,
            }}
            value={
              scaleInputVal ? { label: scaleInputVal, value: region.id } : null
            }
            options={values}
          />
          {/* <Button
            style={{
              marginTop: "10px",
              marginLeft: "8px",
              backgroundColor: "#1DA1F2",
              color: "white",
            }}
            disabled={scaleInputVal < 0}
            onClick={() => {
              onChange({ ...region, cls: scaleInputVal.toString() })
              if (onClose) {
                onClose(region)
              }
            }}
            size="small"
          >
            Save Scale
          </Button> */}
        </div>
      )
    } else if (regionType === "line") {
      // do line
      return (
        <>
          {relativeLineLengthFt === undefined || relativeLineLengthFt === 0 ? (
            <div>No Scales Found: 0 ft</div>
          ) : (
            <div>Length: {relativeLineLengthFt.toFixed(2)} ft</div>
          )}
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                paddingLeft: "8px",
                paddingRight: "4px",
                paddingTop: "4px",
                fontSize: "12px",
                color: "#666",
                fontWeight: "bold",
              }}
            >
              Device:
            </div>
            <Tooltip
              title={regionDeviceInfo}
              PopperProps={{
                style: { zIndex: 9999999 },
              }}
            >
              <IconButton size="small">
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </div>
          <CreatableSelect
            // need to add a check to see if the device is already in the list of devices and if it is we cant let the user create a new device
            isValidNewOption={(inputValue, selectValue, selectOptions) => {
              // Check if the device already exists in the list

              const deviceExists = selectOptions
                .map((optionGroup) =>
                  optionGroup.options.map((device) =>
                    device.label.toLowerCase().trim()
                  )
                )
                .flat()
                .includes(inputValue.toLowerCase().trim())

              // If the device exists, return false to prevent its creation
              // If the device doesn't exist, return true to allow its creation
              return !deviceExists
            }}
            placeholder="Conduit"
            onChange={(o, actionMeta) => {
              let isActionCreate = false
              if (actionMeta.action === "create-option") {
                isActionCreate = true
              }
              onDeviceAdd(isActionCreate, o.label, o.value)
            }}
            value={selectedDevice}
            options={conduitOptions}
          />
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                paddingLeft: "8px",
                paddingRight: "4px",
                paddingTop: "4px",
                fontSize: "12px",
                color: "#666",
                fontWeight: "bold",
              }}
            >

              Category:
            </div>
            <Tooltip
              title={regionLabelCategoryInfo}
              PopperProps={{
                style: { zIndex: 9999999 },
              }}
            >
              <IconButton size="small">
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </div>
          {/* <Select
            placeholder="Select Category"
            isDisabled={!canChangeCategory}
            onChange={(e) => {
              onSelectCategory(e)
            }}
            value={selectedCategory}
            options={userCategories}
          /> */}
          <CreatableSelect
            isDisabled={!canChangeCategory}
            placeholder="Select Category or Create New"
            onChange={(o, actionMeta) => {
              let isActionCreate = false
              if (actionMeta.action === "create-option") {
                isActionCreate = true
              }
              onSelectCategory(o, isActionCreate)
            }}
            value={region.category ? selectedCategory : null}
            options={userCategories}
            styles={{
              control: (provided) => ({
                ...provided,
                borderColor: "#1DA1F2",
                "&:hover": {
                  borderColor: "#1DA1F2",
                },
              }),
              placeholder: (provided) => ({
                ...provided,
                color: "#888",
              }),
            }}
          />
          {!canChangeCategory && (
            <div
              style={{
                paddingLeft: "8px",
                paddingRight: "8px",
                paddingTop: "4px",
                fontSize: "12px",
                color: "#666",
                fontWeight: "lighter",
              }}
            >
              {regionLabelExtra}
            </div>
          )}
          {region.isOldDevice && !canChangeCategory && (
            <div>
              <div
                style={{
                  paddingLeft: "8px",
                  paddingRight: "8px",
                  paddingTop: "4px",
                  fontSize: "12px",
                  color: "#666",
                  fontWeight: "lighter",
                  color: "red",
                }}
              >
                {regionLabelOld}
              </div>
              <div>
                <IconButton
                  style={{
                    backgroundColor: "#1DA1F2",
                    color: " white",
                    borderRadius: "4px",
                    marginRight: "8px",
                    height: "22px",
                  }}
                  classes={{
                    label: {
                      display: "flex",
                      flexDirection: "row",
                      marginTop: -2,
                    },
                  }}
                  onClick={() =>
                    dispatch({
                      type: "ADD_OLD_DEVICE_TO_NEW_DEVICES",
                      device: {
                        symbol_name: region.cls,
                        category: region.category,
                        user_defined: true,
                      },
                    })
                  }
                >
                  <AddIcon
                    style={{
                      width: 16,
                      height: 16,
                    }}
                  />
                  <div
                    style={{
                      fontSize: "12px",
                    }}
                  >
                    Add to device list
                  </div>
                </IconButton>
              </div>
            </div>
          )}
        </>
        // <>
        //   <CreatableSelect
        //     placeholder="Conduit"
        //     onChange={(o, actionMeta) => {
        //       if (actionMeta.action === "create-option") {
        //         onRegionClassAdded(o.value)
        //       }
        //       return onChange({
        //         ...(region: any),
        //         cls: o.value,
        //       })
        //     }}
        //     value={region.cls ? { label: region.cls, value: region.cls } : null}
        //     options={asMutable(
        //       allowedClasses
        //         .filter((x) => !all_symbols.includes(x))
        //         .concat(conduit_symbols)
        //         .map((c) => ({ value: c, label: c }))
        //     )}
        //   />
        //   {relativeLineLengthFt === 0 ? (
        //     <div>No Scales Found</div>
        //   ) : (
        //     <div>{relativeLineLengthFt.toFixed(2)} ft</div>
        //   )}
        // </>
      )
    } else {
      // do device
      return (
        <>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                paddingLeft: "8px",
                paddingRight: "4px",
                paddingTop: "4px",
                fontSize: "12px",
                color: "#666",
                fontWeight: "bold",
              }}
            >
              Device:
            </div>
            <Tooltip
              title={regionDeviceInfo}
              PopperProps={{
                style: { zIndex: 9999999 },
              }}
            >
              <IconButton size="small">
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </div>
          <CreatableSelect
            // isValidNewOption={(inputValue, selectValue, selectOptions) => {
            //   return disableAddingClasses ? false : true
            // }}
            // need to add a check to see if the device is already in the list of devices and if it is we cant let the user create a new device
            isValidNewOption={(inputValue, selectValue, selectOptions) => {
              // Check if the device already exists in the list

              const deviceExists = selectOptions
                .map((optionGroup) =>
                  optionGroup.options.map((device) =>
                    device.label.toLowerCase().trim()
                  )
                )
                .flat()
                .includes(inputValue.toLowerCase().trim())

              // If the device exists, return false to prevent its creation
              // If the device doesn't exist, return true to allow its creation
              return !deviceExists
            }}
            placeholder="Device"
            onChange={(o, actionMeta) => {
              let isActionCreate = false
              if (actionMeta.action === "create-option") {
                isActionCreate = true
              }
              onDeviceAdd(isActionCreate, o.label, o.value)
            }}
            value={selectedDevice}
            options={deviceOptions}
          />
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                paddingLeft: "8px",
                paddingRight: "4px",
                paddingTop: "4px",
                fontSize: "12px",
                color: "#666",
                fontWeight: "bold",
              }}
            >
              Category:
            </div>
            <Tooltip
              title={regionLabelCategoryInfo}
              PopperProps={{
                style: { zIndex: 9999999 },
              }}
            >
              <IconButton size="small">
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </div>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              padding: 2,
              border: "1px solid #ccc",
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <CreatableSelect
              isDisabled={!canChangeCategory}
              placeholder="Select Category or Create New"
              onChange={(o, actionMeta) => {
                let isActionCreate = false
                if (actionMeta.action === "create-option") {
                  isActionCreate = true
                }
                onSelectCategory(o, isActionCreate)
              }}
              value={region.category ? selectedCategory : null}
              options={userCategories}
              styles={{
                control: (provided) => ({
                  ...provided,
                  borderColor: "#1DA1F2",
                  "&:hover": {
                    borderColor: "#1DA1F2",
                  },
                }),
                placeholder: (provided) => ({
                  ...provided,
                  color: "#888",
                }),
              }}
            />
            {/* <Tooltip
              interactive
              title={
                <SketchPicker
                  color={sketchPickerColor} // Use local state or fallback to props color map
                  onChangeComplete={handleColorChangeComplete} // Handle color change
                />
              }
              PopperProps={{
                disablePortal: true,
                style: { zIndex: 9999 },
              }}
              open={openToolMap}
            >
              <Button
                onClick={handleToolTipClick}
                style={{
                  backgroundColor: sketchPickerColor,
                  width: "100%",
                  height: 32,
                  borderRadius: 8,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 12,
                  marginBottom: 12,
                  color: getTextForColorPicker(sketchPickerColor),
                  fontSize: 16,
                  border: "1px solid black", // Add black outline
                }}
                startIcon={
                  <EditIcon
                    style={{ color: getTextForColorPicker(sketchPickerColor), fontSize: 16 }}
                  />
                }
              >
                Change System Color
              </Button>
            </Tooltip> */}

            {/* {isNewCategory && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  width: "100%",
                }}
              >
                <Typography sx={{ fontSize: "6px" }}>Choose color:</Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    width: "100%",
                  }}
                >
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      backgroundColor: selectedColor,
                      border: `1px solid ${selectedColor}`,
                      borderRadius: "4px",
                    }}
                  ></Box>
                  <ColorPicker
                    name="color"
                    defaultValue={defaultColor}
                    value={selectedColor}
                    onChange={(color) => {
                      setSelectedColor(color)
                    }}
                    sx={{
                      flexGrow: 1,
                      color: "black",
                    }}
                  />
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveSystemWithCategory}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Save New Device
                </Button>
              </Box>
            )} */}
          </Box>

          {/* <Select
            placeholder="Select Category"
            isDisabled={!canChangeCategory}
            onChange={(e) => {
              onSelectCategory(e)
            }}
            value={selectedCategory}
            options={userCategories}
          /> */}
          {!canChangeCategory && (
            <div
              style={{
                paddingLeft: "8px",
                paddingRight: "8px",
                paddingTop: "4px",
                fontSize: "12px",
                color: "#666",
                fontWeight: "lighter",
              }}
            >
              {regionLabelExtra}
            </div>
          )}
          {region.isOldDevice && !canChangeCategory && (
            <div>
              <div
                style={{
                  paddingLeft: "8px",
                  paddingRight: "8px",
                  paddingTop: "4px",
                  fontSize: "12px",
                  color: "#666",
                  fontWeight: "lighter",
                  color: "red",
                }}
              >
                {regionLabelOld}
              </div>
              <div>
                <IconButton
                  style={{
                    backgroundColor: "#1DA1F2",
                    color: " white",
                    borderRadius: "4px",
                    marginRight: "8px",
                    height: "22px",
                  }}
                  classes={{
                    label: {
                      display: "flex",
                      flexDirection: "row",
                      marginTop: -2,
                    },
                  }}
                  onClick={() =>
                    dispatch({
                      type: "ADD_OLD_DEVICE_TO_NEW_DEVICES",
                      device: {
                        symbol_name: region.cls,
                        category: region.category,
                        user_defined: true,
                      },
                    })
                  }
                >
                  <AddIcon
                    style={{
                      width: 16,
                      height: 16,
                    }}
                  />
                  <div
                    style={{
                      fontSize: "12px",
                    }}
                  >
                    Add to device list
                  </div>
                </IconButton>
              </div>
            </div>
          )}
        </>
      )
    }
  }

  const ocrTypes = {
    page: "page",
    project: "project",
  }

  const [isOCRProjectChecked, setIsOCRProjectChecked] = useState(false)

  const handleProjectOCR = (region) => {
    if (shouldDisableMultiPageOCR) {
      console.warn("Multi-page OCR is disabled for this project");
      return;
    }

    setIsTemplateMatchingLoading(true)
    let page_properties = {
      user_id: 80808080,
      doc_id: 80808080,
      page_id: 80808080,
      threshold: ocrThreshold || 0.8,
      page_index: pageIndex,
    }
    const region_coords = {
      x: region.x,
      y: region.y,
      w: region.w,
      h: region.h,
    }
    const region_color = region.color
    const endpoint =
      "https://htz91m7wz1.execute-api.us-east-2.amazonaws.com/default/xkey-lambda-project-ocr"
    const json_data = {
      image_urls: imageSrcs, // TODO: get all image urls from params
      image_url: imageSrc,
      page_index: page_properties["page_index"],
      template_symbol_name: region.cls,
      threshold: page_properties["threshold"],
      user_id: page_properties["user_id"],
      doc_id: page_properties["doc_id"],
      page_id: page_properties["page_id"],
      template_coord: region_coords,
      template_index: page_properties["page_index"],
      page_indices: [...Array(imageSrcs.length).keys()], // TODO: get # of pages from imageSrcs
    }
    onMatchTemplate(region)
    fetch(endpoint, {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        queryStringParameters: json_data,
      }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json()
        }
        throw new Error("Backend Error")
      })
      .then((data) => {
        // result can be empty
        return data.body ? data.body.result : []
      })
      .then((res) => {
        // TODO: result is an array of number of pages with regions
        let results = []
        for (let i = 0; i < res.length; i++) {
          let single_page_regions = res[i].map((r) => {
            const new_region = {}
            new_region["isOCR"] = true
            new_region["x"] = r["x"]
            new_region["y"] = r["y"]
            new_region["w"] = r["w"]
            new_region["h"] = r["h"]
            new_region["editingLabels"] = false
            new_region["highlighted"] = false
            new_region["id"] = getRandomId()
            new_region["cls"] = region.cls
            new_region["type"] = "box"
            new_region["color"] = region.color
            new_region["visible"] = true
            new_region["breakout"] =
              (selectedBreakoutIdAutoAdd &&
                breakoutList &&
                breakoutList.length > 0 &&
                breakoutList.find((b) => b.id === selectedBreakoutIdAutoAdd)) ||
              (region && region.breakout)
            new_region["category"] =
              region?.category ||
              DeviceList.find((x) => x.symbol_name === region.cls)?.category ||
              "NOT CLASSIFIED"
            return new_region
          })
          results.push(single_page_regions)
        }
        finishMatchTemplate(results, page_properties, "project")
        setIsTemplateMatchingLoading(false)
      })
      .catch((error) => {
        console.error("Error:", error)
        finishMatchTemplate([], page_properties, "project")
        setIsTemplateMatchingLoading(false)
      })
  }

  const handlePageOCR = (region) => {
    setIsTemplateMatchingLoading(true)
    let page_properties = {
      user_id: 80808080,
      doc_id: 80808080,
      page_id: 80808080,
      threshold: ocrThreshold || 0.8,
      page_index: pageIndex,
    }
    const region_coords = {
      x: region.x,
      y: region.y,
      w: region.w,
      h: region.h,
    }
    const region_color = region.color
    const endpoint =
      "https://6lufq8mux5.execute-api.us-east-2.amazonaws.com/default/xkey-lambda-ocr-arbiter"
    const json_data = {
      image_url: imageSrc,
      page_index: page_properties["page_index"],
      template_symbol_name: region.cls,
      threshold: page_properties["threshold"],
      user_id: page_properties["user_id"],
      doc_id: page_properties["doc_id"],
      page_id: page_properties["page_id"],
      template_coord: region_coords,
    }
    onMatchTemplate(region)
    fetch(endpoint, {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        queryStringParameters: json_data,
      }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json()
        }
        throw new Error("Backend Error")
      })
      .then((data) => {
        // result can be empty
        return data.body ? data.body.result : []
      })
      .then((res) => {
        let results = res.map((r) => {
          const new_region = {}
          new_region["isOCR"] = true
          new_region["x"] = r["x"]
          new_region["y"] = r["y"]
          new_region["w"] = r["w"]
          new_region["h"] = r["h"]
          new_region["editingLabels"] = false
          new_region["highlighted"] = false
          new_region["id"] = getRandomId()
          new_region["cls"] = region.cls
          new_region["type"] = "box"
          new_region["color"] = region.color
          new_region["visible"] = true
          new_region["breakout"] =
            (selectedBreakoutIdAutoAdd &&
              breakoutList &&
              breakoutList.length > 0 &&
              breakoutList.find((b) => b.id === selectedBreakoutIdAutoAdd)) ||
            (region && region.breakout)
          new_region["category"] =
            region?.category ||
            DeviceList.find((x) => x.symbol_name === region.cls)?.category ||
            "NOT CLASSIFIED"
          return new_region
        })
        finishMatchTemplate(results, page_properties, "page")
        setIsTemplateMatchingLoading(false)
      })
      .catch((error) => {
        console.error("Error:", error)
        finishMatchTemplate([], page_properties, "page")
        setIsTemplateMatchingLoading(false)
      })
  }

  const handleOCRTypeChange = (event) => {
    if (shouldDisableMultiPageOCR) {
      return
    }
    setIsOCRProjectChecked(event.target.checked)
  }

  const handleRunOCR = (region) => {
    if (isOCRProjectChecked && !shouldDisableMultiPageOCR) {
      handleProjectOCR(region)
    }
    if (!isOCRProjectChecked) {
      handlePageOCR(region)
    }
  }

  const shouldShowBreakoutButton = useMemo(() => {
    // Return false if subType is null/undefined
    if (!subType) {
      return false;
    }

    const isBreakoutNotIncluded = disableBreakoutSubscription.includes(subType)
    if (isBreakoutNotIncluded) {
      return false
    }

    const isValidRegionType = region.type !== "scale"
    const isNotOldDevice = !region.isOldDevice
    const isValidClass = region.cls && region.cls !== NOT_CLASSIFED
    const isBreakoutAllowed = !isBreakoutDisabled && !isTemplateMatchingLoading
    const isNotBreakout =
      region.breakout === undefined ||
      (region.breakout && !region.breakout.is_breakout)

    return (
      isValidRegionType &&
      isNotOldDevice &&
      isValidClass &&
      isBreakoutAllowed &&
      isNotBreakout
    )
  }, [
    region,
    subType,
    isBreakoutDisabled,
    isTemplateMatchingLoading,
    disableBreakoutSubscription,
  ])

  const shouldShowAIEButton = useMemo(() => {
    // Return false if subType is null/undefined
    if (!subType) {
      return false;
    }

    const isValidRegionType = region.type === "box"
    return (
      isValidRegionType && region.cls && region.cls !== NOT_CLASSIFED
    )
  }, [region, subType])

  const handleBreakoutClick = () => {
    setOpenBreakout((open) => !open)
  }

  const OCRSection = () => (
    <Box sx={{ padding: 1 }}>
      <Grid container alignItems="center" spacing={1}>
        <Grid item>
          <Typography variant="body2">Page OCR</Typography>
        </Grid>
        <Grid item>
          <RedOCRToggleSwitch
            checked={isOCRProjectChecked}
            onChange={handleOCRTypeChange}
            disabled={shouldDisableMultiPageOCR || isTemplateMatchingLoading}
          />
        </Grid>
        <Grid item>
          <Typography variant="body2">Project OCR</Typography>
        </Grid>
        {shouldDisableMultiPageOCR && (
          <Grid item>
            <Tooltip title="Multi-page OCR is disabled for this project">
              <InfoIcon color="disabled" fontSize="small" />
            </Tooltip>
          </Grid>
        )}
      </Grid>
    </Box>
  )

  if (simplifiedView && region.type === "line") {
    // Get the device/conduit name from the region
    const deviceName = region.cls && region.cls !== ""
      ? region.cls
      : "Measurement Line";

    return (
      <Paper
        className={classnames(classes.regionInfo, {
          highlighted: region.highlighted,
        })}
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "6px 10px",
          backgroundColor: "rgba(33, 33, 33, 0.85)",
          color: "#fff",
          borderRadius: 20,
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
          position: "relative",
          border: "1px solid rgba(255,255,255,0.1)",
          maxWidth: "fit-content"
        }}
      >
        <LinearScaleIcon style={{
          marginRight: 8,
          fontSize: 16,
          color: "#3CD2BC"
        }} />

        {/* Add the device/conduit name */}
        <div style={{
          fontWeight: 500,
          fontSize: 13,
          marginRight: 8,
          maxWidth: 120,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: "#fff"
        }}>
          {deviceName}
        </div>

        {/* Add a separator */}
        <div style={{
          height: 14,
          width: 1,
          backgroundColor: "rgba(255,255,255,0.3)",
          margin: "0 8px"
        }} />

        {relativeLineLengthFt !== undefined && relativeLineLengthFt > 0 ? (
          <div style={{
            fontWeight: "bold",
            color: "#3CD2BC",
            fontSize: 14,
            marginRight: 8
          }}>
            Length: {relativeLineLengthFt.toFixed(2)} ft
          </div>
        ) : (
          <div style={{
            color: "#ff9800",
            fontSize: 12,
            marginRight: 8
          }}>
            {relativeLineLengthFt === 0 ? "0 ft" : `No Scales Found`}
          </div>
        )}
      </Paper>
    )
  }

  return (
    <>
      <Paper
        onClick={() => (!editing ? onOpen(region) : null)}
        className={classnames(classes.regionInfo, {
          highlighted: region.highlighted,
        })}
        style={{
          minWidth: 400,
          maxWidth: 400,
        }}
      >
        {!editing ? (
          <div>
            {region.cls && (
              <div
                className="name"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {region.type === "scale" ? (
                  <LinearScaleIcon
                    style={{ color: region.color, marginRight: "8px" }}
                  />
                ) : (
                  <div
                    className="circle"
                    style={{ backgroundColor: region.color }}
                  />
                )}

                {region.type === "scale" ? (
                  <div>
                    <div>Current Scale Length: {region.cls} ft</div>
                  </div>
                ) : region.type === "line" ? (
                  <>
                    <div
                      style={{
                        flexGrow: 1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginRight: "8px",
                      }}
                    >
                      {region.cls === "" ||
                        region.cls === null ||
                        region.cls === undefined
                        ? "NOT CLASSIFIED"
                        : region.cls}{" "}
                    </div>
                    <div
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginLeft: "auto",
                      }}
                    >
                      {relativeLineLengthFt === 0
                        ? "No Scales Found: O ft"
                        : `Length: ${relativeLineLengthFt.toFixed(2)} ft`}
                    </div>
                  </>
                ) : (
                  <div>
                    {region.cls === "" ||
                      region.cls === null ||
                      region.cls === undefined
                      ? "NOT CLASSIFIED"
                      : region.cls}{" "}
                  </div>
                )}
              </div>
            )}
            {region.tags && (
              <div className="tags">
                {region.tags.map((t) => (
                  <div key={t} className="tag">
                    {t}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              minWidth: 300,
              maxWidth: 400,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                height: "32px",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  backgroundColor: region.color || "#888",
                  color: "#fff",
                  padding: 4,
                  paddingLeft: 8,
                  paddingRight: 8,
                  borderRadius: 4,
                  fontWeight: "bold",
                  textShadow: "0px 0px 5px rgba(0,0,0,0.4)",
                }}
              >
                {region.type}
              </div>

              {/* <div style={{ flexGrow: 1, padding: 12 }} /> */}
              <div style={{ justifyContent: "" }}>
                {shouldShowBreakoutButton && (
                  <Tooltip
                    title={"Create a breakout group for this device."}
                    PopperProps={{
                      style: { zIndex: 9999999 },
                    }}
                  >
                    <IconButton
                      disabled={isTemplateMatchingLoading}
                      style={{
                        backgroundColor: "#1DA1F2",
                        color: "white",
                        borderRadius: "4px",
                        marginRight: "8px",
                        height: "22px",
                      }}
                      classes={{
                        label: {
                          display: "flex",
                          flexDirection: "row",
                          marginTop: -2,
                        },
                      }}
                      onClick={handleBreakoutClick}
                    >
                      <AddIcon
                        style={{
                          width: 16,
                          height: 16,
                        }}
                      />
                      <div
                        style={{
                          fontSize: "12px",
                        }}
                      >
                        Breakout
                      </div>
                    </IconButton>
                  </Tooltip>
                )}

                {shouldShowAIEButton && (
                  <>
                    <Tooltip
                      title="After Annotating object or text, run AiE to search for this device."
                      PopperProps={{
                        style: { zIndex: 9999999 },
                      }}
                    >
                      <IconButton
                        disabled={isTemplateMatchingLoading}
                        onClick={() => handleRunOCR(region)}
                        tabIndex={-1}
                        style={{
                          color: "white",
                          backgroundColor: "#FF0000",
                          paddingLeft: "12px",
                          paddingRight: "12px",
                          borderRadius: "4px",
                          height: "24px",
                        }}
                        classes={{
                          label: {
                            display: "flex",
                            flexDirection: "row",
                            marginTop: -2,
                          },
                        }}
                        size="small"
                        variant="outlined"
                      >
                        <ImageSearchIcon style={{ marginTop: -4, width: 16, height: 16 }} />
                        <div style={{ fontSize: "12px" }}>Run AiE</div>
                      </IconButton>
                    </Tooltip>
                    <FormControlLabel
                      style={{
                        paddingLeft: "8px",
                        color: "black",
                      }}
                      control={
                        <RedOCRToggleSwitch
                          disabled={shouldDisableMultiPageOCR}
                          checked={isOCRProjectChecked}
                          onChange={handleOCRTypeChange}
                          color="primary"
                          name="checkedB"
                          inputProps={{ "aria-label": "primary checkbox" }}
                        />
                      }
                      label={
                        <Typography
                          style={{
                            fontSize: "12px",
                            marginLeft: "-4px",
                            color: shouldDisableMultiPageOCR ? "gray" : "black",
                          }}
                        >
                          All Pages
                        </Typography>
                      }
                    />
                  </>
                )}
                <Tooltip
                  title={"Delete Region"}
                  placement="right"
                  PopperProps={{
                    style: { zIndex: 9999999 },
                  }}
                >
                  <IconButton
                    disabled={isTemplateMatchingLoading}
                    onClick={() => {
                      onDelete(region)
                    }}
                    tabIndex={-1}
                    style={{}}
                    size="small"
                    variant="outlined"
                  >
                    <TrashIcon
                      style={{ color: "#D63230", width: 24, height: 24 }}
                    />
                  </IconButton>
                </Tooltip>
              </div>
            </div>
            {(allowedClasses || []) && (
              <div style={{ marginTop: 6 }}>
                {conditionalRegionTextField(region, region.type)}
              </div>
            )}
            {(allowedTags || []).length > 0 && (
              <div style={{ marginTop: 4 }}>
                <Select
                  onChange={(newTags) =>
                    onChange({
                      ...(region: any),
                      tags: newTags.map((t) => t.value),
                    })
                  }
                  placeholder="Tags"
                  value={(region.tags || []).map((c) => ({
                    label: c,
                    value: c,
                  }))}
                  isMulti
                  options={asMutable(
                    allowedTags.map((c) => ({ value: c, label: c }))
                  )}
                />
              </div>
            )}
            {allowComments && (
              <TextField
                InputProps={{
                  className: classes.commentBox,
                }}
                fullWidth
                multiline
                rows={3}
                ref={commentInputRef}
                onClick={onCommentInputClick}
                value={region.comment || ""}
                onChange={(event) =>
                  onChange({ ...region, comment: event.target.value })
                }
              />
            )}
            {region.type !== "scale" &&
              region.cls &&
              region.cls !== NOT_CLASSIFED &&
              region.breakout &&
              region.breakout.is_breakout &&
              !isBreakoutDisabled && (
                <div
                  style={{
                    marginTop: 4,
                    display: "flex",
                    flexDirection: "column",
                    padding: 16,
                  }}
                >
                  <Grid
                    container
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Typography
                      variant="subtitle2"
                      gutterBottom
                      style={{
                        fontWeight: "bold",
                      }}
                    >
                      Breakout Group:
                    </Typography>
                    <Button
                      onClick={() => {
                        dispatch({
                          type: "REMOVE_BREAKOUT_BY_REGION_ID",
                          region: region,
                        })
                      }}
                      tabIndex={-1}
                      style={{ fontSize: "8px" }}
                      size="small"
                      variant="outlined"
                      color="secondary"
                      startIcon={<TrashIcon />}
                    >
                      Remove
                    </Button>
                  </Grid>
                  <Typography
                    variant="body2"
                    gutterBottom
                    style={{
                      paddingLeft: 16,
                      fontSize: "12px",
                      wordBreak: "break-word",
                    }}
                  >
                    {region.breakout.name}
                  </Typography>
                </div>
              )}
            {/* {onClose && region.type !== "scale" && (
              <div style={{ marginTop: 4, display: "flex" }}>
                <div style={{ flexGrow: 1 }} />
                <Button
                  onClick={() => onClose(region)} // TODO: check icon will disable OCR for this (highlighted) region
                  size="small"
                  variant="contained"
                  color="primary"
                >
                  <CheckIcon />
                </Button>
              </div>
            )} */}
          </div>
        )}
      </Paper>

      {openBreakout && !isBreakoutDisabled && (
        <BreakoutSection
          region={region}
          dispatch={dispatch}
          setOpenBreakout={setOpenBreakout}
          breakoutList={breakoutList}
        />
      )}
    </>
  )
}

export default memo(
  RegionLabel,
  (prevProps, nextProps) =>
    prevProps.editing === nextProps.editing &&
    prevProps.region === nextProps.region &&
    prevProps.selectedBreakoutIdAutoAdd === nextProps.selectedBreakoutIdAutoAdd &&
    prevProps.imageWidth === nextProps.imageWidth &&
    prevProps.imageHeight === nextProps.imageHeight &&
    prevProps.ocrThreshold === nextProps.ocrThreshold &&
    prevProps.imageSrc === nextProps.imageSrc
)
