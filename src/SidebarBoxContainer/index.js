// @flow

import { Collapse, IconButton } from "@material-ui/core"
import { grey } from "@material-ui/core/colors"
import { makeStyles } from "@material-ui/core/styles"
import ExpandLessIcon from "@material-ui/icons/ExpandLess"
import ExpandMoreIcon from "@material-ui/icons/ExpandMore"
import classnames from "classnames"
import React, { memo, useState } from "react"
import useEventCallback from "use-event-callback"

const useStyles = makeStyles({
  container: { margin: 8 },
  header: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    paddingLeft: 16,
    paddingRight: 16,
    cursor: "pointer",
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    flexGrow: 1,
    paddingLeft: 8,
    color: "white",
    "& span": {
      color: grey[600],
      fontSize: 12,
    },
  },
  expandButton: {
    padding: 4,
    width: 28,
    height: 28,
    color: grey[700],
  },
  expandedContent: {
    maxHeight: "400px",
    overflowY: "auto !important",
    overflowX: "hidden",
    marginLeft: 8,
    marginRight: 8,
    paddingBottom: 8,
    paddingRight: 8,
    "&::-webkit-scrollbar": {
      width: "8px",
      height: "8px",
    },
    "&::-webkit-scrollbar-track": {
      background: "#f1f1f1",
      borderRadius: "4px",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "#aaa",
      borderRadius: "4px",
      border: "1px solid #f1f1f1",
    },
    "&::-webkit-scrollbar-thumb:hover": {
      background: "#888",
    },
    "&.noScroll": {
      overflowY: "visible",
      overflow: "visible",
    },
  },
  sidebarBoxWrapper: {
    display: "flex",
    flexDirection: "column",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    marginBottom: 8,
    paddingBottom: 4,
  },
  customHeader: {
    display: "flex",
    alignItems: "center",
    padding: "8px 16px",
    cursor: "pointer",
  },
  iconContainer: {
    marginRight: 8,
    color: "#888",
  },
  titleContainer: {
    flexGrow: 1,
    color: "white",
  },
  subTitle: {
    fontSize: 12,
    color: grey[600],
  }
})

export const SidebarBoxContainer = ({
  icon,
  title,
  subTitle,
  children,
  noScroll = false,
  expandedByDefault = false,
}) => {
  const classes = useStyles()
  const [expanded, setExpanded] = useState(expandedByDefault)
  const toggleExpanded = useEventCallback(() => setExpanded(!expanded))

  // Create custom header with expand/collapse functionality
  const CustomHeader = () => {
    return (
      <div className={classes.customHeader} onClick={toggleExpanded}>
        {icon && (
          <div className={classes.iconContainer}>
            {typeof icon === 'function' ? React.createElement(icon) : icon}
          </div>
        )}
        <div className={classes.titleContainer}>
          <div className={classes.title}>{title}</div>
          {subTitle && <div className={classes.subTitle}>{subTitle}</div>}
        </div>
        <IconButton className={classes.expandButton} size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </div>
    )
  }

  return (
    <div className={classes.sidebarBoxWrapper}>
      <CustomHeader />
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <div
          className={classnames(classes.expandedContent, noScroll && "noScroll")}
          style={{
            maxHeight: expanded ? "400px" : 0, // Ensure max height is applied
            transition: "max-height 300ms ease-in-out"
          }}
        >
          {children}
        </div>
      </Collapse>
    </div>
  )
}

export default memo(
  SidebarBoxContainer,
  (prev, next) =>
    prev.title === next.title &&
    prev.children === next.children &&
    prev.expandedByDefault === next.expandedByDefault
)
