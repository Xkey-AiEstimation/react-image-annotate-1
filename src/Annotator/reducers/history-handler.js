// @flow

import type { MainLayoutState, Action } from "../../MainLayout/types"
import { setIn, updateIn, asMutable, without } from "seamless-immutable"
import moment from "moment"

const typesToSaveWithHistory = {
  BEGIN_BOX_TRANSFORM: "Transform/Move Box",
  BEGIN_MOVE_POINT: "Move Point",
  DELETE_REGION: "Delete Selected Region",
  DELETE_SELECTED_REGION: "Delete Selected Region",
  DELETE_DEVICES_WITH_DEVICENAME: "Delete Devices: ",
  DELETE_ALL_DEVICES: "Delete All Devices",
}

export const saveToHistory = (state: MainLayoutState, name: string) =>
  updateIn(state, ["history"], (h) =>
    [
      {
        time: moment().toDate(),
        state: without(state, "history"),
        name,
      },
    ].concat((h || []))
  )

export default (reducer) => {
  return (state: MainLayoutState, action: Action) => {
    const prevState = state
    const nextState = reducer(state, action)
    if (action.type === "RESTORE_HISTORY") {
      if (state.history.length > 0) {
        return setIn(
          nextState.history[0].state,
          ["history"],
          nextState.history.slice(1)
        )
      }
    } else {
      if (
        prevState !== nextState &&
        Object.keys(typesToSaveWithHistory).includes(action.type)
      ) {
        let name = typesToSaveWithHistory[action.type] || action.type
        if (
          action.type === "DELETE_DEVICES_WITH_DEVICENAME" &&
          action.deviceName !== undefined &&
          action.deviceName !== ""
        ) {
          name = typesToSaveWithHistory[action.type] + " " + action.deviceName
        } else {
          name = typesToSaveWithHistory[action.type] || action.type
        }

        return setIn(
          nextState,
          ["history"],
          [
            {
              time: moment().toDate(),
              state: without(prevState, "history"),
              name,
            },
          ].concat(nextState.history || [])
          // .slice(0, 9)
        )
      }
    }

    return nextState
  }
}
