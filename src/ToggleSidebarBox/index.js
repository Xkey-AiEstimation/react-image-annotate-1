// @flow
import {
  Button,
  ClickAwayListener,
  FormControlLabel,
  FormGroup,
  IconButton,
  Popover,
  Switch,
  Tooltip,
  Typography,
  createTheme,
} from "@material-ui/core"
import Grid from "@material-ui/core/Grid"
import { makeStyles } from "@material-ui/core/styles"
import DashboardIcon from "@material-ui/icons/Dashboard"
import TrashIcon from "@material-ui/icons/Delete"
import LockIcon from "@material-ui/icons/Lock"
import PieChartIcon from "@material-ui/icons/PieChart"
import ReorderIcon from "@material-ui/icons/SwapVert"
import EditIcon from "@material-ui/icons/Edit"
import ToggleOnIcon from "@material-ui/icons/ToggleOn"
import isEqual from "lodash/isEqual"
import ColorPicker from "material-ui-color-picker"
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { ColorMapping } from "../RegionLabel/ColorMapping"
import DeviceList from "../RegionLabel/DeviceList"
import SidebarBoxContainer from "../SidebarBoxContainer"
import styles from "./styles"
import { SketchPicker } from "react-color"
import CloseIcon from "@material-ui/icons/Close"

const useStyles = makeStyles(styles)

const DEVICE_LIST = [...new Set(DeviceList.map((item) => item.category))]

const theme = createTheme({
  overrides: {
    MuiSwitch: {
      switchBase: {
        // Controls default (unchecked) color for the thumb
        color: "#ccc",
      },
      colorSecondary: {
        "&$checked": {
          // Controls checked color for the thumb
          color: "#f2ff00",
        },
      },
      track: {
        // Controls default (unchecked) color for the track
        opacity: 0.2,
        backgroundColor: "#fff",
        "$checked$checked + &": {
          // Controls checked color for the track
          opacity: 0.7,
          backgroundColor: "#fff",
        },
      },
    },
  },
})

Object.keys(ColorMapping).forEach(
  (device) =>
    (theme.overrides.MuiSwitch = {
      ...theme.overrides.MuiSwitch,
      [device]: {
        switchBase: {
          // Controls default (unchecked) color for the thumb
          color: "#ccc",
        },
        colorSecondary: {
          "&$checked": {
            // Controls checked color for the thumb
            color: ColorMapping[device],
          },
        },
      },
    })
)

const RowLayout = ({ visible, onClick }) => {
  const classes = useStyles()
  const [mouseOver, changeMouseOver] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => changeMouseOver(true)}
      onMouseLeave={() => changeMouseOver(false)}
    >
      <Grid container className={classes.rowContainer} alignItems="center">
        {visible}
      </Grid>
    </div>
  )
}

