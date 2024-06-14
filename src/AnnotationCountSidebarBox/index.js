// @flow
import {
  IconButton,
  ListItemSecondaryAction,
  Tooltip,
  Typography,
} from "@material-ui/core"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemText from "@material-ui/core/ListItemText"
import { makeStyles } from "@material-ui/core/styles"
import TrashIcon from "@material-ui/icons/Delete"
import FormatListNumbered from "@material-ui/icons/FormatListNumbered"
import Visibility from "@material-ui/icons/Visibility"
import isEqual from "lodash/isEqual"
import React, { memo, useMemo } from "react"
import SidebarBoxContainer from "../SidebarBoxContainer"

import InfoIcon from "@material-ui/icons/Info"
const useStyles = makeStyles({
  emptyText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    padding: 20,
  },
})

const listItemTextStyle = { paddingLeft: 16, color: "white" }

export const AnnotationCountSidebarBox = ({
  regions,
  onToggleDevice,
  onDeleteDevices,
  onDeleteAll,
  selectedDeviceToggle,
  deviceList,
  onAddDeviceOldDeviceToList,
}) => {
  const classes = useStyles()
  const [clsStatus, setClsStatus] = React.useState({})

  const counts = useMemo(() => {
    return regions.reduce(
      (acc, region) => {
        if (region.cls && (region.type === "box" || region.type === "point")) {
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

  const onAddDeviceToList = (cls) => {
    // find device from regions
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

  return (
    <SidebarBoxContainer
      title="Device Counts"
      icon={<FormatListNumbered style={{ color: "white" }} />}
      expandedByDefault={true}
    >
      <List>
        <ListItem
          style={{
            // add a white border to the bottom of the list item
            borderBottom: "1px solid white",
          }}
        >
          <IconButton
            edge="start"
            aria-label="comments"
            onClick={() => onToggle("ALL")}
          >
            <Visibility
              style={{
                color: selectedDeviceToggle === "ALL" ? "green" : "white",
              }}
            />
          </IconButton>
          <ListItemText
            style={listItemTextStyle}
            disableTypography
            primary={
              <Typography
                variant="body2"
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#FFFFFF",
                }}
              >
                All Devices
              </Typography>
            }
            secondary={
              <Typography
                style={{
                  fontSize: "14px",
                  color: "#FFFFFF",
                }}
              >
                Total:
                {
                  regions.filter(
                    (region) =>
                      region.cls &&
                      (region.type === "box" || region.type === "point")
                  ).length
                }
              </Typography>
            }
          />
          <ListItemSecondaryAction>
            <IconButton
              edge="end"
              aria-label="comments"
              onClick={() => onDeleteAll()}
            >
              <TrashIcon
                style={{
                  color: "rgb(245, 0, 87)",
                }}
              />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>

        {Object.keys(counts).map((name, i) => (
          <ListItem dense key={i}>
            <IconButton
              edge="start"
              aria-label="comments"
              onClick={() => onToggle(name)}
            >
              <Visibility
                style={{
                  color: selectedDeviceToggle === name ? "green" : "white",
                }}
              />
            </IconButton>
            {clsStatus[name] && (
              <Tooltip
                title={"This device is not in the device list. Click to add."}
                PopperProps={{
                  style: { zIndex: 9999999 },
                }}
              >
                <IconButton
                  onClick={() => onAddDeviceToList(name)}
                  size="small"
                  style={{
                    color: "white",
                    padding: 0,
                    marginLeft: 5,
                    backgroundColor: "red",
                  }}
                >
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            )}
            <ListItemText
              style={listItemTextStyle}
              disableTypography
              primary={
                <Typography
                  variant="body2"
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: clsStatus[name] ? "red" : "#FFFFFF",
                  }}
                >
                  {name}
                </Typography>
              }
              secondary={
                <Typography
                  style={{
                    fontSize: "14px",
                    color: "#FFFFFF",
                  }}
                >
                  Total: {counts[name]}
                </Typography>
              }
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="comments"
                onClick={() => onDelete(name)}
              >
                <TrashIcon
                  style={{
                    color: "rgb(245, 0, 87)",
                  }}
                />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </SidebarBoxContainer>
  )
}

export default memo(AnnotationCountSidebarBox, (prevProps, nextProps) =>
  isEqual(
    prevProps.counts.map((a) => [a.name, a.count]),
    nextProps.counts.map((a) => [a.name, a.count])
  )
)
