import React, { useMemo } from "react"
import { HotKeys } from "react-hotkeys"

export const defaultHotkeys = [
  {
    id: "select_tool",
    description: "Switch to the Select Tool",
    binding: "escape",
  },
  // {
  //   id: "zoom_tool",
  //   description: "Select the Zoom Tool",
  //   binding: "z",
  // },
  // {
  //   id: "create_point",
  //   description: "Create a point",
  //   binding: "p",
  // },
  {
    id: "create_bounding_box",
    description: "Create a bounding box",
    binding: "b",
  },
  {
    id: "create_line",
    description: "Create a line",
    binding: "l",
  }, {
    id: "create_scale",
    description: "Create a scale",
    binding: "s",
  },
  {
    id: "delete_region",
    description: "Delete selected region",
    binding: "d",
  },
  {
    id: "pan_tool",
    description: "Select the Pan Tool",
  },
  {
    id: "create_pixel",
    description: "Create a Pixel Mask",
  },
  {
    id: "save_and_previous_sample",
    description: "Save and go to previous sample",
    binding: "ArrowLeft",
  },
  {
    id: "save_and_next_sample",
    description: "Save and go to next sample",
    binding: "ArrowRight",
  },
  {
    id: "save_and_exit_sample",
    description: "Save and exit current sample",
  },
  // {
  //   id: "save_sample",
  //   description: "Save current sample",
  //   binding: "Ctrl+s",
  // },
  {
    id: "exit_sample",
    description: "Exit sample without saving",
  },
  {
    id: "undo",
    description: "Undo latest change",
    binding: "ctrl+z"
  },
  {
    id: "hide_region_labels",
    description: "Hide/Show region labels",
    binding: "j"
  },
  {
    id: "hide",
    description: "Hide regions of current image",
    binding: "h"
  },
]

export const defaultKeyMap = {}
for (const { id, binding } of defaultHotkeys) {
  if (id === "undo") {
    defaultKeyMap[id] = ["command+z", "ctrl+z"]
  } else {
    defaultKeyMap[id] = binding
  }
}

export const useDispatchHotkeyHandlers = ({ dispatch, state }) => {
  const handlers = useMemo(
    () => ({
      select_tool: () => {
        dispatch({
          type: "SELECT_TOOL",
          selectedTool: "select",
        })
      },
      zoom_tool: () => {
        dispatch({
          type: "SELECT_TOOL",
          selectedTool: "zoom",
        })
      },
      create_point: () => {
        dispatch({
          type: "SELECT_TOOL",
          selectedTool: "create-point",
        })
      },
      create_bounding_box: () => {
        dispatch({
          type: "SELECT_TOOL",
          selectedTool: "create-box",
        })
      },
      create_line: () => {
        dispatch({
          type: "SELECT_TOOL",
          selectedTool: "create-line",
        })
      },
      create_scale: () => {
        dispatch({
          type: "SELECT_TOOL",
          selectedTool: "create-scale",
        })
      },
      pan_tool: () => {
        dispatch({
          type: "SELECT_TOOL",
          selectedTool: "pan",
        })
      },
      create_polygon: () => {
        dispatch({
          type: "SELECT_TOOL",
          selectedTool: "create-polygon",
        })
      },
      create_pixel: () => {
        dispatch({
          type: "SELECT_TOOL",
          selectedTool: "create-pixel",
        })
      },
      save_and_previous_sample: () => {
        dispatch({
          type: "HEADER_BUTTON_CLICKED",
          buttonName: "Prev",
        })
      },
      save_and_next_sample: () => {
        dispatch({
          type: "HEADER_BUTTON_CLICKED",
          buttonName: "Next",
        })
      },
      save_and_exit_sample: () => {
        dispatch({
          type: "HEADER_BUTTON_CLICKED",
          buttonName: "Save",
        })
      },
      delete_region: () => {
        dispatch({
          type: "DELETE_REGION_KEYPRESS",
        })
      },
      undo: () => {
        if (!state?.history?.length) return

        dispatch({
          type: "RESTORE_HISTORY",
          index: 0
        })
        const lastAction = state?.history?.[0]?.name
        if (lastAction?.toLowerCase().includes('eraser')) {
          dispatch({ type: "SELECT_TOOL", selectedTool: "select" })
        }
      },
      hide: () => {
        dispatch({
          type: "TOGGLE_REGIONS_VISIBILITY"
        })
      },
      hide_region_labels: () => {
        dispatch({
          type: "TOGGLE_REGION_LABELS_VISIBILITY"
        })
      },
      // TODO
      // exit_sample: () => {
      //   dispatch({
      //     type: "",
      //   })
      // }
    }),
    [dispatch, state]
  )
  return handlers
}

export default ({ children, dispatch, state }) => {
  const handlers = useDispatchHotkeyHandlers({ dispatch, state })
  return (
    <HotKeys allowChanges handlers={handlers}>
      {children}
    </HotKeys>
  )
}
