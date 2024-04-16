// @flow

import { Typography } from "@material-ui/core"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemText from "@material-ui/core/ListItemText"
import { makeStyles } from "@material-ui/core/styles"
import FormatListNumbered from "@material-ui/icons/FormatListNumbered"
import isEqual from "lodash/isEqual"
import React, { memo } from "react"
import SidebarBoxContainer from "../SidebarBoxContainer"
import { useMemo } from "react"

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

export const AnnotationCountSidebarBox = ({ regions }) => {
  const classes = useStyles()

  const counts = useMemo(() => {
    return regions.reduce(
      (acc, region) => {
        if (region.cls && region.type === 'box') {
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

  return (
    <SidebarBoxContainer
      title="Counts"
      icon={<FormatListNumbered style={{ color: "white" }} />}
    >
      <List>
        {counts.length === 0 && (
          <div className={classes.emptyText}>No History Yet</div>
        )}
        {Object.keys(counts).map((name, i) => (
          <ListItem button dense key={i}>
            <ListItemText
              style={listItemTextStyle}
              disableTypography
              primary={
                <Typography variant="body2" style={{ color: "#FFFFFF" }}>
                  {name}
                </Typography>
              }
              secondary={
                <Typography variant="body2" style={{ color: "#FFFFFF" }}>
                Number:  {counts[name]}
                </Typography>
              }
            />
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
