// @flow

import Button from "@material-ui/core/Button"
import { grey } from "@material-ui/core/colors"
import { makeStyles } from "@material-ui/core/styles"
import ClearIcon from '@material-ui/icons/Clear'
import HistoryIcon from '@material-ui/icons/History'
import UndoIcon from '@material-ui/icons/Undo'
import Tooltip from "@material-ui/core/Tooltip"

import moment from "moment"
import React from "react"
import SidebarBoxContainer from "../SidebarBoxContainer"

const useStyles = makeStyles({
  container: {
    padding: 8,
  },
  historyItem: {
    display: "flex",
    alignItems: "center",
    padding: "4px 8px",
    margin: "2px 0",
    borderRadius: 4,
    cursor: "pointer",
    backgroundColor: "#1e1e1e",
    "&:hover": {
      backgroundColor: "#2e2e2e",
    },
  },
  historyItemText: {
    fontSize: 12,
    flexGrow: 1,
    color: 'white',
  },
  historyItemTime: {
    fontSize: 11,
    color: grey[400],
    marginRight: 8,
  },
  undoButton: {
    padding: 4,
    minWidth: 0,
    width: 24,
    height: 24,
    color: '#3CD2BC',
    '&:hover': {
      backgroundColor: 'rgba(60, 210, 188, 0.1)',
    },
  },
  emptyText: {
    fontSize: 14,
    color: grey[400],
    textAlign: "center",
    padding: 20,
  },
})

const HistorySidebarBox = ({ history, onRestoreHistory, dispatch }) => {
  const classes = useStyles()

  const handleUndo = (index, actionName) => {
    onRestoreHistory(index)
    // If undoing an eraser action, switch back to select tool
    if (actionName.toLowerCase().includes('eraser')) {
      dispatch({ type: "SELECT_TOOL", selectedTool: "select" })
    }
  }

  return (
    <SidebarBoxContainer
      title="History"
      icon={<HistoryIcon style={{ color: "white" }} />}
      expandedByDefault
    >
      <div className={classes.container}>
        {history.length === 0 && (
          <div className={classes.emptyText}>No History Yet</div>
        )}
        {history.map(({ name, time }, i) => (
          <div key={i} className={classes.historyItem}>
            <div className={classes.historyItemText}>{name}</div>
            <div className={classes.historyItemTime}>
              {moment(time).fromNow()}
            </div>
            <Tooltip
              title="Undo this action"
              placement="top"
              PopperProps={{
                style: {
                  zIndex: 10000
                }
              }}
              arrow
            >
              <Button
                className={classes.undoButton}
                size="small"
                onClick={() => handleUndo(i, name)}
              >
                <UndoIcon />
              </Button>
            </Tooltip>
          </div>
        ))}
      </div>
    </SidebarBoxContainer>
  )
}

export default HistorySidebarBox
