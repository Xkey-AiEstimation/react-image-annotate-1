// @flow
import {
  Collapse,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  Tooltip,
  Typography
} from "@material-ui/core"
import { makeStyles } from "@material-ui/core/styles"
import CategoryIcon from "@material-ui/icons/Category"
import CenterFocusStrongIcon from "@material-ui/icons/CenterFocusStrong"
import TrashIcon from "@material-ui/icons/Delete"
import EditIcon from "@material-ui/icons/Edit"
import ExpandLessIcon from "@material-ui/icons/ExpandLess"
import ExpandMoreIcon from "@material-ui/icons/ExpandMore"
import FormatListNumbered from "@material-ui/icons/FormatListNumbered"
import InfoIcon from "@material-ui/icons/Info"
import Visibility from "@material-ui/icons/Visibility"
import UnfoldMoreIcon from "@material-ui/icons/UnfoldMore"
import UnfoldLessIcon from "@material-ui/icons/UnfoldLess"
import classnames from "classnames"
import isEqual from "lodash/isEqual"
import React, { memo, useEffect, useMemo, useState } from "react"
import { asMutable } from "seamless-immutable"
import { AIE_CATEGORIES, zIndices } from "../Annotator/constants"
import { BulkEditDialog } from "../BulkEditDialog"
import SidebarBoxContainer from "../SidebarBoxContainer"

const useStyles = makeStyles({
  emptyText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    padding: 20,
  },
  deviceHeader: {
    display: "flex",
    alignItems: "center",
    width: "calc(100% - 60px)",
    marginLeft: 4,
  },
  deviceName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
    flexGrow: 1,
  },
  deviceCount: {
    fontSize: 11,
    color: "white",
    opacity: 0.8,
  },
  regionItem: {
    padding: "2px 8px 2px 16px",
    display: "flex",
    alignItems: "center",
    minHeight: 28,
    position: "relative",
  },
  regionIcon: {
    width: 8,
    height: 8,
    marginRight: 4,
    borderRadius: "50%",
    flexShrink: 0,
  },
  regionName: {
    fontSize: 11,
    marginLeft: 4,
    color: "white",
    flexGrow: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "calc(100% - 80px)",
  },
  locationIcon: {
    padding: 2,
    width: 18,
    height: 18,
    color: "#3CD2BC",
    marginLeft: 2,
    "& svg": {
      fontSize: 14,
    }
  },
  actionIcon: {
    padding: 2,
    width: 18,
    height: 18,
    color: "white",
    marginLeft: 2,
    "& svg": {
      fontSize: 14,
    }
  },
  nestedList: {
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginLeft: 16,
    marginBottom: 4,
    borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
  },
  expandIcon: {
    color: "white",
    padding: 0,
    width: 18,
    height: 18,
    marginLeft: 4,
    "& svg": {
      fontSize: 14,
    }
  },
  deviceItem: {
    padding: "4px 8px 4px 0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    position: "relative",
    "&:hover": {
      backgroundColor: "#2e2e2e",
    },
    "&.highlighted": {
      backgroundColor: "#1e1e1e !important",
    },
    transition: "background-color 0.2s ease",
  },
  actionContainer: {
    display: "flex",
    alignItems: "center",
    position: "absolute",
    right: 4,
    top: "50%",
    transform: "translateY(-50%)",
  },
  listRoot: {
    padding: 0,
  },
  warningIcon: {
    color: "white",
    backgroundColor: "red",
    width: 16,
    height: 16,
    padding: 0,
    marginLeft: 4,
    marginRight: 4,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "& svg": {
      fontSize: 12,
    },
  },
  deviceActions: {
    display: "flex",
    alignItems: "center",
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
  },
  deviceVisibilityIcon: {
    position: "absolute",
    left: 0,
    top: "50%",
    transform: "translateY(-50%)",
  },
  deviceContent: {
    display: "flex",
    flexDirection: "column",
    marginLeft: 24,
    width: "calc(100% - 80px)",
  },
  deviceNameRow: {
    display: "flex",
    alignItems: "center",
  },
  deviceCountRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryHeader: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
    padding: "4px 8px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    display: "flex",
    alignItems: "center",
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 8,
    color: "white",
  },
  bulkEditIcon: {
    marginLeft: 4,
    color: "#64b5f6",
  },
  dialogContent: {
    minWidth: 300,
  },
  dialogTextField: {
    width: "100%",
    marginTop: 8,
  },
  typeHeader: {
    fontSize: 11,
    color: "white",
    padding: "2px 8px 2px 24px",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    display: "flex",
    alignItems: "center",
  },
  typeIcon: {
    fontSize: 14,
    marginRight: 6,
    color: "white",
  },
  typeCount: {
    fontSize: 10,
    color: "white",
    opacity: 0.8,
    marginLeft: 4,
  },
  lineItem: {
    padding: "2px 8px 2px 32px",
    display: "flex",
    alignItems: "center",
    minHeight: 24,
  },
  lineIcon: {
    width: 16,
    height: 2,
    marginRight: 4,
    flexShrink: 0,
  },
  lineName: {
    fontSize: 10,
    marginLeft: 4,
    color: "white",
    flexGrow: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  tooltipRoot: {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    color: "white",
    fontSize: 12,
    padding: "8px 12px",
    maxWidth: 300,
    border: "1px solid rgba(255, 255, 255, 0.2)",
  },
  highlighted: {
    backgroundColor: "#1e1e1e !important",
    "& $deviceName": {
      color: "#2196f3 !important",
      fontWeight: "bold",
    },
    "& $regionName": {
      color: "#2196f3 !important",
      fontWeight: "bold",
    }
  },
  select: {
    // Add your styles here
  },
  expandAllButton: {
    padding: 4,
    color: 'white',
    position: 'absolute',
    right: 8,
    top: 8,
    zIndex: 1,
  },
  expandAllIcon: {
    fontSize: 20,
  },
})