const RowHeader = ({
  onRegionToggle,
  regions,
  onRegionBreakout,
  isBreakoutDisabled,
  categories,
  categoriesColorMap,
  onCategoryColorChange,
}) => {
  const [categoryList, setCategoryList] = useState([...categories])
  const [regionCategorySet, setRegionCategorySet] = useState(
    new Set(regions.map((region) => region.category))
  )

  useEffect(() => {
    setRegionCategorySet(new Set(regions.map((region) => region.category)))
  }, [regions])

  const [checkedList, setCheckedList] = useState(() => {
    const categoryList = [...categories]
    return categoryList.map((category) => {
      if (regions !== undefined && regions.length > 0) {
        let matchedObject = regions.find((region) => {
          return region.category === category
        })
        return {
          item: category,
          checked: matchedObject ? matchedObject.visible : true,
        }
      }
      return {
        item: category,
        checked: true,
      }
    })
  })

  useMemo(() => {
    const categoryList = [...categories]

    const checkedList = categoryList.map((category) => {
      if (regions !== undefined && regions.length > 0) {
        let matchedObject = regions.find((region) => {
          return region.category === category
        })

        return {
          item: category,
          checked: matchedObject ? matchedObject.visible : true,
        }
      }
      return {
        item: category,
        checked: true,
      }
    })
    setCheckedList(checkedList)
  }, [categories, regions])

  const setCheckedItem = useCallback((id, checked) => {
    setCheckedList(() =>
      checkedList.map((item) =>
        item.item === id ? { ...item, checked: checked } : item
      )
    )
  })

  const handleChange = (event) => {
    onRegionToggle(event)
    setCheckedItem(event.target.id, event.target.checked)
  }

  const handleBreakout = (regionCategory) => {
    if (isBreakoutDisabled) {
      return
    }
    onRegionBreakout(regionCategory)
  }

  const handleColorChange = (color, event) => {
    const category = event.target.id
    const newColor = color.hex
    const newCategoriesColorMap = { ...categoriesColorMap }

    newCategoriesColorMap[category] = newColor
  }

  function rand() {
    return Math.round(Math.random() * 20) - 10
  }

  function getModalStyle() {
    const top = 50 + rand()
    const left = 50 + rand()

    return {
      top: `${top}%`,
      left: `${left}%`,
      transform: `translate(-${top}%, -${left}%)`,
    }
  }

  const useStyles = makeStyles((theme) => ({
    paper: {
      position: "absolute",
      width: 400,
      backgroundColor: theme.palette.background.paper,
      border: "2px solid #000",
      boxShadow: theme.shadows[5],
      padding: theme.spacing(2, 4, 3),
    },
  }))

  const classes = useStyles()
  // getModalStyle is not a pure function, we roll the style only on the first render
  const [modalStyle] = React.useState(getModalStyle)
  const [open, setOpen] = React.useState(true)

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  useEffect(() => {
    setCategoryList(categories)
  }, [categories])

  Object.keys(categoriesColorMap).forEach(
    (device) =>
      (theme.overrides.MuiSwitch = {
        ...theme.overrides.MuiSwitch,
        [device]: {
          switchBase: {
            // Controls default (unchecked) color for the thumb
            color: "#ccc",
          },
          colorSecondary: {
            "&$checked": {
              // Controls checked color for the thumb
              color: ColorMapping[device],
            },
          },
        },
      })
  )

  const body = (
    <div style={modalStyle} className={classes.paper}>
      <h2 id="simple-modal-title">Text in a modal</h2>
      <p id="simple-modal-description">
        Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
      </p>
      <RowHeader />
    </div>
  )
  // State to manage the tooltip visibility and color for each category
  const [openToolMap, setOpenToolMap] = useState({})
  const [categoryColors, setCategoryColors] = useState({})

  // Ref to track the tooltip container
  const tooltipRef = useRef(null)

  // Function to toggle tooltip visibility for a specific category
  const handleToolTipClick = (category) => {
    setOpenToolMap((prevState) => ({
      ...prevState,
      [category]: !prevState[category],
    }))
  }

  // Function to close all tooltips
  const closeAllTooltips = () => {
    setOpenToolMap({})
  }

  // Function to update the color of a category
  const handleColorChangeLocal = (color, category) => {
    setCategoryColors((prevState) => ({
      ...prevState,
      [category]: color.hex, // Store hex color value for the category
    }))
    onCategoryColorChange(category, color.hex)
  }

  // Close tooltip when clicking outside (with checks to avoid closing on tooltip content)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Prevent closing if the click is inside the tooltip or color picker container
      if (tooltipRef.current && tooltipRef.current.contains(event.target)) {
        return
      }
      closeAllTooltips()
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <RowLayout
      style={{ paddingLeft: 10 }}
      header
      highlighted={false}
      order={<ReorderIcon className="icon" />}
      classification={<div style={{ paddingLeft: 10 }}>Class</div>}
      area={<PieChartIcon className="icon" />}
      trash={<TrashIcon className="icon" />}
      lock={<LockIcon className="icon" />}
      visible={
        <div ref={tooltipRef}>
          <FormGroup>
            {categoryList.map((category, index) => {
              if (!regionCategorySet.has(category)) {
                return null
              }

              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 10,
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        style={{
                          color: "white",
                        }}
                        size="small"
                        id={category}
                        checked={
                          checkedList.find((item) => item.item === category)
                            ?.checked || false
                        }
                        onChange={handleChange}
                      />
                    }
                    label={
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ paddingRight: 10, fontSize: "0.75em" }}>
                          {category}
                        </div>
                      </div>
                    }
                  />

                  <Tooltip
                    interactive
                    title={
                      <div>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'flex-end', 
                          marginBottom: 8 
                        }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenToolMap(prev => ({
                                ...prev,
                                [category]: false
                              }));
                            }}
                            style={{ 
                              backgroundColor: 'white',
                              width: 24,
                              height: 24,
                              padding: 2,
                              color: 'black'
                            }}
                          >
                            <CloseIcon 
                              fontSize="small"
                              style={{ fontSize: 16 }}
                            />
                          </IconButton>
                        </div>
                        <SketchPicker
                          color={
                            categoryColors[category] ||
                            categoriesColorMap[category] ||
                            "#C4A484"
                          }
                          onChangeComplete={(color) =>
                            handleColorChangeLocal(color, category)
                          }
                        />
                      </div>
                    }
                    PopperProps={{
                      disablePortal: true,
                      style: { zIndex: 9999 },
                    }}
                    open={openToolMap[category] || false}
                  >
                    <IconButton
                      onClick={() => handleToolTipClick(category)}
                      style={{
                        backgroundColor:
                          categoryColors[category] ||
                          categoriesColorMap[category] ||
                          "#C4A484", // Display the correct color
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <EditIcon style={{ color: "white", fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>

                  {!isBreakoutDisabled && (
                    <Tooltip title="Add a System Breakout">
                      <IconButton
                        style={{ color: "white" }}
                        disabled={!regionCategorySet.has(category)}
                        onClick={() => handleBreakout(category)}
                      >
                        <DashboardIcon
                          style={{
                            color:
                              regions.filter(
                                (region) => region.category === category
                              ).length === 0
                                ? "grey"
                                : "white",
                            width: 20,
                            height: 20,
                          }}
                        />
                      </IconButton>
                    </Tooltip>
                  )}
                </div>
              )
            })}
          </FormGroup>
        </div>
      }
    />
  )
}

