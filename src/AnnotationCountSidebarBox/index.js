// @flow

import { Typography } from "@material-ui/core"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemText from "@material-ui/core/ListItemText"
import { makeStyles } from "@material-ui/core/styles"
import HistoryIcon from "@material-ui/icons/History"
import isEqual from "lodash/isEqual"
import React, { memo } from "react"
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

export const AnnotationCountSidebarBox = ({ counts }) => {
  const classes = useStyles()

  return (
    <SidebarBoxContainer
      title="Counts"
      icon={<HistoryIcon style={{ color: "white" }} />}
    >
      <List>
        {counts.length === 0 && (
          <div className={classes.emptyText}>No History Yet</div>
        )}
        {counts.map(({ name, count }, i) => (
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
                  {count}
                </Typography>
              }
            />
            {/* {i === 0 && (
              <ListItemSecondaryAction onClick={() => onRestoreHistory()}>
                <IconButton
                  style={{
                    color: "white",
                  }}
                >
                  <UndoIcon />
                </IconButton>
              </ListItemSecondaryAction>
            )} */}
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