const ALL_DEVICES_TOGGLE_KEY = "ALL"

// Add this helper function before the component
const groupDevicesByCategory = (regions) => {
  return regions.reduce((acc, region) => {
    // Skip if no category or device name
    if (!region.category || !region.cls) return acc

    // Initialize category if it doesn't exist
    if (!acc[region.category]) {
      acc[region.category] = {}
    }

    // Initialize device if it doesn't exist
    if (!acc[region.category][region.cls]) {
      acc[region.category][region.cls] = []
    }

    // Add region to device array
    acc[region.category][region.cls].push(region)

    return acc
  }, {})
}

export const AnnotationCountSidebarBox = ({
  regions,
  onToggleDevice,
  onDeleteDevices,
  onDeleteAll,
  selectedDeviceToggle,
  deviceList,
  onAddDeviceOldDeviceToList,
  onSelectRegion,
  onDeleteRegion,
  onChangeRegion,
  onChangeDeviceName,
  onPanToRegion,
  dispatch,
  state,
}) => {
  const classes = useStyles()
  const [clsStatus, setClsStatus] = React.useState({})
  const [expandedDevices, setExpandedDevices] = useState({})
  const [expandedCategories, setExpandedCategories] = useState(() => {
    const devicesByCategory = groupDevicesByCategory(regions)
    return Object.keys(devicesByCategory).reduce((acc, category) => {
      acc[category] = true
      return acc
    }, {})
  })
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false)
  const [deviceToEdit, setDeviceToEdit] = useState("")
  const [newDeviceName, setNewDeviceName] = useState("")
  const [expandedTypes, setExpandedTypes] = useState({})
  const [expandedDeviceGroups, setExpandedDeviceGroups] = useState({})
  const [nameError, setNameError] = useState("")
  const [allDevicesExpanded, setAllDevicesExpanded] = useState(true)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [selectedRegionId, setSelectedRegionId] = useState(null)
  const [editMode, setEditMode] = useState('rename')
  const [selectedCategory, setSelectedCategory] = useState(null)

  // Create mutable copy of deviceList
  const mutableDeviceList = useMemo(() => {
    return asMutable(deviceList, { deep: true }) || []
  }, [deviceList])

  // Get the current device's category using mutable list
  const currentDeviceCategory = useMemo(() => {
    const device = mutableDeviceList.find(d => d.symbol_name === deviceToEdit)
    return device?.category || null
  }, [deviceToEdit, mutableDeviceList])

  // Modified device options to include category using mutable list
  const deviceOptions = useMemo(() => {
    return mutableDeviceList.map(device => ({
      value: device.symbol_name,
      label: (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span>{device.symbol_name}</span>
          <span style={{
            marginLeft: 8,
            fontSize: '0.8em',
            opacity: 0.7,
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: '2px 6px',
            borderRadius: 4
          }}>
            {device.category}
          </span>
        </div>
      ),
      category: device.category,
      isUserDefined: device.user_defined
    }))
  }, [mutableDeviceList])

  // Validation using mutable list
  const validateDeviceName = (newName) => {
    if (!newName.trim()) {
      setNameError("Device name cannot be empty")
      return false
    }

    // Find the original device to get its category
    const originalDevice = mutableDeviceList.find(d => d.symbol_name === deviceToEdit)
    const category = originalDevice ? originalDevice.category : "User Defined"

    // Check if there's already a device with this name in the same category
    const existingDevice = mutableDeviceList.find(d =>
      d.symbol_name === newName &&
      d.category === category &&
      d.symbol_name !== deviceToEdit
    )

    if (existingDevice) {
      setNameError(`A device named "${newName}" already exists in the "${category}" category`)
      return false
    }

    setNameError("")
    return true
  }

  // Toggle expansion state for a device
  const toggleDeviceExpand = (deviceName, event) => {
    event.stopPropagation()
    setExpandedDevices(prev => ({
      ...prev,
      [deviceName]: !prev[deviceName]
    }))
  }

  // Toggle expansion state for a category
  const toggleCategoryExpand = (category, event) => {
    event.stopPropagation()
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  // Toggle expansion state for a type
  const toggleTypeExpand = (type, event) => {
    event.stopPropagation()
    setExpandedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  // Toggle expansion state for a device group
  const toggleDeviceGroupExpand = (categoryName, deviceName, event) => {
    event.stopPropagation();
    const key = `${categoryName}-${deviceName}`;
    setExpandedDeviceGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Open bulk edit dialog
  const openBulkEditDialog = (deviceName, e) => {
    if (e) e.stopPropagation();
    setDeviceToEdit(deviceName);
    setNewDeviceName("");
    setNameError("");
    setBulkEditDialogOpen(true);
  }

  // Create category options
  const categoryOptions = useMemo(() => {
    return AIE_CATEGORIES.map(category => ({
      value: category,
      label: category
    }))
  }, [])

  // Modified handleDeviceSelectChange
  const handleDeviceSelectChange = (newValue, actionMeta) => {
    if (actionMeta.action === "create-option") {
      setSelectedDevice({
        value: newValue.value,
        label: newValue.value,
        isUserDefined: true
      })
      // Clear category when creating new device
      setSelectedCategory(null)
    } else {
      setSelectedDevice(newValue)
      // Set category if selecting existing device
      if (newValue?.category) {
        setSelectedCategory({
          value: newValue.category,
          label: newValue.category
        })
      }
    }
    setNameError("")
  }

  // Modified handleBulkEdit
  const handleBulkEdit = () => {
    if (editMode === 'rename') {
      if (!validateDeviceName(newDeviceName)) {
        return
      }
      if (onChangeDeviceName) {
        onChangeDeviceName(deviceToEdit, newDeviceName)
      }
    } else {
      if (!selectedDevice) {
        setNameError("Please select or create a device")
        return
      }
      if (!selectedCategory) {
        setNameError("Please select a category")
        return
      }

      // If creating new device or changing to existing one
      if (selectedDevice.isUserDefined) {
        // Add new device with category
        dispatch({
          type: "ADD_NEW_DEVICE",
          device: {
            symbol_name: selectedDevice.value,
            category: selectedCategory.value,
            user_defined: true
          }
        })
      }

      // Change the device name
      if (onChangeDeviceName) {
        onChangeDeviceName(deviceToEdit, selectedDevice.value)
      }
    }

    // Reset and close
    setBulkEditDialogOpen(false)
    setNewDeviceName("")
    setSelectedDevice(null)
    setSelectedCategory(null)
    setEditMode('rename')
  }

  const counts = useMemo(() => {
    return regions.reduce(
      (acc, region) => {
        if (region.cls && (region.type === "box" || region.type === "point" || region.type === "polygon" || region.type === "line")) {
          if (acc[region.cls]) {
            acc[region.cls] += 1
          } else {
            acc[region.cls] = 1
          }
        }
        return acc
      },
      {}
    )
  }, [regions])

  // Group regions by device name (cls)
  const regionsByDevice = useMemo(() => {
    return regions.reduce((acc, region) => {
      if (region.cls && (region.type === "box" || region.type === "point")) {
        if (!acc[region.cls]) {
          acc[region.cls] = []
        }
        acc[region.cls].push(region)
      }
      return acc
    }, {})
  }, [regions])

  // Group regions by category
  const regionsByCategory = useMemo(() => {
    return regions.reduce((acc, region) => {
      if (region.category) {
        if (!acc[region.category]) {
          acc[region.category] = []
        }
        acc[region.category].push(region)
      } else if (region.cls) {
        // For regions without category, use "Uncategorized"
        if (!acc["Uncategorized"]) {
          acc["Uncategorized"] = []
        }
        acc["Uncategorized"].push(region)
      }
      return acc
    }, {})
  }, [regions])

  // Group regions by type
  const regionsByType = useMemo(() => {
    return regions.reduce((acc, region) => {
      const type = region.type || "unknown"
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(region)
      return acc
    }, {})
  }, [regions])

  // Get unique categories
  const categories = useMemo(() => {
    return Object.keys(regionsByCategory).sort()
  }, [regionsByCategory])

  const newClsStatus = React.useMemo(() => {
    return regions.reduce((acc, region) => {
      const isOldDevice = !deviceList.some(
        (device) => device.symbol_name === region.cls
      )
      acc[region.cls] = isOldDevice
      return acc
    }, {})
  }, [regions, deviceList])

  React.useEffect(() => {
    setClsStatus(newClsStatus)
  }, [newClsStatus])

  // Update expandedCategories when regions change
  useEffect(() => {
    const devicesByCategory = groupDevicesByCategory(regions)
    setExpandedCategories(prev => {
      const newExpanded = { ...prev }
      // Add any new categories as expanded
      Object.keys(devicesByCategory).forEach(category => {
        if (!(category in newExpanded)) {
          newExpanded[category] = true
        }
      })
      return newExpanded
    })
  }, [regions])

  const onToggle = (cls) => {
    onToggleDevice(cls)
  }

  const onDelete = (cls) => {
    onDeleteDevices(cls)
  }

  const onAddDeviceToList = (cls, event) => {
    event.stopPropagation()
    if (clsStatus[cls]) {
      const region = regions.find((region) => region.cls === cls)
      if (region) {
        const device = {
          symbol_name: cls,
          category: region.category,
          id: `${cls}-device-${region.category}`,
          user_defined: true,
        }
        onAddDeviceOldDeviceToList(device)
      }
    }
  }

  const handlePanToRegion = (region, e) => {
    if (e) e.stopPropagation();

    // If the device is not visible, make it visible first
    if (region.cls && selectedDeviceToggle !== region.cls) {
      // Toggle visibility to make it visible
      if (onToggleDevice) {
        onToggleDevice(ALL_DEVICES_TOGGLE_KEY);
      }
    }

    // Then pan to the region
    if (onPanToRegion) {
      onPanToRegion(region);
    }
  }

  const handleSelectRegion = (region, e) => {
    if (e) e.stopPropagation();
    setSelectedRegionId(region.id);
    if (onSelectRegion) onSelectRegion(region);
    if (onPanToRegion) onPanToRegion(region);
  }

  const handleDeleteRegion = (region, e) => {
    if (e) e.stopPropagation();
    if (onDeleteRegion) onDeleteRegion(region);
  }

  // Get icon for region type
  const getTypeIcon = (type) => {
    switch (type) {
      case "box": return "□"
      case "point": return "•"
      case "polygon": return "⬡"
      case "line": return "—"
      case "keypoints": return "⋮"
      default: return "?"
    }
  }

  // First, let's create a function to group regions by device name within each category
  const devicesByCategory = useMemo(() => {
    // Create a structure like: { category1: { deviceA: [region1, region2], deviceB: [region3] } }
    return regions.reduce((acc, region) => {
      const category = region.category || "Uncategorized";
      const deviceName = region.cls || "Unknown";

      if (!acc[category]) {
        acc[category] = {};
      }

      if (!acc[category][deviceName]) {
        acc[category][deviceName] = [];
      }

      acc[category][deviceName].push(region);
      return acc;
    }, {});
  }, [regions]);

  // First, let's update the function to check if a device is user-defined and is a line
  const isUserDefinedDevice = (deviceName) => {
    // Check if the device exists in the device list
    const device = deviceList.find(d => d.symbol_name === deviceName);

    // WE DONT NEED TO CHECK FOR LINES BECAUSE WE ARE EDITING ANY DEVICE
    // const hasLineRegions = regions.some(r => r.cls === deviceName && r.type === "line");

    // Only allow editing if:
    // 1. It's a line region, AND
    // 2. Either it's not in the device list OR it has user_defined=true
    return (!device || device.user_defined === true);
  };

  // Add this useEffect to update selectedDevice when regions change
  useEffect(() => {
    // Find the first highlighted region
    const highlightedRegion = regions.find(r => r.highlighted);
    if (highlightedRegion) {
      setSelectedRegionId(highlightedRegion.id);
    } else if (selectedRegionId && !regions.some(r => r.id === selectedRegionId)) {
      // If the selected region no longer exists, clear it
      setSelectedRegionId(null);
    }
  }, [regions]);

  // Function to toggle all expansions
  const toggleAllExpansions = () => {
    const newExpandedState = !allDevicesExpanded
    setAllDevicesExpanded(newExpandedState)

    // Get all categories and devices
    const devicesByCategory = groupDevicesByCategory(regions)

    // Update category expansions
    const newExpandedCategories = Object.keys(devicesByCategory).reduce((acc, category) => {
      acc[category] = newExpandedState
      return acc
    }, {})
    setExpandedCategories(newExpandedCategories)

    // Update device group expansions
    const newExpandedDeviceGroups = {}
    Object.entries(devicesByCategory).forEach(([category, devices]) => {
      Object.keys(devices).forEach(deviceName => {
        newExpandedDeviceGroups[`${category}-${deviceName}`] = newExpandedState
      })
    })
    setExpandedDeviceGroups(newExpandedDeviceGroups)
  }

  return (
    <SidebarBoxContainer
      title="Device Counts"
      icon={<FormatListNumbered style={{ color: "white" }} />}
      expandedByDefault={true}
    >
      <IconButton
        className={classes.expandAllButton}
        onClick={toggleAllExpansions}
        size="small"
      >
        {allDevicesExpanded ? (
          <UnfoldLessIcon className={classes.expandAllIcon} />
        ) : (
          <UnfoldMoreIcon className={classes.expandAllIcon} />
        )}
      </IconButton>

      <List className={classes.listRoot}>
        <ListItem
          className={classes.deviceItem}
          button
          onClick={() => onToggle(ALL_DEVICES_TOGGLE_KEY)}
        >
          <Tooltip
            title="Toggle all devices"
            placement="top"
            PopperProps={{ style: { zIndex: zIndices.tooltip } }}
            classes={{
              tooltip: classes.tooltipRoot
            }}
            arrow
          >
            <IconButton
              edge="start"
              size="small"
              style={{
                marginLeft: 8,
              }}
              className={classes.actionIcon}
            >
              <Visibility
                style={{
                  color: selectedDeviceToggle === ALL_DEVICES_TOGGLE_KEY ? "green" : "white",
                }}
              />
            </IconButton>
          </Tooltip>

          <div className={classes.deviceHeader}>
            <Typography className={classes.deviceName}>
              Show All Devices
            </Typography>
            <Typography className={classes.deviceCount}>
              Total: <span style={{ fontWeight: "bold" }}>{
                regions.filter(
                  (region) =>
                    region.cls &&
                    (region.type === "box" || region.type === "point" || region.type === "polygon" || region.type === "line")
                ).length
              }</span> counted
            </Typography>
          </div>

          <ListItemSecondaryAction>
            <Tooltip
              title="Delete all devices"
              placement="top"
              PopperProps={{ style: { zIndex: zIndices.tooltip } }}
              classes={{ tooltip: classes.tooltipRoot }}
              arrow
            >

              <IconButton
                edge="end"
                size="small"
                onClick={() => onDeleteAll()}
                className={classes.actionIcon}
              >
                <TrashIcon
                  style={{
                    color: "rgb(245, 0, 87)",
                  }}
                />
              </IconButton>
            </Tooltip>
          </ListItemSecondaryAction>
        </ListItem>

        {/* Category grouping */}
        <Divider style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", margin: "8px 0" }} />

        {categories.map((category, categoryIndex) => (
          <React.Fragment key={`category-${categoryIndex}`}>
            <ListItem
              button
              className={classes.categoryHeader}
              onClick={(e) => toggleCategoryExpand(category, e)}
            >
              <CategoryIcon className={classes.categoryIcon} />
              <Typography className={classes.deviceName}>
                {category}
              </Typography>
              <Typography className={classes.deviceCount} style={{ marginLeft: 8 }}>
                ({Object.keys(devicesByCategory[category] || {}).length} device types)
              </Typography>

              <div style={{ flexGrow: 1 }} />


              <IconButton
                size="small"
                className={classes.expandIcon}
                onClick={(e) => toggleCategoryExpand(category, e)}
              >
                {expandedCategories[category] ?
                  <ExpandLessIcon fontSize="small" /> :
                  <ExpandMoreIcon fontSize="small" />
                }
              </IconButton>
            </ListItem>

            <Collapse in={expandedCategories[category]} timeout="auto" unmountOnExit>
              <List disablePadding>
                {/* List device types in this category */}
                {Object.keys(devicesByCategory[category] || {}).map((deviceName, deviceIndex) => {
                  const deviceInstances = devicesByCategory[category][deviceName];
                  const deviceGroupKey = `${category}-${deviceName}`;
                  const isHighlighted = selectedDeviceToggle === deviceName;

                  return (
                    <React.Fragment key={`${category}-device-${deviceIndex}`}>
                      {/* Device Type Header */}
                      <ListItem
                        button
                        className={classnames(classes.deviceItem, {
                          [classes.highlighted]: isHighlighted || selectedDevice === deviceName
                        })}
                        style={{
                          paddingLeft: 16,
                          backgroundColor: isHighlighted || selectedDevice === deviceName ? "#1e1e1e" : "transparent"
                        }}
                        onClick={(e) => {
                          toggleDeviceGroupExpand(category, deviceName, e);
                        }}
                      >
                        <Tooltip
                          title="Toggle device visibility. Click to show only this device. Unclick to show all devices."
                          placement="top"
                          PopperProps={{ style: { zIndex: zIndices.tooltip } }}
                          classes={{
                            tooltip: classes.tooltipRoot
                          }}
                        >
                          <IconButton
                            edge="start"
                            size="small"
                            className={classnames(classes.actionIcon, classes.deviceVisibilityIcon)}
                            style={{ left: 16 }} // Adjust position for indentation
                            onClick={(e) => { e.stopPropagation(); onToggle(deviceName); }}
                          >
                            <Visibility
                              style={{
                                color: selectedDeviceToggle === deviceName ? "green" : "white",
                              }}
                            />
                          </IconButton>
                        </Tooltip>

                        <div className={classes.deviceContent}>
                          <div className={classes.deviceNameRow}>
                            <Tooltip
                              title={
                                <div>
                                  <div><strong>Device Name:</strong> {deviceName}</div>
                                  <div><strong>Category:</strong> {category}</div>
                                </div>
                              }
                              placement="top"
                              PopperProps={{
                                style: { zIndex: zIndices.tooltip }
                              }}
                              classes={{
                                tooltip: classes.tooltipRoot
                              }}
                              arrow
                              enterDelay={100}
                            >
                              <div style={{ display: 'inline-block' }}>
                                <Typography
                                  className={classes.deviceName}
                                  style={{
                                    color: clsStatus[deviceName] ? "red" : "#FFFFFF",
                                  }}
                                >
                                  {deviceName}

                                  {clsStatus[deviceName] && (
                                    <Tooltip
                                      title="This device is not in the device list. Click to add."
                                      placement="top"
                                      PopperProps={{
                                        style: { zIndex: zIndices.tooltip }
                                      }}
                                      classes={{
                                        tooltip: classes.tooltipRoot
                                      }}
                                      arrow
                                    >
                                      <IconButton
                                        onClick={(e) => { e.stopPropagation(); onAddDeviceToList(deviceName, e); }}
                                        size="small"
                                        className={classes.warningIcon}
                                      >
                                        <InfoIcon />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Typography>
                              </div>
                            </Tooltip>
                          </div>

                          <div className={classes.deviceCountRow}>
                            <Typography className={classes.deviceCount}>
                              Total: <span style={{ fontWeight: "bold" }}>{deviceInstances.length}</span> counted
                            </Typography>
                          </div>
                        </div>

                        <div className={classes.deviceActions}>
                          <IconButton
                            size="small"
                            className={classes.expandIcon}
                            onClick={(e) => toggleDeviceGroupExpand(category, deviceName, e)}
                          >
                            {expandedDeviceGroups[deviceGroupKey] ?
                              <ExpandLessIcon fontSize="small" /> :
                              <ExpandMoreIcon fontSize="small" />
                            }
                          </IconButton>
                          <Tooltip
                            title={"Edit Device Name (Applies to all instances of this device)"}
                            PopperProps={{ style: { zIndex: zIndices.tooltip } }}
                            classes={{ tooltip: classes.tooltipRoot }}
                            arrow
                          >
                            <span> {/* Wrap in span to ensure tooltip shows when button is disabled */}
                              <IconButton
                                size="small"
                                className={classnames(classes.actionIcon, classes.bulkEditIcon)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openBulkEditDialog(deviceName, e);
                                }}
                                style={{
                                  zIndex: zIndices.tooltip,
                                  // color: isUserDefinedDevice(deviceName) ? "#64b5f6" : "rgba(255,255,255,0.3)"
                                }}
                              // disabled={!isUserDefinedDevice(deviceName)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip
                            title="Delete all instances of this device"
                            placement="top"
                            PopperProps={{ style: { zIndex: zIndices.tooltip } }}
                            classes={{ tooltip: classes.tooltipRoot }}
                            arrow
                          >
                            <IconButton
                              size="small"
                              onClick={(e) => { e.stopPropagation(); onDelete(deviceName); }}
                              className={classes.actionIcon}
                            >
                              <TrashIcon
                                style={{
                                  color: "rgb(245, 0, 87)",
                                }}
                              />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </ListItem>

                      {/* Individual Device Instances */}
                      <Collapse in={expandedDeviceGroups[deviceGroupKey]} timeout="auto" unmountOnExit>
                        <List className={classes.nestedList} disablePadding>
                          {deviceInstances.map((region, regionIndex) => (
                            <ListItem
                              key={regionIndex}
                              className={classnames(classes.regionItem, {
                                [classes.highlighted]: region.highlighted || region.id === selectedRegionId
                              })}
                              style={{
                                paddingLeft: 32,
                                backgroundColor: region.highlighted || region.id === selectedRegionId ? "#1e1e1e" : "transparent"
                              }}
                              button
                              onClick={(e) => handleSelectRegion(region, e)}
                            >
                              <div
                                className={classes.regionIcon}
                                style={{
                                  backgroundColor: region.color || "#ddd",
                                  borderRadius: region.type === 'box' ? '2px' : '50%'
                                }}
                              />

                              <Tooltip
                                title={
                                  <div>
                                    <div><strong>Device:</strong> {region.cls}</div>
                                    <div><strong>Type:</strong> {region.type}</div>
                                    <div><strong>Category:</strong> {category}</div>
                                    {region.tags && region.tags.length > 0 && (
                                      <div><strong>Tags:</strong> {region.tags.join(', ')}</div>
                                    )}
                                  </div>
                                }
                                placement="top"
                                PopperProps={{
                                  style: { zIndex: zIndices.tooltip }
                                }}
                                classes={{
                                  tooltip: classes.tooltipRoot
                                }}
                                arrow
                              >
                                <Typography className={classes.regionName}>
                                  {region.cls} #{regionIndex + 1}
                                </Typography>
                              </Tooltip>

                              <div className={classes.actionContainer}>
                                <Tooltip
                                  title="Locate"
                                  PopperProps={{
                                    style: { zIndex: zIndices.tooltip }
                                  }}
                                  classes={{
                                    tooltip: classes.tooltipRoot
                                  }}
                                  arrow
                                >
                                  <span>
                                    <IconButton
                                      className={classes.locationIcon}
                                      onClick={(e) => { e.stopPropagation(); handlePanToRegion(region, e); }}
                                      size="small"
                                    >
                                      <CenterFocusStrongIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>

                                <Tooltip
                                  title="Delete"
                                  PopperProps={{
                                    style: { zIndex: zIndices.tooltip }
                                  }}
                                  classes={{
                                    tooltip: classes.tooltipRoot
                                  }}
                                  arrow
                                >
                                  <IconButton
                                    className={classes.actionIcon}
                                    onClick={(e) => handleDeleteRegion(region, e)}
                                    size="small"
                                  >
                                    <TrashIcon fontSize="small" style={{ color: "rgb(245, 0, 87)" }} />
                                  </IconButton>
                                </Tooltip>
                              </div>
                            </ListItem>
                          ))}
                        </List>
                      </Collapse>
                    </React.Fragment>
                  );
                })}
              </List>
            </Collapse>
          </React.Fragment>
        ))}

        {/* Original device listing - keep for backward compatibility */}
        {/* <Divider style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", margin: "8px 0" }} /> */}
      </List>

      <BulkEditDialog
        open={bulkEditDialogOpen}
        onClose={() => setBulkEditDialogOpen(false)}
        deviceToEdit={deviceToEdit}
        deviceList={deviceList}
        isUserDefinedDevice={isUserDefinedDevice}
        onChangeDeviceName={onChangeDeviceName}
        dispatch={dispatch}
        state={state}
      />
    </SidebarBoxContainer>
  )
}

export default memo(AnnotationCountSidebarBox, (prevProps, nextProps) => {
  // Check if regions have changed
  if (!isEqual(prevProps.regions, nextProps.regions)) {
    return false; // Re-render if regions changed
  }

  // Check if device toggle state has changed
  if (prevProps.selectedDeviceToggle !== nextProps.selectedDeviceToggle) {
    return false; // Re-render if toggle state changed
  }

  // Check if device list has changed
  if (!isEqual(prevProps.deviceList, nextProps.deviceList)) {
    return false; // Re-render if device list changed
  }

  // Otherwise, don't re-render
  return true;
})
