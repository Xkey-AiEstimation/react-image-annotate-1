// @flow
import { Grid, TextField, Tooltip, Typography } from "@material-ui/core"
import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import Paper from "@material-ui/core/Paper"

import { makeStyles } from "@material-ui/core/styles"
import AddIcon from "@material-ui/icons/Add"
import CheckIcon from "@material-ui/icons/Check"
import TrashIcon from "@material-ui/icons/Delete"
import ImageSearchIcon from "@material-ui/icons/ImageSearch"
import InfoIcon from "@material-ui/icons/Info"
import LinearScaleIcon from "@material-ui/icons/LinearScale"
import classnames from "classnames"
import React, { memo, useEffect, useRef, useState } from "react"
import Select from "react-select"
import CreatableSelect from "react-select/creatable"
import { asMutable } from "seamless-immutable"
import { getColorByCategory } from "../Annotator/reducers/general-reducer.js"
import type { Region } from "../ImageCanvas/region-tools.js"
import BreakoutSection from "./BreakoutSection.js"
import DeviceList from "./DeviceList"
import styles from "./styles"

const useStyles = makeStyles(styles)

type Props = {
  region: Region,
  editing?: boolean,
  allowedClasses?: Array<string>,
  allowedTags?: Array<string>,
  cls?: string,
  tags?: Array<string>,
  imageSrc?: string,
  pageIndex: number,
  regionTemplateMatchingDisabled?: boolean,
  onDelete: (Region) => null,
  onChange: (Region) => null,
  onClose: (Region) => null,
  onOpen: (Region) => null,
  onMatchTemplate: (Region) => null,
  finishMatchTemplate: (Region, PageProperties) => null,
  onRegionClassAdded: (cls) => any,
  allowComments?: boolean,
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

export const RegionLabel = ({
  region,
  regions,
  editing,
  allowedClasses,
  allowedTags,
  imageSrc,
  pageIndex,
  regionTemplateMatchingDisabled,
  onDelete,
  onChange,
  onChangeNewRegion,
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
  disableAddingClasses = false,
}: Props) => {
  const classes = useStyles()
  const [openBreakout, setOpenBreakout] = React.useState(false)

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
  const max = 1000

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
    if (region.type === "line") {
      if (region.length_ft !== undefined) {
        setRelativeLineLengthFt(region.length_ft)
      } else {
        if (scales.length !== 0) {
          const relativeLineLength = Math.sqrt(
            (region.x1 - region.x2) ** 2 + (region.y1 - region.y2) ** 2
          )
          if (averageTotalScale !== 0) {
            setRelativeLineLengthFt(relativeLineLength / averageTotalScale)
          }
        } else {
          setRelativeLineLengthFt(0)
        }
      }
    }
  }, [scales, region])
  const isNumeric = (str) => {
    return !isNaN(str) && str.trim() !== "" && str !== null
  }
  const changeScaleHandler = (e) => {
    // check if e.value is a number and if it is  >0
    if (isNaN(e.value) || Number(e.value) < 0) {
      setScaleInputVal(1)
      return
    }

    if (Number(e.value) > max) {
      setScaleInputVal(max)
    } else if (Number(e.value) < min) {
      setScaleInputVal(min)
    } else {
      setScaleInputVal(Number(e.value))
    }
  }

  const [deviceOptions, setDeviceOptions] = useState(undefined)
  const [isNewDevice, setIsNewDevice] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState({
    value: "NOT CLASSIFIED",
    label: "NOT CLASSIFIED",
  })
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [categories, setCategories] = useState([])

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

    const categoryOptions = [
      ...new Set(DeviceList.map((device) => device.category)),
    ].map((category) => ({
      label: category,
      value: category,
    }))

    const device = mutableDeviceList.find(
      (device) => device.symbol_name === region.cls
    )
    if (device) {
      setSelectedDevice({
        label: device.symbol_name,
        value: device.id || null,
        id: device.id,
        user_defined: device.user_defined,
      })
      setSelectedCategory({
        label: region.category || "NOT CLASSIFIED",
        value: region.category || "NOT CLASSIFIED",
      })
      setCanChangeCategory(device.user_defined)
    } else {
      setSelectedDevice({
        label: region.cls,
        value: region.id || null,
        id: region.id,
        user_defined: false,
      })
    }

    setCategories(categoryOptions)
    setDeviceOptions(deviceOptions)
  }, [devices, region])

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
      color: getColorByCategory(category),
    })
  }

  const updateDeviceCategory = (category) => {
    dispatch({
      type: "UPDATE_DEVICE_CATEGORY_ON_ALL_REGIONS_BY_SYMBOL_NAME_AND_CATEGORY_USER_DEFINED",
      symbol_name: selectedDevice.label,
      category: category,
    })
  }

  const onSelectCategory = (e) => {
    const category = e.value
    setSelectedCategory(e)

    if (isNewDevice) {
      onChangeNewRegion({
        ...region,
        symbol_name: selectedDevice,
        category: category,
        // color: getColorByCategory(category),
      })
    } else {
      const device = devices.find((device) => device.symbol_name === region.cls)
      device?.user_defined
        ? updateDeviceCategory(category)
        : updateRegionCategory(category)
    }
  }

  const onSaveNewDevice = () => {
    setIsNewDevice(false)
    return onChangeNewRegion({
      ...region,
      symbol_name: selectedDevice,
      category: selectedCategory.value,
      color: getColorByCategory(category),
    })
  }

  const regionLabelDescription = ` Note: If you don't see the device you are looking for, you can add it
  to the list. If you are unsure of the category, please select "NOT
  CLASSIFIED". Only user defined devices can have their category
  changed.`

  const regionDeviceInfo =
    "If you don't see the device you are looking for, you can add it to the list simply by typing the device name."

  const regionLabelCategoryInfo = `Only user defined devices can have their system changed. Changing the system will update all regions with the same device name.`
  const regionLabelExtra =
    "Only user defined devices can have their category changed."

  const conditionalRegionTextField = (region, regionType) => {
    if (regionType === "scale") {
      const values = [
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
      ]
      // do scale
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div>
            min = {min} ft, max = {max} ft
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
          {/* <TextField
            id="outlined-number"
            type="number"
            fullWidth
            InputProps={{
              inputProps: {
                min,
                max,
                step: "1",
                style: { textAlign: "right" },
              },
              className: classes.textfieldClass,
              endAdornment: <InputAdornment position="end"> ft</InputAdornment>,
            }}
            variant="outlined"
            onChange={changeScaleHandler}
            value={scaleInputVal}
          /> */}
          <Button
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
          </Button>
        </div>
      )
    } else if (regionType === "line") {
      // do line
      return (
        <>
          <CreatableSelect
            placeholder="Conduit"
            onChange={(o, actionMeta) => {
              if (actionMeta.action === "create-option") {
                onRegionClassAdded(o.value)
              }
              return onChange({
                ...(region: any),
                cls: o.value,
              })
            }}
            value={region.cls ? { label: region.cls, value: region.cls } : null}
            options={asMutable(
              allowedClasses
                .filter((x) => !all_symbols.includes(x))
                .concat(conduit_symbols)
                .map((c) => ({ value: c, label: c }))
            )}
          />
          {relativeLineLengthFt === 0 ? (
            <div>No Scales Found</div>
          ) : (
            <div>{relativeLineLengthFt.toFixed(2)} ft</div>
          )}
        </>
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
              System:
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

          <Select
            placeholder="Select Category"
            isDisabled={!canChangeCategory}
            onChange={(e) => {
              onSelectCategory(e)
            }}
            value={selectedCategory}
            options={categories}
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
        </>
      )
    }
  }

  return (
    <>
      <Paper
        onClick={() => (!editing ? onOpen(region) : null)}
        className={classnames(classes.regionInfo, {
          highlighted: region.highlighted,
        })}
        style={{
          minWidth: 300,
          maxWidth: 300,
        }}
      >
        {!editing ? (
          <div>
            {region.cls && (
              <div className="name">
                {region.type === "scale" ? (
                  <LinearScaleIcon style={{ color: region.color }} />
                ) : (
                  <div
                    className="circle"
                    style={{ backgroundColor: region.color }}
                  />
                )}

                {region.type === "scale" ? (
                  <div>{region.cls} ft</div>
                ) : (
                  <div>{region.cls}</div>
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
          <div style={{ maxWidth: 300 }}>
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
                {region.type !== "scale" &&
                  region.cls &&
                  (region.breakout === undefined ||
                    (region.breakout &&
                      region.breakout.is_breakout === false)) && (
                    <IconButton
                      disabled={isTemplateMatchingLoading}
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
                      onClick={() => setOpenBreakout((open) => !open)}
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
                  )}

                {region.cls && region.type === "box" ? (
                  <IconButton
                    disabled={isTemplateMatchingLoading}
                    onClick={() => {
                      setIsTemplateMatchingLoading(true)
                      // TODO: get user_id, doc_id, page_id, threshold from the parent component above annotator
                      let page_properties = {
                        user_id: 80808080,
                        doc_id: 80808080,
                        page_id: 80808080,
                        threshold: 0.8,
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
                                breakoutList.find(
                                  (b) => b.id === selectedBreakoutIdAutoAdd
                                )) ||
                              (region && region.breakout)
                            new_region["category"] =
                              region?.category ||
                              DeviceList.find(
                                (x) => x.symbol_name === region.cls
                              )?.category ||
                              "NOT CLASSIFIED"
                            return new_region
                          })
                          finishMatchTemplate(results, page_properties)
                          setIsTemplateMatchingLoading(false)
                        })
                        .catch((error) => {
                          console.error("Error:", error)
                          finishMatchTemplate([], page_properties)
                          setIsTemplateMatchingLoading(false)
                        })
                    }}
                    tabIndex={-1}
                    style={{
                      backgroundColor: "#4CAF50",
                      color: "white",
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
                    <ImageSearchIcon
                      style={{ marginTop: -4, width: 16, height: 16 }}
                    />
                    <div
                      style={{
                        fontSize: "12px",
                      }}
                    >
                      OCR
                    </div>
                  </IconButton>
                ) : null}

                <IconButton
                  disabled={isTemplateMatchingLoading}
                  onClick={() => {
                    onDelete(region)
                  }}
                  tabIndex={-1}
                  style={{}}
                  size="small"
                  variant="outlined"
                  color="secondary"
                >
                  <TrashIcon style={{ marginTop: -4, width: 16, height: 16 }} />
                </IconButton>
              </div>
            </div>
            {(allowedClasses || []).length > 0 && (
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
              region.breakout &&
              region.breakout.is_breakout && (
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

      {openBreakout && (
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
    prevProps.selectedBreakoutIdAutoAdd === nextProps.selectedBreakoutIdAutoAdd
)