// const MemoRowHeader = memo(RowHeader)

const emptyArr = []

// const MemoRowHeader = memo(
//   RowHeader,
//   (prevProps, nextProps) =>
//     prevProps.highlighted === nextProps.highlighted &&
//     prevProps.visible === nextProps.visible &&
//     prevProps.locked === nextProps.locked &&
//     prevProps.id === nextProps.id &&
//     prevProps.index === nextProps.index &&
//     prevProps.cls === nextProps.cls &&
//     prevProps.color === nextProps.color &&
//     prevProps.region === nextProps.region
// )

export const ToggleSidebarBox = ({
  excludedCategories,
  regions,
  onRegionToggle,
  onRegionBreakout,
  isBreakoutDisabled,
  categories,
  categoriesColorMap,
  onCategoryColorChange,
}) => {
  const classes = useStyles()
  return (
    <SidebarBoxContainer
      title="Systems"
      icon={<ToggleOnIcon style={{ color: "white" }} />}
      expandedByDefault={true}
    >
      <div className={classes.container}>
        <RowHeader
          onRegionToggle={onRegionToggle}
          regions={regions}
          onRegionBreakout={onRegionBreakout}
          excludedCategories={excludedCategories}
          isBreakoutDisabled={isBreakoutDisabled}
          categories={categories}
          categoriesColorMap={categoriesColorMap}
          onCategoryColorChange={onCategoryColorChange}
        />
      </div>
    </SidebarBoxContainer>
  )
}

const mapUsedRegionProperties = (r) => [
  r.id,
  r.color,
  r.locked,
  r.visible,
  r.highlighted,
]

export default memo(
  ToggleSidebarBox,
  (prevProps, nextProps) =>
    isEqual(
      (prevProps.regions || []).map(mapUsedRegionProperties),
      (nextProps.regions || []).map(mapUsedRegionProperties)
    ) && isEqual(prevProps.categories, nextProps.categories)
)
