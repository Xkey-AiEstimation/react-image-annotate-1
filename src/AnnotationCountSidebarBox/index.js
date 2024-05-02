// @flow

import {
  IconButton,
  ListItemSecondaryAction,
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
  selectedDeviceToggle,
}) => {
  const classes = useStyles()

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

  const onToggle = (cls) => {
    onToggleDevice(cls)
  }

  const onDelete = (cls) => {
    onDeleteDevices(cls)
  }

  return (
    <SidebarBoxContainer
      title="Device Counts"
      icon={<FormatListNumbered style={{ color: "white" }} />}
      expandedByDefault={true}
    >
      <List>
        {/* {Object.keys(counts).length === 0 && (
          <div className={classes.emptyText}>No Counts Yet</div>
        )} */}
        <ListItem>
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
          />
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
                    color: selectedDeviceToggle === name ? "green" : "white",
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
