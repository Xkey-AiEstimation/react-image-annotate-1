// @flow
import {
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  TextField,
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
import classnames from "classnames"
import isEqual from "lodash/isEqual"
import React, { memo, useMemo, useState } from "react"
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
})

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
  onPanToRegion,
}) => {
  const classes = useStyles()
  const [clsStatus, setClsStatus] = React.useState({})
  const [expandedDevices, setExpandedDevices] = useState({})
  const [expandedCategories, setExpandedCategories] = useState({})
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false)
  const [bulkEditCategory, setBulkEditCategory] = useState("")
  const [bulkEditNewName, setBulkEditNewName] = useState("")
  const [expandedTypes, setExpandedTypes] = useState({})
  const [expandedDeviceGroups, setExpandedDeviceGroups] = useState({})

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
  const openBulkEditDialog = (category, event) => {
    event.stopPropagation()
    setBulkEditCategory(category)
    setBulkEditNewName("")
    setBulkEditDialogOpen(true)
  }

  // Handle bulk edit submission
  const handleBulkEdit = () => {
    // Get all regions with the selected category
    const regionsToEdit = regions.filter(r => 
      (bulkEditCategory === "Uncategorized" && !r.category) || 
      r.category === bulkEditCategory
    );
    
    if (regionsToEdit.length === 0) {
      setBulkEditDialogOpen(false);
      return;
    }
    
    // Update each region with the new name
    regionsToEdit.forEach(region => {
      if (onChangeRegion) {
        onChangeRegion({
          ...region,
          cls: bulkEditNewName
        });
      }
    });
    
    // Close the dialog
    setBulkEditDialogOpen(false);
    
    // Reset the form
    setBulkEditNewName("");
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
    if (onPanToRegion) onPanToRegion(region);
  }

  const handleSelectRegion = (region, e) => {
    if (e) e.stopPropagation();
    if (onSelectRegion) onSelectRegion(region);
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

  return (
    <SidebarBoxContainer
      title="Device Counts"
      icon={<FormatListNumbered style={{ color: "white" }} />}
      expandedByDefault={true}
    >
      <List className={classes.listRoot}>
        <ListItem
          className={classes.deviceItem}
          button
          onClick={() => onToggle("ALL")}
        >
          <Tooltip
            title="Toggle all devices"
            placement="top"
            PopperProps={{ style: { zIndex: 9999999 } }}
            classes={{
              tooltip: classes.tooltipRoot
            }}
            arrow
          >
            <IconButton
              edge="start"
              size="small"
              className={classes.actionIcon}
            >
              <Visibility
                style={{
                  color: selectedDeviceToggle === "ALL" ? "green" : "white",
                }}
              />
            </IconButton>
          </Tooltip>

          <div className={classes.deviceHeader}>
            <Typography className={classes.deviceName}>
              All Devices
            </Typography>
            <Typography className={classes.deviceCount}>
              Total: {
                regions.filter(
                  (region) =>
                    region.cls &&
                    (region.type === "box" || region.type === "point" || region.type === "polygon" || region.type === "line")
                ).length
              }
            </Typography>
          </div>

          <ListItemSecondaryAction>
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

              <Tooltip
                title="Bulk edit devices in this category"
                PopperProps={{ style: { zIndex: 9999999999 } }}
                classes={{ tooltip: classes.tooltipRoot }}
                arrow
              >
                <IconButton
                  size="small"
                  className={classnames(classes.actionIcon, classes.bulkEditIcon)}
                  onClick={(e) => { e.stopPropagation(); openBulkEditDialog(category, e); }}
                  style={{ zIndex: 9999 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>

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

                  return (
                    <React.Fragment key={`${category}-device-${deviceIndex}`}>
                      {/* Device Type Header */}
                      <ListItem
                        button
                        className={classes.deviceItem}
                        style={{ paddingLeft: 16 }} // Indent for hierarchy
                        onClick={(e) => toggleDeviceGroupExpand(category, deviceName, e)}
                      >
                        <Tooltip
                          title="Toggle device visibility"
                          placement="top"
                          PopperProps={{ style: { zIndex: 9999999 } }}
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
                                style: { zIndex: 9999999 }
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
                                        style: { zIndex: 9999999 }
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
                              Total: {deviceInstances.length} instances
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
                        </div>
                      </ListItem>

                      {/* Individual Device Instances */}
                      <Collapse in={expandedDeviceGroups[deviceGroupKey]} timeout="auto" unmountOnExit>
                        <List className={classes.nestedList} disablePadding>
                          {deviceInstances.map((region, regionIndex) => (
                            <ListItem
                              key={regionIndex}
                              className={classes.regionItem}
                              style={{ paddingLeft: 32 }} // Further indent for third level
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
                                  style: { zIndex: 9999999999 }
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
                                    style: { zIndex: 9999999999 }
                                  }}
                                  classes={{
                                    tooltip: classes.tooltipRoot
                                  }}
                                  arrow
                                >
                                  <span>
                                    <IconButton
                                      className={classes.actionIcon}
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
                                    style: { zIndex: 9999999999 }
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
        <Divider style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", margin: "8px 0" }} />
        <Typography style={{ padding: "4px 8px", fontSize: 12, color: "white", opacity: 0.7 }}>
          All Devices (By Name)
        </Typography>

        {Object.keys(counts).map((deviceName, i) => (
          <React.Fragment key={i}>
            <ListItem
              button
              className={classes.deviceItem}
              onClick={() => onToggle(deviceName)}
            >
              <Tooltip
                title="Toggle device visibility"
                placement="top"
                PopperProps={{ style: { zIndex: 9999999 } }}
                classes={{
                  tooltip: classes.tooltipRoot
                }}
              >
                <IconButton
                  edge="start"
                  size="small"
                  className={classnames(classes.actionIcon, classes.deviceVisibilityIcon)}
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
                        {deviceList.find(d => d.symbol_name === deviceName) && (
                          <div><strong>Category:</strong> {deviceList.find(d => d.symbol_name === deviceName).category}</div>
                        )}
                      </div>
                    }
                    placement="top"
                    PopperProps={{
                      style: { zIndex: 9999 }
                    }}
                    classes={{
                      tooltip: classes.tooltipRoot
                    }}
                    arrow
                    enterDelay={100}
                    leaveDelay={200}
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
                              style: { zIndex: 9999999999 }
                            }}
                            classes={{
                              tooltip: classes.tooltipRoot
                            }}
                            arrow
                          >
                            <IconButton
                              onClick={(e) => onAddDeviceToList(deviceName, e)}
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
                    Total: {counts[deviceName]}
                  </Typography>
                </div>
              </div>

              <div className={classes.deviceActions}>
                <Tooltip
                  title="Locate"
                  PopperProps={{
                    style: { zIndex: 9999999999 }
                  }}
                  classes={{
                    tooltip: classes.tooltipRoot
                  }}
                  arrow
                  enterDelay={100}
                >
                  <span>
                    <IconButton
                      className={classes.actionIcon}
                      onClick={(e) => { e.stopPropagation(); handlePanToRegion(regionsByDevice[deviceName][0], e); }}
                      size="small"
                    >
                      <CenterFocusStrongIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip
                  title="Delete"
                  PopperProps={{
                    style: { zIndex: 9999 }
                  }}
                >
                  <IconButton
                    className={classes.actionIcon}
                    onClick={(e) => handleDeleteRegion(regionsByDevice[deviceName][0], e)}
                    size="small"
                  >
                    <TrashIcon fontSize="small" style={{ color: "rgb(245, 0, 87)" }} />
                  </IconButton>
                </Tooltip>
              </div>
            </ListItem>
          </React.Fragment>
        ))}
      </List>

      {/* Bulk Edit Dialog */}
      <Dialog
        open={bulkEditDialogOpen}
        onClose={() => setBulkEditDialogOpen(false)}
        aria-labelledby="bulk-edit-dialog-title"
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
        }}
        PaperProps={{
          style: { 
            zIndex: 10000000, 
            backgroundColor: '#333',
            color: 'white'
          }
        }}
      >
        <DialogTitle id="bulk-edit-dialog-title" style={{ color: 'white' }}>
          Bulk Edit Devices in Category: {bulkEditCategory}
        </DialogTitle>
        <DialogContent className={classes.dialogContent}>
          <Typography variant="body2" style={{ marginBottom: 16, color: 'white' }}>
            This will rename all devices in the "{bulkEditCategory}" category.
          </Typography>
          <TextField
            label="New Device Name"
            variant="outlined"
            className={classes.dialogTextField}
            value={bulkEditNewName}
            onChange={(e) => setBulkEditNewName(e.target.value)}
            autoFocus
            InputProps={{
              style: { color: 'white' }
            }}
            InputLabelProps={{
              style: { color: 'rgba(255, 255, 255, 0.7)' }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkEditDialogOpen(false)} style={{ color: '#64b5f6' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleBulkEdit} 
            style={{ color: '#64b5f6' }}
            disabled={!bulkEditNewName.trim()}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </SidebarBoxContainer>
  )
}

export default memo(AnnotationCountSidebarBox, (prevProps, nextProps) =>
  isEqual(
    prevProps.counts?.map((a) => [a.name, a.count]),
    nextProps.counts?.map((a) => [a.name, a.count])
  ) &&
  isEqual(prevProps.regions, nextProps.regions)
)
