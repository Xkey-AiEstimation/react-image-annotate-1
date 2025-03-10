// @flow
import {
  FormControlLabel,
  FormGroup,
  IconButton,
  Switch,
  Tooltip,
  createTheme
} from "@material-ui/core"
import Grid from "@material-ui/core/Grid"
import { makeStyles } from "@material-ui/core/styles"
import CategoryIcon from "@material-ui/icons/Category"
import CloseIcon from "@material-ui/icons/Close"
import DashboardIcon from "@material-ui/icons/Dashboard"
import EditIcon from "@material-ui/icons/Edit"
import isEqual from "lodash/isEqual"
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { SketchPicker } from "react-color"
import { zIndices } from "../Annotator/constants"
import { ColorMapping } from "../RegionLabel/ColorMapping"
import DeviceList from "../RegionLabel/DeviceList"
import SidebarBoxContainer from "../SidebarBoxContainer"

const useStyles = makeStyles(theme => ({
  header: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    paddingLeft: 16,
    paddingRight: 16,
    backgroundColor: "#09090b",
    color: "#fff",
    "& .MuiIconButton-root": {
      color: "#fff"
    }
  },
  title: {
    fontSize: 14,
    fontWeight: 500,
    flexGrow: 1,
    paddingLeft: 8,
    color: "#fff"
  },
  expandButton: {
    padding: 4,
    "& .MuiSvgIcon-root": {
      fontSize: 20
    }
  },
  content: {
    padding: 8,
    backgroundColor: "#09090b",
    color: "#fff",
    maxHeight: "calc(100vh - 200px)",
    overflowY: "auto",
    "&::-webkit-scrollbar": {
      width: "8px",
      height: "8px",
    },
    "&::-webkit-scrollbar-track": {
      background: "#1e1e1e",
      borderRadius: "4px",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "#4a4a4a",
      borderRadius: "4px",
      "&:hover": {
        background: "#5a5a5a"
      }
    }
  },
  divider: {
    backgroundColor: "rgba(255, 255, 255, 0.1)"
  },
  categoryContainer: {
    display: "flex",
    alignItems: "center",
    padding: "4px 0",
  },
  checkbox: {
    padding: 0,
    width: 24,
    height: 24,
  },
  categoryRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px",
    borderRadius: 4,
    width: '100%',
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.05)"
    }
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: 0
  },
  switchControl: {
    margin: 0,
    marginRight: 4,
    "& .MuiSwitch-root": {
      padding: 4
    }
  },
  categoryLabel: {
    fontSize: 12,
    color: "#fff",
    flex: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    minWidth: 0,
    maxWidth: '150px',
    cursor: 'default'
  },
  colorSwatch: {
    width: 16,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
    cursor: "pointer",
    border: "1px solid #ccc",
  },
  tooltipRoot: {
    zIndex: 9999999999,
  },
  tooltip: {
    backgroundColor: "rgba(0,0,0,0.9)",
    color: "#fff",
    fontSize: "14px",
    padding: "8px 12px",
    borderRadius: 4,
    maxWidth: 240,
    '& span': {
      color: '#fff',
      fontSize: '14px'
    }
  },
  tooltipArrow: {
    color: "rgba(0,0,0,0.9)"
  },
  popper: {
    zIndex: zIndices.tooltip
  },
  actionButtons: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginLeft: 8
  },
  switchWrapper: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8
  },
}))

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
  // Deduplicate categories using Set
  const [categoryList, setCategoryList] = useState([...new Set(categories)])
  const [regionCategorySet, setRegionCategorySet] = useState(
    new Set(regions.map((region) => region.category))
  )

  // Update categoryList when categories prop changes
  useEffect(() => {
    setCategoryList([...new Set(categories)])
  }, [categories])

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
    setRegionCategorySet(new Set(regions.map((region) => region.category)))
  }, [regions])

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
  const handleColorChangeLocal = useCallback((color, category) => {
    // Stop event propagation
    event?.stopPropagation();
    event?.preventDefault();

    // Update colors without closing
    setCategoryColors(prev => ({
      ...prev,
      [category]: color.hex
    }));
    onCategoryColorChange(category, color.hex);
  }, [onCategoryColorChange]);

  // Update the outside click handler to be more specific
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        // Check if click is on the color picker
        const isColorPicker = event.target.closest('.sketch-picker');
        if (!isColorPicker) {
          closeAllTooltips();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <FormGroup className={classes.formGroup}>
      {categoryList.map((category, index) => {
        if (!regionCategorySet.has(category)) {
          return null
        }

        return (
          <div
            key={index}
            className={classes.categoryRow}
          >
            <div className={classes.leftSection}>

              <div className={classes.switchWrapper}>
                <FormControlLabel
                  className={classes.switchControl}
                  control={
                    <Tooltip
                      title="Toggle Category Visibility"
                      arrow
                      placement="top"
                      PopperProps={{
                        style: { zIndex: zIndices.tooltip }
                      }}
                      classes={{
                        tooltip: classes.tooltip,
                        arrow: classes.tooltipArrow,
                        popper: classes.popper
                      }}
                    >
                      <Switch
                        style={{
                          color: "white"
                        }}
                        size="small"
                        id={category}
                        checked={checkedList.find((item) => item.item === category)?.checked || false}
                        onChange={handleChange}
                      />
                    </Tooltip>
                  }
                  label={
                    <Tooltip
                      title={category}
                      arrow
                      placement="top"
                      PopperProps={{
                        style: { zIndex: zIndices.tooltip }
                      }}
                      classes={{
                        tooltip: classes.tooltip,
                        arrow: classes.tooltipArrow,
                        popper: classes.popper
                      }}
                    >
                      <div className={classes.categoryLabel}>
                        {category}
                      </div>
                    </Tooltip>
                  }
                />
              </div>
            </div>

            <div className={classes.actionButtons}>


              <Tooltip
                interactive
                title={
                  <div
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{
                        fontSize: 12,
                        color: 'white',
                        // add a line break here
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%'
                      }}>
                        {category}
                      </div>
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
                            style={{ fontSize: 16, color: 'black' }}
                          />
                        </IconButton>
                      </div>
                    </div>
                    <SketchPicker
                      color={
                        categoryColors[category] ||
                        categoriesColorMap[category] ||
                        "#C4A484"
                      }
                      onChangeComplete={(color, event) => {
                        event?.stopPropagation();
                        handleColorChangeLocal(color, category);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                    />
                  </div>
                }
                PopperProps={{
                  disablePortal: true,
                  style: { zIndex: zIndices.tooltip }
                }}
                classes={{
                  tooltip: classes.tooltip,
                  arrow: classes.tooltipArrow,
                  popper: classes.popper
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
                <Tooltip
                  title={regionCategorySet.has(category)
                    ? "Add a System Breakout"
                    : "No regions available for breakout"}
                  arrow
                  placement="top"
                  PopperProps={{
                    style: { zIndex: zIndices.tooltip }
                  }}
                  classes={{
                    tooltip: classes.tooltip,
                    arrow: classes.tooltipArrow,
                    popper: classes.popper
                  }}
                >
                  <span>
                    <IconButton
                      size="small"
                      style={{
                        color: regionCategorySet.has(category) ? "white" : "grey",
                        padding: 0
                      }}
                      disabled={!regionCategorySet.has(category)}
                      onClick={() => handleBreakout(category)}
                    >
                      <DashboardIcon style={{ fontSize: 20 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </div>
          </div>
        )
      })}
    </FormGroup >
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
      title="Categories"
      icon={
        <Tooltip
          title="Category Settings"
          arrow
          PopperProps={{
            style: { zIndex: zIndices.tooltip }
          }}
          classes={{
            tooltip: classes.tooltip,
            arrow: classes.tooltipArrow,
            popper: classes.popper
          }}
        >
          <CategoryIcon style={{ color: "white" }} />
        </Tooltip>
      }
      expandedByDefault={true}
    >
      <div className={classes.content}>
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
