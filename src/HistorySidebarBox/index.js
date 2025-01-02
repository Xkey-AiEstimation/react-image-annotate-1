// @flow

import React from "react"
import { makeStyles } from "@material-ui/core/styles"
import SidebarBoxContainer from "../SidebarBoxContainer"
import { grey } from "@material-ui/core/colors"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faHistory,
  faEraser,
  faUndo,
} from "@fortawesome/free-solid-svg-icons"
import moment from "moment"
import { styled } from "@material-ui/core/styles"
import Button from "@material-ui/core/Button"

const useStyles = makeStyles({
  emptyText: {
    fontSize: 14,
    fontWeight: "bold",
    color: grey[500],
    textAlign: "center",
    padding: 20,
  },
  historyItem: {
    display: "flex",
    alignItems: "center",
    padding: 8,
    margin: 2,
    marginTop: 0,
    marginBottom: 4,
    borderRadius: 4,
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      background: "rgba(0, 0, 0, 0.08)",
      "& $historyItemText": {
        color: "#000",
      },
      "& $historyItemIcon": {
        color: "#000",
      },
      "& $historyItemTime": {
        color: "rgba(0, 0, 0, 0.7)",
      },
    },
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
      icon={<FontAwesomeIcon icon={faHistory} />}
      expandedByDefault
    >
      {history.length === 0 && (
        <div className={classes.emptyText}>No History Yet</div>
      )}
      {history.map(({ name, time }, i) => (
        <div key={i} className={classes.historyItem}>
          <div className={classes.historyItemIcon}>
            {name.toLowerCase().includes("eraser") ? (
              <FontAwesomeIcon icon={faEraser} />
            ) : (
              <FontAwesomeIcon icon={faHistory} />
            )}
          </div>
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
            <FontAwesomeIcon icon={faUndo} />
          </Button>
        </div>
      ))}
    </SidebarBoxContainer>
  )
}

export default HistorySidebarBox
