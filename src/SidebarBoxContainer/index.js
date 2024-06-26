// @flow

import { grey } from "@material-ui/core/colors"
import { makeStyles } from "@material-ui/core/styles"
import SidebarBox from "@xkey-aiestimation/react-material-workspace-layout/SidebarBox"
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
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    flexGrow: 1,
    paddingLeft: 8,
    color: grey[800],
    "& span": {
      color: grey[600],
      fontSize: 12,
    },
  },
  expandButton: {
    padding: 0,
    width: 30,
    height: 30,
    "& .icon": {
      marginTop: -6,
      width: 20,
      height: 20,
      transition: "500ms transform",
      "&.expanded": {
        transform: "rotate(180deg)",
      },
    },
  },
  expandedContent: {
    maxHeight: "auto",
    overflowY: "auto",
    "&.noScroll": {
      overflowY: "visible",
      overflow: "visible",
    },
  },
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
  const content = (
    <div
      className={classnames(classes.expandedContent, noScroll && "noScroll")}
    >
      {children}
    </div>
  )

  const [expanded, changeExpanded] = useState(expandedByDefault)
  const toggleExpanded = useEventCallback(() => changeExpanded(!expanded))

  return (
    <SidebarBox icon={icon} title={title}>
      {children}
    </SidebarBox>
  )
}

export default memo(
  SidebarBoxContainer,
  (prev, next) => prev.title === next.title && prev.children === next.children
)
