// @flow

import Button from "@material-ui/core/Button"
import { grey } from "@material-ui/core/colors"
import { makeStyles } from "@material-ui/core/styles"
import ClearIcon from '@material-ui/icons/Clear'
import HistoryIcon from '@material-ui/icons/History'
import UndoIcon from '@material-ui/icons/Undo'

import moment from "moment"
import React from "react"
import SidebarBoxContainer from "../SidebarBoxContainer"

const useStyles = makeStyles({
  header: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    fontSize: 12,
    padding: 4,
  },
  historyItem: {
    fontSize: 12,
    padding: "4px 8px",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "#f5f5f5",
    },
  },
  commitMessage: {
    fontSize: 12,
    color: grey[700],
    fontWeight: 400,
  },
  time: {
    fontSize: 11,
    color: grey[500],
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "bold",
    color: grey[500],
    textAlign: "center",
    padding: 20,
  },
  historyItemIcon: {
    marginRight: 8,
    color: 'white',
    fontSize: 16,
    transition: "color 0.2s ease",
    '&:hover': {
      color: 'white',
    },
  },
  historyItemText: {
    fontSize: 12,
    flexGrow: 1,
    color: 'white',
    transition: "color 0.2s ease",
    '&:hover': {
      color: 'white',
    },
  },
  historyItemTime: {
    fontSize: 11,
    color: 'white',
    transition: "color 0.2s ease",
    '&:hover': {
      color: 'white',
    },
  },
  undoButton: {
    marginLeft: 8,
    padding: 4,
    minWidth: 0,
    width: 24,
    height: 24,
    color: 'white',
    '&:hover': {
      color: 'white',
    },
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
      {history.length === 0 && (
        <div className={classes.emptyText}>No History Yet</div>
      )}
      {history.map(({ name, time }, i) => (
        <div key={i} className={classes.historyItem}>
          <div className={classes.historyItemText}>{name}</div>
          <div className={classes.historyItemTime}>
            {moment(time).fromNow()}
          </div>
          <Button
            className={classes.undoButton}
            size="small"
            onClick={() => handleUndo(i, name)}
            title="Undo this action"
          >
            <UndoIcon style={{ color: "white" }} />
          </Button>
        </div>
      ))}
    </SidebarBoxContainer>
  )
}

export default HistorySidebarBox
